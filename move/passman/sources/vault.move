module passman::vault;

use std::string::String;


// === Error ===
const ENoAccess: u64 = 1;
const EInvalidCap: u64 = 2;

// === Struct ===
public struct Item has key {
    id: UID,
    name: String,
    vault_id: ID,
    blob_id: String,
}

public struct Vault has key {
    id: UID,
    name: String
}

public struct Cap has key {
    id: UID,
    vault_id: ID
}

// === Function ===
fun create_vault(name: String, ctx: &mut TxContext): (Vault, Cap) {
    let vault = Vault { id: object::new(ctx), name };
    let cap = Cap{id: object::new(ctx), vault_id: object::id(&vault)  };
    (vault, cap)
}

fun create_item(cap: &Cap, name: String, vault: &Vault, blob_id: String, ctx: &mut TxContext): Item {
    assert!(cap.vault_id == object::id(vault), EInvalidCap);
    Item {
        id: object::new(ctx),
        name,
        vault_id: object::id(vault),
        blob_id,
    }
}

// === Entry ===
entry fun create_vault_entry(name: String, ctx: &mut TxContext) {
    let (vault, cap) = create_vault(name, ctx);
    transfer::transfer(cap,  ctx.sender());
    transfer::transfer(vault,  ctx.sender())
}

entry fun create_item_entry(cap: &Cap, name: String, vault: &Vault, blob_id: String, ctx: &mut TxContext) {
    let item = create_item(cap, name, vault, blob_id, ctx);
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