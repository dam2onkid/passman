/// Safe Module - Smart Vault Protection
///
/// A unified security module that combines Social Recovery and Deadman Switch features.
/// The Safe holds the vault Cap and provides two protection mechanisms:
///
/// 1. **Social Recovery**: Multi-signature recovery through trusted Guardians
/// 2. **Deadman Switch**: Automatic ownership transfer after owner inactivity
module passman::safe;

use sui::vec_map::{Self, VecMap};
use sui::clock::Clock;
use sui::event;
use passman::vault::{Vault, Cap};

// === Errors ===
const ENotOwner: u64 = 1;
const ENotGuardian: u64 = 2;
const EDuplicateVote: u64 = 3;
#[allow(unused_const)]
const EThresholdNotMet: u64 = 4;
const ECapMissing: u64 = 5;
const EInvalidThreshold: u64 = 6;
const ECapMismatch: u64 = 7;
const ESafeIdMismatch: u64 = 8;
const ENotBeneficiary: u64 = 9;
const ENotExpired: u64 = 10;
const EMinimumPeriod: u64 = 11;
const EDeadmanNotEnabled: u64 = 12;
const EDeadmanAlreadyClaimed: u64 = 13;

// === Constants ===
const MIN_INACTIVITY_PERIOD_MS: u64 = 7 * 24 * 60 * 60 * 1000; // 7 days

// === Structs ===

/// Safe - A smart vault that holds the Cap and provides protection mechanisms
public struct Safe has key {
    id: UID,
    vault_id: ID,
    owner: address,
    cap: Option<Cap>,

    // Social Recovery
    guardians: vector<address>,
    threshold: u64,
    recovery_votes: VecMap<address, vector<address>>,

    // Deadman Switch
    beneficiary: Option<address>,
    inactivity_period_ms: u64,
    last_activity_ms: u64,
    deadman_claimed: bool,
}

/// FlashReceipt - Hot potato ensuring Cap return within same transaction
public struct FlashReceipt {
    safe_id: ID
}

// === Events ===

public struct SafeCreated has copy, drop {
    safe_id: ID,
    vault_id: ID,
    owner: address,
    has_guardians: bool,
    has_deadman: bool,
}

public struct SafeDisabled has copy, drop {
    safe_id: ID,
    vault_id: ID
}

public struct RecoveryExecuted has copy, drop {
    safe_id: ID,
    old_owner: address,
    new_owner: address
}

public struct DeadmanClaimed has copy, drop {
    safe_id: ID,
    vault_id: ID,
    beneficiary: address,
    claimed_at: u64
}

public struct HeartbeatRecorded has copy, drop {
    safe_id: ID,
    timestamp: u64
}

public struct DeadmanUpdated has copy, drop {
    safe_id: ID,
    beneficiary: address,
    inactivity_period_ms: u64
}

public struct GuardiansUpdated has copy, drop {
    safe_id: ID,
    guardians: vector<address>,
    threshold: u64
}

// === Public Functions ===

/// Create a new Safe with optional Social Recovery and/or Deadman Switch
///
/// Parameters:
/// - `vault`: Reference to the vault to protect
/// - `cap`: The vault Cap to lock in the safe
/// - `guardians`: List of guardian addresses (can be empty to disable social recovery)
/// - `threshold`: Number of guardian votes required (0 if no guardians)
/// - `beneficiary`: Optional beneficiary for deadman switch (none to disable)
/// - `inactivity_period_ms`: Inactivity period for deadman switch (ignored if no beneficiary)
/// - `clock`: Clock for timestamp
public fun create_safe(
    vault: &Vault,
    cap: Cap,
    guardians: vector<address>,
    threshold: u64,
    beneficiary: Option<address>,
    inactivity_period_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(passman::vault::verify_cap(&cap, vault), ENotOwner);

    // Validate guardian settings
    if (guardians.length() > 0) {
        assert!(threshold > 0 && threshold <= guardians.length(), EInvalidThreshold);
    } else {
        assert!(threshold == 0, EInvalidThreshold);
    };

    // Validate deadman settings
    if (option::is_some(&beneficiary)) {
        assert!(inactivity_period_ms >= MIN_INACTIVITY_PERIOD_MS, EMinimumPeriod);
    };

    let safe = Safe {
        id: object::new(ctx),
        vault_id: object::id(vault),
        owner: ctx.sender(),
        cap: option::some(cap),

        // Social Recovery
        guardians,
        threshold,
        recovery_votes: vec_map::empty(),

        // Deadman Switch
        beneficiary,
        inactivity_period_ms,
        last_activity_ms: clock.timestamp_ms(),
        deadman_claimed: false,
    };

    event::emit(SafeCreated {
        safe_id: object::id(&safe),
        vault_id: object::id(vault),
        owner: ctx.sender(),
        has_guardians: safe.guardians.length() > 0,
        has_deadman: option::is_some(&safe.beneficiary),
    });

    transfer::share_object(safe);
}

// === Cap Management (Flash Loan Pattern) ===

/// Borrow the Cap temporarily. Must be returned in the same transaction.
public fun borrow_cap(safe: &mut Safe, ctx: &TxContext): (Cap, FlashReceipt) {
    assert!(ctx.sender() == safe.owner, ENotOwner);
    assert!(option::is_some(&safe.cap), ECapMissing);

    let cap = option::extract(&mut safe.cap);
    let receipt = FlashReceipt { safe_id: object::id(safe) };

    (cap, receipt)
}

/// Return the borrowed Cap to the Safe.
public fun return_cap(safe: &mut Safe, cap: Cap, receipt: FlashReceipt) {
    let FlashReceipt { safe_id } = receipt;
    assert!(object::id(safe) == safe_id, ESafeIdMismatch);
    assert!(passman::vault::cap_vault_id(&cap) == safe.vault_id, ECapMismatch);

    option::fill(&mut safe.cap, cap);
}

// === Deadman Switch Functions ===

/// Record owner activity (heartbeat) to reset the deadman timer
public fun heartbeat(safe: &mut Safe, clock: &Clock, ctx: &TxContext) {
    assert!(ctx.sender() == safe.owner, ENotOwner);

    safe.last_activity_ms = clock.timestamp_ms();

    event::emit(HeartbeatRecorded {
        safe_id: object::id(safe),
        timestamp: safe.last_activity_ms
    });
}

/// Beneficiary claims the vault after inactivity period expires
public fun claim(safe: &mut Safe, clock: &Clock, ctx: &mut TxContext) {
    assert!(option::is_some(&safe.beneficiary), EDeadmanNotEnabled);
    assert!(!safe.deadman_claimed, EDeadmanAlreadyClaimed);
    assert!(option::is_some(&safe.cap), ECapMissing);

    let beneficiary = *option::borrow(&safe.beneficiary);
    assert!(ctx.sender() == beneficiary, ENotBeneficiary);

    let now = clock.timestamp_ms();
    assert!(now >= safe.last_activity_ms + safe.inactivity_period_ms, ENotExpired);

    // Transfer ownership via Cap
    let old_cap = option::extract(&mut safe.cap);
    passman::vault::transfer_ownership(old_cap, beneficiary, ctx);

    // Update safe state
    safe.owner = beneficiary;
    safe.deadman_claimed = true;
    safe.recovery_votes = vec_map::empty(); // Clear any pending recovery votes

    event::emit(DeadmanClaimed {
        safe_id: object::id(safe),
        vault_id: safe.vault_id,
        beneficiary,
        claimed_at: now
    });
}

/// Update deadman switch settings (owner only)
public fun update_deadman(
    safe: &mut Safe,
    beneficiary: Option<address>,
    inactivity_period_ms: u64,
    clock: &Clock,
    ctx: &TxContext
) {
    assert!(ctx.sender() == safe.owner, ENotOwner);

    if (option::is_some(&beneficiary)) {
        assert!(inactivity_period_ms >= MIN_INACTIVITY_PERIOD_MS, EMinimumPeriod);
    };

    safe.beneficiary = beneficiary;
    safe.inactivity_period_ms = inactivity_period_ms;
    safe.last_activity_ms = clock.timestamp_ms(); // Reset timer on update
    safe.deadman_claimed = false; // Reset claim status

    if (option::is_some(&beneficiary)) {
        event::emit(DeadmanUpdated {
            safe_id: object::id(safe),
            beneficiary: *option::borrow(&beneficiary),
            inactivity_period_ms
        });
    };
}

// === Social Recovery Functions ===

/// Guardian votes to approve recovery to a new owner
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

/// Internal: Execute recovery after threshold is met
fun execute_recovery(safe: &mut Safe, new_owner: address) {
    let old_owner = safe.owner;
    safe.owner = new_owner;
    safe.recovery_votes = vec_map::empty();
    safe.deadman_claimed = false; // Reset deadman claim status for new owner

    event::emit(RecoveryExecuted {
        safe_id: object::id(safe),
        old_owner,
        new_owner
    });
}

/// Update guardian settings (owner only)
public fun update_guardians(
    safe: &mut Safe,
    guardians: vector<address>,
    threshold: u64,
    ctx: &TxContext
) {
    assert!(ctx.sender() == safe.owner, ENotOwner);

    if (guardians.length() > 0) {
        assert!(threshold > 0 && threshold <= guardians.length(), EInvalidThreshold);
    } else {
        assert!(threshold == 0, EInvalidThreshold);
    };

    safe.guardians = guardians;
    safe.threshold = threshold;
    safe.recovery_votes = vec_map::empty(); // Clear pending votes

    event::emit(GuardiansUpdated {
        safe_id: object::id(safe),
        guardians,
        threshold
    });
}

// === Safe Destruction ===

/// Disable the safe and return Cap to owner
public fun disable_safe(safe: Safe, ctx: &TxContext) {
    let Safe {
        id,
        vault_id,
        owner,
        cap,
        guardians: _,
        threshold: _,
        recovery_votes: _,
        beneficiary: _,
        inactivity_period_ms: _,
        last_activity_ms: _,
        deadman_claimed: _,
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

// === View Functions ===

public fun safe_owner(safe: &Safe): address {
    safe.owner
}

public fun safe_vault_id(safe: &Safe): ID {
    safe.vault_id
}

public fun safe_guardians(safe: &Safe): vector<address> {
    safe.guardians
}

public fun safe_threshold(safe: &Safe): u64 {
    safe.threshold
}

public fun safe_beneficiary(safe: &Safe): Option<address> {
    safe.beneficiary
}

public fun safe_inactivity_period_ms(safe: &Safe): u64 {
    safe.inactivity_period_ms
}

public fun safe_last_activity_ms(safe: &Safe): u64 {
    safe.last_activity_ms
}

public fun safe_deadman_claimed(safe: &Safe): bool {
    safe.deadman_claimed
}

public fun has_cap(safe: &Safe): bool {
    option::is_some(&safe.cap)
}

// === Test Helpers ===

#[test_only]
public fun create_safe_for_testing(
    vault: &Vault,
    cap: Cap,
    guardians: vector<address>,
    threshold: u64,
    beneficiary: Option<address>,
    inactivity_period_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext
): Safe {
    assert!(passman::vault::verify_cap(&cap, vault), ENotOwner);

    if (guardians.length() > 0) {
        assert!(threshold > 0 && threshold <= guardians.length(), EInvalidThreshold);
    };

    if (option::is_some(&beneficiary)) {
        assert!(inactivity_period_ms >= MIN_INACTIVITY_PERIOD_MS, EMinimumPeriod);
    };

    Safe {
        id: object::new(ctx),
        vault_id: object::id(vault),
        owner: ctx.sender(),
        cap: option::some(cap),
        guardians,
        threshold,
        recovery_votes: vec_map::empty(),
        beneficiary,
        inactivity_period_ms,
        last_activity_ms: clock.timestamp_ms(),
        deadman_claimed: false,
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
public fun share_safe_for_testing(safe: Safe) {
    transfer::share_object(safe);
}

