import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Rocket, 
  Lock, 
  Wallet, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  TrendingUp, 
  PieChart, 
  Clock, 
  ShieldCheck, 
  Coins, 
  Layers, 
  ArrowRight,
  Flame,
  Star,
  Info,
  X
} from 'lucide-react';
import { TonConnectUI } from '@tonconnect/ui';
import confetti from 'canvas-confetti';
import BottomNav from '../components/BottomNav';
import CustomTitleBar from '../components/CustomTitleBar';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import appleJettonImg from '../../assets/apple-jetton.png';
import verifyBadgeImg from '../../assets/verify-badge.png';
import { soundManager } from '../utils/soundManager';
import { verifyTelegramMembership, OFFICIAL_COMMUNITY_URL } from '../utils/telegramVerify';
import { getStoredJson, setStoredJson } from '../utils/userStorage';
import { 
  AIRDROP_CONFIG, 
  AIRDROP_ROADMAP, 
  calculateEstimatedAirdrop, 
  formatTokenNumber 
} from '../utils/airdropSystem';

export default function AirdropPage({ user, onBack, onNavigate, onUpdateUser, onShowPopup }) {
  // Navigation Tabs: 'tasks' | 'allocation' | 'roadmap'
  const [activeTab, setActiveTab] = useState('tasks');
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

  // Live ticking countdown: 08:09:17 style
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 9,
    seconds: 17
  });

  const [copiedContract, setCopiedContract] = useState(false);

  const currentApples = user?.apples || 0;
  const is50kReached = currentApples >= 50000;
  const invitedCount = Array.isArray(user?.invitedFriends) 
    ? user.invitedFriends.length 
    : (user?.referrals?.length || user?.referralCount || 0);

  // Real task completion states from user DB
  const [tasks, setTasks] = useState({
    followX: !!user?.airdropTasks?.followX,
    joinTg: !!user?.airdropTasks?.joinTg,
    reach50kApples: is50kReached,
    inviteFriends: invitedCount >= 5,
    wallet: !!user?.airdropTasks?.walletVerified,
  });

  const [claimed, setClaimed] = useState(!!user?.airdropClaimed);
  const [toastMsg, setToastMsg] = useState('');
  
  // Go → Verify step tracker
  const [taskStep, setTaskStep] = useState({ followX: 'go', joinTg: 'go' });
  const [isVerifyingTg, setIsVerifyingTg] = useState(false);
  const [isVerifyingWallet, setIsVerifyingWallet] = useState(false);

  // TON Connect State
  const [tonConnectUI, setTonConnectUI] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // TON Connect ইনিশিয়ালাইজেশন
  useEffect(() => {
    try {
      const manifest = window.location.origin + '/tonconnect-manifest.json';
      const tc = window.__tonConnectUI || new TonConnectUI({ manifestUrl: manifest });
      window.__tonConnectUI = tc;
      setTonConnectUI(tc);

      if (tc.wallet) {
        setIsWalletConnected(true);
        setWalletAddress(tc.wallet.account.address);
      }

      const unsubscribe = tc.onStatusChange((wallet) => {
        if (wallet) {
          setIsWalletConnected(true);
          setWalletAddress(wallet.account.address);
        } else {
          setIsWalletConnected(false);
          setWalletAddress('');
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (e) {
      console.warn('TonConnectUI init in AirdropPage:', e);
    }
  }, []);

  // Update tasks if user props update
  useEffect(() => {
    setTasks(prev => ({
      ...prev,
      followX: !!user?.airdropTasks?.followX,
      joinTg: !!user?.airdropTasks?.joinTg,
      reach50kApples: currentApples >= 50000,
      inviteFriends: invitedCount >= 5,
      wallet: !!user?.airdropTasks?.walletVerified,
    }));
  }, [user, currentApples, invitedCount]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleCopyContract = () => {
    soundManager.playClickSound();
    navigator.clipboard.writeText(AIRDROP_CONFIG.contractAddress);
    setCopiedContract(true);
    showToast('Contract address copied to clipboard!');
    setTimeout(() => setCopiedContract(false), 2000);
  };

  // প্রথম ৪টি টাস্ক কমপ্লিট কি না চেক
  const first4TasksDone = tasks.followX && tasks.joinTg && is50kReached && (invitedCount >= 5);

  const handleTaskClick = async (key) => {
    soundManager.playClickSound();
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    if (key === 'followX') {
      if (tasks.followX) return;
      if (taskStep.followX === 'go') {
        window.open('https://x.com/AppleFarmTMA', '_blank');
        setTaskStep(prev => ({ ...prev, followX: 'verify' }));
      } else if (taskStep.followX === 'verify') {
        const updated = { ...user?.airdropTasks, followX: true };
        setTasks(prev => ({ ...prev, followX: true }));
        onUpdateUser?.({ airdropTasks: updated });
        showToast('Follow on X verified');
      }
    } else if (key === 'joinTg') {
      if (tasks.joinTg) return;
      if (taskStep.joinTg === 'go') {
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
        setTaskStep(prev => ({ ...prev, joinTg: 'verify' }));
      } else if (taskStep.joinTg === 'verify') {
        setIsVerifyingTg(true);
        try {
          const verifyResult = await verifyTelegramMembership(user?.id, OFFICIAL_COMMUNITY_URL);
          setIsVerifyingTg(false);

          if (verifyResult.verified) {
            const updated = { ...user?.airdropTasks, joinTg: true };
            setTasks(prev => ({ ...prev, joinTg: true }));
            onUpdateUser?.({ airdropTasks: updated, communityJoined: true });

            const states = getStoredJson('apple_farm_std_task_states', user?.id, {});
            if (states['task_community'] !== 'Claimed') {
              states['task_community'] = 'Claim';
              setStoredJson('apple_farm_std_task_states', user?.id, states);
            }

            soundManager.play('reward');
            if (window.Telegram?.WebApp?.HapticFeedback) {
              window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
            showToast('Joined Community verified!');
          } else {
            if (window.Telegram?.WebApp?.HapticFeedback) {
              window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
            setTaskStep(prev => ({ ...prev, joinTg: 'go' }));
            if (onShowPopup) {
              onShowPopup({
                type: 'warn',
                title: verifyResult.notAdmin ? 'Bot Admin Required' : 'Join Not Found',
                message: verifyResult.message || 'You have not joined our Telegram channel yet. Please click Go, join the channel, and then click Verify.',
                confirmText: 'Got It'
              });
            } else {
              showToast(verifyResult.message || 'Please join channel first!');
            }
          }
        } catch (err) {
          setIsVerifyingTg(false);
          setTaskStep(prev => ({ ...prev, joinTg: 'go' }));
          showToast('Verification failed. Try again.');
        }
      }
    } else if (key === 'harvest') {
      onNavigate?.('home');
    } else if (key === 'invite') {
      onNavigate?.('invite');
    }
  };

  // 💎 ৫ নম্বর টাস্ক: ওয়ালেট ভেরিফাই (0.19 TON ফি সহ)
  const handleVerifyWalletTask = async () => {
    soundManager.playClickSound();

    if (!first4TasksDone) {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
      }
      showToast('Please complete the first 4 tasks before verifying wallet');
      return;
    }

    if (tasks.wallet) {
      showToast('Wallet is already verified');
      return;
    }

    if (!isWalletConnected || !tonConnectUI?.wallet) {
      try {
        await tonConnectUI.openModal();
      } catch (e) {
        console.error('Wallet modal error:', e);
      }
      return;
    }

    setIsVerifyingWallet(true);

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: AIRDROP_CONFIG.masterWalletAddress,
            amount: AIRDROP_CONFIG.walletVerifyFeeNano, // 0.19 TON
          },
        ],
      };

      const txResult = await tonConnectUI.sendTransaction(transaction);
      console.log('[Airdrop Wallet Verify Fee Success]:', txResult);

      soundManager.playSuccessSound();
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      const updated = { 
        ...user?.airdropTasks, 
        walletVerified: true, 
        verifiedAddress: walletAddress || tonConnectUI.wallet.account.address 
      };

      setTasks(prev => ({ ...prev, wallet: true }));
      onUpdateUser?.({ airdropTasks: updated });

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });

      setIsVerifyingWallet(false);
      showToast('Wallet Verified Successfully. Airdrop Ready');
    } catch (err) {
      console.warn('[Airdrop Wallet Verify Failed/Rejected]:', err);
      setIsVerifyingWallet(false);
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
      showToast('Task Failed: Insufficient TON balance or transaction rejected');
    }
  };

  // Calculate completed count & progress
  const appleScore = is50kReached ? 1 : Math.min(1, currentApples / 50000);
  const inviteScore = invitedCount >= 5 ? 1 : invitedCount / 5;
  const completedCount = 
    (tasks.followX ? 1 : 0) +
    (tasks.joinTg ? 1 : 0) +
    appleScore +
    inviteScore +
    (tasks.wallet ? 1 : 0);

  const progressPercent = Math.min(100, Math.round((completedCount / 5) * 100));

  const handleClaim = () => {
    if (!first4TasksDone || !tasks.wallet) {
      showToast('Complete all 5 tasks including Wallet Verification first');
      return;
    }

    soundManager.playSuccessSound();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });
    setClaimed(true);
    onUpdateUser?.({ airdropClaimed: true });
    showToast('$APPLE Airdrop slot reserved successfully');
  };

  const pad = (n) => String(n).padStart(2, '0');

  // Allocation metrics
  const estimatedAllocation = calculateEstimatedAirdrop(user);

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#eaf6ff] via-[#f4f9ff] to-[#e8f5e9] flex flex-col justify-between select-none overflow-hidden font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#192f52] text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 animate-fade-in text-center max-w-[90%]">
          {toastMsg}
        </div>
      )}

      {/* ----------------- TOP HEADER AREA ----------------- */}
      <div className="pt-2 px-4 pb-2 z-20">
        <CustomTitleBar title="Apple Farm" darkText={true} />
        <div className="flex items-center justify-between relative mt-1">
          {/* Back Button */}
          <button
            onClick={onBack || (() => onNavigate?.('home'))}
            className="w-10 h-10 rounded-full bg-white/90 shadow-sm border border-slate-200 flex items-center justify-center text-[#192f52] active:scale-90 transition-transform cursor-pointer"
          >
            <svg className="w-6 h-6 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title with Jetton Icon */}
          <div className="flex items-center justify-center gap-2 flex-1 pr-10">
            <img 
              src={appleJettonImg} 
              alt="Apple Jetton" 
              className="w-8 h-8 object-contain filter drop-shadow-sm" 
            />
            <div className="text-left">
              <h1 className="text-lg font-black text-[#192f52] tracking-tight leading-tight">
                Airdrop Hub
              </h1>
              <p className="text-[10px] font-bold text-[#567396] leading-none">
                {AIRDROP_CONFIG.tokenName} ({AIRDROP_CONFIG.tokenSymbol})
              </p>
            </div>
          </div>
        </div>

        {/* 🌟 3 TABS SWITCHER 🌟 */}
        <div className="grid grid-cols-3 gap-1.5 bg-white/80 p-1.5 rounded-2xl border border-slate-200/80 shadow-sm mt-3 backdrop-blur-md">
          <button
            onClick={() => {
              soundManager.playClickSound();
              setActiveTab('tasks');
            }}
            className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-gradient-to-r from-[#2ecc71] to-[#27ae60] text-white shadow-sm'
                : 'text-[#567396] hover:text-[#192f52]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Eligibility</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClickSound();
              setActiveTab('allocation');
            }}
            className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'allocation'
                ? 'bg-gradient-to-r from-[#2ecc71] to-[#27ae60] text-white shadow-sm'
                : 'text-[#567396] hover:text-[#192f52]'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Allocation</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClickSound();
              setActiveTab('roadmap');
            }}
            className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'roadmap'
                ? 'bg-gradient-to-r from-[#2ecc71] to-[#27ae60] text-white shadow-sm'
                : 'text-[#567396] hover:text-[#192f52]'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Roadmap</span>
          </button>
        </div>
      </div>

      {/* ----------------- MAIN TAB CONTENTS ----------------- */}
      <div className="flex-1 w-full pt-1 flex flex-col z-10 overflow-y-auto px-4 pb-20">
        
        {/* ========================================================================= */}
        {/* 📋 TAB 1: TASKS & ELIGIBILITY                                              */}
        {/* ========================================================================= */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            
            {/* Top Eligibility Progress Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-sky-100 shadow-[0_4px_16px_rgba(0,140,255,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                    <Coins className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#192f52]">Airdrop Eligibility</h3>
                    <p className="text-[11px] font-bold text-[#567396]">Complete all 5 tasks below</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {progressPercent}% Done
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-3 p-0.5 overflow-hidden mb-2">
                <div 
                  className="bg-gradient-to-r from-[#2ecc71] to-[#27ae60] h-full rounded-full transition-all duration-500 shadow-xs"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {progressPercent === 100 ? (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-2.5 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-xs font-extrabold text-emerald-800 leading-tight">
                    Congratulations! You are 100% Eligible for $APPLE Airdrop.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] font-bold text-[#567396] text-center">
                  Unlock final wallet verification by finishing tasks 1-4.
                </p>
              )}
            </div>

            {/* Checklist Items */}
            <div className="flex flex-col gap-2.5">
              
              {/* 🌟 1. Join Community 🌟 */}
              <div className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-white/95 border border-slate-100 shadow-sm transition-all">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#229ED9] flex items-center justify-center text-white shadow-xs flex-shrink-0">
                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#192f52] leading-tight">Join Community</h3>
                  </div>
                </div>

                {tasks.joinTg ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : taskStep.joinTg === 'verify' ? (
                  <button
                    onClick={() => handleTaskClick('joinTg')}
                    disabled={isVerifyingTg}
                    className="text-xs font-black px-3.5 py-1.5 rounded-xl bg-blue-500 text-white active:scale-95 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    {isVerifyingTg && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isVerifyingTg ? 'Checking...' : 'Verify'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleTaskClick('joinTg')}
                    className="text-xs font-black px-4 py-1.5 rounded-xl bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] text-white active:scale-95 transition-all shadow-sm cursor-pointer"
                  >
                    Go
                  </button>
                )}
              </div>

              {/* 🌟 2. Follow on X 🌟 */}
              <div className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-white/95 border border-slate-100 shadow-sm transition-all">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white shadow-xs flex-shrink-0">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#192f52] leading-tight">Follow on X</h3>
                  </div>
                </div>

                {tasks.followX ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : taskStep.followX === 'verify' ? (
                  <button
                    onClick={() => handleTaskClick('followX')}
                    className="text-xs font-black px-3.5 py-1.5 rounded-xl bg-blue-500 text-white active:scale-95 transition-all shadow-sm cursor-pointer"
                  >
                    Verify
                  </button>
                ) : (
                  <button
                    onClick={() => handleTaskClick('followX')}
                    className="text-xs font-black px-4 py-1.5 rounded-xl bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] text-white active:scale-95 transition-all shadow-sm cursor-pointer"
                  >
                    Go
                  </button>
                )}
              </div>

              {/* 🌟 3. Reach 50,000 APPLE 🌟 */}
              <div 
                onClick={() => handleTaskClick('harvest')}
                className="p-3.5 px-4 rounded-2xl bg-white/95 border border-slate-100 hover:border-slate-300 shadow-sm cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                      <img src={appleImg} alt="Apple" className="w-9 h-9 object-contain filter drop-shadow-md" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#192f52] leading-tight">Reach 50,000 APPLE</h3>
                      <p className={`text-xs font-bold ${is50kReached ? 'text-emerald-600' : 'text-[#567396]'}`}>
                        {is50kReached ? 'Completed' : `${currentApples.toLocaleString()} / 50,000`}
                      </p>
                    </div>
                  </div>

                  {is50kReached ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-xs font-black text-slate-700 flex-shrink-0">
                      {Math.min(100, Math.round((currentApples / 50000) * 100))}%
                    </span>
                  )}
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 p-0.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (currentApples / 50000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* 🌟 4. Invite 5 Friends 🌟 */}
              <div 
                onClick={() => handleTaskClick('invite')}
                className="p-3.5 px-4 rounded-2xl bg-white/95 border border-slate-100 hover:border-slate-300 shadow-sm cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-xs flex-shrink-0">
                      <Users className="w-5 h-5 stroke-white stroke-[2.2]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#192f52] leading-tight">Invite 5 Friends</h3>
                      <p className={`text-xs font-bold ${invitedCount >= 5 ? 'text-emerald-600' : 'text-[#567396]'}`}>
                        {invitedCount >= 5 ? 'Completed' : `${invitedCount}/5 Friends`}
                      </p>
                    </div>
                  </div>

                  {invitedCount >= 5 ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-xs font-black text-slate-700 flex-shrink-0">
                      {invitedCount}/5
                    </span>
                  )}
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 p-0.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (invitedCount / 5) * 100)}%` }}
                  />
                </div>
              </div>

              {/* 🌟 5. Verify Wallet 🌟 */}
              <div 
                onClick={handleVerifyWalletTask}
                className={`flex items-center justify-between p-3.5 px-4 rounded-2xl border transition-all cursor-pointer ${
                  tasks.wallet
                    ? 'bg-emerald-50/70 border-emerald-200 shadow-sm'
                    : first4TasksDone
                    ? 'bg-white border-sky-300 shadow-md ring-2 ring-sky-100 active:scale-[0.98]'
                    : 'bg-slate-50/80 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs flex-shrink-0 ${
                    tasks.wallet 
                      ? 'bg-emerald-500' 
                      : first4TasksDone 
                      ? 'bg-[#0098EA]' 
                      : 'bg-slate-300'
                  }`}>
                    {tasks.wallet ? (
                      <Check className="w-5 h-5 stroke-white stroke-[3]" />
                    ) : first4TasksDone ? (
                      <Wallet className="w-5 h-5" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-[#192f52] leading-tight">Verify Wallet</h3>
                      {!first4TasksDone && (
                        <span className="text-[9px] font-black bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">
                          Locked
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-bold ${
                      tasks.wallet 
                        ? 'text-emerald-600' 
                        : first4TasksDone 
                        ? 'text-sky-600' 
                        : 'text-slate-400'
                    }`}>
                      {tasks.wallet 
                        ? 'Connected & Verified' 
                        : first4TasksDone 
                        ? (isWalletConnected ? 'Tap to Verify (0.19 TON)' : 'Connect Wallet to Verify') 
                        : 'Complete 4 tasks above first'}
                    </p>
                  </div>
                </div>

                {tasks.wallet ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : isVerifyingWallet ? (
                  <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : first4TasksDone ? (
                  <span className="bg-sky-50 text-sky-700 text-xs font-black px-3 py-1.5 rounded-xl border border-sky-200 flex-shrink-0">
                    {isWalletConnected ? 'Verify' : 'Connect'}
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-400 text-xs font-bold px-2.5 py-1 rounded-xl border border-slate-200 flex-shrink-0">
                    Locked
                  </span>
                )}
              </div>

            </div>

            {/* Countdown & Reserve Slot Button */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-slate-100 shadow-sm text-center">
              <p className="text-xs font-bold text-[#567396]">
                Snapshot Date: <span className="text-[#192f52] font-black">14 Oct</span> • Countdown: <span className="text-[#e74c3c] font-black text-sm">{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
              </p>

              <button
                onClick={handleClaim}
                disabled={claimed || !first4TasksDone || !tasks.wallet}
                className={`mt-2.5 w-full py-3.5 rounded-2xl font-black text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                  claimed
                    ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed shadow-none border border-emerald-200'
                    : (!first4TasksDone || !tasks.wallet)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-b from-[#2ecc71] to-[#1e824c] hover:brightness-105 text-white shadow-[0_4px_0_#145a32]'
                }`}
              >
                {claimed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-emerald-700" />
                    <span>Airdrop Slot Reserved</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 stroke-white" />
                    <span>Reserve $APPLE Airdrop</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 📊 TAB 2: ALLOCATION CALCULATOR & TOKENOMICS                              */}
        {/* ========================================================================= */}
        {activeTab === 'allocation' && (
          <div className="space-y-3">
            
            {/* 1. Allocation Coming Soon Card (100% Light Theme) */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-sky-100 shadow-[0_4px_16px_rgba(0,140,255,0.06)] relative overflow-hidden">
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-50 border border-amber-200 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-black text-[#192f52]">Token Allocation</h3>
                      {/* Info Tooltip / Button */}
                      <button
                        onClick={() => setShowCriteriaModal(true)}
                        className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-[#192f52] flex items-center justify-center transition-colors cursor-pointer"
                        title="View calculation criteria"
                      >
                        <Info className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <p className="text-[10px] font-bold text-[#567396]">Stage 3 Calculation</p>
                  </div>
                </div>

                <span className="text-[10px] font-black bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                  16 OCT 2026
                </span>
              </div>

              {/* Big Center Locked / Coming Soon Display */}
              <div className="text-center py-3">
                <div className="relative inline-block mb-2">
                  <img 
                    src={appleJettonImg} 
                    alt="Apple Jetton" 
                    className="w-16 h-16 object-contain filter drop-shadow-[0_6px_16px_rgba(251,191,36,0.35)] mx-auto" 
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-amber-400 flex items-center justify-center text-amber-600 shadow-sm">
                    <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                </div>

                <h2 className="text-2xl font-black text-[#192f52] tracking-tight">
                  Coming Soon
                </h2>
                <p className="text-xs font-bold text-[#567396] mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Official $APPLE allocation will be calculated on <span className="text-[#192f52] font-black underline decoration-amber-400">16 Oct</span> right after the 14 Oct snapshot.
                </p>

                {/* Info Trigger Pill Button */}
                <button
                  onClick={() => setShowCriteriaModal(true)}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-black text-[#32527b] active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>View Calculation Criteria</span>
                </button>

                {/* Verified Farmer Advantage Tag */}
                {(user?.isVerified || user?.verifiedBadge) ? (
                  <div className="mt-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-2.5 flex items-center justify-between text-left">
                    <div className="flex items-center gap-2">
                      <img src={verifyBadgeImg} alt="Verified Badge" className="w-5 h-5 object-contain flex-shrink-0" />
                      <div>
                        <span className="text-[11px] font-black text-blue-900 block leading-tight">Verified Farmer Advantage</span>
                        <span className="text-[10px] font-bold text-blue-600">Active • +15% Extra Allocation Priority Weight</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                      VIP
                    </span>
                  </div>
                ) : (
                  <div className="mt-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex items-center justify-between text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">
                        💎
                      </div>
                      <div>
                        <span className="text-[11px] font-black text-slate-700 block leading-tight">Standard Farmer Tier</span>
                        <span className="text-[10px] font-bold text-slate-400">Get Verify Badge in Market for +15% Bonus</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onNavigate?.('market')} 
                      className="text-[9px] font-black bg-slate-800 text-white px-2 py-0.5 rounded-full flex-shrink-0 hover:bg-black cursor-pointer active:scale-95"
                    >
                      Unlock
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Official Jetton Smart Contract Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img src={appleJettonImg} alt="Jetton" className="w-5 h-5 object-contain" />
                  <h3 className="text-sm font-black text-[#192f52]">Jetton Smart Contract</h3>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md whitespace-nowrap flex-shrink-0">
                  Ownership Revoked
                </span>
              </div>

              <p className="text-xs text-[#567396] font-bold mb-2">
                Official Jetton Master contract on TON Blockchain:
              </p>

              {/* Contract Box with Copy */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-mono font-bold text-slate-700 truncate select-all">
                  {AIRDROP_CONFIG.contractAddress}
                </span>

                <button
                  onClick={handleCopyContract}
                  className="p-1.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-100 active:scale-95 transition-all text-slate-700 flex-shrink-0 cursor-pointer"
                  title="Copy contract address"
                >
                  {copiedContract ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Tonviewer / Tonscan Link Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={AIRDROP_CONFIG.tonviewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-black flex items-center justify-center gap-1.5 hover:bg-sky-100 transition-colors"
                >
                  <span>Tonviewer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={AIRDROP_CONFIG.tonscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors"
                >
                  <span>Tonscan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* 3. Tokenomics Distribution Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-[#192f52]">$APPLE Tokenomics</h3>
                </div>
                <span className="text-xs font-black text-[#192f52]">
                  100M Supply
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-extrabold text-[#192f52]">Community Airdrop</span>
                  </div>
                  <span className="text-xs font-black text-emerald-700">70% (70M)</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/70 border border-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs font-extrabold text-[#192f52]">STON.fi DEX & CEX Liquidity</span>
                  </div>
                  <span className="text-xs font-black text-blue-700">15% (15M)</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/70 border border-purple-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-xs font-extrabold text-[#192f52]">Staking & Farm Yield</span>
                  </div>
                  <span className="text-xs font-black text-purple-700">10% (10M)</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-xs font-extrabold text-[#192f52]">Ecosystem & Growth</span>
                  </div>
                  <span className="text-xs font-black text-amber-700">5% (5M)</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 🗺️ TAB 3: ROADMAP & STON.FI DEX TRADING                                   */}
        {/* ========================================================================= */}
        {activeTab === 'roadmap' && (
          <div className="space-y-3">
            
            {/* 1. Live STON.fi DEX Trading Card */}
            <div className="bg-gradient-to-r from-[#0098EA] via-[#0081c7] to-[#005c8a] text-white rounded-3xl p-5 shadow-md border border-sky-300/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">STON.fi DEX Pool</h3>
                    <p className="text-xs text-sky-100 font-bold">Pair: APPLE / GRAM</p>
                  </div>
                </div>

                <span className="text-[10px] font-black bg-emerald-400 text-emerald-950 px-2.5 py-1 rounded-full animate-pulse shadow-sm whitespace-nowrap flex-shrink-0">
                  POOL ACTIVE
                </span>
              </div>

              <p className="text-xs text-sky-100 font-bold mb-3 leading-relaxed">
                Liquidity has been provided on STON.fi DEX. Swap $APPLE with GRAM & TON directly on-chain!
              </p>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={AIRDROP_CONFIG.stonfiSwapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 rounded-2xl bg-white text-[#0098EA] text-xs font-black flex items-center justify-center gap-1.5 shadow-md hover:bg-sky-50 active:scale-95 transition-all text-center"
                >
                  <span>Trade on STON.fi</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <a
                  href={AIRDROP_CONFIG.stonfiPoolUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 rounded-2xl bg-white/20 border border-white/40 text-white text-xs font-black flex items-center justify-center gap-1.5 hover:bg-white/30 active:scale-95 transition-all text-center"
                >
                  <span>View Pool</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* 2. 5-Phase Roadmap Timeline */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-[#192f52]">$APPLE Launch Roadmap</h3>
              </div>

              <div className="space-y-3 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {AIRDROP_ROADMAP.map((item) => (
                  <div key={item.id} className="relative flex items-start gap-3.5 pl-1">
                    {/* Circle Node */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black z-10 flex-shrink-0 shadow-xs ${
                      item.status === 'active'
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                        : item.status === 'completed'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {item.phase}
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-xs font-black text-[#192f52] leading-tight">{item.title}</h4>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md whitespace-nowrap flex-shrink-0 ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-[#567396] leading-relaxed">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Non-Custodial Claim Preview Portal */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-black text-[#192f52]">Claim Portal</h3>
              </div>

              <p className="text-xs text-[#567396] font-bold leading-relaxed mb-3">
                Tokens will be claimable directly to your verified TON Wallet upon completion of the official snapshot audit.
              </p>

              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-700 block">Claim Destination</span>
                  <span className="text-xs font-mono font-black text-purple-950 truncate max-w-[180px] block">
                    {tasks.wallet ? (walletAddress || 'Verified TON Wallet') : 'No Wallet Verified'}
                  </span>
                </div>

                <span className="text-xs font-black bg-purple-200/80 text-purple-900 px-3 py-1.5 rounded-xl whitespace-nowrap flex-shrink-0">
                  {tasks.wallet ? 'Ready for TGE' : 'Verify First'}
                </span>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ----------------- BOTTOM NAVIGATION BAR ----------------- */}
      <BottomNav currentTab="airdrop" onNavigate={onNavigate} />

      {/* ========================================================= */}
      {/* ℹ️ ALLOCATION CRITERIA INFO MODAL (Clean Light Theme)      */}
      {/* ========================================================= */}
      {showCriteriaModal && (
        <div 
          onClick={() => setShowCriteriaModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-5 w-full max-w-xs shadow-2xl border border-slate-100 space-y-3.5 animate-scale-up"
          >
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#192f52]">Calculation Criteria</h3>
                  <p className="text-[10px] font-bold text-[#567396]">Airdrop Score Factors</p>
                </div>
              </div>

              <button
                onClick={() => setShowCriteriaModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer active:scale-90 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-bold text-[#567396] leading-relaxed">
              Your final $APPLE airdrop allocation on 16 Oct will be determined by 4 key factors:
            </p>

            <div className="space-y-2">
              <div className="p-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <img src={appleImg} alt="Apple" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#192f52]">Apples Harvested</h4>
                  <p className="text-[10px] font-bold text-emerald-700">Total harvested tree apples balance</p>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-sky-50/80 border border-sky-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                  <img src={diamondImg} alt="Diamond" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#192f52]">Diamonds Balance</h4>
                  <p className="text-[10px] font-bold text-sky-700">Diamond holdings multiplier</p>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#192f52]">Active Referrals</h4>
                  <p className="text-[10px] font-bold text-amber-700">Bonus for invited genuine friends</p>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-purple-50/80 border border-purple-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#192f52]">Verified TON Wallet</h4>
                  <p className="text-[10px] font-bold text-purple-700">Anti-bot verified wallet bonus</p>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <img src={verifyBadgeImg} alt="Badge" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#192f52]">Verified Farmer Status</h4>
                  <p className="text-[10px] font-bold text-blue-700">+15% allocation weight priority</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCriteriaModal(false)}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] text-white text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
