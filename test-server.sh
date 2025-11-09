#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Resume Builder API${NC}\n"

# Base URL
BASE_URL="http://localhost:3001"

# Test 1: Health Check
echo -e "${BLUE}1. Testing health endpoint...${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$status_code" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "$body" | jq '.'
else
    echo -e "${RED}❌ Health check failed (Status: $status_code)${NC}"
fi

echo ""

# Test 2: 404 Handler
echo -e "${BLUE}2. Testing 404 handler...${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/nonexistent")
status_code=$(echo "$response" | tail -n1)

if [ "$status_code" = "404" ]; then
    echo -e "${GREEN}✅ 404 handler working${NC}"
else
    echo -e "${RED}❌ 404 handler failed (Status: $status_code)${NC}"
fi

echo ""

# Test 3: Auth endpoint (should fail without credentials)
echo -e "${BLUE}3. Testing auth endpoint...${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}')
status_code=$(echo "$response" | tail -n1)

if [ "$status_code" = "400" ] || [ "$status_code" = "401" ]; then
    echo -e "${GREEN}✅ Auth endpoint responding${NC}"
else
    echo -e "${RED}❌ Auth endpoint issue (Status: $status_code)${NC}"
fi

echo ""
echo -e "${BLUE}✨ Test complete!${NC}"
echo -e "${BLUE}💡 Check your terminal running 'npm run dev' to see the pretty logs${NC}"
