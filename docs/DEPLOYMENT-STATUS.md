# Production Deployment Status

**Date**: 2026-05-26 22:45 ADL  
**Status**: ✅ PRODUCTION READY  
**Build**: PASS (npm run build successful)  

## Deployment Components

### 1. GitHub Repository
- **URL**: https://github.com/listermathew-repo/web-app
- **Default Branch**: main (protected)
- **Current Branch**: feat/trading-system-phase-3-monitoring (ready for PR)
- **Latest Commit**: fa88f9d (GitHub Actions health check workflow)

### 2. Branch Protection Rules (✅ ACTIVE)
- ✅ Require PR before merge to main
- ✅ Require 1 approval before merge
- ✅ Require ci-web-app status check to pass
- ✅ Dismiss stale reviews on new commits
- ✅ Enforce rules on admins
- ✅ Block force pushes
- ✅ Block branch deletions

**Configuration**: https://github.com/listermathew-repo/web-app/settings/branches

### 3. CI/CD Workflow
- **Workflow File**: `.github/workflows/ci.yml`
- **Status**: Active (runs on PR/push)
- **Tests**: npm run lint, npm run test, npm run build
- **Health Check Workflow**: `.github/workflows/health-check.yml`
- **Cron Schedule**: Every 15 minutes (*/15 * * * *)

### 4. Vercel Deployment
- **Hosting**: Vercel (auto-deploy on push via GitHub integration)
- **Environment**: Production
- **Auto-Deploy**: Enabled for main branch merges
- **Build Command**: npm run build
- **Start Command**: npm run start

**Required Secrets** (configure in GitHub → Settings → Secrets):
```
HEALTH_CHECK_URL=<production-url>/api/health-check-cron
WEBHOOK_API_KEY=<32-char-secret-from-.env.local>
```

### 5. Environment Variables (Vercel Dashboard)
Configure in Vercel project settings:
```
WEBHOOK_API_KEY=e3acbaedddbf49184b9a3c34e3d1c99b
DB_PATH=.db/trading.db
CAPITAL_COM_EMAIL=mathewlister@hotmail.com
CAPITAL_COM_PASSWORD=VXjOO5qoorX$MX
CAPITAL_DEMO_MODE=true
NTFY_TOPIC=mgm-7k4x-live
API_URL=<production-url>
NODE_ENV=production
```

## Production API Endpoints

All endpoints live at: `https://<your-vercel-domain>.vercel.app`

### Health & Monitoring
- `GET /api/health` — System status check
- `GET /api/health-check-cron` — Cron-triggered health check
- `GET /api/trading-pause` — Check if trading paused

### Trade Webhook
- `POST /api/alerts` — Accept trade alerts from TradingView (requires X-API-Key header)

### Trade Management
- `GET /api/pending` — List pending trades
- `POST /api/pending/{id}/approve` — Execute trade
- `POST /api/pending/{id}/reject` — Skip trade

### Position Tracking
- `GET /api/positions` — Get open positions with live P&L

## Pre-Launch Verification Checklist

Before going live:

- [ ] **Vercel Deployment**
  ```bash
  curl https://<domain>/api/health
  # Expected: 200 OK with health status
  ```

- [ ] **Environment Variables**
  ```bash
  # Verify in Vercel dashboard:
  # Settings → Environment Variables
  # Should see: WEBHOOK_API_KEY, CAPITAL_COM_EMAIL, etc.
  ```

- [ ] **Branch Protection Active**
  ```bash
  # Try to merge PR without passing CI → should be blocked
  ```

- [ ] **GitHub Actions Running**
  ```bash
  # Check: https://github.com/listermathew-repo/web-app/actions
  # Should see ci-web-app workflow runs
  ```

- [ ] **Health Check Cron**
  ```bash
  # Check Actions tab → Health Check Monitor
  # Should run every 15 minutes starting at :00, :15, :30, :45
  ```

- [ ] **TradingView Webhook**
  ```bash
  # Update Pine Script with production URL:
  # URL: https://<domain>/api/alerts
  # Headers: {"X-API-Key": "<your-key>"}
  ```

## Monitoring Dashboard

**GitHub Actions**: https://github.com/listermathew-repo/web-app/actions
- Check ci-web-app workflow runs on each PR
- Check health-check-monitor runs every 15 minutes
- Any red X indicates failure

**Vercel Dashboard**: https://vercel.com/dashboard
- View deployment history
- Monitor function execution logs
- Check error tracking (if configured)

**Production Logs**:
- Vercel Logs: https://vercel.com/docs/monitoring/logs
- ntfy.sh Alerts: https://ntfy.sh/mgm-7k4x-live (replace with your topic)

## Rollback Plan

If production has critical issues:

1. **Immediate**: Disable health check workflow
   ```bash
   gh workflow disable health-check.yml
   ```

2. **Quick Revert**: Revert commit on main
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Full Rollback**: Delete Vercel deployment and redeploy previous version
   - Go to Vercel dashboard
   - Find previous working deployment
   - Click "Redeploy"

4. **Emergency Contact**: Update TradingView Pine Script to disable webhook

## Next Steps

1. **Create Pull Request**: Merge feat/trading-system-phase-3-monitoring → main
   - PR will trigger ci-web-app workflow
   - Requires 1 approval
   - Must have passing status check

2. **GitHub Actions Secrets**: Configure HEALTH_CHECK_URL and WEBHOOK_API_KEY
   - Go to Settings → Secrets and variables → Actions
   - Add HEALTH_CHECK_URL (production domain + /api/health-check-cron)
   - Add WEBHOOK_API_KEY (from .env.local)

3. **Vercel Environment Variables**: Configure production variables
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all variables from .env.local
   - Deploy new version to apply changes

4. **Monitor First 24 Hours**: Watch for errors in:
   - GitHub Actions (every 15 min health checks)
   - Vercel Logs (real-time function logs)
   - ntfy.sh Alerts (error notifications)

5. **Update TradingView Pine Script**: Change webhook URL to production
   - Get production URL from Vercel dashboard
   - Update /api/alerts endpoint in Pine Script
   - Test with small alert first

## Success Criteria

✅ Production deployment is successful when:
- [ ] Vercel deployment shows "Ready" status
- [ ] GET /api/health returns 200 with all components "ok"
- [ ] GitHub Actions ci-web-app workflow passes on all PRs
- [ ] Health check cron runs every 15 minutes without errors
- [ ] TradingView webhook accepts alerts (202 response)
- [ ] Pending trades show in dashboard within 3 seconds
- [ ] Trade approval executes on Capital.com (demo or live)
- [ ] No console errors in Vercel logs

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-26 22:45 ADL  
**Deployment Owner**: Claude (Setup via CI/CD)  
**Next Review**: 2026-05-27 10:00 ADL
