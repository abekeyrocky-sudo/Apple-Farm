import { calculateLevel } from '../utils/levelSystem.js';

const DAILY_APPLE_LIMIT = 100000; // 100K Apples max daily per TG ID
const DAILY_DIAMOND_LIMIT = 5;     // 5 Diamonds max daily per TG ID

const BANNED_USER_IDS = [
  '8869698832', // Fahim Islam
  '7505085733', // Sufian Ahmed
  '7098276899', // ASHA
  '8550901242', // Tuhin Sorkar
  '7211238047', // Dghht Fg
  '7894020110', // Tuhin Akondo
  '1901822476', // Md. Abdullah
  '8939932081', // Zannatul Naima
  '8920592068', // Fahim Kaha
];

export function createHubcoinController(db, admin, botToken, miniAppUrl) {
  return {
    receiveTransfer: async (req, res) => {
      try {
        const { userId, userName, amount, type, txId } = req.body;

        // 1. Validation
        if (!userId) {
          return res.status(400).json({ ok: false, error: 'User ID is required' });
        }

        const userIdStr = userId.toString();
        if (BANNED_USER_IDS.includes(userIdStr)) {
          return res.status(403).json({ ok: false, error: 'User account is permanently suspended' });
        }

        const numAmount = Number(amount);
        if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
          return res.status(400).json({ ok: false, error: 'Valid positive amount is required' });
        }

        const validTypes = ['apple', 'diamond'];
        const rewardType = (type || 'apple').toLowerCase();
        if (!validTypes.includes(rewardType)) {
          return res.status(400).json({ ok: false, error: 'Invalid reward type. Must be apple or diamond' });
        }

        // Anti-fraud single transfer limit check
        if (rewardType === 'apple' && numAmount > DAILY_APPLE_LIMIT) {
          console.warn(`[Anti-Fraud Alert]: Blocked huge single Apple transfer of ${numAmount} for user ${userIdStr}`);
          return res.status(400).json({ 
            ok: false, 
            error: `Transfer amount exceeds single transfer limit of ${DAILY_APPLE_LIMIT.toLocaleString()} Apples` 
          });
        }

        if (rewardType === 'diamond' && numAmount > DAILY_DIAMOND_LIMIT) {
          console.warn(`[Anti-Fraud Alert]: Blocked huge single Diamond transfer of ${numAmount} for user ${userIdStr}`);
          return res.status(400).json({ 
            ok: false, 
            error: `Transfer amount exceeds single transfer limit of ${DAILY_DIAMOND_LIMIT} Diamonds` 
          });
        }

        if (!txId) {
          return res.status(400).json({ ok: false, error: 'Transaction ID (txId) is required' });
        }

        const userRef = db.collection('users').doc(userIdStr);
        const transferRef = db.collection('hubcoin_transfers').doc(txId);

        // 2. Idempotency Check (Prevent duplicate transfer / replay attacks)
        const existingTx = await transferRef.get();
        if (existingTx.exists) {
          const data = existingTx.data();
          return res.status(200).json({
            ok: true,
            success: true,
            message: 'Transfer already processed',
            duplicate: true,
            txId,
            creditedAmount: data.amount,
            type: data.type
          });
        }

        // 3. Atomic Database Update via Firestore Transaction
        const result = await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          let newApples = 0;
          let newDiamonds = 0;
          let isNewUser = false;
          const todayStr = new Date().toISOString().slice(0, 10);

          let currentDayApples = 0;
          let currentDayDiamonds = 0;

          if (userDoc.exists) {
            const currentData = userDoc.data();
            const daily = currentData.dailyHubcoinTransfer;
            if (daily && daily.date === todayStr) {
              currentDayApples = Number(daily.apples || 0);
              currentDayDiamonds = Number(daily.diamonds || 0);
            }
          }

          // Enforce cumulative daily limits per TG ID
          if (rewardType === 'apple') {
            if (currentDayApples + numAmount > DAILY_APPLE_LIMIT) {
              const remaining = Math.max(0, DAILY_APPLE_LIMIT - currentDayApples);
              throw new Error(`Daily Apple transfer limit reached! Max ${DAILY_APPLE_LIMIT.toLocaleString()} Apples allowed per day. (Remaining limit today: ${remaining.toLocaleString()} Apples)`);
            }
          } else if (rewardType === 'diamond') {
            if (currentDayDiamonds + numAmount > DAILY_DIAMOND_LIMIT) {
              const remaining = Math.max(0, DAILY_DIAMOND_LIMIT - currentDayDiamonds);
              throw new Error(`Daily Diamond transfer limit reached! Max ${DAILY_DIAMOND_LIMIT} Diamonds allowed per day. (Remaining limit today: ${remaining} Diamonds)`);
            }
          }

          const updatedDailyTransfer = {
            date: todayStr,
            apples: currentDayApples + (rewardType === 'apple' ? numAmount : 0),
            diamonds: currentDayDiamonds + (rewardType === 'diamond' ? numAmount : 0)
          };

          const pendingRewardData = {
            amount: numAmount,
            type: rewardType,
            txId: txId,
            receivedAt: new Date().toISOString(),
            seen: false
          };

          if (!userDoc.exists) {
            isNewUser = true;
            newApples = rewardType === 'apple' ? numAmount : 0;
            newDiamonds = rewardType === 'diamond' ? numAmount : 0;

            const newUser = {
              id: Number(userId),
              name: userName || 'Farmer',
              username: '',
              avatar: 'avatar-1',
              apples: newApples,
              diamonds: newDiamonds,
              level: calculateLevel(newApples),
              energy: 100,
              maxEnergy: 100,
              lastEnergyUpdate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              source: 'hubcoin_transfer',
              dailyHubcoinTransfer: updatedDailyTransfer,
              pendingHubcoinReward: pendingRewardData
            };
            transaction.set(userRef, newUser);
          } else {
            const current = userDoc.data();
            const currentApples = Number(current.apples || 0);
            const currentDiamonds = Number(current.diamonds || 0);

            if (rewardType === 'apple') {
              newApples = currentApples + numAmount;
              newDiamonds = currentDiamonds;
              const newLevel = calculateLevel(newApples);

              transaction.update(userRef, {
                apples: admin.firestore.FieldValue.increment(numAmount),
                level: newLevel,
                dailyHubcoinTransfer: updatedDailyTransfer,
                pendingHubcoinReward: pendingRewardData
              });
            } else {
              newApples = currentApples;
              newDiamonds = currentDiamonds + numAmount;

              transaction.update(userRef, {
                diamonds: admin.firestore.FieldValue.increment(numAmount),
                dailyHubcoinTransfer: updatedDailyTransfer,
                pendingHubcoinReward: pendingRewardData
              });
            }
          }

          // 4. Record user transaction in users/${userId}/transactions
          const userTxRef = userRef.collection('transactions').doc();
          const txTitle = rewardType === 'apple' ? 'Apple Mission Apples Received' : 'Apple Mission Diamonds Received';
          const rewardLabel = rewardType === 'apple' 
            ? `+${numAmount.toLocaleString()} Apples` 
            : `+${numAmount.toLocaleString()} Diamonds`;

          transaction.set(userTxRef, {
            title: txTitle,
            subtitle: `Transferred from Apple Mission`,
            amount: rewardLabel,
            currency: rewardType,
            type: 'earn',
            category: 'apple_mission_transfer',
            status: 'Completed',
            txId: txId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            timestamp: Date.now()
          });

          // 5. Save in hubcoin_transfers collection for bookkeeping & audit
          transaction.set(transferRef, {
            txId,
            userId: userIdStr,
            userName: userName || 'Farmer',
            amount: numAmount,
            type: rewardType,
            status: 'completed',
            isNewUser,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            timestamp: Date.now()
          });

          return { 
            newApples, 
            newDiamonds, 
            isNewUser,
            dailyTransferredApples: updatedDailyTransfer.apples,
            dailyTransferredDiamonds: updatedDailyTransfer.diamonds,
            remainingApplesToday: Math.max(0, DAILY_APPLE_LIMIT - updatedDailyTransfer.apples),
            remainingDiamondsToday: Math.max(0, DAILY_DIAMOND_LIMIT - updatedDailyTransfer.diamonds)
          };
        });

        // 6. Send Celebratory Telegram Bot Message
        if (botToken) {
          try {
            const unitIcon = rewardType === 'apple' ? '🍎' : '💎';
            const unitName = rewardType === 'apple' ? `Apples ${unitIcon}` : `Diamonds ${unitIcon}`;
            const text = `*Apple Mission Transfer Received!*\n\n` +
              `👤 *Farmer:* ${userName || 'Farmer'}\n` +
              `💰 *Amount Credited:* \`+${numAmount.toLocaleString()} ${unitName}\`\n` +
              `🧾 *Transaction ID:* \`${txId}\`\n\n` +
              `🚀 _Your Apple Farm balance has been instantly credited! Open the app to enjoy your harvest._`;

            const replyMarkup = {
              inline_keyboard: [
                [
                  { text: 'Play Apple Farm', web_app: { url: miniAppUrl || 'https://www.apple-farm.world' } }
                ],
                [
                  { text: 'View Balance & Harvest', web_app: { url: miniAppUrl || 'https://www.apple-farm.world' } }
                ]
              ]
            };

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: userIdStr,
                text,
                parse_mode: 'Markdown',
                reply_markup: replyMarkup
              })
            }).catch(() => {});
          } catch (botErr) {
            console.warn('[Apple Mission Transfer Bot Notify Error]:', botErr.message);
          }
        }

        return res.status(200).json({
          ok: true,
          success: true,
          message: `Successfully transferred ${numAmount} ${rewardType === 'apple' ? 'Apples' : 'Diamonds'} to Apple Farm!`,
          userId: userIdStr,
          amount: numAmount,
          type: rewardType,
          txId,
          dailyTransferredApples: result.dailyTransferredApples,
          dailyTransferredDiamonds: result.dailyTransferredDiamonds,
          remainingApplesToday: result.remainingApplesToday,
          remainingDiamondsToday: result.remainingDiamondsToday,
          newApples: result.newApples,
          newDiamonds: result.newDiamonds
        });
      } catch (err) {
        console.error('[HubCoin Transfer Error]:', err.message);
        return res.status(400).json({ ok: false, error: err.message });
      }
    }
  };
}
