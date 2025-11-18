module passman::deadman;

use sui::clock::Clock;
use sui::event;
use passman::vault::{Vault, Cap};

const ENotOwner: u64 = 1;
const ENotBeneficiary: u64 = 2;
const ENotExpired: u64 = 3;
const EAlreadyClaimed: u64 = 4;
const EMinimumPeriod: u64 = 5;

public struct DeadManSwitch has key {
    id: UID,
    vault_id: ID,
    beneficiary: address,
    inactivity_period_ms: u64,
    last_activity_ms: u64,
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
    cap: &Cap,
    beneficiary: address,
    inactivity_period_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(passman::vault::verify_cap(cap, vault), ENotOwner);
    assert!(inactivity_period_ms >= 7 * 24 * 60 * 60 * 1000, EMinimumPeriod);

    let switch = DeadManSwitch {
        id: object::new(ctx),
        vault_id: object::id(vault),
        beneficiary,
        inactivity_period_ms,
        last_activity_ms: clock.timestamp_ms(),
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
    vault: &Vault,
    cap: &Cap,
    beneficiary: address,
    inactivity_period_ms: u64,
    clock: &Clock
) {
    assert!(passman::vault::verify_cap(cap, vault), ENotOwner);
    assert!(switch.vault_id == object::id(vault), ENotOwner);
    assert!(inactivity_period_ms >= 7 * 24 * 60 * 60 * 1000, EMinimumPeriod);

    switch.beneficiary = beneficiary;
    switch.inactivity_period_ms = inactivity_period_ms;
    switch.last_activity_ms = clock.timestamp_ms();

    event::emit(SwitchUpdated {
        vault_id: object::id(vault),
        period_days: inactivity_period_ms / 86400000
    });
}

entry fun heartbeat(
    switch: &mut DeadManSwitch,
    vault: &Vault,
    cap: &Cap,
    clock: &Clock
) {
    assert!(passman::vault::verify_cap(cap, vault), ENotOwner);
    assert!(switch.vault_id == object::id(vault), ENotOwner);
    switch.last_activity_ms = clock.timestamp_ms();
}

entry fun claim(
    switch: &mut DeadManSwitch,
    _vault: &Vault,
    old_cap: Cap,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(!switch.claimed, EAlreadyClaimed);
    assert!(ctx.sender() == switch.beneficiary, ENotBeneficiary);

    let now = clock.timestamp_ms();
    assert!(now >= switch.last_activity_ms + switch.inactivity_period_ms, ENotExpired);

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
    vault: &Vault,
    cap: &Cap
) {
    assert!(passman::vault::verify_cap(cap, vault), ENotOwner);
    assert!(switch.vault_id == object::id(vault), ENotOwner);
    assert!(!switch.claimed, EAlreadyClaimed);

    let DeadManSwitch { id, vault_id, .. } = switch;
    object::delete(id);

    event::emit(SwitchDisabled { vault_id });
}

