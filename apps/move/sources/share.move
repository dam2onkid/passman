module passman::share;

use sui::clock::Clock;
use sui::event;
use passman::vault::{ Item, Vault };
use passman::utils::{ is_prefix };

// === Error ===
const ENotOwner: u64 = 1;
const ENoAccess: u64 = 2;
const ENotAuthorized: u64 = 3;
#[allow(unused_const)]
const EExpired: u64 = 4;

// === Constants ===
const GRACE_PERIOD_MS: u64 = 5000;

// === Struct ===
public struct Share has key {
    id: UID,
    vault_id: ID,
    item_id: ID,
    recipients: vector<address>,
    created_at: u64,
    ttl: u64
}

public struct Cap has key {
    id: UID,
    share_id: ID
}

// === Event ===
public struct ShareCreated has copy, drop  {
    item_id: ID,
    recipients: vector<address>,
    created_at: u64,
    ttl: u64
}

fun share_item(vault: &Vault, item: &Item, recipients: vector<address>, created_at: u64, ttl: u64, ctx: &mut TxContext): (Share,Cap) {
    assert!(object::id(vault) == passman::vault::item_vault_id(item), ENotOwner);
    let share = Share {
        id: object::new(ctx),
        item_id: object::id(item),
        vault_id: object::id(vault),
        recipients,
        created_at,
        ttl
    };
    let cap = Cap {id: object::new(ctx), share_id: object::id(&share)};
   (share, cap)
}


public fun update_share_item(cap: &Cap, share: &mut Share, recipients: vector<address>, ttl: u64) {
    assert!(object::id(share) == cap.share_id, ENotAuthorized);
    share.ttl = ttl;
    share.recipients = recipients
}

public fun delete_share_item(cap: Cap, share: Share) {
    assert!(object::id(&share) == cap.share_id, ENotAuthorized);
    let Share { id, .. } = share;
    let Cap {id: capId, ..} = cap;
    object::delete(id);
    object::delete(capId)
}

entry fun share_item_entry(vault: &Vault, item: &Item, recipients: vector<address>, created_at: u64, ttl: u64, ctx: &mut TxContext) {
    let (share, cap) = share_item(vault, item, recipients, created_at, ttl, ctx);
    event::emit(ShareCreated {
        item_id: object::id(item),
        recipients: share.recipients,
        created_at: share.created_at,
        ttl: share.ttl
    });
    transfer::share_object(share);
    transfer::transfer(cap, ctx.sender())
}

// [pkg-id][vault-id][nonce]
fun check_policy(id: vector<u8>, share: &Share, caller: address, c: &Clock): bool {
    if(!share.recipients.contains(&caller)) return false;
    if(c.timestamp_ms() > share.created_at + share.ttl + GRACE_PERIOD_MS) return false;

    let namespace = share.vault_id.to_bytes();
    is_prefix(namespace, id)
}

entry fun seal_approve(id: vector<u8>, share: &Share, c: &Clock, ctx: &TxContext) {
    assert!(check_policy(id,  share, ctx.sender(), c), ENoAccess)
}