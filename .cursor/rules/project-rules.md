# Passman - Project Rules

## Project Overview

Passman is a blockchain-powered password manager built on Sui Network with Seal encryption. A decentralized password management solution using:

- **Frontend**: Next.js 15.3.1 + React 19
- **Blockchain**: Sui Network (@mysten/sui, @mysten/dapp-kit)
- **Encryption**: @mysten/seal
- **Storage**: Walrus (@mysten/walrus)
- **UI**: TailwindCSS 4 + Radix UI + shadcn/ui
- **State**: Zustand
- **Data Fetching**: TanStack React Query

## Monorepo Structure

```
passman/
├── apps/
│   ├── move/           # Sui Move smart contracts
│   └── web/            # Next.js frontend application
├── packages/
│   ├── config/         # Shared ESLint configuration
│   └── utils/          # Shared utilities and blockchain logic
├── docs/               # Documentation
└── scripts/            # Build/migration scripts
```

**Package Manager**: pnpm + Turborepo
**Node Version**: >=18

## Core Architecture

### Smart Contracts (Move)

- `vault.move` - Core vault management
- `share.move` - Password sharing logic
- `deadman.move` - Deadman switch feature
- `utils.move` - Shared utilities

### Frontend Structure

```
apps/web/src/
├── app/               # Next.js App Router pages
│   ├── dashboard/     # Main app dashboard
│   └── share/         # Public share pages
├── components/        # React components
│   ├── landing/       # Marketing pages
│   ├── new-item-modal/# Item creation flow
│   └── ui/            # shadcn/ui components
├── hooks/             # Custom React hooks
├── lib/               # Utilities & providers
└── store/             # Zustand stores
```

### Shared Packages

```
packages/utils/src/
├── constants/         # Config & constants
├── construct-move-call.js  # Sui transaction builders
├── password-data.js   # Data models
├── security-utils.js  # Encryption/decryption
├── walrus-client.js   # Walrus storage client
└── network-config.js  # Sui network configuration
```

## Development Rules

### Code Style

- **No comments** unless explicitly requested
- ES6+ JavaScript (no TypeScript currently)
- Functional components with hooks
- Named exports preferred over default exports
- Destructure props and imports

### State Management

- **Zustand** for global state (`vault-store.js`, `key-session-store.js`)
- **TanStack Query** for server state (all `use-fetch-*.js` hooks)
- Local state with `useState` for component-specific state
- Use `refreshTrigger` pattern for invalidating queries

### Sui Integration Patterns

#### Transaction Building

Always use utilities from `@passman/utils/construct-move-call`:

```javascript
import {
  createPasswordCallArgs,
  createUpdatePasswordCallArgs,
  createSharePasswordCallArgs,
} from "@passman/utils";
```

#### Data Encryption Flow

1. Encrypt with Seal: `await securityUtils.encryptPasswordData(data, sealSession)`
2. Store on Walrus: `await walrusClient.storeBlob(encryptedData)`
3. Save blobId + sealSession to blockchain
4. Decrypt: Fetch from Walrus → Decrypt with Seal

#### Query Invalidation

Use `RefreshTriggerContext` to trigger refetches:

```javascript
const { triggerRefresh } = useRefreshTrigger();
// After mutation
triggerRefresh();
```

### Blockchain Constants

Import from `@passman/utils/network-config`:

- `NETWORK` - Current network (mainnet/testnet)
- `PACKAGE_ID` - Deployed package address
- `SENDER_VAULT_ID` - Default vault ID

### Component Patterns

#### Forms

- Use controlled inputs with `useState`
- Handle async operations with try-catch
- Show loading states
- Display errors with `toast.error()` from sonner

#### Modals

- Use Radix Dialog or Sheet components
- Control with state or custom hooks
- Close on success, stay open on error

#### Data Display

- Show loading skeletons during fetch
- Handle empty states gracefully
- Use optimistic updates where possible

### Styling

- **TailwindCSS 4** utility-first
- Use `cn()` helper from `@passman/utils` for class merging
- Radix UI for accessible primitives
- `lucide-react` for icons
- Dark mode with `next-themes`

### File Organization

- Group by feature, not by type
- Colocate related components
- Keep components under 300 lines (split if larger)
- Extract complex logic to custom hooks

### Naming Conventions

- Components: `PascalCase` (e.g., `PasswordDetail.jsx`)
- Hooks: `use-kebab-case.js` (e.g., `use-fetch-vaults.js`)
- Utils: `kebab-case.js` (e.g., `password-data.js`)
- Constants: `UPPER_SNAKE_CASE`

### Data Flow Best Practices

1. Fetch data with TanStack Query hooks
2. Store in Zustand only if truly global
3. Pass data via props to children
4. Use context sparingly (theme, refresh triggers)

### Error Handling

- Try-catch for async operations
- Display user-friendly messages with `toast`
- Log errors to console in development
- Never expose sensitive data in errors

### Security Best Practices

- **Never** store unencrypted passwords in state
- Always encrypt before sending to blockchain
- Clear sensitive data from memory after use
- Validate user inputs before encryption
- Check session expiry before operations

### Performance

- Use React.memo for expensive renders
- Lazy load non-critical components
- Debounce search/filter inputs
- Use TanStack Query's stale-time for caching

### Testing Strategy

- Move contracts: `sui move test` in `apps/move/`
- Web: Manual testing + future unit tests
- Focus on critical paths: encrypt/decrypt, share, deadman

## Move Smart Contract Rules

### Module Structure

- Public entry functions for blockchain calls
- Use `sui::object::UID` for owned objects
- Implement sharing with `transfer::share_object`
- Emit events for important state changes

### Testing

- Write comprehensive tests in `tests/`
- Test both success and error paths
- Mock dependencies when needed

## Common Workflows

### Adding a New Password

1. User fills form in `ItemFormModal`
2. Encrypt data with Seal
3. Upload to Walrus
4. Call `create_password` Move function with blobId
5. Refresh query to show new item

### Sharing a Password

1. Open `ShareModal` with password ID
2. Set recipient + expiry
3. Call `share_password` Move function
4. Recipient accesses via `/share/[shareId]`
5. Decrypt with their wallet's Seal session

### Deadman Switch

1. Configure in `DeadmanSwitchManager`
2. Set check-in interval + beneficiary
3. Sui smart contract tracks last check-in
4. If expired, beneficiary can claim access

## Build & Deploy

### Development

```bash
pnpm install          # Install all dependencies
pnpm dev             # Start Next.js dev server
```

### Move Contracts

```bash
cd apps/move
sui move test        # Run tests
sui move build       # Build contracts
sui client publish --gas-budget 100000000  # Deploy
```

### Production

```bash
pnpm build           # Build all packages
pnpm start           # Start production server
```

## Key Dependencies

- `@mysten/sui` - Sui SDK
- `@mysten/dapp-kit` - Wallet connection + hooks
- `@mysten/seal` - Encryption
- `@mysten/walrus` - Decentralized storage
- `@tanstack/react-query` - Data fetching
- `zustand` - State management
- `next-themes` - Dark mode
- `sonner` - Toast notifications

## Documentation References

- Smart contract design: `docs/smart-contract-design.md`
- Features overview: `docs/features.md`
- Deadman switch: `deadman_switch_implement.md`

## Important Notes

- Always query Context7/docs for latest Sui SDK patterns
- Check existing hooks before creating new ones
- Follow monorepo structure - don't create files outside apps/packages
- Use workspace protocol for internal packages: `"@passman/utils": "workspace:*"`
- Never commit `.env` files or private keys
- Test wallet interactions on testnet first
