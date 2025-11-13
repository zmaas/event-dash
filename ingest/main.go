package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "time"

    "github.com/google/uuid"
    "github.com/jackc/pgx/v5/pgxpool"
)

type Event struct {
    ID         uuid.UUID              `json:"id"`
    EventType  string                 `json:"event_type"`
    Severity   string                 `json:"severity"`
    UserID     *string                `json:"user_id"`
    IPAddress  string                 `json:"ip_address"`
    UserAgent  *string                `json:"user_agent"`
    Endpoint   *string                `json:"endpoint"`
    HTTPMethod *string                `json:"http_method"`
    StatusCode *int                   `json:"status_code"`
    Metadata   map[string]interface{} `json:"metadata"`
    OccurredAt time.Time              `json:"occurred_at"`
}

var db *pgxpool.Pool

func main() {
    ctx := context.Background()

    // Simple pool config
    config, err := pgxpool.ParseConfig(getEnv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/event-dash"))
    if err != nil {
        log.Fatal(err)
    }
    
    config.MaxConns = 5
    config.MinConns = 1

    db, err = pgxpool.NewWithConfig(ctx, config)
    if err != nil {
        log.Fatal("DB connection failed:", err)
    }
    defer db.Close()

    log.Println("Connected to database")

    http.HandleFunc("/ingest", handleIngest)
    http.HandleFunc("/health", handleHealth)

    port := getEnv("PORT", "8080")
    log.Printf("Starting server on :%s", port)
    log.Fatal(http.ListenAndServe(":"+port, nil))
}

func handleIngest(w http.ResponseWriter, r *http.Request) {
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
    if event.EventType == "" || event.Severity == "" || event.IPAddress == "" {
        http.Error(w, "Missing required fields", http.StatusBadRequest)
        return
    }

    // Set defaults
    if event.ID == uuid.Nil {
        event.ID = uuid.New()
    }
    now := time.Now()
    if event.OccurredAt.IsZero() {
        event.OccurredAt = now
    }

    // Insert directly - no batching, no buffering
	// Debugging parallel insert error, very mysterious?
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    metadataJSON, _ := json.Marshal(event.Metadata)

    query := `
        INSERT INTO "pg-drizzle_events" (
            id, event_type, severity, user_id, ip_address, user_agent,
            endpoint, http_method, status_code, metadata,
            occurred_at, ingested_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `

    _, err := db.Exec(ctx, query,
        event.ID,
        event.EventType,
        event.Severity,
        event.UserID,
        event.IPAddress,
        event.UserAgent,
        event.Endpoint,
        event.HTTPMethod,
        event.StatusCode,
        string(metadataJSON),
        event.OccurredAt,
        now, // ingested_at
        now, // created_at
    )

    if err != nil {
        log.Printf("Insert failed: %v", err)
        http.Error(w, "Database error", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
    fmt.Fprint(w, "Event ingested")
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
    // Simple health check - no DB ping
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}