/**
 * Auto-Harvest Farmer Bot Manager
 * Handles 24/7 offline apple gathering, online automatic tree harvesting,
 * duration tracking, and TonConnect GRAM purchases.
 */

import { getStoredJson, setStoredJson } from './userStorage';

const BASE_BOT_STORAGE_KEY = 'apple_farm_autobot_state_v1';
const BASE_LAST_ACTIVE_KEY = 'apple_farm_last_active_time_v1';

// হার্ভেস্ট স্পিড: প্রতি ১০ সেকেন্ডে ৪টি আপেল (অফলাইনে প্রতি ঘণ্টায় ~১,৪৪০ আপেল)
const APPLES_PER_SECOND_OFFLINE = 0.4; 

export const BOT_PACKAGES = [
  {
    id: 'bot_3d',
    tier: '3d',
    title: '3-Day Auto Bot',
    durationDays: 3,
    durationMs: 3 * 24 * 60 * 60 * 1000,
    priceGram: 0.25,
    priceNano: '250000000', // 0.25 TON/GRAM in nanotons
    description: 'Automated 24/7 harvest while you sleep for 72 hours.',
    badge: 'Starter',
    badgeColor: 'bg-blue-500'
  },
  {
    id: 'bot_7d',
    tier: '7d',
    title: '7-Day Pro Bot',
    durationDays: 7,
    durationMs: 7 * 24 * 60 * 60 * 1000,
    priceGram: 0.50,
    priceNano: '500000000', // 0.50 TON/GRAM in nanotons
    description: '1 full week of continuous uninterrupted harvest power.',
    badge: 'Popular',
    badgeColor: 'bg-emerald-500'
  },
  {
    id: 'bot_lifetime',
    tier: 'lifetime',
    title: 'Lifetime Master Bot',
    durationDays: null, // Lifetime
    durationMs: null,
    priceGram: 1.20,
    priceNano: '1200000000', // 1.20 TON/GRAM in nanotons
    description: 'Permanent lifetime automated harvest. Never tap again!',
    badge: 'Best Value',
    badgeColor: 'bg-amber-500'
  }
];

export const getAutoBotState = (user) => {
  const uid = user?.id;
  const localData = getStoredJson(BASE_BOT_STORAGE_KEY, uid, null);
  const dbData = user?.autoBot || null;

  const botData = dbData || localData || {
    active: false,
    tier: null,
    expiresAt: null,
    activatedAt: null,
  };

  // মেয়াদ উত্তীর্ণ হয়েছে কি না পরীক্ষা
  if (botData.active && botData.expiresAt && botData.expiresAt !== 'lifetime') {
    if (Date.now() > Number(botData.expiresAt)) {
      return {
        ...botData,
        active: false,
        isExpired: true,
      };
    }
  }

  return {
    ...botData,
    isExpired: false,
  };
};

export const saveAutoBotState = (userId, state) => {
  setStoredJson(BASE_BOT_STORAGE_KEY, userId, state);
};

export const updateLastActiveTime = (userId) => {
  if (!userId) return;
  setStoredJson(BASE_LAST_ACTIVE_KEY, userId, Date.now());
};

export const calculateOfflineHarvest = (user) => {
  if (!user?.id) return { pendingApples: 0, offlineMinutes: 0 };

  const botState = getAutoBotState(user);
  if (!botState.active) return { pendingApples: 0, offlineMinutes: 0 };

  const lastActive = getStoredJson(BASE_LAST_ACTIVE_KEY, user.id, Date.now());
  const now = Date.now();
  const diffMs = now - Number(lastActive);

  // ১০ সেকেন্ডের কম হলে অফলাইন ক্লেইম দরকার নেই
  if (diffMs < 10000) {
    return { pendingApples: 0, offlineMinutes: 0 };
  }

  let effectiveMs = diffMs;

  // যদি লাইফটাইম না হয়ে নির্দিষ্ট মেয়াদে বট এক্সপায়ার হয়ে থাকে
  if (botState.expiresAt && botState.expiresAt !== 'lifetime') {
    const expiresAtMs = Number(botState.expiresAt);
    if (expiresAtMs < now) {
      effectiveMs = Math.max(0, expiresAtMs - Number(lastActive));
    }
  }

  // সর্বোচ্চ অফলাইন জমার লিমিট ২৪ ঘণ্টা (যাতে ব্যালেন্স এক্সপ্লয়েট না হয়)
  const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000;
  effectiveMs = Math.min(effectiveMs, MAX_OFFLINE_MS);

  const offlineSeconds = Math.floor(effectiveMs / 1000);
  const pendingApples = Math.floor(offlineSeconds * APPLES_PER_SECOND_OFFLINE);
  const offlineMinutes = Math.floor(effectiveMs / (60 * 1000));

  return {
    pendingApples: Math.max(0, pendingApples),
    offlineMinutes,
    offlineHours: (offlineMinutes / 60).toFixed(1)
  };
};

export const formatBotTimeRemaining = (expiresAt) => {
  if (!expiresAt) return 'Inactive';
  if (expiresAt === 'lifetime') return 'Lifetime Active';

  const diffMs = Number(expiresAt) - Date.now();
  if (diffMs <= 0) return 'Expired';

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }
  return `${hours}h ${minutes}m left`;
};
