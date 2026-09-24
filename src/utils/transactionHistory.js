// Real Transaction History Manager for Apple Farm
// Syncs and persists user transactions directly with Firebase Firestore Database

import { addTransactionToDB, getUserTransactionsFromDB } from '../firebase';

const getStorageKey = (userId) => `apple_farm_tx_v2_${userId || 'guest'}`;

// Get cached real transactions from local storage (No mock data)
export const getTransactions = (userId) => {
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse cached transactions:', e);
  }
  return [];
};

// Sync transactions directly from Firestore DB
export const fetchUserTransactions = async (userId) => {
  if (!userId) return getTransactions(userId);
  try {
    const dbTransactions = await getUserTransactionsFromDB(userId);
    if (Array.isArray(dbTransactions)) {
      const key = getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(dbTransactions));
      return dbTransactions;
    }
  } catch (err) {
    console.error('Failed to fetch transactions from DB:', err);
  }
  return getTransactions(userId);
};

// Add a real transaction to Firebase Database and local state
export const addTransaction = async ({
  userId,
  title,
  subtitle = '',
  amount,
  currency = 'apple',
  type = 'earn', // 'earn' (আসলো) | 'spend' (গেলো)
  category = 'general',
  status = 'Completed',
}) => {
  const formattedAmount = typeof amount === 'number' 
    ? (amount > 0 ? `+${amount}` : `${amount}`)
    : String(amount).startsWith('+') || String(amount).startsWith('-') ? String(amount) : (type === 'spend' ? `-${amount}` : `+${amount}`);

  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = 'Today, ' + timeString;

  const newTx = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId: userId ? userId.toString() : null,
    title,
    subtitle,
    amount: formattedAmount,
    currency,
    type,
    category,
    status,
    date: dateString,
    createdTime: Date.now(),
  };

  try {
    // 1. Save to local cache for instant UI response
    const key = getStorageKey(userId);
    const current = getTransactions(userId);
    const updated = [newTx, ...current].slice(0, 50);
    localStorage.setItem(key, JSON.stringify(updated));

    // 2. Persist to Firebase Firestore database
    if (userId) {
      addTransactionToDB(userId, newTx).catch((err) => {
        console.warn('DB transaction background sync note:', err);
      });
    }

    return newTx;
  } catch (e) {
    console.error('Failed to add transaction:', e);
    return newTx;
  }
};
