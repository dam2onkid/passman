# Passman Application Features

## Backend Features (Move Smart Contracts)

The Passman smart contracts are built on Sui using the Move language. They provide secure storage and sharing of password/credential items.

### Vault Module

- **Vault Creation**: Users can create named vaults to organize their password items. Each vault is owned via a capability (Cap) object.
- **Item Management**:
  - Create items with name, category (e.g., "password", "wallet"), and encrypted data (using nonce for security).
  - Items are stored in the vault and shared as objects.
  - Update item names and data.
  - Delete items from the vault.
- **Access Control**:
  - `seal_approve` function verifies access using a policy check (prefix matching on IDs and nonce).
- **Events**: Emitted for vault creation, item creation/update/deletion to track changes.

### Share Module

- **Secure Sharing**: Create shares for specific items, specifying recipients (addresses), creation timestamp, and TTL (time-to-live).
- **Share Management**:
  - Update recipients and TTL.
  - Delete shares.
- **Policy Check**: Validates access based on share details and caller.
- **Events**: Emitted when shares are created.

### Utils Module

- Helper functions like `is_prefix` for policy checks.

The contracts ensure ownership, encryption, and time-bound sharing without exposing plaintext data.

## Frontend Features (Next.js Application)

The frontend is a responsive web app integrating with Sui wallet for blockchain interactions.

### Core UI and Navigation

- **Landing Page**: Hero section, features overview (blockchain security, seal encryption, data ownership, secure sharing, cross-device access, open-source), how-it-works, security focus, CTA, footer.
- **Dashboard**:
  - Sidebar with vault switcher, main nav (All Items, Share), user profile.
  - All Items page: Breadcrumb, new item button, password list and detail view.
  - Share page: List of shares.
- **Shared Item View**: Access shared items via `/share/[shareId]`.

### Password Management

- **Wallet Integration**: Connect Sui wallet; app requires connection to view/manage items.
- **Item Listing**: `PasswordList` component fetches and displays items from active vault.
- **Item Details**: `PasswordDetail` for viewing/editing selected items, with delete handling.
- **New Item Modal**: Multi-step modal to select type and create items (password, etc.).
- **Password Generator**: Integrated tool for generating secure passwords.

### Sharing Features

- **Share List**: View and manage outgoing shares.
- **Create Share**: Modal to generate shares with recipients and TTL.
- **Update Share**: Edit existing shares.

### Hooks and Utilities

- **Data Fetching**: Hooks for active vault, fetching items/vaults/shares, Sui wallet state.
- **Security Utils**: Password data handling, seal integration.
- **Refresh Mechanism**: Triggers updates after mutations.

### UI Components

- shadcn/ui based: Buttons, modals, lists, cards, etc.
- Custom: Header buttons, sidebar, vault switcher, wallet connect.

The app emphasizes security with on-chain storage and user-friendly interfaces for managing credentials.
