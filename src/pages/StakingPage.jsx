import React, { useState, useEffect } from 'react';
import { Wallet, Shield, Zap, Sparkles, Coins, Lock, LockOpen, Clock, Calendar, TrendingUp, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { TonConnectUI } from '@tonconnect/ui';
import confetti from 'canvas-confetti';
import BottomNav from '../components/BottomNav';
import CustomTitleBar from '../components/CustomTitleBar';
import appleImg from '../../assets/apple.png';
import { soundManager } from '../utils/soundManager';
import { addTransaction } from '../utils/transactionHistory';

// Pool Configurations
const POOL_CONFIGS = {
  pool_3m: {
    id: 'pool_3m',
    name: 'Stake $APPLE (3 Months)',
    shortName: '3 Months Lock',
    badge: '15% / Month',
    months: 3,
    days: 90,
    monthlyRate: 15, // 15% per month
    totalRate: 45, // 15% * 3 = 45% total profit
    minStake: 100,
    accentColor: 'from-[#2ecc71] to-[#1e824c]',
    borderColor: 'border-emerald-200',
    tagBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bannerGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent'
  },
  pool_6m: {
    id: 'pool_6m',
    name: 'Stake $APPLE (6 Months)',
    shortName: '6 Months Lock',
    badge: '25% / Month',
    months: 6,
    days: 180,
    monthlyRate: 25, // 25% per month
    totalRate: 150, // 25% * 6 = 150% total profit
    minStake: 200,
    accentColor: 'from-[#f39c12] to-[#d35400]',
    borderColor: 'border-amber-200',
    tagBg: 'bg-amber-50 text-amber-700 border-amber-200',
    bannerGradient: 'from-amber-500/10 via-amber-500/5 to-transparent'
  }
};

const STAKING_STORAGE_KEY = 'apple_farm_staking_pools_v1';

const getInitialStakingData = () => {
  try {
    const raw = localStorage.getItem(STAKING_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse staking data from storage:', e);
  }
  return {
    pool_3m: { staked: 0, stakedAt: null, unlockAt: null },
    pool_6m: { staked: 0, stakedAt: null, unlockAt: null }
  };
};

export default function StakingPage({ 
  user = { apples: 0, diamonds: 0.0, id: null }, 
  onBack, 
  onNavigate,
  onUpdateUserBalance,
  onShowPopup
}) {
  // Real TON Connect Wallet State
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // Persistent Staking Data
  const [stakingData, setStakingData] = useState(getInitialStakingData);
  const [now, setNow] = useState(Date.now());

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'stake' | 'unstake' | 'info'
  const [selectedPoolId, setSelectedPoolId] = useState('pool_3m');
  const [inputAmount, setInputAmount] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Save staking data to LocalStorage whenever it changes
  const saveStakingData = (newData) => {
    setStakingData(newData);
    try {
      localStorage.setItem(STAKING_STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.error('Failed to save staking data:', e);
    }
  };

  // TON Connect UI Initialization
  useEffect(() => {
    let tonConnect;
    try {
      const manifest = window.location.origin + '/tonconnect-manifest.json';
      tonConnect = window.__tonConnectUI || new TonConnectUI({ manifestUrl: manifest });
      window.__tonConnectUI = tonConnect;

      if (tonConnect.wallet) {
        setIsWalletConnected(true);
        const rawAddr = tonConnect.wallet.account.address;
        setWalletAddress(rawAddr ? rawAddr.slice(0, 4) + '...' + rawAddr.slice(-4) : 'Connected');
      }

      const unsubscribe = tonConnect.onStatusChange((wallet) => {
        if (wallet) {
          setIsWalletConnected(true);
          const rawAddr = wallet.account.address;
          setWalletAddress(rawAddr ? rawAddr.slice(0, 4) + '...' + rawAddr.slice(-4) : 'Connected');
          showToast('TON Wallet Connected');
        } else {
          setIsWalletConnected(false);
          setWalletAddress('');
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (e) {
      console.warn('TonConnectUI init:', e);
    }
  }, []);

  // Real-time ticking effect for continuous reward calculation & lock countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const triggerHaptic = (type = 'light') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      if (type === 'success') {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      } else {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
      }
    }
  };

  // Real TON Connect Actions
  const handleOpenTonConnect = async () => {
    triggerHaptic('medium');
    try {
      if (window.__tonConnectUI) {
        await window.__tonConnectUI.openModal();
      } else {
        const manifest = window.location.origin + '/tonconnect-manifest.json';
        const tc = new TonConnectUI({ manifestUrl: manifest });
        window.__tonConnectUI = tc;
        await tc.openModal();
      }
    } catch (err) {
      console.error('TON Connect error:', err);
    }
  };

  const handleDisconnectWallet = async () => {
    triggerHaptic('light');
    try {
      if (window.__tonConnectUI) {
        await window.__tonConnectUI.disconnect();
      }
      setIsWalletConnected(false);
      setWalletAddress('');
      showToast('Wallet disconnected');
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  // Helper to compute pool metrics (Staked, Earned, Lock status)
  const getPoolMetrics = (poolId) => {
    const config = POOL_CONFIGS[poolId];
    const data = stakingData[poolId] || { staked: 0, stakedAt: null, unlockAt: null };
    const staked = Number(data.staked) || 0;

    if (staked <= 0 || !data.stakedAt || !data.unlockAt) {
      return {
        staked: 0,
        accruedRewards: 0,
        totalExpectedProfit: 0,
        totalPayoutAtMaturity: 0,
        isLocked: false,
        isMatured: false,
        remainingSec: 0,
        remainingDays: 0,
        progressPct: 0,
        unlockDateFormatted: '--'
      };
    }

    const totalDurationSec = config.days * 86400;
    const elapsedSec = Math.max(0, Math.min((now - data.stakedAt) / 1000, totalDurationSec));
    const rewardPerSec = (staked * (config.totalRate / 100)) / totalDurationSec;
    const accruedRewards = rewardPerSec * elapsedSec;

    const totalExpectedProfit = staked * (config.totalRate / 100);
    const totalPayoutAtMaturity = staked + totalExpectedProfit;

    const remainingSec = Math.max(0, Math.floor((data.unlockAt - now) / 1000));
    const remainingDays = Math.ceil(remainingSec / 86400);
    const isLocked = remainingSec > 0;
    const isMatured = remainingSec === 0;
    const progressPct = Math.min(100, Math.round((elapsedSec / totalDurationSec) * 100));

    const unlockDate = new Date(data.unlockAt);
    const unlockDateFormatted = unlockDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return {
      staked,
      accruedRewards,
      totalExpectedProfit,
      totalPayoutAtMaturity,
      isLocked,
      isMatured,
      remainingSec,
      remainingDays,
      progressPct,
      unlockDateFormatted
    };
  };

  // Open Stake Dialog
  const openStakeModal = (poolId) => {
    if (!isWalletConnected) {
      handleOpenTonConnect();
      return;
    }
    setSelectedPoolId(poolId);
    setInputAmount('');
    setActiveModal('stake');
    triggerHaptic('light');
  };

  // Open Unstake Dialog
  const openUnstakeModal = (poolId) => {
    if (!isWalletConnected) {
      handleOpenTonConnect();
      return;
    }
    setSelectedPoolId(poolId);
    setInputAmount('');
    setActiveModal('unstake');
    triggerHaptic('light');
  };

  // Open Info Dialog
  const openInfoModal = (poolId) => {
    setSelectedPoolId(poolId);
    setActiveModal('info');
    triggerHaptic('light');
  };

  // Confirm Stake Submission
  const handleConfirmStake = (e) => {
    e.preventDefault();
    const config = POOL_CONFIGS[selectedPoolId];
    const amount = parseInt(inputAmount, 10);

    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount');
      return;
    }

    if (amount < config.minStake) {
      showToast(`Minimum stake is ${config.minStake} Apples`);
      return;
    }

    const maxAvailable = user.apples || 0;
    if (amount > maxAvailable) {
      showToast(`Insufficient balance. Max available: ${maxAvailable.toLocaleString()}`);
      return;
    }

    const currentData = stakingData[selectedPoolId] || { staked: 0 };
    const newStakedAmount = (currentData.staked || 0) + amount;
    const stakedAt = Date.now();
    const unlockAt = stakedAt + config.days * 86400 * 1000;

    const updatedStaking = {
      ...stakingData,
      [selectedPoolId]: {
        staked: newStakedAmount,
        stakedAt: stakedAt,
        unlockAt: unlockAt
      }
    };

    saveStakingData(updatedStaking);

    // Deduct user balance
    if (onUpdateUserBalance) {
      onUpdateUserBalance({ apples: -amount });
    }

    // Record in Transaction History
    addTransaction({
      userId: user?.id,
      title: `Staked in ${config.shortName}`,
      subtitle: `${config.badge} (${config.months} Months Lock)`,
      amount: `-${amount}`,
      currency: 'apple',
      type: 'spend',
      category: 'stake',
      status: 'Locked'
    });

    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    soundManager.play('reward');
    triggerHaptic('success');

    if (onShowPopup) {
      onShowPopup({
        type: 'success',
        title: 'Staking Successful',
        message: `You have successfully staked ${amount.toLocaleString()} Apples for ${config.months} months at ${config.monthlyRate}% monthly profit.`,
        confirmText: 'Awesome'
      });
    } else {
      showToast(`Staked ${amount.toLocaleString()} Apples successfully`);
    }

    setActiveModal(null);
  };

  // Confirm Unstake & Claim Submission
  const handleConfirmUnstake = (e) => {
    e.preventDefault();
    const config = POOL_CONFIGS[selectedPoolId];
    const metrics = getPoolMetrics(selectedPoolId);

    if (metrics.staked <= 0) {
      showToast('No staked balance found');
      return;
    }

    // If still locked, warn user
    if (metrics.isLocked) {
      showToast(`Pool is locked. Remaining: ${metrics.remainingDays} days`);
      return;
    }

    // When matured: payout = principal + total profit
    const totalClaimAmount = Math.round(metrics.totalPayoutAtMaturity);
    const profitOnly = Math.round(metrics.totalExpectedProfit);

    // Reset pool state
    const updatedStaking = {
      ...stakingData,
      [selectedPoolId]: {
        staked: 0,
        stakedAt: null,
        unlockAt: null
      }
    };

    saveStakingData(updatedStaking);

    // Credit back to user balance (Principal + Profit)
    if (onUpdateUserBalance) {
      onUpdateUserBalance({ apples: totalClaimAmount });
    }

    // Record in Transaction History
    addTransaction({
      userId: user?.id,
      title: `Claimed ${config.shortName}`,
      subtitle: `Principal: ${metrics.staked} + Profit: ${profitOnly}`,
      amount: `+${totalClaimAmount}`,
      currency: 'apple',
      type: 'earn',
      category: 'stake',
      status: 'Completed'
    });

    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    soundManager.play('reward');
    triggerHaptic('success');

    if (onShowPopup) {
      onShowPopup({
        type: 'reward',
        title: 'Staking Claimed',
        message: `Congratulations. You received ${totalClaimAmount.toLocaleString()} Apples (Principal + ${profitOnly.toLocaleString()} Profit) into your balance.`,
        rewardAmount: totalClaimAmount,
        rewardType: 'apple'
      });
    } else {
      showToast(`Claimed +${totalClaimAmount.toLocaleString()} Apples successfully`);
    }

    setActiveModal(null);
  };

  const activePoolConfig = POOL_CONFIGS[selectedPoolId];
  const activePoolMetrics = getPoolMetrics(selectedPoolId);

  // Profit calculation for interactive modal preview
  const previewAmount = parseInt(inputAmount, 10) || 0;
  const previewMonthlyProfit = Math.round(previewAmount * (activePoolConfig.monthlyRate / 100));
  const previewTotalProfit = Math.round(previewAmount * (activePoolConfig.totalRate / 100));
  const previewTotalPayout = previewAmount + previewTotalProfit;
  const previewUnlockDate = new Date(Date.now() + activePoolConfig.days * 86400 * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#e3f4fc] via-[#eaf7f0] to-[#d8f3e5] flex flex-col justify-between select-none font-sans overflow-hidden">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1c324f] text-white text-xs font-black px-4 py-2.5 rounded-full shadow-2xl border border-white/20 animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* ----------------- TOP HEADER AREA ----------------- */}
      <div className="pt-2 px-4 pb-2 z-20">
        <CustomTitleBar title="Apple Farm" darkText={true} />
        <div className="flex items-center justify-between relative mb-1 mt-1">
          {/* Back Button */}
          <button 
            onClick={onBack || (() => onNavigate?.('wallet'))}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
          >
            <svg className="w-6 h-6 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title */}
          <h1 className="text-xl font-black text-[#192f52] tracking-tight text-center flex-1 pr-10">
            Staking Center
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-center text-xs font-bold text-[#627d98] mb-3">
          {isWalletConnected ? 'Wallet Connected' : '(Requires wallet connected)'}
        </p>

        {/* Connect / Connected Wallet Button */}
        <div className="flex justify-center mb-2">
          {isWalletConnected ? (
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2ecc71] animate-pulse"></span>
              <span className="text-xs font-black text-[#1c355e]">{walletAddress}</span>
              <button 
                onClick={handleDisconnectWallet}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 ml-1 underline cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenTonConnect}
              className="bg-white/95 hover:bg-white active:scale-95 backdrop-blur-md border border-sky-200 px-5 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 text-sm font-extrabold text-[#192f52] transition-all cursor-pointer"
            >
              <Wallet className="w-5 h-5 text-sky-600 stroke-[2.2]" />
              <span>Connect wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* ----------------- MAIN STAKING CARDS LIST ----------------- */}
      <div className="flex-1 px-4 py-2 space-y-4 overflow-y-auto z-10">
        
        {/* ================= CARD 1: 3 MONTHS LOCK (15% / MONTH) ================= */}
        {(() => {
          const cfg = POOL_CONFIGS.pool_3m;
          const m = getPoolMetrics('pool_3m');

          return (
            <div className="bg-white rounded-3xl p-5 shadow-[0_8px_25px_rgba(0,100,50,0.06)] border border-emerald-100 transition-all hover:shadow-md relative overflow-hidden">
              
              {/* Header row with Apple icon & Info button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={appleImg} 
                    alt="Apple" 
                    className="w-12 h-12 object-contain filter drop-shadow-md -rotate-6"
                  />
                  <div>
                    <h3 className="text-base font-black text-[#132c4a] leading-tight">
                      Stake $APPLE:
                    </h3>
                    <span className="text-sm font-black text-[#27ae60]">
                      15% APY
                    </span>
                  </div>
                </div>

                {/* Info Icon */}
                <button 
                  onClick={() => openInfoModal('pool_3m')}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold active:scale-90 transition-transform cursor-pointer"
                >
                  ⓘ
                </button>
              </div>

              {/* Staked Metrics Box */}
              <div className="space-y-2 mb-4 bg-[#F8FCF9] p-3.5 rounded-2xl border border-[#E4F4E8]">
                <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Staked</span>
                  </span>
                  <div className="flex items-center gap-1.5 font-black text-[#1c324f] text-sm">
                    <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                    <span>{m.staked.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Available rewards:</span>
                  </span>
                  <div className="flex items-center gap-1.5 font-black text-[#27ae60] text-sm">
                    <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                    <span>{m.accruedRewards.toFixed(1)}</span>
                  </div>
                </div>

                {/* Lock Status / Countdown */}
                {m.staked > 0 && (
                  <div className="pt-2 border-t border-[#E4F4E8] flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Lock Status:</span>
                    </span>
                    <span className={`font-black ${m.isMatured ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {m.isMatured ? 'Matured (Ready to Claim)' : `${m.remainingDays} Days left (${m.unlockDateFormatted})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Stake & Unstake */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => openStakeModal('pool_3m')}
                  className="bg-gradient-to-b from-[#2ecc71] to-[#1e824c] hover:brightness-105 active:scale-95 text-white font-black text-sm py-2.5 rounded-2xl shadow-[0_4px_0_#145a32] border-t border-emerald-300 transition-all text-center cursor-pointer"
                >
                  Stake
                </button>

                <button
                  onClick={() => openUnstakeModal('pool_3m')}
                  disabled={m.staked === 0}
                  className={`font-black text-sm py-2.5 rounded-2xl transition-all text-center ${
                    m.staked === 0 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : m.isMatured 
                        ? 'bg-gradient-to-b from-[#2ecc71] to-[#1e824c] text-white shadow-[0_4px_0_#145a32] border-t border-emerald-300 cursor-pointer active:scale-95'
                        : 'bg-gradient-to-b from-[#e74c3c] to-[#c0392b] text-white shadow-[0_4px_0_#922b21] border-t border-red-300 cursor-pointer active:scale-95'
                  }`}
                >
                  {m.isMatured ? 'Claim All' : 'Unstake'}
                </button>
              </div>

            </div>
          );
        })()}

        {/* ================= CARD 2: 6 MONTHS LOCK (25% / MONTH) ================= */}
        {(() => {
          const cfg = POOL_CONFIGS.pool_6m;
          const m = getPoolMetrics('pool_6m');

          return (
            <div className="bg-white rounded-3xl p-5 shadow-[0_8px_25px_rgba(0,100,50,0.06)] border border-amber-100 transition-all hover:shadow-md relative overflow-hidden">
              
              {/* Header row with Apple icon & Info button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={appleImg} 
                    alt="Apple" 
                    className="w-12 h-12 object-contain filter drop-shadow-md -rotate-6"
                  />
                  <div>
                    <h3 className="text-base font-black text-[#132c4a] leading-tight">
                      Stake $APPLE:
                    </h3>
                    <span className="text-sm font-black text-[#27ae60]">
                      25% APY
                    </span>
                  </div>
                </div>

                {/* Info Icon */}
                <button 
                  onClick={() => openInfoModal('pool_6m')}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold active:scale-90 transition-transform cursor-pointer"
                >
                  ⓘ
                </button>
              </div>

              {/* Staked Metrics Box */}
              <div className="space-y-2 mb-4 bg-[#FFFDF5] p-3.5 rounded-2xl border border-[#FDEFC9]">
                <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    <span>Staked</span>
                  </span>
                  <div className="flex items-center gap-1.5 font-black text-[#1c324f] text-sm">
                    <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                    <span>{m.staked.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Available rewards:</span>
                  </span>
                  <div className="flex items-center gap-1.5 font-black text-[#27ae60] text-sm">
                    <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                    <span>{m.accruedRewards.toFixed(1)}</span>
                  </div>
                </div>

                {/* Lock Status / Countdown */}
                {m.staked > 0 && (
                  <div className="pt-2 border-t border-[#FDEFC9] flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Lock Status:</span>
                    </span>
                    <span className={`font-black ${m.isMatured ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {m.isMatured ? 'Matured (Ready to Claim)' : `${m.remainingDays} Days left (${m.unlockDateFormatted})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Stake & Unstake */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => openStakeModal('pool_6m')}
                  className="bg-gradient-to-b from-[#2ecc71] to-[#1e824c] hover:brightness-105 active:scale-95 text-white font-black text-sm py-2.5 rounded-2xl shadow-[0_4px_0_#145a32] border-t border-emerald-300 transition-all text-center cursor-pointer"
                >
                  Stake
                </button>

                <button
                  onClick={() => openUnstakeModal('pool_6m')}
                  disabled={m.staked === 0}
                  className={`font-black text-sm py-2.5 rounded-2xl transition-all text-center ${
                    m.staked === 0 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : m.isMatured 
                        ? 'bg-gradient-to-b from-[#2ecc71] to-[#1e824c] text-white shadow-[0_4px_0_#145a32] border-t border-emerald-300 cursor-pointer active:scale-95'
                        : 'bg-gradient-to-b from-[#e74c3c] to-[#c0392b] text-white shadow-[0_4px_0_#922b21] border-t border-red-300 cursor-pointer active:scale-95'
                  }`}
                >
                  {m.isMatured ? 'Claim All' : 'Unstake'}
                </button>
              </div>

            </div>
          );
        })()}

      </div>

      {/* ----------------- BOTTOM NAVIGATION ----------------- */}
      <BottomNav currentTab="wallet" onNavigate={onNavigate} />

      {/* ================= MODAL 1: STAKE AMOUNT & LIVE PROFIT CALCULATOR ================= */}
      {activeModal === 'stake' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-emerald-100 animate-scale-up">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-base font-black text-[#1c324f]">{activePoolConfig.name}</h3>
                <p className="text-[11px] font-bold text-emerald-600">
                  Lock Duration: {activePoolConfig.months} Months ({activePoolConfig.days} Days)
                </p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* User Balance Bar */}
            <div className="bg-emerald-50/80 p-2.5 rounded-2xl border border-emerald-100 mb-3 flex items-center justify-between text-xs font-bold text-[#145a32]">
              <span className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>Available Apples:</span>
              </span>
              <span className="font-black text-sm">{(user.apples || 0).toLocaleString()}</span>
            </div>

            <form onSubmit={handleConfirmStake} className="space-y-3">
              
              {/* Input field */}
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Enter Apple Amount to Stake</label>
                <div className="relative">
                  <input
                    type="number"
                    min={activePoolConfig.minStake}
                    max={user.apples || 0}
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    placeholder={`Min ${activePoolConfig.minStake} Apples`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-base font-black text-[#1c324f] focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setInputAmount(String(user.apples || 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#2ecc71] text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl active:scale-95 cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Quick Percentage Selector */}
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((pct) => {
                  const maxVal = user.apples || 0;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setInputAmount(String(Math.floor((maxVal * pct) / 100)))}
                      className="py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-600 active:scale-95 cursor-pointer"
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>

              {/* 📊 REAL-TIME LIVE PROFIT CALCULATOR BOX 📊 */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    <span>Monthly Return ({activePoolConfig.monthlyRate}%):</span>
                  </span>
                  <span className="font-black text-[#27ae60]">
                    +{previewMonthlyProfit.toLocaleString()} Apples / mo
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Total {activePoolConfig.months}M Profit ({activePoolConfig.totalRate}%):</span>
                  </span>
                  <span className="font-black text-[#27ae60] text-sm">
                    +{previewTotalProfit.toLocaleString()} Apples
                  </span>
                </div>

                <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs font-black text-[#1c324f]">
                  <span>Total Payout at Unlock:</span>
                  <span className="text-sm font-black text-[#145a32]">
                    {previewTotalPayout.toLocaleString()} Apples
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Unlock Date:</span>
                  </span>
                  <span>{previewUnlockDate}</span>
                </div>
              </div>

              {/* Submit Stake Button */}
              <button
                type="submit"
                disabled={previewAmount < activePoolConfig.minStake || previewAmount > (user.apples || 0)}
                className={`w-full py-3 rounded-2xl text-white font-black text-sm tracking-wide transition-all ${
                  previewAmount < activePoolConfig.minStake || previewAmount > (user.apples || 0)
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-b from-[#2ecc71] to-[#1e824c] hover:brightness-105 active:scale-95 shadow-[0_4px_0_#145a32] border-t border-emerald-300 cursor-pointer'
                }`}
              >
                Confirm & Lock {previewAmount > 0 ? `${previewAmount.toLocaleString()} Apples` : 'Stake'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: UNSTAKE & CLAIM MODAL ================= */}
      {activeModal === 'unstake' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-red-100 animate-scale-up">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <h3 className="text-base font-black text-[#1c324f]">Unstake & Claim</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Details Box */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 mb-4 text-xs font-bold text-slate-700 space-y-2">
              <div className="flex justify-between items-center">
                <span>Staked Principal:</span>
                <span className="font-black text-[#1c324f] text-sm">
                  {activePoolMetrics.staked.toLocaleString()} Apples
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Accrued Rewards:</span>
                <span className="font-black text-[#27ae60] text-sm">
                  +{activePoolMetrics.accruedRewards.toFixed(1)} Apples
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 text-slate-600">
                <span>Total Maturity Profit:</span>
                <span className="font-black text-[#27ae60]">
                  +{activePoolMetrics.totalExpectedProfit.toLocaleString()} Apples
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Maturity Unlock Date:</span>
                <span className="font-bold text-slate-800">
                  {activePoolMetrics.unlockDateFormatted}
                </span>
              </div>
            </div>

            {/* Lock Status Box */}
            {activePoolMetrics.isLocked ? (
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 mb-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-amber-700 font-black text-xs">
                  <Lock className="w-4 h-4" />
                  <span>Locked Duration Active</span>
                </div>
                <p className="text-[11px] font-bold text-amber-800">
                  {activePoolMetrics.remainingDays} days remaining until full unlock. Early unstake is disabled to protect maximum guaranteed yield.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 mb-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-emerald-700 font-black text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Staking Period Matured</span>
                </div>
                <p className="text-[11px] font-bold text-emerald-800">
                  Your staking lock period is complete. Click below to claim your principal and 100% full profit.
                </p>
              </div>
            )}

            <form onSubmit={handleConfirmUnstake}>
              <button
                type="submit"
                disabled={activePoolMetrics.isLocked}
                className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide transition-all ${
                  activePoolMetrics.isLocked
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-b from-[#2ecc71] to-[#1e824c] hover:brightness-105 active:scale-95 text-white shadow-[0_4px_0_#145a32] border-t border-emerald-300 cursor-pointer'
                }`}
              >
                {activePoolMetrics.isLocked ? `Locked (${activePoolMetrics.remainingDays} Days left)` : 'Claim Principal & Profits'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: POOL INFO MODAL ================= */}
      {activeModal === 'info' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-sky-100 animate-scale-up">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <h3 className="text-base font-black text-[#1c324f]">{activePoolConfig.name}</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-3 font-medium mb-4">
              <div className="flex items-start gap-2.5">
                <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p>
                  <strong>{activePoolConfig.months} Months Lock Period:</strong> Your staked apples are locked for exactly {activePoolConfig.days} days ({activePoolConfig.months} months) to generate guaranteed yields.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>{activePoolConfig.monthlyRate}% Monthly Return:</strong> You earn {activePoolConfig.monthlyRate}% monthly profit on your staked amount, totaling {activePoolConfig.totalRate}% return over the {activePoolConfig.months}-month lock duration.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Automatic Maturity Payout:</strong> Upon completion of the lock period, your entire principal plus all earned profits are credited directly to your Apple balance upon claim.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full bg-gray-900 hover:bg-black text-white font-black text-xs py-3 rounded-2xl active:scale-95 cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
