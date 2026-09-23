import { calculateLevel } from '../utils/levelSystem.js';

export function createHarvestController(db, admin) {
  return {
    tapHarvest: async (req, res) => {
      try {
        const tgUser = req.telegramUser || req.body.user;
        const count = Math.min(Number(req.body.count) || 1, 10); // Batch taps up to 10
        if (!tgUser?.id) {
          return res.status(400).json({ error: 'User ID is required' });
        }

        const userRef = db.collection('users').doc(tgUser.id.toString());

        const result = await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) {
            throw new Error('User not found');
          }

          const data = userDoc.data();
          const currentApples = (data.apples || 0) + count;
          const currentLevel = calculateLevel(currentApples);

          transaction.update(userRef, {
            apples: admin.firestore.FieldValue.increment(count),
            level: currentLevel,
            lastHarvestAt: new Date().toISOString()
          });

          return {
            apples: currentApples,
            level: currentLevel,
            gained: count
          };
        });

        return res.json({ success: true, ...result });
      } catch (err) {
        console.error('tapHarvest error:', err);
        return res.status(500).json({ error: err.message });
      }
    }
  };
}
