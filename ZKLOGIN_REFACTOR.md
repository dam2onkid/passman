# zkLogin Refactor - Enoki Wallet Standard Implementation

## Summary

Refactored zkLogin implementation to use Enoki's wallet standard approach. This eliminates manual OAuth flow management and provides a unified wallet experience for both regular wallets and zkLogin (Enoki) wallets.

## Key Changes

### ✅ Updated Files

#### 1. `apps/web/src/lib/sui-provider.js`

- Added `RegisterEnokiWallets` component that registers Enoki wallets with the wallet standard
- Uses `registerEnokiWallets` from `@mysten/enoki`
- Configured Google OAuth provider
- Enoki wallets now appear alongside regular wallets in the connection modal

#### 2. `apps/web/src/hooks/use-zk-login.js`

**Before**: 165 lines of manual OAuth management, session handling, transaction signing
**After**: 10 lines - simple helper to check if current wallet is Enoki

```javascript
export function useZkLogin() {
  const currentAccount = useCurrentAccount();
  const isEnokiAccount = currentAccount?.wallet
    ? isEnokiWallet(currentAccount.wallet)
    : false;

  return {
    isZkLoggedIn: isEnokiAccount,
    zkLoginAddress: isEnokiAccount ? currentAccount?.address : null,
  };
}
```

#### 3. `apps/web/src/hooks/use-sui-wallet.js`

- Simplified wallet integration
- Removed custom zkLogin transaction handling
- Now uses standard `useSignAndExecuteTransaction` for all wallet types
- Enoki wallets work through the same hooks as regular wallets

#### 4. `apps/web/src/components/wallet-connect-button.jsx`

- Replaced custom wallet/zkLogin split UI with unified `ConnectButton` from `@mysten/dapp-kit`
- ConnectButton automatically shows all registered wallets including Enoki
- Simplified from ~95 lines to ~15 lines

#### 5. `apps/web/src/app/login/page.jsx`

- Updated to use new simplified `WalletConnectButton`
- No separate zkLogin button needed

#### 6. `apps/web/src/hooks/use-seal.js`

- Removed dependency on `enokiFlow` and `useZkLoginStore`
- Removed special zkLogin signing logic (lines 201-223)
- All wallets now use unified `useSignPersonalMessage` hook

#### 7. `apps/web/src/app/share/[shareId]/page.jsx`

- Removed `ZkLoginButton` import
- Uses unified `WalletConnectButton`

### ❌ Deleted Files

1. **`apps/web/src/app/auth/callback/page.jsx`**
   - OAuth callback now handled automatically by Enoki SDK
   - No manual callback page needed

2. **`apps/web/src/components/zk-login-button.jsx`**
   - Separate Google login button no longer needed
   - Enoki wallets appear in standard wallet list

3. **`apps/web/src/lib/enoki.js`**
   - Old `EnokiFlow` client replaced by wallet standard registration
   - `enokiFlow` instance no longer needed

4. **`apps/web/src/store/zk-login-store.js`**
   - Manual state management no longer needed
   - Wallet state managed by `@mysten/dapp-kit`

## How It Works

### Old Approach (EnokiFlow)

```javascript
// Manual OAuth flow
const authUrl = await enokiFlow.createAuthorizationURL(...);
window.location.href = authUrl;

// Manual callback handling
await enokiFlow.handleAuthCallback();

// Custom transaction execution
const keypair = await enokiFlow.getKeypair();
const signature = await keypair.signTransaction(...);
```

### New Approach (Wallet Standard)

```javascript
// 1. Register wallets once at app initialization
registerEnokiWallets({
  apiKey: process.env.NEXT_PUBLIC_ENOKI_PUBLIC_KEY,
  providers: {
    google: { clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID },
  },
  client,
  network,
});

// 2. User clicks ConnectButton - OAuth handled automatically
<ConnectButton />;

// 3. Use standard dapp-kit hooks - works for all wallet types
const currentAccount = useCurrentAccount();
const { mutateAsync: signAndExecuteTransaction } =
  useSignAndExecuteTransaction();
await signAndExecuteTransaction({ transaction });
```

## Benefits

### 🎯 Simpler Architecture

- **Removed**: ~400 lines of manual OAuth/session management code
- **Deleted**: 4 files
- **Simplified**: 7 files
- OAuth flow handled by Enoki SDK

### 🔄 Unified Experience

- Enoki wallets work exactly like regular wallets
- Same hooks: `useCurrentAccount()`, `useSignAndExecuteTransaction()`, `useSignPersonalMessage()`
- No special cases in application code

### 🛡️ More Robust

- Enoki SDK handles edge cases (popup blockers, OAuth errors, session persistence)
- Better error handling built into SDK
- Fewer custom code = fewer bugs

### 🚀 Better UX

- Single connection modal for all wallet types
- Consistent wallet management
- Automatic session restoration

## Sponsored Transactions

Sponsored transactions still use the backend Enoki client:

```javascript
// apps/web/src/lib/enoki-server.js (unchanged)
export const enokiServerClient = new EnokiClient({
  apiKey: process.env.ENOKI_PRIVATE_API_KEY,
});

// apps/web/src/app/actions/enoki.js (unchanged)
export async function getSponsoredTransaction(
  transactionKindBytes,
  sender,
  zkLoginJwt
) {
  const sponsored = await enokiServerClient.createSponsoredTransaction({
    network: NETWORK,
    transactionKindBytes,
    sender,
    jwt: zkLoginJwt,
  });
  return { sponsored };
}
```

However, the JWT is now automatically managed by the wallet standard - no manual session management needed.

## Environment Variables

Required environment variables (unchanged):

- `NEXT_PUBLIC_ENOKI_PUBLIC_KEY` - Enoki public API key
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `ENOKI_PRIVATE_API_KEY` - Enoki private key for backend

## Testing Checklist

- [ ] Google login through ConnectButton works
- [ ] Regular wallet connection still works
- [ ] Switch between Enoki and regular wallets
- [ ] Transaction signing works for both wallet types
- [ ] Personal message signing (Seal encryption/decryption)
- [ ] Session persistence across page reloads
- [ ] Disconnect wallet functionality
- [ ] Share page wallet connection

## Migration Impact

### ✅ No Breaking Changes for:

- Components using `useSuiWallet()`
- Transaction execution logic
- Seal encryption/decryption
- Share functionality

### ⚠️ Breaking Changes:

- Custom zkLogin button components must be updated
- Direct usage of `useZkLoginStore` will fail
- Direct usage of `enokiFlow` will fail

## Notes for Extension App

The extension app (`apps/extension/`) still uses the old `EnokiFlow` approach. To maintain consistency, it should be refactored similarly:

1. Update `src/lib/enoki.js` to use wallet standard registration
2. Simplify `src/hooks/use-zk-login.js`
3. Update `src/hooks/use-sui-wallet.js`
4. Remove `src/store/zk-login-store.js`

## References

- [Enoki Wallet Registration](https://docs.enoki.mystenlabs.com/ts-sdk/register)
- [Enoki Sign-in Flow](https://docs.enoki.mystenlabs.com/ts-sdk/sign-in)
- [Enoki Transactions](https://docs.enoki.mystenlabs.com/ts-sdk/transactions)
- [Enoki Sponsored Transactions](https://docs.enoki.mystenlabs.com/ts-sdk/sponsored-transactions)
