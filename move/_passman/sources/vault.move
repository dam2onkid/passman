module passman::vault;

use std::string::{Self, String};
use std::vector;
use sui::clock::{Self, Clock};
use sui::event;
use sui::object::{Self, UID, ID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

// ======== Errors ========
const ENotOwner: u64 = 1;
const EAccountNotFound: u64 = 2;

// ======== Objects ========
public struct Vault has key, store {
    id: UID,
    owner: address,
    encryption_nonce: vector<u8>,
    accounts: vector<ID>,
}

public struct Account has key, store {
    id: UID,
    vault_id: ID,
    name: String,
    category: String,
    created_at: u64,
    updated_at: u64,
    blob_id: vector<u8>,
}

// ======== Events ========
public struct VaultCreated has copy, drop {
    vault_id: ID,
    owner: address,
}

public struct AccountCreated has copy, drop {
    account_id: ID,
    vault_id: ID,
    name: String,
}

public struct AccountUpdated has copy, drop {
    account_id: ID,
    name: String,
}

public struct AccountDeleted has copy, drop {
    account_id: ID,
}

// ======== Functions ========

// Create a new vault
public entry fun create_vault(encryption_nonce: vector<u8>, ctx: &mut TxContext) {
    let vault = Vault {
        id: object::new(ctx),
        owner: tx_context::sender(ctx),
        encryption_nonce,
        accounts: vector::empty<ID>(),
    };

    // Emit event for vault creation
    event::emit(VaultCreated {
        vault_id: object::id(&vault),
        owner: tx_context::sender(ctx),
    });

    // Transfer vault to sender
    transfer::transfer(vault, tx_context::sender(ctx));
}

// Create a new account in the vault
public entry fun create_account(
    vault: &mut Vault,
    name: String,
    category: String,
    blob_id: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Verify ownership
    assert!(vault.owner == tx_context::sender(ctx), ENotOwner);

    // Create account
    let current_time = clock::timestamp_ms(clock);
    let account = Account {
        id: object::new(ctx),
        vault_id: object::id(vault),
        name,
        category,
        created_at: current_time,
        updated_at: current_time,
        blob_id,
    };

    // Add account ID to vault's accounts vector
    vector::push_back(&mut vault.accounts, object::id(&account));

    // Emit event for account creation
    event::emit(AccountCreated {
        account_id: object::id(&account),
        vault_id: object::id(vault),
        name: account.name,
    });

    // Transfer account to vault owner
    transfer::transfer(account, tx_context::sender(ctx));
}

// Update an existing account
public entry fun update_account(
    account: &mut Account,
    vault: &Vault,
    name: String,
    category: String,
    blob_id: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Verify ownership of vault
    assert!(vault.owner == tx_context::sender(ctx), ENotOwner);
    // Verify account belongs to vault
    assert!(account.vault_id == object::id(vault), EAccountNotFound);

    // Update account details
    account.name = name;
    account.category = category;
    account.blob_id = blob_id;
    account.updated_at = clock::timestamp_ms(clock);

    // Emit event for account update
    event::emit(AccountUpdated {
        account_id: object::id(account),
        name: account.name,
    });
}

// Delete an account
public entry fun delete_account(account: Account, vault: &mut Vault, ctx: &mut TxContext) {
    // Verify ownership
    assert!(vault.owner == tx_context::sender(ctx), ENotOwner);
    // Verify account belongs to vault
    assert!(account.vault_id == object::id(vault), EAccountNotFound);

    let account_id = object::id(&account);

    // Remove account ID from vault's accounts vector
    let accounts_length = vector::length(&vault.accounts);
    let mut i = 0;
    while (i < accounts_length) {
        let current_id = *vector::borrow(&vault.accounts, i);
        if (current_id == account_id) {
            vector::remove(&mut vault.accounts, i);
            break;
        };
        i = i + 1;
    };

    // Emit event for account deletion
    event::emit(AccountDeleted {
        account_id,
    });

    // Delete account by unpacking it
    let Account {
        id,
        vault_id: _,
        name: _,
        category: _,
        created_at: _,
        updated_at: _,
        blob_id: _,
    } = account;
    object::delete(id);
}

// Helper function to get account data (used by share module)
public fun get_account_data(account: &Account): (String, String, vector<u8>) {
    (account.name, account.category, account.blob_id)
}

// Helper function to get account's vault ID (used by share module)
public fun get_account_vault_id(account: &Account): ID {
    account.vault_id
}

// Helper function to get vault owner (used by share module)
public fun get_owner(vault: &Vault): address {
    vault.owner
}

// Get vault information
public fun get_vault_info(vault: &Vault): (address, vector<u8>, vector<ID>) {
    (vault.owner, vault.encryption_nonce, vault.accounts)
}

// Get account information
public fun get_account_info(account: &Account): (ID, String, String, u64, u64, vector<u8>) {
    (
        account.vault_id,
        account.name,
        account.category,
        account.created_at,
        account.updated_at,
        account.blob_id,
    )
}
