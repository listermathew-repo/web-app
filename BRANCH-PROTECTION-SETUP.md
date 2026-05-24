# GitHub Branch Protection Setup

**Purpose**: Prevent broken code from reaching production  
**Applies To**: `main` branch  
**Status**: READY TO IMPLEMENT (requires GitHub admin access)  

---

## WHY BRANCH PROTECTION?

Without protection:
- ❌ Broken code can be pushed directly to `main`
- ❌ Failing tests get deployed to production
- ❌ No code review required
- ❌ Accidental commits can break trading system

With protection:
- ✅ All changes require pull request
- ✅ CI checks must pass before merge
- ✅ Code review required (optional)
- ✅ Commits are blocked until checks green

---

## SETUP INSTRUCTIONS

### Step 1: Navigate to GitHub Repository Settings

1. Go to: https://github.com/your-username/your-repo
2. Click **Settings** tab
3. Click **Branches** (left sidebar)
4. Click **Add rule** under "Branch protection rules"

### Step 2: Configure Main Branch Rule

**Branch name pattern**: `main`

### Step 3: Enable Checks

✅ **Require a pull request before merging**
- Require 1 approval (or 0 for no review)
- Dismiss stale pull request approvals
- Require review from code owners (optional)

✅ **Require status checks to pass before merging**
- Required status checks:
  - `build` (or your build workflow name)
  - `test` (or your test workflow name)

✅ **Require branches to be up to date before merging**
- Ensures main is latest before merge

### Step 4: Optional Restrictions

✅ **Restrict who can push to matching branches**
- Allow administrators to force push
- Allow bypassing restrictions for admins

---

## GITHUB ACTIONS CI/CD SETUP

Ensure your CI workflow is configured:

**File**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - run: npm test -- --run

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to Vercel..."
      # Add Vercel deploy step here
```

---

## MERGING WITH PROTECTION ENABLED

### Normal Flow

1. **Create feature branch**:
   ```bash
   git checkout -b feature/new-trade-validation
   ```

2. **Make changes** and commit:
   ```bash
   git add .
   git commit -m "Add new trade validation"
   ```

3. **Push to remote**:
   ```bash
   git push origin feature/new-trade-validation
   ```

4. **Create Pull Request** on GitHub
   - Title: "Add new trade validation"
   - Description: List changes

5. **Wait for CI checks**
   - GitHub Actions runs: build, lint, test
   - Status shows in PR

6. **Review changes**
   - Reviewer approves PR
   - Or auto-approve if only author

7. **Merge when ready**
   - Click "Merge pull request"
   - Checks must be passing
   - Branches must be up to date
   - If not, GitHub automatically updates branch

### Direct Merge Blocked

This will be **BLOCKED**:
```bash
git push origin main  # ❌ BLOCKED - must use PR
git push -f origin main  # ❌ BLOCKED - force push not allowed
```

---

## WHAT HAPPENS WHEN CI FAILS

### 1. Build Fails
```
❌ Build failed
Tests:
  × npm run build failed
  Error: TypeScript compilation failed
```

**Fix**:
```bash
git checkout feature/fix-build
npm run build  # Run locally to see error
# Fix the error
git add .
git commit -m "Fix build error"
git push origin feature/fix-build
# CI runs again automatically
```

### 2. Tests Fail
```
❌ Tests failed
Tests:
  × npm test failed
  Error: 2 failing tests
```

**Fix**:
```bash
npm test  # Run locally
# Fix failing test
git add .
git commit -m "Fix failing test"
git push origin feature/failing-test
```

### 3. Lint Errors
```
❌ Lint failed
Errors:
  × src/index.ts:42 - Unused variable 'foo'
```

**Fix**:
```bash
npm run lint -- --fix  # Auto-fix what's possible
# Manually fix others
git add .
git commit -m "Fix linting errors"
git push origin feature/lint
```

---

## BYPASSING PROTECTION (EMERGENCY ONLY)

### If Main Is Broken (Production Emergency)

**LAST RESORT ONLY** - requires administrator password

1. Go to GitHub repository → Settings → Branches
2. Edit branch protection rule
3. Temporarily uncheck "Require status checks to pass"
4. Merge your hotfix
5. **IMMEDIATELY** re-enable the rule

**Better approach**: Create hotfix branch, get it passing CI, then merge

```bash
git checkout -b hotfix/critical-bug main
# Fix the bug
npm run build  # Verify
npm test       # Verify
git add .
git commit -m "Hotfix: critical bug"
git push origin hotfix/critical-bug
# Create PR, wait for CI
# Merge when passing
```

---

## TROUBLESHOOTING

### "This branch can't be merged - required status checks failed"

**Solution**: 
- Wait for GitHub Actions to complete
- Check workflow logs: Actions tab
- Fix the failing step
- Push a new commit to trigger CI again

### "This branch is out of date with the base branch"

**Solution**:
- Click "Update branch" button in PR
- Or locally:
  ```bash
  git fetch origin
  git merge origin/main
  git push origin feature/my-feature
  ```

### "Merge blocked by code owners"

**Solution**:
- Assign PR to code owner for review
- Request review from owner
- Wait for approval

### CI Check Taking Too Long

**Check**:
- Go to Actions tab
- Click current workflow
- Monitor progress
- Check for hanging processes

**If stuck** (> 30 min):
1. Cancel the workflow
2. Push a new commit to trigger again
3. Check workflow for infinite loops

---

## MONITORING BRANCH PROTECTION

### View Current Rules

GitHub → Settings → Branches → "Branch protection rules"

- Shows all protected branches
- Click to edit or delete rules
- View who can merge

### Rule Audit

Check who merged PRs:

```bash
git log --all --oneline | grep "Merge pull request"
# Shows all merges with PR numbers
```

### Metrics

Monitor in Actions tab:
- Average time for CI to complete
- Success rate of CI checks
- Workflows that fail most often

---

## BEST PRACTICES

1. **Keep main always deployable**
   - All merges must have passing CI
   - No direct commits to main

2. **Require code review**
   - At least 1 approval before merge
   - Use code owners for critical files

3. **Keep CI fast**
   - Aim for < 5 minute build + test
   - Run only necessary checks
   - Cache dependencies

4. **Update main frequently**
   - Merge feature branches daily
   - Don't let branches get stale (>7 days)
   - Use "Update branch" to sync

5. **Document workflows**
   - Add CI status badge to README
   - Document what each check does
   - Keep runbooks updated

---

## GIT COMMANDS CHEAT SHEET

```bash
# Create feature branch
git checkout -b feature/my-feature

# Push to remote
git push origin feature/my-feature

# Pull latest from main
git pull origin main

# Merge main into feature (keep up to date)
git merge origin/main

# Create PR (from GitHub UI)
# Review changes
# Merge (from GitHub UI when CI passes)

# Delete feature branch after merge
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

---

## CI CONFIGURATION FILES

### `.github/workflows/ci.yml`
Main CI workflow - build, lint, test

### `.github/dependabot.yml`
Auto-update dependencies, create PRs

### `.eslintrc.json`
Linting rules

### `jest.config.js` / `vitest.config.ts`
Test configuration

---

**Status**: READY FOR IMPLEMENTATION  
**Time to Setup**: 10 minutes  
**Last Updated**: 2026-05-22
