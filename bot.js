import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.MINI_APP_URL || 'https://apple-farm-plum.vercel.app';
const CHANNEL_URL = process.env.CHANNEL_URL || 'https://t.me/AppleFarmCommunity';

if (!TOKEN || TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.log('\n=============================================================');
  console.log('⚠️ [BOT WARNING] TELEGRAM_BOT_TOKEN সেট করা হয়নি!');
  console.log('👉 দয়া করে .env ফাইলে আপনার @BotFather থেকে পাওয়া টোকেন দিন');
  console.log('=============================================================\n');
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

// টেলিগ্রাম মেথড কল করার হেল্পার
async function callTelegram(method, body, isFormData = false) {
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      body: isFormData ? body : JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error(`[API Error] ${method}:`, err.message);
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

  // রেফারেল প্যারামিটার থাকলে URL-এ যোগ করা
  const appUrl = param 
    ? `${WEBAPP_URL}?startapp=${encodeURIComponent(param)}` 
    : WEBAPP_URL;

  // রেফারকারীকে ফটো ব্যানার ও বাটনসহ নোটিফিকেশন পাঠানো
  if (param && param !== user.id.toString() && /^\d+$/.test(param)) {
    const referCaption = `🎉 *New Referral Alert!* 🍎\n\n` +
      `👤 *${firstName}* (${username}) just launched Apple Farm with your invite link!\n\n` +
      `💰 *Reward:* +500 Apples credited to your balance. 🚀`;

    const referKeyboard = [
      [
        {
          text: 'Play Apple Farm 🍎',
          web_app: { url: WEBAPP_URL },
          style: 'success'
        }
      ],
      [
        {
          text: '👥 Invite More Friends',
          url: `https://t.me/share/url?url=https://t.me/AppleFarmOfficialBot?startapp=${param}&text=${encodeURIComponent('🍎 Join Apple Farm and grow your orchard to earn rewards!')}`,
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
        url: CHANNEL_URL,
        style: 'primary'
      },
      {
        text: '📖 How to Play',
        callback_data: 'help_info',
        style: 'primary'
      }
    ]
  ];

  const primaryPhotoUrl = 'https://apple-farm-plum.vercel.app/start-image.jpg';
  const fallbackPhotoUrl = 'https://raw.githubusercontent.com/abekeyrocky-sudo/Apple-Farm/main/assets/start-image.jpg';

  // 1. Try sending via primary CDN photo URL
  let result = await callTelegram('sendPhoto', {
    chat_id: chatId,
    photo: primaryPhotoUrl,
    caption: caption,
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard }
  });

  // 2. Try sending via fallback GitHub URL if primary fails
  if (!result.ok) {
    console.warn('[sendPhoto CDN URL failed, trying GitHub raw URL]:', result);
    result = await callTelegram('sendPhoto', {
      chat_id: chatId,
      photo: fallbackPhotoUrl,
      caption: caption,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard }
    });
  }

  // 3. Try sending via local file buffer if URL fails
  if (!result.ok) {
    console.warn('[sendPhoto URL failed, trying local file upload]:', result);
    const startImagePath = path.join(__dirname, 'assets', 'start-image.jpg');
    const fallbackBannerPath = path.join(__dirname, 'assets', 'invite-banner.png');
    const imagePath = fs.existsSync(startImagePath) ? startImagePath : fallbackBannerPath;

    if (fs.existsSync(imagePath)) {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('caption', caption);
      formData.append('parse_mode', 'Markdown');
      formData.append('reply_markup', JSON.stringify({ inline_keyboard }));
      
      const fileBuffer = fs.readFileSync(imagePath);
      const mimeType = imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
      const blob = new Blob([fileBuffer], { type: mimeType });
      formData.append('photo', blob, path.basename(imagePath));

      result = await callTelegram('sendPhoto', formData, true);
    }
  }

  // 4. Final fallback to text message if photo fails
  if (!result.ok) {
    console.warn('[All photo sends failed, sending text message]:', result);
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
  const helpCaption = `📖 *How to Play Apple Farm*\n\n` +
    `Grow your tree, harvest apples, complete tasks & earn rewards! 🍎\n\n` +
    `👇 *Click below to start playing:*`;

  const inline_keyboard = [
    [
      {
        text: 'Play Apple Farm 🍎',
        web_app: { url: WEBAPP_URL },
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

// ----------------- Callback Query হ্যান্ডলার -----------------
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
          web_app: { url: WEBAPP_URL },
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

// ----------------- LONG POLLING লুপ -----------------
let lastUpdateId = 0;

async function startPolling() {
  console.log('---------------------------------------------------------');
  console.log('🤖 [Apple Farm Bot] Online & Polling for messages...');
  console.log(`🌐 Mini App URL: ${WEBAPP_URL}`);
  console.log('---------------------------------------------------------');

  // পুরানো কোনো Webhook সেট থাকলে তা মুছে ফেলে Polling ক্লিয়ার করা
  try {
    await callTelegram('deleteWebhook', { drop_pending_updates: false });
  } catch (e) {
    // ignore
  }

  while (true) {
    try {
      const res = await callTelegram('getUpdates', {
        offset: lastUpdateId + 1,
        timeout: 25,
      });

      if (res.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          lastUpdateId = update.update_id;

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
        }
      }
    } catch (err) {
      console.error('[Polling Loop Error]:', err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

startPolling();
