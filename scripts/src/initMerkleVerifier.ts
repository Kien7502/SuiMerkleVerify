import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import dotenv from "dotenv";
dotenv.config();

async function initMerkleVerifier() {
  // Initialize keypair and client
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const packageId = process.env.PACKAGE_ID;

  if (!PRIVATE_KEY || !packageId) {
    throw new Error("Required environment variables are not set");
  }

  const keypair = Ed25519Keypair.fromSecretKey(PRIVATE_KEY);
  const client = new SuiClient({ url: getFullnodeUrl("mainnet") });

  // Create transaction to call create_merkle_verifier()
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::merkle::create_merkle_verifier`,
    arguments: [],
  });

  // Execute transaction
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
    },
  });

  // Get the created MerkleVerifier object ID
  const createdObjects = result.objectChanges?.filter(
    (change) =>
      change.type === "created" && change.objectType.includes("MerkleVerifier")
  );

  if (createdObjects && createdObjects.length > 0) {
    const merkleVerifierId = (createdObjects[0] as any).objectId;
    console.log("MerkleVerifier created with ID:", merkleVerifierId);
    console.log("Add this to your .env file as MERKLE_VERIFIER_ID");
  } else {
    console.error("Failed to create MerkleVerifier object");
  }
}

initMerkleVerifier();
