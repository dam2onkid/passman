# PassMan Smart Contract Documentation

This document provides an overview of the PassMan smart contract modules, their structures, and functions to help JavaScript developers interact with the contract.

## Vault Module

The vault module handles the creation and management of password vaults and items.

### Structs

- **Item**: Represents a password or credential item
  - `id: UID`: Unique identifier
  - `name: String`: Name of the item
  - `category: String`: Category of the item (e.g., "password", "wallet")
  - `vault_id: ID`: ID of the vault this item belongs to
  - `nonce: vector<u8>`: Nonce used for encryption/key derivation
  - `walrus_blob_id: String`: ID of the encrypted data blob stored on Walrus

- **Vault**: Represents a collection of items
  - `id: UID`: Unique identifier
  - `name: String`: Name of the vault
  - `items: vector<ID>`: List of item IDs in the vault

- **Cap**: Capability object that grants ownership rights to a vault
  - `id: UID`: Unique identifier
  - `vault_id: ID`: ID of the vault this capability is for

### Events

- **VaultCreated**: Emitted when a new vault is created
  - `vault_id: ID`: ID of the created vault
  - `owner: address`: Address of the vault owner

- **ItemCreated**: Emitted when a new item is added to a vault
  - `item_id: ID`: ID of the created item
  - `vault_id: ID`: ID of the vault containing the item
  - `name: String`: Name of the item
  - `category: String`: Category of the item

- **ItemUpdated**: Emitted when an item is updated
  - `item_id: ID`: ID of the updated item
  - `vault_id: ID`: ID of the vault containing the item

- **ItemDeleted**: Emitted when an item is deleted
  - `item_id: ID`: ID of the deleted item
  - `vault_id: ID`: ID of the vault that contained the item
  - `name: String`: Name of the deleted item

### Functions

- `create_vault_entry(name: String, ctx: &mut TxContext)`
  - Creates a new vault and transfers ownership (Cap) to sender.

- `create_item_entry(cap: &Cap, name: String, category: String, vault: &mut Vault, nonce: vector<u8>, walrus_blob_id: String, ctx: &mut TxContext)`
  - Creates a new item linked to a vault. Requires vault Cap.

- `update_item(cap: &Cap, name: String, walrus_blob_id: String, item: &mut Item)`
  - Updates item name and blob ID. Requires vault Cap.

- `delete_item(cap: &Cap, vault: &mut Vault, item: Item)`
  - Deletes an item and removes it from the vault. Requires vault Cap.

- `seal_approve(id: vector<u8>, vault: &Vault, item: &Item)`
  - Verifies access policy for an item based on ID prefix matching.

## Share Module

The share module enables secure sharing of vault items with other users via time-limited access.

### Structs

- **Share**: Represents a sharing permission
  - `id: UID`: Unique identifier
  - `vault_id: ID`: ID of the vault
  - `item_id: ID`: ID of the shared item
  - `recipients: vector<address>`: Authorized recipient addresses
  - `created_at: u64`: Creation timestamp (ms)
  - `ttl: u64`: Time-to-live duration (ms)

- **Cap**: Capability to manage a share object
  - `share_id: ID`: ID of the controlled share

### Events

- **ShareCreated**: Emitted when a share is created
  - `item_id: ID`: Shared item ID
  - `recipients: vector<address>`: Authorized recipients
  - `created_at: u64`: Creation timestamp
  - `ttl: u64`: Duration

### Functions

- `share_item_entry(vault: &Vault, item: &Item, recipients: vector<address>, created_at: u64, ttl: u64, ctx: &mut TxContext)`
  - Creates a shared access object for an item.

- `update_share_item(cap: &Cap, share: &mut Share, recipients: vector<address>, ttl: u64)`
  - Updates recipients or TTL of an existing share.

- `delete_share_item(cap: Cap, share: Share)`
  - Revokes access by deleting the share object.

- `seal_approve(id: vector<u8>, share: &Share, c: &Clock, ctx: &TxContext)`
  - Validates access for a recipient within the TTL window.

## DeadMan Module

The deadman module implements a dead man's switch for inheritance or emergency access.

### Structs

- **DeadManSwitch**: The switch object
  - `vault_id: ID`: ID of the protected vault
  - `owner: address`: Creator/Owner address
  - `beneficiary: address`: Heir address
  - `inactivity_period_ms: u64`: Required inactivity duration before claim
  - `last_activity_ms: u64`: Timestamp of last heartbeat
  - `cap: Option<Cap>`: The vault Cap (held in escrow)
  - `claimed: bool`: Status flag

### Events

- `SwitchCreated`, `SwitchUpdated`, `SwitchClaimed`, `SwitchDisabled`

### Functions

- `setup(vault: &Vault, cap: Cap, beneficiary: address, inactivity_period_ms: u64, clock: &Clock, ctx: &mut TxContext)`
  - Initializes the switch and locks the vault Cap inside.

- `heartbeat(switch: &mut DeadManSwitch, clock: &Clock, ctx: &TxContext)`
  - Resets the inactivity timer. Callable only by owner.

- `claim(switch: &mut DeadManSwitch, clock: &Clock, ctx: &mut TxContext)`
  - Transfers vault ownership to beneficiary if inactivity period has passed.

- `disable(switch: DeadManSwitch, ctx: &TxContext)`
  - Cancels the switch and returns the Cap to the owner.

## Recovery Module

The recovery module enables social recovery of a vault using guardians.

### Structs

- **Safe**: Shared object managing recovery state
  - `vault_id: ID`: Protected vault ID
  - `owner: address`: Current owner
  - `guardians: vector<address>`: List of trusted guardians
  - `threshold: u64`: Votes required to recover
  - `cap: Option<Cap>`: Vault Cap (held in safe)
  - `recovery_votes`: Tracks votes for new owners

- **FlashReceipt**: Hot potato struct ensuring Cap return during borrowing

### Events

- `SafeCreated`, `RecoveryExecuted`, `SafeDisabled`

### Functions

- `create_safe(vault: &Vault, cap: Cap, guardians: vector<address>, threshold: u64, ctx: &mut TxContext)`
  - Wraps a vault Cap in a recovery Safe.

- `borrow_cap(safe: &mut Safe, ctx: &TxContext): (Cap, FlashReceipt)`
  - Temporarily borrows Cap for transaction usage. Must be returned same transaction.

- `return_cap(safe: &mut Safe, cap: Cap, receipt: FlashReceipt)`
  - Returns the borrowed Cap to the Safe.

- `approve_recovery(safe: &mut Safe, new_owner: address, ctx: &TxContext)`
  - Guardian votes to transfer ownership. Executes recovery if threshold met.

- `disable_recovery(safe: Safe, ctx: &TxContext)`
  - Destroys the Safe and returns Cap to owner.

## JavaScript Integration Tips

1. **Vault Management**:
   - Always store the `Cap` object ID securely; it's required for all write operations.
   - Use `seal_approve` for read-access verification.

2. **Sharing**:
   - Shares are shared objects; anyone can read them, but only `seal_approve` validates access.
   - TTL is in milliseconds.

3. **Social Recovery**:
   - The `borrow_cap` and `return_cap` must be called in the same Programmable Transaction Block (PTB).
   - This "Hot Potato" pattern ensures the Cap is never left in an unsafe state.

4. **Dead Man's Switch**:
   - Ensure `heartbeat` is called periodically before `inactivity_period_ms` expires.
   - Minimum inactivity period is enforced (7 days).
