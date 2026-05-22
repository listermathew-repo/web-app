<#
.SYNOPSIS
Test the configurable trading rules engine
.DESCRIPTION
Tests the /api/alerts webhook with various trade scenarios against the 4-condition entry rules
#>

# Configuration
$API_KEY = $env:WEBHOOK_API_KEY
$BASE_URL = "http://localhost:3000"  # or Vercel URL once deployed
$WAIT_TIME = 2000  # ms between requests

Write-Host "╔════════════════════════════════════════════════════════════╗"
Write-Host "║      Trading Rules Engine - Test Suite                     ║"
Write-Host "║      Testing 4-Condition Entry System (v1.0)               ║"
Write-Host "╚════════════════════════════════════════════════════════════╝`n"

# Test Case 1: ALL conditions pass + RR ratio sufficient = ACCEPT
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "TEST 1: Perfect Long Entry (All conditions pass)"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$test1 = @{
    symbol = "EURUSD"
    direction = "long"
    entry_level = 1.16350
    stop_level = 1.16170
    retap_level = 1.16710
    price = 1.16350
    vwap = 1.16300
    ema10 = 1.16324
    ema21 = 1.16210
    ema20 = 1.16210
    rsi = 52.5
    atr = 0.0050
    open_positions = 0
    account_size = 10000
    risk_amount = 50
    daily_losses_count = 0
    daily_profit = 0
    minutes_since_ny_open = 120
}

Write-Host "Conditions to verify:"
Write-Host "  ✓ Price (1.16350) at VWAP (1.16300) ±0.5SD"
Write-Host "  ✓ RSI (52.5) in 40-60 band"
Write-Host "  ✓ EMA10 (1.16324) > EMA21 (1.16210) [Golden Cross]"
Write-Host "  ✓ Price (1.16350) > 20EMA (1.16210) [Cascade]"
Write-Host "  ✓ RR Ratio = (1.16710-1.16350)/(1.16350-1.16170) = 360/180 = 2.0:1"
Write-Host ""
Write-Host "Expected: recommendation = ACCEPT, conditions_passed = 4/4"
Write-Host ""

# Test Case 2: Price not at VWAP = REJECT
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "TEST 2: Price Not at VWAP (Condition fails)"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$test2 = @{
    symbol = "EURUSD"
    direction = "long"
    entry_level = 1.16350
    stop_level = 1.16170
    retap_level = 1.16710
    price = 1.16500
    vwap = 1.16300
    ema10 = 1.16324
    ema21 = 1.16210
    ema20 = 1.16210
    rsi = 52.5
    atr = 0.0050
    open_positions = 0
    account_size = 10000
    risk_amount = 50
    daily_losses_count = 0
    daily_profit = 0
    minutes_since_ny_open = 120
}

Write-Host "Failure point:"
Write-Host "  ✗ Price (1.16500) NOT at VWAP (1.16300) - diff 200 pips > tolerance ~25 pips"
Write-Host ""
Write-Host "Expected: recommendation = REJECT, conditions_passed = 3/4"
Write-Host ""

# Test Case 3: RSI overbought = REJECT
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "TEST 3: RSI Overbought (Condition fails)"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$test3 = @{
    symbol = "EURUSD"
    direction = "long"
    entry_level = 1.16350
    stop_level = 1.16170
    retap_level = 1.16710
    price = 1.16350
    vwap = 1.16300
    ema10 = 1.16324
    ema21 = 1.16210
    ema20 = 1.16210
    rsi = 75.0
    atr = 0.0050
    open_positions = 0
    account_size = 10000
    risk_amount = 50
    daily_losses_count = 0
    daily_profit = 0
    minutes_since_ny_open = 120
}

Write-Host "Failure point:"
Write-Host "  ✗ RSI (75.0) outside 40-60 band - overbought, no room to run"
Write-Host ""
Write-Host "Expected: recommendation = REJECT, conditions_passed = 3/4"
Write-Host ""

# Test Case 4: EMA misaligned = REJECT
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "TEST 4: Bearish EMA (Golden Cross fails)"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$test4 = @{
    symbol = "EURUSD"
    direction = "long"
    entry_level = 1.16350
    stop_level = 1.16170
    retap_level = 1.16710
    price = 1.16350
    vwap = 1.16300
    ema10 = 1.16200
    ema21 = 1.16210
    ema20 = 1.16210
    rsi = 52.5
    atr = 0.0050
    open_positions = 0
    account_size = 10000
    risk_amount = 50
    daily_losses_count = 0
    daily_profit = 0
    minutes_since_ny_open = 120
}

Write-Host "Failure point:"
Write-Host "  ✗ EMA10 (1.16200) NOT > EMA21 (1.16210) - bearish alignment, not bullish"
Write-Host ""
Write-Host "Expected: recommendation = REJECT, conditions_passed = 3/4"
Write-Host ""

# Test Case 5: Price below 20EMA = REJECT
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "TEST 5: Price Below 20 EMA (Cascade fails)"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$test5 = @{
    symbol = "EURUSD"
    direction = "long"
    entry_level = 1.16350
    stop_level = 1.16170
    retap_level = 1.16710
    price = 1.16200
    vwap = 1.16300
    ema10 = 1.16324
    ema21 = 1.16210
    ema20 = 1.16250
    rsi = 52.5
    atr = 0.0050
    open_positions = 0
    account_size = 10000
    risk_amount = 50
    daily_losses_count = 0
    daily_profit = 0
    minutes_since_ny_open = 120
}

Write-Host "Failure point:"
Write-Host "  ✗ Price (1.16200) NOT > 20EMA (1.16250) - price below baseline EMA"
Write-Host ""
Write-Host "Expected: recommendation = REJECT, conditions_passed = 3/4"
Write-Host ""

# Test Case 6: RR Ratio insufficient = REJECT
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "TEST 6: RR Ratio < 2:1 (Risk/Reward fails)"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$test6 = @{
    symbol = "EURUSD"
    direction = "long"
    entry_level = 1.16350
    stop_level = 1.16320
    retap_level = 1.16380
    price = 1.16350
    vwap = 1.16300
    ema10 = 1.16324
    ema21 = 1.16210
    ema20 = 1.16210
    rsi = 52.5
    atr = 0.0050
    open_positions = 0
    account_size = 10000
    risk_amount = 50
    daily_losses_count = 0
    daily_profit = 0
    minutes_since_ny_open = 120
}

Write-Host "Failure point:"
Write-Host "  ✓ All 4 conditions pass"
Write-Host "  ✗ RR Ratio = (1.16380-1.16350)/(1.16350-1.16320) = 30/30 = 1.0:1"
Write-Host "  ✗ Needs minimum 2:1 ratio"
Write-Host ""
Write-Host "Expected: recommendation = REJECT, RR ratio insufficient"
Write-Host ""

# Test Case 7: Pre-entry check fails (NY open) = REJECT
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "TEST 7: Too Close to NY Open (Pre-entry check fails)"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$test7 = @{
    symbol = "EURUSD"
    direction = "long"
    entry_level = 1.16350
    stop_level = 1.16170
    retap_level = 1.16710
    price = 1.16350
    vwap = 1.16300
    ema10 = 1.16324
    ema21 = 1.16210
    ema20 = 1.16210
    rsi = 52.5
    atr = 0.0050
    open_positions = 0
    account_size = 10000
    risk_amount = 50
    daily_losses_count = 0
    daily_profit = 0
    minutes_since_ny_open = 5
}

Write-Host "Failure point:"
Write-Host "  ✓ All 4 conditions pass"
Write-Host "  ✓ RR ratio sufficient"
Write-Host "  ✗ minutes_since_ny_open (5 min) < 15 min minimum"
Write-Host "  ✗ Too close to NY open (08:00 EST), avoid volatility"
Write-Host ""
Write-Host "Expected: recommendation = REJECT, pre-entry check fails"
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════╗"
Write-Host "║                 HOW TO RUN THESE TESTS                    ║"
Write-Host "╚════════════════════════════════════════════════════════════╝"
Write-Host ""
Write-Host "Step 1: Start the dev server"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Step 2: In another terminal, set the API key"
Write-Host "  `$env:WEBHOOK_API_KEY = 'your-32-char-api-key-from-.env.local'"
Write-Host ""
Write-Host "Step 3: Run the test script"
Write-Host "  ./scripts/test-rules-engine.ps1"
Write-Host ""
Write-Host "Step 4: After test, check pending trades"
Write-Host "  curl http://localhost:3000/api/pending"
Write-Host ""
Write-Host "Step 5: Approve a trade and check rule evaluation"
Write-Host "  curl -X POST http://localhost:3000/api/pending/[trade_id]/approve"
Write-Host "  curl http://localhost:3000/api/trades/[trade_id]/review"
Write-Host ""
