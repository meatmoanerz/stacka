# Stacka Deployment Guide

This guide covers the complete process for deploying new versions of Stacka to production.

## Prerequisites

- Node.js 18.x or higher installed
- Vercel CLI available (via `npx vercel` or global install)
- Git access to the repository
- Write access to the Vercel project

## Deployment Process

### 1. Update Version Number

Update the version in `package.json` following semantic versioning:

```bash
# Example: Update from 0.1.1 to 0.1.2
# Edit package.json and change:
# "version": "0.1.1" → "version": "0.1.2"
```

**Version Pattern:**
- **Major.Minor.Patch** (e.g., 0.1.2)
- **Patch**: Bug fixes, small improvements
- **Minor**: New features, significant changes
- **Major**: Breaking changes, major overhauls

### 2. Commit Changes

Stage and commit all changes with a descriptive message:

```bash
# Stage all changes
git add -A

# Commit with version and description
git commit -m "v0.1.2: Brief description of changes

- Detailed change 1
- Detailed change 2
- Bug fix descriptions
- Feature additions

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# Push to main branch
git push origin main
```

### 3. Deploy to Production

#### Option A: Automatic Deployment (Preferred)
When GitHub is connected to Vercel, pushing to main triggers automatic deployment.

#### Option B: Manual Deployment
If automatic deployment doesn't work or you need to force deploy:

```bash
# Navigate to project directory
cd "/Users/timbergholm/Desktop/DEV/stacka app/stacka"

# Trigger manual production deployment
npx vercel --prod
```

### 4. Verify Deployment

#### Check Deployment Status
```bash
# List recent deployments
npx vercel ls | head -5

# Inspect the latest deployment
npx vercel inspect <deployment-url>
```

#### Verify Live Domain
The app is live on:
- **Primary**: https://stacka-three.vercel.app

#### Test the Changes
1. **Hard refresh** the browser (`Ctrl+F5` or `Cmd+Shift+R`)
2. **Clear browser cache** if needed
3. **Test in incognito mode** to avoid cache issues
4. **Verify specific features** that were changed

## Project Structure

```
stacka/
├── package.json           # Version number here
├── vercel.json           # Vercel configuration (cron jobs)
├── .env.local            # Local environment variables (NOT committed)
├── .env.example          # Environment variable template
├── .vercel/              # Vercel project settings (NOT committed)
└── src/                  # Application source code
```

## Live Domain

| Domain | Purpose | Status |
|--------|---------|--------|
| https://stacka-three.vercel.app | Production domain | Active |

## Environment Variables

Required environment variables in Vercel:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `OPENAI_API_KEY` | OpenAI API key for statement analyzer |
| `NEXT_PUBLIC_APP_URL` | Production app URL |

### Managing Environment Variables

```bash
# List all environment variables
npx vercel env ls

# Add a new variable
npx vercel env add VARIABLE_NAME production

# Pull env vars to local .env file
npx vercel env pull
```

## Troubleshooting

### Deployment Not Triggering
```bash
# Check if connected to correct project
npx vercel

# Manual deployment
npx vercel --prod

# Check recent deployments
npx vercel ls
```

### Old Version Still Live
1. **Wait 1-2 minutes** for propagation
2. **Hard refresh** browser cache
3. **Check deployment aliases**:
   ```bash
   npx vercel inspect <latest-deployment-url>
   ```

### Build Failures
```bash
# Check build logs
npx vercel inspect <deployment-url> --logs

# Test build locally
npm run build
```

### Security Vulnerability Errors
If Vercel blocks deployment due to vulnerable packages:
```bash
# Update Next.js to latest
npm install next@latest eslint-config-next@latest

# Commit and redeploy
git add -A
git commit -m "fix: Update packages for security patches"
git push origin main
```

## Deployment Checklist

- [ ] Version number updated in `package.json`
- [ ] All changes committed with descriptive message
- [ ] Changes pushed to `origin/main`
- [ ] Deployment triggered (automatic or manual)
- [ ] New deployment shows as "Ready" in Vercel
- [ ] Hard refresh performed on live site
- [ ] Key features tested and working
- [ ] Version documented in commit history

## Useful Commands

```bash
# Check current version
cat package.json | grep version

# View recent commits
git log --oneline -5

# Check deployment status
npx vercel ls | head -3

# Inspect specific deployment
npx vercel inspect <deployment-url>

# Check env vars
npx vercel env ls

# Force new deployment
npx vercel --prod
```

## Version History

```
v0.3.1 - Statement Analyzer: Bulk categorization, simplified transaction review flow
v0.3.0 - Admin dashboard, monthly income tracking, partner loans API
v0.2.0 - Enhanced savings goals: auto-category creation, expense contributions, custom goal types, detail page
v0.1.1 - Update Next.js to fix security vulnerability
v0.1.0 - Initial release with full budget/expense management
```

## Cron Jobs

Configured in `vercel.json`:
- **Process Recurring Expenses**: Runs daily at 6:00 AM UTC
  - Path: `/api/cron/process-recurring-expenses`
  - Schedule: `0 6 * * *`

## Important Notes

1. **Always test locally** before deploying to production
2. **Use descriptive commit messages** for easier debugging
3. **Verify changes** on live site after deployment
4. **Keep version numbers consistent** with semantic versioning
5. **Never commit `.env.local`** - it contains secrets
6. **Monitor deployment logs** for any errors

## Emergency Rollback

If you need to rollback to a previous version:

```bash
# Find previous working deployment
npx vercel ls

# Set alias to previous deployment
npx vercel alias <previous-deployment-url> stacka-three.vercel.app
```

---

**Last Updated**: v0.3.1 - 2026-01-28
**Maintainer**: Development Team
**Production URL**: https://stacka-three.vercel.app
