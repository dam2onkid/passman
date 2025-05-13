module passman::vault;

use std::string::String;
use sui::event;
use passman::utils::{ is_prefix };

// === Error ===
const ENotOwner: u64 = 1;
const ENoAccess: u64 = 2;

// === Struct ===
public struct Item has key {
    id: UID,
    name: String,
    category: String,
    vault_id: ID,
    nonce: vector<u8>,
    data: vector<u8>,
}

public struct Vault has key {
    id: UID,
    name: String,
    items: vector<ID>
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

fun create_item(cap: &Cap, name: String, category: String, vault: &mut Vault, nonce: vector<u8>, data: vector<u8>, ctx: &mut TxContext): Item {
    assert!(cap.vault_id == object::id(vault), ENotOwner);
    let item = Item {
        id: object::new(ctx),
        name,
        category,
        vault_id: object::id(vault),
        nonce,
        data,
    };
    vault.items.push_back(object::id(&item));
    item
}

entry fun update_item(cap: &Cap, name: String, data: vector<u8>, item: &mut Item) {
    assert!(cap.vault_id == item.vault_id, ENotOwner);
    item.name = name;
    item.data = data;

    event::emit(ItemUpdated { item_id: object::id(item), vault_id: item.vault_id });
}

entry fun delete_item(cap: &Cap, vault: &mut Vault, item: Item) {
    assert!(cap.vault_id == item.vault_id, ENotOwner);
    event::emit(ItemDeleted { item_id: object::id(&item), vault_id: item.vault_id, name: item.name });
    vault.items = vault.items.filter!(|x| x != object::id(&item) ) ;
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

entry fun create_item_entry(cap: &Cap, name: String, category: String, vault: &mut Vault, nonce: vector<u8>, data: vector<u8>, ctx: &mut TxContext) {
    let item = create_item(
        cap,
        name,
        category,
        vault,
        nonce,
        data,
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

// [pkg-id][vault-id][nonce]
entry fun seal_approve(id: vector<u8>, vault: &Vault, item: &Item) {
    assert!(check_policy(id, vault, item), ENoAccess)
}

// === Test ===

#[test]
fun new_vault_for_testing(): (Cap, Vault) {
    use std::string::utf8;
    let ctx = &mut tx_context::dummy();
    let (vault, cap) = create_vault(utf8(b"test"), ctx);

    (cap, vault)
}

#[test_only]
fun destroy_for_testing(cap: Cap, vault: Vault) {
    let Cap { id, .. } = cap;
    object::delete(id);
    let Vault { id, .. } = vault;
    object::delete(id);
}

#[test]
fun new_item_for_testing(): Item {
    use std::string::utf8;
    use std::debug::print;
    let ctx = &mut tx_context::dummy();
    let (cap, vault) = new_vault_for_testing();
    let mut _vault = vault;
    let item = create_item(
        &cap,
        utf8(b"item_1"),
        utf8(b"wallet"),
        &mut _vault,
        vector::empty(),
        vector::empty(),
        ctx
    );
    let mut id = vector::empty();
    id.append(object::id(&_vault).to_bytes());
    let result = check_policy(id, &_vault, &item);
    print(&result);

    destroy_for_testing(cap, _vault);
    item
}