import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.MINI_APP_URL || 'https://apple-farm-plum.vercel.app';
const CHANNEL_URL = process.env.CHANNEL_URL || 'https://t.me/AppleFarmCommunity';

// 👑 Admin Telegram User IDs authorized for /broadcast
const rawAdminIds = process.env.ADMIN_IDS || process.env.ADMIN_ID || '8067887716';
const ADMIN_IDS = rawAdminIds.split(',').map(s => s.trim()).filter(Boolean);

if (!TOKEN || TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.log('\n=============================================================');
  console.log('⚠️ [BOT WARNING] TELEGRAM_BOT_TOKEN সেট করা হয়নি!');
  console.log('👉 দয়া করে .env ফাইলে আপনার @BotFather থেকে পাওয়া টোকেন দিন');
  console.log('=============================================================\n');
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

// 🔥 Firebase Firestore Init
const firebaseConfig = {
  apiKey: "AIzaSyApQV0kYECIKMW95yAmwBANNfq9N6LV4c",
  authDomain: "phrasal-faculty-476911-h7.firebaseapp.com",
  projectId: "phrasal-faculty-476911-h7",
  storageBucket: "phrasal-faculty-476911-h7.firebasestorage.app",
  messagingSenderId: "352640663359",
  appId: "1:352640663359:web:65043d80f86a6e48dddd8a"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// 📬 Interactive Broadcast Sessions State
// Key: chatId, Value: { step: 'WAITING_FOR_IMAGE' | 'WAITING_FOR_TEXT' | 'WAITING_FOR_CONFIRM', photoFileId, text }
const broadcastSessions = new Map();

function isAdmin(userId) {
  if (ADMIN_IDS.length === 0) return true;
  return ADMIN_IDS.includes(String(userId));
}

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

// ----------------- /broadcast কমান্ড ইনিশিয়েট -----------------
async function handleBroadcastCommand(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;

  if (!isAdmin(userId)) {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: '⛔ *Unauthorized Access*\n\nOnly authorized administrators can use the /broadcast command.',
      parse_mode: 'Markdown'
    });
    return;
  }

  // নতুন ব্রডকাস্ট সেশন শুরু করা
  broadcastSessions.set(chatId, {
    step: 'WAITING_FOR_IMAGE',
    photoFileId: null,
    text: null,
    startedAt: Date.now()
  });

  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: '📢 *Push Broadcast Wizard (Step 1/2)*\n\n' +
      '📸 *Send me image:*\n' +
      'Please send the photo/image you want to broadcast to all users.\n\n' +
      '_(Or send /skip if you want to send a text-only broadcast, or /cancel to abort)_',
    parse_mode: 'Markdown'
  });
}

// ----------------- ব্রডকাস্ট স্টেপ মেসেজ হ্যান্ডলার -----------------
async function handleBroadcastSessionMessage(message) {
  const chatId = message.chat.id;
  const session = broadcastSessions.get(chatId);
  if (!session) return;

  const text = (message.text || '').trim();

  // যে কোনো সময় বাতিল করার অপশন
  if (text === '/cancel') {
    broadcastSessions.delete(chatId);
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: '❌ *Broadcast cancelled.* No messages were sent.',
      parse_mode: 'Markdown'
    });
    return;
  }

  // STEP 1: ছবি রিসিভ করা
  if (session.step === 'WAITING_FOR_IMAGE') {
    if (message.photo && message.photo.length > 0) {
      // সর্বোচ্চ রেজোলিউশনের ছবি সিলেক্ট করা
      const photo = message.photo[message.photo.length - 1];
      session.photoFileId = photo.file_id;

      // যদি ছবির সাথেই ক্যাপশন দেওয়া থাকে
      if (message.caption) {
        session.text = message.caption;
        session.step = 'WAITING_FOR_CONFIRM';
        await sendBroadcastPreview(chatId, session);
        return;
      }

      session.step = 'WAITING_FOR_TEXT';
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: '✍️ *Image received!*\n\n' +
          'Now send me the text / caption message for the broadcast:\n' +
          '_(You can use emojis and formatting)_',
        parse_mode: 'Markdown'
      });
      return;
    }

    if (text === '/skip') {
      session.photoFileId = null;
      session.step = 'WAITING_FOR_TEXT';
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: '✍️ *Image skipped (Text-only broadcast)*\n\n' +
          'Now send me the text message you want to broadcast to everyone:',
        parse_mode: 'Markdown'
      });
      return;
    }

    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: '⚠️ Please send an image/photo, or send /skip for text-only broadcast, or /cancel to abort.'
    });
    return;
  }

  // STEP 2: টেক্সট রিসিভ করা এবং প্রিভিউ পাঠানো
  if (session.step === 'WAITING_FOR_TEXT') {
    const messageContent = message.text || message.caption;
    if (!messageContent) {
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: '⚠️ Please send the text message for the broadcast, or /cancel to abort.'
      });
      return;
    }

    session.text = messageContent;
    session.step = 'WAITING_FOR_CONFIRM';
    await sendBroadcastPreview(chatId, session);
    return;
  }
}

// ----------------- ব্রডকাস্ট প্রিভিউ ও কনফার্মেশন বাটন পাঠানো -----------------
async function sendBroadcastPreview(chatId, session) {
  const confirmKeyboard = [
    [
      {
        text: '✅ Confirm & Send Broadcast',
        callback_data: 'broadcast_confirm'
      }
    ],
    [
      {
        text: '❌ Decline & Cancel',
        callback_data: 'broadcast_cancel'
      }
    ]
  ];

  const previewNotice = '\n\n━━━━━━━━━━━━━━━━━━━━\n' +
    '⚠️ *Broadcast Preview above.*\n' +
    'Are you sure you want to broadcast this message to all registered users?\n' +
    'Click *Confirm* to send, or *Decline* to cancel:';

  if (session.photoFileId) {
    let res = await callTelegram('sendPhoto', {
      chat_id: chatId,
      photo: session.photoFileId,
      caption: session.text + previewNotice,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: confirmKeyboard }
    });

    if (!res.ok) {
      await callTelegram('sendPhoto', {
        chat_id: chatId,
        photo: session.photoFileId,
        caption: session.text + '\n\n[Broadcast Preview] Confirm or Decline below:',
        reply_markup: { inline_keyboard: confirmKeyboard }
      });
    }
  } else {
    let res = await callTelegram('sendMessage', {
      chat_id: chatId,
      text: session.text + previewNotice,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: confirmKeyboard }
    });

    if (!res.ok) {
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: session.text + '\n\n[Broadcast Preview] Confirm or Decline below:',
        reply_markup: { inline_keyboard: confirmKeyboard }
      });
    }
  }
}

// ----------------- আসল ব্রডকাস্ট এক্সিকিউশন -----------------
async function executeBroadcast(adminChatId, session) {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const targetIds = new Set();

    usersSnap.forEach(d => {
      const uid = d.id;
      if (/^\d+$/.test(uid)) {
        targetIds.add(uid);
      }
    });

    const total = targetIds.size;
    console.log(`📢 [BROADCAST START] Sending to ${total} users...`);

    if (total === 0) {
      await callTelegram('sendMessage', {
        chat_id: adminChatId,
        text: '⚠️ No registered users found in Firestore database to broadcast to.'
      });
      return;
    }

    let successCount = 0;
    let failCount = 0;

    const broadcastMarkup = {
      inline_keyboard: [
        [
          { text: '🍎 Play Apple Farm', web_app: { url: WEBAPP_URL } }
        ],
        [
          { text: '📢 Community Channel', url: CHANNEL_URL }
        ]
      ]
    };

    for (const uid of targetIds) {
      try {
        let res;
        if (session.photoFileId) {
          res = await callTelegram('sendPhoto', {
            chat_id: uid,
            photo: session.photoFileId,
            caption: session.text,
            parse_mode: 'Markdown',
            reply_markup: broadcastMarkup
          });
          if (!res.ok) {
            res = await callTelegram('sendPhoto', {
              chat_id: uid,
              photo: session.photoFileId,
              caption: session.text,
              reply_markup: broadcastMarkup
            });
          }
        } else {
          res = await callTelegram('sendMessage', {
            chat_id: uid,
            text: session.text,
            parse_mode: 'Markdown',
            reply_markup: broadcastMarkup
          });
          if (!res.ok) {
            res = await callTelegram('sendMessage', {
              chat_id: uid,
              text: session.text,
              reply_markup: broadcastMarkup
            });
          }
        }

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        failCount++;
      }

      // Safe Telegram rate limiting (approx 22-25 messages/sec)
      await new Promise(r => setTimeout(r, 45));
    }

    await callTelegram('sendMessage', {
      chat_id: adminChatId,
      text: `🎉 *Broadcast Successfully Completed!*\n\n` +
        `📊 *Total Target Users:* ${total}\n` +
        `✅ *Successfully Sent:* ${successCount}\n` +
        `❌ *Failed / Blocked:* ${failCount}`,
      parse_mode: 'Markdown'
    });
    console.log(`📢 [BROADCAST FINISHED] Sent: ${successCount}, Failed: ${failCount}`);
  } catch (err) {
    console.error('[Broadcast Error]:', err);
    await callTelegram('sendMessage', {
      chat_id: adminChatId,
      text: `❌ *Broadcast Error:* ${err.message}`
    });
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
        url: CHANNEL_URL,
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

  // ব্রডকাস্ট ডিক্লাইন / ক্যানসেল
  if (cq.data === 'broadcast_cancel') {
    await callTelegram('answerCallbackQuery', { callback_query_id: cq.id, text: 'Broadcast cancelled' });
    broadcastSessions.delete(chatId);
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: '❌ *Broadcast Declined & Cancelled.*\nNo messages were sent.',
      parse_mode: 'Markdown'
    });
    return;
  }

  // ব্রডকাস্ট কনফার্ম ও এক্সিকিউশন
  if (cq.data === 'broadcast_confirm') {
    const session = broadcastSessions.get(chatId);
    if (!session || !session.text) {
      await callTelegram('answerCallbackQuery', { callback_query_id: cq.id, text: 'Session expired!' });
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: '⚠️ Broadcast session expired or not found. Type /broadcast to start again.'
      });
      return;
    }

    await callTelegram('answerCallbackQuery', { callback_query_id: cq.id, text: 'Broadcasting started!' });
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: '🚀 *Broadcasting started!*\n\nFetching user list from Firestore and sending notifications. Please wait...',
      parse_mode: 'Markdown'
    });

    executeBroadcast(chatId, session);
    broadcastSessions.delete(chatId);
    return;
  }
  
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
  console.log(`👑 Admin IDs: ${ADMIN_IDS.join(', ') || 'All Allowed'}`);
  console.log('---------------------------------------------------------');

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

          if (update.message) {
            const chatId = update.message.chat?.id;
            const text = (update.message.text || '').trim();

            // চেক করা ইউজার একটিভ ব্রডকাস্ট কনভার্সেশনে আছেন কিনা
            if (chatId && broadcastSessions.has(chatId)) {
              await handleBroadcastSessionMessage(update.message);
              continue;
            }

            if (text.startsWith('/broadcast')) {
              await handleBroadcastCommand(update.message);
            } else if (text.startsWith('/start')) {
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
