# Production CORS and API URL Fix

## Problem
The production app at `https://www.sportsclubnet.com` was trying to connect to `http://localhost:5051` which caused:
1. **CORS errors** - Browser blocked the request
2. **Network errors** - localhost is not accessible from production

## Solution

### 1. Frontend Changes (client/src/App.jsx)
Added `sportsclubnet.com` to the domain detection logic so it uses the correct production API URL:

```javascript
// If hosted on Render or production domain, prefer the production API URL unless explicitly overridden
try {
  const h = typeof window !== 'undefined' ? window.location.hostname : '';
  if ((/\.onrender\.com$/i.test(h) || /sportsclubnet\.com$/i.test(h)) && (!runtimeBase || /localhost/.test(runtimeBase))) {
    base = 'https://club-booking-app.onrender.com';
    if (typeof window !== 'undefined') window.API_BASE = base;
  }
} catch (e) {
  // ignore
}
```

**Now when accessed from www.sportsclubnet.com, the app will use `https://club-booking-app.onrender.com` as the API URL**

### 2. Backend Changes (server/server.js)
Added production domains to the CORS allowlist:

```javascript
const allowed = new Set(
  [
    // ... existing origins
    'https://www.sportsclubnet.com',
    'https://sportsclubnet.com',
  ].filter(Boolean)
);
```

**Now the API will accept requests from both www.sportsclubnet.com and sportsclubnet.com**

## Deployment Steps

### 1. Commit and Push Changes
```bash
git add client/src/App.jsx server/server.js
git commit -m "Fix production CORS and API URL for sportsclubnet.com"
git push origin tournament-settings
```

### 2. Merge to Main (if ready)
```bash
git checkout main
git merge tournament-settings
git push origin main
```

### 3. Deploy Backend
- The backend will auto-deploy from Render when you push to main
- Or manually trigger deploy from Render dashboard

### 4. Deploy Frontend
- The frontend will auto-deploy from Render when you push to main
- Or manually trigger deploy from Render dashboard
- **Important**: Frontend needs to rebuild to use the new JavaScript code

### 5. Verify
After deployment:
1. Visit `https://www.sportsclubnet.com`
2. Open browser console (F12)
3. Try to log in
4. Should see API requests going to `https://club-booking-app.onrender.com`
5. No CORS errors should appear

## Environment Variables (Optional)
Instead of hardcoding the API URL, you can set environment variables on Render:

**Frontend Service:**
- `VITE_API_BASE=https://club-booking-app.onrender.com`

**Backend Service:**
- `CLIENT_URL=https://www.sportsclubnet.com`

## Testing Locally
To test the production configuration locally:
1. Build the frontend: `cd client && npm run build`
2. Serve the build: `npx serve -s dist -p 3000`
3. Visit `http://localhost:3000` and check if API requests work

## Current Status
✅ Code changes made
⏳ Needs deployment to production
⏳ Needs testing on live site

## Notes
- The old JavaScript bundle (`index-CpSVCWS5.js`) has the hardcoded localhost URL
- After deployment, the new bundle will have the correct logic
- Browser cache may need to be cleared on first visit after deployment
