import { mnemonicToPrivateKey } from '@ton/crypto';
import { TonClient, WalletContractV4 } from '@ton/ton';
import { internal, toNano, Address } from '@ton/core';

const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY || '339b8826294c4f5a133e0300346947bb92b26d84951b3dad768f4fab85b57522';
const MASTER_MNEMONIC = process.env.MASTER_WALLET_MNEMONIC || 'vessel tornado great just traffic august below exhaust pluck chair series deposit culture forget panther inspire phone love bulb version basket sibling this simple';
const MASTER_WALLET_ADDRESS = process.env.MASTER_WALLET_ADDRESS || 'UQC576HcthVEI8QtkfQ80iHPDz1iz8VfEWsZPi3c3ihnrN5c';

let tonClientInstance = null;

export function getTonClient() {
  if (!tonClientInstance) {
    tonClientInstance = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
      apiKey: TONCENTER_API_KEY,
    });
  }
  return tonClientInstance;
}

/**
 * Sends automated real on-chain TON payout from Master Wallet to recipient
 * @param {string} recipientAddress - User's connected TON wallet address (UQ... / EQ...)
 * @param {string|number} amountInTon - Amount in TON/GRAM (e.g. 0.05, 0.25, 0.50, 2, 5, 10)
 * @param {string} comment - Transfer memo/comment
 * @returns {Promise<{success: boolean, txSeqno?: number, error?: string}>}
 */
export async function sendTonPayout(recipientAddress, amountInTon, comment = 'Apple Farm Payout') {
  try {
    const client = getTonClient();
    const mnemonicWords = MASTER_MNEMONIC.trim().split(/\s+/);
    const keyPair = await mnemonicToPrivateKey(mnemonicWords);

    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });

    const contract = client.open(wallet);

    // Validate recipient address
    const targetAddress = Address.parse(recipientAddress.trim());

    // Fetch current seqno
    let seqno = 0;
    try {
      seqno = await contract.getSeqno();
    } catch (e) {
      console.warn('Seqno fetch notice (wallet may be uninitialized or first tx):', e.message);
      seqno = 0;
    }

    // Convert amount string (e.g. "0.05") to nanotons
    const nanoAmount = toNano(String(amountInTon));

    console.log(`[TON Auto Payout] Sending ${amountInTon} TON to ${targetAddress.toString()} with seqno ${seqno}...`);

    // Send transfer
    await contract.sendTransfer({
      seqno: seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          to: targetAddress,
          value: nanoAmount,
          bounce: false,
          body: comment,
        }),
      ],
    });

    console.log(`[TON Auto Payout] Successfully broadcasted transaction seqno: ${seqno}`);

    return {
      success: true,
      seqno,
      amount: amountInTon,
      recipient: targetAddress.toString({ bounceable: false }),
      status: 'completed',
    };
  } catch (err) {
    console.error('[TON Auto Payout Error]:', err);
    return {
      success: false,
      error: err.message || 'On-chain transaction failed',
    };
  }
}
