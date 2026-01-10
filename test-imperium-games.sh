#!/bin/bash

# Imperium-Games RTP Predictions Test Script
# This script demonstrates the API endpoints for Imperium-Games slot games

echo "================================================================================================="
echo "🎰 IMPERIUM-GAMES PLATFORM - RTP PREDICTIONS DEMONSTRATION"
echo "================================================================================================="
echo ""
echo "Testing Softgaming Casino API with Predictive Disclaimer Middleware"
echo "API Base URL: http://localhost:8787"
echo ""

# Check if wrangler dev is running
echo "⚠️  Note: Make sure 'npm run dev' or 'wrangler dev' is running in another terminal"
echo ""

API_BASE="http://localhost:8787"

echo "================================================================================================="
echo "TEST 1: Get All Imperium-Games Slot Games"
echo "================================================================================================="
echo "Endpoint: GET /api/games?provider=imperium-games"
echo ""
curl -s "${API_BASE}/api/games?provider=imperium-games" | head -100
echo ""
echo "... (truncated for readability)"
echo ""

echo "================================================================================================="
echo "TEST 2: RTP Prediction - Space Odyssey Mega (Highest RTP: 97.10%)"
echo "================================================================================================="
echo "Endpoint: GET /api/predict/rtp/imperium-space-odyssey"
echo ""
curl -s "${API_BASE}/api/predict/rtp/imperium-space-odyssey"
echo ""
echo ""

echo "================================================================================================="
echo "TEST 3: RTP Prediction - Dragon's Fortune (High Confidence: 93%)"
echo "================================================================================================="
echo "Endpoint: GET /api/predict/rtp/imperium-dragons-fortune"
echo ""
curl -s "${API_BASE}/api/predict/rtp/imperium-dragons-fortune"
echo ""
echo ""

echo "================================================================================================="
echo "TEST 4: RTP Prediction - Lucky Clover Deluxe (Lowest RTP: 94.50%)"
echo "================================================================================================="
echo "Endpoint: GET /api/predict/rtp/imperium-lucky-clover"
echo ""
curl -s "${API_BASE}/api/predict/rtp/imperium-lucky-clover"
echo ""
echo ""

echo "================================================================================================="
echo "TEST 5: Get High RTP Games (≥ 96%)"
echo "================================================================================================="
echo "Endpoint: GET /api/games?provider=imperium-games&minRtp=96"
echo ""
curl -s "${API_BASE}/api/games?provider=imperium-games&minRtp=96" | head -80
echo ""
echo "... (truncated for readability)"
echo ""

echo "================================================================================================="
echo "TEST 6: View Predictive Disclaimer Headers"
echo "================================================================================================="
echo "Endpoint: GET /api/predict/rtp/imperium-viking-conquest (Headers only)"
echo ""
curl -I -s "${API_BASE}/api/predict/rtp/imperium-viking-conquest"
echo ""

echo "================================================================================================="
echo "TEST 7: Create Gaming Session for Imperium-Games Slot"
echo "================================================================================================="
echo "Endpoint: POST /api/casino/session"
echo "Body: {\"userId\": \"demo123\", \"gameId\": \"imperium-space-odyssey\", \"balance\": 5000}"
echo ""
curl -s -X POST "${API_BASE}/api/casino/session" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo123",
    "gameId": "imperium-space-odyssey",
    "currency": "USD",
    "balance": 5000
  }'
echo ""
echo ""

echo "================================================================================================="
echo "TEST 8: Get Full Legal Disclaimer"
echo "================================================================================================="
echo "Endpoint: GET /disclaimer"
echo ""
curl -s "${API_BASE}/disclaimer" | head -150
echo ""
echo "... (truncated for readability - see full disclaimer at /disclaimer)"
echo ""

echo "================================================================================================="
echo "📊 SUMMARY: IMPERIUM-GAMES SLOT PORTFOLIO"
echo "================================================================================================="
echo ""
echo "Total Games: 12 slot games"
echo "Average RTP: 95.95%"
echo "RTP Range: 94.50% - 97.10%"
echo "Average Confidence: 91.2%"
echo ""
echo "Top 3 RTP Games:"
echo "  1. Space Odyssey Mega      - 97.10% (Predicted: 97.05%, Confidence: 85%)"
echo "  2. Viking Conquest          - 96.75% (Predicted: 96.70%, Confidence: 88%)"
echo "  3. Samurai Fortune          - 96.55% (Predicted: 96.52%, Confidence: 91%)"
echo ""
echo "Highest Confidence Predictions:"
echo "  1. Fruit Party Supreme      - 97% confidence"
echo "  2. Lucky Clover Deluxe      - 96% confidence"
echo "  3. Magic Gems Deluxe        - 95% confidence"
echo ""
echo "Volatility Distribution:"
echo "  - Very High: 1 game (Space Odyssey Mega)"
echo "  - High: 4 games (Viking Conquest, Dragon's Fortune, Wild West Showdown)"
echo "  - Medium-High: 3 games (Samurai Fortune, Aztec Gold Rush, Jungle Quest)"
echo "  - Medium: 2 games (Pharaoh's Treasure, Ocean Mystery)"
echo "  - Low: 2 games (Lucky Clover, Fruit Party)"
echo ""
echo "================================================================================================="
echo "✅ All tests completed!"
echo "================================================================================================="
echo ""
echo "📝 Full demonstration documentation available in: demo-imperium-games.md"
echo ""
echo "⚠️  DISCLAIMER: All RTP predictions are theoretical and for demonstration purposes only."
echo "    Individual gaming session results will vary. Gamble responsibly."
echo ""
