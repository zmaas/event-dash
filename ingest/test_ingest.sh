#!/bin/bash

# Test script for the ingestion service

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:8080/health | jq .

# Test ingestion endpoint with sample data
echo -e "\nTesting ingestion endpoint..."
curl -X POST http://localhost:8080/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "api_call",
    "severity": "low",
    "ip_address": "192.168.1.1",
    "user_id": "user123",
    "endpoint": "/api/test",
    "http_method": "GET",
    "status_code": 200,
    "metadata": {
      "user_agent": "test-agent",
      "response_time": 150
    }
  }'

echo -e "\nEvent queued for ingestion"

# Wait a bit for processing
sleep 2

# Check health again to see buffer status
echo -e "\nChecking health after ingestion..."
curl -s http://localhost:8080/health | jq .
