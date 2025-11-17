"use client";

import { WalrusFile } from "@mysten/walrus";

export async function uploadToWalrus({
  encryptedData,
  signAndExecuteTransaction,
  owner,
  client,
  epochs = 5,
}) {
  try {
    console.log(
      "[UPLOAD] encryptedData type:",
      encryptedData?.constructor.name
    );
    console.log("[UPLOAD] encryptedData length:", encryptedData?.length);
    console.log(
      "[UPLOAD] First 50 bytes:",
      Array.from(encryptedData.slice(0, 50))
    );

    if (!(encryptedData instanceof Uint8Array)) {
      throw new Error(
        `Invalid data type for upload: ${encryptedData?.constructor.name}. Expected Uint8Array`
      );
    }

    const flow = client.walrus.writeFilesFlow({
      files: [WalrusFile.from({ contents: encryptedData })],
    });

    await flow.encode();

    const registerTx = flow.register({
      epochs,
      owner,
      deletable: true,
    });

    return new Promise((resolve, reject) => {
      signAndExecuteTransaction(
        { transaction: registerTx },
        {
          onSuccess: async (result) => {
            try {
              console.log("Register result:", result);
              await flow.upload({ digest: result.digest });

              const certifyTx = flow.certify();

              signAndExecuteTransaction(
                { transaction: certifyTx },
                {
                  onSuccess: async (certifyResult) => {
                    console.log("Certify result:", certifyResult);
                    const files = await flow.listFiles();
                    console.log("[UPLOAD] files[0].id:", files[0].id);
                    console.log("[UPLOAD] Saving patch ID:", files[0].id);

                    resolve({
                      blob_id: files[0].id,
                      blob_object_id: files[0].blobObject.id,
                    });
                  },
                  onError: (error) => {
                    console.error("Certify transaction failed:", error);
                    reject(error);
                  },
                }
              );
            } catch (error) {
              console.error("Error in upload/certify step:", error);
              reject(error);
            }
          },
          onError: (error) => {
            console.error("Register transaction failed:", error);
            reject(error);
          },
        }
      );
    });
  } catch (error) {
    console.error("Error uploading to Walrus:", error);
    throw error;
  }
}

export async function fetchFromWalrus(patchId, client) {
  try {
    console.log("[FETCH] Fetching from Walrus, patch ID:", patchId);

    const [file] = await client.walrus.getFiles({ ids: [patchId] });

    if (!file) {
      throw new Error("Walrus file not found");
    }

    console.log("[FETCH] File found, getting bytes...");
    const bytes = await file.bytes();

    console.log("[FETCH] bytes type:", bytes?.constructor.name);
    console.log("[FETCH] bytes length:", bytes?.length);
    console.log("[FETCH] First 50 bytes:", Array.from(bytes.slice(0, 50)));

    return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  } catch (error) {
    console.error("[FETCH] Error fetching from Walrus:", error);
    throw error;
  }
}
