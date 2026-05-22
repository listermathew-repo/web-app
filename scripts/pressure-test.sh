#!/bin/bash

# PRESSURE TEST - High velocity webhook requests
# Tests system under stress: 100 requests in 10 seconds

set -e

API_KEY="${WEBHOOK_API_KEY}"
BASE_URL="${1:-http://localhost:3000}"
CONCURRENT_REQUESTS=20
TOTAL_REQUESTS=100

if [ -z "$API_KEY" ]; then
  echo "❌ ERROR: WEBHOOK_API_KEY not set"
  echo "Set: export WEBHOOK_API_KEY=your-key"
  exit 1
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  PRESSURE TEST: $TOTAL_REQUESTS requests in 10 seconds      ║"
echo "║  Concurrent: $CONCURRENT_REQUESTS requests per batch        ║"
echo "║  Target: $BASE_URL/api/alerts                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Create test payload
PAYLOAD=$(cat <<'PAYLOAD_EOF'
{
  "symbol": "EURUSD",
  "direction": "long",
  "entry_level": 1.16350,
  "stop_level": 1.16170,
  "retap_level": 1.16710,
  "ema10": 1.16324,
  "ema21": 1.16210,
  "vwap": 1.16300,
  "rsi": 52.5,
  "atr": 0.005,
  "volume": 1000,
  "volume_avg": 800
}
PAYLOAD_EOF
)

# Statistics
TOTAL_REQUESTS_SENT=0
SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0
ERROR_COUNT=0
START_TIME=$(date +%s%N)

# Progress function
progress() {
  local current=$1
  local total=$2
  local percent=$((current * 100 / total))
  local filled=$((percent / 2))
  printf "\r[%-50s] %3d%% (%d/%d requests)" "$(printf '#%.0s' $(seq 1 $filled))" "$percent" "$current" "$total"
}

echo "Sending $TOTAL_REQUESTS requests..."
echo ""

# Send requests in parallel batches
for ((i = 1; i <= TOTAL_REQUESTS; i++)); do
  {
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/alerts" \
      -H "X-API-Key: $API_KEY" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" -eq 202 ]; then
      ((SUCCESS_COUNT++))
    elif [ "$HTTP_CODE" -eq 429 ]; then
      ((RATE_LIMITED_COUNT++))
    else
      ((ERROR_COUNT++))
    fi
    
    ((TOTAL_REQUESTS_SENT++))
  } &
  
  # Limit concurrent requests
  if [ $((i % CONCURRENT_REQUESTS)) -eq 0 ]; then
    wait
    progress "$i" "$TOTAL_REQUESTS"
  fi
done

# Wait for remaining background jobs
wait
progress "$TOTAL_REQUESTS" "$TOTAL_REQUESTS"

END_TIME=$(date +%s%N)
DURATION_MS=$(( (END_TIME - START_TIME) / 1000000 ))
REQUEST_RATE=$(echo "scale=2; $TOTAL_REQUESTS * 1000 / $DURATION_MS" | bc)

echo ""
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    RESULTS                                 ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Duration: ${DURATION_MS}ms"
echo "║ Success (202): $SUCCESS_COUNT / $TOTAL_REQUESTS"
echo "║ Rate Limited (429): $RATE_LIMITED_COUNT / $TOTAL_REQUESTS"
echo "║ Errors: $ERROR_COUNT / $TOTAL_REQUESTS"
echo "║ Request Rate: ${REQUEST_RATE} req/sec"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ "$RATE_LIMITED_COUNT" -gt 0 ]; then
  echo "✅ RATE LIMITING WORKING: System rejected $RATE_LIMITED_COUNT requests"
fi

if [ "$SUCCESS_COUNT" -lt $((TOTAL_REQUESTS * 8 / 10)) ]; then
  echo "⚠️  WARNING: Less than 80% success rate"
  exit 1
fi

echo "✅ PRESSURE TEST PASSED"
