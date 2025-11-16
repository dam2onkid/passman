import { fromHex, SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "@/constants/config";
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
