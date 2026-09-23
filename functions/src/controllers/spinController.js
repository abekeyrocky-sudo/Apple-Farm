import { calculateLevel } from '../utils/levelSystem.js';

const SLICES = [
  { id: 1, type: 'diamond', value: 500, weight: 5 },
  { id: 2, type: 'apple', value: 100, weight: 30 },
  { id: 3, type: 'apple', value: 500, weight: 10 },
  { id: 4, type: 'apple', value: 200, weight: 20 },
  { id: 5, type: 'apple', value: 200, weight: 20 },
  { id: 6, type: 'apple', value: 300, weight: 10 },
  { id: 7, type: 'apple', value: 500, weight: 5 },
];

export function createSpinController(db, admin) {
  return {
    playSpin: async (req, res) => {
      try {
        const tgUser = req.telegramUser || req.body.user;
        if (!tgUser?.id) {
          return res.status(400).json({ error: 'User ID is required' });
        }

        // Weighted random selection
        const totalWeight = SLICES.reduce((acc, s) => acc + s.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedSlice = SLICES[0];

        for (const slice of SLICES) {
          if (random < slice.weight) {
            selectedSlice = slice;
            break;
          }
          random -= slice.weight;
        }

        const userRef = db.collection('users').doc(tgUser.id.toString());

        await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) throw new Error('User not found');

          const updatePayload = {};
          if (selectedSlice.type === 'diamond') {
            updatePayload.diamonds = admin.firestore.FieldValue.increment(selectedSlice.value);
          } else {
            updatePayload.apples = admin.firestore.FieldValue.increment(selectedSlice.value);
          }

          transaction.update(userRef, updatePayload);
        });

        return res.json({
          success: true,
          sliceId: selectedSlice.id,
          type: selectedSlice.type,
          value: selectedSlice.value,
          label: String(selectedSlice.value),
        });
      } catch (err) {
        console.error('playSpin error:', err);
        return res.status(500).json({ error: err.message });
      }
    }
  };
}
