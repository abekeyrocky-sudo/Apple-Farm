import { soundManager } from './soundManager';
import { addTransaction } from './transactionHistory';
import { addDiamondsInDB } from '../firebase';
import confetti from 'canvas-confetti';

const GIGA_PROJECT_ID = '8374';
let isInitialized = false;
let currentRewardCallback = null;
let currentUserId = 'guest';

export function initGigaOfferWall(user, onRewardCallback) {
  if (onRewardCallback) {
    currentRewardCallback = onRewardCallback;
  }

  if (user?.id) {
    currentUserId = user.id.toString();
  }

  const userId = currentUserId;

  // Ensure Giga SDK Callback queue exists
  window.loadGigaSDKCallbacks = window.loadGigaSDKCallbacks || [];

  const initAction = () => {
    if (typeof window.loadOfferWallSDK === 'function') {
      window.loadOfferWallSDK({
        projectId: GIGA_PROJECT_ID,
        userId: userId,
      })
        .then((sdk) => {
          window.gigaOfferWallSDK = sdk;
          isInitialized = true;
          console.log('[GigaPub Offerwall SDK Ready]:', sdk);

          // Handle Reward Claims from Offerwall
          sdk.on('rewardClaim', async (data) => {
            console.log('[GigaPub Offerwall Reward Received]:', data);
            try {
              const rewardDiamonds = Number(data.amount) || 1.0;
              const rewardUserId = data.userId || userId;

              // 1. Trigger App level update callback
              if (currentRewardCallback) {
                currentRewardCallback({
                  diamonds: rewardDiamonds,
                  data: data,
                });
              }

              // 2. Persist to Firestore DB (Atomic Increment: keeps previous balance safe)
              if (rewardUserId && rewardUserId !== 'guest') {
                await addDiamondsInDB(rewardUserId, rewardDiamonds);
              }

              // 3. Record in Transaction History
              addTransaction({
                userId: rewardUserId,
                title: 'Offerwall Task Reward',
                subtitle: `Completed Offer (${data.rewardId?.slice(0, 8) || 'Task'})`,
                amount: `+${rewardDiamonds.toFixed(1)}`,
                currency: 'diamond',
                type: 'earn',
                category: 'offerwall',
                status: 'Completed',
              });

              // 4. Sound & Celebration
              soundManager.play('reward');
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
              });

              // 5. Confirm Reward to GigaPub SDK
              await sdk.confirmReward(data.rewardId, data.hash);
              console.log('[GigaPub Reward Confirmed]:', data.rewardId);
            } catch (err) {
              console.error('[GigaPub Reward Processing Error]:', err);
            }
          });
        })
        .catch((error) => {
          console.error('[GigaPub SDK Load Error]:', error);
        });
    }
  };

  // If loader already ready, run directly, otherwise push to callback array
  if (window.loadOfferWallSDK) {
    initAction();
  } else {
    window.loadGigaSDKCallbacks.push(initAction);
  }
}

export function openGigaOfferWall() {
  soundManager.playClickSound();
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
  }

  if (window.gigaOfferWallSDK && typeof window.gigaOfferWallSDK.open === 'function') {
    window.gigaOfferWallSDK.open();
    return true;
  } else {
    console.warn('[GigaPub Offerwall SDK is not ready yet]');
    // Fallback: Open web link or inform user
    window.open(`https://wall.giga.pub/offerwall?projectId=${GIGA_PROJECT_ID}`, '_blank');
    return false;
  }
}
