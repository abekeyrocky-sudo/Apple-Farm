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

    const caption = `🍎 *Welcome to Apple Farm, ${firstName}!* 🍏\n\n` +
      `🌱 *GROW • HARVEST • EARN*\n\n` +
      `👨‍🌾 Plant apple trees and harvest fresh apples daily.\n` +
      `💎 Earn Diamonds, spin the Lucky Wheel, and win real rewards.\n` +
      `👥 Invite friends to earn *10% commission* on every harvest!\n\n` +
      `👇 *Click below to start playing now:*`;

    const inline_keyboard = [
      [
        {
          text: '🎮 Play Apple Farm 🍎',
          web_app: { url: appUrl }
        }
      ],
      [
        {
          text: '📢 Join Community',
          url: channelUrl || 'https://t.me/AppleFarmCommunity'
        },
        {
          text: '📖 How to Play',
          callback_data: 'help_info'
        }
      ]
    ];

    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: caption,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard }
    });
  }

  async function handleHelpCommand(message) {
    const chatId = message.chat.id;
    const helpText = `🌾 *How to play Apple Farm:*\n\n` +
      `1. *Tap to Harvest:* Tap the apple tree to gather ripe apples.\n` +
      `2. *Watch Ads:* Watch daily ads to earn extra apples and diamonds.\n` +
      `3. *Spin & Win:* Spin the wheel daily for jackpot rewards.\n` +
      `4. *Invite Friends:* Share your referral link and earn 10% bonus!\n` +
      `5. *Withdraw:* Cash out your balance directly via TON, bKash, and other wallets.\n\n` +
      `👇 Click Play to enter the farm!`;

    const inline_keyboard = [
      [
        {
          text: '🎮 Play Apple Farm 🍎',
          web_app: { url: miniAppUrl }
        }
      ]
    ];

    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: helpText,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard }
    });
  }

  async function handleCallbackQuery(cq) {
    const chatId = cq.message?.chat?.id;
    if (cq.data === 'help_info') {
      await callTelegram('answerCallbackQuery', { callback_query_id: cq.id });
      
      const helpText = `🌾 *Quick Farm Guide:*\n\n` +
        `• Tap your screen to harvest apples.\n` +
        `• Level up your farm to unlock bigger daily rewards.\n` +
        `• Complete daily tasks & spin the lucky wheel!\n\n` +
        `Ready? Launch the game below! 🚀`;

      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: helpText,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Open Mini App', web_app: { url: miniAppUrl } }]
          ]
        }
      });
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
