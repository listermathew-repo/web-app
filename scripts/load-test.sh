#!/bin/bash

# LOAD TEST - Sustained traffic for 2 minutes
# Monitors: success rate, response time, error patterns

set -e

API_KEY="${WEBHOOK_API_KEY}"
BASE_URL="${1:-http://localhost:3000}"
DURATION_SECONDS=120
REQUESTS_PER_SECOND=5

if [ -z "$API_KEY" ]; then
  echo "❌ ERROR: WEBHOOK_API_KEY not set"
  exit 1
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  LOAD TEST: ${DURATION_SECONDS}s @ ${REQUESTS_PER_SECOND} req/sec                    ║"
echo "║  Expected: ~$((DURATION_SECONDS * REQUESTS_PER_SECOND)) total requests                    ║"
echo "║  Target: $BASE_URL/api/alerts                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Create test payloads with variation
PAYLOADS=(
  '{"symbol":"EURUSD","direction":"long","entry_level":1.16350,"stop_level":1.16170,"retap_level":1.16710,"ema10":1.16324,"ema21":1.16210,"vwap":1.16300,"rsi":52.5,"atr":0.005}'
  '{"symbol":"XAUUSD","direction":"short","entry_level":4570.895,"stop_level":4590.0,"retap_level":4550.0,"ema10":4568,"ema21":4570,"vwap":4569,"rsi":48,"atr":10}'
  '{"symbol":"BTCUSD","direction":"long","entry_level":78103,"stop_level":77155,"retap_level":78500,"ema10":78100,"ema21":78000,"vwap":78050,"rsi":55,"atr":200}'
)

# Metrics
declare -A METRICS
METRICS[success]=0
METRICS[rate_limit]=0
METRICS[errors]=0
METRICS[total]=0
METRICS[response_times]=()
START_TIME=$(date +%s)

send_request() {
  local payload="${PAYLOADS[$((RANDOM % ${#PAYLOADS[@]}))]}"
  local response=$(curl -s -w "\n%{http_code}\n%{time_total}" -X POST "$BASE_URL/api/alerts" \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload")
  
  local http_code=$(echo "$response" | tail -n 2 | head -n 1)
  local response_time=$(echo "$response" | tail -n 1)
  
  METRICS[response_times]+=" $response_time"
  ((METRICS[total]++))
  
  if [ "$http_code" -eq 202 ]; then
    ((METRICS[success]++))
  elif [ "$http_code" -eq 429 ]; then
    ((METRICS[rate_limit]++))
  else
    ((METRICS[errors]++))
    echo "ERROR: HTTP $http_code"
  fi
}

# Main load test loop
echo "Starting load test..."
CURRENT_SECOND=0

while [ $(($(date +%s) - START_TIME)) -lt $DURATION_SECONDS ]; do
  CURRENT_SECOND=$(($(date +%s) - START_TIME))
  
  # Send REQUESTS_PER_SECOND requests
  for ((i = 0; i < REQUESTS_PER_SECOND; i++)); do
    send_request &
  done
  
  wait
  
  # Progress update every 10 seconds
  if [ $((CURRENT_SECOND % 10)) -eq 0 ] && [ $CURRENT_SECOND -gt 0 ]; then
    local percent=$((CURRENT_SECOND * 100 / DURATION_SECONDS))
    printf "[%3d%%] %d requests | Success: %d, RateLimit: %d, Errors: %d\n" \
      "$percent" "${METRICS[total]}" "${METRICS[success]}" "${METRICS[rate_limit]}" "${METRICS[errors]}"
  fi
  
  sleep 1
done

# Final request batch
for ((i = 0; i < REQUESTS_PER_SECOND; i++)); do
  send_request &
done
wait

# Calculate stats
SUCCESS_RATE=$((METRICS[success] * 100 / METRICS[total]))
AVG_RESPONSE_TIME=0
if [ ${#METRICS[response_times][@]} -gt 0 ]; then
  AVG_RESPONSE_TIME=$(echo "${METRICS[response_times][@]}" | tr ' ' '\n' | awk '{sum+=$1; count++} END {printf "%.3f", sum/count}')
fi

# Results
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    LOAD TEST RESULTS                       ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Total Requests: ${METRICS[total]}"
echo "║ Success (202): ${METRICS[success]} ($SUCCESS_RATE%)"
echo "║ Rate Limited (429): ${METRICS[rate_limit]}"
echo "║ Errors: ${METRICS[errors]}"
echo "║ Avg Response: ${AVG_RESPONSE_TIME}s"
echo "║ Requests/sec: $(echo "scale=2; ${METRICS[total]} / $DURATION_SECONDS" | bc)"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ "$SUCCESS_RATE" -lt 80 ]; then
  echo "❌ LOAD TEST FAILED: Success rate below 80%"
  exit 1
fi

echo "✅ LOAD TEST PASSED"
