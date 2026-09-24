import { sendTonPayout } from '../utils/tonPayout.js';

export function createWithdrawController(db, admin) {
  return {
    submitWithdraw: async (req, res) => {
      try {
        const tgUser = req.telegramUser || req.body.user;
        const { amount, diamonds, method, accountNumber, gramAmount } = req.body;
        const withdrawApples = Number(amount || 0);
        const withdrawDiamonds = Number(diamonds || 0);
        const isGramPayout = method === 'GRAM (TON)' || !!gramAmount;

        if (!tgUser?.id || !method || !accountNumber) {
          return res.status(400).json({ error: 'Valid user, method, and destination account/wallet are required' });
        }

        const userId = tgUser.id.toString();
        const userRef = db.collection('users').doc(userId);

        // 1. Database balance verification & deduction in a transaction
        const withdrawalRecord = await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) throw new Error('User not found in database');

          const userData = userDoc.data();
          const currentApples = userData.apples || 0;
          const currentDiamonds = userData.diamonds || 0;

          if (currentApples < withdrawApples) {
            throw new Error(`Insufficient Apples! Available: ${currentApples}, Required: ${withdrawApples}`);
          }
          if (isGramPayout && currentDiamonds < withdrawDiamonds) {
            throw new Error(`Insufficient Diamonds! Available: ${currentDiamonds}, Required: ${withdrawDiamonds}`);
          }

          // Deduct balances
          const updateData = {
            apples: admin.firestore.FieldValue.increment(-withdrawApples)
          };
          if (withdrawDiamonds > 0) {
            updateData.diamonds = admin.firestore.FieldValue.increment(-withdrawDiamonds);
          }
          transaction.update(userRef, updateData);

          // Create withdrawal record
          const newWithdrawalRef = db.collection('withdrawals').doc();
          const record = {
            id: newWithdrawalRef.id,
            userId: Number(tgUser.id),
            userName: userData.name || 'Farmer',
            apples: withdrawApples,
            diamonds: withdrawDiamonds,
            gramAmount: gramAmount || null,
            method,
            accountNumber,
            status: isGramPayout ? 'processing' : 'pending',
            createdAt: new Date().toISOString()
          };

          transaction.set(newWithdrawalRef, record);
          return record;
        });

        // 2. ⚡ If GRAM (TON) -> Trigger Automated On-Chain Transfer ⚡
        if (isGramPayout && gramAmount) {
          console.log(`[Auto Payout] Processing on-chain TON payout for ${gramAmount} GRAM to ${accountNumber}...`);
          
          try {
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
        console.error('submitWithdraw error:', err);
        return res.status(500).json({ error: err.message });
      }
    }
  };
}
