import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { telegramAuthMiddleware } from './src/middleware/auth.js';
import { createUserController } from './src/controllers/userController.js';
import { createHarvestController } from './src/controllers/harvestController.js';
import { createSpinController } from './src/controllers/spinController.js';
import { createWithdrawController } from './src/controllers/withdrawController.js';
import { createTaskController } from './src/controllers/taskController.js';
import { createAdsController } from './src/controllers/adsController.js';
import { createBotController } from './src/controllers/botController.js';

dotenv.config();

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp();
}
const db = getFirestore();
const adminHelper = {
  firestore: {
    FieldValue
  }
};

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://apple-farm-plum.vercel.app';
const CHANNEL_URL = process.env.CHANNEL_URL || 'https://t.me/AppleFarmCommunity';

if (!BOT_TOKEN) {
  console.warn('[Security Warning] TELEGRAM_BOT_TOKEN is not defined in environment variables!');
}

// Controllers
const userCtrl = createUserController(db);
const harvestCtrl = createHarvestController(db, adminHelper);
const spinCtrl = createSpinController(db, adminHelper);
const withdrawCtrl = createWithdrawController(db, adminHelper);
const taskCtrl = createTaskController(db, adminHelper);
const adsCtrl = createAdsController(db, adminHelper);
const botCtrl = createBotController(BOT_TOKEN, MINI_APP_URL, CHANNEL_URL);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Secure Telegram Notification Route (Server-side Bot API)
app.post(['/telegram/notify', '/api/telegram/notify'], async (req, res) => {
  try {
    if (!BOT_TOKEN) {
      return res.status(500).json({ ok: false, error: 'Telegram Bot Token not configured on server' });
    }

    const { type, chatId, payload } = req.body;
    if (!chatId) {
      return res.status(400).json({ ok: false, error: 'Target chatId is required' });
    }

    let text = '';
    let replyMarkup = {};
    const photoUrl = 'https://apple-farm-plum.vercel.app/refer-image.jpg';

    if (type === 'referral') {
      const friendName = payload?.friendName || 'Farmer';
      text = `🎉 *New Referral Joined!* 🍎\n\n` +
        `👤 *${friendName}* just joined Apple Farm using your invite link!\n\n` +
        `💰 *Reward:* +500 Apples credited to your balance. 🚀`;

      replyMarkup = {
        inline_keyboard: [
          [
            { text: 'Play Apple Farm 🍎', web_app: { url: MINI_APP_URL } }
          ],
          [
            {
              text: '👥 Invite More Friends',
              url: `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/AppleFarmOfficialBot/App?startapp=${chatId}`)}&text=${encodeURIComponent('🍎 Join Apple Farm and grow your orchard to earn rewards!')}`
            }
          ]
        ]
      };
    } else if (type === 'withdraw') {
      const isGram = !!payload?.gramAmount;
      if (isGram) {
        text = `⚡ *GRAM Withdrawal Request Submitted!* 💎\n\n` +
          `📦 *Amount:* \`${payload.gramAmount} GRAM\`\n` +
          `🍎 *Cost:* \`${payload.amount || 0} Apples & ${payload.diamonds || 0} Diamonds\`\n` +
          `👛 *Destination:* \`${payload.account ? payload.account.slice(0, 8) + '...' + payload.account.slice(-6) : 'Connected TON Wallet'}\`\n` +
          `⏳ *Status:* \`Processing on TON Blockchain...\`\n\n` +
          `🚀 _Your crypto payout is being broadcasted to the TON network!_`;
      } else {
        text = `⚡ *Withdrawal Request Submitted!* 💸\n\n` +
          `💰 *Amount:* \`${payload?.amount || 0} Apples\` (৳${payload?.bdtAmount || Math.round((payload?.amount || 0) / 100)})\n` +
          `💳 *Method:* \`${payload?.method || 'bKash'}\`\n` +
          `📱 *Account:* \`${payload?.account || ''}\`\n` +
          `⏳ *Status:* \`Pending Approval\`\n\n` +
          `🔔 _You will receive payout confirmation once processed!_`;
      }

      replyMarkup = {
        inline_keyboard: [
          [
            { text: 'Play Apple Farm 🍎', web_app: { url: MINI_APP_URL } }
          ],
          [
            { text: '📢 Official Payout Proofs', url: 'https://t.me/AppleFarmPayouts' }
          ]
        ]
      };
    } else {
      return res.status(400).json({ ok: false, error: 'Invalid notification type' });
    }

    let tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: text,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
      })
    });

    let tgData = await tgRes.json().catch(() => ({}));
    if (!tgData.ok) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup
        })
      });
    }

    return res.json({ ok: true, status: 'sent' });
  } catch (err) {
    console.error('[Telegram Notify Error]:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GigaPub Postback Callback route
app.get(['/api/giga-callback', '/giga-callback'], (req, res) => {
  const { userId, amount, rewardId } = req.query;
  console.log('[GigaPub Postback Received]:', { userId, amount, rewardId });
  return res.status(200).json({ ok: true, status: 'success' });
});

// Telegram Membership Verification Route (Bot API getChatMember)
app.post(['/telegram/verify-member', '/api/telegram/verify-member'], async (req, res) => {
  try {
    const { userId, channelLink } = req.body;
    if (!userId || !channelLink) {
      return res.status(400).json({ ok: false, error: 'User ID and channel link are required' });
    }

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
        return res.json({ ok: true, isMember: true, status, channel: chatId });
      } else {
        return res.json({ 
          ok: true, 
          isMember: false, 
          status,
          message: `You have not joined ${chatId} yet. Please join the channel and click Verify.` 
        });
      }
    } else {
      const desc = tgData.description || '';
      console.warn('[Telegram getChatMember Error]:', desc);
      
      // If bot is not admin in channel
      if (desc.includes('member list is inaccessible') || desc.includes('chat not found') || desc.includes('bot is not a member')) {
        return res.json({
          ok: false,
          notAdmin: true,
          error: `Bot @AppleFarmOfficialBot must be added as an Admin to ${chatId} for automatic verification.`
        });
      }

      return res.json({
        ok: false,
        error: desc || 'Telegram verification failed. Please try again.'
      });
    }
  } catch (err) {
    console.error('[Verify Membership Error]:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Telegram Bot Webhook Route (24/7 Cloud Handler)
app.post('/telegram/webhook', botCtrl.handleWebhook);
app.post('/api/telegram/webhook', botCtrl.handleWebhook);

// Protected Telegram WebApp API Routes
const apiRouter = express.Router();
apiRouter.use(telegramAuthMiddleware(BOT_TOKEN));

// User routes
apiRouter.post('/user/sync', userCtrl.syncUser);
apiRouter.post('/user/avatar', userCtrl.updateAvatar);

// Harvest / Game / Features
apiRouter.post('/harvest/tap', harvestCtrl.tapHarvest);
apiRouter.post('/spin/play', spinCtrl.playSpin);
apiRouter.post('/tasks/claim', taskCtrl.claimTask);
apiRouter.post('/ads/claim', adsCtrl.claimAdReward);
apiRouter.post('/withdraw/submit', withdrawCtrl.submitWithdraw);

app.use('/api', apiRouter);

// Export Cloud Function
export const api = onRequest({
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 60,
  invoker: 'public',
  cors: true,
}, app);


