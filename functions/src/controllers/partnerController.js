export function createPartnerController(db, admin) {
  return {
    // ⚡ Claim Partner Commission & Trigger On-Chain TON Transfer from Master Wallet
    claimProfit: async (req, res) => {
      try {
        const tgUser = req.telegramUser || req.body.user;
        const { walletAddress } = req.body;

        if (!tgUser?.id) {
          return res.status(400).json({ error: 'Authenticated user required' });
        }

        if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.trim().length < 10) {
          return res.status(400).json({ error: 'Please connect your TON wallet first to receive on-chain payout.' });
        }

        const cleanWallet = walletAddress.trim();
        const userId = tgUser.id.toString();
        const userRef = db.collection('users').doc(userId);

        const { withdrawalRecord, claimable } = await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) throw new Error('User not found in database');

          const userData = userDoc.data();
          const currentClaimable = Number(userData.claimablePartnerGram || 0);

          // 🛡️ Minimum 1.0 GRAM threshold check
          if (currentClaimable < 1.0) {
            throw new Error(`Minimum 1.0000 GRAM required to trigger on-chain payout! Current available: ${currentClaimable.toFixed(4)} GRAM`);
          }

          transaction.update(userRef, {
            claimablePartnerGram: 0,
            claimedPartnerGram: admin.firestore.FieldValue.increment(currentClaimable)
          });

          // Create transaction record
          const txRef = userRef.collection('transactions').doc();
          transaction.set(txRef, {
            title: 'Partner Profit Payout',
            subtitle: `On-chain transfer to ${cleanWallet.slice(0, 6)}...${cleanWallet.slice(-6)}`,
            amount: `+${currentClaimable.toFixed(4)} GRAM`,
            currency: 'gram',
            type: 'earn',
            category: 'partner_payout',
            status: 'Processing',
            walletAddress: cleanWallet,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdTime: Date.now()
          });

          // Create withdrawal record
          const withdrawalRef = db.collection('withdrawals').doc();
          const record = {
            id: withdrawalRef.id,
            userId: Number(userId),
            userName: userData.name || userData.username || 'Farmer',
            gramAmount: currentClaimable,
            method: 'GRAM (TON)',
            accountNumber: cleanWallet,
            status: 'processing',
            type: 'partner_profit_onchain_payout',
            createdAt: new Date().toISOString()
          };
          transaction.set(withdrawalRef, record);

          return { withdrawalRecord: record, claimable: currentClaimable };
        });

        // 🚀 Execute Real On-Chain Transfer from Master Wallet to User Wallet
        try {
          const { sendTonPayout } = await import('../utils/tonPayout.js');
          const payoutResult = await sendTonPayout(
            cleanWallet,
            claimable,
            `Apple Farm: ${claimable.toFixed(4)} GRAM Partner Profit to ${userId}`
          );

          if (payoutResult && payoutResult.success) {
            await db.collection('withdrawals').doc(withdrawalRecord.id).update({
              status: 'completed',
              onChainSeqno: payoutResult.txSeqno || payoutResult.seqno || null,
              completedAt: new Date().toISOString()
            });

            return res.json({
              success: true,
              claimedGram: claimable,
              walletAddress: cleanWallet,
              txSeqno: payoutResult.txSeqno || payoutResult.seqno,
              message: `Successfully sent ${claimable.toFixed(4)} GRAM from Master Wallet to ${cleanWallet}!`
            });
          } else {
            console.warn('[Partner Payout] On-chain transfer queued:', payoutResult?.error);
            await db.collection('withdrawals').doc(withdrawalRecord.id).update({
              status: 'payout_queued',
              payoutError: payoutResult?.error || 'Broadcast pending',
              updatedAt: new Date().toISOString()
            });

            return res.json({
              success: true,
              claimedGram: claimable,
              walletAddress: cleanWallet,
              queued: true,
              message: `Payout of ${claimable.toFixed(4)} GRAM recorded and queued for on-chain broadcast.`
            });
          }
        } catch (chainErr) {
          console.error('[Partner Payout OnChain Exception]:', chainErr);
          return res.json({
            success: true,
            claimedGram: claimable,
            walletAddress: cleanWallet,
            queued: true,
            message: `Payout of ${claimable.toFixed(4)} GRAM queued for TON blockchain transfer.`
          });
        }
      } catch (err) {
        console.error('partner claimProfit error:', err);
        return res.status(400).json({ error: err.message });
      }
    },

    // ⚡ Track Partner Commission (Idempotent & Secure)
    trackCommission: async (req, res) => {
      try {
        const { taskId, creatorId, creatorName, creatorUsername, taskTitle, totalPaidGram } = req.body;
        if (!taskId || !creatorId || !totalPaidGram || Number(totalPaidGram) <= 0) {
          return res.status(400).json({ error: 'Valid taskId, creatorId, and positive totalPaidGram required' });
        }

        const creatorIdStr = creatorId.toString();
        const creatorDoc = await db.collection('users').doc(creatorIdStr).get();
        if (!creatorDoc.exists) {
          return res.status(404).json({ error: 'Creator not found' });
        }

        const creatorData = creatorDoc.data();
        const referrerId = creatorData.referredBy;

        if (!referrerId || referrerId.toString() === creatorIdStr) {
          return res.json({ success: false, message: 'No valid referrer' });
        }

        const referrerIdStr = referrerId.toString();
        const gramAmount = Number(totalPaidGram);
        const commissionGram = Number((gramAmount * 0.15).toFixed(4));

        const commDocId = `comm_${taskId}`;
        const commRef = db.collection('partner_task_commissions').doc(commDocId);
        const referrerRef = db.collection('users').doc(referrerIdStr);

        const trackResult = await db.runTransaction(async (transaction) => {
          const commDoc = await transaction.get(commRef);
          if (commDoc.exists) {
            return { alreadyTracked: true };
          }

          const refDoc = await transaction.get(referrerRef);
          if (!refDoc.exists) {
            return { noReferrerDoc: true };
          }

          transaction.set(commRef, {
            id: commDocId,
            taskId: taskId.toString(),
            taskTitle: taskTitle || 'Partner Task',
            creatorId: creatorIdStr,
            creatorName: creatorName || 'Friend',
            creatorUsername: creatorUsername || '',
            referrerId: referrerIdStr,
            taskGramAmount: gramAmount,
            commissionRate: 0.15,
            profitGram: commissionGram,
            claimed: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdTime: Date.now()
          });

          transaction.update(referrerRef, {
            claimablePartnerGram: admin.firestore.FieldValue.increment(commissionGram),
            totalPartnerGramEarned: admin.firestore.FieldValue.increment(commissionGram),
            partnerReferralTaskCount: admin.firestore.FieldValue.increment(1)
          });

          const txRef = referrerRef.collection('transactions').doc();
          transaction.set(txRef, {
            title: 'Partner 15% Profit',
            subtitle: `${creatorName || 'Friend'} posted: ${taskTitle || 'Partner Task'}`,
            amount: `+${commissionGram} GRAM`,
            currency: 'gram',
            type: 'earn',
            category: 'partner_commission',
            status: 'Completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdTime: Date.now()
          });

          return { credited: true, commissionGram, referrerId: referrerIdStr };
        });

        return res.json({ success: true, ...trackResult });
      } catch (err) {
        console.error('partner trackCommission error:', err);
        return res.status(500).json({ error: err.message });
      }
    }
  };
}
