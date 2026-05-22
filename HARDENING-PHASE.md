# HARDENING PHASE - Complete Security & Stability Implementation

## Deployment Status
✅ **Code Committed**: 07a6f23
✅ **Push to main**: COMPLETE
✅ **Vercel auto-deploy**: IN PROGRESS

---

## CRITICAL ITEMS TO IMPLEMENT (2-3 hours)

### 1. RATE LIMITING (20 min) - SECURITY
**Why**: Prevent webhook spam abuse
**Where**: `src/lib/rate-limiter.ts` (new file)
**Test**: `for i in {1..15}; do curl /api/alerts; done` → 429 after 10

### 2. REQUEST ID TRACKING (20 min) - DEBUGGING
**Why**: Link logs across webhook→validation→execution
**Where**: `src/lib/request-context.ts` (new file)
**Impact**: Every response includes `request_id` for debugging

### 3. BRANCH PROTECTION (5 min) - CI/CD
**Why**: Block commits to main if CI fails
**Where**: GitHub Settings → Branches → main
**Impact**: No broken code reaches production

### 4. HEALTH CHECK SCHEDULING (15 min) - MONITORING
**Why**: Know immediately if system dies
**Where**: Vercel cron job OR background task
**Impact**: Daily alerts if any component fails

### 5. INPUT VALIDATION HARDENING (15 min) - SECURITY
**Why**: Tighten Zod schemas to prevent injection
**Where**: Update TradeAlertSchema in `src/app/api/alerts/route.ts`
**Test**: Try invalid symbol like "EURUSD123" → 400 Bad Request

### 6. DATABASE BACKUPS (10 min) - RESILIENCE
**Why**: Daily backup in case of data loss
**Where**: Vercel Blob Storage or S3
**Frequency**: Once daily at midnight ADL

### 7. ERROR ALERT IMPROVEMENTS (10 min) - OBSERVABILITY
**Why**: Errors include full context for faster debugging
**Where**: Update `src/lib/alerts.ts` to include error codes + details
**Impact**: ntfy alerts show actual cause, not generic "error"

### 8. INTEGRATION TESTS (30 min) - TESTING
**Why**: Verify end-to-end workflow works
**Where**: `src/__tests__/api/alerts.integration.test.ts` (new file)
**What**: Test webhook → validation → queueing → approval → execution

### 9. RUNBOOK: First Live Trade (20 min) - DOCUMENTATION
**Why**: Clear steps for executing first trade without mistakes
**Where**: Create `RUNBOOK-FIRST-TRADE.md`
**Contains**: Verification steps, troubleshooting, error codes

### 10. VERCEL CONFIGURATION (10 min) - DEPLOYMENT
**Why**: Ensure environment variables and cron jobs are set
**Where**: Vercel Dashboard → Project Settings
**Check**: WEBHOOK_API_KEY, ACCOUNT_SIZE, CAPITAL_COM_* all present

---

## EXECUTION ORDER

### Hour 1: Security Fixes
1. ✅ Rate limiting → prevents abuse
2. ✅ Input validation hardening → prevents injection
3. ✅ Request ID tracking → enables debugging

### Hour 2: Operational Excellence
4. ✅ Health check scheduling → knows when system dies
5. ✅ Branch protection → prevents accidents
6. ✅ Database backups → protects against loss

### Hour 3: Polish & Documentation
7. ✅ Error alert improvements → faster debugging
8. ✅ Integration tests → confidence in system
9. ✅ Runbook → clear procedures
10. ✅ Vercel configuration → all settings correct

---

## VERIFICATION CHECKLIST

After hardening, verify:

- [ ] `npm run build` → zero errors
- [ ] `npm test -- --run` → all tests pass
- [ ] Rate limit works: 11th request gets 429
- [ ] Request ID in every response
- [ ] Branch protection enabled in GitHub
- [ ] Health check cron job running
- [ ] Database backup created
- [ ] All environment variables in Vercel
- [ ] Error alerts include request ID
- [ ] Runbook has no missing steps

---

## PRODUCTION READINESS MATRIX

| Capability | Before | After |
|-----------|--------|-------|
| Can trade | YES | YES ✓ |
| Can monitor | YES | YES ✓ |
| Can debug | DIFFICULT | EASY ✓ |
| Can scale | NO | YES ✓ |
| Prevents abuse | NO | YES ✓ |
| Auto-backups | NO | YES ✓ |
| Clear runbooks | NO | YES ✓ |
| **Overall** | **70%** | **95%+** |

---

## QUICK START: First Live Test

Once hardening complete:

```bash
# 1. Verify webhook is live
curl https://your-app.vercel.app/api/health

# 2. Send test alert
curl -X POST https://your-app.vercel.app/api/alerts \
  -H "X-API-Key: $(echo $WEBHOOK_API_KEY)" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"EURUSD","direction":"long","entry_level":1.1635,"stop_level":1.1617,"ema10":1.16,"ema21":1.16,"rsi":52}'

# 3. Check pending queue
curl https://your-app.vercel.app/api/pending

# 4. Approve trade (LIVE EXECUTION - TEST FIRST)
curl -X POST https://your-app.vercel.app/api/pending/{trade_id}/approve \
  -H "X-API-Key: $(echo $WEBHOOK_API_KEY)"

# 5. View execution details
curl https://your-app.vercel.app/api/trades/{trade_id}/review
```

---

## Next Phase: Go Live

Once hardening complete + first trade test successful:

1. Configure TradingView Pine Script with live webhook URL
2. Set proper account size (not $50k test amount)
3. Enable real Capital.com credentials (test with paper trading first)
4. Enable ntfy alerts to phone
5. Monitor first 10 trades manually before going fully autonomous

**Estimated time**: 30 min setup + 1 hour monitoring = ready to trade!
