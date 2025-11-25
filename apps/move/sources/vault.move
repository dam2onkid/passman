module passman::vault;

use std::string::String;
use sui::event;
use passman::utils::{ is_prefix };

// === Error ===
const ENotOwner: u64 = 1;
const ENoAccess: u64 = 2;
const ENotAuthorized: u64 = 3;

// === Struct ===
public struct Item has key {
    id: UID,
    name: String,
    category: String,
    vault_id: ID,
    nonce: vector<u8>,
    walrus_blob_id: String,
}

public struct Vault has key {
    id: UID,
    name: String,
    items: vector<ID>
}

public struct Cap has key, store {
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

public struct ItemUpdated has copy, drop {
    item_id: ID,
    vault_id: ID,
}

public struct ItemDeleted has copy, drop {
    item_id: ID,
    vault_id: ID,
    name: String,
}

// === Function ===
fun create_vault(name: String, ctx: &mut TxContext): (Vault, Cap) {
    let vault = Vault { id: object::new(ctx), name, items: vector::empty() };
    let cap = Cap{id: object::new(ctx), vault_id: object::id(&vault)  };
    (vault, cap)
}

fun create_item(cap: &Cap, name: String, category: String, vault: &mut Vault, nonce: vector<u8>, walrus_blob_id: String, ctx: &mut TxContext): Item {
    assert!(cap.vault_id == object::id(vault), ENotAuthorized);
    let item = Item {
        id: object::new(ctx),
        name,
        category,
        vault_id: object::id(vault),
        nonce,
        walrus_blob_id,
    };
    vault.items.push_back(object::id(&item));
    item
}

entry fun update_item(cap: &Cap, name: String, walrus_blob_id: String, item: &mut Item) {
    assert!(cap.vault_id == item.vault_id, ENotOwner);
    item.name = name;
    item.walrus_blob_id = walrus_blob_id;

    event::emit(ItemUpdated { item_id: object::id(item), vault_id: item.vault_id });
}

entry fun delete_item(cap: &Cap, vault: &mut Vault, item: Item) {
    assert!(cap.vault_id == item.vault_id, ENotAuthorized);
    let item_id = object::id(&item);
    event::emit(ItemDeleted { item_id, vault_id: item.vault_id, name: item.name });

    let (found, idx) = vault.items.index_of(&item_id);
    assert!(found, ENotOwner);
    vault.items.swap_remove(idx);

    let Item { id, .. } = item;
    object::delete(id)
}

// === Entry ===
entry fun create_vault_entry(name: String, ctx: &mut TxContext) {
    let (vault, cap) = create_vault(name, ctx);
    event::emit(VaultCreated {vault_id: object::id(&vault), owner: ctx.sender()});
    transfer::transfer(cap,  ctx.sender());
    transfer::transfer(vault,  ctx.sender())
}

entry fun create_item_entry(cap: &Cap, name: String, category: String, vault: &mut Vault, nonce: vector<u8>, walrus_blob_id: String, ctx: &mut TxContext) {
    let item = create_item(
        cap,
        name,
        category,
        vault,
        nonce,
        walrus_blob_id,
        ctx
        );
    event::emit(ItemCreated { item_id: object::id(&item), vault_id: item.vault_id, name, category});
    transfer::share_object(item)
}

fun check_policy(id: vector<u8>, vault: &Vault, item: &Item): bool {
    if(object::id(vault) != item.vault_id) return false;
    let mut namespace = object::id(vault).to_bytes();
    namespace.append(item.nonce);
    is_prefix(namespace, id)
}

public fun item_vault_id(item: &Item): ID {
    item.vault_id
}

// [pkg-id][vault-id][nonce]
entry fun seal_approve(id: vector<u8>, vault: &Vault, item: &Item) {
    assert!(check_policy(id, vault, item), ENoAccess)
}

public(package) fun verify_cap(cap: &Cap, vault: &Vault): bool {
    cap.vault_id == object::id(vault)
}

public(package) fun cap_vault_id(cap: &Cap): ID {
    cap.vault_id
}

public(package) fun transfer_ownership(old_cap: Cap, new_owner: address, ctx: &mut TxContext) {
    let Cap { id: cap_id, vault_id } = old_cap;
    object::delete(cap_id);

    let new_cap = Cap {
        id: object::new(ctx),
        vault_id
    };

    transfer::transfer(new_cap, new_owner);
}

// === Test Helpers ===

#[test_only]
public fun create_vault_for_testing(ctx: &mut TxContext): (Vault, Cap) {
    use std::string::utf8;
    create_vault(utf8(b"test_vault"), ctx)
}

#[test_only]
public fun create_item_for_testing(cap: &Cap, vault: &mut Vault, ctx: &mut TxContext): Item {
    use std::string::utf8;
    create_item(cap, utf8(b"test_item"), utf8(b"password"), vault, vector::empty(), utf8(b"blob_123"), ctx)
}

#[test_only]
public fun destroy_vault_for_testing(vault: Vault) {
    let Vault { id, .. } = vault;
    object::delete(id);
}

#[test_only]
public fun destroy_cap_for_testing(cap: Cap) {
    let Cap { id, .. } = cap;
    object::delete(id);
}

#[test_only]
public fun destroy_item_for_testing(item: Item) {
    let Item { id, .. } = item;
    object::delete(id);
}