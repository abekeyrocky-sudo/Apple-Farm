import crypto from 'crypto';
import { mnemonicToPrivateKey, keyPairFromSeed } from '@ton/crypto';
import { TonClient, WalletContractV5R1 } from '@ton/ton';
import { internal, toNano, Address, SendMode } from '@ton/core';

const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY || '';
const MASTER_MNEMONIC = process.env.MASTER_WALLET_MNEMONIC || '';
const MASTER_WALLET_ADDRESS = process.env.MASTER_WALLET_ADDRESS || '';

function deriveTonkeeper12Key(mnemonicWords) {
  const ED25519_CURVE = 'ed25519 seed';
  const HARDENED_OFFSET = 0x80000000;
  const bip39Seed = crypto.pbkdf2Sync(
    mnemonicWords.join(' ').normalize('NFKD'),
    'mnemonic',
    2048,
    64,
    'sha512'
  );

  const getMasterKeyFromSeed = (seed) => {
    const hmac = crypto.createHmac('sha512', ED25519_CURVE);
    const I = hmac.update(seed).digest();
    return {
      key: I.subarray(0, 32),
      chainCode: I.subarray(32)
    };
  };

  const CKDPriv = ({ key, chainCode }, index) => {
    const indexBuffer = Buffer.allocUnsafe(4);
    indexBuffer.writeUInt32BE(index, 0);
    const data = Buffer.concat([Buffer.alloc(1, 0), key, indexBuffer]);
    const I = crypto.createHmac('sha512', chainCode).update(data).digest();
    return {
      key: I.subarray(0, 32),
      chainCode: I.subarray(32)
    };
  };

  const { key, chainCode } = getMasterKeyFromSeed(bip39Seed);
  const segments = [44, 607, 0];
  const derived = segments.reduce((parent, seg) => CKDPriv(parent, seg + HARDENED_OFFSET), {
    key,
    chainCode
  });

  return keyPairFromSeed(derived.key);
}

let tonClientInstance = null;

export function getTonClient() {
  if (!tonClientInstance) {
    tonClientInstance = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
      apiKey: TONCENTER_API_KEY || undefined,
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
    const cleanMnemonic = (process.env.MASTER_WALLET_MNEMONIC || MASTER_MNEMONIC).replace(/['"]/g, '').trim();
    if (!cleanMnemonic) {
      console.error('[TON Auto Payout Security Alert] MASTER_WALLET_MNEMONIC is not set in environment variables!');
      return {
        success: false,
        error: 'Master payout wallet is not configured in server secrets.',
      };
    }

    const client = getTonClient();
    const mnemonicWords = cleanMnemonic.split(/\s+/);
    
    // Tonkeeper 12-word wallets use BIP-39 + m/44'/607'/0', while traditional TON 24-word wallets use standard TON KDF
    const keyPair = mnemonicWords.length === 12 
      ? deriveTonkeeper12Key(mnemonicWords)
      : await mnemonicToPrivateKey(mnemonicWords);

    const wallet = WalletContractV5R1.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });

    const contract = client.open(wallet);

    // Validate recipient address
    const targetAddress = Address.parse(recipientAddress.trim());

    // Fetch master wallet balance and current seqno
    let currentBalance = 0n;
    try {
      currentBalance = await contract.getBalance();
    } catch (balErr) {
      console.warn('[TON Auto Payout] Balance check warning:', balErr.message);
    }

    // Convert amount string (e.g. "0.05") to nanotons
    const nanoAmount = toNano(String(amountInTon));

    if (currentBalance > 0n && currentBalance < nanoAmount + toNano('0.01')) {
      console.error(`[TON Auto Payout Error] Insufficient Master Wallet balance: ${currentBalance} nanotons, requested: ${nanoAmount}`);
      return {
        success: false,
        error: `Master wallet has insufficient TON balance for payout (${amountInTon} TON requested).`,
      };
    }

    // Fetch current seqno
    let seqno = 0;
    try {
      seqno = await contract.getSeqno();
    } catch (e) {
      console.warn('Seqno fetch notice (wallet may be uninitialized or first tx):', e.message);
      seqno = 0;
    }

    console.log(`[TON Auto Payout] Sending ${amountInTon} TON to ${targetAddress.toString()} with seqno ${seqno}...`);

    // Send transfer (Master Wallet pays all network gas separately so user gets 100% full round amount)
    await contract.sendTransfer({
      seqno: seqno,
      secretKey: keyPair.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
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
