# zkLogin Integration for Passman Extension

## Overview
The extension now uses **zkLogin** (Google OAuth) for authentication instead of traditional wallet connections. This is a read-only implementation focused on viewing vault and item data.

## Setup

### 1. Environment Variables
Create a `.env` file in `apps/extension/` with:

```bash
VITE_ENOKI_PUBLIC_KEY=your_enoki_public_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 2. Google OAuth Configuration
In your Google Cloud Console, add the following redirect URI:
```
https://<extension-id>.chromiumapp.org/auth/callback
```

You can find your extension ID in `chrome://extensions/` after loading the extension.

## OAuth Flow

1. **User clicks "Connect Google"** in the extension popup
2. **New tab opens** with Google OAuth consent screen
3. **User completes authentication** in the new tab
4. **Callback URL is intercepted** by the service worker
5. **Tab closes automatically** and notification appears
6. **User clicks extension icon** to open popup
7. **Popup processes the callback** and completes login
8. **User sees logged-in state** with vault data

## Key Features

- ✅ **Persistent sessions** via `chrome.storage.local`
- ✅ **Automatic session restoration** on extension restart
- ✅ **Browser notifications** for login completion
- ✅ **Read-only mode** - no transaction signing needed
- ✅ **Seamless integration** with existing components

## Files Modified

### New Files
- `src/store/zk-login-store.js` - zkLogin state management
- `src/lib/enoki.js` - Enoki client configuration
- `src/hooks/use-zk-login.js` - zkLogin authentication hook

### Modified Files
- `src/hooks/use-sui-wallet.js` - Wrapped to use zkLogin
- `src/components/wallet-connect-button.jsx` - Updated UI for zkLogin
- `src/lib/sui-provider.jsx` - Removed WalletProvider
- `src/components/vault-switcher.jsx` - Removed "Add Vault" (read-only)
- `src/background/service-worker.js` - OAuth callback handler
- `manifest.json` - Added notifications permission

## Usage

### Development
```bash
cd apps/extension
pnpm dev
```

Load the `dist/` folder in Chrome Extensions (Developer Mode).

### Production Build
```bash
cd apps/extension
pnpm build
```

## Troubleshooting

### "Login successful" notification but popup shows logged out
- Click the extension icon again to open the popup
- The popup will automatically process the pending authentication

### OAuth callback not working
- Verify your Google Client ID is correct
- Check that the redirect URI matches your extension ID
- Look for errors in the service worker console (`chrome://extensions/` → Details → Service Worker → Inspect)

### Session not persisting
- Check `chrome.storage.local` in DevTools (Application → Storage → Extension Storage)
- Ensure `VITE_ENOKI_PUBLIC_KEY` is set correctly

## Architecture

```
┌─────────────────┐
│   User clicks   │
│ "Connect Google"│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  New tab opens  │
│  Google OAuth   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Service Worker  │
│ detects callback│
│ stores URL      │
│ closes tab      │
│ shows notif     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User opens     │
│  popup again    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ useZkLogin hook │
│ processes auth  │
│ saves session   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User sees vault │
│     data        │
└─────────────────┘
```

## Limitations

- **Read-only**: Cannot create vaults or items (requires transaction signing)
- **Google only**: Currently only supports Google OAuth provider
- **No sponsor transactions**: Extension doesn't handle transaction sponsorship

## Future Enhancements

- Support for multiple OAuth providers (Apple, Facebook, etc.)
- Background session refresh
- Better error handling and retry logic
- Offline mode with cached data

