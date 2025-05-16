import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import dotenv from "dotenv";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

const rpcUrl = getFullnodeUrl("mainnet");
const client = new SuiClient({ url: rpcUrl });

// Helper function to wait for transaction confirmation
async function waitForTransaction(digest: string) {
  let retries = 0;
  const maxRetries = 5;

  while (retries < maxRetries) {
    try {
      const txResponse = await client.getTransactionBlock({
        digest,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      if (txResponse.effects?.status.status === "success") {
        return txResponse;
      }
    } catch (error) {
      console.log(
        `Waiting for transaction confirmation... (attempt ${
          retries + 1
        }/${maxRetries})`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds between retries
    retries++;
  }

  throw new Error(
    `Transaction ${digest} not confirmed after ${maxRetries} attempts`
  );
}

export async function setupPackage(privateKey: string) {
  try {
    if (!privateKey) {
      throw new Error("PRIVATE_KEY is not set in environment variables");
    }

    const keypair = Ed25519Keypair.fromSecretKey(privateKey);
    const publicKey = keypair.getPublicKey();
    const privatekey = keypair.getSecretKey();

    // Build the package
    const packagePath = process.cwd();
    console.log("Building package at:", packagePath);
    const { modules, dependencies } = JSON.parse(
      execSync(
        `sui move build --dump-bytecode-as-base64 --path ${packagePath}`,
        {
          encoding: "utf-8",
        }
      )
    );

    // Create and execute transaction
    const tx = new Transaction();
    const [upgradeCap] = tx.publish({
      modules,
      dependencies,
    });

    // Transfer upgrade capability to the deployer
    tx.transferObjects([upgradeCap], publicKey.toSuiAddress());

    console.log("Publishing package...");
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });

    console.log("Transaction submitted:", result.digest);

    // Wait for transaction confirmation
    const confirmedTx = await waitForTransaction(result.digest);
    console.log("Transaction confirmed:", confirmedTx.digest);

    // Extract package ID
    const packageId = (
      (confirmedTx.objectChanges?.filter((a) => a.type === "published") ??
        [])[0] as any
    ).packageId.replace(/^(0x)(0+)/, "0x");

    console.log("Package published successfully!");
    console.log("Package ID:", packageId);

    return {
      packageId,
      digest: confirmedTx.digest,
      effects: confirmedTx.effects,
    };
  } catch (error) {
    console.error("Error during package setup:", error);
    throw error;
  }
}

// Example usage
async function main() {
  try {
    const result = await setupPackage(process.env.PRIVATE_KEY || "");
    console.log("Setup completed:", result);
  } catch (error) {
    console.error("Setup failed:", error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default setupPackage;
