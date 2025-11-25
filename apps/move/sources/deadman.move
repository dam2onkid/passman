module passman::deadman;

use sui::clock::Clock;
use sui::event;
use passman::vault::{Vault, Cap};

const ENotOwner: u64 = 1;
const ENotBeneficiary: u64 = 2;
const ENotExpired: u64 = 3;
const EAlreadyClaimed: u64 = 4;
const EMinimumPeriod: u64 = 5;
const ECapAlreadyTaken: u64 = 6;

public struct DeadManSwitch has key {
    id: UID,
    vault_id: ID,
    owner: address,
    beneficiary: address,
    inactivity_period_ms: u64,
    last_activity_ms: u64,
    cap: Option<Cap>,
    claimed: bool
}

public struct SwitchCreated has copy, drop {
    vault_id: ID,
    beneficiary: address,
    period_days: u64
}

public struct SwitchUpdated has copy, drop {
    vault_id: ID,
    period_days: u64
}

public struct SwitchClaimed has copy, drop {
    vault_id: ID,
    beneficiary: address,
    claimed_at: u64
}

public struct SwitchDisabled has copy, drop {
    vault_id: ID
}

entry fun setup(
    vault: &Vault,
    cap: Cap,
    beneficiary: address,
    inactivity_period_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(passman::vault::verify_cap(&cap, vault), ENotOwner);
    assert!(inactivity_period_ms >= 7 * 24 * 60 * 60 * 1000, EMinimumPeriod);

    let switch = DeadManSwitch {
        id: object::new(ctx),
        vault_id: object::id(vault),
        owner: ctx.sender(),
        beneficiary,
        inactivity_period_ms,
        last_activity_ms: clock.timestamp_ms(),
        cap: option::some(cap),
        claimed: false
    };

    event::emit(SwitchCreated {
        vault_id: object::id(vault),
        beneficiary,
        period_days: inactivity_period_ms / 86400000
    });

    transfer::share_object(switch);
}

entry fun update(
    switch: &mut DeadManSwitch,
    beneficiary: address,
    inactivity_period_ms: u64,
    clock: &Clock,
    ctx: &TxContext
) {
    assert!(ctx.sender() == switch.owner, ENotOwner);
    assert!(inactivity_period_ms >= 7 * 24 * 60 * 60 * 1000, EMinimumPeriod);

    switch.beneficiary = beneficiary;
    switch.inactivity_period_ms = inactivity_period_ms;
    switch.last_activity_ms = clock.timestamp_ms();

    event::emit(SwitchUpdated {
        vault_id: switch.vault_id,
        period_days: inactivity_period_ms / 86400000
    });
}

entry fun heartbeat(
    switch: &mut DeadManSwitch,
    clock: &Clock,
    ctx: &TxContext
) {
    assert!(ctx.sender() == switch.owner, ENotOwner);
    switch.last_activity_ms = clock.timestamp_ms();
}

entry fun claim(
    switch: &mut DeadManSwitch,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(!switch.claimed, EAlreadyClaimed);
    assert!(ctx.sender() == switch.beneficiary, ENotBeneficiary);
    assert!(option::is_some(&switch.cap), ECapAlreadyTaken);

    let now = clock.timestamp_ms();
    assert!(now >= switch.last_activity_ms + switch.inactivity_period_ms, ENotExpired);

    let old_cap = option::extract(&mut switch.cap);
    passman::vault::transfer_ownership(old_cap, switch.beneficiary, ctx);

    switch.claimed = true;

    event::emit(SwitchClaimed {
        vault_id: switch.vault_id,
        beneficiary: switch.beneficiary,
        claimed_at: now
    });
}

entry fun disable(
    switch: DeadManSwitch,
    ctx: &TxContext
) {
    let DeadManSwitch { id, vault_id, owner, cap, claimed, .. } = switch;

    assert!(ctx.sender() == owner, ENotOwner);
    assert!(!claimed, EAlreadyClaimed);

    if (option::is_some(&cap)) {
        let old_cap = option::destroy_some(cap);
        transfer::public_transfer(old_cap, owner);
    } else {
        option::destroy_none(cap);
    };

    object::delete(id);

    event::emit(SwitchDisabled { vault_id });
}

// === Test Helpers ===

#[test_only]
public fun create_switch_for_testing(
    vault: &Vault,
    cap: Cap,
    beneficiary: address,
    inactivity_period_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext
): DeadManSwitch {
    assert!(passman::vault::verify_cap(&cap, vault), ENotOwner);

    DeadManSwitch {
        id: object::new(ctx),
        vault_id: object::id(vault),
        owner: ctx.sender(),
        beneficiary,
        inactivity_period_ms,
        last_activity_ms: clock.timestamp_ms(),
        cap: option::some(cap),
        claimed: false
    }
}

#[test_only]
public fun destroy_switch_for_testing(switch: DeadManSwitch) {
    let DeadManSwitch { id, cap, .. } = switch;
    if (option::is_some(&cap)) {
        let c = option::destroy_some(cap);
        passman::vault::destroy_cap_for_testing(c);
    } else {
        option::destroy_none(cap);
    };
    object::delete(id);
}

#[test_only]
public fun switch_owner(switch: &DeadManSwitch): address {
    switch.owner
}

#[test_only]
public fun switch_beneficiary(switch: &DeadManSwitch): address {
    switch.beneficiary
}

#[test_only]
public fun switch_claimed(switch: &DeadManSwitch): bool {
    switch.claimed
}

