// Telegram Channel / Group Membership Verification
export const OFFICIAL_COMMUNITY_URL = 'https://t.me/AppleFarmCommunity';
export const OFFICIAL_PAYOUTS_URL = 'https://t.me/AppleFarmPayouts';

const CLOUD_FUNCTION_URL = (import.meta.env.VITE_FUNCTIONS_URL || 'https://api-duztzw2gwa-uc.a.run.app/api').replace(/\/api$/, '') || 'https://api-duztzw2gwa-uc.a.run.app';

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
export async function verifyTelegramMembership(userId, channelLink, options = {}) {
  if (!channelLink) return { verified: true };

  const tgUserId = userId || window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (!tgUserId) {
    console.warn('[Verify Telegram] No Telegram user ID detected.');
    return { verified: false, message: 'Please open via Telegram to verify membership.' };
  }

  const channelSlug = getChannelSlug(channelLink).toLowerCase();
  const cacheKey = `apple_farm_tg_verified_${tgUserId}_${channelSlug}`;

  // Direct Live Verification with Cloud Function Bot API (No stale cache)
  const endpoint = `${CLOUD_FUNCTION_URL}/api/telegram/verify-member`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

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
        // User is not a member or left the channel -> Clear any stale cache!
        try {
          localStorage.removeItem(cacheKey);
        } catch (e) {}
        return { 
          verified: false, 
          message: data.message || `You have not joined @${channelSlug} yet. Please join first.` 
        };
      } else if (data.notAdmin) {
        console.warn('[Verify Telegram]: Bot is not admin in channel:', data.error);
        return { verified: true, notAdmin: true, message: data.error };
      }
    } else {
      console.warn(`[Verify Telegram] Endpoint returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn(`[Verify Telegram] Error verifying channel:`, err?.message || err);
  }

  return { 
    verified: false, 
    fallback: true,
    message: 'Could not connect to Telegram verification server. Please try again.' 
  };
}

