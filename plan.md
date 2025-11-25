**Kế hoạch chi tiết** để cập nhật web app:

---

## 📋 Kế Hoạch Cập Nhật Web App cho Safe Module

### 1. Cập nhật Packages Utils (`construct-move-call.js`)

**Thay đổi:**

- Xóa các hàm deadman cũ (`setupDeadmanSwitchTx`, `updateDeadmanSwitchTx`, `heartbeatDeadmanSwitchTx`, `claimDeadmanSwitchTx`, `disableDeadmanSwitchTx`)
- Thêm các hàm Safe mới:

```javascript
// Safe module functions
createSafeTx(args); // vault, cap, guardians, threshold, beneficiary, inactivityPeriodMs
disableSafeTx(args); // safeId
borrowCapTx(args); // safeId - returns (cap, receipt) trong PTB
returnCapTx(args); // safeId, cap, receipt
heartbeatTx(args); // safeId
claimTx(args); // safeId
updateDeadmanTx(args); // safeId, beneficiary, inactivityPeriodMs
approveRecoveryTx(args); // safeId, newOwner
updateGuardiansTx(args); // safeId, guardians, threshold
```

---

### 2. Cập nhật `use-fetch-vaults.js`

**Vấn đề hiện tại:**

- Chỉ fetch Cap trực tiếp từ user's owned objects
- Không handle trường hợp Cap nằm trong Safe

**Giải pháp:**

```javascript
// Fetch 3 loại objects:
// 1. Vault objects owned by user
// 2. Cap objects owned directly by user
// 3. Safe objects (shared) where user is owner

// Kết quả trả về:
vaultCapPairs = [
  {
    vault: { id, name },
    cap: { id, vaultId },
    capSource: 'direct' | 'safe',  // NEW: nguồn của cap
    safe: { id, ... } | null       // NEW: safe object nếu có
  }
]
```

---

### 3. Tạo mới `use-fetch-safe.js`

**Chức năng:**

- Fetch Safe object theo vaultId
- Parse thông tin: guardians, threshold, beneficiary, inactivityPeriod, lastActivity, deadmanClaimed

```javascript
export function useFetchSafe(vaultId) {
  // Query SafeCreated events với vault_id
  // hoặc query shared objects với type Safe và filter vault_id
  return {
    safe: {
      id,
      vault_id,
      owner,
      has_cap,
      // Social Recovery
      guardians: [],
      threshold,
      // Deadman Switch
      beneficiary: null | address,
      inactivity_period_ms,
      last_activity_ms,
      deadman_claimed,
    },
    isLoading,
    error,
    refetch,
  };
}
```

---

### 4. Cập nhật Vault Store

**Thêm thông tin Safe:**

```javascript
// vault-store.js
{
  activeVaultCapPair: {
    vault: { id, name },
    cap: { id, vaultId },
    capSource: 'direct' | 'safe',
    safe: null | { id, owner, guardians, threshold, beneficiary, ... }
  }
}
```

---

### 5. Cập nhật `use-active-vault.js`

**Thêm helper functions:**

```javascript
export default function useActiveVault() {
  return {
    // Existing
    activeVault,
    activeCap,
    vaultId,
    capId,

    // NEW
    capSource: "direct" | "safe",
    activeSafe,
    safeId,
    isCapInSafe: capSource === "safe",

    // Helper for transactions
    getCapForTransaction: () => {
      if (capSource === "direct") return capId;
      // For safe, need PTB with borrow_cap/return_cap
      return null;
    },
  };
}
```

---

### 6. Rename & Refactor Deadman Page → Safe Page

**Cấu trúc mới:**

```
/dashboard/safe/page.jsx           # Main safe management page
```

**UI Components:**

```
SafeManager
├── SafeStatus (hiển thị trạng thái Safe hiện tại)
├── CreateSafeForm (tạo Safe mới với options)
│   ├── GuardiansSection (optional)
│   └── DeadmanSection (optional)
├── DeadmanActions
│   ├── HeartbeatButton
│   ├── ClaimButton (for beneficiary)
│   └── UpdateDeadmanForm
├── RecoveryActions
│   ├── ApproveRecoveryForm (for guardians)
│   └── UpdateGuardiansForm (for owner)
└── DisableSafeButton
```

---

### 7. Handle Cap trong Safe khi tương tác với Item/Share

**Vấn đề:**

- Khi Cap nằm trong Safe, không thể dùng trực tiếp
- Cần dùng PTB (Programmable Transaction Block) với `borrow_cap` → action → `return_cap`

**Giải pháp - Cập nhật transaction builders:**

```javascript
// construct-move-call.js

// Helper function để wrap action với borrow/return cap
export function createItemWithSafeTx(args) {
  const { safeId, vaultId, name, itemType, nonce, walrusBlobId } = args;
  const tx = new Transaction();

  // 1. Borrow cap từ safe
  const [cap, receipt] = tx.moveCall({
    target: `${PACKAGE_ID}::safe::borrow_cap`,
    arguments: [tx.object(safeId)],
  });

  // 2. Tạo item với cap
  tx.moveCall({
    target: `${PACKAGE_ID}::vault::create_item_entry`,
    arguments: [cap, tx.pure.string(name), ...],
  });

  // 3. Return cap về safe
  tx.moveCall({
    target: `${PACKAGE_ID}::safe::return_cap`,
    arguments: [tx.object(safeId), cap, receipt],
  });

  return tx;
}
```

---

### 8. Component Updates

| Component             | Changes                                     |
| --------------------- | ------------------------------------------- |
| `password-detail.jsx` | Check capSource, use appropriate tx builder |
| `share-modal.jsx`     | No change needed (doesn't use cap)          |
| `new-item-modal/*`    | Use safe-aware tx builder if cap in safe    |
| `vault-switcher.jsx`  | Show badge if vault has Safe                |

---

### 9. Migration Path

```
Bước 1: Cập nhật packages/utils (construct-move-call.js)
Bước 2: Tạo use-fetch-safe.js hook
Bước 3: Cập nhật use-fetch-vaults.js để fetch Safe
Bước 4: Cập nhật vault-store và use-active-vault
Bước 5: Tạo SafeManager component mới
Bước 6: Rename /dashboard/deadman → /dashboard/safe
Bước 7: Cập nhật các component dùng cap
Bước 8: Testing & cleanup
```

---

### 10. Files cần thay đổi

| File                                                 | Action                     |
| ---------------------------------------------------- | -------------------------- |
| `packages/utils/src/construct-move-call.js`          | Major rewrite              |
| `apps/web/src/hooks/use-fetch-vaults.js`             | Update                     |
| `apps/web/src/hooks/use-fetch-safe.js`               | **NEW**                    |
| `apps/web/src/hooks/use-fetch-deadman-switch.js`     | Delete                     |
| `apps/web/src/hooks/use-active-vault.js`             | Update                     |
| `apps/web/src/store/vault-store.js`                  | Update                     |
| `apps/web/src/app/dashboard/deadman/page.jsx`        | Rename → safe              |
| `apps/web/src/components/deadman-switch-manager.jsx` | Rewrite → safe-manager.jsx |
| `apps/web/src/components/password-detail.jsx`        | Update                     |
| `apps/web/src/components/new-item-modal/*`           | Update                     |

---
