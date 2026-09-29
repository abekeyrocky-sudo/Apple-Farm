import React, { useState, useEffect, useRef } from 'react';
import { 
  UserCheck, 
  UserPlus, 
  Gift, 
  Play, 
  CalendarCheck, 
  Gamepad2, 
  Send, 
  Globe, 
  Bot, 
  Users, 
  PlusCircle, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  Flame, 
  ShieldCheck, 
  Coins, 
  Loader2, 
  X,
  ArrowRight,
  RotateCw,
  Crown,
  Wallet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TonConnectUI } from '@tonconnect/ui';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import gramImg from '../../assets/gram.png';
import BottomNav from '../components/BottomNav';
import CustomTitleBar from '../components/CustomTitleBar';
import { soundManager } from '../utils/soundManager';
import { addTransaction } from '../utils/transactionHistory';
import { getPartnerTasksFromDB, savePartnerTaskToDB, incrementPartnerTaskJoinedInDB } from '../firebase';
import { verifyTelegramMembership, OFFICIAL_COMMUNITY_URL } from '../utils/telegramVerify';
import { getStoredJson, setStoredJson } from '../utils/userStorage';
import { getDailyRewardStatus } from '../components/DailyRewardModal';
import { openGigaOfferWall } from '../utils/gigaOfferwall';

// X / Twitter SVG Component
const TwitterIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// YouTube SVG Component
const YoutubeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

// 💎 Master Wallet Address (যেখানে বিজ্ঞাপনের ১০% ফি + বাজেট জমা হবে)
const MASTER_WALLET_ADDRESS = 'UQC576HcthVEI8QtkfQ80iHPDz1iz8VfEWsZPi3c3ihnrN5c';

// প্ল্যাটফর্ম ক্যাটাগরি কনফিগারেশন
const PLATFORM_TYPES = [
  { id: 'tg_channel', label: 'TG Channel', icon: Send },
  { id: 'tg_group', label: 'TG Group', icon: Users },
  { id: 'tg_bot', label: 'TG Bot', icon: Bot },
  { id: 'youtube', label: 'YouTube', icon: YoutubeIcon },
];

// 🎁 8টি পেরিমিটার বক্সের ক্যাশব্যাক আইটেম (Faded Wheel)
const CASHBACK_WHEEL_ITEMS = [
  { id: 0, percentage: 150, label: '150%', title: '150% Cashback', type: 'cashback', bg: 'from-amber-400/30 via-yellow-400/30 to-amber-500/40', border: 'border-amber-400', badge: 'Jackpot', badgeBg: 'bg-amber-500' },
  { id: 1, percentage: 50, label: '50%', title: '50% Cashback', type: 'cashback', bg: 'from-emerald-500/25 to-green-600/30', border: 'border-emerald-400', badge: 'Rare', badgeBg: 'bg-emerald-600' },
  { id: 2, percentage: 0, label: '0%', title: 'Better Luck', type: 'empty', bg: 'from-slate-200/50 to-slate-300/40', border: 'border-slate-300' },
  { id: 3, percentage: 25, label: '25%', title: '25% Cashback', type: 'cashback', bg: 'from-sky-500/25 to-blue-600/30', border: 'border-sky-400' },
  { id: 4, percentage: 15, label: '15%', title: '15% Cashback', type: 'cashback', bg: 'from-indigo-500/25 to-purple-600/30', border: 'border-indigo-400' },
  { id: 5, percentage: 10, label: '10%', title: '10% Cashback', type: 'cashback', bg: 'from-orange-500/25 to-amber-600/30', border: 'border-orange-400' },
  { id: 6, percentage: 5, label: '5%', title: '5% Cashback', type: 'cashback', bg: 'from-teal-500/25 to-emerald-600/30', border: 'border-teal-400' },
  { id: 7, percentage: 0, label: '0%', title: 'Better Luck', type: 'empty', bg: 'from-slate-200/50 to-slate-300/40', border: 'border-slate-300' },
];

// প্রতি 0.005 GRAM বিডে ১টি ডায়মন্ড (0.005 GRAM -> +1 💎, 0.010 GRAM -> +2 💎)
export const calculateRewardDiamonds = (bidPerMember) => {
  const bid = parseFloat(bidPerMember) || 0;
  return Math.max(1, Math.floor((bid + 0.0001) / 0.005));
};

export default function TaskPage({ 
  user = { apples: 0, diamonds: 0.0, level: 1, name: 'Farmer' }, 
  initialTab = 'All',
  onBack, 
  onNavigate, 
  onOpenDailyReward,
  onRewardClaim, 
  onUpdateUser,
  onShowPopup 
}) {
  // ৪টি মূল ট্যাব: 'All' | 'Daily' | 'Special' | 'Partner'
  const [activeTab, setActiveTab] = useState(initialTab || 'All');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Partner ট্যাবের ভিতরের সাব-ট্যাব: 'explore' | 'my_tasks'
  const [partnerSubTab, setPartnerSubTab] = useState('explore');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [verifyingTaskId, setVerifyingTaskId] = useState(null);

  // 🎡 Cashback Faded Wheel State
  const [isCashbackWheelOpen, setIsCashbackWheelOpen] = useState(false);
  const [cashbackPaidAmount, setCashbackPaidAmount] = useState(0);
  const [isCashbackSpinning, setIsCashbackSpinning] = useState(false);
  const [cashbackActiveHighlight, setCashbackActiveHighlight] = useState(0);
  const [cashbackWonPrize, setCashbackWonPrize] = useState(null);
  const [isCashbackClaimed, setIsCashbackClaimed] = useState(false);
  const cashbackSpinTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (cashbackSpinTimerRef.current) {
        clearTimeout(cashbackSpinTimerRef.current);
      }
    };
  }, []);

  // TonConnect UI State
  const [tonConnectUI, setTonConnectUI] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // 'Create Promotion Task' ফর্ম স্টেট
  const [postForm, setPostForm] = useState({
    platform: 'tg_channel',
    title: '',
    link: '',
    targetMembers: 100, // min 50
    bidPerMember: '0.01', // default 0.01 GRAM, can be lowered to min 0.005
  });

  // স্ট্যান্ডার্ড টাস্ক তালিকা (All, Daily, Special)
  const [standardTasks, setStandardTasks] = useState(() => {
    const defaultTasks = [
      {
        id: 'task_offerwall',
        title: 'Offerwall Tasks',
        reward: 'Up to 10 Diamonds',
        rewardAmount: 10,
        rewardCurrency: 'diamond',
        type: 'Daily',
        status: 'Go',
        iconBg: 'bg-indigo-50 border-indigo-200',
        actionUrl: 'offerwall',
        icon: (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>
        ),
      },
      {
        id: 'task_1',
        title: 'Watch Ads',
        reward: 'Up to 50 Diamonds',
        rewardAmount: 50,
        rewardCurrency: 'diamond',
        type: 'Daily',
        status: 'Go',
        iconBg: 'bg-blue-50 border-blue-200',
        actionUrl: 'ads',
        icon: (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-inner">
            <Play className="w-5 h-5 fill-white stroke-none" />
          </div>
        ),
      },
      {
        id: 'task_community',
        title: 'Join Community',
        reward: '+500 Apples',
        rewardAmount: 500,
        rewardCurrency: 'apple',
        type: 'Special',
        status: 'Go', // 'Go' | 'Verify' | 'Claim' | 'Claimed'
        iconBg: 'bg-sky-50 border-sky-200',
        actionUrl: OFFICIAL_COMMUNITY_URL,
        icon: (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white shadow-inner">
            <Send className="w-5 h-5 fill-white stroke-none" />
          </div>
        ),
      },
      {
        id: 'task_payout_channel',
        title: 'Join Payment Channel',
        reward: '+500 Apples',
        rewardAmount: 500,
        rewardCurrency: 'apple',
        type: 'Special',
        status: 'Go', // 'Go' | 'Verify' | 'Claim' | 'Claimed'
        iconBg: 'bg-emerald-50 border-emerald-200',
        actionUrl: 'https://t.me/AppleFarmPayouts',
        icon: (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white shadow-inner">
            <Send className="w-5 h-5 fill-white stroke-none" />
          </div>
        ),
      },
      {
        id: 'task_2',
        title: 'Complete Profile',
        reward: '+100 Apples',
        rewardAmount: 100,
        rewardCurrency: 'apple',
        type: 'Special',
        status: 'Go',
        iconBg: 'bg-sky-50 border-sky-100',
        actionUrl: 'profile',
        icon: (
          <div className="w-10 h-10 rounded-full border-2 border-amber-300 bg-amber-100 flex items-center justify-center text-amber-700 shadow-sm">
            <UserCheck className="w-5 h-5 stroke-amber-700 stroke-[2.3]" />
          </div>
        ),
      },
      {
        id: 'task_3',
        title: 'Invite 1 Friend',
        reward: '+100 Apples',
        rewardAmount: 100,
        rewardCurrency: 'apple',
        type: 'Special',
        status: 'Go',
        iconBg: 'bg-indigo-50 border-indigo-100',
        actionUrl: 'invite',
        icon: (
          <div className="w-10 h-10 rounded-full border-2 border-sky-300 bg-sky-100 flex items-center justify-center text-sky-700 shadow-sm">
            <UserPlus className="w-5 h-5 stroke-sky-700 stroke-[2.3]" />
          </div>
        ),
      },
      {
        id: 'task_4',
        title: 'Redeem Code',
        reward: '+500 Apples',
        rewardAmount: 500,
        rewardCurrency: 'apple',
        type: 'Special',
        status: 'Go',
        iconBg: 'bg-amber-50 border-amber-100',
        actionUrl: 'profile',
        icon: (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-white shadow-inner border border-amber-200">
            <Gift className="w-5 h-5 stroke-white stroke-[2.3]" />
          </div>
        ),
      },
      {
        id: 'task_5',
        title: 'Play Mini Game',
        reward: '+200 Apples',
        rewardAmount: 200,
        rewardCurrency: 'apple',
        type: 'Daily',
        status: 'Go',
        iconBg: 'bg-emerald-50 border-emerald-100',
        actionUrl: 'game',
        icon: (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-green-500 flex items-center justify-center text-white shadow-sm">
            <Gamepad2 className="w-5 h-5 stroke-white" />
          </div>
        ),
      },
      {
        id: 'task_6',
        title: 'Daily Check-in',
        reward: '7-Day Bonus',
        rewardAmount: 500,
        rewardCurrency: 'special',
        type: 'Daily',
        status: 'Go',
        iconBg: 'bg-orange-50 border-orange-100',
        actionUrl: 'daily_reward',
        icon: (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-sm border border-amber-300">
            <CalendarCheck className="w-5 h-5 stroke-white" />
          </div>
        ),
      },
      {
        id: 'task_monetag_pop',
        title: 'Daily Bonus Ad',
        reward: '+100 Apples',
        rewardAmount: 100,
        rewardCurrency: 'apple',
        type: 'Daily',
        status: 'Go',
        iconBg: 'bg-rose-50 border-rose-200',
        actionUrl: 'monetag_pop',
        icon: (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-200 fill-amber-200" />
          </div>
        ),
      },
    ];

    const uid = user?.id;
    const dailyStatus = getDailyRewardStatus(uid);
    const todayStr = new Date().toDateString();
    const isPopClaimedToday = getStoredJson(`apple_farm_daily_pop_${todayStr}`, uid, false);
    const savedStates = getStoredJson('apple_farm_std_task_states', uid, {});
    return defaultTasks.map(t => {
      let status = savedStates[t.id] || t.status;
      if (t.id === 'task_1') {
        status = 'Go';
      }
      if (t.id === 'task_6') {
        status = dailyStatus.canClaimToday ? 'Go' : 'Claimed';
      }
      if (t.id === 'task_monetag_pop') {
        status = isPopClaimedToday ? 'Claimed' : 'Go';
      }
      return { ...t, status };
    });
  });

  // রিয়েল পার্টনার টাস্ক তালিকা
  const [partnerTasks, setPartnerTasks] = useState(() => {
    try {
      const uid = user?.id;
      const saved = getStoredJson('apple_farm_partner_tasks_real', uid, null);
      const savedStates = getStoredJson('apple_farm_partner_task_states', uid, {});
      if (saved && Array.isArray(saved)) {
        return saved.map(t => ({
          ...t,
          status: savedStates[t.id] || t.status || 'Go',
          joinedCount: Number(t.joinedCount) || 0,
          targetMembers: Number(t.targetMembers) || 50
        }));
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  // ইউজার পরিবর্তন হলে বা ওপেন হলে স্ট্যান্ডার্ড টাস্ক ও ডেইল চেক-ইন রিফ্রেশ
  useEffect(() => {
    if (!user?.id) return;
    const uid = user.id;
    const dailyStatus = getDailyRewardStatus(uid);
    const todayStr = new Date().toDateString();
    const isPopClaimedToday = getStoredJson(`apple_farm_daily_pop_${todayStr}`, uid, false);
    const savedStates = getStoredJson('apple_farm_std_task_states', uid, {});
    setStandardTasks(prev => prev.map(t => {
      let status = savedStates[t.id] || t.status;
      if (t.id === 'task_1') {
        status = 'Go';
      }
      if (t.id === 'task_6') {
        status = dailyStatus.canClaimToday ? 'Go' : 'Claimed';
      }
      if (t.id === 'task_monetag_pop') {
        status = isPopClaimedToday ? 'Claimed' : 'Go';
      }
      return { ...t, status };
    }));
  }, [user?.id]);

  // ফায়ারস্টোর ডাটাবেস থেকে রিয়েল লাইভ পার্টনার টাস্ক লোড
  useEffect(() => {
    try {
      localStorage.removeItem('apple_farm_partner_tasks');
      localStorage.removeItem('partner_tasks');
    } catch (e) {}

    getPartnerTasksFromDB().then((dbTasks) => {
      if (dbTasks) {
        let savedStates = {};
        try {
          savedStates = JSON.parse(localStorage.getItem('apple_farm_partner_task_states') || '{}');
        } catch (e) {}

        setPartnerTasks(prev => {
          const merged = dbTasks.map(dbT => {
            const local = prev.find(p => p.id === dbT.id);
            const status = savedStates[dbT.id] || local?.status || 'Go';
            const joinedCount = Math.max(
              Number(dbT.joinedCount) || 0,
              (status === 'Claimed' || local?.status === 'Claimed') ? (Number(local?.joinedCount) || Number(dbT.joinedCount) || 0) : (Number(dbT.joinedCount) || 0)
            );
            return {
              ...dbT,
              joinedCount,
              targetMembers: Number(dbT.targetMembers) || 50,
              status,
              isMyTask: (user?.id && dbT.creatorId === user.id) || local?.isMyTask || false
            };
          });
          return merged;
        });
      }
    }).catch(err => {
      console.warn('Real partner tasks load:', err);
    });
  }, [user?.id]);

  // TonConnect ইনিশিয়ালাইজেশন
  useEffect(() => {
    try {
      const manifest = `${window.location.origin}/tonconnect-manifest.json`;
      const tc = window.__tonConnectUI || new TonConnectUI({ manifestUrl: manifest });
      window.__tonConnectUI = tc;
      setTonConnectUI(tc);

      if (tc.wallet) {
        setWalletConnected(true);
      }

      const unsubscribe = tc.onStatusChange((wallet) => {
        setWalletConnected(!!wallet);
      });

      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    } catch (e) {
      console.warn('TonConnect init in TaskPage:', e);
    }
  }, []);

  // সিঙ্ক: যদি এয়ারড্রপ পেজ বা অন্য কোথা থেকে কমিউনিটি জয়েন ভেরিফাই হয়ে থাকে
  useEffect(() => {
    if (user?.airdropTasks?.joinTg || user?.communityJoined) {
      setStandardTasks(prev => {
        let changed = false;
        const updated = prev.map(t => {
          if (t.id === 'task_community' && t.status !== 'Claimed' && t.status !== 'Claim') {
            changed = true;
            return { ...t, status: 'Claim' };
          }
          return t;
        });
        if (changed) {
          const states = updated.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.status }), {});
          setStoredJson('apple_farm_std_task_states', user?.id, states);
        }
        return changed ? updated : prev;
      });
    }
  }, [user?.airdropTasks?.joinTg, user?.communityJoined, user?.id]);

  // ক্যালকুলেশন: বাজেট + ৮% প্ল্যাটফর্ম ফি
  const targetNum = Math.max(0, Number(postForm.targetMembers) || 0);
  const bidNum = Math.max(0, Number(postForm.bidPerMember) || 0);
  const taskBudget = (targetNum * bidNum);
  const platformFee = (taskBudget * 0.08); // 8% Platform Revenue Fee
  const totalPayableGram = (taskBudget + platformFee).toFixed(3);

  // স্ট্যান্ডার্ড টাস্ক হ্যান্ডলার
  const handleStandardTaskAction = async (task) => {
    if (task.status === 'Claimed') return;

    soundManager.play('click');
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    if (task.status === 'Go') {
      if (task.actionUrl && task.actionUrl.startsWith('http')) {
        try {
          if (window.Telegram?.WebApp?.openTelegramLink && task.actionUrl.includes('t.me/')) {
            window.Telegram.WebApp.openTelegramLink(task.actionUrl);
          } else if (window.Telegram?.WebApp?.openLink) {
            window.Telegram.WebApp.openLink(task.actionUrl);
          } else {
            window.open(task.actionUrl, '_blank');
          }
        } catch (e) {
          window.open(task.actionUrl, '_blank');
        }
        setStandardTasks(prev => {
          const updated = prev.map(t => t.id === task.id ? { ...t, status: 'Verify' } : t);
          const states = updated.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.status }), {});
          setStoredJson('apple_farm_std_task_states', user?.id, states);
          return updated;
        });
        return;
      }

      if (task.actionUrl === 'daily_reward') {
        if (onOpenDailyReward) onOpenDailyReward();
        return;
      }

      if (task.actionUrl === 'offerwall' || task.id === 'task_offerwall') {
        openGigaOfferWall();
        return;
      }

      // Monetag Rewarded Popup Ad Task
      if (task.actionUrl === 'monetag_pop' || task.id === 'task_monetag_pop') {
        const getMonetagFn = () => {
          return typeof window.show_11914279 === 'function' 
            ? window.show_11914279 
            : (typeof show_11914279 === 'function' ? show_11914279 : null);
        };

        const grantPopReward = () => {
          const todayStr = new Date().toDateString();
          setStoredJson(`apple_farm_daily_pop_${todayStr}`, user?.id, true);

          setStandardTasks(prev => {
            const updated = prev.map(t => t.id === task.id ? { ...t, status: 'Claimed' } : t);
            return updated;
          });

          soundManager.play('reward');
          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          }

          if (onRewardClaim) {
            onRewardClaim(task);
          } else if (onUpdateUser) {
            onUpdateUser({
              apples: (user.apples || 0) + task.rewardAmount,
            });
          }

          addTransaction({
            userId: user.id,
            title: 'Daily Bonus Ad',
            subtitle: 'Monetag Rewarded Popup',
            amount: `+${task.rewardAmount}`,
            currency: 'apple',
            type: 'earn',
            category: 'task',
            status: 'Completed'
          });

          if (onShowPopup) {
            onShowPopup({
              type: 'reward',
              title: 'Bonus Apples Earned!',
              message: `Awesome! You received +${task.rewardAmount} Apples for watching the Daily Bonus Ad.`,
              rewardAmount: task.rewardAmount,
              rewardType: 'apple'
            });
          }
        };

        const monetagFn = getMonetagFn();
        if (monetagFn) {
          setVerifyingTaskId(task.id);
          try {
            monetagFn('pop')
              .then(() => {
                setVerifyingTaskId(null);
                grantPopReward();
              })
              .catch((err) => {
                console.warn('[Monetag Pop Closed/Error]:', err);
                setVerifyingTaskId(null);
                if (onShowPopup) {
                  onShowPopup({
                    type: 'warn',
                    title: 'Ad Incomplete',
                    message: 'Ad was closed early or could not be loaded. Please watch the ad to receive your reward.',
                    confirmText: 'OK'
                  });
                }
              });
          } catch (e) {
            setVerifyingTaskId(null);
            grantPopReward();
          }
        } else {
          // Dev / Fallback
          grantPopReward();
        }
        return;
      }

      if (task.actionUrl) {
        onNavigate?.(task.actionUrl);
        return;
      }

      setStandardTasks(prev => {
        const updated = prev.map(t => t.id === task.id ? { ...t, status: 'Claim' } : t);
        const states = updated.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.status }), {});
        setStoredJson('apple_farm_std_task_states', user?.id, states);
        return updated;
      });
    } else if (task.status === 'Verify') {
      setVerifyingTaskId(task.id);

      // যদি টেলিগ্রাম টাস্ক হয় তবে সরাসরি Bot API getChatMember দিয়ে রিয়েল মেম্বারশিপ চেক
      if (task.actionUrl && (task.actionUrl.includes('t.me/') || task.actionUrl.startsWith('@'))) {
        try {
          const verifyResult = await verifyTelegramMembership(user?.id, task.actionUrl);
          setVerifyingTaskId(null);

          if (!verifyResult.verified) {
            if (window.Telegram?.WebApp?.HapticFeedback) {
              window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
            // জয়েন না করলে আবার Go স্টেটে ফিরে যাবে
            setStandardTasks(prev => {
              const updated = prev.map(t => t.id === task.id ? { ...t, status: 'Go' } : t);
              const states = updated.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.status }), {});
              setStoredJson('apple_farm_std_task_states', user?.id, states);
              return updated;
            });

            if (onShowPopup) {
              onShowPopup({
                type: 'warn',
                title: verifyResult.notAdmin ? 'Bot Admin Required' : 'Join Not Found',
                message: verifyResult.message || 'You have not joined this channel yet. Please click Go, join the channel, and then click Verify.',
                confirmText: 'Got It'
              });
            }
            return;
          }
        } catch (err) {
          console.warn('Membership check warning:', err);
          setVerifyingTaskId(null);
          setStandardTasks(prev => {
            const updated = prev.map(t => t.id === task.id ? { ...t, status: 'Go' } : t);
            const states = updated.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.status }), {});
            setStoredJson('apple_farm_std_task_states', user?.id, states);
            return updated;
          });
          if (onShowPopup) {
            onShowPopup({
              type: 'warn',
              title: 'Verification Failed',
              message: 'Could not verify channel membership. Please make sure you joined the channel.',
              confirmText: 'Got It'
            });
          }
          return;
        }
      }

      setVerifyingTaskId(null);
      setStandardTasks(prev => {
        const updated = prev.map(t => t.id === task.id ? { ...t, status: 'Claim' } : t);
        const states = updated.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.status }), {});
        setStoredJson('apple_farm_std_task_states', user?.id, states);
        return updated;
      });

      if (task.id === 'task_community' || (task.actionUrl && task.actionUrl.includes('AppleFarmCommunity'))) {
        onUpdateUser?.({
          airdropTasks: { ...(user?.airdropTasks || {}), joinTg: true },
          communityJoined: true,
        });
      }

      soundManager.play('click');
    } else if (task.status === 'Claim') {
      soundManager.play('reward');
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      setStandardTasks(prev => {
        const updated = prev.map(t => t.id === task.id ? { ...t, status: 'Claimed' } : t);
        const states = updated.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.status }), {});
        setStoredJson('apple_farm_std_task_states', user?.id, states);
        return updated;
      });

      const isCommunityTask = task.id === 'task_community' || (task.actionUrl && task.actionUrl.includes('AppleFarmCommunity'));

      if (onRewardClaim) {
        onRewardClaim(task);
        if (isCommunityTask) {
          onUpdateUser?.({
            airdropTasks: { ...(user?.airdropTasks || {}), joinTg: true },
            communityJoined: true,
          });
        }
      } else if (onUpdateUser) {
        onUpdateUser({ 
          apples: (user.apples || 0) + task.rewardAmount,
          ...(isCommunityTask ? { 
            airdropTasks: { ...(user?.airdropTasks || {}), joinTg: true },
            communityJoined: true 
          } : {})
        });
      }

      addTransaction({
        userId: user.id,
        title: task.title,
        subtitle: 'Special Task Reward',
        amount: `+${task.rewardAmount}`,
        currency: 'apple',
        type: 'earn',
        category: 'task',
        status: 'Completed'
      });

      if (onShowPopup) {
        onShowPopup({
          type: 'reward',
          title: 'Apples Earned',
          message: `Congratulations. You received +${task.rewardAmount} Apples for completing ${task.title}.`,
          rewardAmount: task.rewardAmount,
          rewardType: 'apple'
        });
      }
    }
  };

  // পার্টনার টাস্ক হ্যান্ডলার (Go -> Verify -> Claim)
  const handlePartnerTaskAction = async (task) => {
    if (task.status === 'Claimed') return;

    soundManager.play('click');
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    const setTaskStatusHelper = (statusVal, extraFields = {}) => {
      const currentStates = getStoredJson('apple_farm_partner_task_states', user?.id, {});
      currentStates[task.id] = statusVal;
      setStoredJson('apple_farm_partner_task_states', user?.id, currentStates);

      setPartnerTasks(prev => {
        const updated = prev.map(t => t.id === task.id ? { ...t, status: statusVal, ...extraFields } : t);
        setStoredJson('apple_farm_partner_tasks_real', user?.id, updated);
        return updated;
      });
    };

    if (task.status === 'Go') {
      // লিংক ওপেন ও টাইমস্ট্যাম্প রেকর্ড (ইউটিউবের জন্য ১৫ সেকেন্ড কাউন্ট শুরু)
      if (task.link) {
        try {
          if (window.Telegram?.WebApp?.openTelegramLink && task.link.includes('t.me/')) {
            window.Telegram.WebApp.openTelegramLink(task.link);
          } else if (window.Telegram?.WebApp?.openLink) {
            window.Telegram.WebApp.openLink(task.link);
          } else {
            window.open(task.link, '_blank');
          }
        } catch (e) {
          window.open(task.link, '_blank');
        }
      }
      const now = Date.now();
      setTaskStatusHelper('Verify', { startedAt: now });
    } 
    else if (task.status === 'Verify') {
      const isYoutube = task.platform === 'youtube' || (task.title && task.title.toLowerCase().includes('youtube'));
      const isTelegram = task.platform === 'tg_channel' || task.platform === 'tg_group' || task.platform === 'tg_bot' || (task.link && task.link.includes('t.me/')) || (task.link && task.link.startsWith('@'));
      
      // ⏱️ শুধুমাত্র YouTube টাস্কের জন্য ১৫ সেকেন্ডের রুলস
      if (isYoutube) {
        const elapsed = (Date.now() - (task.startedAt || 0)) / 1000;
        if (elapsed < 15) {
          const remainingSec = Math.ceil(15 - elapsed);
          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
          }
          
          // ১৫ সেকেন্ডের আগে ক্লিক করলে ফেইলড এবং আবার 'Go' স্টেটে রিসেট হবে
          setTaskStatusHelper('Go', { startedAt: null });
          
          if (onShowPopup) {
            onShowPopup({
              type: 'warn',
              title: 'Verification Failed',
              message: `You must watch & subscribe on YouTube for at least 15 seconds. (Remaining: ${remainingSec}s). Please click 'Go' and complete the task again.`,
              confirmText: 'Try Again'
            });
          }
          return;
        }
      }

      setVerifyingTaskId(task.id);

      // 🤖 টেলিগ্রাম চ্যানেল / গ্রুপের জন্য Bot API getChatMember দিয়ে রিয়েল মেম্বারশিপ যাচাই
      if (isTelegram && task.link) {
        try {
          const verifyResult = await verifyTelegramMembership(user?.id, task.link);
          
          if (!verifyResult.verified) {
            setVerifyingTaskId(null);
            if (window.Telegram?.WebApp?.HapticFeedback) {
              window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
            
            // জয়েন না করলে আবার Go স্টেটে রিসেট হবে
            setTaskStatusHelper('Go', { startedAt: null });
            
            if (onShowPopup) {
              onShowPopup({
                type: 'warn',
                title: verifyResult.notAdmin ? 'Bot Admin Required' : 'Membership Not Found',
                message: verifyResult.message || 'You have not joined this Telegram channel/group yet. Please click Go, join the channel, and then click Verify.',
                confirmText: 'Got It'
              });
            }
            return;
          }
        } catch (verifyErr) {
          console.warn('Partner task verify exception:', verifyErr);
          setVerifyingTaskId(null);
          setTaskStatusHelper('Go', { startedAt: null });
          if (onShowPopup) {
            onShowPopup({
              type: 'warn',
              title: 'Verification Failed',
              message: 'Could not verify membership. Please make sure you joined the channel.',
              confirmText: 'Got It'
            });
          }
          return;
        }
      }

      // ভেরিফিকেশন পাস হলে Claim স্টেটে রূপান্তর
      setVerifyingTaskId(null);
      setTaskStatusHelper('Claim');
      soundManager.play('click');
    } 
    else if (task.status === 'Claim') {
      soundManager.play('reward');
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      const nextJoinedCount = (Number(task.joinedCount) || 0) + 1;
      setTaskStatusHelper('Claimed', { joinedCount: nextJoinedCount });

      // ফায়ারস্টোরে জয়েন কাউন্ট বাড়ানো
      try {
        incrementPartnerTaskJoinedInDB(task.id);
      } catch (e) {
        console.warn('Increment join in DB error:', e);
      }

      // বিড ভ্যালু অনুযায়ী ডায়মন্ড রিওয়ার্ড ক্যালকুলেশন (0.005 GRAM = 1 💎, 0.010 GRAM = 2 💎)
      const rewardDiamonds = calculateRewardDiamonds(task.bidPerMember);
      const currentDiamonds = Number(user.diamonds) || 0;
      const updatedDiamonds = Number((currentDiamonds + rewardDiamonds).toFixed(2));

      if (onUpdateUser) {
        onUpdateUser({ diamonds: updatedDiamonds });
      }

      addTransaction({
        userId: user.id,
        title: task.title,
        subtitle: 'Partner Task Reward',
        amount: `+${rewardDiamonds} 💎`,
        currency: 'diamond',
        type: 'earn',
        category: 'task',
        status: 'Completed'
      });

      if (onShowPopup) {
        onShowPopup({
          type: 'reward',
          title: 'Diamonds Earned',
          message: `Congratulations. You earned +${rewardDiamonds} Diamond${rewardDiamonds > 1 ? 's' : ''} for completing this partner task.`,
          rewardAmount: rewardDiamonds,
          rewardType: 'diamond'
        });
      }
    }
  };

  // 'Create Promotion Task' সাবমিট ও TON পেমেন্ট
  const handleLaunchCampaign = async () => {
    if (!postForm.title.trim()) {
      alert('Please enter task title');
      return;
    }
    if (!postForm.link.trim() || !postForm.link.startsWith('http')) {
      alert('Please enter a valid link (starting with https://)');
      return;
    }

    if (Number(postForm.targetMembers) < 50) {
      alert('Minimum target member is 50 users.');
      return;
    }

    if (Number(postForm.bidPerMember) < 0.005) {
      alert('Minimum reward bid is 0.005 GRAM per user.');
      return;
    }

    if (!walletConnected) {
      if (tonConnectUI) {
        tonConnectUI.openModal();
      } else {
        alert('Please connect your TON wallet first.');
      }
      return;
    }

    try {
      setIsProcessingPayment(true);
      soundManager.play('click');

      const payableNano = Math.round(Number(totalPayableGram) * 1000000000).toString();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: MASTER_WALLET_ADDRESS,
            amount: payableNano,
          },
        ],
      };

      await tonConnectUI.sendTransaction(transaction);

      const newTask = {
        id: 'partner_' + Date.now(),
        title: postForm.title,
        platform: postForm.platform,
        link: postForm.link,
        targetMembers: Number(postForm.targetMembers),
        joinedCount: 0,
        bidPerMember: postForm.bidPerMember,
        currency: 'gram',
        type: 'Partner',
        status: 'Go',
        isMyTask: true,
        creatorId: user?.id || null,
        totalPaidGram: totalPayableGram,
      };

      // ফায়ারস্টোর ডাটাবেসে সেভ
      try {
        const savedId = await savePartnerTaskToDB(newTask);
        if (savedId) newTask.id = savedId;
      } catch (dbErr) {
        console.warn('Firestore task save warning:', dbErr);
      }

      const updatedList = [newTask, ...partnerTasks];
      setPartnerTasks(updatedList);
      localStorage.setItem('apple_farm_partner_tasks_real', JSON.stringify(updatedList));

      setIsPostModalOpen(false);
      setPartnerSubTab('my_tasks');

      // 🎁 Trigger Cashback Faded Wheel for job launch!
      const paidAmountNum = Number(totalPayableGram) || 0;
      setCashbackPaidAmount(paidAmountNum);
      setIsCashbackClaimed(false);
      setCashbackWonPrize(null);
      setCashbackActiveHighlight(0);
      setIsCashbackWheelOpen(true);
    } catch (err) {
      console.error('Payment error:', err);
      if (err.message && !err.message.includes('User rejects')) {
        alert(`Payment failed: ${err.message || 'Error occurred'}`);
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // 🎮 CASHBACK FADED WHEEL SPIN HANDLER
  const handleSpinCashbackWheel = () => {
    if (isCashbackSpinning || isCashbackClaimed) return;

    setIsCashbackSpinning(true);
    setCashbackWonPrize(null);
    soundManager.play('click');

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
    }

    // 🎯 সুনির্দিষ্ট প্রোবাবিলিটি বণ্টন:
    // Slot 0 (150% Cashback): 4%
    // Slot 1 (50% Cashback): 8%
    // Slot 3 (25% Cashback): 18%
    // Slot 4 (15% Cashback): 25%
    // Slot 5 (10% Cashback): 25%
    // Slot 6 (5% Cashback): 15%
    // Slot 2 or 7 (Empty): 5%
    const rand = Math.random() * 100;
    let winningIndex;
    if (rand < 4) {
      winningIndex = 0; // 150% Cashback
    } else if (rand < 12) {
      winningIndex = 1; // 50% Cashback
    } else if (rand < 30) {
      winningIndex = 3; // 25% Cashback
    } else if (rand < 55) {
      winningIndex = 4; // 15% Cashback
    } else if (rand < 80) {
      winningIndex = 5; // 10% Cashback
    } else if (rand < 95) {
      winningIndex = 6; // 5% Cashback
    } else {
      winningIndex = Math.random() < 0.5 ? 2 : 7; // Empty
    }

    const targetPrize = CASHBACK_WHEEL_ITEMS[winningIndex];
    const fullRounds = 4;
    const totalSteps = (fullRounds * 8) + ((winningIndex - cashbackActiveHighlight + 8) % 8);

    let currentStep = 0;
    let currentIdx = cashbackActiveHighlight;

    const runStep = () => {
      currentStep++;
      currentIdx = (currentIdx + 1) % 8;
      setCashbackActiveHighlight(currentIdx);
      soundManager.playSpinTick?.();

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }

      if (currentStep >= totalSteps) {
        setIsCashbackSpinning(false);
        setIsCashbackClaimed(true);

        const calculatedCashback = targetPrize.percentage > 0
          ? Number(((cashbackPaidAmount * targetPrize.percentage) / 100).toFixed(4))
          : 0;

        const resultWithAmount = {
          ...targetPrize,
          cashbackAmountGram: calculatedCashback
        };

        setCashbackWonPrize(resultWithAmount);

        if (targetPrize.percentage > 0) {
          soundManager.play('reward');
          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          }

          confetti({
            particleCount: 130,
            spread: 80,
            origin: { y: 0.5 }
          });
        } else {
          soundManager.play('click');
        }
      } else {
        const remaining = totalSteps - currentStep;
        let delay = 60;
        if (remaining < 12) {
          delay = 60 + Math.pow(12 - remaining, 2) * 3.5;
        }
        cashbackSpinTimerRef.current = setTimeout(runStep, delay);
      }
    };

    cashbackSpinTimerRef.current = setTimeout(runStep, 60);
  };

  // 💎 CLAIM CASHBACK DIRECTLY TO TON WALLET
  const handleClaimCashbackToWallet = () => {
    if (!cashbackWonPrize || cashbackWonPrize.percentage <= 0) {
      setIsCashbackWheelOpen(false);
      return;
    }

    soundManager.play('reward');
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 }
    });

    const walletRaw = tonConnectUI?.wallet?.account?.address || user?.walletAddress || '';
    const walletShort = walletRaw ? `${walletRaw.slice(0, 4)}...${walletRaw.slice(-4)}` : 'Connected TON Wallet';

    // রেকর্ড ট্রানজাকশন
    addTransaction({
      userId: user?.id,
      title: `Job Cashback (${cashbackWonPrize.percentage}%)`,
      subtitle: `Sent to ${walletShort}`,
      amount: `+${cashbackWonPrize.cashbackAmountGram} GRAM`,
      currency: 'gram',
      type: 'earn',
      category: 'cashback',
      status: 'Completed'
    });

    if (onUpdateUser) {
      onUpdateUser({
        cashbackEarnedGram: Number(((user?.cashbackEarnedGram || 0) + cashbackWonPrize.cashbackAmountGram).toFixed(4))
      });
    }

    setIsCashbackWheelOpen(false);

    if (onShowPopup) {
      onShowPopup({
        type: 'reward',
        title: 'Cashback Claimed!',
        message: `Congratulations! +${cashbackWonPrize.cashbackAmountGram} GRAM (${cashbackWonPrize.label}) cashback has been sent to your TON wallet (${walletShort}).`,
        confirmText: 'Awesome!'
      });
    }
  };

  // 🎮 CASHBACK FADED WHEEL CELL RENDERER (3x3 Perimeter)
  const renderCashbackCell = (cellIdx) => {
    const item = CASHBACK_WHEEL_ITEMS[cellIdx];
    const isLit = cashbackActiveHighlight === cellIdx;
    const isWinner = cashbackWonPrize && cashbackWonPrize.id === item.id && !isCashbackSpinning;

    return (
      <div 
        key={item.id}
        className={`relative aspect-square rounded-2xl p-1.5 flex flex-col items-center justify-between border-2 transition-all duration-150 overflow-hidden select-none ${
          isWinner
            ? 'border-amber-400 bg-amber-500/20 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.6)] z-20 animate-pulse'
            : isLit 
            ? 'border-emerald-400 bg-emerald-400/25 scale-102 shadow-[0_0_15px_rgba(46,204,113,0.5)] z-10' 
            : `${item.border} bg-gradient-to-br ${item.bg} opacity-90`
        }`}
      >
        {/* Top Badge for Rare/Jackpot */}
        {item.badge && (
          <span className={`absolute -top-1 left-1/2 -translate-x-1/2 ${item.badgeBg} text-white font-black text-[8px] px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-xs`}>
            {item.badge}
          </span>
        )}

        {/* Center Graphic */}
        <div className="flex-1 flex items-center justify-center pt-1">
          {item.percentage === 150 ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-amber-900 shadow-md">
              <Crown className="w-5 h-5 fill-amber-300 stroke-amber-800" />
            </div>
          ) : item.percentage > 0 ? (
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
              <img src={gramImg} alt="GRAM" className="w-4 h-4 object-contain" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-400">
              <X className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
        </div>

        {/* Bottom Percentage Label */}
        <div className="text-center w-full">
          <span className={`text-[11px] font-black leading-none block ${
            item.percentage === 150 ? 'text-amber-900 font-extrabold' : item.percentage > 0 ? 'text-[#192f52]' : 'text-slate-500'
          }`}>
            {item.label}
          </span>
          <span className="text-[8px] font-bold text-slate-500 tracking-tight block">
            {item.percentage > 0 ? 'Cashback' : 'Empty'}
          </span>
        </div>
      </div>
    );
  };

  // ফিল্টার করা স্ট্যান্ডার্ড টাস্ক
  const filteredStandardTasks = activeTab === 'All'
    ? standardTasks
    : standardTasks.filter(t => t.type === activeTab);

  const myPartnerTasks = partnerTasks.filter(t => t.isMyTask);

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#eaf6ff] via-[#f3f9ff] to-[#e8f5e9] flex flex-col justify-between select-none font-sans overflow-hidden">
      
      {/* ----------------- TOP BAR ----------------- */}
      <div className="pt-2 px-4 pb-2 z-20">
        <CustomTitleBar title="Apple Farm" darkText={true} />
        
        {/* Title & Back Button */}
        <div className="flex items-center justify-between relative mb-3 mt-1">
          <button 
            onClick={onBack || (() => onNavigate?.('home'))}
            className="w-9 h-9 rounded-full bg-white/80 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform shadow-sm"
          >
            <svg className="w-5 h-5 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 className="text-xl font-black text-[#192f52] tracking-tight">
            Tasks & Rewards
          </h1>

          <div className="w-9" />
        </div>

        {/* ----------------- 4 TABS (All / Daily / Special / Partner) ----------------- */}
        <div className="flex items-center justify-between gap-1.5 px-1 mb-2">
          {[
            { id: 'All', label: 'All' },
            { id: 'Daily', label: 'Daily' },
            { id: 'Special', label: 'Special' },
            { id: 'Partner', label: 'Partner' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.play('click');
                  setActiveTab(tab.id);
                }}
                className={`flex-1 py-2 rounded-full font-black text-xs transition-all duration-200 shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-b from-[#2ecc71] to-[#20a058] text-white shadow-[#20a058]/30 shadow-md'
                    : 'bg-white/90 text-[#4c678a] hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------- MAIN TASK LIST ----------------- */}
      <div className="flex-1 px-4 py-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-175px)]">
        
        {/* ============== PARTNER TAB ============== */}
        {activeTab === 'Partner' ? (
          <div className="space-y-2.5">
            
            {/* 🎁 PROMOTIONAL BANNER CARD: Up to 150% Cashback on 1st Campaign */}
            <div className="relative w-full rounded-3xl bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#e6fffa] border-2 border-amber-300 p-4 shadow-[0_6px_20px_rgba(245,158,11,0.18)] overflow-hidden select-none">
              {/* Background ambient glow circles */}
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-emerald-400/20 rounded-full blur-lg pointer-events-none" />

              {/* Top Tag Pill */}
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs mb-2">
                <Sparkles className="w-3 h-3 fill-amber-200 text-amber-200" />
                <span>1st Campaign Bonus</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <h3 className="text-base font-black text-[#192f52] leading-tight tracking-tight">
                    Get Up To <span className="text-amber-600 font-black">150% Cashback</span>!
                  </h3>
                  <p className="text-[11px] font-bold text-[#567396] leading-snug">
                    Launch your 1st promotion task & spin the exclusive Faded Wheel for instant refund in GRAM!
                  </p>
                </div>

                {/* Right Graphic Preview */}
                <div className="flex-shrink-0 relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-orange-400 border-2 border-amber-400/80 flex flex-col items-center justify-center text-white shadow-md transform rotate-2">
                    <Crown className="w-6 h-6 fill-amber-100 text-amber-900" />
                    <span className="text-[8px] font-black text-amber-950 uppercase tracking-tight -mt-0.5">
                      150%
                    </span>
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-ping" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
              </div>

              {/* Quick Launch CTA Button */}
              <button
                type="button"
                onClick={() => {
                  soundManager.play('click');
                  setIsPostModalOpen(true);
                }}
                className="mt-3 w-full py-2.5 rounded-2xl bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 text-white font-black text-xs shadow-[0_3px_0_#145a32] border-t border-emerald-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Launch Campaign & Get Cashback</span>
              </button>
            </div>

            {/* Sub-header with Explore/My Tasks and + Post */}
            <div className="bg-white/90 rounded-2xl p-2 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => {
                    soundManager.play('click');
                    setPartnerSubTab('explore');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    partnerSubTab === 'explore'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Explore ({partnerTasks.length})
                </button>
                <button
                  onClick={() => {
                    soundManager.play('click');
                    setPartnerSubTab('my_tasks');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    partnerSubTab === 'my_tasks'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  My Tasks ({myPartnerTasks.length})
                </button>
              </div>

              {/* Post Button */}
              <button
                onClick={() => {
                  soundManager.play('click');
                  setIsPostModalOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-500/30 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </div>

            {/* Subtab Content: Explore */}
            {partnerSubTab === 'explore' && (
              partnerTasks.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 text-center border border-slate-100 shadow-sm space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#192f52]">
                      No Partner Tasks Live
                    </h3>
                    <p className="text-xs text-[#4c739e] mt-1 max-w-xs mx-auto leading-relaxed">
                      Be the first advertiser to promote your Telegram channel, group, bot, or YouTube video to all players!
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPostModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#2ecc71] to-[#20a058] text-white font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    + Create Promotion Task
                  </button>
                </div>
              ) : (
                partnerTasks.map((task) => {
                  const percent = Math.min(100, Math.round((task.joinedCount / task.targetMembers) * 100));
                  const isVerifying = verifyingTaskId === task.id;

                  return (
                    <div 
                      key={task.id}
                      className="bg-white/95 backdrop-blur-md rounded-2xl p-3 px-3.5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-inner shrink-0">
                            {task.platform === 'tg_channel' && <Send className="w-5 h-5 fill-white stroke-none" />}
                            {task.platform === 'tg_group' && <Users className="w-5 h-5" />}
                            {task.platform === 'tg_bot' && <Bot className="w-5 h-5" />}
                            {task.platform === 'youtube' && <YoutubeIcon className="w-5 h-5" />}
                            {task.platform === 'twitter' && <TwitterIcon className="w-5 h-5" />}
                            {task.platform === 'website' && <Globe className="w-5 h-5" />}
                          </div>

                          <div>
                            <h3 className="text-sm font-extrabold text-[#192f52] leading-snug">
                              {task.title}
                            </h3>
                            <p className="text-xs font-bold text-sky-600 flex items-center gap-1 mt-0.5">
                              <img src={diamondImg} alt="Diamond" className="w-3.5 h-3.5 object-contain" />
                              <span>+{calculateRewardDiamonds(task.bidPerMember)} Diamond{calculateRewardDiamonds(task.bidPerMember) > 1 ? 's' : ''}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({task.joinedCount}/{task.targetMembers})</span>
                            </p>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div>
                          {task.status === 'Claimed' ? (
                            <button 
                              disabled
                              className="bg-[#b3c7d6] text-white text-xs font-extrabold px-5 py-2 rounded-2xl cursor-not-allowed shadow-inner"
                            >
                              Claimed
                            </button>
                          ) : task.status === 'Claim' ? (
                            <button 
                              onClick={() => handlePartnerTaskAction(task)}
                              className="bg-gradient-to-b from-amber-400 to-amber-500 hover:brightness-105 active:scale-95 text-white font-black text-xs px-5 py-2 rounded-2xl shadow-[0_3px_0_#b45309] transition-all"
                            >
                              Claim
                            </button>
                          ) : task.status === 'Verify' ? (
                            <button 
                              disabled={isVerifying}
                              onClick={() => handlePartnerTaskAction(task)}
                              className="bg-gradient-to-b from-blue-500 to-indigo-600 hover:brightness-105 active:scale-95 text-white font-black text-xs px-4 py-2 rounded-2xl shadow-[0_3px_0_#312e81] transition-all flex items-center gap-1"
                            >
                              {isVerifying ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Checking</span>
                                </>
                              ) : (
                                <span>Verify</span>
                              )}
                            </button>
                          ) : (
                            <button 
                              onClick={() => handlePartnerTaskAction(task)}
                              className="bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 text-white font-black text-xs px-6 py-2 rounded-2xl shadow-[0_3px_0_#145a32] border-t border-emerald-300 transition-all"
                            >
                              Go
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Mini Progress */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-400 to-green-500 h-full rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )
            )}

            {/* Subtab Content: My Tasks */}
            {partnerSubTab === 'my_tasks' && (
              myPartnerTasks.length === 0 ? (
                <div className="bg-white/90 rounded-2xl p-6 text-center border border-slate-100 shadow-sm space-y-2">
                  <p className="text-xs font-bold text-slate-500">
                    No active campaigns created yet.
                  </p>
                  <button
                    onClick={() => setIsPostModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-xs cursor-pointer active:scale-95 transition-all shadow-md shadow-emerald-500/20"
                  >
                    Post First Campaign
                  </button>
                </div>
              ) : (
                myPartnerTasks.map((task) => (
                  <div key={task.id} className="bg-white/95 rounded-2xl p-3 border border-slate-100 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">{task.title}</span>
                      <span className="text-[10px] font-bold text-emerald-600">Running</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between items-center">
                      <span>{task.joinedCount} / {task.targetMembers} Joined</span>
                      <span className="font-bold text-sky-600 flex items-center gap-1">
                        <img src={diamondImg} alt="Diamond" className="w-3 h-3 object-contain" />
                        <span>+{calculateRewardDiamonds(task.bidPerMember)}/worker</span>
                      </span>
                    </div>
                  </div>
                ))
              )
            )}

          </div>
        ) : (
          /* ============== STANDARD TASKS (All, Daily, Special) ============== */
          filteredStandardTasks.map((task) => (
            <div 
              key={task.id}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-3 px-3.5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-between"
            >
              {/* Left: Icon & Info */}
              <div className="flex items-center gap-3">
                <div className={`p-1 rounded-2xl border ${task.iconBg}`}>
                  {task.icon}
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-[#192f52] leading-snug">
                    {task.title}
                  </h3>
                  <p className={`text-xs font-bold ${task.rewardCurrency === 'diamond' ? 'text-sky-600' : 'text-[#4c739e]'}`}>
                    {task.reward}
                  </p>
                </div>
              </div>

              {/* Right: Action Button */}
              <div>
                {task.status === 'Claimed' ? (
                  <button 
                    disabled
                    className="bg-[#b3c7d6] text-white text-xs font-extrabold px-5 py-2 rounded-2xl cursor-not-allowed shadow-inner"
                  >
                    Claimed
                  </button>
                ) : task.status === 'Claim' ? (
                  <button 
                    onClick={() => handleStandardTaskAction(task)}
                    className="bg-gradient-to-b from-amber-400 to-amber-500 hover:brightness-105 active:scale-95 text-white font-black text-xs px-5 py-2 rounded-2xl shadow-[0_3px_0_#b45309] transition-all"
                  >
                    Claim
                  </button>
                ) : task.status === 'Verify' ? (
                  <button 
                    disabled={verifyingTaskId === task.id}
                    onClick={() => handleStandardTaskAction(task)}
                    className="bg-gradient-to-b from-blue-500 to-indigo-600 hover:brightness-105 active:scale-95 text-white font-black text-xs px-4 py-2 rounded-2xl shadow-[0_3px_0_#312e81] transition-all flex items-center gap-1"
                  >
                    {verifyingTaskId === task.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Checking</span>
                      </>
                    ) : (
                      <span>Verify</span>
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleStandardTaskAction(task)}
                    className="bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 text-white font-black text-xs px-6 py-2 rounded-2xl shadow-[0_3px_0_#145a32] border-t border-emerald-300 transition-all"
                  >
                    Go
                  </button>
                )}
              </div>

            </div>
          ))
        )}

      </div>

      {/* ----------------- CREATE PROMOTION TASK MODAL (+ POST) ----------------- */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto space-y-3.5 select-none text-slate-800">
            
            {/* Modal Header */}
            <div>
              <h2 className="text-base font-black text-[#192f52] tracking-tight">
                Create Promotion Task
              </h2>
              <p className="text-[11px] text-[#4c739e] leading-snug mt-0.5">
                Promote your Telegram channel, group, or bot with real members!
              </p>
            </div>

            {/* 1. TASK TYPE (Dropdown Select) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#192f52] tracking-wider uppercase">
                TASK TYPE
              </label>
              <div className="relative">
                <select
                  value={postForm.platform}
                  onChange={(e) => setPostForm(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#f4f9ff] border border-[#cbe1f5] text-xs font-bold text-[#192f52] focus:bg-white focus:border-[#2ecc71] focus:ring-2 focus:ring-[#2ecc71]/20 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="tg_channel" className="bg-white text-slate-800">Telegram Channel (Join)</option>
                  <option value="tg_group" className="bg-white text-slate-800">Telegram Group (Join)</option>
                  <option value="tg_bot" className="bg-white text-slate-800">Telegram Bot (Start)</option>
                  <option value="youtube" className="bg-white text-slate-800">YouTube (Subscribe)</option>
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 2. TITLE / CHANNEL NAME */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#192f52] tracking-wider uppercase">
                TITLE / CHANNEL NAME
              </label>
              <input 
                type="text"
                value={postForm.title}
                onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Crypto Signals VIP"
                className="w-full px-3 py-2.5 rounded-xl bg-[#f4f9ff] border border-[#cbe1f5] text-xs font-bold text-[#192f52] placeholder-slate-400 focus:bg-white focus:border-[#2ecc71] focus:ring-2 focus:ring-[#2ecc71]/20 focus:outline-none"
              />
            </div>

            {/* 3. LINK / USERNAME (@CHANNEL) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#192f52] tracking-wider uppercase">
                LINK / USERNAME (@CHANNEL)
              </label>
              <input 
                type="text"
                value={postForm.link}
                onChange={(e) => setPostForm(prev => ({ ...prev, link: e.target.value }))}
                placeholder="e.g. @MyChannel or https://t.me/..."
                className="w-full px-3 py-2.5 rounded-xl bg-[#f4f9ff] border border-[#cbe1f5] text-xs font-bold text-[#192f52] placeholder-slate-400 focus:bg-white focus:border-[#2ecc71] focus:ring-2 focus:ring-[#2ecc71]/20 focus:outline-none"
              />
            </div>

            {/* 4 & 5. TARGET MEMBERS + BID / SUB (Side-by-Side 2 Columns) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Target Members */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#192f52] tracking-wider uppercase">
                  TARGET MEMBERS
                </label>
                <input 
                  type="number"
                  min="50"
                  value={postForm.targetMembers}
                  onChange={(e) => setPostForm(prev => ({ ...prev, targetMembers: e.target.value }))}
                  placeholder="50"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#f4f9ff] border border-[#cbe1f5] text-xs font-bold text-[#192f52] focus:bg-white focus:border-[#2ecc71] focus:ring-2 focus:ring-[#2ecc71]/20 focus:outline-none"
                />
              </div>

              {/* Bid / Sub */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#192f52] tracking-wider uppercase">
                  BID / SUB (GRAM)
                </label>
                <input 
                  type="number"
                  step="0.001"
                  min="0.005"
                  value={postForm.bidPerMember}
                  onChange={(e) => setPostForm(prev => ({ ...prev, bidPerMember: e.target.value }))}
                  placeholder="0.01"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#f4f9ff] border border-[#cbe1f5] text-xs font-bold text-[#192f52] focus:bg-white focus:border-[#2ecc71] focus:ring-2 focus:ring-[#2ecc71]/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Budget Calculation Card */}
            <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-emerald-50/60 rounded-2xl p-3 border border-amber-200/80 space-y-1 text-xs shadow-inner">
              <div className="flex justify-between text-slate-600">
                <span>Task Budget:</span>
                <span className="font-bold text-slate-800">{taskBudget.toFixed(3)} GRAM</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Fee (8%):</span>
                <span className="font-bold text-slate-800">{platformFee.toFixed(3)} GRAM</span>
              </div>
              <div className="border-t border-amber-200/80 pt-1.5 flex justify-between font-black text-sm">
                <span className="text-[#192f52]">Total Payable:</span>
                <span className="text-emerald-700 text-sm font-black">{totalPayableGram} GRAM</span>
              </div>
            </div>

            {/* Note */}
            <div className="bg-sky-50 rounded-xl p-2.5 border border-sky-100 text-[10px] leading-snug text-sky-900 flex items-start gap-1.5">
              <span className="text-sky-600 font-bold shrink-0">ℹ️ Note:</span>
              <span>Add our bot <strong className="text-sky-950 font-black">@AppleFarmOfficialBot</strong> as Admin to your channel so it can automatically verify members!</span>
            </div>

            {/* Action Buttons (Cancel & Pay & Launch) */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-black text-xs border border-slate-200 shadow-sm transition-all text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleLaunchCampaign}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-b from-[#2ecc71] to-[#20a058] hover:brightness-105 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-500/20 border-t border-emerald-300 transition-all text-center flex items-center justify-center gap-1.5"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : !walletConnected ? (
                  <span>Connect Wallet</span>
                ) : (
                  <span>Pay & Launch</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🎁 CASHBACK FADED WHEEL MODAL (Launch Campaign Bonus)    */}
      {/* ========================================================= */}
      {isCashbackWheelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#f8fbff] to-[#edf5fc] rounded-3xl p-5 border border-sky-100 shadow-[0_20px_50px_rgba(0,100,200,0.22)] flex flex-col items-center text-[#192f52] select-none">
            
            {/* Close Button (only when not spinning) */}
            {!isCashbackSpinning && (
              <button 
                onClick={() => setIsCashbackWheelOpen(false)}
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 px-3.5 py-1 rounded-full text-[11px] font-black text-amber-800 mb-2 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-600" />
              <span>Job Launch Cashback Wheel!</span>
            </div>

            <h3 className="text-lg font-black text-[#192f52] text-center tracking-tight mb-0.5">
              Cashback Faded Wheel
            </h3>
            <p className="text-xs font-bold text-[#567396] text-center mb-3">
              Spin to get up to <strong className="text-amber-600 font-black">150% Refund</strong> on your {cashbackPaidAmount} GRAM payment!
            </p>

            {/* 🎮 3x3 GRID (8 Outer Boxes + 1 Center SPIN Button) */}
            <div className="w-full grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-[#eaf4fd] border border-sky-200/70 shadow-inner my-1">
              
              {/* Row 1 */}
              {renderCashbackCell(0)} {/* Top-Left: 150% */}
              {renderCashbackCell(1)} {/* Top-Center: 50% */}
              {renderCashbackCell(2)} {/* Top-Right: Empty */}

              {/* Row 2 */}
              {renderCashbackCell(7)} {/* Middle-Left: Empty */}

              {/* 🎯 CENTER SPIN BUTTON (Cell 4) */}
              <div className="aspect-square rounded-2xl flex items-center justify-center p-0.5">
                {isCashbackClaimed && !isCashbackSpinning ? (
                  <button 
                    disabled
                    className="w-full h-full rounded-xl bg-slate-200/80 border border-slate-300 flex flex-col items-center justify-center text-slate-500 cursor-not-allowed shadow-inner text-xs font-black gap-1"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px]">Claimed</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSpinCashbackWheel}
                    disabled={isCashbackSpinning || isCashbackClaimed}
                    className={`w-full h-full rounded-xl flex flex-col items-center justify-center gap-1 font-black text-white transition-all shadow-[0_4px_0_#145a32] border-t-2 border-emerald-300 bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-110 active:scale-90 active:shadow-[0_1px_0_#145a32] cursor-pointer ${
                      isCashbackSpinning 
                        ? 'opacity-85 cursor-not-allowed animate-pulse' 
                        : 'animate-bounce-gentle shadow-[0_0_15px_rgba(46,204,113,0.4)]'
                    }`}
                  >
                    <RotateCw className={`w-5 h-5 text-white stroke-[2.5] ${isCashbackSpinning ? 'animate-spin' : ''}`} />
                    <span className="text-xs tracking-wider uppercase drop-shadow font-black">
                      {isCashbackSpinning ? 'SPINNING' : 'SPIN'}
                    </span>
                  </button>
                )}
              </div>

              {renderCashbackCell(3)} {/* Middle-Right: 25% */}

              {/* Row 3 */}
              {renderCashbackCell(6)} {/* Bottom-Left: 5% */}
              {renderCashbackCell(5)} {/* Bottom-Center: 10% */}
              {renderCashbackCell(4)} {/* Bottom-Right: 15% */}

            </div>

            {/* Won Prize Announcement Banner */}
            {cashbackWonPrize && !isCashbackSpinning && (
              <div className={`mt-3 w-full border rounded-2xl p-2.5 px-4 flex items-center justify-center text-white shadow-md text-center animate-bounce-gentle ${
                cashbackWonPrize.percentage > 0 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-400' 
                  : 'bg-gradient-to-r from-slate-500 to-slate-600 border-slate-400'
              }`}>
                <span className="text-xs font-black">
                  {cashbackWonPrize.percentage > 0 
                    ? `🎉 Won +${cashbackWonPrize.cashbackAmountGram} GRAM (${cashbackWonPrize.label}) Cashback!`
                    : `Better luck next time! Your campaign is live and active.`
                  }
                </span>
              </div>
            )}

            {/* Bottom Modal Action Buttons */}
            <div className="w-full mt-3">
              {cashbackWonPrize && cashbackWonPrize.percentage > 0 ? (
                <button 
                  onClick={handleClaimCashbackToWallet}
                  className="w-full py-3 rounded-2xl bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 text-white font-black text-xs shadow-[0_3px_0_#145a32] border-t border-emerald-300 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Claim to TON Wallet (+{cashbackWonPrize.cashbackAmountGram} GRAM)</span>
                </button>
              ) : (
                <button 
                  onClick={() => setIsCashbackWheelOpen(false)}
                  disabled={isCashbackSpinning}
                  className="w-full py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 font-black text-xs text-slate-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCashbackClaimed ? 'Done' : 'Close'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ----------------- BOTTOM NAVIGATION BAR ----------------- */}
      <BottomNav currentTab="task" onNavigate={onNavigate} />

    </div>
  );
}

