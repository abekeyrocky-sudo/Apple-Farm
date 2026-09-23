export function createAdsController(db, admin) {
  return {
    claimAdReward: async (req, res) => {
      try {
        const tgUser = req.telegramUser || req.body.user;
        const rewardApples = Number(req.body.apples) || 50;

        if (!tgUser?.id) {
          return res.status(400).json({ error: 'User ID is required' });
        }

        const today = new Date().toISOString().split('T')[0];
        const userRef = db.collection('users').doc(tgUser.id.toString());
        const adLogRef = db.collection('users').doc(tgUser.id.toString()).collection('adLogs').doc(today);

        const result = await db.runTransaction(async (transaction) => {
          const adDoc = await transaction.get(adLogRef);
          const currentCount = adDoc.exists ? (adDoc.data().count || 0) : 0;

          if (currentCount >= 20) {
            throw new Error('Daily ad limit (20/20) reached! Please come back tomorrow.');
          }

          transaction.set(adLogRef, {
            count: currentCount + 1,
            lastWatchedAt: new Date().toISOString()
          }, { merge: true });

          transaction.update(userRef, {
            apples: admin.firestore.FieldValue.increment(rewardApples)
          });

          return { watchedToday: currentCount + 1, maxDaily: 20, reward: rewardApples };
        });

        return res.json({ success: true, ...result });
      } catch (err) {
        console.error('claimAdReward error:', err);
        return res.status(500).json({ error: err.message });
      }
    }
  };
}
