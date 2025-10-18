# 🚀 Production Deployment Checklist

**NEVER deploy without completing this checklist!**

## Pre-Deployment (LOCAL)

### 1. Database Safety
- [ ] **Create local backup**: `npm run db:backup create pre-deploy`
- [ ] **Run health check**: `npm run db:health` (must score >90%)
- [ ] **Test migrations locally**: `npm run migrate:safe`
- [ ] **Verify chat system**: Check conversations work in local app

### 2. Code Quality
- [ ] **All tests pass**: `npm test` (if you have tests)
- [ ] **No lint errors**: Check for code quality issues
- [ ] **No console.errors**: Review browser console in dev
- [ ] **Clean git status**: All changes committed

### 3. Migration Safety
- [ ] **No destructive migrations**: Check for DROP/TRUNCATE statements
- [ ] **Migration files validated**: Proper naming (XXX_description.sql)
- [ ] **SQL syntax checked**: Migrations parse correctly
- [ ] **Backup instructions ready**: Know how to restore if things fail

## Production Deployment

### 4. Production Backup
- [ ] **Get production DB URL**: From Render dashboard → Database → Connection Details
- [ ] **Set production URL**: `export RENDER_DATABASE_URL="postgres://..."`
- [ ] **Create production backup**: 
  ```bash
  cd server
  DATABASE_URL=$RENDER_DATABASE_URL node db-backup.mjs create pre-deploy-prod
  ```

### 5. Deploy Code
- [ ] **Push to main**: `git push origin main`
- [ ] **Monitor Render logs**: Watch deployment in Render dashboard
- [ ] **Wait for build**: Ensure no build errors

### 6. Run Production Migrations
- [ ] **Sync database**: 
  ```bash
  DATABASE_URL=$RENDER_DATABASE_URL npm run migrate
  ```
- [ ] **Check production health**: 
  ```bash
  DATABASE_URL=$RENDER_DATABASE_URL npm run db:health
  ```

## Post-Deployment Verification

### 7. Test Production App
- [ ] **App loads**: Visit your production URL
- [ ] **Login works**: Test user authentication
- [ ] **Data shows**: Clubs and users visible
- [ ] **Chat works**: Test conversations if applicable
- [ ] **No console errors**: Check browser dev tools

### 8. Production Health Check
- [ ] **Database responsive**: All queries working
- [ ] **No 500 errors**: Check Render logs for errors
- [ ] **Performance acceptable**: App responds quickly

## Emergency Rollback Plan

If something goes wrong:

### 9. Immediate Actions
- [ ] **Stop new changes**: Don't push more code
- [ ] **Document the issue**: What exactly is broken?
- [ ] **Check Render logs**: Look for error messages

### 10. Database Rollback (if needed)
- [ ] **Get backup list**: `DATABASE_URL=$RENDER_DATABASE_URL node db-backup.mjs list`
- [ ] **Restore backup**: `DATABASE_URL=$RENDER_DATABASE_URL node db-backup.mjs restore <backup-file>`
- [ ] **Verify restore**: Run health check again

### 11. Code Rollback (if needed)
- [ ] **Git revert**: `git revert <commit-hash>`
- [ ] **Force push**: `git push origin main`
- [ ] **Wait for redeploy**: Monitor Render dashboard

## Success Criteria

Your deployment is successful when:
- ✅ Production app loads without errors
- ✅ Users can log in and see their data
- ✅ Database health check scores >90%
- ✅ All major features work
- ✅ No errors in Render logs

## Quick Commands Reference

```bash
# Local development
npm run db:health                    # Check database health
npm run db:backup create <label>     # Create backup
npm run migrate:safe                 # Safe migration with backup

# Production (set DATABASE_URL first)
export RENDER_DATABASE_URL="postgres://..."

DATABASE_URL=$RENDER_DATABASE_URL npm run db:health
DATABASE_URL=$RENDER_DATABASE_URL node db-backup.mjs create prod-backup
DATABASE_URL=$RENDER_DATABASE_URL npm run migrate
```

## Important Notes

⚠️  **NEVER run destructive migrations without a backup**
⚠️  **ALWAYS test migrations locally first**
⚠️  **ALWAYS create production backup before deploy**
⚠️  **Monitor logs during and after deployment**

💡 **When in doubt, create a backup first!**

---

**Deployment Date**: ___________  
**Deployed By**: ___________  
**All Items Checked**: [ ]