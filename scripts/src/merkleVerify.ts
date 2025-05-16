import { TransactionBlock } from '@mysten/sui.js/transactions';
import * as dotenv from 'dotenv';
import getExecStuff from '../utils/execStuff';
import { packageId } from '../utils/packageInfo';
dotenv.config();

async function merkleVerify() {
    const hexStringToUint8Array = (hexString: string): Uint8Array => {
        const bytes: any = [];
        for (let i = 0; i < hexString.length; i += 2) {
            bytes.push(parseInt(hexString.substring(i, i + 2), 16));
        }
        return new Uint8Array(bytes);
    }

    const stringToUint8Array = (str: string): Uint8Array => {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        return new Uint8Array(bytes);
    }
    const { keypair, client } = getExecStuff();
    const tx = new TransactionBlock();
    tx.moveCall({
        target: `${packageId}::merkle::verify_merkle`,
        arguments: [
            tx.pure(Array.from(hexStringToUint8Array('320bad79b9356119b2d4ed98377fe4ae44d39d09920b7a4ef6c325b672c5a042'))),
            tx.pure(Array.from(hexStringToUint8Array('0a317f7384c728e21aae50d8ec2699ad76013f0c0572a1468e5e7dc6f2704060'))),
            tx.pure([Array.from(hexStringToUint8Array('b241f4beaa41f73575b1a03111865644dc73cd994ccea699dc2e027c6b8b94e3')), Array.from(hexStringToUint8Array('18018b82e8902221bfe5ff5edc67faf9c1f2674afe1d6e97065fde06e0f092cc')), Array.from(hexStringToUint8Array('08106388c770fefde8f308bb00fbf0a9db74a19d2ed567e5b26bef1c11ac6725'))]),
            tx.pure([Array.from(stringToUint8Array('right')), Array.from(stringToUint8Array('right')), Array.from(stringToUint8Array('right'))]),
        ],
    });
    const result = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
    });
    console.log({ result });
}

merkleVerify();
