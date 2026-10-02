// Telegram Channel / Group Membership Verification
export const OFFICIAL_COMMUNITY_URL = 'https://t.me/AppleFarmCommunity';
export const OFFICIAL_PAYOUTS_URL = 'https://t.me/AppleFarmPayouts';

const CLOUD_FUNCTION_URL = (import.meta.env.VITE_FUNCTIONS_URL || 'https://api-duztzw2gwa-uc.a.run.app/api').replace(/\/api$/, '');

/**
 * Extracts username/slug from a Telegram link
 */
export function getChannelSlug(channelLink = '') {
  return channelLink.trim()
    .replace(/^https?:\/\/(www\.)?t\.me\//i, '')
    .replace(/^t\.me\//i, '')
    .replace(/^@/, '')
    .split('/')[0]
    .split('?')[0];
}

/**
 * Checks if a user is a member of a Telegram channel/group/bot
 * @param {string|number} userId - Telegram User ID
 * @param {string} channelLink - Link or username of channel (e.g. https://t.me/AppleFarmCommunity)
 * @returns {Promise<{verified: boolean, message?: string, notAdmin?: boolean}>}
 */
export async function verifyTelegramMembership(userId, channelLink) {
  if (!channelLink) return { verified: true };

  const tgUserId = userId || window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (!tgUserId) {
    console.warn('[Verify Telegram] No Telegram user ID detected.');
    return { verified: true }; // Don't block mock/dev users
  }

  const channelSlug = getChannelSlug(channelLink).toLowerCase();
  const cacheKey = `apple_farm_tg_verified_${tgUserId}_${channelSlug}`;

  // 1. Fast Cache Check: If already verified in this session, return true immediately
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached === 'true') {
      return { verified: true, channel: `@${channelSlug}`, cached: true };
    }
  } catch (e) {}

  // 2. Try Vercel Serverless Function first, then Firebase Cloud Function as fallback
  const endpoints = [
    '/api/verify-member',
    `${CLOUD_FUNCTION_URL}/api/telegram/verify-member`
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: tgUserId,
          channelLink: channelLink
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.isMember) {
          try {
            localStorage.setItem(cacheKey, 'true');
          } catch (e) {}
          return { verified: true, channel: data.channel };
        } else if (data.ok && !data.isMember) {
          // Explicitly left or not a member
          return { 
            verified: false, 
            message: data.message || 'You have not joined this channel yet. Please join first.' 
          };
        } else if (data.notAdmin) {
          console.warn('[Verify Telegram]: Bot is not admin in channel, bypassing block.');
          return { verified: true, notAdmin: true, message: data.error };
        }
      } else {
        console.warn(`[Verify Telegram] Endpoint ${endpoint} returned HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn(`[Verify Telegram] Error calling ${endpoint}:`, err?.message || err);
    }
  }

  // 3. Fallback: If both endpoints failed or are unreachable (e.g. 503 / billing paused),
  // do not permanently lock out genuine users.
  console.warn('[Verify Telegram] Backend verification service unavailable, failing open for UX safety.');
  return { 
    verified: true, 
    fallback: true,
    message: 'Verification server is currently unavailable.' 
  };
}
