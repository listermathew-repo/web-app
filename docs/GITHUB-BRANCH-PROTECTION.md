# GitHub Branch Protection Rules

## Manual Setup (Via GitHub Web UI)

1. Go to your repository on GitHub
2. Click **Settings** → **Branches**
3. Click **Add rule** under "Branch protection rules"
4. Fill in the branch name pattern: `main`
5. Enable the following options:
   - ✅ **Require a pull request before merging**
     - Require approvals: 1 (optional)
     - Dismiss stale pull request approvals when new commits are pushed
   - ✅ **Require status checks to pass before merging**
     - Choose `ci-web-app` workflow
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Require code reviews before merging** (optional)
   - ✅ **Restrict who can force push** (optional, for admin protection)
6. Click **Create**

## Automated Setup via GitHub CLI

```bash
# Install GitHub CLI (https://cli.github.com)
# Authenticate
gh auth login

# Navigate to your repository
cd /path/to/web-app

# Create branch protection rule
gh api repos/{owner}/{repo}/branches/main/protection \
  --input - << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci-web-app"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

## What This Does

| Rule | Benefit |
|------|---------|
| Require PR | Enforces code review process |
| Require CI to pass | Blocks broken code from reaching main |
| Require status checks | Ensures all tests run before merge |
| Dismiss stale reviews | Forces new approvals after changes |
| Require up-to-date branches | Prevents merge conflicts |

## CI Workflow Configuration

The `ci-web-app` check is defined in `.github/workflows/ci.yml` and includes:
- `npm run lint` — TypeScript type checking
- `npm run test` — Unit tests
- `npm run build` — Production build verification

## Bypassing Branch Protection (Admins Only)

If needed, repository admins can:
1. Click **Settings** → **Branches**
2. Find the rule
3. Check **Allow force pushes → Include administrators**

⚠️ Use sparingly — this defeats the safety mechanism.

## Testing the Rule

To verify the rule is working:

1. Create a new branch
2. Make a commit that fails tests (e.g., syntax error)
3. Push to GitHub and create a PR
4. Verify that **CI check fails**
5. Verify that **Merge is blocked** with a red X
6. Fix the code, push again
7. Verify that **CI passes** and **Merge is now allowed**

## Troubleshooting

**"Required status checks not found"**
- Ensure `.github/workflows/ci.yml` exists and runs on PR events
- Run a test PR to trigger the workflow
- Wait for workflow to complete before blocking on checks

**"Merge button is grayed out"**
- Check that all required checks have passed (green checkmarks)
- Ensure branch is up-to-date with main
- Verify user has merge permissions

**"Can't enable rule"**
- Ensure you have admin permissions on the repository
- Try creating the rule with fewer requirements first, then add more

## Related Documentation

- [GitHub Branch Protection Guide](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)
- [GitHub CLI Reference](https://cli.github.com/manual/)
