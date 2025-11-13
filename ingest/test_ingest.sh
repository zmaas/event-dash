#!/bin/bash

# Test script for the ingestion service

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:8080/health | jq .

# Test ingestion endpoint with 100 sample events
echo -e "\nTesting ingestion endpoint with 100 events..."

# Generate events with timestamps spanning the last 7 days
for i in {1..100}; do
  # Calculate timestamp: current time minus (100 - i) minutes to spread events over time
  minutes_ago=$((100 - i))
  # Generate timestamp using date command
  timestamp=$(date -u -v-${minutes_ago}M +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Vary some fields for diversity
  severity_options=("low" "medium" "high" "critical")
  severity=${severity_options[$((RANDOM % 4))]}
  status_codes=(200 201 400 401 403 404 500)
  status_code=${status_codes[$((RANDOM % 7))]}
  user_id="user$((RANDOM % 1000 + 1))"
  ip_address="192.168.$((RANDOM % 255 + 1)).$((RANDOM % 255 + 1))"

  curl -X POST http://localhost:8080/ingest \
    -H "Content-Type: application/json" \
    -d "{
      \"event_type\": \"api_call\",
      \"severity\": \"$severity\",
      \"ip_address\": \"$ip_address\",
      \"user_id\": \"$user_id\",
      \"endpoint\": \"/api/test/$i\",
      \"http_method\": \"GET\",
      \"status_code\": $status_code,
      \"occurred_at\": \"$timestamp\",
      \"metadata\": {
        \"user_agent\": \"test-agent-$i\",
        \"response_time\": $((RANDOM % 1000 + 50))
      }
    }" \
    -s > /dev/null

  if [ $((i % 10)) -eq 0 ]; then
    echo "Sent $i events..."
  fi
done

echo -e "\nAll 100 events queued for ingestion"

# Wait a bit for processing
sleep 5

# Check health again to see buffer status
echo -e "\nChecking health after ingestion..."
curl -s http://localhost:8080/health | jq .
