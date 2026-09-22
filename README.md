# 🍎 Apple Farm - Telegram Mini App (TMA) 🍏

> **GROW • HARVEST • EARN**  
> A Casual Cartoon Farm Game & Telegram Mini App built with React, Vite, Tailwind CSS, Three.js, and Firebase.

---

## 🌟 Features

- **Cartoon Game UI**: 3D glossy badge aesthetics, vibrant animations, dynamic farm scenes, and particle effects.
- **10 Complete Screens**:
  1. 🌿 **Splash / Loading Screen**
  2. 🏡 **Home / Main Orchard Screen** (Interactive click-to-harvest, energy bar)
  3. 🌳 **Mine / Click to Collect Page** (Tap farm tree to gather apples)
  4. 📋 **Tasks & Rewards Page** (Filterable: All, Daily, Special)
  5. 🎡 **Spin & Win Lucky Wheel** (7 slices with animated needle & confetti celebration)
  6. 📺 **Watch Ads Page** (Simulated ad views with progress counter)
  7. 👥 **Invite Friends Page** (Referral commission link + 1-click Telegram share)
  8. 💰 **Wallet Page** (Total balance, Apple/Diamond filters, and transaction history)
  9. 💳 **Withdraw Page** (6 payment methods: TON, bKash, UPI, JazzCash, eSewa, STC Pay)
  10. 👤 **Profile & Settings Page** (Promo code redemption + user level badges)
- **Node.js Bot Backend**: Fast handler for `/start` (with referral parameters) and `/help`.
- **Firebase Firestore Integration**: Real-time user balance synchronization and resilient fallback.
- **Telegram WebApp SDK**: Haptic feedback on touches, theme synchronization, expand view.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file from `.env.example`:
```env
TELEGRAM_BOT_TOKEN=8995359366:AAFdsDniKILYpWVlPJUHN5MIUcvbcseG8Bw
MINI_APP_URL=https://your-mini-app-url.vercel.app
CHANNEL_URL=https://t.me/AppleFarmCommunity
```

### 3. Start Frontend Dev Server
```bash
npm run dev
```

### 4. Start Telegram Bot Server
```bash
npm run bot
```

---

## 📤 Deploying to GitHub & Vercel

### Step 1: Initialize Git & Commit
```bash
git init
git add .
git commit -m "feat: initial Apple Farm Telegram Mini App release"
```

### Step 2: Push to GitHub
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/apple-farm-tma.git
git push -u origin main
```

### Step 3: Deploy Frontend on Vercel
1. Go to [Vercel](https://vercel.com) and import your GitHub repository.
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Click **Deploy**.

### Step 4: Configure Bot on @BotFather
1. Open [@BotFather](https://t.me/BotFather) on Telegram.
2. Send `/setmenubutton` -> choose your bot -> set the button URL to your Vercel URL.
3. Or create a Web App via `/newapp`.
