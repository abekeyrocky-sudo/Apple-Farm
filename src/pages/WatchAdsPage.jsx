import React, { useState, useEffect, useRef } from 'react';
import { Play, Gift, Sparkles, Star, Trophy, CheckCircle2, X, RotateCw, Clock, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import bg549Img from '../../assets/549-bg-image.jpg';
import CustomTitleBar from '../components/CustomTitleBar';
import { soundManager } from '../utils/soundManager';
import { getStoredJson, setStoredJson } from '../utils/userStorage';
import { updateUserInDB } from '../firebase';

const getNextMidnightRemaining = () => {
  const now = new Date();
  const nextMidnight = new Date();
  nextMidnight.setHours(24, 0, 0, 0); // Next 00:00:00
  const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

// 🎮 8টি পেরিমিটার বক্সের আইটেম (Faded Wheel)
const FADED_ITEMS = [
  { id: 0, type: 'diamond', label: '50', name: '50 Diamonds', bg: 'from-sky-500/25 to-blue-600/30', border: 'border-sky-400', badge: 'Jackpot', badgeBg: 'bg-amber-500' },
  { id: 1, type: 'apple', label: '1000', name: '1,000 Apples', bg: 'from-amber-500/25 to-yellow-600/30', border: 'border-amber-400', badge: 'Rare', badgeBg: 'bg-purple-500' },
  { id: 2, type: 'diamond', label: '20', name: '20 Diamonds', bg: 'from-purple-500/25 to-indigo-600/30', border: 'border-purple-400' },
  { id: 3, type: 'apple', label: '500', name: '500 Apples', bg: 'from-red-500/25 to-rose-600/30', border: 'border-rose-400' },
  { id: 4, type: 'diamond', label: '10', name: '10 Diamonds', bg: 'from-teal-500/25 to-emerald-600/30', border: 'border-teal-400' },
  { id: 5, type: 'apple', label: '250', name: '250 Apples', bg: 'from-green-500/25 to-emerald-600/30', border: 'border-green-400' },
  { id: 6, type: 'diamond', label: '5', name: '5 Diamonds', bg: 'from-pink-500/25 to-rose-600/30', border: 'border-pink-400' },
  { id: 7, type: 'apple', label: '100', name: '100 Apples', bg: 'from-orange-500/25 to-amber-600/30', border: 'border-orange-400' },
];

// 🎡 6টি সেগমেন্টের জ্যাকপট স্পিন হুইল
const JACKPOT_SECTORS = [
  { id: 0, label: 'Box', type: 'box', color: '#8e44ad', name: 'Mystery Box' },
  { id: 1, label: '25', type: 'apple', color: '#e67e22', name: '25 Apples', amount: 25 },
  { id: 2, label: '500', type: 'diamond', color: '#e74c3c', name: '500 Diamonds', amount: 500 },
  { id: 3, label: 'Box', type: 'box', color: '#8e44ad', name: 'Mystery Box' },
  { id: 4, label: '100', type: 'diamond', color: '#2980b9', name: '100 Diamonds', amount: 100 },
  { id: 5, label: '40', type: 'apple', color: '#d35400', name: '40 Apples', amount: 40 },
];

const BASE_ADS_STORAGE_KEY = 'apple_farm_watch_ads_v2';
const BASE_JACKPOT_STORAGE_KEY = 'apple_farm_jackpot_v3';
const BASE_LIFETIME_ADS_KEY = 'apple_farm_lifetime_ads_v1';
const BASE_449_CLAIMED_KEY = 'apple_farm_449_claimed_v1';

export default function WatchAdsPage({ 
  user = { id: null, username: 'Farmer', apples: 0, diamonds: 0, invitedFriends: [] }, 
  onBack, 
  onRewardEarned, 
  onWinReward, 
  onShowPopup 
}) {
  const maxDailyAds = 10;
  const today = new Date().toDateString();

  // লোকাল স্টোরেজ থেকে ডেইলি অ্যাড স্টেট লোড
  const [adState, setAdState] = useState(() => {
    const saved = getStoredJson(BASE_ADS_STORAGE_KEY, user?.id, {
      date: today,
      watched: 0,
      isWheelClaimed: false
    });
    if (saved.date !== today) {
      return { date: today, watched: 0, isWheelClaimed: false };
    }
    return saved;
  });

  // 🌟 লাইফটাইম টোটাল অ্যাড কাউন্টার (যা কোনো দিনই রিসেট হবে না)
  const [lifetimeAds, setLifetimeAds] = useState(() => {
    if (typeof user?.lifetimeAdsWatched === 'number') {
      return user.lifetimeAdsWatched;
    }
    const saved = getStoredJson(BASE_LIFETIME_ADS_KEY, user?.id, 0);
    return typeof saved === 'number' ? saved : 0;
  });

  // 🌟 ৪৪৯ অ্যাড মেগা রিওয়ার্ড ক্লেইম স্ট্যাটাস
  const [is449Claimed, setIs449Claimed] = useState(() => {
    if (typeof user?.is449Claimed === 'boolean') {
      return user.is449Claimed;
    }
    return getStoredJson(BASE_449_CLAIMED_KEY, user?.id, false);
  });

  // 🎡 549 Diamond জ্যাকপট স্টেট (Default 0.0, 1 Free Spin on 1st visit)
  const [jackpotState, setJackpotState] = useState(() => {
    const initial = getStoredJson(BASE_JACKPOT_STORAGE_KEY, user?.id, {
      eventPot: 0.0,
      targetPot: 549.0,
      spinsLeft: 1, // প্রথমবার ইউজার ১টি স্পিন সম্পূর্ণ ফ্রি পাবে
      totalSpinsDone: 0,
      lastFreeSpinDate: today,
      creditedReferralSpins: 0,
      isClaimed: false
    });

    // ডেইলি ১টি ফ্রি স্পিন চেক
    if (initial.lastFreeSpinDate !== today && initial.totalSpinsDone > 0) {
      initial.spinsLeft += 1;
      initial.lastFreeSpinDate = today;
    }

    if (initial.eventPot > 546.85) {
      initial.eventPot = 546.85;
    }

    return initial;
  });

  const [jackpotRotation, setJackpotRotation] = useState(0);
  const [isJackpotSpinning, setIsJackpotSpinning] = useState(false);
  const [jackpotWonResult, setJackpotWonResult] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const [isWatching, setIsWatching] = useState(false);
  const [adLoadingText, setAdLoadingText] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [isWheelModalOpen, setIsWheelModalOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [activeMissionModal, setActiveMissionModal] = useState(null); // '449_ads' | 'jackpot_mission'
  const [resetCountdown, setResetCountdown] = useState(getNextMidnightRemaining);
  const spinTimerRef = useRef(null);

  const adsWatched = adState.watched || 0;
  const isWheelClaimed = adState.isWheelClaimed || false;
  const isDailyAdsCompleted = adsWatched >= maxDailyAds;

  // লাইভ মধ্যরাত কাউন্টডাউন টাইমার ইফেক্ট
  useEffect(() => {
    const timer = setInterval(() => {
      setResetCountdown(getNextMidnightRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ইউজার ও রেফারেল স্পিন সিঙ্ক
  useEffect(() => {
    if (!user?.id) return;
    const savedAds = getStoredJson(BASE_ADS_STORAGE_KEY, user.id, {
      date: today,
      watched: 0,
      isWheelClaimed: false
    });
    if (savedAds.date !== today) {
      const fresh = { date: today, watched: 0, isWheelClaimed: false };
      setAdState(fresh);
      setStoredJson(BASE_ADS_STORAGE_KEY, user.id, fresh);
    } else {
      setAdState(savedAds);
    }

    // লাইফটাইম অ্যাড ও ৪৪৯ ক্লেইম সিঙ্ক
    if (typeof user?.lifetimeAdsWatched === 'number' && user.lifetimeAdsWatched > lifetimeAds) {
      setLifetimeAds(user.lifetimeAdsWatched);
      setStoredJson(BASE_LIFETIME_ADS_KEY, user.id, user.lifetimeAdsWatched);
    }
    if (user?.is449Claimed) {
      setIs449Claimed(true);
      setStoredJson(BASE_449_CLAIMED_KEY, user.id, true);
    }

    const savedJackpot = getStoredJson(BASE_JACKPOT_STORAGE_KEY, user.id, {
      eventPot: 0.0,
      targetPot: 549.0,
      spinsLeft: 1,
      totalSpinsDone: 0,
      lastFreeSpinDate: today,
      creditedReferralSpins: 0,
      isClaimed: false
    });

    // ১. ডেইলি ফ্রি স্পিন চেক
    if (savedJackpot.lastFreeSpinDate !== today && savedJackpot.totalSpinsDone > 0) {
      savedJackpot.spinsLeft += 1;
      savedJackpot.lastFreeSpinDate = today;
    }

    if (savedJackpot.eventPot > 546.85) {
      savedJackpot.eventPot = 546.85;
    }

    // ২. পার রেফার = ১ স্পিন সিঙ্ক (Unlimited spins per referral)
    const invitedCount = Array.isArray(user?.invitedFriends) 
      ? user.invitedFriends.length 
      : (user?.referralsCount || 0);
    const credited = savedJackpot.creditedReferralSpins || 0;
    if (invitedCount > credited) {
      const newSpins = invitedCount - credited;
      savedJackpot.spinsLeft += newSpins;
      savedJackpot.creditedReferralSpins = invitedCount;
    }

    setJackpotState(savedJackpot);
    setStoredJson(BASE_JACKPOT_STORAGE_KEY, user.id, savedJackpot);
  }, [user?.id, today, user?.invitedFriends?.length]);

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, []);

  const progressPercent = Math.min(100, Math.round((adsWatched / maxDailyAds) * 100));

  // 🎡 জ্যাকপট হুইল স্পিন হ্যান্ডলার (ভাইরাল স্ক্রিপ্টেড প্রগ্রেশন)
  const handleJackpotSpin = () => {
    if (isJackpotSpinning || jackpotState.spinsLeft <= 0) return;

    setIsJackpotSpinning(true);
    setJackpotWonResult(null);
    soundManager.playClickSound();

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
    }

    const currentSpinsDone = jackpotState.totalSpinsDone || 0;
    let targetSectorIndex = 0;
    let wonDiamondsAdd = 0;
    let wonApplesAdd = 0;
    let resultMessage = '';

    // 🎯 ভাইরাল প্রগ্রেশন লজিক:
    // ১ম স্পিন: নিশ্চিতভাবে 500 Diamonds (সেক্টর ২) পাবে!
    if (currentSpinsDone === 0) {
      targetSectorIndex = 2; // '500 Diamond'
      wonDiamondsAdd = 500.0;
      resultMessage = 'MEGA JACKPOT! +500 Diamonds added to Event Pot!';
    } else if (currentSpinsDone === 1) {
      // ২য় স্পিন: Box -> +20 Diamonds
      targetSectorIndex = 0; // Box
      wonDiamondsAdd = 20.0;
      resultMessage = 'Mystery Box Opened! +20.0 Diamonds added to Pot!';
    } else if (currentSpinsDone === 2) {
      // ৩য় স্পিন: Box -> +14 Diamonds
      targetSectorIndex = 3; // Box
      wonDiamondsAdd = 14.0;
      resultMessage = 'Mystery Box Opened! +14.0 Diamonds added to Pot!';
    } else if (currentSpinsDone === 3) {
      // ৪র্থ স্পিন: Box -> +7.5 Diamonds
      targetSectorIndex = 0; // Box
      wonDiamondsAdd = 7.5;
      resultMessage = 'Mystery Box Opened! +7.5 Diamonds added to Pot!';
    } else if (currentSpinsDone === 4) {
      // ৫ম স্পিন: Box -> +4.2 Diamonds (পৌঁছে যায় ৫৪৫.৭ এ)
      targetSectorIndex = 3; // Box
      wonDiamondsAdd = 4.2;
      resultMessage = 'Mystery Box Opened! +4.2 Diamonds added to Pot!';
    } else if (currentSpinsDone === 5) {
      // ৬ষ্ঠ স্পিন: 25 Apples (৫০০ ডায়মন্ডের ঠিক পাশে Near Miss!)
      targetSectorIndex = 1; // 25 Apples
      wonApplesAdd = 25;
      resultMessage = 'So close! Won 25 Apples to Balance!';
    } else if (currentSpinsDone === 6) {
      // ৭ম স্পিন: Box -> +0.5 Diamonds (পৌঁছে যায় ৫৪৬.২ এ)
      targetSectorIndex = 0; // Box
      wonDiamondsAdd = 0.5;
      resultMessage = 'Mystery Box Opened! +0.5 Diamonds added to Pot!';
    } else if (currentSpinsDone === 7) {
      // ৮ম স্পিন: 40 Apples
      targetSectorIndex = 5; // 40 Apples
      wonApplesAdd = 40;
      resultMessage = 'Won 40 Apples to Balance!';
    } else {
      // পরবর্তী সব স্পিন (Spins 8+):
      // ব্যবহারকারী শত শত স্পিন করলেও কোনোভাবেই ৫৪৯ এ পৌঁছাতে পারবে না!
      const rand = Math.random();
      if (rand < 0.60) {
        // ৬০% চান্স: ২৫ অ্যাপেল (সেক্টর ১ - ৫০০ ডায়মন্ডের ঠিক পাশে Near-miss)
        targetSectorIndex = 1;
        wonApplesAdd = 25;
        resultMessage = 'Almost Jackpot! Won 25 Apples to Balance!';
      } else if (rand < 0.90) {
        // ৩০% চান্স: ৪০ অ্যাপেল (সেক্টর ৫)
        targetSectorIndex = 5;
        wonApplesAdd = 40;
        resultMessage = 'Won 40 Apples to Balance!';
      } else {
        // ১০% চান্স: বক্স (সেক্টর ০ বা ৩)
        targetSectorIndex = Math.random() < 0.5 ? 0 : 3;
        // যদি এখনও ৫৪৬.৭ এর নিচে থাকে তবে অতি ক্ষুদ্র ০.০১ যোগ হবে
        if (jackpotState.eventPot < 546.7) {
          wonDiamondsAdd = 0.02;
          resultMessage = 'Mystery Box! +0.02 Diamonds added to Pot!';
        } else {
          // ৫৪৬.৭ ছুঁয়ে ফেললে বক্সে শুধুই অ্যাপেল বোনাস পাবে, কোনো ডায়মন্ড বাড়বে না
          wonApplesAdd = 15;
          wonDiamondsAdd = 0;
          resultMessage = 'Mystery Box Surprise! +15 Apples added to Balance!';
        }
      }
    }

    const winningSector = JACKPOT_SECTORS[targetSectorIndex];

    // ৬টি সেগমেন্ট (প্রতিটি ৬০ ডিগ্রি)
    // targetSectorIndex টপ পয়েন্টারে (০ ডিগ্রি) আনতে প্রয়োজনীয় রোটেশন
    const fullSpins = 6 * 360;
    const targetSectorAngle = (360 - (targetSectorIndex * 60)) % 360;
    const currentAngle = jackpotRotation % 360;
    const addedAngle = (targetSectorAngle - currentAngle + 360) % 360;
    const finalRotation = jackpotRotation + fullSpins + addedAngle;

    setJackpotRotation(finalRotation);

    // সাউন্ড টাইমার
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      soundManager.playSpinTick();
      tickCount++;
      if (tickCount > 25) clearInterval(tickInterval);
    }, 150);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsJackpotSpinning(false);
      setJackpotWonResult({ ...winningSector, customMsg: resultMessage });
      soundManager.playSuccessSound();

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      // 🔒 HARD CEILING: পোট সর্বোচ্চ ৫৪৬.৮৫ পর্যন্ত যেতে পারে, কোনোভাবেই ৫৪৯ স্পর্শ করবে না
      const MAX_JACKPOT_CEILING = 546.85;
      let nextPot = jackpotState.eventPot;
      if (wonDiamondsAdd > 0) {
        nextPot = Math.min(MAX_JACKPOT_CEILING, Math.round((jackpotState.eventPot + wonDiamondsAdd) * 100) / 100);
      }
      if (wonApplesAdd > 0 && onRewardEarned) {
        onRewardEarned(wonApplesAdd);
      }

      const updatedJackpot = {
        ...jackpotState,
        eventPot: nextPot,
        spinsLeft: Math.max(0, jackpotState.spinsLeft - 1),
        totalSpinsDone: currentSpinsDone + 1
      };

      setJackpotState(updatedJackpot);
      setStoredJson(BASE_JACKPOT_STORAGE_KEY, user?.id, updatedJackpot);

      confetti({
        particleCount: currentSpinsDone === 0 ? 160 : 70,
        spread: 80,
        origin: { y: 0.5 }
      });
    }, 4500);
  };

  // 🎡 ইনভাইট ফ্রেন্ড বাটন (+1 Spin Per Referral)
  const handleInviteForSpin = () => {
    soundManager.playClickSound();
    const botUsername = 'AppleFarmOfficialBot';
    const refCode = user?.id || user?.username || '40281';
    const referralLink = `https://t.me/${botUsername}/App?startapp=${refCode}`;
    const shareText = encodeURIComponent('💎 Spin and win 549 Diamonds Jackpot in Apple Farm! Join now!');
    const fullShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`;

    try {
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(fullShareUrl);
      } else if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(fullShareUrl);
      } else {
        navigator.clipboard.writeText(referralLink);
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
      }
    } catch (e) {
      navigator.clipboard.writeText(referralLink);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  // 🎡 549 Diamonds পোট ক্লেইম
  const handleClaimJackpot = () => {
    if (jackpotState.eventPot < 549.0) return;
    soundManager.playSuccessSound();
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 } });

    if (onWinReward) {
      onWinReward({ type: 'diamond', label: '549', amount: 549 });
    }

    const resetJackpot = {
      ...jackpotState,
      eventPot: 0.0,
      spinsLeft: 1,
      totalSpinsDone: 0,
      isClaimed: true
    };
    setJackpotState(resetJackpot);
    setStoredJson(BASE_JACKPOT_STORAGE_KEY, user?.id, resetJackpot);
  };

  // 🎁 449 Ads Mega Reward ক্লেইম হ্যান্ডলার (২৫০ ডায়মন্ড)
  const handleClaim449MegaReward = () => {
    if (lifetimeAds < 449 || is449Claimed) return;
    soundManager.playSuccessSound();
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 } });

    if (onWinReward) {
      onWinReward({ type: 'diamond', label: '250', amount: 250, name: '250 Diamonds' });
    }

    setIs449Claimed(true);
    setStoredJson(BASE_449_CLAIMED_KEY, user?.id, true);
    if (user?.id) {
      updateUserInDB(user.id, { is449Claimed: true });
    }

    if (onShowPopup) {
      onShowPopup({
        type: 'success',
        title: 'Mega Reward Claimed! 💎',
        message: 'Congratulations! You received 250 Diamonds for completing 449 Ads!',
        confirmText: 'Awesome!'
      });
    }
  };

  // অ্যাড দেখা হ্যান্ডলার (GigaPub + Monetag Dual Ad Networks)
  const handleWatchAd = () => {
    if (adsWatched >= maxDailyAds || isWatching) return;

    soundManager.playClickSound();
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    const grantAdReward = () => {
      const nextWatched = adsWatched + 1;
      const nextLifetime = lifetimeAds + 1;
      setLifetimeAds(nextLifetime);
      setStoredJson(BASE_LIFETIME_ADS_KEY, user?.id, nextLifetime);
      if (user?.id) {
        updateUserInDB(user.id, { lifetimeAdsWatched: nextLifetime });
      }

      const nextState = {
        ...adState,
        date: today,
        watched: nextWatched,
        isWheelClaimed: nextWatched >= maxDailyAds ? false : adState.isWheelClaimed
      };
      setAdState(nextState);
      setStoredJson(BASE_ADS_STORAGE_KEY, user?.id, nextState);

      if (onRewardEarned) {
        onRewardEarned(10);
      }

      soundManager.playSuccessSound();
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      if (nextWatched === maxDailyAds) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => {
          setIsWheelModalOpen(true);
        }, 600);
      }
    };

    const runFallbackCountdown = () => {
      setIsWatching(true);
      setAdLoadingText('');
      let timer = 3;
      setCountdown(timer);

      const interval = setInterval(() => {
        timer -= 1;
        setCountdown(timer);
        if (timer <= 0) {
          clearInterval(interval);
          setIsWatching(false);
          setAdLoadingText('');
          grantAdReward();
        }
      }, 1000);
    };

    // Helper to give GigaPub SDK 1-5 seconds to load if needed
    const waitForGigaSdk = (maxWaitMs = 5000) => {
      return new Promise((resolve) => {
        if (typeof window.showGiga === 'function') {
          return resolve(window.showGiga);
        }
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
          if (typeof window.showGiga === 'function') {
            clearInterval(checkInterval);
            resolve(window.showGiga);
          } else if (Date.now() - startTime >= maxWaitMs) {
            clearInterval(checkInterval);
            resolve(null);
          }
        }, 300);
      });
    };

    const getMonetagFn = () => {
      return typeof window.show_11914279 === 'function' 
        ? window.show_11914279 
        : (typeof show_11914279 === 'function' ? show_11914279 : null);
    };

    // Explicit Ad Scheduling:
    // Ad 1, 3, 5, 7, 9 = GigaPub Ads
    // Ad 2, 4, 6, 8, 10 = Monetag Ads
    const currentAdNumber = adsWatched + 1; // 1st to 10th ad
    const isGigaPubTurn = currentAdNumber % 2 !== 0; // 1, 3, 5, 7, 9 -> GigaPub

    const playMonetagAd = () => {
      setIsWatching(true);
      setAdLoadingText('Loading Monetag Ad...');
      const monetagFn = getMonetagFn();

      if (monetagFn) {
        try {
          monetagFn()
            .then(() => {
              setIsWatching(false);
              setAdLoadingText('');
              grantAdReward();
            })
            .catch((err) => {
              console.warn('[Monetag Ad Error]:', err);
              // Waterfall to GigaPub if Monetag fails
              playGigaAd();
            });
        } catch (err) {
          playGigaAd();
        }
      } else {
        // Monetag not loaded, fallback to GigaPub
        playGigaAd();
      }
    };

    const playGigaAd = async () => {
      setIsWatching(true);
      setAdLoadingText('Loading GigaPub Ad (1-5s)...');

      // Give GigaPub 1-5 seconds buffer to fetch and load ad
      const gigaSdkFn = await waitForGigaSdk(5000);

      if (gigaSdkFn) {
        setAdLoadingText('Showing Ad...');
        try {
          gigaSdkFn()
            .then(() => {
              setIsWatching(false);
              setAdLoadingText('');
              grantAdReward();
            })
            .catch((err) => {
              console.warn('[GigaPub Ad Error]:', err);
              const monetagFn = getMonetagFn();
              if (monetagFn) {
                // Waterfall to Monetag if GigaPub had no ad
                playMonetagAd();
              } else {
                setIsWatching(false);
                setAdLoadingText('');
                if (onShowPopup) {
                  onShowPopup({
                    type: 'warn',
                    title: 'Ad Incomplete',
                    message: 'Ad was closed early or unavailable. Please watch the full ad to receive your reward.',
                    confirmText: 'OK'
                  });
                }
              }
            });
        } catch (err) {
          const monetagFn = getMonetagFn();
          if (monetagFn) playMonetagAd();
          else runFallbackCountdown();
        }
      } else {
        // GigaPub timed out after 5s, waterfall to Monetag
        const monetagFn = getMonetagFn();
        if (monetagFn) {
          playMonetagAd();
        } else {
          runFallbackCountdown();
        }
      }
    };

    if (isGigaPubTurn) {
      playGigaAd();
    } else {
      playMonetagAd();
    }
  };

  // 🎮 FADED WHEEL LIGHT CHASING ANIMATION (Center Spin Button Triggered)
  const handleSpinFadedWheel = () => {
    if (isSpinning || isWheelClaimed) return;

    setIsSpinning(true);
    setWonPrize(null);
    soundManager.playClickSound();

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
    }

    // 🎯 সুনির্দিষ্ট প্রোবাবিলিটি বণ্টন:
    // ❌ ০% চান্স (কখনোই পড়বে না): +50 Diamonds (id: 0), +20 Diamonds (id: 2), +10 Diamonds (id: 4)
    // ✔️ ১৫% চান্স: +5 Diamonds (id: 6)
    // 🍎 ৮৫% চান্স: Apples (id: 7, 5, 3, 1)
    const rand = Math.random() * 100;
    let winningIndex;
    if (rand < 15) {
      winningIndex = 6; // +5 Diamonds (15% Chance)
    } else if (rand < 50) {
      winningIndex = 7; // +100 Apples (35% Chance)
    } else if (rand < 75) {
      winningIndex = 5; // +250 Apples (25% Chance)
    } else if (rand < 90) {
      winningIndex = 3; // +500 Apples (15% Chance)
    } else {
      winningIndex = 1; // +1000 Apples (10% Chance)
    }
    const targetPrize = FADED_ITEMS[winningIndex];

    // কমপক্ষে ৪ ফুল রাউন্ড + উইনিং পয়েন্ট পর্যন্ত স্টেপ সংখ্যা
    const fullRounds = 4;
    const totalSteps = (fullRounds * 8) + ((winningIndex - activeHighlight + 8) % 8);

    let currentStep = 0;
    let currentIdx = activeHighlight;

    const runStep = () => {
      currentStep++;
      currentIdx = (currentIdx + 1) % 8;
      setActiveHighlight(currentIdx);
      soundManager.playSpinTick();

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }

      if (currentStep >= totalSteps) {
        // ফিনিশ!
        setIsSpinning(false);
        setWonPrize(targetPrize);
        soundManager.playSuccessSound();

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        confetti({
          particleCount: 130,
          spread: 80,
          origin: { y: 0.5 }
        });

        const updatedState = { ...adState, isWheelClaimed: true };
        setAdState(updatedState);
        setStoredJson(BASE_ADS_STORAGE_KEY, user?.id, updatedState);

        if (onWinReward) {
          onWinReward(targetPrize);
        } else if (onRewardEarned && targetPrize.type === 'apple') {
          onRewardEarned(Number(targetPrize.label));
        }
      } else {
        // স্পিড কার্ভ: শুরুতে ফাস্ট, শেষের ১০ ধাপে ক্রমান্বয়ে স্লো
        const remaining = totalSteps - currentStep;
        let delay = 60;
        if (remaining < 12) {
          delay = 60 + Math.pow(12 - remaining, 2) * 3.5;
        }
        spinTimerRef.current = setTimeout(runStep, delay);
      }
    };

    runStep();
  };

  // ৩x৩ গ্রিডের সেল রেন্ডার হেল্পার (Light Theme)
  const renderFadedCell = (itemIndex) => {
    const item = FADED_ITEMS[itemIndex];
    const isLit = activeHighlight === itemIndex;
    const isWinner = wonPrize && wonPrize.id === itemIndex;

    return (
      <div
        key={item.id}
        className={`relative aspect-square rounded-2xl p-2 flex flex-col items-center justify-between border-2 transition-all duration-150 select-none ${
          isWinner
            ? 'bg-gradient-to-tr from-emerald-100 via-green-50 to-emerald-200 border-emerald-500 shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-105 z-20 animate-pulse ring-2 ring-emerald-400'
            : isLit
            ? 'bg-gradient-to-tr from-amber-100 via-yellow-50 to-amber-200 border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.6)] scale-105 z-10 ring-2 ring-amber-300'
            : 'bg-white/95 border-sky-100/90 shadow-[0_2px_8px_rgba(0,140,255,0.05)] opacity-95 hover:opacity-100'
        }`}
      >
        {/* Top Badge (if any) */}
        {item.badge && (
          <span className={`absolute -top-1.5 -right-1.5 text-[8px] font-black text-white px-1.5 py-0.2 rounded-full shadow-sm ${item.badgeBg}`}>
            {item.badge}
          </span>
        )}

        {/* Icon */}
        <div className="w-8 h-8 flex items-center justify-center filter drop-shadow-sm mt-1">
          {item.type === 'diamond' ? (
            <img src={diamondImg} alt="Diamond" className="w-7 h-7 object-contain" />
          ) : (
            <img src={appleImg} alt="Apple" className="w-7 h-7 object-contain" />
          )}
        </div>

        {/* Value Label */}
        <div className="text-center">
          <span className={`text-xs font-black tracking-tight ${
            item.type === 'diamond' ? 'text-sky-600' : 'text-amber-600'
          }`}>
            +{item.label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#eaf6ff] via-[#f4f9ff] to-[#e8f5e9] flex flex-col justify-between p-4 select-none font-sans overflow-hidden">
      
      {/* ----------------- TOP HEADER ----------------- */}
      <div>
        <CustomTitleBar title="Apple Farm" darkText={true} />
        <div className="relative flex items-center justify-between pt-1 mb-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform shadow-sm cursor-pointer">
            <svg className="w-5 h-5 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 className="text-xl font-black text-[#192f52] tracking-tight">
            Watch Ads
          </h1>

          <div className="w-9" />
        </div>
      </div>

      {/* ----------------- MAIN CONTENT AREA ----------------- */}
      <div className="flex-1 space-y-3.5">
        
        {/* 1. TOP PROGRESS CARD */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-sky-100 shadow-[0_4px_16px_rgba(0,140,255,0.06)] flex flex-col items-center">
          
          <div className="w-full flex items-center justify-between px-2 mb-3">
            <div className="relative w-16 h-16 flex items-center justify-center filter drop-shadow-[0_6px_10px_rgba(0,163,255,0.35)]">
              <img src={diamondImg} alt="Diamond" className="w-14 h-14 object-contain" />
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-[#567396]">Available Today</span>
              <div className="text-3xl font-black text-[#192f52] tracking-tight">
                {adsWatched} <span className="text-xl text-[#7895b6]">/ {maxDailyAds}</span>
              </div>
            </div>
          </div>

          <div className="w-full h-5 bg-[#e2ecf5] rounded-full p-1 shadow-inner overflow-hidden mb-2.5">
            <div 
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-[#2ecc71] via-[#27ae60] to-[#1abc9c] rounded-full transition-all duration-500 shadow-[0_1px_4px_rgba(46,204,113,0.5)]"
            />
          </div>

          <p className="text-xs font-bold text-[#32527b]">
            Watch 10 Ads = Up to 50 Diamonds
          </p>
        </div>

        {/* 2. REWARD CARD: 449 Ads */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 px-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-50 border border-sky-200 flex items-center justify-center filter drop-shadow-sm p-2">
              <img src={diamondImg} alt="Diamond" className="w-full h-full object-contain" />
            </div>

            <div>
              <h3 className="text-base font-black text-[#192f52]">449 Ads</h3>
              <p className="text-xs font-bold text-[#567396]">
                Up to 250 Diamonds
              </p>
            </div>
          </div>

          <button 
            onClick={() => {
              soundManager.playClickSound();
              if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
              }
              setActiveMissionModal('449_ads');
            }}
            className="bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 text-white font-black text-xs px-5 py-2 rounded-2xl shadow-[0_3px_0_#145a32] border-t border-emerald-300 transition-all cursor-pointer"
          >
            Open
          </button>
        </div>

        {/* 3. REWARD CARD: Jackpot Mission */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 px-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-sm">
              <Trophy className="w-6 h-6 fill-amber-400 text-amber-600" />
            </div>

            <div>
              <h3 className="text-base font-black text-[#192f52]">Jackpot Mission</h3>
              <p className="text-xs font-bold text-[#567396]">
                549 Diamonds
              </p>
            </div>
          </div>

          <button 
            onClick={() => {
              soundManager.playClickSound();
              if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
              }
              setActiveMissionModal('jackpot_mission');
            }}
            className="bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 text-white font-black text-xs px-5 py-2 rounded-2xl shadow-[0_3px_0_#145a32] border-t border-emerald-300 transition-all cursor-pointer"
          >
            Open
          </button>
        </div>

      </div>

      {/* ----------------- BOTTOM ACTION SECTION ----------------- */}
      <div className="space-y-3 pb-4">
        
        {isDailyAdsCompleted ? (
          isWheelClaimed ? (
            <button 
              disabled
              className="w-full py-3.5 rounded-2xl font-black text-sm text-white bg-slate-500/90 border border-slate-400/30 cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              <Clock className="w-4 h-4 text-sky-200" />
              <span>Completed • Resets in {resetCountdown}</span>
            </button>
          ) : (
            <button 
              onClick={() => setIsWheelModalOpen(true)}
              className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2.5 transition-all shadow-[0_5px_0_#b45309] border-t border-amber-200 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:brightness-105 active:scale-95 active:shadow-[0_2px_0_#b45309] animate-pulse cursor-pointer"
            >
              <div className="w-7 h-7 rounded-xl bg-white/25 border border-white/40 flex items-center justify-center shadow-xs">
                <Gift className="w-4 h-4 text-white" />
              </div>
              <span className="tracking-wide">Open Faded Wheel</span>
            </button>
          )
        ) : (
          <button 
            onClick={handleWatchAd}
            disabled={isWatching}
            className={`w-full py-3.5 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2.5 transition-all shadow-[0_4px_0_#145a32] border-t border-emerald-300 active:scale-95 active:shadow-[0_1px_0_#145a32] cursor-pointer ${
              isWatching
                ? 'bg-emerald-700/80 cursor-not-allowed shadow-[0_4px_0_#0f4024]'
                : 'bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105'
            }`}
          >
            {isWatching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>{adLoadingText || `Watching Ad... (${countdown}s)`}</span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-lg bg-white/20 border border-white/40 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                </div>
                <span>Watch Ad</span>
              </>
            )}
          </button>
        )}

        {/* Coming Soon Notice Pill */}
        <div className="w-full py-2.5 px-4 rounded-2xl bg-[#eaf4fd] border border-sky-200/80 flex items-center justify-center gap-2 text-xs font-bold text-[#32699e] shadow-sm">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
          <span>More apple earn task coming soon</span>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 🎮 3x3 GRID FADED WHEEL MODAL (Light Mode Theme)          */}
      {/* ========================================================= */}
      {isWheelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#f8fbff] to-[#edf5fc] rounded-3xl p-5 border border-sky-100 shadow-[0_20px_50px_rgba(0,100,200,0.18)] flex flex-col items-center text-[#192f52] select-none">
            
            {/* Close Button */}
            {!isSpinning && (
              <button 
                onClick={() => setIsWheelModalOpen(false)}
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-[11px] font-black text-amber-700 mb-2 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>10 Ads Daily Reward Unlocked!</span>
            </div>

            <h3 className="text-lg font-black text-[#192f52] text-center tracking-tight mb-1">
              Lucky Faded Wheel
            </h3>
            <p className="text-xs font-bold text-[#567396] text-center mb-3">
              Spin the center to chase your winning reward!
            </p>

            {/* 🎮 3x3 GRID (8 Outer Boxes + 1 Center SPIN Button) */}
            <div className="w-full grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#eaf4fd] border border-sky-200/70 shadow-inner my-1">
              
              {/* Row 1 */}
              {renderFadedCell(0)} {/* Top-Left */}
              {renderFadedCell(1)} {/* Top-Center */}
              {renderFadedCell(2)} {/* Top-Right */}

              {/* Row 2 */}
              {renderFadedCell(7)} {/* Middle-Left */}

              {/* 🎯 CENTER SPIN BUTTON (Cell 4) */}
              <div className="aspect-square rounded-2xl flex items-center justify-center p-0.5">
                {isWheelClaimed && !isSpinning ? (
                  <button 
                    disabled
                    className="w-full h-full rounded-xl bg-slate-200/80 border border-slate-300 flex flex-col items-center justify-center text-slate-500 cursor-not-allowed shadow-inner text-xs font-black gap-1"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px]">Claimed</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSpinFadedWheel}
                    disabled={isSpinning || isWheelClaimed}
                    className={`w-full h-full rounded-xl flex flex-col items-center justify-center gap-1 font-black text-white transition-all shadow-[0_4px_0_#145a32] border-t-2 border-emerald-300 bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-110 active:scale-90 active:shadow-[0_1px_0_#145a32] cursor-pointer ${
                      isSpinning 
                        ? 'opacity-85 cursor-not-allowed animate-pulse' 
                        : 'animate-bounce-gentle shadow-[0_0_15px_rgba(46,204,113,0.4)]'
                    }`}
                  >
                    <RotateCw className={`w-5 h-5 text-white stroke-[2.5] ${isSpinning ? 'animate-spin' : ''}`} />
                    <span className="text-xs tracking-wider uppercase drop-shadow font-black">
                      {isSpinning ? 'SPINNING' : 'SPIN'}
                    </span>
                  </button>
                )}
              </div>

              {renderFadedCell(3)} {/* Middle-Right */}

              {/* Row 3 */}
              {renderFadedCell(6)} {/* Bottom-Left */}
              {renderFadedCell(5)} {/* Bottom-Center */}
              {renderFadedCell(4)} {/* Bottom-Right */}

            </div>

            {/* Won Prize Banner */}
            {wonPrize && !isSpinning && (
              <div className="mt-3 w-full bg-gradient-to-r from-emerald-500 to-teal-600 border border-emerald-400 rounded-2xl p-2.5 px-4 flex items-center justify-center text-white animate-bounce-gentle shadow-md text-center">
                <span className="text-xs font-black">
                  Congratulations! Won +{wonPrize.label} {wonPrize.type === 'diamond' ? 'Diamonds' : 'Apples'}
                </span>
              </div>
            )}

            {/* Bottom Modal Close Button */}
            <div className="w-full mt-3">
              <button 
                onClick={() => setIsWheelModalOpen(false)}
                disabled={isSpinning}
                className="w-full py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 font-black text-xs text-slate-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {wonPrize ? 'Done & Collect' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 💎 1. 449 ADS DETAIL MODAL (Light Mode)                   */}
      {/* ========================================================= */}
      {activeMissionModal === '449_ads' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#f8fbff] to-[#edf5fc] rounded-3xl p-5 border border-sky-100 shadow-[0_20px_50px_rgba(0,100,200,0.18)] flex flex-col items-center text-[#192f52] select-none">
            
            <button 
              onClick={() => setActiveMissionModal(null)}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon Graphic */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-sky-100 to-blue-50 border border-sky-200 flex items-center justify-center p-3 my-2 filter drop-shadow-sm">
              <img src={diamondImg} alt="Diamond" className="w-11 h-11 object-contain" />
            </div>

            <h3 className="text-lg font-black text-[#192f52] text-center tracking-tight mt-1 mb-1">
              449 Ads Mega Reward
            </h3>

            <p className="text-xs font-bold text-[#567396] text-center mb-4">
              Watch 449 total ads across Apple Farm to unlock up to 250 Diamonds!
            </p>

            {/* Progress Card */}
            <div className="w-full bg-white/90 border border-sky-100 rounded-2xl p-3.5 mb-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-black mb-2">
                <span className="text-[#567396]">Total Progress</span>
                <span className="text-emerald-600 font-black">
                  {lifetimeAds} / 449 Ads
                </span>
              </div>
              <div className="w-full h-3.5 bg-[#e2ecf5] rounded-full p-0.5 overflow-hidden shadow-inner">
                <div 
                  style={{
                    width: `${Math.min(100, (lifetimeAds / 449) * 100)}%`
                  }}
                  className="h-full bg-gradient-to-r from-[#2ecc71] via-[#27ae60] to-[#1abc9c] rounded-full transition-all duration-500 shadow-sm"
                />
              </div>
              <div className="text-[11px] font-bold text-[#7895b6] text-center mt-2">
                {is449Claimed
                  ? '✅ 250 Diamonds Reward Claimed!'
                  : lifetimeAds >= 449
                    ? '🎉 449 Ads Completed! Ready to claim reward!'
                    : `Remaining: ${Math.max(0, 449 - lifetimeAds)} more ads needed`}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2">
              {is449Claimed ? (
                <button
                  disabled
                  className="w-full py-3.5 rounded-2xl bg-slate-200 text-slate-500 font-black text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Reward Claimed (250 Diamonds)</span>
                </button>
              ) : lifetimeAds >= 449 ? (
                <button
                  onClick={handleClaim449MegaReward}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-b from-[#f39c12] to-[#d35400] hover:brightness-105 active:scale-95 shadow-[0_4px_0_#963900] border-t border-amber-300 font-black text-xs text-white cursor-pointer transition-all flex items-center justify-center gap-2 animate-pulse"
                >
                  <Gift className="w-4 h-4 fill-white" />
                  <span>Claim 250 Diamonds Reward!</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setActiveMissionModal(null);
                    if (!isDailyAdsCompleted && !isWatching) {
                      handleWatchAd();
                    }
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 shadow-[0_4px_0_#145a32] border-t border-emerald-300 font-black text-xs text-white cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isDailyAdsCompleted ? 'Daily Limit Reached (Come Back Tomorrow)' : 'Watch Daily Ads Now'}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🎡 2. 549 DIAMOND JACKPOT WHEEL MODAL (Reference Logic)   */}
      {/* ========================================================= */}
      {activeMissionModal === 'jackpot_mission' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div 
            className="relative w-full max-w-sm rounded-[32px] p-4.5 border-2 border-white shadow-[0_25px_70px_rgba(0,100,200,0.3)] flex flex-col items-center text-[#192f52] select-none my-auto overflow-hidden bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.82), rgba(240, 248, 255, 0.90)), url(${bg549Img})`
            }}
          >
            
            {/* Close Button Top-Right */}
            {!isJackpotSpinning && (
              <button 
                onClick={() => setActiveMissionModal(null)}
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Title & Subtitle */}
            <h2 className="text-xl font-black text-[#192f52] tracking-tight text-center mt-1">
              549 Diamond
            </h2>
            <p className="text-[11px] font-bold text-[#567396] text-center mb-2.5">
              Reach 549.0 Diamonds to Claim to Main Balance!
            </p>

            {/* 🎯 EVENT POT PROGRESS CONTAINER */}
            <div className="w-full bg-white/95 border border-sky-150 rounded-2xl p-3 shadow-sm mb-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-[#192f52]">Event Pot:</span>
                  <span className="text-sm font-black text-sky-600">
                    {jackpotState.eventPot.toFixed(1)} <span className="text-xs text-slate-400">/ 549.0</span>
                  </span>
                  <img src={diamondImg} alt="Diamond" className="w-4 h-4 object-contain" />
                </div>

                <button
                  onClick={handleClaimJackpot}
                  disabled={jackpotState.eventPot < 549.0 || isJackpotSpinning}
                  className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all shadow-sm ${
                    jackpotState.eventPot >= 549.0
                      ? 'bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] text-white shadow-[0_2px_0_#145a32] animate-bounce-gentle cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  CLAIM
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-[#e2ecf5] rounded-full p-0.5 overflow-hidden shadow-inner mb-1.5">
                <div 
                  style={{
                    width: `${Math.min(100, (jackpotState.eventPot / 549.0) * 100)}%`
                  }}
                  className="h-full bg-gradient-to-r from-[#2ecc71] via-[#27ae60] to-[#1abc9c] rounded-full transition-all duration-500 shadow-xs"
                />
              </div>

              {/* Progress percentage & remaining */}
              <div className="text-[10px] font-bold text-[#7895b6] text-center">
                Progress: {((jackpotState.eventPot / 549.0) * 100).toFixed(1)}% (Need {Math.max(0, 549.0 - jackpotState.eventPot).toFixed(1)} more)
              </div>
            </div>

            {/* 🎡 AAA CASINO-GRADE FORTUNE WHEEL */}
            <div className="relative w-64 h-64 flex items-center justify-center my-2">
              
              {/* 3D Top Needle Pointer */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]">
                {/* Pointer Gold Cap */}
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600 border border-white shadow-xs" />
                {/* Pointer Arrow */}
                <div className="w-0 h-0 -mt-1 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[20px] border-t-rose-600" />
              </div>

              {/* Outer 3D Metallic Gold Ring with Casino Bulbs */}
              <div className="w-full h-full rounded-full p-2 bg-gradient-to-tr from-[#e6a117] via-[#fff3a8] to-[#b87806] border-2 border-[#fff7c2] shadow-[0_10px_30px_rgba(217,119,6,0.35)] flex items-center justify-center relative overflow-hidden">
                
                {/* 12 Outer Glowing Bulbs */}
                {[...Array(12)].map((_, idx) => {
                  const angle = idx * 30;
                  const rad = (angle * Math.PI) / 180;
                  const x = 50 + 46.5 * Math.cos(rad);
                  const y = 50 + 46.5 * Math.sin(rad);
                  return (
                    <div
                      key={idx}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-yellow-100 to-amber-300 border border-white/80 shadow-[0_0_6px_rgba(255,255,255,0.9)] z-10"
                    />
                  );
                })}

                {/* Inner Bezel Ring */}
                <div className="w-full h-full rounded-full p-1 bg-[#4a2306]/80 border border-amber-400/60 flex items-center justify-center overflow-hidden">
                  
                  {/* Rotating SVG Canvas */}
                  <div 
                    className="w-full h-full rounded-full transition-transform"
                    style={{ 
                      transform: `rotate(${jackpotRotation}deg)`, 
                      transition: isJackpotSpinning ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none' 
                    }}
                  >
                    <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-sm">
                      <defs>
                        {/* Radial & Linear Gradients for Slices */}
                        <linearGradient id="slice-purple" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#9333ea" />
                          <stop offset="100%" stopColor="#6b21a8" />
                        </linearGradient>
                        <linearGradient id="slice-orange" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#c2410c" />
                        </linearGradient>
                        <linearGradient id="slice-red" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#b91c1c" />
                        </linearGradient>
                        <linearGradient id="slice-blue" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="100%" stopColor="#0369a1" />
                        </linearGradient>
                        <linearGradient id="slice-amber" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#b45309" />
                        </linearGradient>
                        <filter id="svg-shadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.5" />
                        </filter>
                      </defs>

                      {/* 6 Sectors */}
                      {JACKPOT_SECTORS.map((sec, i) => {
                        const gradId = 
                          sec.id === 0 || sec.id === 3 ? 'url(#slice-purple)' :
                          sec.id === 1 ? 'url(#slice-orange)' :
                          sec.id === 2 ? 'url(#slice-red)' :
                          sec.id === 4 ? 'url(#slice-blue)' : 'url(#slice-amber)';

                        return (
                          <g key={sec.id} transform={`rotate(${i * 60 - 90} 100 100)`}>
                            {/* 60-degree slice path */}
                            <path 
                              d="M 100 100 L 181.4 53 A 94 94 0 0 1 181.4 147 Z" 
                              fill={gradId} 
                              stroke="#ffffff" 
                              strokeWidth="1.8" 
                            />

                            {/* Slice Content (PNG Graphics + Bold Radial Text) */}
                            <g transform="translate(142, 100) rotate(90)" filter="url(#svg-shadow)">
                              {sec.type === 'box' ? (
                                <g transform="scale(0.9)">
                                  {/* 3D Gift Box SVG Icon */}
                                  <rect x="-10" y="-19" width="20" height="14" rx="2.5" fill="#facc15" stroke="#ffffff" strokeWidth="0.8" />
                                  <rect x="-3" y="-19" width="6" height="14" fill="#e11d48" />
                                  <rect x="-11" y="-21" width="22" height="3.5" rx="1.5" fill="#e11d48" stroke="#ffffff" strokeWidth="0.5" />
                                  <circle cx="0" cy="-21" r="2.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.5" />
                                  <text 
                                    x="0" 
                                    y="8" 
                                    fill="#ffffff" 
                                    fontSize="11" 
                                    fontWeight="900" 
                                    textAnchor="middle" 
                                    fontFamily="system-ui, sans-serif"
                                    stroke="#1e1b4b"
                                    strokeWidth="0.5"
                                  >
                                    Box
                                  </text>
                                </g>
                              ) : sec.type === 'apple' ? (
                                <g transform="scale(0.9)">
                                  <image href={appleImg} x="-12" y="-23" width="24" height="24" />
                                  <text 
                                    x="0" 
                                    y="10" 
                                    fill="#ffffff" 
                                    fontSize="12" 
                                    fontWeight="900" 
                                    textAnchor="middle" 
                                    fontFamily="system-ui, sans-serif"
                                    stroke="#451a03"
                                    strokeWidth="0.6"
                                  >
                                    {sec.label}
                                  </text>
                                </g>
                              ) : (
                                <g transform="scale(0.9)">
                                  <image href={diamondImg} x="-12" y="-23" width="24" height="24" />
                                  <text 
                                    x="0" 
                                    y="10" 
                                    fill="#ffffff" 
                                    fontSize="12" 
                                    fontWeight="900" 
                                    textAnchor="middle" 
                                    fontFamily="system-ui, sans-serif"
                                    stroke="#082f49"
                                    strokeWidth="0.6"
                                  >
                                    {sec.label}
                                  </text>
                                </g>
                              )}
                            </g>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                </div>

                {/* 3D Center Golden SPIN Button */}
                <button
                  onClick={handleJackpotSpin}
                  disabled={isJackpotSpinning || jackpotState.spinsLeft <= 0}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-b from-amber-300 via-yellow-400 to-orange-500 border-[3px] border-white shadow-[0_4px_14px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center text-white font-black z-20 cursor-pointer active:scale-95 transition-all ${
                    isJackpotSpinning ? 'animate-pulse opacity-90' : 'hover:scale-105 hover:brightness-110'
                  }`}
                >
                  <span className="text-[12px] font-black tracking-wider uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                    {isJackpotSpinning ? '...' : 'SPIN'}
                  </span>
                </button>

              </div>
            </div>

            {/* 🎟️ SPINS LEFT PILL */}
            <div className="w-full flex items-center justify-center my-2">
              <div className="bg-[#eaf4fd] border border-sky-200/80 rounded-full px-4 py-1.5 text-xs font-black text-[#192f52] shadow-xs flex items-center gap-1.5">
                <span>Spins Left:</span>
                <span className="text-amber-600 font-black">{jackpotState.spinsLeft} Spins</span>
              </div>
            </div>

            {/* Result Toast */}
            {jackpotWonResult && !isJackpotSpinning && (
              <div className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-black py-2 px-3 rounded-xl text-center shadow-sm mb-2 animate-bounce-gentle">
                {jackpotWonResult.customMsg || `Won ${jackpotWonResult.name}!`}
              </div>
            )}

            {copiedRef && (
              <div className="w-full bg-amber-500 text-white text-[11px] font-black py-1.5 px-2 rounded-xl text-center shadow-sm mb-2 animate-pulse">
                Referral Link Copied! Share with friends for +1 Spin!
              </div>
            )}

            {/* 🔘 BOTTOM 2 ACTION BUTTONS (Close | +1 Spin) */}
            <div className="w-full grid grid-cols-2 gap-3 mt-1.5">
              
              {/* 1. Close Button */}
              <button
                onClick={() => setActiveMissionModal(null)}
                disabled={isJackpotSpinning}
                className="py-3 rounded-2xl bg-gradient-to-b from-rose-500 to-rose-600 hover:brightness-105 active:scale-95 text-white font-black text-xs shadow-[0_3px_0_#9f1239] transition-all cursor-pointer disabled:opacity-50"
              >
                Close
              </button>

              {/* 2. +1 Spin Button */}
              <button
                onClick={handleInviteForSpin}
                disabled={isJackpotSpinning}
                className="py-3 rounded-2xl bg-gradient-to-b from-amber-500 to-orange-500 hover:brightness-105 active:scale-95 text-white font-black text-xs shadow-[0_3px_0_#c2410c] transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <span>+1 Spin</span>
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
