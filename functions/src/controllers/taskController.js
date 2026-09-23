import { calculateLevel } from '../utils/levelSystem.js';

export function createTaskController(db, admin) {
  return {
    claimTask: async (req, res) => {
      try {
        const tgUser = req.telegramUser || req.body.user;
        const { taskId, rewardAmount } = req.body;
        const reward = Number(rewardAmount) || 0;

        if (!tgUser?.id || !taskId || reward <= 0) {
          return res.status(400).json({ error: 'Valid taskId and rewardAmount are required' });
        }

        const userRef = db.collection('users').doc(tgUser.id.toString());
        const taskLogRef = db.collection('users').doc(tgUser.id.toString()).collection('claimedTasks').doc(taskId);

        const result = await db.runTransaction(async (transaction) => {
          const taskDoc = await transaction.get(taskLogRef);
          if (taskDoc.exists) {
            throw new Error('Task reward has already been claimed');
          }

          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) throw new Error('User not found');

          const currentApples = (userDoc.data().apples || 0) + reward;
          const newLevel = calculateLevel(currentApples);

          transaction.set(taskLogRef, {
            taskId,
            reward,
            claimedAt: new Date().toISOString()
          });

          transaction.update(userRef, {
            apples: admin.firestore.FieldValue.increment(reward),
            level: newLevel
          });

          return { apples: currentApples, level: newLevel };
        });

        return res.json({ success: true, ...result });
      } catch (err) {
        console.error('claimTask error:', err);
        return res.status(500).json({ error: err.message });
      }
    }
  };
}
