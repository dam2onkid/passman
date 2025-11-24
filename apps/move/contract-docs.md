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
  - `data: vector<u8>`: Encrypted data of the item

- **Vault**: Represents a collection of items

  - `id: UID`: Unique identifier
  - `name: String`: Name of the vault

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

- `create_vault_entry(name: String, ctx: &mut TxContext)`: Creates a new vault

  - **Parameters**:
    - `name`: Name of the vault to create
    - `ctx`: Transaction context
  - **Output**: Creates and transfers a Vault and Cap object to the sender

- `create_item_entry(cap: &Cap, name: String, category: String, vault: &Vault, data: vector<u8>, ctx: &mut TxContext)`: Creates a new item in a vault

  - **Parameters**:
    - `cap`: Capability object proving ownership of the vault
    - `name`: Name of the item
    - `category`: Category of the item
    - `vault`: Reference to the vault
    - `data`: Encrypted data to store
    - `ctx`: Transaction context
  - **Output**: Creates and shares an Item object

- `update_item(cap: &Cap, name: String, vault: &Vault, data: vector<u8>, item: &mut Item)`: Updates an existing item

  - **Parameters**:
    - `cap`: Capability object proving ownership
    - `name`: New name for the item
    - `vault`: Reference to the vault
    - `data`: New encrypted data
    - `item`: Mutable reference to the item being updated
  - **Output**: Updates the item and emits an ItemUpdated event

- `delete_item(cap: &Cap, item: Item)`: Deletes an item

  - **Parameters**:
    - `cap`: Capability object proving ownership
    - `item`: Item to delete
  - **Output**: Deletes the item and emits an ItemDeleted event

- `seal_approve(cap: &Cap, item: &Item)`: Verifies access rights to an item
  - **Parameters**:
    - `cap`: Capability object
    - `item`: Item to verify access for
  - **Output**: Throws an error if access is not allowed

## Share Module

The share module enables secure sharing of vault items with other users.

### Structs

- **Share**: Represents a sharing permission for an item
  - `id: UID`: Unique identifier
  - `item_id: ID`: ID of the shared item
  - `recipients: vector<address>`: List of addresses that can access the item
  - `consumed: bool`: Whether the share has been used (for one-time access)
  - `one_time_access: bool`: Whether this is a one-time access share
  - `created_at: u64`: Timestamp when the share was created (in milliseconds)
  - `ttl: u64`: Time-to-live duration in milliseconds

### Events

- **ShareCreated**: Emitted when a new share is created
  - `item_id: ID`: ID of the shared item
  - `recipients: vector<address>`: List of recipient addresses
  - `created_at: u64`: Timestamp when created
  - `ttl: u64`: Time-to-live duration

### Functions

- `share_item_entry(cap: &Cap, item: &Item, recipients: vector<address>, created_at: u64, ttl: u64, one_time_access: bool, ctx: &mut TxContext)`: Creates a new share for an item

  - **Parameters**:
    - `cap`: Capability object proving ownership
    - `item`: Item to be shared
    - `recipients`: List of addresses to share with
    - `created_at`: Current timestamp in milliseconds
    - `ttl`: Time-to-live duration in milliseconds
    - `one_time_access`: Whether this is a one-time access share
    - `ctx`: Transaction context
  - **Output**: Creates and shares a Share object and emits a ShareCreated event

- `seal_approve(item: &Item, share: &Share, c: &Clock, ctx: &TxContext)`: Verifies access rights to a shared item
  - **Parameters**:
    - `item`: Item being accessed
    - `share`: Share object granting access
    - `c`: Clock object for timestamp verification
    - `ctx`: Transaction context
  - **Output**: Throws an error if access is not allowed

## Usage in JavaScript

When interacting with these contracts from JavaScript:

1. Use the `create_vault_entry` function to create a new vault
2. Use the `create_item_entry` function to add items to the vault
3. Use the `share_item_entry` function to share items with other users
4. Listen for events like `VaultCreated`, `ItemCreated`, and `ShareCreated` to track changes

The Cap object is crucial for authorization - it must be provided for most operations to prove ownership of a vault.

### Example JavaScript Integration
