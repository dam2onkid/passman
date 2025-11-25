#[test_only]
module passman::passman_tests;

use std::string::utf8;
use sui::clock;
use sui::test_scenario::{Self as ts};
use passman::vault::{Self, Vault};
use passman::safe::{Self, Safe};
use passman::share::{Self};

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
// SAFE TESTS - Social Recovery
// ============================================

#[test]
fun test_safe_create_with_guardians() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);

    let (vault, cap) = vault::create_vault_for_testing(ctx);
    let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];

    let safe = safe::create_safe_for_testing(
        &vault,
        cap,
        guardians,
        2,
        option::none(), // No deadman switch
        0,
        &clock,
        ctx
    );

    assert!(safe::safe_owner(&safe) == OWNER, 0);
    assert!(safe::safe_threshold(&safe) == 2, 1);
    assert!(safe::safe_guardians(&safe) == guardians, 2);
    assert!(option::is_none(&safe::safe_beneficiary(&safe)), 3);

    safe::destroy_safe_for_testing(safe);
    vault::destroy_vault_for_testing(vault);
    clock::destroy_for_testing(clock);
    scenario.end();
}

#[test]
fun test_safe_borrow_and_return_cap() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];
        let safe = safe::create_safe_for_testing(
            &vault, cap, guardians, 2, option::none(), 0, &clock, ctx
        );

        safe::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
        clock::share_for_testing(clock);
    };

    scenario.next_tx(OWNER);
    {
        let mut safe = scenario.take_shared<Safe>();
        let vault = scenario.take_from_sender<Vault>();

        let (cap, receipt) = safe::borrow_cap(&mut safe, scenario.ctx());

        assert!(vault::verify_cap(&cap, &vault), 0);

        safe::return_cap(&mut safe, cap, receipt);

        ts::return_shared(safe);
        ts::return_to_sender(&scenario, vault);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = safe::ENotOwner)]
fun test_safe_borrow_cap_not_owner() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];
        let safe = safe::create_safe_for_testing(
            &vault, cap, guardians, 2, option::none(), 0, &clock, ctx
        );

        safe::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
        clock::share_for_testing(clock);
    };

    scenario.next_tx(GUARDIAN1);
    {
        let mut safe = scenario.take_shared<Safe>();
        let (_cap, _receipt) = safe::borrow_cap(&mut safe, scenario.ctx());

        abort 0
    }
}

#[test]
fun test_safe_approve_single_vote() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];
        let safe = safe::create_safe_for_testing(
            &vault, cap, guardians, 2, option::none(), 0, &clock, ctx
        );

        safe::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
        clock::share_for_testing(clock);
    };

    scenario.next_tx(GUARDIAN1);
    {
        let mut safe = scenario.take_shared<Safe>();

        safe::approve_recovery(&mut safe, BENEFICIARY, scenario.ctx());

        // Threshold not met, owner unchanged
        assert!(safe::safe_owner(&safe) == OWNER, 0);

        ts::return_shared(safe);
    };

    scenario.end();
}

#[test]
fun test_safe_approve_threshold_met() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];
        let safe = safe::create_safe_for_testing(
            &vault, cap, guardians, 2, option::none(), 0, &clock, ctx
        );

        safe::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
        clock::share_for_testing(clock);
    };

    scenario.next_tx(GUARDIAN1);
    {
        let mut safe = scenario.take_shared<Safe>();
        safe::approve_recovery(&mut safe, BENEFICIARY, scenario.ctx());
        ts::return_shared(safe);
    };

    scenario.next_tx(GUARDIAN2);
    {
        let mut safe = scenario.take_shared<Safe>();
        safe::approve_recovery(&mut safe, BENEFICIARY, scenario.ctx());

        // Threshold met, owner changed
        assert!(safe::safe_owner(&safe) == BENEFICIARY, 0);

        ts::return_shared(safe);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = safe::ENotGuardian)]
fun test_safe_approve_not_guardian() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];
        let safe = safe::create_safe_for_testing(
            &vault, cap, guardians, 2, option::none(), 0, &clock, ctx
        );

        safe::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
        clock::share_for_testing(clock);
    };

    scenario.next_tx(RECIPIENT);
    {
        let mut safe = scenario.take_shared<Safe>();
        safe::approve_recovery(&mut safe, BENEFICIARY, scenario.ctx());
        ts::return_shared(safe);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = safe::EDuplicateVote)]
fun test_safe_approve_duplicate_vote() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];
        let safe = safe::create_safe_for_testing(
            &vault, cap, guardians, 2, option::none(), 0, &clock, ctx
        );

        safe::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
        clock::share_for_testing(clock);
    };

    scenario.next_tx(GUARDIAN1);
    {
        let mut safe = scenario.take_shared<Safe>();
        safe::approve_recovery(&mut safe, BENEFICIARY, scenario.ctx());
        safe::approve_recovery(&mut safe, BENEFICIARY, scenario.ctx());
        ts::return_shared(safe);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = safe::EInvalidThreshold)]
fun test_safe_create_invalid_threshold_zero() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);

    let (vault, cap) = vault::create_vault_for_testing(ctx);
    let guardians = vector[GUARDIAN1, GUARDIAN2];

    let _safe = safe::create_safe_for_testing(
        &vault, cap, guardians, 0, option::none(), 0, &clock, ctx
    );

    abort 0
}

#[test, expected_failure(abort_code = safe::EInvalidThreshold)]
fun test_safe_create_invalid_threshold_too_high() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);

    let (vault, cap) = vault::create_vault_for_testing(ctx);
    let guardians = vector[GUARDIAN1, GUARDIAN2];

    let _safe = safe::create_safe_for_testing(
        &vault, cap, guardians, 5, option::none(), 0, &clock, ctx
    );

    abort 0
}

// ============================================
// SAFE TESTS - Deadman Switch
// ============================================

#[test]
fun test_safe_create_with_deadman() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);

    let (vault, cap) = vault::create_vault_for_testing(ctx);

    let safe = safe::create_safe_for_testing(
        &vault,
        cap,
        vector::empty(), // No guardians
        0,
        option::some(BENEFICIARY),
        ONE_WEEK_MS,
        &clock,
        ctx
    );

    assert!(safe::safe_owner(&safe) == OWNER, 0);
    assert!(safe::safe_beneficiary(&safe) == option::some(BENEFICIARY), 1);
    assert!(!safe::safe_deadman_claimed(&safe), 2);

    safe::destroy_safe_for_testing(safe);
    vault::destroy_vault_for_testing(vault);
    clock::destroy_for_testing(clock);
    scenario.end();
}

#[test]
fun test_safe_create_with_both_features() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);

    let (vault, cap) = vault::create_vault_for_testing(ctx);
    let guardians = vector[GUARDIAN1, GUARDIAN2, GUARDIAN3];

    let safe = safe::create_safe_for_testing(
        &vault,
        cap,
        guardians,
        2,
        option::some(BENEFICIARY),
        ONE_WEEK_MS,
        &clock,
        ctx
    );

    // Check both features are enabled
    assert!(safe::safe_owner(&safe) == OWNER, 0);
    assert!(safe::safe_threshold(&safe) == 2, 1);
    assert!(safe::safe_guardians(&safe) == guardians, 2);
    assert!(safe::safe_beneficiary(&safe) == option::some(BENEFICIARY), 3);
    assert!(!safe::safe_deadman_claimed(&safe), 4);

    safe::destroy_safe_for_testing(safe);
    vault::destroy_vault_for_testing(vault);
    clock::destroy_for_testing(clock);
    scenario.end();
}

#[test]
fun test_safe_heartbeat() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let safe = safe::create_safe_for_testing(
            &vault,
            cap,
            vector::empty(),
            0,
            option::some(BENEFICIARY),
            ONE_WEEK_MS,
            &clock,
            ctx
        );
        safe::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
        clock::share_for_testing(clock);
    };

    scenario.next_tx(OWNER);
    {
        let mut safe = scenario.take_shared<Safe>();
        let clock = scenario.take_shared<clock::Clock>();

        safe::heartbeat(&mut safe, &clock, scenario.ctx());

        ts::return_shared(safe);
        ts::return_shared(clock);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = safe::ENotOwner)]
fun test_safe_heartbeat_not_owner() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let safe = safe::create_safe_for_testing(
            &vault,
            cap,
            vector::empty(),
            0,
            option::some(BENEFICIARY),
            ONE_WEEK_MS,
            &clock,
            ctx
        );
        safe::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
        clock::share_for_testing(clock);
    };

    scenario.next_tx(BENEFICIARY);
    {
        let mut safe = scenario.take_shared<Safe>();
        let clock = scenario.take_shared<clock::Clock>();

        safe::heartbeat(&mut safe, &clock, scenario.ctx());

        ts::return_shared(safe);
        ts::return_shared(clock);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = safe::ENotExpired)]
fun test_safe_claim_not_expired() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let safe = safe::create_safe_for_testing(
            &vault,
            cap,
            vector::empty(),
            0,
            option::some(BENEFICIARY),
            ONE_WEEK_MS,
            &clock,
            ctx
        );
        safe::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
        clock::share_for_testing(clock);
    };

    scenario.next_tx(BENEFICIARY);
    {
        let mut safe = scenario.take_shared<Safe>();
        let clock = scenario.take_shared<clock::Clock>();

        safe::claim(&mut safe, &clock, scenario.ctx());

        ts::return_shared(safe);
        ts::return_shared(clock);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = safe::EMinimumPeriod)]
fun test_safe_create_deadman_period_too_short() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);

    let (vault, cap) = vault::create_vault_for_testing(ctx);
    let _safe = safe::create_safe_for_testing(
        &vault,
        cap,
        vector::empty(),
        0,
        option::some(BENEFICIARY),
        1000, // Too short
        &clock,
        ctx
    );

    abort 0
}

#[test, expected_failure(abort_code = safe::EDeadmanNotEnabled)]
fun test_safe_claim_deadman_not_enabled() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        // Create safe without deadman switch
        let safe = safe::create_safe_for_testing(
            &vault,
            cap,
            vector[GUARDIAN1, GUARDIAN2],
            2,
            option::none(), // No beneficiary = no deadman
            0,
            &clock,
            ctx
        );
        safe::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
        clock::share_for_testing(clock);
    };

    scenario.next_tx(BENEFICIARY);
    {
        let mut safe = scenario.take_shared<Safe>();
        let clock = scenario.take_shared<clock::Clock>();

        safe::claim(&mut safe, &clock, scenario.ctx());

        ts::return_shared(safe);
        ts::return_shared(clock);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = safe::ENotBeneficiary)]
fun test_safe_claim_not_beneficiary() {
    let mut scenario = ts::begin(OWNER);
    {
        let ctx = scenario.ctx();
        let clock = clock::create_for_testing(ctx);
        let (vault, cap) = vault::create_vault_for_testing(ctx);
        let safe = safe::create_safe_for_testing(
            &vault,
            cap,
            vector::empty(),
            0,
            option::some(BENEFICIARY),
            ONE_WEEK_MS,
            &clock,
            ctx
        );
        safe::share_safe_for_testing(safe);
        vault::transfer_vault_for_testing(vault, OWNER);
        clock::share_for_testing(clock);
    };

    // Someone who is not the beneficiary tries to claim
    scenario.next_tx(RECIPIENT);
    {
        let mut safe = scenario.take_shared<Safe>();
        let clock = scenario.take_shared<clock::Clock>();

        safe::claim(&mut safe, &clock, scenario.ctx());

        ts::return_shared(safe);
        ts::return_shared(clock);
    };

    scenario.end();
}

// ============================================
// SAFE TESTS - No features (just cap storage)
// ============================================

#[test]
fun test_safe_create_minimal() {
    let mut scenario = ts::begin(OWNER);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);

    let (vault, cap) = vault::create_vault_for_testing(ctx);

    // Create safe with no guardians and no deadman switch
    let safe = safe::create_safe_for_testing(
        &vault,
        cap,
        vector::empty(),
        0,
        option::none(),
        0,
        &clock,
        ctx
    );

    assert!(safe::safe_owner(&safe) == OWNER, 0);
    assert!(safe::safe_guardians(&safe).length() == 0, 1);
    assert!(option::is_none(&safe::safe_beneficiary(&safe)), 2);
    assert!(safe::has_cap(&safe), 3);

    safe::destroy_safe_for_testing(safe);
    vault::destroy_vault_for_testing(vault);
    clock::destroy_for_testing(clock);
    scenario.end();
}
