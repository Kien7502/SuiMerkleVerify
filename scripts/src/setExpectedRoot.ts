import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { bcs } from "@mysten/sui/bcs";
import dotenv from "dotenv";
dotenv.config();

async function setExpectedRoot() {
  const hexStringToUint8Array = (hexString: string): Uint8Array => {
    const bytes: number[] = [];
    for (let i = 0; i < hexString.length; i += 2) {
      bytes.push(parseInt(hexString.substring(i, i + 2), 16));
    }
    return new Uint8Array(bytes);
  };

  // Initialize keypair and client
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const packageId = process.env.PACKAGE_ID;
  const MERKLE_VERIFIER_ID = process.env.MERKLE_VERIFIER_ID;

  if (!PRIVATE_KEY || !packageId || !MERKLE_VERIFIER_ID) {
    throw new Error("Required environment variables are not set");
  }

  const keypair = Ed25519Keypair.fromSecretKey(PRIVATE_KEY);
  const client = new SuiClient({ url: getFullnodeUrl("mainnet") });

  // Example root hash - replace with your actual root hash
  const expectedRoot =
    "320bad79b9356119b2d4ed98377fe4ae44d39d09920b7a4ef6c325b672c5a042";

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::merkle::set_expected_root`,
    arguments: [
      tx.object(MERKLE_VERIFIER_ID),
      tx.pure(
        bcs.vector(bcs.U8).serialize(hexStringToUint8Array(expectedRoot))
      ),
    ],
  });

  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
    },
  });

  console.log("Set expected root result:", result.effects?.status);
}

setExpectedRoot();
