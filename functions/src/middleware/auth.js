import crypto from 'crypto';

/**
 * Validates Telegram WebApp initData against the bot token using HMAC SHA-256.
 * @param {string} initData - Raw initData string sent from window.Telegram.WebApp.initData
 * @param {string} botToken - Telegram Bot Token
 * @returns {object|null} - Parsed user object if valid, null otherwise.
 */
export function validateTelegramWebAppData(initData, botToken) {
  if (!initData || !botToken) return null;

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return null;

    // Check expiration / replay attack (48 hours window)
    const authDate = urlParams.get('auth_date');
    if (authDate) {
      const authTimestamp = parseInt(authDate, 10);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (currentTimestamp - authTimestamp > 172800) { // 48 hours
        console.warn('[Telegram Auth] Expired auth_date received:', authDate);
        return null;
      }
    }

    urlParams.delete('hash');

    // Sort params alphabetically
    const paramsList = [];
    for (const [key, value] of urlParams.entries()) {
      paramsList.push(`${key}=${value}`);
    }
    paramsList.sort();
    const dataCheckString = paramsList.join('\n');

    // Secret key = HMAC-SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculated hash = HMAC-SHA256(dataCheckString, secretKey)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash === hash) {
      const userParam = urlParams.get('user');
      return userParam ? JSON.parse(userParam) : null;
    }

    return null;
  } catch (error) {
    console.error('Telegram validation error:', error);
    return null;
  }
}

/**
 * Express Middleware for authenticating requests with Telegram initData header
 */
export function telegramAuthMiddleware(botToken) {
  return (req, res, next) => {
    const initData = req.headers['x-telegram-init-data'] || req.headers['authorization'];
    
    // In dev / localhost test mode without initData, allow dev farmer fallback
    if (!initData) {
      const isLocalOrDev = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
      if (isLocalOrDev && (req.body?.user?.id === 40281 || req.query?.userId === '40281')) {
        req.telegramUser = {
          id: 40281,
          first_name: 'Dev Farmer',
          username: 'dev_farmer'
        };
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized: Missing Telegram WebApp initData signature' });
    }

    const validatedUser = validateTelegramWebAppData(initData, botToken);
    if (!validatedUser) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired Telegram signature' });
    }

    req.telegramUser = validatedUser;
    next();
  };
}
