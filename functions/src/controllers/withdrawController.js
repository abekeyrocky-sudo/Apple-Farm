export function createWithdrawController(db, admin) {
  return {
    submitWithdraw: async (req, res) => {
      try {
        const tgUser = req.telegramUser || req.body.user;
        const { amount, method, accountNumber } = req.body;
        const withdrawAmount = Number(amount);

        if (!tgUser?.id || !withdrawAmount || withdrawAmount <= 0 || !method || !accountNumber) {
          return res.status(400).json({ error: 'Valid user, amount, method, and account number are required' });
        }

        const userId = tgUser.id.toString();
        const userRef = db.collection('users').doc(userId);

        const withdrawalRecord = await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) throw new Error('User not found');

          const userData = userDoc.data();
          const currentApples = userData.apples || 0;

          if (currentApples < withdrawAmount) {
            throw new Error(`Insufficient balance! Available: ${currentApples} Apples`);
          }

          // Deduct apples from user balance
          transaction.update(userRef, {
            apples: admin.firestore.FieldValue.increment(-withdrawAmount)
          });

          // Create new withdrawal request
          const newWithdrawalRef = db.collection('withdrawals').doc();
          const record = {
            id: newWithdrawalRef.id,
            userId: Number(tgUser.id),
            userName: userData.name || 'Farmer',
            amount: withdrawAmount,
            method,
            accountNumber,
            status: 'pending', // 'pending' | 'completed' | 'rejected'
            createdAt: new Date().toISOString()
          };

          transaction.set(newWithdrawalRef, record);
          return record;
        });

        return res.json({ success: true, withdrawal: withdrawalRecord });
      } catch (err) {
        console.error('submitWithdraw error:', err);
        return res.status(500).json({ error: err.message });
      }
    }
  };
}
