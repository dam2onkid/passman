#[test_only]
module passman::passman_tests;

use std::string::utf8;
use sui::clock;
use sui::test_scenario::{Self as ts};
use passman::vault::{Self, Vault};
use passman::deadman::{Self, DeadManSwitch};
use passman::share::{Self};
use passman::recovery::{Self, Safe};

const OWNER: address = @0xA;
const BENEFICIARY: address = @0xB;
const GUARDIAN1: address = @0xC;
const GUARDIAN2: address = @0xD;
const GUARDIAN3: address = @0xE;
const RECIPIENT: address = @0xF;

const ONE_WEEK_MS: u64 = 7 * 24 * 60 * 60 * 1000;

// ============================================
// VAULT TESTS
// ============================================

#[test]
fun test_vault_create() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();

    let (vault, cap) = vault::create_vault_for_testing(ctx);

    assert!(vault::verify_cap(&cap, &vault), 0);

    vault::destroy_cap_for_testing(cap);
    vault::destroy_vault_for_testing(vault);
    scenario.end();
}

#[test]
fun test_vault_create_item() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();

    let (mut vault, cap) = vault::create_vault_for_testing(ctx);
    let item = vault::create_item_for_testing(&cap, &mut vault, ctx);

    assert!(vault::item_vault_id(&item) == object::id(&vault), 0);

    vault::destroy_item_for_testing(item);
    vault::destroy_cap_for_testing(cap);
    vault::destroy_vault_for_testing(vault);
    scenario.end();
}

#[test]
fun test_vault_update_item() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();

    let (mut vault, cap) = vault::create_vault_for_testing(ctx);
    let mut item = vault::create_item_for_testing(&cap, &mut vault, ctx);

    vault::update_item(&cap, utf8(b"updated_name"), utf8(b"new_blob"), &mut item);

    vault::destroy_item_for_testing(item);
    vault::destroy_cap_for_testing(cap);
    vault::destroy_vault_for_testing(vault);
    scenario.end();
}

#[test, expected_failure(abort_code = vault::ENotAuthorized)]
fun test_vault_create_item_wrong_cap() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();

    let (mut vault1, _cap1) = vault::create_vault_for_testing(ctx);
    let (_vault2, cap2) = vault::create_vault_for_testing(ctx);

    let _item = vault::create_item_for_testing(&cap2, &mut vault1, ctx);

    abort 0
}

// ============================================
// DEADMAN SWITCH TESTS
// ============================================

#[test]
fun test_deadman_setup() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);

    let (vault, cap) = vault::create_vault_for_testing(ctx);
    let switch = deadman::create_switch_for_testing(
        &vault,
        cap,
        BENEFICIARY,
        ONE_WEEK_MS,
        &clock,
        ctx
    );

    assert!(deadman::switch_owner(&switch) == OWNER, 0);
    assert!(deadman::switch_beneficiary(&switch) == BENEFICIARY, 1);
    assert!(!deadman::switch_claimed(&switch), 2);

    deadman::destroy_switch_for_testing(switch);
    vault::destroy_vault_for_testing(vault);
    clock::destroy_for_testing(clock);
    scenario.end();
}

#[test]
fun test_deadman_heartbeat() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let switch = deadman::create_switch_for_testing(
            &vault,
            cap,
            BENEFICIARY,
            ONE_WEEK_MS,
            &clock,
            ctx
        );
        deadman::share_switch_for_testing(switch);
        vault::transfer_vault_for_testing(vault, OWNER);
        clock::share_for_testing(clock);
    };

    scenario.next_tx(OWNER);
    {
        let mut switch = scenario.take_shared<DeadManSwitch>();
        let clock = scenario.take_shared<clock::Clock>();

        deadman::heartbeat(&mut switch, &clock, scenario.ctx());

        ts::return_shared(switch);
        ts::return_shared(clock);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = deadman::ENotOwner)]
fun test_deadman_heartbeat_not_owner() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let switch = deadman::create_switch_for_testing(
            &vault,
            cap,
            BENEFICIARY,
            ONE_WEEK_MS,
            &clock,
            ctx
        );
        deadman::share_switch_for_testing(switch);
        vault::transfer_vault_for_testing(vault, OWNER);
        clock::share_for_testing(clock);
    };

    scenario.next_tx(BENEFICIARY);
    {
        let mut switch = scenario.take_shared<DeadManSwitch>();
        let clock = scenario.take_shared<clock::Clock>();

        deadman::heartbeat(&mut switch, &clock, scenario.ctx());

        ts::return_shared(switch);
        ts::return_shared(clock);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = deadman::ENotExpired)]
fun test_deadman_claim_not_expired() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let switch = deadman::create_switch_for_testing(
            &vault,
            cap,
            BENEFICIARY,
            ONE_WEEK_MS,
            &clock,
            ctx
        );
        deadman::share_switch_for_testing(switch);
        vault::transfer_vault_for_testing(vault, OWNER);
        clock::share_for_testing(clock);
    };

    scenario.next_tx(BENEFICIARY);
    {
        let mut switch = scenario.take_shared<DeadManSwitch>();
        let clock = scenario.take_shared<clock::Clock>();

        deadman::claim(&mut switch, &clock, scenario.ctx());

        ts::return_shared(switch);
        ts::return_shared(clock);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = deadman::EMinimumPeriod)]
fun test_deadman_setup_period_too_short() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);

    let (vault, cap) = vault::create_vault_for_testing(ctx);
    let _switch = deadman::create_switch_for_testing(
        &vault,
        cap,
        BENEFICIARY,
        1000,
        &clock,
        ctx
    );

    abort 0
}

// ============================================
// SHARE TESTS
// ============================================

#[test]
fun test_share_create() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();

    let (mut vault, cap) = vault::create_vault_for_testing(ctx);
    let item = vault::create_item_for_testing(&cap, &mut vault, ctx);

    let recipients = vector[RECIPIENT];
    let (share, share_cap) = share::create_share_for_testing(
        &vault,
        &item,
        recipients,
        0,
        3600000,
        ctx
    );

    assert!(share::share_recipients(&share) == recipients, 0);
    assert!(share::share_ttl(&share) == 3600000, 1);

    share::destroy_share_for_testing(share, share_cap);
    vault::destroy_item_for_testing(item);
    vault::destroy_cap_for_testing(cap);
    vault::destroy_vault_for_testing(vault);
    scenario.end();
}

#[test]
fun test_share_update() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();

    let (mut vault, cap) = vault::create_vault_for_testing(ctx);
    let item = vault::create_item_for_testing(&cap, &mut vault, ctx);

    let recipients = vector[RECIPIENT];
    let (mut share, share_cap) = share::create_share_for_testing(
        &vault,
        &item,
        recipients,
        0,
        3600000,
        ctx
    );

    let new_recipients = vector[RECIPIENT, BENEFICIARY];
    share::update_share_item(&share_cap, &mut share, new_recipients, 7200000);

    assert!(share::share_recipients(&share) == new_recipients, 0);
    assert!(share::share_ttl(&share) == 7200000, 1);

    share::destroy_share_for_testing(share, share_cap);
    vault::destroy_item_for_testing(item);
    vault::destroy_cap_for_testing(cap);
    vault::destroy_vault_for_testing(vault);
    scenario.end();
}

#[test]
fun test_share_delete() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();

    let (mut vault, cap) = vault::create_vault_for_testing(ctx);
    let item = vault::create_item_for_testing(&cap, &mut vault, ctx);

    let recipients = vector[RECIPIENT];
    let (share, share_cap) = share::create_share_for_testing(
        &vault,
        &item,
        recipients,
        0,
        3600000,
        ctx
    );

    share::delete_share_item(share_cap, share);

    vault::destroy_item_for_testing(item);
    vault::destroy_cap_for_testing(cap);
    vault::destroy_vault_for_testing(vault);
    scenario.end();
}

#[test, expected_failure(abort_code = share::ENotAuthorized)]
fun test_share_update_wrong_cap() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();

    let (mut vault, cap) = vault::create_vault_for_testing(ctx);
    let item = vault::create_item_for_testing(&cap, &mut vault, ctx);

    let (mut share1, _share_cap1) = share::create_share_for_testing(
        &vault, &item, vector[RECIPIENT], 0, 3600000, ctx
    );
    let (_share2, share_cap2) = share::create_share_for_testing(
        &vault, &item, vector[BENEFICIARY], 0, 3600000, ctx
    );

    share::update_share_item(&share_cap2, &mut share1, vector[OWNER], 1000);

    abort 0
}

// ============================================
// RECOVERY TESTS
// ============================================

#[test]
fun test_recovery_create_safe() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();

    let (vault, cap) = vault::create_vault_for_testing(ctx);
    let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];

    let safe = recovery::create_safe_for_testing(&vault, cap, guardians, 2, ctx);

    assert!(recovery::safe_owner(&safe) == OWNER, 0);
    assert!(recovery::safe_threshold(&safe) == 2, 1);
    assert!(recovery::safe_guardians(&safe) == guardians, 2);

    recovery::destroy_safe_for_testing(safe);
    vault::destroy_vault_for_testing(vault);
    scenario.end();
}

#[test]
fun test_recovery_borrow_and_return_cap() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];
        let safe = recovery::create_safe_for_testing(&vault, cap, guardians, 2, ctx);

        recovery::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
    };

    scenario.next_tx(OWNER);
    {
        let mut safe = scenario.take_shared<Safe>();
        let vault = scenario.take_from_sender<Vault>();

        let (cap, receipt) = recovery::borrow_cap(&mut safe, scenario.ctx());

        assert!(vault::verify_cap(&cap, &vault), 0);

        recovery::return_cap(&mut safe, cap, receipt);

        ts::return_shared(safe);
        ts::return_to_sender(&scenario, vault);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = recovery::ENotOwner)]
fun test_recovery_borrow_cap_not_owner() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];
        let safe = recovery::create_safe_for_testing(&vault, cap, guardians, 2, ctx);

        recovery::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
    };

    scenario.next_tx(GUARDIAN1);
    {
        let mut safe = scenario.take_shared<Safe>();
        let (_cap, _receipt) = recovery::borrow_cap(&mut safe, scenario.ctx());

        abort 0
    }
}

#[test]
fun test_recovery_approve_single_vote() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];
        let safe = recovery::create_safe_for_testing(&vault, cap, guardians, 2, ctx);

        recovery::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
    };

    scenario.next_tx(GUARDIAN1);
    {
        let mut safe = scenario.take_shared<Safe>();

        recovery::approve_recovery(&mut safe, BENEFICIARY, scenario.ctx());

        assert!(recovery::safe_owner(&safe) == OWNER, 0);

        ts::return_shared(safe);
    };

    scenario.end();
}

#[test]
fun test_recovery_approve_threshold_met() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];
        let safe = recovery::create_safe_for_testing(&vault, cap, guardians, 2, ctx);

        recovery::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
    };

    scenario.next_tx(GUARDIAN1);
    {
        let mut safe = scenario.take_shared<Safe>();
        recovery::approve_recovery(&mut safe, BENEFICIARY, scenario.ctx());
        ts::return_shared(safe);
    };

    scenario.next_tx(GUARDIAN2);
    {
        let mut safe = scenario.take_shared<Safe>();
        recovery::approve_recovery(&mut safe, BENEFICIARY, scenario.ctx());

        assert!(recovery::safe_owner(&safe) == BENEFICIARY, 0);

        ts::return_shared(safe);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = recovery::ENotGuardian)]
fun test_recovery_approve_not_guardian() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];
        let safe = recovery::create_safe_for_testing(&vault, cap, guardians, 2, ctx);

        recovery::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
    };

    scenario.next_tx(RECIPIENT);
    {
        let mut safe = scenario.take_shared<Safe>();
        recovery::approve_recovery(&mut safe, BENEFICIARY, scenario.ctx());
        ts::return_shared(safe);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = recovery::EDuplicateVote)]
fun test_recovery_approve_duplicate_vote() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];
        let safe = recovery::create_safe_for_testing(&vault, cap, guardians, 2, ctx);

        recovery::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
    };

    scenario.next_tx(GUARDIAN1);
    {
        let mut safe = scenario.take_shared<Safe>();
        recovery::approve_recovery(&mut safe, BENEFICIARY, scenario.ctx());
        recovery::approve_recovery(&mut safe, BENEFICIARY, scenario.ctx());
        ts::return_shared(safe);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = recovery::EInvalidThreshold)]
fun test_recovery_create_safe_invalid_threshold_zero() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();

    let (vault, cap) = vault::create_vault_for_testing(ctx);
    let guardians = vector[GUARDIAN1, GUARDIAN2];

    let _safe = recovery::create_safe_for_testing(&vault, cap, guardians, 0, ctx);

    abort 0
}

#[test, expected_failure(abort_code = recovery::EInvalidThreshold)]
fun test_recovery_create_safe_invalid_threshold_too_high() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();

    let (vault, cap) = vault::create_vault_for_testing(ctx);
    let guardians = vector[GUARDIAN1, GUARDIAN2];

    let _safe = recovery::create_safe_for_testing(&vault, cap, guardians, 5, ctx);

    abort 0
}
