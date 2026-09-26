// Telegram Channel / Group Membership Verification
export const OFFICIAL_COMMUNITY_URL = 'https://t.me/MangoRush_Channel';
const CLOUD_FUNCTION_URL = 'https://api-duztzw2gwa-uc.a.run.app';
const BOT_TOKEN = '8995359366:AAFdsDniKILYpWVlPJUHN5MIUcvbcseG8Bw';

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
      message: 'Could not detect your Telegram account. Please open this app inside Telegram!' 
    };
  }

  // 1. Try Cloud Functions backend endpoint
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
          message: data.message || 'You have not joined this channel yet! Please join first.' 
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
  } catch (err) {
    console.warn('[Backend Verify Error, trying direct Telegram API fallback]:', err);
  }

  // 2. Direct Telegram Bot API fallback
  try {
    let channel = channelLink.trim()
      .replace(/^https?:\/\/(www\.)?t\.me\//i, '')
      .replace(/^t\.me\//i, '')
      .replace(/^@/, '')
      .split('/')[0]
      .split('?')[0];

    if (!channel) return { verified: false, message: 'Invalid channel link' };

    const chatId = `@${channel}`;
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${encodeURIComponent(tgUserId)}`;
    const tgRes = await fetch(url);
    const tgData = await tgRes.json();

    if (tgData.ok && tgData.result) {
      const status = tgData.result.status;
      const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(status);
      if (isMember) {
        return { verified: true, channel: chatId };
      } else {
        return { 
          verified: false, 
          message: `You have not joined ${chatId} yet! Please click Go and join the channel first.` 
        };
      }
    } else {
      const desc = tgData.description || '';
      if (desc.includes('member list is inaccessible') || desc.includes('chat not found') || desc.includes('bot is not a member')) {
        return {
          verified: false,
          notAdmin: true,
          message: `Bot @AppleFarmOfficialBot must be an Admin in ${chatId} for automatic verification!`
        };
      }
      return { verified: false, message: desc || 'Verification failed. Please make sure you joined.' };
    }
  } catch (directErr) {
    console.error('[Direct Telegram Verify Error]:', directErr);
    return { verified: false, message: 'Verification error. Please check your internet connection.' };
  }
}
