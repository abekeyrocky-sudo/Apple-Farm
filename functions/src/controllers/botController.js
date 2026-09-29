export function createBotController(botToken, miniAppUrl, channelUrl) {
  const TELEGRAM_API = `https://api.telegram.org/bot${botToken}`;

  async function callTelegram(method, body) {
    try {
      const res = await fetch(`${TELEGRAM_API}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch (err) {
      console.error(`[Bot API Error] ${method}:`, err.message);
      return { ok: false, error: err.message };
    }
  }

  async function handleStartCommand(message, param) {
    const chatId = message.chat.id;
    const user = message.from;
    const firstName = user.first_name || 'Farmer';

    const appUrl = param 
      ? `${miniAppUrl}?startapp=${encodeURIComponent(param)}` 
      : miniAppUrl;

    // রেফারকারীকে ফটো ব্যানার ও বাটনসহ নোটিফিকেশন পাঠানো
    if (param && param !== user.id.toString() && /^\d+$/.test(param)) {
      const referCaption = `🎉 *New Referral Alert!* 🍎\n\n` +
        `👤 *${firstName}* just started Apple Farm with your invite link!\n\n` +
        `💰 *Reward:* +500 Apples credited to your balance. 🚀`;

      const referKeyboard = [
        [
          {
            text: 'Play Apple Farm 🍎',
            web_app: { url: miniAppUrl },
            style: 'success'
          }
        ],
        [
          {
            text: '👥 Invite More Friends',
            url: `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/AppleFarmOfficialBot/App?startapp=${param}`)}&text=${encodeURIComponent('🍎 Join Apple Farm and grow your orchard to earn rewards!')}`,
            style: 'primary'
          }
        ]
      ];

      const referPrimaryPhoto = 'https://apple-farm-plum.vercel.app/refer-image.jpg';
      const referFallbackPhoto = 'https://raw.githubusercontent.com/abekeyrocky-sudo/Apple-Farm/main/assets/refer-image.jpg';

      callTelegram('sendPhoto', {
        chat_id: param,
        photo: referPrimaryPhoto,
        caption: referCaption,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: referKeyboard }
      }).then(res => {
        if (!res.ok) {
          return callTelegram('sendPhoto', {
            chat_id: param,
            photo: referFallbackPhoto,
            caption: referCaption,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: referKeyboard }
          });
        }
        return res;
      }).then(res => {
        if (!res.ok) {
          return callTelegram('sendMessage', {
            chat_id: param,
            text: referCaption,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: referKeyboard }
          });
        }
      }).catch((e) => console.warn('Bot referral notify error:', e));
    }

    const caption = `🍎 *Welcome to Apple Farm, ${firstName}!* 🍏\n` +
      `Your virtual farm is ready. Harvest apples and start earning rewards now!\n\n` +
      `👇 *Start playing below:*`;

    const inline_keyboard = [
      [
        {
          text: 'Play Apple Farm 🍎',
          web_app: { url: appUrl },
          style: 'success'
        }
      ],
      [
        {
          text: '📢 Join Community',
          url: channelUrl || 'https://t.me/AppleFarmCommunity',
          style: 'primary'
        },
        {
          text: '💳 Payment Proofs',
          url: 'https://t.me/AppleFarmPayouts',
          style: 'primary'
        }
      ],
      [
        {
          text: '📖 How to Play',
          callback_data: 'help_info',
          style: 'primary'
        }
      ]
    ];

    const primaryPhotoUrl = 'https://apple-farm-plum.vercel.app/start-image.jpg';
    const fallbackPhotoUrl = 'https://raw.githubusercontent.com/abekeyrocky-sudo/Apple-Farm/main/assets/start-image.jpg';

    // 1. Try sending via primary Vercel CDN image
    let photoRes = await callTelegram('sendPhoto', {
      chat_id: chatId,
      photo: primaryPhotoUrl,
      caption: caption,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard }
    });

    // 2. Fallback to GitHub raw URL if primary fails
    if (!photoRes.ok) {
      console.warn('[sendPhoto primary failed, trying fallback]:', photoRes);
      photoRes = await callTelegram('sendPhoto', {
        chat_id: chatId,
        photo: fallbackPhotoUrl,
        caption: caption,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard }
      });
    }

    // 3. Fallback to sendMessage if all photo sending fails
    if (!photoRes.ok) {
      console.warn('[sendPhoto fallback failed, sending text message]:', photoRes);
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: caption,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard }
      });
    }
  }

  async function handleHelpCommand(message) {
    const chatId = message.chat.id;
    const helpCaption = `📖 *How to Play Apple Farm*\n\n` +
      `Grow your tree, harvest apples, complete tasks & earn rewards! 🍎\n\n` +
      `👇 *Click below to start playing:*`;

    const inline_keyboard = [
      [
        {
          text: 'Play Apple Farm 🍎',
          web_app: { url: miniAppUrl },
          style: 'success'
        }
      ]
    ];

    const primaryPhoto = 'https://apple-farm-plum.vercel.app/help-image.jpg';
    const fallbackPhoto = 'https://raw.githubusercontent.com/abekeyrocky-sudo/Apple-Farm/main/assets/help-image.jpg';

    let res = await callTelegram('sendPhoto', {
      chat_id: chatId,
      photo: primaryPhoto,
      caption: helpCaption,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard }
    });

    if (!res.ok) {
      res = await callTelegram('sendPhoto', {
        chat_id: chatId,
        photo: fallbackPhoto,
        caption: helpCaption,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard }
      });
    }

    if (!res.ok) {
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: helpCaption,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard }
      });
    }
  }

  async function handleCallbackQuery(cq) {
    const chatId = cq.message?.chat?.id;
    if (cq.data === 'help_info') {
      await callTelegram('answerCallbackQuery', { callback_query_id: cq.id });
      
      const helpCaption = `📖 *How to Play Apple Farm*\n\n` +
        `Grow your tree, harvest apples, complete tasks & earn rewards! 🍎\n\n` +
        `👇 *Click below to start playing:*`;

      const inline_keyboard = [
        [
          {
            text: 'Play Apple Farm 🍎',
            web_app: { url: miniAppUrl },
            style: 'success'
          }
        ]
      ];

      const primaryPhoto = 'https://apple-farm-plum.vercel.app/help-image.jpg';
      const fallbackPhoto = 'https://raw.githubusercontent.com/abekeyrocky-sudo/Apple-Farm/main/assets/help-image.jpg';

      let res = await callTelegram('sendPhoto', {
        chat_id: chatId,
        photo: primaryPhoto,
        caption: helpCaption,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard }
      });

      if (!res.ok) {
        res = await callTelegram('sendPhoto', {
          chat_id: chatId,
          photo: fallbackPhoto,
          caption: helpCaption,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard }
        });
      }

      if (!res.ok) {
        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: helpCaption,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard }
        });
      }
    }
  }

  return {
    handleWebhook: async (req, res) => {
      try {
        const update = req.body;
        if (!update) {
          return res.status(200).send('OK');
        }

        if (update.message && update.message.text) {
          const text = update.message.text.trim();
          if (text.startsWith('/start')) {
            const parts = text.split(' ');
            const param = parts.length > 1 ? parts.slice(1).join(' ') : null;
            await handleStartCommand(update.message, param);
          } else if (text.startsWith('/help')) {
            await handleHelpCommand(update.message);
          }
        } else if (update.callback_query) {
          await handleCallbackQuery(update.callback_query);
        }

        return res.status(200).json({ ok: true });
      } catch (err) {
        console.error('[Bot Webhook Error]:', err);
        return res.status(200).json({ ok: true, error: err.message });
      }
    }
  };
}
