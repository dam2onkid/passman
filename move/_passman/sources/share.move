module passman::share;

use passman::vault::{Account, Vault};
use std::string::String;
use std::vector;
use sui::clock::{Self, Clock};
use sui::event;
use sui::object::{Self, UID, ID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

// ======== Errors ========
const ENotOwner: u64 = 1;
const EAccountNotFound: u64 = 2;
const EInvalidTimeShare: u64 = 3;
const ETimeShareExpired: u64 = 4;
const EOneTimeAccessConsumed: u64 = 5;
const ENotAuthorized: u64 = 6;

// ======== Objects ========
public struct TimeShare has key, store {
    id: UID,
    account_id: ID,
    recipient: address,
    created_at: u64,
    expires_at: u64,
}

public struct OneTimeAccess has key, store {
    id: UID,
    account_id: ID,
    recipient: address,
    consumed: bool,
}

// ======== Events ========
public struct TimeShareCreated has copy, drop {
    time_share_id: ID,
    account_id: ID,
    recipient: address,
    expires_at: u64,
}

public struct OneTimeAccessCreated has copy, drop {
    one_time_access_id: ID,
    account_id: ID,
    recipient: address,
}

public struct OneTimeAccessConsumed has copy, drop {
    one_time_access_id: ID,
    account_id: ID,
}

// ======== Functions ========

// Create time-limited sharing for an account
public entry fun create_time_share(
    account: &Account,
    vault: &Vault,
    recipient: address,
    duration_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Verify ownership
    assert!(is_owner(vault, ctx), ENotOwner);
    // Verify account belongs to vault
    assert!(belongs_to_vault(account, vault), EAccountNotFound);

    let current_time = clock::timestamp_ms(clock);
    let expires_at = current_time + duration_ms;

    let time_share = TimeShare {
        id: object::new(ctx),
        account_id: object::id(account),
        recipient,
        created_at: current_time,
        expires_at,
    };

    // Emit event for time share creation
    event::emit(TimeShareCreated {
        time_share_id: object::id(&time_share),
        account_id: object::id(account),
        recipient,
        expires_at,
    });

    // Transfer time share to recipient
    transfer::transfer(time_share, recipient);
}

// Access account via time share
public fun access_via_time_share(
    time_share: &TimeShare,
    account: &Account,
    clock: &Clock,
    ctx: &TxContext,
): (String, String, vector<u8>) {
    // Verify recipient
    assert!(time_share.recipient == tx_context::sender(ctx), ENotAuthorized);
    // Verify account matches
    assert!(time_share.account_id == object::id(account), EInvalidTimeShare);
    // Verify time share not expired
    assert!(clock::timestamp_ms(clock) < time_share.expires_at, ETimeShareExpired);

    // Return account details (would be decrypted by the client)
    get_account_data(account)
}

// Create one-time access for an account
public entry fun create_one_time_access(
    account: &Account,
    vault: &Vault,
    recipient: address,
    ctx: &mut TxContext,
) {
    // Verify ownership
    assert!(is_owner(vault, ctx), ENotOwner);
    // Verify account belongs to vault
    assert!(belongs_to_vault(account, vault), EAccountNotFound);

    let one_time_access = OneTimeAccess {
        id: object::new(ctx),
        account_id: object::id(account),
        recipient,
        consumed: false,
    };

    // Emit event for one-time access creation
    event::emit(OneTimeAccessCreated {
        one_time_access_id: object::id(&one_time_access),
        account_id: object::id(account),
        recipient,
    });

    // Transfer one-time access to recipient
    transfer::transfer(one_time_access, recipient);
}

// Access account via one-time access
public fun access_via_one_time_access(
    one_time_access: &mut OneTimeAccess,
    account: &Account,
    ctx: &TxContext,
): (String, String, vector<u8>) {
    // Verify recipient
    assert!(one_time_access.recipient == tx_context::sender(ctx), ENotAuthorized);
    // Verify account matches
    assert!(one_time_access.account_id == object::id(account), EInvalidTimeShare);
    // Verify not already consumed
    assert!(!one_time_access.consumed, EOneTimeAccessConsumed);

    // Mark as consumed
    one_time_access.consumed = true;

    // Emit event for one-time access consumption
    event::emit(OneTimeAccessConsumed {
        one_time_access_id: object::id(one_time_access),
        account_id: object::id(account),
    });

    // Return account details (would be decrypted by the client)
    get_account_data(account)
}

// Revoke time share (can only be done by vault owner)
public entry fun revoke_time_share(
    time_share: TimeShare,
    account: &Account,
    vault: &Vault,
    ctx: &mut TxContext,
) {
    // Verify ownership
    assert!(is_owner(vault, ctx), ENotOwner);
    // Verify account belongs to vault
    assert!(belongs_to_vault(account, vault), EAccountNotFound);
    // Verify time share matches account
    assert!(time_share.account_id == object::id(account), EInvalidTimeShare);

    // Delete time share by unpacking it
    let TimeShare { id, account_id: _, recipient: _, created_at: _, expires_at: _ } = time_share;
    object::delete(id);
}

// Revoke one-time access (can only be done by vault owner)
public entry fun revoke_one_time_access(
    one_time_access: OneTimeAccess,
    account: &Account,
    vault: &Vault,
    ctx: &mut TxContext,
) {
    // Verify ownership
    assert!(is_owner(vault, ctx), ENotOwner);
    // Verify account belongs to vault
    assert!(belongs_to_vault(account, vault), EAccountNotFound);
    // Verify one-time access matches account
    assert!(one_time_access.account_id == object::id(account), EInvalidTimeShare);

    // Delete one-time access by unpacking it
    let OneTimeAccess { id, account_id: _, recipient: _, consumed: _ } = one_time_access;
    object::delete(id);
}

// ======== Helper functions ========
fun is_owner(vault: &Vault, ctx: &TxContext): bool {
    passman::vault::get_owner(vault) == tx_context::sender(ctx)
}

fun belongs_to_vault(account: &Account, vault: &Vault): bool {
    passman::vault::get_account_vault_id(account) == object::id(vault)
}

fun get_account_data(account: &Account): (String, String, vector<u8>) {
    passman::vault::get_account_data(account)
}
