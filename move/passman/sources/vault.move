module passman::vault;

use std::string::String;
use sui::event;


// === Error ===
const ENotOwner: u64 = 1;
const ENoAccess: u64 = 2;

// === Struct ===
public struct Item has key {
    id: UID,
    name: String,
    category: String,
    vault_id: ID,
    data: vector<u8>,
}

public struct Vault has key {
    id: UID,
    name: String
}

public struct Cap has key {
    id: UID,
    vault_id: ID
}

// === Event ===
public struct VaultCreated has copy, drop {
    vault_id: ID,
    owner: address
}

public struct ItemCreated has copy, drop {
    item_id: ID,
    vault_id: ID,
    name: String,
    category: String,
}

// === Function ===
fun create_vault(name: String, ctx: &mut TxContext): (Vault, Cap) {
    let vault = Vault { id: object::new(ctx), name };
    let cap = Cap{id: object::new(ctx), vault_id: object::id(&vault)  };
    (vault, cap)
}

fun create_item(cap: &Cap, name: String, category: String, vault: &Vault, data: vector<u8>, ctx: &mut TxContext): Item {
    assert!(cap.vault_id == object::id(vault), ENotOwner);
    Item {
        id: object::new(ctx),
        name,
        category,
        vault_id: object::id(vault),
        data,
    }
}

// === Entry ===
entry fun create_vault_entry(name: String, ctx: &mut TxContext) {
    let (vault, cap) = create_vault(name, ctx);
    event::emit(VaultCreated {vault_id: object::id(&vault), owner: ctx.sender()});
    transfer::transfer(cap,  ctx.sender());
    transfer::transfer(vault,  ctx.sender())
}

entry fun create_item_entry(cap: &Cap, name: String, category: String, vault: &Vault, data: vector<u8>, ctx: &mut TxContext) {
    let item = create_item(
        cap,
        name,
        category,
        vault,
        data,
        ctx
        );
    event::emit(ItemCreated { item_id: object::id(&item), vault_id: item.vault_id, name, category});
    transfer::share_object(item)
}

fun check_policy(cap: &Cap, item: &Item): bool {
    if(cap.vault_id == item.vault_id ) {
        return false
    };
    true
}

entry fun seal_approve(cap: &Cap, item: &Item) {
    assert!(check_policy(cap, item), ENoAccess)
}