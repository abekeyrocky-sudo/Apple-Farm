export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const userId = req.body?.userId || req.query?.userId;
    const channelLink = req.body?.channelLink || req.query?.channelLink;

    if (!userId || !channelLink) {
      return res.status(400).json({ ok: false, error: 'User ID and channel link are required' });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

    // Clean channel username
    let channel = channelLink.trim()
      .replace(/^https?:\/\/(www\.)?t\.me\//i, '')
      .replace(/^t\.me\//i, '')
      .replace(/^@/, '')
      .split('/')[0]
      .split('?')[0];

    if (!channel) {
      return res.status(400).json({ ok: false, error: 'Invalid Telegram link' });
    }

    const chatId = `@${channel}`;
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${encodeURIComponent(userId)}`;

    const tgRes = await fetch(url);
    const tgData = await tgRes.json();

    if (tgData.ok && tgData.result) {
      const status = tgData.result.status;
      const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(status);

      if (isMember) {
        return res.status(200).json({ ok: true, isMember: true, status, channel: chatId });
      } else {
        return res.status(200).json({
          ok: true,
          isMember: false,
          status,
          message: `You have not joined ${chatId} yet. Please join the channel and try again.`
        });
      }
    } else {
      const desc = tgData.description || '';
      console.warn('[Telegram getChatMember Error]:', desc);

      if (desc.includes('member list is inaccessible') || desc.includes('chat not found') || desc.includes('bot is not a member')) {
        return res.status(200).json({
          ok: false,
          notAdmin: true,
          error: `Bot must be added as an Admin to ${chatId} for automatic verification.`
        });
      }

      return res.status(200).json({
        ok: false,
        error: desc || 'Telegram verification failed.'
      });
    }
  } catch (err) {
    console.error('[Verify Member Error]:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
