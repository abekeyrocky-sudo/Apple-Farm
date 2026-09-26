import React, { useState, useEffect } from 'react';
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
  ArrowRight
} from 'lucide-react';
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
        id: 'task_1',
        title: 'Watch 5 Ads',
        reward: '+50 Apples',
        rewardAmount: 50,
        rewardCurrency: 'apple',
        type: 'Daily',
        status: 'Go', // 'Go' | 'Claim' | 'Claimed'
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
    ];

    try {
      const saved = localStorage.getItem('apple_farm_std_task_states');
      if (saved) {
        const states = JSON.parse(saved);
        return defaultTasks.map(t => ({
          ...t,
          status: states[t.id] || t.status
        }));
      }
    } catch (e) {}
    return defaultTasks;
  });

  // রিয়েল পার্টনার টাস্ক তালিকা
  const [partnerTasks, setPartnerTasks] = useState(() => {
    try {
      localStorage.removeItem('apple_farm_partner_tasks');
      localStorage.removeItem('partner_tasks');
      const saved = localStorage.getItem('apple_farm_partner_tasks_real');
      let savedStates = {};
      try {
        savedStates = JSON.parse(localStorage.getItem('apple_farm_partner_task_states') || '{}');
      } catch (e) {}
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(t => ({
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
          try {
            const states = updated.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.status }), {});
            localStorage.setItem('apple_farm_std_task_states', JSON.stringify(states));
          } catch (e) {}
        }
        return changed ? updated : prev;
      });
    }
  }, [user?.airdropTasks?.joinTg, user?.communityJoined]);

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
          try {
            const states = updated.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.status }), {});
            localStorage.setItem('apple_farm_std_task_states', JSON.stringify(states));
          } catch (e) {}
          return updated;
        });
        return;
      }

      if (task.actionUrl === 'daily_reward') {
        if (onOpenDailyReward) onOpenDailyReward();
        return;
      }

      if (task.actionUrl) {
        onNavigate?.(task.actionUrl);
        return;
      }

      setStandardTasks(prev => {
        const updated = prev.map(t => t.id === task.id ? { ...t, status: 'Claim' } : t);
        try {
          const states = updated.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.status }), {});
          localStorage.setItem('apple_farm_std_task_states', JSON.stringify(states));
        } catch (e) {}
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
              try {
                const states = updated.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.status }), {});
                localStorage.setItem('apple_farm_std_task_states', JSON.stringify(states));
              } catch (e) {}
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
            try {
              const states = updated.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.status }), {});
              localStorage.setItem('apple_farm_std_task_states', JSON.stringify(states));
            } catch (e) {}
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
        try {
          const states = updated.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.status }), {});
          localStorage.setItem('apple_farm_std_task_states', JSON.stringify(states));
        } catch (e) {}
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
        try {
          const states = updated.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.status }), {});
          localStorage.setItem('apple_farm_std_task_states', JSON.stringify(states));
        } catch (e) {}
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
      try {
        const currentStates = JSON.parse(localStorage.getItem('apple_farm_partner_task_states') || '{}');
        currentStates[task.id] = statusVal;
        localStorage.setItem('apple_farm_partner_task_states', JSON.stringify(currentStates));
      } catch (e) {}

      setPartnerTasks(prev => {
        const updated = prev.map(t => t.id === task.id ? { ...t, status: statusVal, ...extraFields } : t);
        try {
          localStorage.setItem('apple_farm_partner_tasks_real', JSON.stringify(updated));
        } catch (e) {}
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

      soundManager.play('reward');
      if (onShowPopup) {
        onShowPopup({
          type: 'success',
          title: 'Partner Task Created',
          message: `Your campaign is now live for ${postForm.targetMembers} members.`,
          confirmText: 'Awesome'
        });
      }
    } catch (err) {
      console.error('Payment error:', err);
      if (err.message && !err.message.includes('User rejects')) {
        alert(`Payment failed: ${err.message || 'Error occurred'}`);
      }
    } finally {
      setIsProcessingPayment(false);
    }
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

              {/* + Post Button */}
              <button
                onClick={() => {
                  soundManager.play('click');
                  setIsPostModalOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-500/30 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Post</span>
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
                              <img src={diamondImg} alt="💎" className="w-3.5 h-3.5 object-contain" />
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
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-xs"
                  >
                    + Post First Campaign
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
                        <img src={diamondImg} alt="💎" className="w-3 h-3 object-contain" />
                        <span>+{calculateRewardDiamonds(task.bidPerMember)} 💎/worker</span>
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
                  <p className="text-xs font-bold text-[#4c739e]">
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

      {/* ----------------- BOTTOM NAVIGATION BAR ----------------- */}
      <BottomNav currentTab="task" onNavigate={onNavigate} />

    </div>
  );
}

