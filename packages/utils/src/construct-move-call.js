import { fromHex, SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "./constants/config";
const GAS_BUDGET = 10000000;

// Vault
export function createVaultMoveCallTx(args = {}, gasBudget = GAS_BUDGET) {
  const { name } = args;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::vault::create_vault_entry`,
    arguments: [tx.pure.string(name)],
  });
  tx.setGasBudget(gasBudget);
  return tx;
}

export function createItemMoveCallTx(args = {}, gasBudget = GAS_BUDGET) {
  const { vaultId, capId, name, itemType, nonce, walrusBlobId } = args;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::vault::create_item_entry`,
    arguments: [
      tx.object(capId),
      tx.pure.string(name),
      tx.pure.string(itemType),
      tx.object(vaultId),
      tx.pure.vector("u8", Array.from(nonce)),
      tx.pure.string(walrusBlobId),
    ],
  });
  tx.setGasBudget(gasBudget);
  return tx;
}

export function editItemMoveCallTx(args = {}, gasBudget = GAS_BUDGET) {
  const { capId, itemId, name, walrusBlobId } = args;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::vault::update_item`,
    arguments: [
      tx.object(capId),
      tx.pure.string(name),
      tx.pure.string(walrusBlobId),
      tx.object(itemId),
    ],
  });
  tx.setGasBudget(gasBudget);
  return tx;
}

export function deleteItemMoveCallTx(args = {}, gasBudget = GAS_BUDGET) {
  const { vaultId, capId, itemId } = args;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::vault::delete_item`,
    arguments: [tx.object(capId), tx.object(vaultId), tx.object(itemId)],
  });
  tx.setGasBudget(gasBudget);
  return tx;
}

// Seal
export function ownerSealApproveMoveCallTx(args = {}) {
  const { vaultId, itemId, id } = args;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::vault::seal_approve`,
    arguments: [
      tx.pure.vector("u8", fromHex(id)),
      tx.object(vaultId),
      tx.object(itemId),
    ],
  });
  return tx;
}

// Seal
export function shareSealApproveMoveCallTx(args = {}) {
  const { id, shareId } = args;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::share::seal_approve`,
    arguments: [
      tx.pure.vector("u8", fromHex(id)),
      tx.object(shareId),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

// Share
export function shareItemMoveCallTx(args = {}, gasBudget = GAS_BUDGET) {
  const { vaultId, itemId, createdAt, ttl, walletAddresses } = args;
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::share::share_item_entry`,
    arguments: [
      tx.object(vaultId),
      tx.object(itemId),
      tx.pure.vector("address", walletAddresses),
      tx.pure.u64(createdAt),
      tx.pure.u64(ttl),
    ],
  });
  tx.setGasBudget(gasBudget);
  return tx;
}

export function deleteShareMoveCallTx(args = {}, gasBudget = GAS_BUDGET) {
  const { capId, shareId } = args;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::share::delete_share_item`,
    arguments: [tx.object(capId), tx.object(shareId)],
  });
  tx.setGasBudget(gasBudget);
  return tx;
}

export function updateShareMoveCallTx(args = {}, gasBudget = GAS_BUDGET) {
  const { capId, shareId, recipients, ttl } = args;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::share::update_share_item`,
    arguments: [
      tx.object(capId),
      tx.object(shareId),
      tx.pure.vector("address", recipients),
      tx.pure.u64(ttl),
    ],
  });
  tx.setGasBudget(gasBudget);
  return tx;
}

// ============================================
// Safe Module Functions
// ============================================

/**
 * Create a new Safe with optional Social Recovery and/or Deadman Switch
 * @param {Object} args
 * @param {string} args.vaultId - Vault object ID
 * @param {string} args.capId - Cap object ID to lock in safe
 * @param {string[]} args.guardians - List of guardian addresses (empty to disable social recovery)
 * @param {number} args.threshold - Number of guardian votes required (0 if no guardians)
 * @param {string|null} args.beneficiary - Beneficiary address for deadman switch (null to disable)
 * @param {number} args.inactivityPeriodMs - Inactivity period in milliseconds
 */
export function createSafeTx(args = {}, gasBudget = GAS_BUDGET) {
  const {
    vaultId,
    capId,
    guardians = [],
    threshold = 0,
    beneficiary = null,
    inactivityPeriodMs = 0,
  } = args;
  const tx = new Transaction();

  // Create beneficiary option
  const beneficiaryOption = beneficiary
    ? tx.moveCall({
        target: "0x1::option::some",
        typeArguments: ["address"],
        arguments: [tx.pure.address(beneficiary)],
      })
    : tx.moveCall({
        target: "0x1::option::none",
        typeArguments: ["address"],
        arguments: [],
      });

  tx.moveCall({
    target: `${PACKAGE_ID}::safe::create_safe`,
    arguments: [
      tx.object(vaultId),
      tx.object(capId),
      tx.pure.vector("address", guardians),
      tx.pure.u64(threshold),
      beneficiaryOption,
      tx.pure.u64(inactivityPeriodMs),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
  tx.setGasBudget(gasBudget);
  return tx;
}

/**
 * Disable the safe and return Cap to owner
 * @param {Object} args
 * @param {string} args.safeId - Safe object ID
 */
export function disableSafeTx(args = {}, gasBudget = GAS_BUDGET) {
  const { safeId } = args;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::safe::disable_safe`,
    arguments: [tx.object(safeId)],
  });
  tx.setGasBudget(gasBudget);
  return tx;
}

/**
 * Record owner activity (heartbeat) to reset the deadman timer
 * @param {Object} args
 * @param {string} args.safeId - Safe object ID
 */
export function heartbeatTx(args = {}, gasBudget = GAS_BUDGET) {
  const { safeId } = args;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::safe::heartbeat`,
    arguments: [tx.object(safeId), tx.object(SUI_CLOCK_OBJECT_ID)],
  });
  tx.setGasBudget(gasBudget);
  return tx;
}

/**
 * Beneficiary claims the vault after inactivity period expires
 * @param {Object} args
 * @param {string} args.safeId - Safe object ID
 */
export function claimTx(args = {}, gasBudget = GAS_BUDGET) {
  const { safeId } = args;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::safe::claim`,
    arguments: [tx.object(safeId), tx.object(SUI_CLOCK_OBJECT_ID)],
  });
  tx.setGasBudget(gasBudget);
  return tx;
}

/**
 * Update deadman switch settings (owner only)
 * @param {Object} args
 * @param {string} args.safeId - Safe object ID
 * @param {string|null} args.beneficiary - New beneficiary address (null to disable)
 * @param {number} args.inactivityPeriodMs - New inactivity period in milliseconds
 */
export function updateDeadmanTx(args = {}, gasBudget = GAS_BUDGET) {
  const { safeId, beneficiary = null, inactivityPeriodMs } = args;
  const tx = new Transaction();

  // Create beneficiary option
  const beneficiaryOption = beneficiary
    ? tx.moveCall({
        target: "0x1::option::some",
        typeArguments: ["address"],
        arguments: [tx.pure.address(beneficiary)],
      })
    : tx.moveCall({
        target: "0x1::option::none",
        typeArguments: ["address"],
        arguments: [],
      });

  tx.moveCall({
    target: `${PACKAGE_ID}::safe::update_deadman`,
    arguments: [
      tx.object(safeId),
      beneficiaryOption,
      tx.pure.u64(inactivityPeriodMs),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
  tx.setGasBudget(gasBudget);
  return tx;
}

/**
 * Guardian votes to approve recovery to a new owner
 * @param {Object} args
 * @param {string} args.safeId - Safe object ID
 * @param {string} args.newOwner - New owner address to recover to
 */
export function approveRecoveryTx(args = {}, gasBudget = GAS_BUDGET) {
  const { safeId, newOwner } = args;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::safe::approve_recovery`,
    arguments: [tx.object(safeId), tx.pure.address(newOwner)],
  });
  tx.setGasBudget(gasBudget);
  return tx;
}

/**
 * Update guardian settings (owner only)
 * @param {Object} args
 * @param {string} args.safeId - Safe object ID
 * @param {string[]} args.guardians - New list of guardian addresses
 * @param {number} args.threshold - New threshold for recovery
 */
export function updateGuardiansTx(args = {}, gasBudget = GAS_BUDGET) {
  const { safeId, guardians, threshold } = args;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::safe::update_guardians`,
    arguments: [
      tx.object(safeId),
      tx.pure.vector("address", guardians),
      tx.pure.u64(threshold),
    ],
  });
  tx.setGasBudget(gasBudget);
  return tx;
}

// ============================================
// Safe-aware Item Operations (PTB with borrow/return cap)
// ============================================

/**
 * Create item using cap from Safe (PTB with borrow/return)
 * @param {Object} args
 * @param {string} args.safeId - Safe object ID
 * @param {string} args.vaultId - Vault object ID
 * @param {string} args.name - Item name
 * @param {string} args.itemType - Item type
 * @param {Uint8Array} args.nonce - Encryption nonce
 * @param {string} args.walrusBlobId - Walrus blob ID
 */
export function createItemWithSafeTx(args = {}, gasBudget = GAS_BUDGET) {
  const { safeId, vaultId, name, itemType, nonce, walrusBlobId } = args;
  const tx = new Transaction();

  // Use a single object reference for the safe across the PTB
  const safeObj = tx.object(safeId);

  // 1. Borrow cap from safe
  const [cap, receipt] = tx.moveCall({
    target: `${PACKAGE_ID}::safe::borrow_cap`,
    arguments: [safeObj],
  });

  // 2. Create item with borrowed cap
  tx.moveCall({
    target: `${PACKAGE_ID}::vault::create_item_entry`,
    arguments: [
      cap,
      tx.pure.string(name),
      tx.pure.string(itemType),
      tx.object(vaultId),
      tx.pure.vector("u8", Array.from(nonce)),
      tx.pure.string(walrusBlobId),
    ],
  });

  // 3. Return cap to safe (use same safeObj reference)
  tx.moveCall({
    target: `${PACKAGE_ID}::safe::return_cap`,
    arguments: [safeObj, cap, receipt],
  });

  tx.setGasBudget(gasBudget);
  return tx;
}

/**
 * Edit item using cap from Safe (PTB with borrow/return)
 * @param {Object} args
 * @param {string} args.safeId - Safe object ID
 * @param {string} args.itemId - Item object ID
 * @param {string} args.name - New item name
 * @param {string} args.walrusBlobId - New Walrus blob ID
 */
export function editItemWithSafeTx(args = {}, gasBudget = GAS_BUDGET) {
  const { safeId, itemId, name, walrusBlobId } = args;
  const tx = new Transaction();

  // Use a single object reference for the safe across the PTB
  const safeObj = tx.object(safeId);

  // 1. Borrow cap from safe
  const [cap, receipt] = tx.moveCall({
    target: `${PACKAGE_ID}::safe::borrow_cap`,
    arguments: [safeObj],
  });

  // 2. Edit item with borrowed cap
  tx.moveCall({
    target: `${PACKAGE_ID}::vault::update_item`,
    arguments: [
      cap,
      tx.pure.string(name),
      tx.pure.string(walrusBlobId),
      tx.object(itemId),
    ],
  });

  // 3. Return cap to safe (use same safeObj reference)
  tx.moveCall({
    target: `${PACKAGE_ID}::safe::return_cap`,
    arguments: [safeObj, cap, receipt],
  });

  tx.setGasBudget(gasBudget);
  return tx;
}

/**
 * Delete item using cap from Safe (PTB with borrow/return)
 * @param {Object} args
 * @param {string} args.safeId - Safe object ID
 * @param {string} args.vaultId - Vault object ID
 * @param {string} args.itemId - Item object ID
 */
export function deleteItemWithSafeTx(args = {}, gasBudget = GAS_BUDGET) {
  const { safeId, vaultId, itemId } = args;
  const tx = new Transaction();

  // Use a single object reference for the safe across the PTB
  const safeObj = tx.object(safeId);

  // 1. Borrow cap from safe
  const [cap, receipt] = tx.moveCall({
    target: `${PACKAGE_ID}::safe::borrow_cap`,
    arguments: [safeObj],
  });

  // 2. Delete item with borrowed cap
  tx.moveCall({
    target: `${PACKAGE_ID}::vault::delete_item`,
    arguments: [cap, tx.object(vaultId), tx.object(itemId)],
  });

  // 3. Return cap to safe (use same safeObj reference)
  tx.moveCall({
    target: `${PACKAGE_ID}::safe::return_cap`,
    arguments: [safeObj, cap, receipt],
  });

  tx.setGasBudget(gasBudget);
  return tx;
}

/**
 * Delete share using cap from Safe (PTB with borrow/return)
 * @param {Object} args
 * @param {string} args.safeId - Safe object ID
 * @param {string} args.shareId - Share object ID
 */
export function deleteShareWithSafeTx(args = {}, gasBudget = GAS_BUDGET) {
  const { safeId, shareId } = args;
  const tx = new Transaction();

  // Use a single object reference for the safe across the PTB
  const safeObj = tx.object(safeId);

  // 1. Borrow cap from safe
  const [cap, receipt] = tx.moveCall({
    target: `${PACKAGE_ID}::safe::borrow_cap`,
    arguments: [safeObj],
  });

  // 2. Delete share with borrowed cap
  tx.moveCall({
    target: `${PACKAGE_ID}::share::delete_share_item`,
    arguments: [cap, tx.object(shareId)],
  });

  // 3. Return cap to safe (use same safeObj reference)
  tx.moveCall({
    target: `${PACKAGE_ID}::safe::return_cap`,
    arguments: [safeObj, cap, receipt],
  });

  tx.setGasBudget(gasBudget);
  return tx;
}

/**
 * Update share using cap from Safe (PTB with borrow/return)
 * @param {Object} args
 * @param {string} args.safeId - Safe object ID
 * @param {string} args.shareId - Share object ID
 * @param {string[]} args.recipients - New list of recipient addresses
 * @param {number} args.ttl - New TTL
 */
export function updateShareWithSafeTx(args = {}, gasBudget = GAS_BUDGET) {
  const { safeId, shareId, recipients, ttl } = args;
  const tx = new Transaction();

  // Use a single object reference for the safe across the PTB
  const safeObj = tx.object(safeId);

  // 1. Borrow cap from safe
  const [cap, receipt] = tx.moveCall({
    target: `${PACKAGE_ID}::safe::borrow_cap`,
    arguments: [safeObj],
  });

  // 2. Update share with borrowed cap
  tx.moveCall({
    target: `${PACKAGE_ID}::share::update_share_item`,
    arguments: [
      cap,
      tx.object(shareId),
      tx.pure.vector("address", recipients),
      tx.pure.u64(ttl),
    ],
  });

  // 3. Return cap to safe (use same safeObj reference)
  tx.moveCall({
    target: `${PACKAGE_ID}::safe::return_cap`,
    arguments: [safeObj, cap, receipt],
  });

  tx.setGasBudget(gasBudget);
  return tx;
}
