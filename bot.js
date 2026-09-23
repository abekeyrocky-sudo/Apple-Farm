import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.MINI_APP_URL || 'https://apple-farm-tma.vercel.app';
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
        url: CHANNEL_URL
      },
      {
        text: '📖 How to Play',
        callback_data: 'help_info'
      }
    ]
  ];

  const bannerPath = path.join(__dirname, 'assets', 'invite-banner.png');

  if (fs.existsSync(bannerPath)) {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    formData.append('reply_markup', JSON.stringify({ inline_keyboard }));
    
    const fileBuffer = fs.readFileSync(bannerPath);
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    formData.append('photo', blob, 'banner.png');

    const result = await callTelegram('sendPhoto', formData, true);
    if (!result.ok) {
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: caption,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard }
      });
    }
  } else {
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
        web_app: { url: WEBAPP_URL }
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

// ----------------- Callback Query হ্যান্ডলার -----------------
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
          [{ text: '🎮 Open Mini App', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });
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
