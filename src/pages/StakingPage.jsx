import React, { useState, useEffect } from 'react';
import { Wallet, Gift, Shield, Zap, Sparkles, Coins, LockOpen, Sprout, CheckCircle2, ChevronRight } from 'lucide-react';
import { TonConnectUI } from '@tonconnect/ui';
import confetti from 'canvas-confetti';
import BottomNav from '../components/BottomNav';
import CustomTitleBar from '../components/CustomTitleBar';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';

export default function StakingPage({ 
  user = { apples: 0, diamonds: 0.0, id: null }, 
  onBack, 
  onNavigate,
  onUpdateUserBalance
}) {
  // Real TON Connect Wallet State
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // Staking Pools State (Fresh 0 default state)
  const [pools, setPools] = useState({
    apple: {
      id: 'apple',
      name: 'Stake $APPLE:',
      apy: '15% APY',
      staked: 0,
      rewards: 0.0,
      iconType: 'apple',
      minStake: 100,
      rewardRatePerSec: 0.04
    },
    special: {
      id: 'special',
      name: 'Stake Special Item:',
      apy: '25% APY',
      staked: 0,
      rewards: 0.0,
      iconType: 'special',
      minStake: 50,
      rewardRatePerSec: 0.08
    }
  });

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'stake' | 'unstake' | 'info'
  const [selectedPoolId, setSelectedPoolId] = useState('apple');
  const [inputAmount, setInputAmount] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // TON Connect UI ইনিশিয়ালাইজেশন
  useEffect(() => {
    let tonConnect;
    try {
      const manifest = window.location.origin + '/tonconnect-manifest.json';
      tonConnect = new TonConnectUI({
        manifestUrl: manifest
      });

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
          showToast('TON Wallet Connected!');
        } else {
          setIsWalletConnected(false);
          setWalletAddress('');
        }
      });

      window.__tonConnectUI = tonConnect;
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (e) {
      console.warn('TonConnectUI init:', e);
    }
  }, []);

  // Live Reward Ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setPools(prev => ({
        apple: {
          ...prev.apple,
          rewards: prev.apple.staked > 0 ? Number((prev.apple.rewards + 0.02).toFixed(2)) : prev.apple.rewards
        },
        special: {
          ...prev.special,
          rewards: prev.special.staked > 0 ? Number((prev.special.rewards + 0.04).toFixed(2)) : prev.special.rewards
        }
      }));
    }, 2500);

    return () => clearInterval(interval);
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
    const amount = parseFloat(inputAmount);
    if (!amount || amount <= 0) {
      showToast('⚠️ Please enter a valid amount');
      return;
    }

    const maxAvailable = selectedPoolId === 'apple' ? (user.apples || 1250) : (user.diamonds || 549);
    if (amount > maxAvailable) {
      showToast(`❌ Insufficient balance! Max: ${maxAvailable}`);
      return;
    }

    // Update pool
    setPools(prev => ({
      ...prev,
      [selectedPoolId]: {
        ...prev[selectedPoolId],
        staked: prev[selectedPoolId].staked + amount
      }
    }));

    // Deduct user balance
    if (onUpdateUserBalance) {
      onUpdateUserBalance(selectedPoolId === 'apple' ? { apples: -amount } : { diamonds: -amount });
    }

    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    triggerHaptic('success');
    showToast(`🎉 Staked ${amount} successfully!`);
    setActiveModal(null);
  };

  // Confirm Unstake Submission
  const handleConfirmUnstake = (e) => {
    e.preventDefault();
    const currentPool = pools[selectedPoolId];
    const amount = parseFloat(inputAmount) || currentPool.staked;

    if (amount <= 0 || amount > currentPool.staked) {
      showToast(`❌ Invalid amount! Staked: ${currentPool.staked}`);
      return;
    }

    const claimedRewards = currentPool.rewards;

    // Reset pool
    setPools(prev => ({
      ...prev,
      [selectedPoolId]: {
        ...prev[selectedPoolId],
        staked: prev[selectedPoolId].staked - amount,
        rewards: 0
      }
    }));

    // Credit back to user
    if (onUpdateUserBalance) {
      onUpdateUserBalance({
        apples: (selectedPoolId === 'apple' ? amount : 0) + claimedRewards,
        diamonds: selectedPoolId === 'special' ? amount : 0
      });
    }

    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    triggerHaptic('success');
    showToast(`Unstaked ${amount} & Claimed +${claimedRewards.toFixed(1)} Apples!`);
    setActiveModal(null);
  };

  const currentActivePool = pools[selectedPoolId];

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
                className="text-[10px] font-bold text-red-500 hover:text-red-700 ml-1 underline"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenTonConnect}
              className="bg-white/95 hover:bg-white active:scale-95 backdrop-blur-md border border-sky-200 px-5 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 text-sm font-extrabold text-[#192f52] transition-all"
            >
              <Wallet className="w-5 h-5 text-sky-600 stroke-[2.2]" />
              <span>Connect wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* ----------------- MAIN STAKING CARDS LIST ----------------- */}
      <div className="flex-1 px-4 py-2 space-y-4 overflow-y-auto z-10">
        
        {/* CARD 1: STAKE $APPLE (15% APY) */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_25px_rgba(0,100,50,0.06)] border border-emerald-100/80 transition-all hover:shadow-md">
          
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
                  {pools.apple.name}
                </h3>
                <span className="text-sm font-black text-[#27ae60]">
                  {pools.apple.apy}
                </span>
              </div>
            </div>

            {/* Info Icon */}
            <button 
              onClick={() => openInfoModal('apple')}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold active:scale-90 transition-transform"
            >
              ⓘ
            </button>
          </div>

          {/* Staked Metrics Row */}
          <div className="space-y-2 mb-4 bg-[#F8FCF9] p-3 rounded-2xl border border-[#E4F4E8]">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600">
              <span>Staked</span>
              <div className="flex items-center gap-1.5 font-black text-[#1c324f] text-sm">
                <img src={diamondImg} alt="Diamond" className="w-4 h-4 object-contain" />
                <span>{pools.apple.staked.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-gray-600">
              <span>Available rewards:</span>
              <div className="flex items-center gap-1.5 font-black text-[#27ae60] text-sm">
                <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                <span>{pools.apple.rewards.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Stake & Unstake */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => openStakeModal('apple')}
              className="bg-gradient-to-b from-[#2ecc71] to-[#1e824c] hover:brightness-105 active:scale-95 text-white font-black text-sm py-2.5 rounded-2xl shadow-[0_4px_0_#145a32] border-t border-emerald-300 transition-all text-center"
            >
              Stake
            </button>

            <button
              onClick={() => openUnstakeModal('apple')}
              className="bg-gradient-to-b from-[#e74c3c] to-[#c0392b] hover:brightness-105 active:scale-95 text-white font-black text-sm py-2.5 rounded-2xl shadow-[0_4px_0_#922b21] border-t border-red-300 transition-all text-center"
            >
              Unstake
            </button>
          </div>

        </div>

        {/* CARD 2: STAKE SPECIAL ITEM (25% APY) */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_25px_rgba(0,100,50,0.06)] border border-amber-100/80 transition-all hover:shadow-md">
          
          {/* Header row with Special Gift/NFT vector icon & Info button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-200 to-yellow-100 border-2 border-amber-300 flex items-center justify-center text-amber-700 shadow-sm">
                <Gift className="w-6 h-6 stroke-amber-700 stroke-[2.3]" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#132c4a] leading-tight">
                  {pools.special.name}
                </h3>
                <span className="text-sm font-black text-[#27ae60]">
                  {pools.special.apy}
                </span>
              </div>
            </div>

            {/* Info Icon */}
            <button 
              onClick={() => openInfoModal('special')}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold active:scale-90 transition-transform"
            >
              ⓘ
            </button>
          </div>

          {/* Staked Metrics Row */}
          <div className="space-y-2 mb-4 bg-[#FFFDF5] p-3 rounded-2xl border border-[#FDEFC9]">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600">
              <span>Staked</span>
              <div className="flex items-center gap-1.5 font-black text-[#1c324f] text-sm">
                <img src={diamondImg} alt="Diamond" className="w-4 h-4 object-contain" />
                <span>{pools.special.staked.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-gray-600">
              <span>Available rewards:</span>
              <div className="flex items-center gap-1.5 font-black text-[#27ae60] text-sm">
                <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                <span>{pools.special.rewards.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Stake & Unstake */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => openStakeModal('special')}
              className="bg-gradient-to-b from-[#2ecc71] to-[#1e824c] hover:brightness-105 active:scale-95 text-white font-black text-sm py-2.5 rounded-2xl shadow-[0_4px_0_#145a32] border-t border-emerald-300 transition-all text-center"
            >
              Stake
            </button>

            <button
              onClick={() => openUnstakeModal('special')}
              className="bg-gradient-to-b from-[#e74c3c] to-[#c0392b] hover:brightness-105 active:scale-95 text-white font-black text-sm py-2.5 rounded-2xl shadow-[0_4px_0_#922b21] border-t border-red-300 transition-all text-center"
            >
              Unstake
            </button>
          </div>

        </div>

      </div>

      {/* ----------------- BOTTOM NAVIGATION ----------------- */}
      <BottomNav currentTab="wallet" onNavigate={onNavigate} />

      {/* ----------------- MODAL 2: STAKE AMOUNT MODAL ----------------- */}
      {activeModal === 'stake' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-black text-[#1c324f]">{currentActivePool.name}</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 mb-4 text-xs font-bold text-[#145a32]">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-400 stroke-none" />
                <span>Yield Rate: <strong className="font-black text-[#27ae60]">{currentActivePool.apy}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>Your Balance: <strong>{selectedPoolId === 'apple' ? (user.apples || 1250).toLocaleString() : (user.diamonds || 549).toFixed(1)}</strong></span>
              </div>
            </div>

            <form onSubmit={handleConfirmStake}>
              <div className="mb-3">
                <label className="text-xs font-bold text-gray-600 block mb-1">Enter Amount to Stake</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-base font-black text-[#1c324f] focus:outline-none focus:border-emerald-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setInputAmount(String(selectedPoolId === 'apple' ? (user.apples || 1250) : (user.diamonds || 549)))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#2ecc71] text-white text-[10px] font-black px-2.5 py-1 rounded-xl"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Quick Percent Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[25, 50, 75, 100].map((pct) => {
                  const maxVal = selectedPoolId === 'apple' ? (user.apples || 1250) : (user.diamonds || 549);
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setInputAmount(String(Math.floor((maxVal * pct) / 100)))}
                      className="py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-black text-gray-600 active:scale-95"
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-b from-[#2ecc71] to-[#1e824c] hover:brightness-105 active:scale-95 text-white font-black text-sm py-3 rounded-2xl shadow-[0_4px_0_#145a32] border-t border-emerald-300 transition-all"
              >
                Confirm & Stake
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 3: UNSTAKE MODAL ----------------- */}
      {activeModal === 'unstake' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-red-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-black text-[#1c324f]">Unstake & Claim</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 mb-4 text-xs font-bold text-amber-900 space-y-1">
              <div className="flex justify-between">
                <span>Staked Principle:</span>
                <span className="font-black text-[#1c324f]">{currentActivePool.staked.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Accrued Rewards:</span>
                <div className="flex items-center gap-1 font-black text-[#27ae60]">
                  <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
                  <span>+{currentActivePool.rewards.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmUnstake}>
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-600 block mb-1">Amount to Unstake</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={currentActivePool.staked}
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    placeholder={String(currentActivePool.staked)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-base font-black text-[#1c324f] focus:outline-none focus:border-red-400"
                  />
                  <button
                    type="button"
                    onClick={() => setInputAmount(String(currentActivePool.staked))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#e74c3c] text-white text-[10px] font-black px-2.5 py-1 rounded-xl"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-b from-[#e74c3c] to-[#c0392b] hover:brightness-105 active:scale-95 text-white font-black text-sm py-3 rounded-2xl shadow-[0_4px_0_#922b21] border-t border-red-300 transition-all"
              >
                Unstake & Claim All
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 4: INFO MODAL ----------------- */}
      {activeModal === 'info' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-sky-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-black text-[#1c324f]">Staking Pool Info</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-3 font-medium mb-4">
              <div className="flex items-start gap-2.5">
                <LockOpen className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Zero Lockup:</strong> You can stake and unstake your assets anytime without penalty.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Live Yield:</strong> Rewards accumulate in real-time based on the pool APY rate ({currentActivePool.apy}).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Automatic Harvest:</strong> When you unstake, all accumulated $APPLE rewards are instantly credited to your wallet balance.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full bg-gray-900 text-white font-black text-xs py-3 rounded-2xl active:scale-95"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
