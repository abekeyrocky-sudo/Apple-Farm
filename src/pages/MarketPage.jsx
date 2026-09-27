import React, { useState, useEffect } from 'react';
import { Bot, Zap, Sparkles, CheckCircle2, Wallet, Clock, ShieldCheck, ArrowRight, Loader2, Crown, Ticket, Star, Gift, Disc, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TonConnectUI } from '@tonconnect/ui';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import gramImg from '../../assets/gram.png';
import CustomTitleBar from '../components/CustomTitleBar';
import { soundManager } from '../utils/soundManager';
import { addTransaction } from '../utils/transactionHistory';
import { updateUserInDB } from '../firebase';
import { 
  BOT_PACKAGES, 
  getAutoBotState, 
  saveAutoBotState, 
  formatBotTimeRemaining 
} from '../utils/autoBotManager';

// Master Wallet Address (ফি ও ফান্ডস রিসিভ করার অ্যাড্রেস)
const MASTER_WALLET_ADDRESS = 'UQC576HcthVEI8QtkfQ80iHPDz1iz8VfEWsZPi3c3ihnrN5c';

export default function MarketPage({ 
  user = { apples: 0, diamonds: 0.0 }, 
  onBack, 
  onNavigate,
  onUpdateUserBalance,
  onShowPopup
}) {
  const [activeTab, setActiveTab] = useState('Auto-Bot');
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [processingPkgId, setProcessingPkgId] = useState(null);
  const [tonConnectUI, setTonConnectUI] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const botState = getAutoBotState(user);

  // TonConnect ইনিশিয়ালাইজেশন
  useEffect(() => {
    try {
      const manifest = `${window.location.origin}/tonconnect-manifest.json`;
      const tc = window.__tonConnectUI || new TonConnectUI({ manifestUrl: manifest });
      window.__tonConnectUI = tc;
      setTonConnectUI(tc);

      if (tc.wallet) {
        setIsWalletConnected(true);
      }

      const unsubscribe = tc.onStatusChange((wallet) => {
        setIsWalletConnected(!!wallet);
      });

      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    } catch (e) {
      console.warn('TonConnect init in MarketPage:', e);
    }
  }, []);

  // GRAM দিয়ে অটো-হার্ভেস্ট বট ক্রয় করার হ্যান্ডলার
  const handleBuyAutoBot = async (pkg) => {
    soundManager.playClickSound();
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    if (!tonConnectUI) {
      setErrorMsg('Wallet system initializing. Please wait...');
      return;
    }

    // ওয়ালেট কানেক্ট না থাকলে কানেক্ট প্রম্পট
    if (!tonConnectUI.wallet) {
      try {
        await tonConnectUI.openModal();
      } catch (e) {
        console.warn('Open modal error:', e);
      }
      return;
    }

    setIsProcessingTx(true);
    setProcessingPkgId(pkg.id);
    setErrorMsg(null);

    try {
      // TonConnect অন-চেইন পেমেন্ট রিকোয়েস্ট
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360, // 6 minutes
        messages: [
          {
            address: MASTER_WALLET_ADDRESS,
            amount: pkg.priceNano,
          }
        ]
      };

      await tonConnectUI.sendTransaction(transaction);

      // পেমেন্ট সফল: বট স্টেট এক্টিভেট করা
      const now = Date.now();
      const expiresAt = pkg.durationMs ? now + pkg.durationMs : 'lifetime';
      const nextBotState = {
        active: true,
        tier: pkg.tier,
        expiresAt: expiresAt,
        activatedAt: now
      };

      saveAutoBotState(user.id, nextBotState);
      if (onUpdateUserBalance) {
        onUpdateUserBalance({ autoBot: nextBotState });
      }
      if (user?.id) {
        updateUserInDB(user.id, { autoBot: nextBotState });
      }

      // ট্রানজাকশন হিস্ট্রি রেকর্ড
      addTransaction({
        userId: user.id,
        title: `Auto-Farmer Bot (${pkg.title})`,
        subtitle: `${pkg.priceGram} GRAM Paid`,
        amount: `-${pkg.priceGram} GRAM`,
        currency: 'gram',
        type: 'spend',
        category: 'bot',
        status: 'Completed'
      });

      soundManager.playSuccessSound();
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setPurchaseSuccess(pkg);
      if (onShowPopup) {
        onShowPopup({
          type: 'reward',
          title: 'Auto-Farmer Activated!',
          message: `Congratulations! Your ${pkg.title} is now active. It will automatically harvest your apples 24/7!`,
          confirmText: 'Awesome!'
        });
      }

      setTimeout(() => setPurchaseSuccess(null), 3500);

    } catch (err) {
      console.error('Bot purchase error:', err);
      setErrorMsg(err.message || 'Transaction was cancelled or rejected.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsProcessingTx(false);
      setProcessingPkgId(null);
    }
  };

  // স্ট্যান্ডার্ড মার্কেট আইটেম ডাটা
  const marketItems = [
    // ----------------- ITEMS -----------------
    {
      id: 1,
      name: 'Golden Fertilizer Sack',
      category: 'Items',
      price: 1250,
      currency: 'apple',
      description: 'Increases tree harvest speed by 2x for 24 hours.',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-14 h-14 bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#b45309] rounded-2xl border-2 border-amber-600 shadow-md flex flex-col items-center justify-center relative transform -rotate-1">
            <div className="absolute -top-1.5 w-6 h-3 bg-[#d97706] rounded-full border border-amber-700" />
            <Sparkles className="w-6 h-6 text-amber-100" />
            <div className="w-8 h-1 bg-amber-800/30 rounded-full mt-0.5" />
          </div>
        </div>
      ),
    },
    {
      id: 2,
      name: '1h Harvest Boost',
      category: 'Items',
      price: 1250,
      currency: 'apple',
      description: 'Doubles all apple rewards from tapping for 1 hour.',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-13 h-14 rounded-full bg-gradient-to-b from-emerald-200 to-green-500 border-2 border-emerald-700 shadow-[0_0_12px_rgba(74,222,128,0.5)] flex flex-col items-center justify-center relative">
            <div className="absolute -top-2 w-4 h-3 bg-[#b45309] rounded-t-sm border border-amber-900" />
            <Zap className="w-6 h-6 text-emerald-950 animate-pulse" />
            <div className="absolute bottom-2 w-7 h-4 bg-emerald-400/80 rounded-full blur-[1px]" />
          </div>
        </div>
      ),
    },
    {
      id: 3,
      name: '50x Spin Voucher',
      category: 'Items',
      price: 0.18,
      priceNano: '180000000', // 0.18 TON/GRAM in nanotons
      currency: 'gram',
      voucherSpins: 50,
      description: 'Get 50 Lucky Wheel spins instantly to win Apples and Diamonds!',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-orange-400 border-2 border-amber-500 shadow-md flex flex-col items-center justify-center relative">
            <Disc className="w-7 h-7 text-amber-950" />
            <span className="text-[9px] font-black bg-red-500 text-white px-1.5 rounded-full absolute -top-1.5 -right-1 shadow-xs">
              50x
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      name: '1h Harvest Stand',
      category: 'Items',
      price: 550,
      currency: 'apple',
      description: 'Special apple display stand with automated harvest power.',
      icon: (
        <div className="relative w-16 h-16 flex flex-col items-center justify-center">
          <img src={appleImg} alt="Apple" className="w-9 h-9 object-contain filter drop-shadow z-10 -mb-1.5" />
          <div className="w-12 h-4 bg-[#854d0e] rounded-full border border-amber-950 shadow-sm" />
        </div>
      ),
    },
    {
      id: 5,
      name: 'Mystery Gift Box',
      category: 'Items',
      price: 1350,
      currency: 'diamond',
      description: 'Contains guaranteed rare boosters and jackpot tokens!',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-12 h-12 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-xl border-2 border-amber-600 shadow-md flex items-center justify-center relative">
            <Gift className="w-7 h-7 text-amber-900" />
          </div>
        </div>
      ),
    },
    {
      id: 6,
      name: 'Rare Apple Seed',
      category: 'Items',
      price: 549.0,
      currency: 'diamond',
      description: 'Plant a golden tree with 3x diamond drop chances.',
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center">
          <img src={appleImg} alt="Rare Apple" className="w-12 h-12 object-contain filter drop-shadow-[0_4px_8px_rgba(239,68,68,0.4)] animate-bounce-gentle" />
        </div>
      ),
    },

    // ----------------- BOOSTS -----------------
    {
      id: 7,
      name: 'Energy Surge Potion',
      category: 'Boosts',
      price: 450,
      currency: 'apple',
      description: 'Instantly refills your stamina energy bar to 100%.',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md">
          <Zap className="w-6 h-6 fill-white" />
        </div>
      ),
    },
    {
      id: 8,
      name: '24h Super Harvester',
      category: 'Boosts',
      price: 2000,
      currency: 'apple',
      description: 'Collects apples automatically every minute for 24 hours.',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-md">
          <Bot className="w-6 h-6" />
        </div>
      ),
    },
    {
      id: 9,
      name: 'Lucky Wheel Pass (x5)',
      category: 'Boosts',
      price: 350.0,
      currency: 'diamond',
      description: '5 free super spins on the Lucky Wheel with guaranteed wins.',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-400 to-indigo-600 flex items-center justify-center text-white shadow-md">
          <Disc className="w-6 h-6" />
        </div>
      ),
    },

    // ----------------- SPECIAL -----------------
    {
      id: 10,
      name: 'Golden Orchard Tree',
      category: 'Special',
      price: 3500.0,
      currency: 'diamond',
      description: 'A permanent mythical tree yielding pure diamond fruits.',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-yellow-300 to-amber-500 flex items-center justify-center text-white shadow-md">
          <Star className="w-6 h-6 fill-white" />
        </div>
      ),
    },
    {
      id: 11,
      name: 'Master Farmer Title',
      category: 'Special',
      price: 8000,
      currency: 'apple',
      description: 'Exclusive golden profile badge and +50% all earnings.',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center text-white shadow-md">
          <Crown className="w-6 h-6" />
        </div>
      ),
    },
    {
      id: 12,
      name: 'Diamond VIP Pass',
      category: 'Special',
      price: 1999.0,
      currency: 'diamond',
      description: 'VIP status with 0% withdrawal fees & instant processing.',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-400 to-cyan-600 flex items-center justify-center text-white shadow-md">
          <Ticket className="w-6 h-6" />
        </div>
      ),
    },
  ];

  const filteredItems = marketItems.filter((item) => item.category === activeTab);

  // সাধারণ ও স্পেশাল আইটেম ক্রয় হ্যান্ডলার
  const handleBuyItem = async (item) => {
    soundManager.playClickSound();
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    // 🪙 GRAM পেমেন্ট হ্যান্ডলার (যেমন: 50x Spin Voucher)
    if (item.currency === 'gram') {
      if (!tonConnectUI) {
        setErrorMsg('Wallet system initializing. Please wait...');
        return;
      }

      if (!tonConnectUI.wallet) {
        try {
          await tonConnectUI.openModal();
        } catch (e) {
          console.warn('Open modal error:', e);
        }
        return;
      }

      setIsProcessingTx(true);
      setProcessingPkgId(item.id);
      setErrorMsg(null);

      try {
        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 360, // 6 minutes
          messages: [
            {
              address: MASTER_WALLET_ADDRESS,
              amount: item.priceNano || '180000000',
            }
          ]
        };

        await tonConnectUI.sendTransaction(transaction);

        // 50টি স্পিন ভাউচার ইউজারের অ্যাকাউন্টে যোগ করা
        const bonusVouchers = item.voucherSpins || 50;
        const currentVouchers = Number(user.spinVouchers || 0);
        const nextVouchers = currentVouchers + bonusVouchers;

        if (onUpdateUserBalance) {
          onUpdateUserBalance({ spinVouchers: nextVouchers });
        }
        if (user?.id) {
          updateUserInDB(user.id, { spinVouchers: nextVouchers });
        }

        // ট্রানজাকশন হিস্ট্রি রেকর্ড
        addTransaction({
          userId: user.id,
          title: item.name,
          subtitle: `${item.price} GRAM Paid`,
          amount: `-${item.price} GRAM`,
          currency: 'gram',
          type: 'spend',
          category: 'spin_voucher',
          status: 'Completed'
        });

        soundManager.playSuccessSound();
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        setPurchaseSuccess(item);
        if (onShowPopup) {
          onShowPopup({
            type: 'reward',
            title: '50 Spin Vouchers Added!',
            message: 'You have received 50 Lucky Wheel Spins! Head to the Game page to spin now.',
            confirmText: 'Spin Now',
            onConfirm: () => onNavigate?.('game')
          });
        }
        setTimeout(() => setPurchaseSuccess(null), 3000);
      } catch (err) {
        console.error('Spin voucher purchase error:', err);
        setErrorMsg(err.message || 'Transaction was cancelled or rejected.');
        setTimeout(() => setErrorMsg(null), 4000);
      } finally {
        setIsProcessingTx(false);
        setProcessingPkgId(null);
      }
      return;
    }

    // 🍎 অ্যাপেল ও 💎 ডায়মন্ড আইটেম হ্যান্ডলার
    if (item.currency === 'apple') {
      if ((user.apples || 0) < item.price) {
        setErrorMsg(`Not enough Apples! You need ${item.price.toLocaleString()}`);
        setTimeout(() => setErrorMsg(null), 2500);
        return;
      }
      if (onUpdateUserBalance) {
        onUpdateUserBalance({ apples: (user.apples || 0) - item.price });
      }
    } else {
      if ((user.diamonds || 0) < item.price) {
        setErrorMsg(`Not enough Diamonds! You need ${item.price.toFixed(1)}`);
        setTimeout(() => setErrorMsg(null), 2500);
        return;
      }
      if (onUpdateUserBalance) {
        onUpdateUserBalance({ diamonds: (user.diamonds || 0) - item.price });
      }
    }

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    setPurchaseSuccess(item);
    setTimeout(() => {
      setPurchaseSuccess(null);
    }, 2000);
  };

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#eaf6ff] via-[#f3f9ff] to-[#e8f5e9] flex flex-col justify-between select-none font-sans overflow-hidden">
      
      {/* ----------------- TOP HEADER ----------------- */}
      <div className="pt-2 px-4 pb-2 z-20">
        <CustomTitleBar title="Apple Farm" darkText={true} />
        <div className="flex items-center justify-between relative mb-3 mt-1">
          {/* Back Button */}
          <button 
            onClick={onBack || (() => onNavigate?.('home'))}
            className="w-9 h-9 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform shadow-sm cursor-pointer">
            <svg className="w-5 h-5 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title */}
          <h1 className="text-xl font-black text-[#192f52] tracking-tight">
            Apple Market
          </h1>

          {/* User Small Balance Header Pill */}
          <div className="flex items-center gap-2 bg-white/90 px-2.5 py-1 rounded-full border border-sky-100 shadow-sm text-xs font-black text-[#192f52]">
            <div className="flex items-center gap-1">
              <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
              <span>{(user.apples || 0).toLocaleString()}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <img src={diamondImg} alt="Diamond" className="w-3.5 h-3.5 object-contain" />
              <span>{Number(user.diamonds || 0).toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* ----------------- CATEGORY TABS (Auto-Bot / Items / Boosts / Special) ----------------- */}
        <div className="flex items-center justify-between gap-1.5 px-0.5 mb-2">
          {[
            { id: 'Auto-Bot', label: 'Auto-Bot' },
            { id: 'Items', label: 'Items' },
            { id: 'Boosts', label: 'Boosts' },
            { id: 'Special', label: 'Special' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.selectionChanged();
                  }
                }}
                className={`flex-1 py-2 rounded-full font-black text-xs transition-all duration-200 shadow-sm cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0098EA] to-[#0077c2] text-white shadow-md scale-102'
                    : 'bg-white/90 text-[#4c678a] hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------- TOAST ALERTS ----------------- */}
      {purchaseSuccess && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-xl animate-bounce flex items-center gap-1.5">
          <span>✓ Activated {purchaseSuccess.title || purchaseSuccess.name}!</span>
        </div>
      )}

      {errorMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-xl animate-shake flex items-center gap-1.5 max-w-[90%] text-center">
          <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ----------------- CONTENT BODY ----------------- */}
      <div className="flex-1 px-3 py-1 overflow-y-auto max-h-[calc(100vh-175px)]">

        {/* 🤖 1. AUTO-FARMER BOT (3-COLUMN GRID MATCHING ORIGINAL DESIGN) */}
        {activeTab === 'Auto-Bot' ? (
          <div className="space-y-3 pb-4">
            
            {/* Status & Info Bar */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2.5 border border-sky-100 shadow-sm flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black text-[#192f52] block text-[11px] leading-tight">24/7 Auto-Farmer</span>
                  <span className="text-[10px] text-slate-500">Auto-harvests even while offline</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`font-black px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 ${
                  botState.active 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {botState.active ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{formatBotTimeRemaining(botState.expiresAt)}</span>
                    </>
                  ) : (
                    <span>Inactive</span>
                  )}
                </span>
              </div>
            </div>

            {/* 3-Column Grid matching Items/Boosts */}
            <div className="grid grid-cols-3 gap-2.5">
              {BOT_PACKAGES.map((pkg) => {
                const isCurrentTierActive = botState.active && botState.tier === pkg.tier;
                const isBuyingThis = isProcessingTx && processingPkgId === pkg.id;

                return (
                  <div 
                    key={pkg.id}
                    className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 border border-sky-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center justify-between text-center transition-transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                  >
                    {/* Icon Frame */}
                    <div className="w-full h-18 bg-[#f8fbfe] rounded-xl flex items-center justify-center p-1 border border-slate-100/80 mb-1.5 relative">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-md relative">
                        <Bot className="w-6 h-6 animate-pulse" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-1 ring-white" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-[11px] font-black text-[#192f52] leading-tight line-clamp-2 h-7 flex items-center justify-center">
                      {pkg.title}
                    </h3>

                    {/* Price Row (GRAM) */}
                    <div className="flex items-center justify-center gap-1 my-1">
                      <img src={gramImg} alt="GRAM" className="w-3.5 h-3.5 object-contain" />
                      <span className="text-xs font-black text-[#192f52]">
                        {pkg.priceGram}
                      </span>
                    </div>

                    {/* Standard Green Buy Button */}
                    <button
                      onClick={() => handleBuyAutoBot(pkg)}
                      disabled={isProcessingTx}
                      className={`w-full py-1.5 rounded-xl font-black text-xs text-white transition-all mt-0.5 cursor-pointer flex items-center justify-center gap-1 shadow-[0_2px_0_#145a32] border-t border-emerald-300 ${
                        isCurrentTierActive
                          ? 'bg-gradient-to-b from-emerald-500 to-green-700'
                          : 'bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95'
                      }`}
                    >
                      {isBuyingThis ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-[10px]">Wait...</span>
                        </>
                      ) : isCurrentTierActive ? (
                        'Active'
                      ) : (
                        'Buy'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

          </div>
        ) : (
          /* 📦 2. STANDARD MARKET GRID (Items / Boosts / Special) */
          <div className="grid grid-cols-3 gap-2.5 pb-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 border border-sky-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center justify-between text-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* Product Icon Frame */}
                <div className="w-full h-18 bg-[#f8fbfe] rounded-xl flex items-center justify-center p-1 border border-slate-100/80 mb-1.5">
                  {item.icon}
                </div>

                {/* Product Name */}
                <h3 className="text-[11px] font-black text-[#192f52] leading-tight line-clamp-2 h-7 flex items-center justify-center">
                  {item.name}
                </h3>

                {/* Price Row */}
                <div className="flex items-center justify-center gap-1 my-1">
                  {item.currency === 'apple' ? (
                    <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
                  ) : item.currency === 'gram' ? (
                    <img src={gramImg} alt="GRAM" className="w-3.5 h-3.5 object-contain" />
                  ) : (
                    <img src={diamondImg} alt="Diamond" className="w-3.5 h-3.5 object-contain" />
                  )}
                  <span className="text-xs font-black text-[#192f52]">
                    {item.currency === 'apple' 
                      ? item.price.toLocaleString() 
                      : item.currency === 'gram'
                      ? item.price.toFixed(2)
                      : item.price.toFixed(1)}
                  </span>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => handleBuyItem(item)}
                  disabled={isProcessingTx && processingPkgId === item.id}
                  className="w-full py-1.5 rounded-xl font-black text-xs text-white bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 shadow-[0_2px_0_#145a32] border-t border-emerald-300 transition-all mt-0.5 cursor-pointer flex items-center justify-center gap-1"
                >
                  {isProcessingTx && processingPkgId === item.id ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-[10px]">Wait...</span>
                    </>
                  ) : (
                    'Buy'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ----------------- BOTTOM NAVIGATION BAR ----------------- */}
      <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-6 py-2.5 flex justify-between items-center z-30 border-t border-gray-100">
        
        {/* Home */}
        <button 
          onClick={() => onNavigate?.('home')} 
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-gray-600 transition-transform active:scale-90 cursor-pointer">
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span className="text-[11px] font-bold">Home</span>
        </button>

        {/* Task */}
        <button 
          onClick={() => onNavigate?.('task')} 
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-gray-600 transition-transform active:scale-90 cursor-pointer">
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-[11px] font-bold">Task</span>
        </button>

        {/* Game */}
        <button 
          onClick={() => onNavigate?.('game')} 
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-gray-600 transition-transform active:scale-90 cursor-pointer">
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <rect x="2" y="6" width="20" height="12" rx="6" />
            <path d="M6 12h4m-2-2v4m8-2h.01m3-2h.01" />
          </svg>
          <span className="text-[11px] font-bold">Game</span>
        </button>

        {/* Wallet */}
        <button 
          onClick={() => onNavigate?.('wallet')} 
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-gray-600 transition-transform active:scale-90 cursor-pointer">
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <path d="M3 10h18M7 15h1m4 0h1m-9 4h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-[11px] font-bold">Wallet</span>
        </button>

      </div>

    </div>
  );
}
