# zkLogin Debug Guide

## Debugging "Failed to complete login" Error

### Step 1: Check Environment Variables

Open DevTools Console in the extension popup and check the login logs:

```javascript
// When you click "Connect Google", you should see:
[zkLogin] Extension ID: <your-extension-id>
[zkLogin] Redirect URL: https://<extension-id>.chromiumapp.org/auth/callback
[zkLogin] Google Client ID: <your-client-id>
[zkLogin] Enoki API Key: enoki_public_...
[zkLogin] Network: testnet
[zkLogin] Auth URL created: https://accounts.google.com/...
```

**Common Issues:**
- ❌ `VITE_GOOGLE_CLIENT_ID` is `undefined` → Create `.env` file
- ❌ `VITE_ENOKI_PUBLIC_KEY` is `undefined` → Add Enoki key to `.env`

### Step 2: Check Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Check **Authorized redirect URIs** includes:
   ```
   https://<your-extension-id>.chromiumapp.org/auth/callback
   ```

**How to find your extension ID:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Find "Passman" extension
4. Copy the ID (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### Step 3: Check Service Worker Logs

1. Go to `chrome://extensions/`
2. Find "Passman" extension
3. Click "Service Worker" → "Inspect"
4. Complete OAuth flow
5. Check for logs:

```javascript
[Service Worker] OAuth callback detected: https://<extension-id>.chromiumapp.org/auth/callback?...
[Service Worker] Stored pending_auth_url
[Service Worker] Closed OAuth tab
[Service Worker] Notification created: <notification-id>
```

**Common Issues:**
- ❌ No logs → Service worker not detecting callback
- ❌ URL doesn't include `/auth/callback` → Wrong redirect URL

### Step 4: Check Popup Processing

After clicking the extension icon, check popup console:

```javascript
[zkLogin] Processing pending auth URL: https://<extension-id>.chromiumapp.org/auth/callback?...
[zkLogin] handleAuthCallback successful
[zkLogin] Session after callback: exists
[zkLogin] Address: 0x...
```

**Common Issues:**
- ❌ `handleAuthCallback` throws error → Check error details
- ❌ Session is `null` → Enoki API key or callback URL mismatch
- ❌ No JWT in session → OAuth flow incomplete

### Step 5: Check Chrome Storage

Open DevTools → Application → Storage → Extension Storage:

**Before login:**
```json
{
  "zk-login-storage": null,
  "vault-storage": null
}
```

**After successful login:**
```json
{
  "zk-login-storage": "{\"isLoggedIn\":true,\"zkLoginAddress\":\"0x...\",\"userSalt\":null}",
  "vault-storage": "..."
}
```

### Common Error Messages

#### "Failed to complete login: No session or JWT after callback"
**Cause:** Enoki couldn't create session from OAuth callback
**Solutions:**
1. Verify `VITE_ENOKI_PUBLIC_KEY` is correct
2. Check redirect URL matches Google OAuth config
3. Ensure network is correct (testnet/mainnet)

#### "Failed to initiate login"
**Cause:** Error creating authorization URL
**Solutions:**
1. Check `VITE_GOOGLE_CLIENT_ID` is set
2. Verify Enoki API key is valid
3. Check network connectivity

#### "Failed to restore Enoki session"
**Cause:** Error during session restoration
**Solutions:**
1. Clear extension storage and try again
2. Check Enoki API key hasn't expired
3. Verify network configuration

### Manual Testing Steps

1. **Clear all data:**
   ```javascript
   // In popup console
   chrome.storage.local.clear(() => console.log("Cleared"));
   ```

2. **Click "Connect Google"**
   - New tab should open with Google OAuth
   - Complete authentication
   - Tab should close automatically
   - Notification should appear

3. **Click extension icon**
   - Popup should show "Processing login..."
   - Should complete with "Successfully logged in!"
   - Address should be displayed

4. **Reload extension**
   - Session should persist
   - Should auto-login without OAuth flow

### Debug Checklist

- [ ] `.env` file exists in `apps/extension/`
- [ ] `VITE_ENOKI_PUBLIC_KEY` is set and valid
- [ ] `VITE_GOOGLE_CLIENT_ID` is set and valid
- [ ] Google OAuth redirect URI matches extension ID
- [ ] Extension is loaded in Chrome
- [ ] Service worker is running
- [ ] No console errors before clicking login
- [ ] OAuth tab opens and closes
- [ ] Notification appears after OAuth
- [ ] Popup processes callback successfully

### Getting Help

If you're still stuck, provide these details:

1. **Console logs** from popup (all `[zkLogin]` messages)
2. **Service worker logs** (all `[Service Worker]` messages)
3. **Extension ID** from `chrome://extensions/`
4. **Error message** (full text)
5. **Environment variables** (without actual keys):
   ```
   VITE_ENOKI_PUBLIC_KEY: enoki_public_... (length: X)
   VITE_GOOGLE_CLIENT_ID: ... (length: X)
   ```

### Quick Fix Commands

```bash
# Rebuild extension with fresh env
cd apps/extension
rm -rf dist node_modules/.vite
pnpm dev

# Check if env variables are loaded
# In popup console:
console.log({
  enoki: import.meta.env.VITE_ENOKI_PUBLIC_KEY,
  google: import.meta.env.VITE_GOOGLE_CLIENT_ID
});
```

