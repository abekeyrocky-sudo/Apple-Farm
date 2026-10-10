import { calculateLevel } from '../utils/levelSystem.js';

// Canonical Server-Side GRAM Packages
const SERVER_GRAM_PACKAGES = {
  '0.05': { apples: 990, diamonds: 9 },
  '0.25': { apples: 4990, diamonds: 39 },
  '0.50': { apples: 9990, diamonds: 79 },
  '2.00': { apples: 39990, diamonds: 299 },
  '2':    { apples: 39990, diamonds: 299 },
  '5.00': { apples: 99990, diamonds: 699 },
  '5':    { apples: 99990, diamonds: 699 },
  '10.00': { apples: 199990, diamonds: 1299 },
  '10':   { apples: 199990, diamonds: 1299 }
};

export function createWithdrawController(db, admin) {
  return {
    submitWithdraw: async (req, res) => {
      try {
        const tgUser = req.telegramUser || req.body.user;
        const { amount, diamonds, method, accountNumber, gramAmount } = req.body;

        if (!tgUser?.id || !method || !accountNumber) {
          return res.status(400).json({ error: 'Valid user, method, and destination account/wallet are required' });
        }

        const isGramPayout = method === 'GRAM (TON)' || !!gramAmount;
        let withdrawApples = Number(amount || 0);
        let withdrawDiamonds = Number(diamonds || 0);

        // 🛡️ 1. Validate GRAM package rates server-side
        if (isGramPayout) {
          const cleanGram = String(gramAmount || '').trim();
          const pkg = SERVER_GRAM_PACKAGES[cleanGram];
          if (!pkg) {
            return res.status(400).json({ error: `Invalid GRAM package amount: ${cleanGram}` });
          }
          // Enforce canonical server costs (client cannot alter them)
          withdrawApples = pkg.apples;
          withdrawDiamonds = pkg.diamonds;

          // Validate TON address format basics (must be valid length and start with UQ, EQ, or 0:)
          const cleanAddr = String(accountNumber).trim();
          if (!cleanAddr || cleanAddr.length < 30 || (!cleanAddr.startsWith('UQ') && !cleanAddr.startsWith('EQ') && !cleanAddr.startsWith('0:'))) {
            return res.status(400).json({ error: 'Invalid TON wallet address format. Please connect a valid TON wallet.' });
          }
        } else {
          // 🛡️ 2. Validate Fiat / Mobile Banking minimums & requirements
          if (withdrawApples < 199999) {
            return res.status(400).json({ error: 'Minimum withdrawal amount is 199,999 Apples for mobile cashout.' });
          }
          if (withdrawDiamonds < 199) {
            withdrawDiamonds = 199; // Standard 199 diamonds requirement
          }
        }

        const userId = tgUser.id.toString();
        const userRef = db.collection('users').doc(userId);

        // 🛡️ 3. Atomic Database balance check & deduction (No negative balances, strict throw on shortfall)
        const withdrawalRecord = await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) {
            throw new Error('User not found in database');
          }

          const userData = userDoc.data();
          const currentApples = Number(userData.apples || 0);
          const currentDiamonds = Number(userData.diamonds || 0);

          // 🔒 Hidden requirement for mobile cashout (bKash, UPI, etc.): Level 20 required
          if (!isGramPayout) {
            const currentLevel = Number(userData.level || calculateLevel(currentApples));
            if (currentLevel < 20) {
              throw new Error(`Farmer Rank Level 20 required for Mobile Banking cashout! (Current: Lv.${currentLevel})`);
            }
          }

          // Balance check - MUST throw error to abort transaction if balance is insufficient
          if (currentApples < withdrawApples) {
            throw new Error(`Insufficient Apples! Required: ${withdrawApples.toLocaleString()}, Current: ${currentApples.toLocaleString()}`);
          }
          if (withdrawDiamonds > 0 && currentDiamonds < withdrawDiamonds) {
            throw new Error(`Insufficient Diamonds! Required: ${withdrawDiamonds}, Current: ${currentDiamonds.toFixed(1)}`);
          }

          // Atomically deduct
          const updateData = {
            apples: admin.firestore.FieldValue.increment(-withdrawApples)
          };
          if (withdrawDiamonds > 0) {
            updateData.diamonds = admin.firestore.FieldValue.increment(-withdrawDiamonds);
          }
          if (isGramPayout) {
            updateData.gramWithdrawStep = admin.firestore.FieldValue.increment(1);
          }
          transaction.update(userRef, updateData);

          // Create withdrawal record
          const newWithdrawalRef = db.collection('withdrawals').doc();
          const record = {
            id: newWithdrawalRef.id,
            userId: Number(tgUser.id),
            userName: userData.name || userData.username || tgUser.name || 'Farmer',
            apples: withdrawApples,
            diamonds: withdrawDiamonds,
            gramAmount: gramAmount || null,
            method,
            accountNumber: String(accountNumber).trim(),
            status: isGramPayout ? 'processing' : 'pending',
            createdAt: new Date().toISOString()
          };

          transaction.set(newWithdrawalRef, record);
          return record;
        });

        // 4. ⚡ If GRAM (TON) -> Trigger Automated On-Chain Transfer ⚡
        if (isGramPayout && gramAmount) {
          console.log(`[Auto Payout] Processing on-chain TON payout for ${gramAmount} GRAM to ${accountNumber}...`);
          
          try {
            const { sendTonPayout } = await import('../utils/tonPayout.js');
            const payoutResult = await sendTonPayout(
              accountNumber, 
              gramAmount, 
              `Apple Farm: ${gramAmount} GRAM Payout to ${tgUser.id}`
            );

            if (payoutResult.success) {
              await db.collection('withdrawals').doc(withdrawalRecord.id).update({
                status: 'completed',
                onChainSeqno: payoutResult.seqno || null,
                completedAt: new Date().toISOString()
              });

              return res.json({
                success: true,
                autoPayout: true,
                message: `Successfully sent ${gramAmount} GRAM on-chain!`,
                withdrawal: {
                  ...withdrawalRecord,
                  status: 'completed',
                  seqno: payoutResult.seqno
                }
              });
            } else {
              await db.collection('withdrawals').doc(withdrawalRecord.id).update({
                status: 'payout_queued',
                payoutError: payoutResult.error,
                updatedAt: new Date().toISOString()
              });

              return res.json({
                success: true,
                autoPayout: false,
                message: `Withdrawal logged. Payout queued: ${payoutResult.error}`,
                withdrawal: withdrawalRecord
              });
            }
          } catch (onChainErr) {
            console.error('[On-Chain Transfer Exception]:', onChainErr);
            return res.json({
              success: true,
              autoPayout: false,
              message: 'Withdrawal recorded and queued for processing.',
              withdrawal: withdrawalRecord
            });
          }
        }

        // Non-crypto fiat withdrawal response
        return res.json({ success: true, withdrawal: withdrawalRecord });
      } catch (err) {
        console.error('submitWithdraw error:', err.message);
        return res.status(400).json({ error: err.message });
      }
    }
  };
}
