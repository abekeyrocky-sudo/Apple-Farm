import { calculateLevel } from '../utils/levelSystem.js';

// Canonical Server-Side Mission Definitions (5x Apple Rewards)
export const SERVER_REFER_MISSIONS = {
  1: { id: 1, target: 1, title: 'Invite 1 Friend', apples: 1500, diamonds: 0 },
  2: { id: 2, target: 3, title: 'Invite 3 Friends', apples: 5000, diamonds: 1 },
  3: { id: 3, target: 5, title: 'Invite 5 Friends', apples: 12500, diamonds: 3 },
  4: { id: 4, target: 10, title: 'Invite 10 Friends', apples: 30000, diamonds: 8 },
  5: { id: 5, target: 25, title: 'Invite 25 Friends', apples: 100000, diamonds: 25 },
  6: { id: 6, target: 50, title: 'Invite 50 Friends', apples: 250000, diamonds: 60 },
  7: { id: 7, target: 100, title: 'Invite 100 Friends', apples: 600000, diamonds: 150 },
  8: { id: 8, target: 500, title: 'Invite 500 Friends', apples: 3500000, diamonds: 800 },
};

export function createReferralMissionController(db, admin) {
  return {
    claimMission: async (req, res) => {
      try {
        const tgUser = req.telegramUser || req.body.user;
        const { missionId } = req.body;

        if (!tgUser?.id || !missionId) {
          return res.status(400).json({ error: 'Valid missionId and authenticated user are required' });
        }

        const mission = SERVER_REFER_MISSIONS[Number(missionId)];
        if (!mission) {
          return res.status(400).json({ error: 'Invalid referral mission ID' });
        }

        const userId = tgUser.id.toString();
        const userRef = db.collection('users').doc(userId);

        const result = await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) {
            throw new Error('User not found in database');
          }

          const userData = userDoc.data();
          const invitedFriends = Array.isArray(userData.invitedFriends) ? userData.invitedFriends : [];
          const actualInvitedCount = Math.max(invitedFriends.length, Number(userData.referralsCount || 0));

          // 1. 🛡️ Server-Side Verification of Real Friend Count
          if (actualInvitedCount < mission.target) {
            throw new Error(`Target not reached! Required: ${mission.target} friends, Current: ${actualInvitedCount}`);
          }

          // 2. 🛡️ Server-Side Check for Duplicate Claims
          const claimedMap = userData.claimedReferMissions || {};
          if (claimedMap[mission.id] || claimedMap[String(mission.id)]) {
            throw new Error('This referral mission reward has already been claimed');
          }

          // 3. 🛡️ Calculate new totals and updates
          const currentApples = (userData.apples || 0) + mission.apples;
          const currentDiamonds = Number(((userData.diamonds || 0) + mission.diamonds).toFixed(2));
          const newLevel = calculateLevel(currentApples);

          const updates = {
            [`claimedReferMissions.${mission.id}`]: true,
            apples: admin.firestore.FieldValue.increment(mission.apples),
            level: newLevel
          };

          if (mission.diamonds > 0) {
            updates.diamonds = admin.firestore.FieldValue.increment(mission.diamonds);
          }

          transaction.update(userRef, updates);

          // 4. Record Transaction History
          const txRef = userRef.collection('transactions').doc();
          transaction.set(txRef, {
            title: 'Referral Milestone',
            subtitle: mission.title,
            amount: `+${mission.apples.toLocaleString()} 🍎${mission.diamonds > 0 ? `, +${mission.diamonds} 💎` : ''}`,
            currency: 'apple',
            type: 'earn',
            category: 'invite',
            status: 'Completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdTime: Date.now()
          });

          return {
            apples: currentApples,
            diamonds: currentDiamonds,
            level: newLevel,
            missionId: mission.id
          };
        });

        return res.json({ success: true, ...result });
      } catch (err) {
        console.error('[claimReferralMission error]:', err.message);
        return res.status(400).json({ error: err.message });
      }
    }
  };
}
