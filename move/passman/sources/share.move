module passman::share;

use sui::clock::Clock;
use sui::event;
use passman::vault::{ Item, Cap };

// === Error ===
const ENotOwner: u64 = 1;
const ENoAccess: u64 = 2;

// === Struct ===
public struct Share has key {
    id: UID,
    item_id: ID,
    recipients: vector<address>,
    consumed: bool,
    one_time_access: bool,
    created_at: u64,
    ttl: u64
}

// === Event ===
public struct ShareCreated has copy, drop  {
    item_id: ID,
    recipients: vector<address>,
    created_at: u64,
    ttl: u64
}

fun share_item(cap: &Cap, item: &Item, recipients: vector<address>, created_at: u64, ttl: u64, one_time_access: bool, ctx: &mut TxContext): Share {
    assert!(object::id(cap) != object::id(item), ENotOwner);
    Share {
        id: object::new(ctx),
        item_id: object::id(item),
        recipients,
        one_time_access,
        consumed: false,
        created_at,
        ttl
    }
}

public entry fun share_item_entry(cap: &Cap, item: &Item, recipients: vector<address>, created_at: u64, ttl: u64, one_time_access: bool, ctx: &mut TxContext) {
    let share = share_item(cap, item, recipients, created_at, ttl, one_time_access, ctx);
    event::emit(ShareCreated {
        item_id: object::id(item),
        recipients: share.recipients,
        created_at: share.created_at,
        ttl: share.ttl
    });
    transfer::share_object(share)
}
// [pkg-id][creater-address][nonce]
fun check_policy(item: &Item, share: &Share, caller: address, c: &Clock): bool {
    if(share.item_id != object::id(item)) return false;
    if(!share.recipients.contains(&caller)) return false;
    if(share.one_time_access && share.consumed) return false;
    if(c.timestamp_ms() > share.created_at + share.ttl )return false ;
    true
}

entry fun seal_approve(item: &Item ,share: &Share, c: &Clock, ctx: &TxContext) {
    assert!(check_policy(item, share, ctx.sender(), c), ENoAccess)
}