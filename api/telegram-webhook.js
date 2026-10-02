// Telegram Bot 24/7 Cloud Webhook Handler on Vercel Serverless
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8995359366:AAFdsDniKILYpWVlPJUHN5MIUcvbcseG8Bw';
const WEBAPP_URL = process.env.MINI_APP_URL || 'https://apple-farm-plum.vercel.app';
const CHANNEL_URL = process.env.CHANNEL_URL || 'https://t.me/AppleFarmCommunity';
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

// Admin Telegram User IDs authorized for /broadcast
const rawAdminIds = process.env.ADMIN_IDS || process.env.ADMIN_ID || '8067887716';
const ADMIN_IDS = rawAdminIds.split(',').map(s => s.trim()).filter(Boolean);

function isAdmin(userId) {
  if (ADMIN_IDS.length === 0) return true;
  return ADMIN_IDS.includes(String(userId));
}

// In-memory sessions cache for serverless invocation
const broadcastSessions = new Map();

async function callTelegram(method, body) {
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error(`[Webhook API Error] ${method}:`, err.message);
    return { ok: false, error: err.message };
  }
}

// ----------------- /start কমান্ড হ্যান্ডলার -----------------
async function handleStartCommand(message, param) {
  const chatId = message.chat.id;
  const user = message.from;
  const firstName = user.first_name || 'Farmer';
  const username = user.username ? `@${user.username}` : user.first_name;

  console.log(`📩 [START] from: ${username} (ID: ${user.id}) | Referral: ${param || 'None'}`);

  const appUrl = param 
    ? `${WEBAPP_URL}?startapp=${encodeURIComponent(param)}` 
    : WEBAPP_URL;

  // রেফারকারীকে নোটিফিকেশন পাঠানো
  if (param && param !== user.id.toString() && /^\d+$/.test(param)) {
    const referCaption = `🎉 *New Referral Alert!* 🍎\n\n` +
      `👤 *${firstName}* (${username}) just launched Apple Farm with your invite link!\n\n` +
      `💰 *Reward:* +500 Apples credited to your balance. 🚀`;

    const referKeyboard = [
      [
        {
          text: 'Play Apple Farm 🍎',
          web_app: { url: WEBAPP_URL }
        }
      ],
      [
        {
          text: '👥 Invite More Friends',
          url: `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/AppleFarmOfficialBot/App?startapp=${param}`)}&text=${encodeURIComponent('🍎 Join Apple Farm and grow your orchard to earn rewards!')}`
        }
      ]
    ];

    const referPhoto = 'https://apple-farm-plum.vercel.app/refer-image.jpg';

    callTelegram('sendPhoto', {
      chat_id: param,
      photo: referPhoto,
      caption: referCaption,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: referKeyboard }
    }).then(res => {
      if (!res.ok) {
        return callTelegram('sendMessage', {
          chat_id: param,
          text: referCaption,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: referKeyboard }
        });
      }
    }).catch(e => console.warn('Referral notify error:', e));
  }

  const caption = `🍎 *Welcome to Apple Farm, ${firstName}!* 🍏\n` +
    `Your virtual farm is ready. Harvest apples and start earning rewards now!\n\n` +
    `👇 *Start playing below:*`;

  const inline_keyboard = [
    [
      {
        text: 'Play Apple Farm 🍎',
        web_app: { url: appUrl }
      }
    ],
    [
      {
        text: '📢 Join Community',
        url: CHANNEL_URL
      },
      {
        text: '💳 Payment Proofs',
        url: 'https://t.me/AppleFarmPayouts'
      }
    ],
    [
      {
        text: '📖 How to Play',
        callback_data: 'help_info'
      }
    ]
  ];

  const primaryPhotoUrl = 'https://apple-farm-plum.vercel.app/start-image.jpg';
  const fallbackPhotoUrl = 'https://raw.githubusercontent.com/abekeyrocky-sudo/Apple-Farm/main/assets/start-image.jpg';

  let result = await callTelegram('sendPhoto', {
    chat_id: chatId,
    photo: primaryPhotoUrl,
    caption: caption,
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard }
  });

  if (!result.ok) {
    result = await callTelegram('sendPhoto', {
      chat_id: chatId,
      photo: fallbackPhotoUrl,
      caption: caption,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard }
    });
  }

  if (!result.ok) {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: caption,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard }
    });
  }
}

// ----------------- /help কমান্ড হ্যান্ডলার -----------------
async function handleHelpCommand(message) {
  const chatId = message.chat.id;

  const helpCaption = `📖 *Welcome to Apple Farm Guide!* 🍏\n\n` +
    `Here is everything you need to know about Apple Farm:\n\n` +
    `🌱 *1. Grow & Harvest:*\n` +
    `• Your apple tree produces apples every second.\n` +
    `• Tap the tree to harvest and claim your apples into your balance.\n\n` +
    `🎰 *2. Daily Lucky Spin:*\n` +
    `• Spin the wheel daily for a chance to win TON, Diamonds & huge Apple jackpots!\n\n` +
    `👥 *3. Invite Friends:*\n` +
    `• Earn +500 Apples instant bonus for each friend.\n` +
    `• Earn 10% lifetime commission on friends' harvest & 15% partner profit.\n\n` +
    `💎 *4. Diamonds & On-Chain Withdrawals:*\n` +
    `• Convert diamonds and earnings directly to TON sent to your wallet.\n\n` +
    `👇 *Tap below to launch your farm:*`;

  const inline_keyboard = [
    [
      {
        text: 'Play Apple Farm 🍎',
        web_app: { url: WEBAPP_URL }
      }
    ],
    [
      {
        text: '📢 Join Community',
        url: CHANNEL_URL
      },
      {
        text: '💳 Payment Proofs',
        url: 'https://t.me/AppleFarmPayouts'
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

// ----------------- CALLBACK QUERY হ্যান্ডলার -----------------
async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message?.chat?.id;
  const data = callbackQuery.data;

  if (callbackQuery.id) {
    await callTelegram('answerCallbackQuery', { callback_query_id: callbackQuery.id });
  }

  if (data === 'help_info' && chatId) {
    await handleHelpCommand(callbackQuery.message);
  }
}

// ----------------- VERCEL SERVERLESS HANDLER -----------------
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'Apple Farm Bot Cloud Webhook' });
  }

  try {
    const update = req.body;
    if (!update) {
      return res.status(200).send('OK');
    }

    if (update.message) {
      const text = (update.message.text || '').trim();

      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const param = parts.length > 1 ? parts.slice(1).join(' ') : null;
        await handleStartCommand(update.message, param);
        return res.status(200).json({ ok: true });
      } else if (text.startsWith('/help')) {
        await handleHelpCommand(update.message);
        return res.status(200).json({ ok: true });
      }
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[Bot Webhook Serverless Error]:', err);
    return res.status(200).json({ ok: true, error: err.message });
  }
}
