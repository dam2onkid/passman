module passman::share;

use std::string::String;
use sui::clock::Clock;
use passman::vault::{Item, Cap};

// === Error ===
const ENoAccess: u64 = 1;
const EInvalidCap: u64 = 2;

// === Struct ===
public struct Share has key {
    id: UID,
    item_id: ID,
    receivers: vector<address>,
    used: bool,
    one_time_access: bool,
    created_at: u64,
    ttl: u64
}

fun share_item(cap: &Cap, item: &Item, receivers: vector<address>, created_at: u64, ttl: u64, one_time_access: bool, ctx: &mut TxContext): Share {
    assert!(object::id(cap) != object::id(item), EInvalidCap);
    Share {
        id: object::new(ctx),
        item_id: object::id(item),
        receivers,
        one_time_access,
        used: false,
        created_at,
        ttl
    }
}

public entry fun share_item_entry(cap: &Cap, item: &Item, receivers: vector<address>, created_at: u64, ttl: u64, one_time_access: bool, ctx: &mut TxContext) {
    let share = share_item(cap, item, receivers, created_at, ttl, one_time_access, ctx);
    transfer::share_object(share)
}

fun check_policy(share: &Share, caller: address, c: &Clock): bool {
    if(!share.receivers.contains(&caller)) {
        return false
    };
    if(share.one_time_access && share.used) {
        return false
    };
    if(c.timestamp_ms() > share.created_at + share.ttl ){
        return false
    };
    true
}

entry fun seal_approve(share: &Share, c: &Clock, ctx: &TxContext) {
    assert!(check_policy(share, ctx.sender(), c), ENoAccess)
}