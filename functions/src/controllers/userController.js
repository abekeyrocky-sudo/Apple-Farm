import { calculateLevel } from '../utils/levelSystem.js';

export function createUserController(db) {
  return {
    // 1. Sync or create user
    syncUser: async (req, res) => {
      try {
        const tgUser = req.telegramUser || req.body.user;
        if (!tgUser || !tgUser.id) {
          return res.status(400).json({ error: 'User ID is required' });
        }

        const userId = tgUser.id.toString();
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || 'Farmer';

        if (!userDoc.exists) {
          const newUser = {
            id: Number(tgUser.id),
            name: fullName,
            username: tgUser.username || '',
            avatar: 'avatar-1',
            apples: 0,
            diamonds: 0.0,
            level: 1,
            energy: 100,
            maxEnergy: 100,
            lastEnergyUpdate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            referredBy: req.body.referrerId || null,
          };

          await userRef.set(newUser);
          return res.json({ success: true, user: newUser, isNew: true });
        }

        const existing = userDoc.data();
        const computedLevel = calculateLevel(existing.apples || 0);

        // Update profile details if changed
        if (existing.name !== fullName || existing.level !== computedLevel) {
          await userRef.update({ name: fullName, level: computedLevel });
          existing.name = fullName;
          existing.level = computedLevel;
        }

        return res.json({ success: true, user: existing, isNew: false });
      } catch (err) {
        console.error('syncUser error:', err);
        return res.status(500).json({ error: err.message });
      }
    },

    // 2. Update user profile / avatar
    updateAvatar: async (req, res) => {
      try {
        const tgUser = req.telegramUser || req.body.user;
        const { avatar } = req.body;
        if (!tgUser?.id || !avatar) {
          return res.status(400).json({ error: 'User ID and avatar are required' });
        }

        const userRef = db.collection('users').doc(tgUser.id.toString());
        await userRef.update({ avatar });

        return res.json({ success: true, avatar });
      } catch (err) {
        console.error('updateAvatar error:', err);
        return res.status(500).json({ error: err.message });
      }
    }
  };
}
