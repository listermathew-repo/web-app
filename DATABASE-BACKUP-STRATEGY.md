# Database Backup Strategy

**Purpose**: Protect trading data against loss  
**Frequency**: Daily at midnight ADL  
**Retention**: 30 days of daily backups + 12 monthly backups  
**Status**: RECOMMENDED (not yet implemented)  

---

## PROBLEM: Data Loss Risk

Current system uses local SQLite file (`.db/trading.db`):
- ✅ Fast and simple
- ❌ Lost on deployment (Vercel is stateless)
- ❌ No automatic backup
- ❌ Single point of failure

**Impact of loss**:
- Trade history deleted (audit trail gone)
- Pending trades lost (trades stuck)
- Position tracking reset (exposure calculation wrong)
- Compliance violations (no trading record)

---

## SOLUTION: Automated Daily Backups

### Option A: Vercel Blob Storage (Recommended)

**Setup**:
1. Vercel Blob Storage (built into Vercel)
2. Automatic daily backup at midnight ADL
3. Encrypted storage
4. 30-day retention
5. One-click restore

**Implementation**:

```typescript
// src/lib/backup.ts
import { put, list, del } from '@vercel/blob';

export async function backupDatabase() {
  const dbBuffer = fs.readFileSync('.db/trading.db');
  const timestamp = new Date().toISOString().split('T')[0];
  const blobPath = `backups/trading-${timestamp}.db`;
  
  await put(blobPath, dbBuffer, {
    access: 'private',
    metadata: { timestamp, size: dbBuffer.length },
  });
  
  console.log(`[BACKUP] Saved to ${blobPath}`);
  return blobPath;
}

export async function restoreDatabase(timestamp: string) {
  const blobPath = `backups/trading-${timestamp}.db`;
  const blob = await get(blobPath);
  fs.writeFileSync('.db/trading.db', await blob.arrayBuffer());
  console.log(`[RESTORE] Restored from ${blobPath}`);
}

export async function listBackups() {
  const { blobs } = await list({ prefix: 'backups/' });
  return blobs.sort((a, b) => b.uploadedAt - a.uploadedAt);
}
```

**Vercel Setup**:
1. Project Settings → Storage → Blob
2. Create new Blob store
3. Copy token to `.env.local`: `BLOB_READ_WRITE_TOKEN`

**Cost**: $5/month + $0.05 per GB stored

---

### Option B: AWS S3

**Setup**:
1. AWS S3 bucket in same region
2. Lifecycle policy: Delete after 30 days
3. Server-side encryption enabled
4. Versioning enabled (keep last 10 versions)

**Implementation**:

```typescript
// src/lib/backup-s3.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function backupDatabaseToS3() {
  const dbBuffer = fs.readFileSync('.db/trading.db');
  const timestamp = new Date().toISOString().split('T')[0];
  const key = `backups/trading-${timestamp}.db`;
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: dbBuffer,
    ServerSideEncryption: 'AES256',
    Metadata: { timestamp, size: String(dbBuffer.length) },
  }));
  
  console.log(`[BACKUP] Saved to s3://${process.env.S3_BUCKET_NAME}/${key}`);
}

export async function restoreDatabaseFromS3(timestamp: string) {
  const key = `backups/trading-${timestamp}.db`;
  const response = await s3.send(new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  }));
  
  const buffer = await response.Body?.transformToByteArray();
  fs.writeFileSync('.db/trading.db', buffer);
  console.log(`[RESTORE] Restored from ${key}`);
}
```

**AWS Setup**:
1. Create S3 bucket: `trading-backups-prod`
2. Enable versioning
3. Set lifecycle: Delete old versions after 30 days
4. Create IAM user with S3 access
5. Add to `.env.local`:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `S3_BUCKET_NAME`

**Cost**: ~$0.10/month (minimal usage)

---

### Option C: Google Drive (Simple, No Cost)

**Setup**:
1. Service account with Google Drive access
2. Backup script uploads daily to Drive folder
3. Manual restore from Drive

**Implementation**:

```typescript
// src/lib/backup-drive.ts
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  keyFile: './service-account.json',
});

const drive = google.drive({ version: 'v3', auth });

export async function backupDatabaseToDrive() {
  const fileStream = fs.createReadStream('.db/trading.db');
  const timestamp = new Date().toISOString().split('T')[0];
  
  const response = await drive.files.create({
    requestBody: {
      name: `trading-${timestamp}.db`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    },
    media: {
      mimeType: 'application/octet-stream',
      body: fileStream,
    },
  });
  
  console.log(`[BACKUP] Saved to Drive: ${response.data.id}`);
}
```

**Cost**: $0 (use free Google Drive quota)

---

## AUTOMATED BACKUP SCHEDULING

### Daily Backup Cron Job

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/backup",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Create endpoint:

```typescript
// src/app/api/cron/backup/route.ts
export async function GET(req: Request) {
  // Verify cron secret
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Backup to your selected storage
    await backupDatabase(); // or S3, Drive, etc.
    
    // Send success alert
    await sendAlert('success', `📦 DATABASE BACKUP: Daily backup completed`, {
      timestamp: new Date().toISOString(),
      size: fs.statSync('.db/trading.db').size,
    });
    
    return new Response('Backup complete', { status: 200 });
  } catch (error) {
    // Send error alert
    await sendAlert('error', `🔴 BACKUP FAILED: ${error}`, {
      timestamp: new Date().toISOString(),
    });
    
    return new Response('Backup failed', { status: 500 });
  }
}
```

---

## RESTORE PROCEDURE

### Automatic Restore (On Startup)

If database missing, restore from latest backup:

```typescript
// src/lib/db.ts - in init()
function initDb() {
  if (!fs.existsSync('.db/trading.db')) {
    console.log('[DB] Database not found, restoring from backup...');
    
    try {
      // Try to restore from Vercel Blob
      const latestBackup = await getLatestBackup();
      await restoreDatabase(latestBackup.timestamp);
      console.log('[DB] Restored from backup');
    } catch (error) {
      console.error('[DB] Restore failed, creating new database');
      createNewDatabase();
    }
  }
  
  // Initialize database...
}
```

### Manual Restore (Emergency)

```bash
# List available backups
curl https://your-app.vercel.app/api/admin/backups

# Restore specific backup (requires admin key)
curl -X POST https://your-app.vercel.app/api/admin/restore \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{"timestamp": "2026-05-20"}'
```

---

## BACKUP VERIFICATION

### Weekly Verification Test

Add to test suite:

```typescript
it('should successfully restore from backup', async () => {
  // Create test backup
  const backup = await backupDatabase();
  
  // Verify backup file exists
  expect(await backupExists(backup.timestamp)).toBe(true);
  
  // Verify backup is not corrupted
  const restored = await restoreDatabase(backup.timestamp);
  expect(restored.size).toBeGreaterThan(0);
  
  // Verify data integrity
  const trades = dbOps.getPendingTrades();
  expect(trades.length).toBeGreaterThan(0);
});
```

Run weekly:
```bash
npm run test:backup
```

---

## RETENTION POLICY

### Backup Retention

- **Daily backups**: Keep 30 days (30 files)
- **Weekly backups**: Keep 12 weeks (12 files)
- **Monthly backups**: Keep 12 months (12 files)

Implement auto-cleanup:

```typescript
export async function cleanupOldBackups() {
  const allBackups = await listBackups();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  
  for (const backup of allBackups) {
    if (backup.uploadedAt < thirtyDaysAgo) {
      await deleteBackup(backup.timestamp);
      console.log(`[CLEANUP] Deleted backup: ${backup.timestamp}`);
    }
  }
}
```

---

## MONITORING & ALERTING

Alert schedule:
- ✅ Backup succeeds → Success alert (low priority)
- ❌ Backup fails → Error alert (high priority)
- ❌ Backup not found → Warning alert (medium priority)

```typescript
// Run backup check every 6 hours
const lastBackup = await getLatestBackup();
const hoursSinceBackup = (Date.now() - lastBackup.uploadedAt) / 1000 / 60 / 60;

if (hoursSinceBackup > 25) {
  // More than 25 hours since backup
  await sendAlert('warning', `⚠️ BACKUP OVERDUE: Last backup was ${hoursSinceBackup.toFixed(1)} hours ago`);
}
```

---

## COMPLIANCE & AUDIT

### Audit Trail

Each backup includes:
- Timestamp of backup
- File size
- Number of trades in database
- Database version

Implement audit log:

```typescript
interface BackupAudit {
  timestamp: string;
  action: 'backup' | 'restore' | 'delete';
  backup_id: string;
  user: string;
  status: 'success' | 'failed';
  details?: string;
}

// Store in database: audit_log table
dbOps.logAudit({
  action: 'backup',
  backup_id: backup.id,
  status: 'success',
});
```

---

## COST COMPARISON

| Option | Setup Cost | Monthly Cost | Features |
|--------|-----------|--------------|----------|
| Vercel Blob | Free | $5 + storage | Easy, integrated, encrypted |
| AWS S3 | Free | $0.10 | Cheap, reliable, versioning |
| Google Drive | Free | Free | No cost, limited, manual |
| Local File | Free | Free | ❌ No backup, data loss risk |

---

## RECOMMENDATION

**For Production**: Use **Vercel Blob Storage**
- Built into Vercel (one setup step)
- Encrypted at rest
- Automatic daily backups
- One-click restore
- Cost: $5/month (acceptable)

**For Development**: Use local backups only

---

**Status**: READY TO IMPLEMENT  
**Priority**: HIGH (data protection critical)  
**Implementation Time**: 2 hours  
**Last Updated**: 2026-05-22
