import { fromHex } from "@mysten/sui/utils";
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
  const { vaultId, capId, name, itemType, nonce, encryptedObject } = args;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::vault::create_item_entry`,
    arguments: [
      tx.object(capId),
      tx.pure.string(name),
      tx.pure.string(itemType),
      tx.object(vaultId),
      tx.pure.vector("u8", Array.from(nonce)),
      tx.pure.vector("u8", Array.from(encryptedObject)),
    ],
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
