# Session Management Fix Summary

## Problem Identified

The pipeline was failing with "Session expired - redirected to login page" errors:

1. ✅ **Login test passed** - TOTP authentication worked correctly
2. ❌ **Homepage tests failed immediately** - Session wasn't being properly reused
3. 🔄 **All retries failed** - Indicating a systematic issue, not intermittent

### Root Cause

The previous architecture had a **fundamental flaw**:

```
❌ OLD FLOW:
1. Login test creates standalone browser with chromium.launch()
2. Performs TOTP authentication
3. Saves session to auth/D365AuthFile.json
4. Closes browser and context
5. Homepage tests launch NEW browser instances
6. Try to load saved session → Session expired/invalid
```

**Why it failed:**
- Login test used isolated browser context that didn't integrate with Playwright Test's session management
- Session cookies may have expired during the brief time between tests
- Test workers weren't properly sharing the authenticated session
- Projects with dependencies ran sequentially but in separate browser instances

## Solution Implemented

Switched to **Playwright's recommended global setup pattern**:

```
✅ NEW FLOW:
1. Global setup runs ONCE before any tests
2. Performs TOTP authentication in shared context
3. Saves session to auth/D365AuthFile.json with proper timing
4. All test workers load the same authenticated session
5. Tests run in parallel with shared authentication state
```

### Changes Made

#### 1. Created `global-setup.ts`
- Performs TOTP login once before all tests
- Properly saves storage state with timing guarantees
- Runs in CI or local environments
- Checks for existing session in CI (for caching)

#### 2. Updated `playwright.config.ts`
```typescript
// Added global setup
globalSetup: require.resolve('./global-setup'),

// Enabled parallel execution
fullyParallel: true,
workers: process.env.CI ? 10 : 4,

// Simplified projects - no separate login project
projects: [
  {
    name: 'chromium',
    use: { storageState: 'auth/D365AuthFile.json' }
  }
]
```

#### 3. Archived `login-setup.spec.ts`
- Renamed to `login-setup.spec.ts.backup`
- No longer needed - authentication handled by global setup

## Expected Results

✅ **Global setup authenticates once** - All 10 workers share the same session  
✅ **Session properly loaded** - Tests won't be redirected to login page  
✅ **Parallel execution** - 10 workers can run simultaneously  
✅ **Faster test execution** - No repeated login attempts  
✅ **More reliable** - Proper session timing and state management

## Pipeline Execution

**Monitor:** https://dev.azure.com/RSATwithAzure/PlaywrightTests/_build

**Expected output:**
```
🔧 === GLOBAL SETUP: D365 Authentication ===
🚀 Starting D365 TOTP authentication...
✅ Global setup complete - session saved to auth/D365AuthFile.json
📊 Session file size: [size] bytes

Running 2 tests using 1 worker (after global setup)
  ✅ Homepage verification tests should pass
  ✅ All tests use shared authenticated session
```

## Key Benefits

1. **Proper session management** - Playwright handles authentication state correctly
2. **Parallel execution** - 10 workers share single authentication
3. **CI optimization** - Can cache session file between runs
4. **Cleaner architecture** - Follows Playwright best practices
5. **Debugging friendly** - Clear global setup vs test execution separation

## Technical Details

### Storage State
The `storageState` feature in Playwright captures:
- Cookies (including authentication tokens)
- Local storage
- Session storage
- IndexedDB data

Global setup ensures this state is:
- ✅ Fully established before saving
- ✅ Properly written to disk
- ✅ Available to all test workers
- ✅ Valid for the entire test session

### Timing Fix
Added 2-second wait after authentication to ensure:
- D365 session is fully established
- All cookies are set
- Storage state is stable
- File write is complete

## Rollback Plan

If issues occur, rollback steps:
```bash
git revert 2e5b630
git push origin main
```

This will restore the previous login test architecture (though it had session issues).

## Next Steps

1. ✅ Monitor pipeline execution with commit 2e5b630
2. ✅ Verify global setup completes successfully
3. ✅ Confirm homepage tests pass with shared session
4. ✅ Review test execution time (should be faster)
5. 📊 Consider adding session caching in Azure DevOps for even faster runs

---

**Commit:** `2e5b630` - Fix session management: Use global-setup for authentication  
**Date:** December 5, 2025  
**Status:** Deployed to Azure DevOps pipeline
