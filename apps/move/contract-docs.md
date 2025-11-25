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

## Safe Module

The Safe module is a **unified security module** that combines **Social Recovery** and **Deadman Switch** features. The Safe holds the vault Cap and provides two protection mechanisms:

1. **Social Recovery**: Multi-signature recovery through trusted Guardians
2. **Deadman Switch**: Automatic ownership transfer after owner inactivity

### Structs

- **Safe**: A smart vault that holds the Cap and provides protection mechanisms
  - `id: UID`: Unique identifier
  - `vault_id: ID`: ID of the protected vault
  - `owner: address`: Current owner address
  - `cap: Option<Cap>`: The vault Cap (held in escrow)
  - **Social Recovery fields:**
    - `guardians: vector<address>`: List of trusted guardian addresses
    - `threshold: u64`: Number of votes required to execute recovery
    - `recovery_votes: VecMap<address, vector<address>>`: Tracks votes for new owners
  - **Deadman Switch fields:**
    - `beneficiary: Option<address>`: Heir address (None to disable deadman switch)
    - `inactivity_period_ms: u64`: Required inactivity duration before claim
    - `last_activity_ms: u64`: Timestamp of last heartbeat
    - `deadman_claimed: bool`: Whether the deadman switch has been claimed

- **FlashReceipt**: Hot potato struct ensuring Cap return during borrowing
  - `safe_id: ID`: ID of the safe the Cap was borrowed from

### Events

- **SafeCreated**: Emitted when a safe is created
  - `safe_id: ID`: ID of the safe
  - `vault_id: ID`: ID of the protected vault
  - `owner: address`: Owner address
  - `has_guardians: bool`: Whether social recovery is enabled
  - `has_deadman: bool`: Whether deadman switch is enabled

- **SafeDisabled**: Emitted when a safe is destroyed
  - `safe_id: ID`: ID of the safe
  - `vault_id: ID`: ID of the vault

- **RecoveryExecuted**: Emitted when social recovery is executed
  - `safe_id: ID`: ID of the safe
  - `old_owner: address`: Previous owner
  - `new_owner: address`: New owner

- **DeadmanClaimed**: Emitted when beneficiary claims the vault
  - `safe_id: ID`: ID of the safe
  - `vault_id: ID`: ID of the vault
  - `beneficiary: address`: New owner (beneficiary)
  - `claimed_at: u64`: Timestamp of claim

- **HeartbeatRecorded**: Emitted when owner records activity
  - `safe_id: ID`: ID of the safe
  - `timestamp: u64`: Activity timestamp

- **DeadmanUpdated**: Emitted when deadman settings are updated
  - `safe_id: ID`: ID of the safe
  - `beneficiary: address`: New beneficiary
  - `inactivity_period_ms: u64`: New inactivity period

- **GuardiansUpdated**: Emitted when guardian settings are updated
  - `safe_id: ID`: ID of the safe
  - `guardians: vector<address>`: New guardians list
  - `threshold: u64`: New threshold

### Functions

#### Safe Creation & Destruction

- `create_safe(vault: &Vault, cap: Cap, guardians: vector<address>, threshold: u64, beneficiary: Option<address>, inactivity_period_ms: u64, clock: &Clock, ctx: &mut TxContext)`
  - Creates a new Safe with optional Social Recovery and/or Deadman Switch.
  - `guardians`: List of guardian addresses (empty to disable social recovery)
  - `threshold`: Number of votes required (0 if no guardians)
  - `beneficiary`: Optional beneficiary for deadman switch (none to disable)
  - `inactivity_period_ms`: Inactivity period (min 7 days, ignored if no beneficiary)

- `disable_safe(safe: Safe, ctx: &TxContext)`
  - Destroys the Safe and returns Cap to owner. Owner only.

#### Cap Management (Flash Loan Pattern)

- `borrow_cap(safe: &mut Safe, ctx: &TxContext): (Cap, FlashReceipt)`
  - Temporarily borrows Cap for transaction usage. Must be returned same transaction. Owner only.

- `return_cap(safe: &mut Safe, cap: Cap, receipt: FlashReceipt)`
  - Returns the borrowed Cap to the Safe.

#### Deadman Switch Functions

- `heartbeat(safe: &mut Safe, clock: &Clock, ctx: &TxContext)`
  - Records owner activity and resets the deadman timer. Owner only.

- `claim(safe: &mut Safe, clock: &Clock, ctx: &mut TxContext)`
  - Beneficiary claims the vault after inactivity period expires. Transfers ownership via Cap.

- `update_deadman(safe: &mut Safe, beneficiary: Option<address>, inactivity_period_ms: u64, clock: &Clock, ctx: &TxContext)`
  - Updates deadman switch settings. Owner only.

#### Social Recovery Functions

- `approve_recovery(safe: &mut Safe, new_owner: address, ctx: &TxContext)`
  - Guardian votes to transfer ownership. Executes recovery if threshold met.

- `update_guardians(safe: &mut Safe, guardians: vector<address>, threshold: u64, ctx: &TxContext)`
  - Updates guardian list and threshold. Owner only.

#### View Functions

- `safe_owner(safe: &Safe): address` - Returns current owner
- `safe_vault_id(safe: &Safe): ID` - Returns vault ID
- `safe_guardians(safe: &Safe): vector<address>` - Returns guardians list
- `safe_threshold(safe: &Safe): u64` - Returns recovery threshold
- `safe_beneficiary(safe: &Safe): Option<address>` - Returns beneficiary
- `safe_inactivity_period_ms(safe: &Safe): u64` - Returns inactivity period
- `safe_last_activity_ms(safe: &Safe): u64` - Returns last activity timestamp
- `safe_deadman_claimed(safe: &Safe): bool` - Returns claim status
- `has_cap(safe: &Safe): bool` - Returns whether safe holds the Cap

## JavaScript Integration Tips

1. **Vault Management**:
   - Always store the `Cap` object ID securely; it's required for all write operations.
   - Use `seal_approve` for read-access verification.

2. **Sharing**:
   - Shares are shared objects; anyone can read them, but only `seal_approve` validates access.
   - TTL is in milliseconds.

3. **Safe (Unified Protection)**:
   - The Safe can be configured with:
     - **Only Social Recovery**: Pass guardians & threshold, no beneficiary
     - **Only Deadman Switch**: Pass beneficiary & inactivity_period, no guardians
     - **Both features**: Pass all parameters
     - **Neither (just Cap storage)**: Empty guardians, no beneficiary
   - The `borrow_cap` and `return_cap` must be called in the same Programmable Transaction Block (PTB).
   - This "Hot Potato" pattern ensures the Cap is never left in an unsafe state.

4. **Deadman Switch Best Practices**:
   - Ensure `heartbeat` is called periodically before `inactivity_period_ms` expires.
   - Minimum inactivity period is enforced (7 days).
   - When beneficiary claims, they become the new owner and receive a new Cap.

5. **Social Recovery Best Practices**:
   - Choose trusted guardians who won't collude.
   - Set threshold appropriately (e.g., 2 of 3, 3 of 5).
   - Guardian votes are per-address, so each guardian can only vote once per recovery target.
