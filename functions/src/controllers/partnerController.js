export function createPartnerController(db, admin) {
  return {
    // ⚡ Claim Partner Commission
    claimProfit: async (req, res) => {
      try {
        const tgUser = req.telegramUser || req.body.user;
        if (!tgUser?.id) {
          return res.status(400).json({ error: 'Authenticated user required' });
        }

        const userId = tgUser.id.toString();
        const userRef = db.collection('users').doc(userId);

        const result = await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) throw new Error('User not found in database');

          const userData = userDoc.data();
          const claimable = Number(userData.claimablePartnerGram || 0);

          if (claimable <= 0) {
            throw new Error('No partner profit available to claim');
          }

          transaction.update(userRef, {
            claimablePartnerGram: 0,
            claimedPartnerGram: admin.firestore.FieldValue.increment(claimable),
            gramBalance: admin.firestore.FieldValue.increment(claimable)
          });

          const txRef = userRef.collection('transactions').doc();
          transaction.set(txRef, {
            title: 'Partner Profit Claimed',
            subtitle: '15% Partner Task Profit Payout',
            amount: `+${claimable} GRAM`,
            currency: 'gram',
            type: 'earn',
            category: 'partner_claim',
            status: 'Completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdTime: Date.now()
          });

          return {
            claimedGram: claimable,
            newGramBalance: (Number(userData.gramBalance || 0) + claimable)
          };
        });

        return res.json({ success: true, ...result });
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
