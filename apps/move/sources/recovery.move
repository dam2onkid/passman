module passman::recovery;

use sui::vec_map::{Self, VecMap};
use sui::event;
use passman::vault::{Vault, Cap};

const ENotOwner: u64 = 1;
const ENotGuardian: u64 = 2;
const EDuplicateVote: u64 = 3;
#[allow(unused_const)]
const EThresholdNotMet: u64 = 4;
const ECapMissing: u64 = 5;
const EInvalidThreshold: u64 = 6;
const ECapMismatch: u64 = 7;
const ESafeIdMismatch: u64 = 8;

public struct Safe has key {
    id: UID,
    vault_id: ID,
    owner: address,
    guardians: vector<address>,
    threshold: u64,
    cap: Option<Cap>,
    recovery_votes: VecMap<address, vector<address>>,
}

public struct FlashReceipt {
    safe_id: ID
}

public struct RecoveryExecuted has copy, drop {
    safe_id: ID,
    old_owner: address,
    new_owner: address
}

public struct SafeCreated has copy, drop {
    safe_id: ID,
    vault_id: ID,
    owner: address
}

public struct SafeDisabled has copy, drop {
    safe_id: ID,
    vault_id: ID
}

public fun create_safe(
    vault: &Vault,
    cap: Cap,
    guardians: vector<address>,
    threshold: u64,
    ctx: &mut TxContext
) {
    assert!(passman::vault::verify_cap(&cap, vault), ENotOwner);
    assert!(threshold > 0 && threshold <= guardians.length(), EInvalidThreshold);

    let safe = Safe {
        id: object::new(ctx),
        vault_id: object::id(vault),
        owner: ctx.sender(),
        guardians,
        threshold,
        cap: option::some(cap),
        recovery_votes: vec_map::empty(),
    };

    event::emit(SafeCreated {
        safe_id: object::id(&safe),
        vault_id: object::id(vault),
        owner: ctx.sender()
    });

    transfer::share_object(safe);
}

public fun borrow_cap(safe: &mut Safe, ctx: &TxContext): (Cap, FlashReceipt) {
    assert!(ctx.sender() == safe.owner, ENotOwner);
    assert!(option::is_some(&safe.cap), ECapMissing);

    let cap = option::extract(&mut safe.cap);
    let receipt = FlashReceipt { safe_id: object::id(safe) };

    (cap, receipt)
}

public fun return_cap(safe: &mut Safe, cap: Cap, receipt: FlashReceipt) {
    let FlashReceipt { safe_id } = receipt;
    assert!(object::id(safe) == safe_id, ESafeIdMismatch);
    assert!(passman::vault::cap_vault_id(&cap) == safe.vault_id, ECapMismatch);

    option::fill(&mut safe.cap, cap);
}

public fun approve_recovery(
    safe: &mut Safe,
    new_owner: address,
    ctx: &TxContext
) {
    let sender = ctx.sender();
    assert!(vector::contains(&safe.guardians, &sender), ENotGuardian);

    if (!safe.recovery_votes.contains(&new_owner)) {
        safe.recovery_votes.insert(new_owner, vector::empty());
    };

    let votes = safe.recovery_votes.get_mut(&new_owner);
    assert!(!vector::contains(votes, &sender), EDuplicateVote);

    vector::push_back(votes, sender);

    if (votes.length() >= safe.threshold) {
        execute_recovery(safe, new_owner);
    }
}

fun execute_recovery(safe: &mut Safe, new_owner: address) {
    let old_owner = safe.owner;
    safe.owner = new_owner;
    safe.recovery_votes = vec_map::empty();

    event::emit(RecoveryExecuted {
        safe_id: object::id(safe),
        old_owner,
        new_owner
    });
}

public fun disable_recovery(safe: Safe, ctx: &TxContext) {
    let Safe {
        id,
        vault_id,
        owner,
        guardians: _,
        threshold: _,
        cap,
        recovery_votes: _
    } = safe;

    assert!(ctx.sender() == owner, ENotOwner);

    if (option::is_some(&cap)) {
        let vault_cap = option::destroy_some(cap);
        transfer::public_transfer(vault_cap, owner);
    } else {
        option::destroy_none(cap);
    };

    event::emit(SafeDisabled {
        safe_id: object::uid_to_inner(&id),
        vault_id
    });

    object::delete(id);
}

// === Test Helpers ===

#[test_only]
public fun create_safe_for_testing(
    vault: &Vault,
    cap: Cap,
    guardians: vector<address>,
    threshold: u64,
    ctx: &mut TxContext
): Safe {
    assert!(passman::vault::verify_cap(&cap, vault), ENotOwner);
    assert!(threshold > 0 && threshold <= guardians.length(), EInvalidThreshold);

    Safe {
        id: object::new(ctx),
        vault_id: object::id(vault),
        owner: ctx.sender(),
        guardians,
        threshold,
        cap: option::some(cap),
        recovery_votes: vec_map::empty(),
    }
}

#[test_only]
public fun destroy_safe_for_testing(safe: Safe) {
    let Safe { id, cap, .. } = safe;
    if (option::is_some(&cap)) {
        let c = option::destroy_some(cap);
        passman::vault::destroy_cap_for_testing(c);
    } else {
        option::destroy_none(cap);
    };
    object::delete(id);
}

#[test_only]
public fun safe_owner(safe: &Safe): address {
    safe.owner
}

#[test_only]
public fun safe_threshold(safe: &Safe): u64 {
    safe.threshold
}

#[test_only]
public fun safe_guardians(safe: &Safe): vector<address> {
    safe.guardians
}

#[test_only]
public fun share_safe_for_testing(safe: Safe) {
    transfer::share_object(safe);
}

