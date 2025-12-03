# Azure Pipeline Fix - TOTP Authentication Only

## Problem
Pipeline failed with error: `AADSTS900561: The endpoint only accepts POST requests. Received a GET request`

## Root Cause
The code was attempting to use Service Principal (Client Credentials) authentication to skip the login flow. However, **D365 Finance & Operations UI doesn't accept Service Principal Bearer tokens for browser-based access**.

### Why Service Principal Doesn't Work
- **Service Principal = Machine-to-Machine**: Designed for API calls using OAuth2 Client Credentials Flow
- **D365 F&O UI = User Delegation Required**: Browser UI requires OAuth2 Authorization Code Flow (interactive login)
- **Bearer Token Rejected**: D365 F&O redirects to login page even with valid Service Principal token

## Solution Implemented
✅ **Disabled Service Principal authentication completely**
✅ **TOTP-only authentication** (already fully implemented with `otpauth` library)
✅ **Simplified pipeline configuration** (removed Service Principal variables)

## Changes Made

### 1. AuthenticationManager.ts
```typescript
// BEFORE: Tried Service Principal first, fallback to TOTP
if (this.servicePrincipalAuth) {
  const success = await this.servicePrincipalAuth.authenticate();
  if (success) return;
}
await this.performTOTPLogin(saveSession);

// AFTER: TOTP-only (commented out Service Principal)
// NOTE: Service Principal doesn't work for D365 F&O UI automation
console.log('✅ Using TOTP authentication for D365 F&O UI automation');
await this.performTOTPLogin(saveSession);
```

### 2. azure-pipelines.yml
```yaml
# BEFORE: Required 7 variables (TOTP + Service Principal)
- group: D365-Credentials  # TOTP OR Service Principal

# AFTER: Only requires 4 variables (TOTP only)
- group: D365-Credentials  # D365_URL, M365_USERNAME, M365_PASSWORD, TOTP_SECRET
```

## Required Variables (D365-Credentials Group)

| Variable | Value | Type |
|----------|-------|------|
| `D365_URL` | `https://avs-isv-puat.sandbox.operations.dynamics.com` | Plain text |
| `M365_USERNAME` | `ramyab@alphavsolutions.com` | Plain text |
| `M365_PASSWORD` | `<your password>` | **Secret** 🔒 |
| `TOTP_SECRET` | `sv7jytq52dbywhrc` | **Secret** 🔒 |

## Next Steps
1. ✅ Code fixed and pushed
2. ⏳ **Add variables to Azure DevOps Variable Group** (see above)
3. ⏳ **Run pipeline to validate**

## Expected Behavior
- **First run**: Authenticates with TOTP (~2-3 minutes), saves session
- **Subsequent tests**: Reuse session (~30 seconds each)
- **Session file**: `auth/D365AuthFile.json` (cached browser state)

## Technical Notes
- TOTP library: `otpauth@9.4.1`
- Algorithm: SHA1, 6 digits, 30-second period
- Implementation: `pages/MFAPage.ts` → `handleTOTPEntry()`
- Authentication flow: Email → Password → TOTP → Session Save

## Industry Standard
✅ **TOTP authentication is the correct and standard approach** for D365 F&O UI automation in CI/CD pipelines
❌ Service Principal is only for API automation, not browser UI
