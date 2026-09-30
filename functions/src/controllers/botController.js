export function createBotController(botToken, miniAppUrl, channelUrl, db) {
  const TELEGRAM_API = `https://api.telegram.org/bot${botToken}`;

  // 👑 Admin Telegram User IDs authorized for /broadcast
  const rawAdminIds = process.env.ADMIN_IDS || process.env.ADMIN_ID || '8067887716';
  const ADMIN_IDS = rawAdminIds.split(',').map(s => s.trim()).filter(Boolean);

  function isAdmin(userId) {
    if (ADMIN_IDS.length === 0) return true;
    return ADMIN_IDS.includes(String(userId));
  }

  // In-memory sessions cache
  const broadcastSessions = new Map();

  async function getSession(chatId) {
    const key = String(chatId);
    if (broadcastSessions.has(key)) return broadcastSessions.get(key);
    if (db) {
      try {
        const snap = await db.collection('admin_broadcast_sessions').doc(key).get();
        if (snap.exists) {
          const data = snap.data();
          broadcastSessions.set(key, data);
          return data;
        }
      } catch (e) {
        console.warn('[GetSession DB Error]:', e.message);
      }
    }
    return null;
  }

  async function saveSession(chatId, session) {
    const key = String(chatId);
    broadcastSessions.set(key, session);
    if (db) {
      try {
        await db.collection('admin_broadcast_sessions').doc(key).set(session);
      } catch (e) {
        console.warn('[SaveSession DB Error]:', e.message);
      }
    }
  }

  async function deleteSession(chatId) {
    const key = String(chatId);
    broadcastSessions.delete(key);
    if (db) {
      try {
        await db.collection('admin_broadcast_sessions').doc(key).delete();
      } catch (e) {
        console.warn('[DeleteSession DB Error]:', e.message);
      }
    }
  }

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

  // ----------------- /broadcast কমান্ড হ্যান্ডলার -----------------
  async function handleBroadcastCommand(message) {
    const chatId = message.chat.id;
    const userId = message.from?.id ? message.from.id.toString() : '';

    console.log(`📢 [/broadcast received] by user: ${userId} (chatId: ${chatId})`);

    if (!isAdmin(userId)) {
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: '⛔ *Unauthorized Access*\n\nOnly authorized administrators can use the /broadcast command.',
        parse_mode: 'Markdown'
      });
      return;
    }

    const newSession = {
      step: 'WAITING_FOR_IMAGE',
      photoFileId: null,
      text: null,
      startedAt: Date.now()
    };
    await saveSession(chatId, newSession);

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
    const session = await getSession(chatId);
    if (!session) return false;

    const text = (message.text || '').trim();

    if (text === '/broadcast') {
      await handleBroadcastCommand(message);
      return true;
    }

    if (text === '/cancel') {
      await deleteSession(chatId);
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: '❌ *Broadcast cancelled.* No messages were sent.',
        parse_mode: 'Markdown'
      });
      return true;
    }

    // STEP 1: ছবি রিসিভ করা
    if (session.step === 'WAITING_FOR_IMAGE') {
      if (message.photo && message.photo.length > 0) {
        const photo = message.photo[message.photo.length - 1];
        session.photoFileId = photo.file_id;

        if (message.caption) {
          session.text = message.caption;
          session.step = 'WAITING_FOR_CONFIRM';
          await saveSession(chatId, session);
          await sendBroadcastPreview(chatId, session);
          return true;
        }

        session.step = 'WAITING_FOR_TEXT';
        await saveSession(chatId, session);
        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: '✍️ *Image received!*\n\n' +
            'Now send me the text / caption message for the broadcast:\n' +
            '_(You can use emojis and formatting)_',
          parse_mode: 'Markdown'
        });
        return true;
      }

      if (text === '/skip') {
        session.photoFileId = null;
        session.step = 'WAITING_FOR_TEXT';
        await saveSession(chatId, session);
        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: '✍️ *Image skipped (Text-only broadcast)*\n\n' +
            'Now send me the text message you want to broadcast to everyone:',
          parse_mode: 'Markdown'
        });
        return true;
      }

      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: '⚠️ Please send an image/photo, or send /skip for text-only broadcast, or /cancel to abort.'
      });
      return true;
    }

    // STEP 2: টেক্সট রিসিভ করা এবং প্রিভিউ পাঠানো
    if (session.step === 'WAITING_FOR_TEXT') {
      const messageContent = message.text || message.caption;
      if (!messageContent) {
        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: '⚠️ Please send the text message for the broadcast, or /cancel to abort.'
        });
        return true;
      }

      session.text = messageContent;
      session.step = 'WAITING_FOR_CONFIRM';
      await saveSession(chatId, session);
      await sendBroadcastPreview(chatId, session);
      return true;
    }

    // STEP 3: কনফার্মেশনের অপেক্ষায় থাকাকালীন মেসেজ আসলে ইউজারকে বাটন ব্যবহারের অনুরোধ করা
    if (session.step === 'WAITING_FOR_CONFIRM') {
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: '⚠️ *Broadcast preview is waiting for your confirmation!*\n\n' +
          'Please tap **✅ Confirm & Send Broadcast** or **❌ Decline & Cancel** on the preview above.\n' +
          '_(Or send /cancel to abort, or /broadcast to start over)_',
        parse_mode: 'Markdown'
      });
      return true;
    }

    return false;
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
      if (!db) {
        throw new Error('Database instance is not initialized in botController');
      }

      const usersSnap = await db.collection('users').get();
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
            { text: '🍎 Play Apple Farm', web_app: { url: miniAppUrl } }
          ],
          [
            { text: '📢 Community Channel', url: channelUrl }
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

  // ----------------- Callback Query হ্যান্ডলার -----------------
  async function handleCallbackQuery(cq) {
    const chatId = cq.message?.chat?.id;
    const sessionKey = String(chatId);
    console.log(`🔘 [CALLBACK QUERY] data: "${cq.data}" from: ${cq.from?.id} (chatId: ${chatId})`);

    // ব্রডকাস্ট ডিক্লাইন / ক্যানসেল
    if (cq.data === 'broadcast_cancel') {
      await callTelegram('answerCallbackQuery', { callback_query_id: cq.id, text: 'Broadcast cancelled' });
      await deleteSession(sessionKey);
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: '❌ *Broadcast Declined & Cancelled.*\nNo messages were sent.',
        parse_mode: 'Markdown'
      });
      return;
    }

    // ব্রডকাস্ট কনফার্ম ও এক্সিকিউশন
    if (cq.data === 'broadcast_confirm') {
      const session = await getSession(sessionKey);
      console.log(`📢 [BROADCAST CONFIRM] session found:`, Boolean(session), session);

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

      const activeSession = { ...session };
      await deleteSession(sessionKey);
      executeBroadcast(chatId, activeSession);
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
        const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
        if (webhookSecret) {
          const incomingSecret = req.headers['x-telegram-bot-api-secret-token'];
          if (incomingSecret !== webhookSecret) {
            console.warn('[Bot Webhook Security Notice] Rejected request with invalid or missing secret token');
            return res.status(403).json({ error: 'Forbidden: Invalid webhook secret token' });
          }
        }

        const update = req.body;
        if (!update) {
          return res.status(200).send('OK');
        }

        if (update.message) {
          const chatId = update.message.chat?.id;
          const text = (update.message.text || '').trim();

          // কমান্ড আসলে সেশন বাতিল করে সরাসরি কমান্ড রান করা
          if (text.startsWith('/start')) {
            if (chatId) await deleteSession(chatId);
            const parts = text.split(' ');
            const param = parts.length > 1 ? parts.slice(1).join(' ') : null;
            await handleStartCommand(update.message, param);
            return res.status(200).json({ ok: true });
          } else if (text.startsWith('/help')) {
            if (chatId) await deleteSession(chatId);
            await handleHelpCommand(update.message);
            return res.status(200).json({ ok: true });
          } else if (text.startsWith('/broadcast')) {
            if (chatId) await deleteSession(chatId);
            await handleBroadcastCommand(update.message);
            return res.status(200).json({ ok: true });
          }

          // চেক করা ইউজার একটিভ ব্রডকাস্ট সেশনে আছেন কিনা (ছবি বা টেক্সট প্রেরণের জন্য)
          const session = chatId ? await getSession(chatId) : null;
          if (session) {
            const handled = await handleBroadcastSessionMessage(update.message);
            if (handled) {
              return res.status(200).json({ ok: true });
            }
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
