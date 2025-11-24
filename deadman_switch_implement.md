# Tính năng Dead-man switch bạn sẽ có

```move
// deadman.move
module passman::deadman;

use sui::clock::Clock;
use sui::event;
use passman::vault::{Vault, Cap};

/// Lỗi
const ENotOwner: u64 = 1;
const ENotBeneficiary: u64 = 2;
const ENotExpired: u64 = 3;
const EAlreadyClaimed: u64 = 4;
const ENoSwitch: u64 = 5;

/// Dead-man switch object (mỗi vault chỉ có tối đa 1 cái)
public struct DeadManSwitch has key {
    id: UID,
    vault_id: ID,
    beneficiary: address,         // người thừa kế
    inactivity_period_ms: u64,    // do user tự chọn: 30 ngày, 1 năm, 3 năm...
    last_activity_ms: u64,        // lần cuối owner tương tác
    claimed: bool
}

/// Event
public struct SwitchCreated has copy, drop { vault_id: ID, beneficiary: address, period_days: u64 }
public struct SwitchUpdated has copy, drop { vault_id: ID, period_days: u64 }
public struct SwitchClaimed has copy, drop { vault_id: ID, beneficiary: address, claimed_at: u64 }
public struct SwitchDisabled has copy, drop { vault_id: ID }

/// 1. Kích hoạt / Cập nhật Dead-man switch (owner gọi)
entry fun setup_or_update(
    vault: &Vault,
    cap: &Cap,
    beneficiary: address,
    inactivity_period_ms: u64,   // user tự truyền vào (ví dụ 180 ngày = 180*86400000)
    clock: &Clock,
    switch_opt: Option<DeadManSwitch>,  // nếu đã có thì update, chưa có thì tạo mới
    ctx: &mut TxContext
) {
    assert!(cap.vault_id == object::id(vault), ENotOwner);
    assert!(inactivity_period_ms >= 7 * 24 * 60 * 60 * 1000, 100); // tối thiểu 7 ngày

    let now = clock.timestamp_ms();

    if (option::is_none(&switch_opt)) {
        // Tạo mới
        let switch = DeadManSwitch {
            id: object::new(ctx),
            vault_id: object::id(vault),
            beneficiary,
            inactivity_period_ms,
            last_activity_ms: now,
            claimed: false
        };
        event::emit(SwitchCreated {
            vault_id: object::id(vault),
            beneficiary,
            period_days: inactivity_period_ms / 86400000
        });
        transfer::share_object(switch);
    } else {
        // Cập nhật cái cũ
        let mut switch = option::extract(&mut switch_opt);
        switch.beneficiary = beneficiary;
        switch.inactivity_period_ms = inactivity_period_ms;
        switch.last_activity_ms = now;   // reset lại khi thay đổi
        event::emit(SwitchUpdated {
            vault_id: object::id(vault),
            period_days: inactivity_period_ms / 86400000
        });
        transfer::transfer(switch, tx_context::sender(ctx));
    }
}

/// 2. Owner bấm "Tôi vẫn còn sống" → reset timer
entry fun heartbeat(
    switch: &mut DeadManSwitch,
    vault: &Vault,
    cap: &Cap,
    clock: &Clock
) {
    assert!(cap.vault_id == object::id(vault), ENotOwner);
    assert!(switch.vault_id == object::id(vault), ENotOwner);
    switch.last_activity_ms = clock.timestamp_ms();
}

/// 3. Người thừa kế bấm Claim khi đủ thời gian
entry fun claim(
    switch: &mut DeadManSwitch,
    vault: &mut Vault,
    old_cap: Cap,            // Cap cũ của owner → sẽ bị huỷ
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(!switch.claimed, EAlreadyClaimed);
    assert!(tx_context::sender(ctx) == switch.beneficiary, ENotBeneficiary);

    let now = clock.timestamp_ms();
    assert!(now >= switch.last_activity_ms + switch.inactivity_period_ms, ENotExpired);

    // Huỷ Cap cũ → owner cũ mất quyền mãi mãi
    let Cap { id: cap_id, .. } = old_cap;
    object::delete(cap_id);

    // Tạo Cap mới cho beneficiary
    let new_cap = Cap {
        id: object::new(ctx),
        vault_id: object::id(vault)
    };

    switch.claimed = true;

    event::emit(SwitchClaimed {
        vault_id: switch.vault_id,
        beneficiary: switch.beneficiary,
        claimed_at: now
    });

    transfer::transfer(new_cap, switch.beneficiary);
}

/// 4. Owner muốn tắt hoàn toàn Dead-man switch
entry fun disable(
    switch: DeadManSwitch,
    vault: &Vault,
    cap: &Cap,
    ctx: &mut TxContext
) {
    assert!(cap.vault_id == object::id(vault), ENotOwner);
    assert!(switch.vault_id == object::id(vault), ENotOwner);
    assert!(!switch.claimed, EAlreadyClaimed);

    let DeadManSwitch { id, vault_id, .. } = switch;
    object::delete(id);

    event::emit(SwitchDisabled { vault_id });
}
```

### Frontend chỉ cần 4 nút siêu đơn giản

| Nút                  | Người dùng bấm khi                                 | Gọi hàm                   |
| -------------------- | -------------------------------------------------- | ------------------------- |
| Kích hoạt / Cập nhật | Chọn người thân + chọn thời gian (30 ngày → 3 năm) | `setup_or_update`         |
| Tôi vẫn sống         | Mở app mỗi ngày/tuần                               | `heartbeat` (tự động gọi) |
| Claim vault          | Người thân bấm khi đủ thời gian                    | `claim`                   |
| Tắt nút chết         | Muốn huỷ tính năng                                 | `disable`                 |

### Demo video 15 giây là đủ để thắng giải

1. Bạn tạo vault → bấm “Kích hoạt nút chết” → chọn vợ → 30 ngày
2. Fake clock +31 ngày → vợ bấm “Claim” → nhận luôn Cap mới → mở được toàn bộ password + seed phrase
3. Bonus: show bạn thay đổi thành 2 năm → timer reset lại
