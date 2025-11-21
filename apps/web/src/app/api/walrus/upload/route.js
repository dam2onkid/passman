import { NextResponse } from "next/server";
import { NETWORK } from "@passman/utils";

const PUBLISHER_URL =
  NETWORK === "mainnet"
    ? "https://publisher.walrus-mainnet.walrus.space"
    : "https://publisher.walrus-testnet.walrus.space";

export async function POST(request) {
  try {
    const body = await request.json();
    const { encryptedData: encryptedDataB64, epochs = 5 } = body;

    if (!encryptedDataB64) {
      return NextResponse.json(
        { error: "Missing encryptedData" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(encryptedDataB64, "base64");

    const response = await fetch(
      `${PUBLISHER_URL}/v1/blobs?epochs=${epochs}&deletable=true`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Walrus upload failed:", errorText);
      return NextResponse.json(
        { error: `Upload failed: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (result.newlyCreated) {
      return NextResponse.json({
        blob_id: result.newlyCreated.blobObject.blobId,
        blob_object_id: result.newlyCreated.blobObject.id,
      });
    } else if (result.alreadyCertified) {
      return NextResponse.json({
        blob_id: result.alreadyCertified.blobId,
        blob_object_id: result.alreadyCertified.blobObject.id,
      });
    } else {
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
