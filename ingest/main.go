package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type EventType string

const (
	AuthAttempt  EventType = "auth_attempt"
	APICall      EventType = "api_call"
	AdminAction  EventType = "admin_action"
	DataAccess   EventType = "data_access"
	ConfigChange EventType = "config_change"
)

type Severity string

const (
	Low      Severity = "low"
	Medium   Severity = "medium"
	High     Severity = "high"
	Critical Severity = "critical"
)

type Event struct {
	ID          uuid.UUID              `json:"id,omitempty"`
	EventType   EventType              `json:"event_type" validate:"required"`
	Severity    Severity               `json:"severity" validate:"required"`
	UserID      *string                `json:"user_id,omitempty"`
	IPAddress   string                 `json:"ip_address" validate:"required"`
	UserAgent   *string                `json:"user_agent,omitempty"`
	Endpoint    *string                `json:"endpoint,omitempty"`
	HTTPMethod  *string                `json:"http_method,omitempty"`
	StatusCode  *int                   `json:"status_code,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	OccurredAt  time.Time              `json:"occurred_at,omitempty"`
	IngestedAt  time.Time              `json:"ingested_at,omitempty"`
	CreatedAt   time.Time              `json:"created_at,omitempty"`
}

type Config struct {
	DatabaseURL    string
	Port           string
	BufferSize     int
	FlushInterval  time.Duration
	BatchSize      int
}

func loadConfig() Config {
	config := Config{
		DatabaseURL:   getEnv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/event-dash"),
		Port:          getEnv("PORT", "8080"),
		BufferSize:    getEnvAsInt("BUFFER_SIZE", 1000),
		FlushInterval: getEnvAsDuration("FLUSH_INTERVAL", 5*time.Second),
		BatchSize:     getEnvAsInt("BATCH_SIZE", 100),
	}
	return config
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

type IngestionService struct {
	db         *pgxpool.Pool
	buffer     chan Event
	config     Config
}

func NewIngestionService(config Config) (*IngestionService, error) {
	ctx := context.Background()
	db, err := pgxpool.New(ctx, config.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Test connection
	if err := db.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	service := &IngestionService{
		db:     db,
		buffer: make(chan Event, config.BufferSize),
		config: config,
	}

	// Start worker goroutine
	go service.worker(ctx)

	return service, nil
}

func (s *IngestionService) worker(ctx context.Context) {
	ticker := time.NewTicker(s.config.FlushInterval)
	defer ticker.Stop()

	buffer := make([]Event, 0, s.config.BatchSize)

	flush := func() {
		if len(buffer) == 0 {
			return
		}

		if err := s.batchInsert(ctx, buffer); err != nil {
			log.Printf("Failed to insert batch: %v", err)
			// In a production system, you might want to implement retry logic here
		} else {
			log.Printf("Inserted %d events", len(buffer))
		}
		buffer = buffer[:0] // Clear buffer
	}

	for {
		select {
		case event := <-s.buffer:
			buffer = append(buffer, event)
			if len(buffer) >= s.config.BatchSize {
				flush()
			}
		case <-ticker.C:
			flush()
		case <-ctx.Done():
			flush() // Final flush before shutdown
			return
		}
	}
}

func (s *IngestionService) batchInsert(ctx context.Context, events []Event) error {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Prepare batch insert
	query := `
		INSERT INTO pg-drizzle_events (
			id, event_type, severity, user_id, ip_address, user_agent,
			endpoint, http_method, status_code, metadata,
			occurred_at, ingested_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`

	batch := &pgx.Batch{}
	for _, event := range events {
		// Set timestamps if not provided
		now := time.Now()
		if event.OccurredAt.IsZero() {
			event.OccurredAt = now
		}
		if event.IngestedAt.IsZero() {
			event.IngestedAt = now
		}
		if event.CreatedAt.IsZero() {
			event.CreatedAt = now
		}

		// Generate UUID if not provided
		if event.ID == uuid.Nil {
			event.ID = uuid.New()
		}

		metadataJSON, _ := json.Marshal(event.Metadata)

		batch.Queue(query,
			event.ID,
			event.EventType,
			event.Severity,
			event.UserID,
			event.IPAddress,
			event.UserAgent,
			event.Endpoint,
			event.HTTPMethod,
			event.StatusCode,
			metadataJSON,
			event.OccurredAt,
			event.IngestedAt,
			event.CreatedAt,
		)
	}

	br := tx.SendBatch(ctx, batch)
	defer br.Close()

	for i := 0; i < len(events); i++ {
		_, err := br.Exec()
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (s *IngestionService) handleIngest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var event Event
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Basic validation
	if event.EventType == "" {
		http.Error(w, "event_type is required", http.StatusBadRequest)
		return
	}
	if event.Severity == "" {
		http.Error(w, "severity is required", http.StatusBadRequest)
		return
	}
	if event.IPAddress == "" {
		http.Error(w, "ip_address is required", http.StatusBadRequest)
		return
	}

	// Validate IP address
	if net.ParseIP(event.IPAddress) == nil {
		http.Error(w, "invalid ip_address", http.StatusBadRequest)
		return
	}

	// Try to send to buffer, but don't block
	select {
	case s.buffer <- event:
		w.WriteHeader(http.StatusAccepted)
		fmt.Fprint(w, "Event queued for ingestion")
	default:
		http.Error(w, "Buffer full, try again later", http.StatusServiceUnavailable)
	}
}

func (s *IngestionService) handleHealth(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := s.db.Ping(ctx); err != nil {
		http.Error(w, "Database unhealthy", http.StatusServiceUnavailable)
		return
	}

	bufferUsage := float64(len(s.buffer)) / float64(cap(s.buffer)) * 100

	response := map[string]interface{}{
		"status":       "healthy",
		"buffer_usage": fmt.Sprintf("%.1f%%", bufferUsage),
		"buffer_size":  len(s.buffer),
		"buffer_cap":   cap(s.buffer),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *IngestionService) Close() {
	s.db.Close()
}

func main() {
	config := loadConfig()

	log.Printf("Starting ingestion service on port %s", config.Port)
	log.Printf("Buffer size: %d, Batch size: %d, Flush interval: %v",
		config.BufferSize, config.BatchSize, config.FlushInterval)

	service, err := NewIngestionService(config)
	if err != nil {
		log.Fatal("Failed to create ingestion service:", err)
	}
	defer service.Close()

	http.HandleFunc("/ingest", service.handleIngest)
	http.HandleFunc("/health", service.handleHealth)

	log.Printf("Server starting on :%s", config.Port)
	if err := http.ListenAndServe(":"+config.Port, nil); err != nil {
		log.Fatal("Server failed:", err)
	}
}
