/**
 * Firebase Cloud Functions Client API Service
 */

// Live 2nd Gen Cloud Functions API URL
const API_BASE_URL = import.meta.env.VITE_FUNCTIONS_URL || 
  'https://api-duztzw2gwa-uc.a.run.app/api';

/**
 * Standard HTTP Request with Telegram WebApp initData header
 */
async function request(endpoint, payload = {}) {
  const initData = window.Telegram?.WebApp?.initData || '';

  const headers = {
    'Content-Type': 'application/json',
  };

  if (initData) {
    headers['x-telegram-init-data'] = initData;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`[CloudFunctions API] ${endpoint} request failed:`, error.message);
    throw error;
  }
}

export const CloudAPI = {
  // Sync User
  syncUser: async (tgUser, referrerId) => {
    return await request('/user/sync', { user: tgUser, referrerId });
  },

  // Update Avatar
  updateAvatar: async (tgUser, avatar) => {
    return await request('/user/avatar', { user: tgUser, avatar });
  },

  // Harvest Tap
  tapHarvest: async (tgUser, count = 1) => {
    return await request('/harvest/tap', { user: tgUser, count });
  },

  // Spin Wheel
  playSpin: async (tgUser) => {
    return await request('/spin/play', { user: tgUser });
  },

  // Claim Task
  claimTask: async (tgUser, taskId, rewardAmount) => {
    return await request('/tasks/claim', { user: tgUser, taskId, rewardAmount });
  },

  // Watch Ad
  claimAdReward: async (tgUser, apples = 50) => {
    return await request('/ads/claim', { user: tgUser, apples });
  },

  // Submit Withdrawal
  submitWithdraw: async (tgUser, amount, method, accountNumber) => {
    return await request('/withdraw/submit', {
      user: tgUser,
      amount,
      method,
      accountNumber,
    });
  },
};
