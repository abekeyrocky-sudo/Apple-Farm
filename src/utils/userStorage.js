/**
 * User-scoped LocalStorage Helper
 * Ensures different Telegram accounts on the same device/browser 
 * never share tasks, daily rewards, spin counts, or tree states.
 */

export const getUserKey = (baseKey, userId) => {
  const uid = userId ? String(userId) : 'guest';
  return `${baseKey}_${uid}`;
};

export const getStoredJson = (baseKey, userId, fallback = null) => {
  try {
    const key = getUserKey(baseKey, userId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`Error reading ${baseKey} for user ${userId}:`, e);
    return fallback;
  }
};

export const setStoredJson = (baseKey, userId, data) => {
  try {
    const key = getUserKey(baseKey, userId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error writing ${baseKey} for user ${userId}:`, e);
  }
};

export const removeStoredKey = (baseKey, userId) => {
  try {
    const key = getUserKey(baseKey, userId);
    localStorage.removeItem(key);
  } catch (e) {}
};
