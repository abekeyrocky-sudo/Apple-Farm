// Telegram Channel / Group Membership Verification
export const OFFICIAL_COMMUNITY_URL = 'https://t.me/AppleFarmCommunity';
export const OFFICIAL_PAYOUTS_URL = 'https://t.me/AppleFarmPayouts';
const CLOUD_FUNCTION_URL = (import.meta.env.VITE_FUNCTIONS_URL || 'https://api-duztzw2gwa-uc.a.run.app/api').replace(/\/api$/, '');

/**
 * Checks if a user is a member of a Telegram channel/group/bot
 * @param {string|number} userId - Telegram User ID
 * @param {string} channelLink - Link or username of channel (e.g. https://t.me/MangoRush_Channel, @RockyHubChannel)
 * @returns {Promise<{verified: boolean, message?: string, notAdmin?: boolean}>}
 */
export async function verifyTelegramMembership(userId, channelLink) {
  if (!channelLink) return { verified: true };

  // If user ID is missing (e.g. testing in desktop browser without Telegram context)
  const tgUserId = userId || window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (!tgUserId) {
    console.warn('[Verify Telegram] No Telegram user ID detected.');
    return { 
      verified: false, 
      message: 'Could not detect your Telegram account. Please open this app inside Telegram.' 
    };
  }

  // Secure Cloud Functions backend endpoint
  try {
    const res = await fetch(`${CLOUD_FUNCTION_URL}/api/telegram/verify-member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: tgUserId,
        channelLink: channelLink
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.isMember) {
        return { verified: true, channel: data.channel };
      } else if (data.ok && !data.isMember) {
        return { 
          verified: false, 
          message: data.message || 'You have not joined this channel yet. Please join first.' 
        };
      } else if (data.notAdmin) {
        return { 
          verified: false, 
          notAdmin: true, 
          message: data.error 
        };
      } else if (data.error) {
        return { verified: false, message: data.error };
      }
    }
    return { verified: false, message: 'Verification server responded with an error. Please try again.' };
  } catch (err) {
    console.warn('[Backend Verify Error]:', err);
    return { verified: false, message: 'Could not connect to verification server. Please check your internet.' };
  }
}
