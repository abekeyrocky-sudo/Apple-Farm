import React, { useState, useEffect } from 'react';
import SplashScreen from './pages/SplashScreen';
import HomePage from './pages/HomePage';
import MinePage from './pages/MinePage';
import TaskPage from './pages/TaskPage';
import WatchAdsPage from './pages/WatchAdsPage';
import InviteFriendsPage from './pages/InviteFriendsPage';
import WalletPage from './pages/WalletPage';
import ProfilePage from './pages/ProfilePage';
import GamePage from './pages/GamePage';
import WithdrawPage from './pages/WithdrawPage';
import AirdropPage from './pages/AirdropPage';
import LeaderboardPage from './pages/LeaderboardPage';
import StakingPage from './pages/StakingPage';
import MarketPage from './pages/MarketPage';
import CustomPopupModal from './components/CustomPopupModal';
import DailyRewardModal, { getDailyRewardStatus } from './components/DailyRewardModal';
import AutoBotClaimModal from './components/AutoBotClaimModal';
import { syncUserWithFirebase, harvestAppleInDB, updateUserInDB, sendWithdrawNotificationToTelegram, distributeReferralCommission, listenToUserCommissions, increment } from './firebase';
import { calculateLevel, LEVEL_TIERS } from './utils/levelSystem';
import confetti from 'canvas-confetti';
import { soundManager } from './utils/soundManager';
import { addTransaction } from './utils/transactionHistory';
import { verifyTelegramMembership, OFFICIAL_COMMUNITY_URL, OFFICIAL_PAYOUTS_URL } from './utils/telegramVerify';
import { calculateOfflineHarvest, updateLastActiveTime, saveAutoBotState } from './utils/autoBotManager';
import { initGigaOfferWall } from './utils/gigaOfferwall';
import { CloudAPI } from './services/api';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('home');
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState(false);
  const [isAutoBotModalOpen, setIsAutoBotModalOpen] = useState(false);
  const [offlineHarvest, setOfflineHarvest] = useState({ pendingApples: 0, offlineMinutes: 0 });
  const [user, setUser] = useState({
    id: null,
    name: 'Farmer',
    avatar: 'avatar-1',
    apples: 0,
    diamonds: 0.0,
    level: 1,
    energy: 100,
    maxEnergy: 100,
  });

  // গ্লোবাল কাস্টম পপআপ মডাল স্টেট
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'success', // 'success' | 'warn' | 'reward' | 'error' | 'info'
    title: '',
    message: '',
    rewardAmount: null,
    rewardType: 'apple',
    confirmText: 'Awesome',
    cancelText: null,
    onConfirm: null,
  });

  const showPopupModal = (opts) => {
    setModalConfig({
      isOpen: true,
      type: opts.type || 'success',
      title: opts.title || '',
      message: opts.message || '',
      rewardAmount: opts.rewardAmount !== undefined ? opts.rewardAmount : null,
      rewardType: opts.rewardType || 'apple',
      confirmText: opts.confirmText || 'Awesome',
      cancelText: opts.cancelText || null,
      hideClose: opts.hideClose || false,
      isMandatory: opts.isMandatory || false,
      onConfirm: opts.onConfirm || null,
    });
  };

  const closePopupModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    // 🎵 Sound & Background Music Listener
    soundManager.initUserGestureListeners();

    // টেলিগ্রাম ইনিশিয়ালাইজেশন ও ফুলস্ক্রিন এক্সপান্ড
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // Request Fullscreen for Telegram WebApp Bot API 7.7+ & 8.0+
      try {
        if (typeof tg.requestFullscreen === 'function') {
          tg.requestFullscreen();
        }
      } catch (err) {
        console.warn('Telegram requestFullscreen not supported or blocked:', err);
      }

      // Disable vertical swipes to prevent accidental closing on touch drag
      try {
        if (typeof tg.disableVerticalSwipes === 'function') {
          tg.disableVerticalSwipes();
        }
      } catch (err) {
        console.warn('disableVerticalSwipes error:', err);
      }

      // Enable closing confirmation to prevent accidental exit
      try {
        if (typeof tg.enableClosingConfirmation === 'function') {
          tg.enableClosingConfirmation();
        }
      } catch (err) {
        console.warn('enableClosingConfirmation error:', err);
      }

      // Set header color & background color to blend smoothly
      try {
        if (typeof tg.setHeaderColor === 'function') {
          tg.setHeaderColor('#5ec228');
        }
        if (typeof tg.setBackgroundColor === 'function') {
          tg.setBackgroundColor('#5ec228');
        }
      } catch (err) {
        console.warn('Theme color setup error:', err);
      }
      
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || 'Farmer';
        
        setUser((prev) => ({
          ...prev,
          id: tgUser.id,
          name: fullName,
          username: tgUser.username || '',
        }));

        syncUserWithFirebase(tgUser).then((data) => {
          if (data) {
            const calculatedLvl = calculateLevel(data.apples || 0);
            setUser((prev) => ({
              ...prev,
              ...data,
              level: calculatedLvl,
              name: fullName,
              avatar: data.avatar || prev.avatar || 'avatar-1',
            }));
          }
        });
      } else {
        // 🧪 ব্রাউজার বা লোকাল টেস্টিংয়ের জন্য ফ্যালব্যাক ইউজার
        const devUser = {
          id: 40281,
          first_name: 'Dev',
          last_name: 'Farmer',
          username: 'dev_farmer'
        };
        setUser((prev) => ({
          ...prev,
          id: devUser.id,
          name: 'Dev Farmer',
          username: 'dev_farmer',
        }));
        syncUserWithFirebase(devUser).then((data) => {
          if (data) {
            const calculatedLvl = calculateLevel(data.apples || 0);
            setUser((prev) => ({
              ...prev,
              ...data,
              level: calculatedLvl,
              name: 'Dev Farmer',
              avatar: data.avatar || prev.avatar || 'avatar-1',
            }));
          }
        });
      }
    }
  }, []);

  // ⚡ ইঞ্জিন ১ & ২ লাইভ লিসেনার (Real-Time Referral Commissions Engine)
  useEffect(() => {
    if (user?.id) {
      const unsub = listenToUserCommissions(user.id, (commData) => {
        setUser((prev) => ({
          ...prev,
          referralApplesCommission: commData.referralApplesCommission,
          referralDiamondsCommission: commData.referralDiamondsCommission,
          invitedFriends: commData.invitedFriends && commData.invitedFriends.length > 0 ? commData.invitedFriends : (prev.invitedFriends || []),
          referralsCount: commData.referralsCount !== undefined ? commData.referralsCount : (prev.referralsCount || 0)
        }));
      });
      return () => unsub();
    }
  }, [user?.id]);

  // 🎁 GigaPub Offerwall SDK ইনিশিয়ালাইজেশন ও রিওয়ার্ড হ্যান্ডলার
  useEffect(() => {
    if (user?.id) {
      initGigaOfferWall(user, ({ diamonds }) => {
        const added = Number(diamonds) || 1.0;
        setUser((prev) => ({
          ...prev,
          diamonds: Number(((prev.diamonds || 0) + added).toFixed(2)),
        }));
        if (user?.referredBy && added > 0) {
          distributeReferralCommission(user.referredBy, user.id, 'diamond', added, 'Offerwall Diamond Offer');
        }
        showPopupModal({
          type: 'reward',
          title: 'Offer Completed! 💎',
          message: `Congratulations! You received +${added.toFixed(1)} Diamonds from GigaPub Offerwall.`,
          rewardAmount: added.toFixed(1),
          rewardType: 'diamond',
          confirmText: 'Collect',
        });
      });
    }
  }, [user?.id, user?.referredBy]);

  // 📢 অফিসিয়াল টেলিগ্রাম কমিউনিটি ও পেমেন্ট প্রুফ চ্যানেল মেম্বারশিপ ব্যাকগ্রাউন্ড ভেরিফিকেশন ও বাধ্যতামূলক পপ-আপ
  const checkCommunityMembership = async () => {
    if (!user.id) return;
    
    // 🧪 Dev Mode / Localhost এ ম্যান্ডাটরি পপ-আপ বাইপাস করা যাতে নির্বিঘ্নে টেস্টিং করা যায়
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' || 
                  !window.Telegram?.WebApp?.initDataUnsafe?.user ||
                  user.id === 40281;
    if (isDev) {
      console.log('[Dev Mode] Skipping mandatory channel membership blocking modal');
      return;
    }

    try {
      // ১. কমিউনিটি চ্যানেল মেম্বারশিপ চেক
      const commRes = await verifyTelegramMembership(user.id, OFFICIAL_COMMUNITY_URL);
      if (!commRes.verified) {
        try {
          const key = `apple_farm_std_task_states_${user.id}`;
          const states = JSON.parse(localStorage.getItem(key) || '{}');
          states['task_community'] = 'Go';
          localStorage.setItem(key, JSON.stringify(states));
        } catch (e) {}

        showPopupModal({
          type: 'warn',
          title: 'Join Our Community',
          message: 'You must be a member of our official Telegram channel to play and earn rewards in Apple Farm.',
          confirmText: 'Join Channel',
          cancelText: null,
          hideClose: true,
          isMandatory: true,
          onConfirm: () => {
            try {
              if (window.Telegram?.WebApp?.openTelegramLink) {
                window.Telegram.WebApp.openTelegramLink(OFFICIAL_COMMUNITY_URL);
              } else if (window.Telegram?.WebApp?.openLink) {
                window.Telegram.WebApp.openLink(OFFICIAL_COMMUNITY_URL);
              } else {
                window.open(OFFICIAL_COMMUNITY_URL, '_blank');
              }
            } catch (e) {
              window.open(OFFICIAL_COMMUNITY_URL, '_blank');
            }

            setTimeout(() => {
              checkCommunityMembership();
            }, 3000);
          }
        });
        return;
      }

      // ২. পেমেন্ট প্রুফ চ্যানেল মেম্বারশিপ চেক
      const payoutRes = await verifyTelegramMembership(user.id, OFFICIAL_PAYOUTS_URL);
      if (!payoutRes.verified) {
        try {
          const key = `apple_farm_std_task_states_${user.id}`;
          const states = JSON.parse(localStorage.getItem(key) || '{}');
          states['task_payout_channel'] = 'Go';
          localStorage.setItem(key, JSON.stringify(states));
        } catch (e) {}

        showPopupModal({
          type: 'warn',
          title: 'Join Payment Channel',
          message: 'You must be a member of our official payment proofs channel to play and earn rewards in Apple Farm.',
          confirmText: 'Join Channel',
          cancelText: null,
          hideClose: true,
          isMandatory: true,
          onConfirm: () => {
            try {
              if (window.Telegram?.WebApp?.openTelegramLink) {
                window.Telegram.WebApp.openTelegramLink(OFFICIAL_PAYOUTS_URL);
              } else if (window.Telegram?.WebApp?.openLink) {
                window.Telegram.WebApp.openLink(OFFICIAL_PAYOUTS_URL);
              } else {
                window.open(OFFICIAL_PAYOUTS_URL, '_blank');
              }
            } catch (e) {
              window.open(OFFICIAL_PAYOUTS_URL, '_blank');
            }

            setTimeout(() => {
              checkCommunityMembership();
            }, 3000);
          }
        });
        return;
      }

      // উভয় চ্যানেলে জয়েন থাকলে ম্যান্ডাটরি পপআপ ক্লোজ
      setModalConfig((prev) => (prev.isMandatory ? { ...prev, isOpen: false } : prev));
    } catch (err) {
      console.warn('Auto channels verify check error:', err);
    }
  };

  useEffect(() => {
    if (!user.id) return;

    const timer = setTimeout(() => {
      checkCommunityMembership();
    }, 2000);

    const handleFocus = () => {
      checkCommunityMembership();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user.id]);

  const hasCheckedOfflineRef = React.useRef(false);
  const prevLevelRef = React.useRef(null);

  // 🏆 লেভেল আপ হলে স্বয়ংক্রিয় সেলিব্রেশন পপআপ ও কনফেটি
  useEffect(() => {
    if (isLoading || !user?.id) return;
    const currentLevel = calculateLevel(user?.apples || 0);

    // Initial level set on load
    if (prevLevelRef.current === null) {
      prevLevelRef.current = currentLevel;
      return;
    }

    // লেভেল বাড়লে সেলিব্রেশন মেসেজ
    if (currentLevel > prevLevelRef.current) {
      prevLevelRef.current = currentLevel;
      const tierInfo = LEVEL_TIERS[currentLevel - 1] || { name: 'Farmer' };

      soundManager.play('reward');
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.4 },
      });

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      showPopupModal({
        type: 'success',
        title: '🎉 Level Up!',
        message: `Congratulations! You leveled up to Level ${currentLevel} (${tierInfo.name})! Keep growing to unlock higher tier rewards.`,
        confirmText: 'Awesome!'
      });
    } else {
      prevLevelRef.current = currentLevel;
    }
  }, [user?.apples, user?.id, isLoading]);

  // 🎁 অ্যাপ ওপেন করলে ডেইলি রিওয়ার্ড ও অফলাইন অটো-বট পপ-আপ স্বয়ংক্রিয়ভাবে প্রদর্শন
  useEffect(() => {
    if (!isLoading && user?.id) {
      if (!hasCheckedOfflineRef.current) {
        hasCheckedOfflineRef.current = true;

        // ১. অটো-বট অফলাইন হার্ভেস্ট চেক
        const offlineData = calculateOfflineHarvest(user);
        if (offlineData.pendingApples > 0) {
          setOfflineHarvest(offlineData);
          setIsAutoBotModalOpen(true);
        } else {
          // ২. অফলাইন হার্ভেস্ট না থাকলে সরাসরি ডেইলী রিওয়ার্ড চেক
          const dailyStatus = getDailyRewardStatus(user.id);
          if (dailyStatus.canClaimToday) {
            const timer = setTimeout(() => {
              setIsDailyRewardOpen(true);
            }, 800);
            return () => clearTimeout(timer);
          }
        }
      }
    }
  }, [isLoading, user?.id]);

  // 🤖 অটো-বটের অফলাইন হার্ভেস্ট ক্লেইম হ্যান্ডলার
  const handleAutoBotHarvestClaim = (amount) => {
    setUser((prev) => {
      const newApples = (prev.apples || 0) + amount;
      return {
        ...prev,
        apples: newApples,
        level: calculateLevel(newApples)
      };
    });

    if (user.id) {
      updateUserInDB(user.id, { apples: (user.apples || 0) + amount });
      updateLastActiveTime(user.id);
      if (user?.referredBy && amount > 0) {
        distributeReferralCommission(user.referredBy, user.id, 'apple', amount, 'Auto-Bot Offline Harvest');
      }
    }

    addTransaction({
      userId: user.id,
      title: 'Auto-Farmer Bot Harvest',
      subtitle: '24/7 Offline Harvest',
      amount: `+${amount}`,
      currency: 'apple',
      type: 'earn',
      category: 'harvest',
      status: 'Completed'
    });

    // অফলাইন ক্লেইম শেষ হলে ডেইলী রিওয়ার্ড চেক
    const dailyStatus = getDailyRewardStatus(user.id);
    if (dailyStatus.canClaimToday) {
      setTimeout(() => {
        setIsDailyRewardOpen(true);
      }, 1200);
    }
  };

  const handleDailyRewardClaim = (reward) => {
    const isDiamond = reward.type === 'diamond';
    const amount = Number(reward.amount || 0);

    setUser((prev) => {
      const newApples = isDiamond ? prev.apples : prev.apples + amount;
      const newDiamonds = isDiamond ? prev.diamonds + amount : prev.diamonds;
      return {
        ...prev,
        apples: newApples,
        diamonds: newDiamonds,
        level: calculateLevel(newApples)
      };
    });

    if (user.id) {
      const updateData = isDiamond
        ? { diamonds: increment(amount) }
        : { apples: increment(amount) };
      updateUserInDB(user.id, updateData);
      if (user?.referredBy && amount > 0) {
        distributeReferralCommission(
          user.referredBy, 
          user.id, 
          isDiamond ? 'diamond' : 'apple', 
          amount, 
          `Daily Streak (Day ${reward.day})`
        );
      }
    }

    addTransaction({
      userId: user.id,
      title: `Daily Check-in (Day ${reward.day})`,
      subtitle: `Daily Streak (${reward.label})`,
      amount: `+${amount}`,
      currency: isDiamond ? 'diamond' : 'apple',
      type: 'earn',
      category: 'task',
      status: 'Completed'
    });
  };

  const handleUpdateAvatar = (newAvatarId) => {
    setUser((prev) => ({ ...prev, avatar: newAvatarId }));
    if (user.id) {
      updateUserInDB(user.id, { avatar: newAvatarId });
    }
    showPopupModal({
      type: 'success',
      title: 'Avatar Updated',
      message: 'Your farmer character has been changed successfully.',
      confirmText: 'Great'
    });
  };

  const harvestTapCountRef = React.useRef(0);
  const harvestTimerRef = React.useRef(null);

  const handleHarvestAction = () => {
    setUser((prev) => {
      const newApples = prev.apples + 1;
      const newLevel = calculateLevel(newApples);
      return { 
        ...prev, 
        apples: newApples,
        level: newLevel
      };
    });

    harvestTapCountRef.current += 1;
    if (harvestTimerRef.current) clearTimeout(harvestTimerRef.current);

    harvestTimerRef.current = setTimeout(() => {
      const count = harvestTapCountRef.current;
      harvestTapCountRef.current = 0;
      if (user?.id && count > 0) {
        harvestAppleInDB(user.id, count);
        if (user?.referredBy) {
          distributeReferralCommission(user.referredBy, user.id, 'apple', count, 'Tree Tap Harvest');
        }
      }
    }, 800);
  };

  const handleBonusWin = (amount, title = 'Bonus Claimed') => {
    const numAmount = Number(amount || 0);
    setUser((prev) => {
      const newApples = (prev.apples || 0) + numAmount;
      const newLevel = calculateLevel(newApples);
      return { 
        ...prev, 
        apples: newApples,
        level: newLevel
      };
    });
    if (user?.id) {
      updateUserInDB(user.id, { apples: (user.apples || 0) + numAmount });
      if (user?.referredBy && numAmount > 0) {
        distributeReferralCommission(user.referredBy, user.id, 'apple', numAmount, title);
      }
    }
    addTransaction({
      userId: user.id,
      title: title,
      subtitle: 'Apple Farm Reward',
      amount: `+${numAmount}`,
      currency: 'apple',
      type: 'earn',
      category: 'task',
      status: 'Completed'
    });
    showPopupModal({
      type: 'reward',
      title: title,
      message: `Congratulations. You received +${numAmount} Apples into your balance.`,
      rewardAmount: numAmount,
      rewardType: 'apple'
    });
  };

  const handleRewardClaim = (task) => {
    if (task.rewardAmount) {
      handleBonusWin(task.rewardAmount, task.title || 'Task Completed');
    }
  };

  const handleGameReward = (item) => {
    if (item.type === 'box') {
      const applesWon = Number(item.boxApples) || (Math.floor(Math.random() * 9 + 1) * 100);
      const diamondsWon = Number(item.boxDiamonds) || Number((Math.random() * 2.9 + 0.1).toFixed(1));

      const nextApples = (user.apples || 0) + applesWon;
      const nextDiamonds = Number(((user.diamonds || 0) + diamondsWon).toFixed(2));

      setUser((prev) => ({
        ...prev,
        apples: nextApples,
        diamonds: nextDiamonds,
        level: calculateLevel(nextApples)
      }));

      if (user?.id) {
        updateUserInDB(user.id, { apples: nextApples, diamonds: nextDiamonds });
        if (user?.referredBy) {
          if (applesWon > 0) distributeReferralCommission(user.referredBy, user.id, 'apple', applesWon, 'Mystery Box Apples');
          if (diamondsWon > 0) distributeReferralCommission(user.referredBy, user.id, 'diamond', diamondsWon, 'Mystery Box Diamonds');
        }
      }

      addTransaction({
        userId: user.id,
        title: '🎁 Mystery Box Prize',
        subtitle: `Lucky Wheel (+${applesWon} 🍎, +${diamondsWon} 💎)`,
        amount: `+${applesWon} 🍎, +${diamondsWon} 💎`,
        currency: 'apple',
        type: 'earn',
        category: 'spin',
        status: 'Completed'
      });

      showPopupModal({
        type: 'reward',
        title: '🎁 Mystery Box Opened!',
        message: `Congratulations! You unlocked +${applesWon.toLocaleString()} Apples and +${diamondsWon} Diamonds from the Mystery Box.`,
        rewardAmount: applesWon,
        rewardType: 'apple'
      });
      return;
    }

    const value = parseFloat(item.label) || 0;
    if (item.type === 'diamond') {
      const nextDiamonds = Number(((user.diamonds || 0) + value).toFixed(2));
      setUser((prev) => ({ ...prev, diamonds: nextDiamonds }));
      if (user?.id) {
        updateUserInDB(user.id, { diamonds: nextDiamonds });
        if (user?.referredBy && value > 0) {
          distributeReferralCommission(user.referredBy, user.id, 'diamond', value, 'Lucky Wheel Diamonds');
        }
      }
      addTransaction({
        userId: user.id,
        title: 'Lucky Wheel Spin',
        subtitle: 'Wheel Jackpot Prize',
        amount: `+${value}`,
        currency: 'diamond',
        type: 'earn',
        category: 'spin',
        status: 'Completed'
      });
      showPopupModal({
        type: 'reward',
        title: 'Lucky Spin Winner',
        message: `Jackpot. You won ${value} Diamonds on the wheel.`,
        rewardAmount: value,
        rewardType: 'diamond'
      });
    } else {
      const nextApples = (user.apples || 0) + value;
      setUser((prev) => {
        const newApples = (prev.apples || 0) + value;
        return { ...prev, apples: newApples, level: calculateLevel(newApples) };
      });
      if (user?.id) {
        updateUserInDB(user.id, { apples: nextApples });
        if (user?.referredBy && value > 0) {
          distributeReferralCommission(user.referredBy, user.id, 'apple', value, 'Lucky Wheel Apples');
        }
      }
      addTransaction({
        userId: user.id,
        title: 'Lucky Wheel Spin',
        subtitle: 'Wheel Prize',
        amount: `+${value}`,
        currency: 'apple',
        type: 'earn',
        category: 'spin',
        status: 'Completed'
      });
      showPopupModal({
        type: 'reward',
        title: 'Lucky Spin Winner',
        message: `Jackpot. You won ${value} Apples on the wheel.`,
        rewardAmount: value,
        rewardType: 'apple'
      });
    }
  };

  const handleWithdrawDeduct = async (data) => {
    const appleDeduct = Number(data.amount || 0);
    const diamondDeduct = Number(data.diamonds || 0);
    const isGram = !!data.gramAmount;
    const nextGramStep = data.nextGramStep !== undefined ? data.nextGramStep : (user.gramWithdrawStep || 0);

    setUser((prev) => ({
      ...prev,
      apples: Math.max(0, prev.apples - appleDeduct),
      diamonds: Math.max(0, prev.diamonds - diamondDeduct),
      gramWithdrawStep: isGram ? nextGramStep : (prev.gramWithdrawStep || 0),
      level: calculateLevel(Math.max(0, prev.apples - appleDeduct))
    }));

    if (user.id) {
      const updatePayload = {
        apples: Math.max(0, (user.apples || 0) - appleDeduct),
        diamonds: Math.max(0, (user.diamonds || 0) - diamondDeduct)
      };
      if (isGram) {
        updatePayload.gramWithdrawStep = nextGramStep;
      }
      updateUserInDB(user.id, updatePayload);
      addTransaction({
        userId: user.id,
        title: isGram ? `${data.gramAmount} GRAM Payout` : 'Withdrawal Request',
        subtitle: data.account ? `To: ${data.account.slice(0, 8)}...` : `${data.method} Payout`,
        amount: `-${appleDeduct}`,
        currency: 'apple',
        type: 'spend',
        category: 'withdraw',
        status: isGram ? 'Completed' : 'Pending'
      });

      // 🔔 বট থেকে ইউজারকে ইনস্ট্যান্ট টেলিগ্রাম নোটিফিকেশন মেসেজ পাঠানো
      sendWithdrawNotificationToTelegram(user.id, data);
    }

    // ⚡ Trigger Cloud Function automated on-chain TON payout
    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      fetch('https://api-duztzw2gwa-uc.a.run.app/api/withdraw/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify({
          user: {
            id: user.id || 40281,
            name: user.name || 'Farmer',
            username: user.username || ''
          },
          amount: appleDeduct,
          diamonds: diamondDeduct,
          method: data.method,
          accountNumber: data.account,
          gramAmount: data.gramAmount || null
        })
      })
      .then(res => res.json())
      .then(resData => console.log('[Withdrawal Backend Broadcast Result]:', resData))
      .catch(apiErr => console.error('[Withdrawal API Error]:', apiErr));
    } catch (e) {
      console.error('[Withdrawal Trigger Exception]:', e);
    }

    showPopupModal({
      type: 'success',
      title: 'Withdrawal Submitted',
      message: isGram 
        ? `Your request for ${data.gramAmount} GRAM (${appleDeduct} Apples & ${diamondDeduct} Diamonds) has been sent to TON network.`
        : `Your withdrawal request of ${appleDeduct} Apples has been placed successfully via ${data.method}.`,
      confirmText: 'Done'
    });
  };

  const handleUpdateUserBalance = (payload) => {
    if (!payload) return;
    setUser((prev) => {
      let nextApples = prev.apples || 0;
      let nextDiamonds = prev.diamonds || 0;

      if (payload.apples !== undefined) {
        // যদি নেগেটিভ হয় তবে ডেল্টা বিয়োগ, আর পজিটিভ হলে চেক
        if (typeof payload.apples === 'number' && payload.isDelta) {
          nextApples = Math.max(0, (prev.apples || 0) + payload.apples);
        } else {
          nextApples = Math.max(0, payload.apples);
        }
      }

      if (payload.diamonds !== undefined) {
        if (typeof payload.diamonds === 'number' && payload.isDelta) {
          nextDiamonds = Math.max(0, (prev.diamonds || 0) + payload.diamonds);
        } else {
          nextDiamonds = Math.max(0, payload.diamonds);
        }
      }

      const updated = {
        ...prev,
        ...payload,
        apples: nextApples,
        diamonds: Number(nextDiamonds.toFixed(2)),
        level: calculateLevel(nextApples)
      };
      delete updated.isDelta;

      if (user?.id) {
        const dbFields = { ...payload };
        delete dbFields.isDelta;
        if (payload.apples !== undefined) dbFields.apples = nextApples;
        if (payload.diamonds !== undefined) dbFields.diamonds = Number(nextDiamonds.toFixed(2));
        updateUserInDB(user.id, dbFields);
      }

      return updated;
    });
  };

  const handleClaimReferReward = async (mission) => {
    const applesReward = mission.apples || 0;
    const diamondsReward = mission.diamonds || 0;
    
    // Optimistic UI update
    setUser((prev) => {
      const newApples = prev.apples + applesReward;
      const newDiamonds = prev.diamonds + diamondsReward;
      const newClaimed = { ...(prev.claimedReferMissions || {}), [mission.id]: true };
      return {
        ...prev,
        apples: newApples,
        diamonds: newDiamonds,
        claimedReferMissions: newClaimed,
        level: calculateLevel(newApples)
      };
    });

    if (user.id) {
      // 🛡️ Secure Cloud Functions Backend Claim (HMAC signature + Server-side DB count validation)
      try {
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || { id: user.id };
        const res = await CloudAPI.claimReferralMission(tgUser, mission.id);
        if (res && res.apples !== undefined) {
          setUser((prev) => ({
            ...prev,
            apples: res.apples,
            diamonds: res.diamonds !== undefined ? res.diamonds : prev.diamonds,
            level: res.level || prev.level
          }));
        }
      } catch (cloudErr) {
        console.warn('Backend claim fallback:', cloudErr.message);
        // Fallback to client Firestore update if Cloud Functions is unreachable
        updateUserInDB(user.id, {
          [`claimedReferMissions.${mission.id}`]: true,
          apples: increment(applesReward),
          diamonds: increment(diamondsReward)
        });
        addTransaction({
          userId: user.id,
          title: 'Referral Milestone',
          subtitle: mission.title,
          amount: `+${applesReward.toLocaleString()}`,
          currency: 'apple',
          type: 'earn',
          category: 'invite',
          status: 'Completed'
        });
      }
    }

    showPopupModal({
      type: 'reward',
      title: 'Mission Reward Claimed',
      message: `You earned +${applesReward} Apples${diamondsReward > 0 ? ` & +${diamondsReward} Diamonds` : ''} for ${mission.title}.`,
      rewardAmount: applesReward,
      rewardType: 'apple'
    });
  };

  const handleClaimCommission = (type, amount) => {
    if (amount <= 0) return;
    if (type === 'apple') {
      const nextApples = (user.apples || 0) + amount;
      const nextComm = Math.max(0, (user.referralApplesCommission || 0) - amount);
      setUser((prev) => ({
        ...prev,
        apples: nextApples,
        referralApplesCommission: nextComm,
        level: calculateLevel(nextApples)
      }));
      if (user?.id) {
        updateUserInDB(user.id, {
          apples: nextApples,
          referralApplesCommission: nextComm
        });
      }
      addTransaction({
        userId: user.id,
        title: 'Referral Commission',
        subtitle: '10% Lifetime Harvest Commission',
        amount: `+${amount}`,
        currency: 'apple',
        type: 'earn',
        category: 'invite',
        status: 'Completed'
      });
      showPopupModal({
        type: 'reward',
        title: 'Commission Claimed!',
        message: `Awesome! You claimed +${amount.toLocaleString()} Apples referral commission.`,
        rewardAmount: amount,
        rewardType: 'apple'
      });
    } else if (type === 'diamond') {
      const nextDiamonds = Number(((user.diamonds || 0) + amount).toFixed(2));
      const nextComm = Math.max(0, Number(((user.referralDiamondsCommission || 0) - amount).toFixed(2)));
      setUser((prev) => ({
        ...prev,
        diamonds: nextDiamonds,
        referralDiamondsCommission: nextComm
      }));
      if (user?.id) {
        updateUserInDB(user.id, {
          diamonds: nextDiamonds,
          referralDiamondsCommission: nextComm
        });
      }
      addTransaction({
        userId: user.id,
        title: 'Referral Commission',
        subtitle: '10% Lifetime Diamonds Commission',
        amount: `+${amount}`,
        currency: 'diamond',
        type: 'earn',
        category: 'invite',
        status: 'Completed'
      });
      showPopupModal({
        type: 'reward',
        title: 'Commission Claimed!',
        message: `Awesome! You claimed +${amount} Diamonds referral commission.`,
        rewardAmount: amount,
        rewardType: 'diamond'
      });
    }
  };

  const [taskInitialTab, setTaskInitialTab] = useState('All');
  const [marketInitialTab, setMarketInitialTab] = useState('Auto-Bot');

  const handleNavigate = (tab, options = {}) => {
    setCurrentTab(tab);
    if (tab === 'task') {
      setTaskInitialTab(options?.taskTab || 'All');
    }
    if (tab === 'market') {
      setMarketInitialTab(options?.marketTab || 'Auto-Bot');
    }
  };

  // 1. Initial Cartoon Splash / Loading Screen
  if (isLoading) {
    return <SplashScreen onLoaded={() => setIsLoading(false)} />;
  }

  // Active Screen Rendering
  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomePage 
            user={user}
            onHarvest={handleHarvestAction}
            onNavigate={handleNavigate}
            onWithdraw={() => setCurrentTab('withdraw')}
            onOpenProfile={() => setCurrentTab('profile')}
            onShowPopup={showPopupModal}
          />
        );
      case 'mine':
        return (
          <MinePage 
            user={user}
            onHarvest={handleHarvestAction}
            onWithdraw={() => setCurrentTab('withdraw')}
            onNavigate={handleNavigate}
            onOpenProfile={() => setCurrentTab('profile')}
            onShowPopup={showPopupModal}
          />
        );
      case 'task':
        return (
          <TaskPage 
            user={user}
            initialTab={taskInitialTab}
            onBack={() => setCurrentTab('home')}
            onNavigate={handleNavigate}
            onOpenDailyReward={() => setIsDailyRewardOpen(true)}
            onRewardClaim={handleRewardClaim}
            onUpdateUser={(updatedData) => {
              setUser((prev) => ({ ...prev, ...updatedData }));
              if (user.id) updateUserInDB(user.id, updatedData);
            }}
            onShowPopup={showPopupModal}
          />
        );
      case 'game':
        return (
          <GamePage 
            user={user}
            onNavigate={handleNavigate}
            onWinReward={handleGameReward}
            onUpdateUser={(updatedData) => {
              setUser((prev) => ({ ...prev, ...updatedData }));
              if (user.id) updateUserInDB(user.id, updatedData);
            }}
            onShowPopup={showPopupModal}
          />
        );
      case 'airdrop':
        return (
          <AirdropPage 
            user={user}
            onBack={() => setCurrentTab('home')}
            onNavigate={handleNavigate}
            onUpdateUser={(updatedData) => {
              setUser((prev) => ({ ...prev, ...updatedData }));
              if (user.id) updateUserInDB(user.id, updatedData);
            }}
            onShowPopup={showPopupModal}
          />
        );
      case 'wallet':
        return (
          <WalletPage 
            user={user}
            onBack={() => setCurrentTab('home')}
            onNavigate={handleNavigate}
            onShowPopup={showPopupModal}
          />
        );
      case 'profile':
        return (
          <ProfilePage 
            user={user}
            onBack={() => setCurrentTab('home')}
            onNavigate={handleNavigate}
            onLogout={() => setCurrentTab('home')}
            onRedeemBonus={(amount) => handleBonusWin(amount, 'Code Redeemed!')}
            onUpdateAvatar={handleUpdateAvatar}
            onShowPopup={showPopupModal}
          />
        );
      case 'ads':
        return (
          <WatchAdsPage 
            user={user}
            onBack={() => setCurrentTab('home')}
            onRewardEarned={(amount) => handleBonusWin(amount, 'Ad Reward Claimed!')}
            onWinReward={handleGameReward}
            onShowPopup={showPopupModal}
          />
        );
      case 'invite':
        return (
          <InviteFriendsPage 
            user={user}
            onBack={() => setCurrentTab('home')}
            onClaimReward={handleClaimReferReward}
            onClaimCommission={handleClaimCommission}
            onShowPopup={showPopupModal}
          />
        );
      case 'withdraw':
        return (
          <WithdrawPage 
            user={user}
            onBack={() => setCurrentTab('home')}
            onWithdrawSubmit={handleWithdrawDeduct}
            onShowPopup={showPopupModal}
          />
        );
      case 'leaderboard':
        return (
          <LeaderboardPage 
            user={user}
            onBack={() => setCurrentTab('home')}
            onNavigate={handleNavigate}
            onShowPopup={showPopupModal}
          />
        );
      case 'staking':
        return (
          <StakingPage 
            user={user}
            onBack={() => setCurrentTab('wallet')}
            onNavigate={handleNavigate}
            onUpdateUserBalance={handleUpdateUserBalance}
            onShowPopup={showPopupModal}
          />
        );
      case 'market':
        return (
          <MarketPage 
            user={user}
            initialTab={marketInitialTab}
            onBack={() => setCurrentTab('home')}
            onNavigate={handleNavigate}
            onUpdateUserBalance={handleUpdateUserBalance}
            onShowPopup={showPopupModal}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderCurrentPage()}
      
      {/* 🎁 ৭-দিনের ডেইলী চেক-ইন রিওয়ার্ড পপ-আপ মডাল */}
      <DailyRewardModal
        isOpen={isDailyRewardOpen}
        onClose={() => setIsDailyRewardOpen(false)}
        onClaimReward={handleDailyRewardClaim}
        user={user}
      />

      {/* 🤖 অটো-হার্ভেস্ট বট অফলাইন রিওয়ার্ড ক্লেইম মডাল */}
      <AutoBotClaimModal
        isOpen={isAutoBotModalOpen}
        onClose={() => {
          setIsAutoBotModalOpen(false);
          if (user?.id) {
            const dailyStatus = getDailyRewardStatus(user.id);
            if (dailyStatus.canClaimToday) {
              setTimeout(() => {
                setIsDailyRewardOpen(true);
              }, 600);
            }
          }
        }}
        offlineHarvest={offlineHarvest}
        onClaim={handleAutoBotHarvestClaim}
      />

      {/* গ্লোবাল কাস্টম ভেক্টর পপআপ মডাল */}
      <CustomPopupModal 
        {...modalConfig} 
        onClose={closePopupModal} 
      />
    </>
  );
}

