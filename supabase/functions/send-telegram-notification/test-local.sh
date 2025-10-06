#!/bin/bash

# ============================================
# Local Testing Script for Notification Queue
# ============================================

echo "🧪 Starting local tests for Notification Queue System v2.0"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:54321/functions/v1/send-telegram-notification"
ANON_KEY="YOUR_ANON_KEY" # Replace with your anon key

# Function to make request
make_request() {
  local test_name=$1
  local data=$2
  
  echo -e "${YELLOW}📤 Test: $test_name${NC}"
  echo "Request: $data"
  
  response=$(curl -s -w "\n%{http_code}" --location --request POST "$BASE_URL" \
    --header "Authorization: Bearer $ANON_KEY" \
    --header "Content-Type: application/json" \
    --data "$data")
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Success (HTTP $http_code)${NC}"
    echo "Response: $body"
  else
    echo -e "${RED}❌ Failed (HTTP $http_code)${NC}"
    echo "Response: $body"
  fi
  
  echo ""
}

# Check if function is running
echo "🔍 Checking if Edge Function is running..."
if ! curl -s "http://localhost:54321/functions/v1/send-telegram-notification" > /dev/null 2>&1; then
  echo -e "${RED}❌ Edge Function not running!${NC}"
  echo "Please start it with:"
  echo "  supabase functions serve send-telegram-notification"
  exit 1
fi
echo -e "${GREEN}✅ Edge Function is running${NC}"
echo ""

# Test 1: Product notification - status_change (low priority)
make_request "Product Status Change" \
  '{"productId": "test-product-uuid", "notificationType": "status_change"}'

sleep 2

# Test 2: Product notification - repost (normal priority)
make_request "Product Repost" \
  '{"productId": "test-product-uuid", "notificationType": "repost"}'

sleep 2

# Test 3: Product notification - sold (high priority)
make_request "Product Sold" \
  '{"productId": "test-product-uuid", "notificationType": "sold"}'

sleep 2

# Test 4: Order notification (high priority)
make_request "Order Create" \
  '{"order": {"id": "test-order-uuid"}, "action": "create"}'

sleep 2

# Test 5: Invalid request
make_request "Invalid Request (should fail)" \
  '{"invalid": "data"}'

echo ""
echo "🎯 Testing complete!"
echo ""
echo "📊 Check results:"
echo "  1. Edge Function logs: supabase functions logs send-telegram-notification"
echo "  2. Database queue:"
echo "     psql> SELECT * FROM notification_queue ORDER BY created_at DESC LIMIT 10;"
echo "  3. Queue metrics:"
echo "     psql> SELECT * FROM get_queue_metrics();"
echo ""
