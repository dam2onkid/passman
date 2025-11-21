"use client";

export async function uploadToWalrus({ encryptedData, owner, epochs = 5 }) {
  try {
    console.log(
      "[UPLOAD] encryptedData type:",
      encryptedData?.constructor.name
    );
    console.log("[UPLOAD] encryptedData length:", encryptedData?.length);

    if (!(encryptedData instanceof Uint8Array)) {
      throw new Error(
        `Invalid data type for upload: ${encryptedData?.constructor.name}. Expected Uint8Array`
      );
    }

    // Convert Uint8Array to Base64
    let base64Data;
    if (typeof Buffer !== "undefined") {
      base64Data = Buffer.from(encryptedData).toString("base64");
    } else {
      // Browser
      let binary = "";
      const len = encryptedData.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(encryptedData[i]);
      }
      base64Data = btoa(binary);
    }

    const response = await fetch("/api/walrus/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        encryptedData: base64Data,
        owner,
        epochs,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Upload failed with status ${response.status}`
      );
    }

    const result = await response.json();
    console.log("[UPLOAD] Upload result:", result);

    return result;
  } catch (error) {
    console.error("Error uploading to Walrus:", error);
    throw error;
  }
}

export async function fetchFromWalrus(patchId, client) {
  try {
    const [file] = await client.walrus.getFiles({ ids: [patchId] });

    if (!file) {
      throw new Error("Walrus file not found");
    }

    const bytes = await file.bytes();
    return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  } catch (error) {
    console.error("[FETCH] Error fetching from Walrus:", error);
    throw error;
  }
}
