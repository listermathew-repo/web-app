# Vercel Configuration Checklist

**Purpose**: Ensure all environment variables and deployment settings are correct  
**Audience**: DevOps / Deployment engineer  
**Status**: Pre-deployment verification  

---

## REQUIRED ENVIRONMENT VARIABLES

All variables must be set in Vercel Project Settings → Environment Variables

### Production Environment

| Variable | Value | Purpose | Required |
|----------|-------|---------|----------|
| `WEBHOOK_API_KEY` | 32-char random string (from `.env.local`) | Authenticate incoming TradingView webhooks | ✅ YES |
| `ACCOUNT_SIZE` | `50000` (or your account size) | Used for risk per trade calculations | ✅ YES |
| `CAPITAL_COM_API_KEY` | Your Capital.com API key | Authenticate with Capital.com broker API | ✅ YES |
| `CAPITAL_COM_ACCOUNT_ID` | Your Capital.com account ID | Identify which account to trade on | ✅ YES |
| `CAPITAL_COM_ENDPOINT` | `https://api-capital.backend-capital.com/` | Capital.com API endpoint | ✅ YES |
| `NTFY_WEBHOOK_URL` | `https://ntfy.sh/mgm-7k4x-live` | Receive alerts on phone | ✅ YES |
| `DATABASE_URL` | Not needed (uses local file) | SQLite uses `.db/trading.db` | ❌ NO |

### Preview Environment

Same as Production (previews should be fully functional)

---

## VERCEL DEPLOYMENT SETTINGS

### 1. Build Configuration

**Build Command**: `npm run build`  
**Output Directory**: `.next`  
**Install Command**: `npm install`  

Verify in Project Settings → Build & Development Settings

### 2. Function Configuration

**Node.js Runtime**: 18.x or later

Check: Project Settings → Runtime Settings

### 3. Maximum Duration

Set to maximum allowed: **60 seconds** (Webhook processing might take time)

Settings → Functions → Max Duration → 60 seconds

---

## ENVIRONMENT VARIABLE SETUP STEPS

### Step 1: Access Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**

### Step 2: Add Variables
For each variable in table above:
1. Click **Add New**
2. Enter **Name**: (from table)
3. Enter **Value**: (from table)
4. Select Environments: **Production** and **Preview**
5. Click **Save**

### Step 3: Verify All Variables Present
```
WEBHOOK_API_KEY ✓
ACCOUNT_SIZE ✓
CAPITAL_COM_API_KEY ✓
CAPITAL_COM_ACCOUNT_ID ✓
CAPITAL_COM_ENDPOINT ✓
NTFY_WEBHOOK_URL ✓
```

### Step 4: Redeploy
After adding variables:
1. Go to **Deployments**
2. Click **...** on latest deployment
3. Click **Redeploy**
4. Confirm variables are available during build

---

## DATABASE PERSISTENCE

### File-Based SQLite

Database stored in `.db/trading.db` (local file)

**Issue**: Vercel Functions are stateless - each deployment resets the filesystem

**Solution**: Use Vercel Blob Storage or S3 for persistence

### Option A: Vercel Blob Storage (Recommended)

1. Install: `npm install @vercel/blob`
2. Create wrapper in `src/lib/db-blob.ts` that:
   - Loads `.db/trading.db` from Blob Storage on startup
   - Saves to Blob Storage after each write
   - Falls back to local file if Blob not available

3. Update environment:
   - Add `BLOB_READ_WRITE_TOKEN` in Vercel Project Settings
   - Enable Vercel Blob in project

### Option B: S3 Storage

1. Create AWS S3 bucket
2. Add environment variables:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `S3_BUCKET_NAME`
   - `S3_REGION`

3. Create wrapper in `src/lib/db-s3.ts` for sync/async

### Option C: Accept Local Reset (Development Only)

For testing/development:
- Database resets on each deployment
- Trades NOT persisted across deployments
- Add clear warning to logs
- Use only for staging/testing

---

## DOMAIN & DEPLOYMENT

### Custom Domain Configuration

1. Go to **Settings** → **Domains**
2. Add domain (e.g., `trading-api.yourdomain.com`)
3. Update DNS records per Vercel instructions
4. Verify SSL certificate auto-generated

### Webhook URL

Update TradingView Pine Script with:
```
url: "https://your-vercel-domain.vercel.app/api/alerts"
```

---

## MONITORING & LOGGING

### Vercel Logs

View deployment logs:
```bash
vercel logs <project-name>
```

Filter for errors:
```bash
vercel logs <project-name> | grep -i error
```

### Runtime Logs

View real-time logs:
```bash
vercel logs <project-name> --follow
```

### Error Tracking

Set up error alerts in Vercel:
1. Settings → Integrations
2. Connect to Sentry, Datadog, or similar
3. Receive alerts on function errors

---

## SECURITY CHECKLIST

- [ ] All API keys are environment variables (NOT hardcoded)
- [ ] Environment variables are NOT in `.env.local` (use only locally)
- [ ] Capital.com credentials use PAPER TRADING account first
- [ ] WEBHOOK_API_KEY is strong (32+ random characters)
- [ ] No sensitive data in git commits
- [ ] Git history is clean (no old keys exposed)

---

## PRE-DEPLOYMENT VERIFICATION

Before deploying to production:

```bash
# 1. Test build locally
npm run build  # Should complete without errors

# 2. Test in preview
npm run dev    # Verify locally first

# 3. Check environment variable references
grep -r "process.env\." src/ | grep -v node_modules | wc -l
# Should see references to: WEBHOOK_API_KEY, ACCOUNT_SIZE, CAPITAL_COM_*, NTFY_*

# 4. Run tests
npm test -- --run

# 5. Check for secrets
git log -p --all | grep -E "(CAPITAL|API_KEY|SECRET)" | head

# 6. Verify .gitignore
cat .gitignore | grep -E ".env|trading.db|.db/"

```

---

## DEPLOYMENT COMMANDS

### Deploy to Vercel

```bash
# Automatic (on git push to main)
git push origin main

# Manual deployment
vercel deploy --prod

# With environment variable override
vercel deploy --prod \
  -e WEBHOOK_API_KEY=your-key \
  -e ACCOUNT_SIZE=50000
```

### Verify Deployment

```bash
# Check health endpoint
curl https://your-vercel-domain.vercel.app/api/health

# Expected response:
# { "status": "ok", "components": { ... }, ... }
```

---

## TROUBLESHOOTING

### Build Fails
- Check error in Vercel Dashboard → Deployments → [latest] → Logs
- Verify all required packages in `package.json`
- Check TypeScript compilation: `npm run build`

### Environment Variables Not Available
- Verify variables are added to Vercel Project Settings
- Redeploy after adding new variables
- Check Vercel logs: `vercel logs --follow`

### Database Not Persisting
- Currently uses local file (resets on deploy)
- Solution: Implement Vercel Blob or S3 storage wrapper
- See "Database Persistence" section above

### Webhook Returns 500 Errors
- Check logs: `vercel logs <project> | grep 500`
- Verify all environment variables present
- Check Capital.com API credentials valid
- Verify database file exists

### Rate Limiting Not Working
- Verify `src/lib/rate-limiter.ts` is imported in alerts route
- Check in-memory map isn't overflowing
- Monitor memory usage: `vercel logs <project> | grep Memory`

---

## ROLLBACK PROCEDURE

If deployment breaks production:

```bash
# View deployment history
vercel deploy --list

# Rollback to previous
vercel rollback <deployment-id>

# Or redeploy known-good commit
git revert HEAD
git push origin main
```

---

## MONITORING ALERTS

Set up in Vercel Settings → Integrations:

- [ ] Deploy successful email
- [ ] Deploy failed email
- [ ] Error rate spike alert (if using Sentry)
- [ ] Uptime monitoring (if using external service)

---

**Last Updated**: 2026-05-22  
**Status**: READY FOR PRODUCTION DEPLOYMENT
