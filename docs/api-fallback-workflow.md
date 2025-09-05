# API Fallback Workflow

## Overview

We introduced a **local → production API fallback workflow** in the frontend.  
The intent:

- **During development**: connect automatically to a locally running Flask backend (`127.0.0.1:5000`) if available.
- **During testing or staging**: if local backend is not running, automatically use the deployed backend on Render (`https://ai-card-generate-backend.onrender.com`).
- **During production use**: stick to the production backend, unless explicitly overridden.

This change was made to reduce the "oh, I forgot to start the backend" friction, while still giving developers a way to test everything locally when desired.

---

## What Changed

### 1. New `src/api.js` Utility Layer

Instead of components calling `fetch` or `axios` directly, all requests now go through a single API utility.

Key features:

- **Base URL fallback**
  - Try `LOCAL_API` first.
  - If local is **unreachable** (timeout or network error), fallback to `PROD_API`.
  - Once a base is chosen, it is **sticky per tab session** via `sessionStorage`.
- **Separate token storage**
  - Local sessions → `authToken_local`
  - Prod sessions → `authToken_prod`
  - Prevents token corruption when switching environments.
- **Timeout control**
  - Default: 5s
  - Per-call override via `{ timeoutMs: 15000 }`
  - Long-running endpoints (AI generation, dashboard) use longer limits.
- **Request helpers**
  - `getJSON`, `postJSON`, `putJSON`, `patchJSON`, `deleteJSON`
  - Consistent error handling & JSON parsing.

---

### 2. Updated Context and Components

- **UserContext.jsx**
  - Refactored to use the new API utils.
  - Handles signup/login/logout with per-base token storage.
  - Logs out gracefully on expired/invalid JWTs.
- **Login.jsx & SignUp.jsx**
  - Integrated with updated UserContext.
  - Improved error mapping (e.g., `409 Conflict → "Email already exists"`).
  - UI refinements for password toggles.
- **Study.jsx & StudyMode.jsx**
  - Switched to `getJSON` / `postJSON`.
  - Explicit handling of expired JWT tokens.
- **dashboardApiHandlers.js**
  - Increased timeouts (`15s` for dashboard stats, `12s` for progress).
  - Defensive coercion of values (avoid `NaN`).
- **studyApi.js & deckApi.js**
  - Refactored fetches to use the new API utility.
  - Added safer defaults when API returns empty or unexpected responses.

---

## Challenges & How We Solved Them

### 1. JWT Token Expiry

- **Problem**: Expired tokens caused 500 errors (`ExpiredSignatureError`) from `/user`.
- **Fix**: Added logic in `UserContext` to catch these errors, clear storage, and redirect to login.

---

### 2. Duplicate Requests During Signup

- **Problem**: Users saw `409 Conflict` even for new signups.
- **Cause**: Fallback tried both local and prod if local responded slowly.
- **Fix**: Fallback only engages if local is truly unreachable (network/timeout), not when it responds with any HTTP code.

---

### 3. CORS Header Rejections

- **Problem**: Errors like  
  `Request header field idempotency-key is not allowed by Access-Control-Allow-Headers`.
- **Fix**: Removed unused headers from frontend requests. Backend CORS config adjusted to allow necessary headers.

---

### 4. Timeouts on Expensive Endpoints

- **Problem**: `/dashboard` queries failed after 5s due to heavy DB queries/aggregations.
- **Fix**: Introduced per-call timeout override, increasing heavy endpoints to 12–15s.

---

### 5. Token Confusion Between Local & Prod

- **Problem**: Switching between environments with the same `authToken` broke sessions.
- **Fix**: Introduced environment-specific keys (`authToken_local`, `authToken_prod`).

---

### 6. User Frustration with “Invisible” Fallback

- **Problem**: Developers didn’t always realize which backend they were connected to.
- **Fix**: Added `connectedLabel()` and `forceBase()` utilities.  
  → Can be surfaced in UI/debug panel to show whether you’re connected to local or prod.

---

## Lessons Learned

1. **Fallbacks increase complexity.**  
   While convenient, they introduce edge cases (race conditions, unexpected timeouts).  
   Sometimes manual switching (`.env` or toggle) is simpler.

2. **Tokens must be environment-isolated.**  
   Otherwise switching backends corrupts sessions.

3. **Timeouts are not one-size-fits-all.**  
   Expensive endpoints require custom handling.

4. **Explicit error handling is key.**
   - Expired JWT → logout immediately.
   - API unreachable → fallback to prod.
   - API returns bad data → show safe defaults.

---

## Next Steps

- Add `/health` endpoint on backend for faster environment detection instead of trial timeouts.
- Expose a **UI toggle** (local/prod) for developers to manually control base URL.
- Write **unit tests** and **integration tests** for fallback behavior:
  - Local available vs unavailable.
  - Token storage per environment.
  - Timeout escalation.
- Decide whether fallback should remain default or move to **dev-only mode**.

---

## Branch & Commit Info

All these changes are contained in the **`api-fallback-workflow`** branch.
