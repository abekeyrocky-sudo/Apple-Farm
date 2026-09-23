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

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8995359366:AAFdsDniKILYpWVlPJUHN5MIUcvbcseG8Bw';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://apple-farm-plum.vercel.app';
const CHANNEL_URL = process.env.CHANNEL_URL || 'https://t.me/AppleFarmCommunity';

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


