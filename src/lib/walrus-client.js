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
                    console.log("files", files);
                    resolve({
                      blob_id: files[0].blobId,
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

export async function fetchFromWalrus(walrusId, client) {
  try {
    const [file] = await client.walrus.getFiles({ ids: [walrusId] });
    if (!file) {
      throw new Error("Walrus file not found");
    }
    const bytes = await file.bytes();
    return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  } catch (error) {
    console.error("Error fetching from Walrus:", error);
    throw error;
  }
}
