import React, { useState, useEffect } from 'react';
import { Gift, Users, CheckCircle2, Sparkles, UserPlus, Coins, X, ChevronRight, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { TonConnectUI } from '@tonconnect/ui';
import confetti from 'canvas-confetti';
import inviteBannerImg from '../../assets/invite-banner.png';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import CustomTitleBar from '../components/CustomTitleBar';
import { soundManager } from '../utils/soundManager';
import { getAvatarSrc } from '../utils/avatars';
import { claimPartnerProfitInDB, getPartnerProfitHistoryFromDB } from '../firebase';

// 🎁 রেফারেল মিশন ডেটা (Apples reward 5x boosted)
const REFER_MISSIONS = [
  { id: 1, target: 1, title: 'Invite 1 Friend', apples: 1500, diamonds: 0 },
  { id: 2, target: 3, title: 'Invite 3 Friends', apples: 5000, diamonds: 1 },
  { id: 3, target: 5, title: 'Invite 5 Friends', apples: 12500, diamonds: 3 },
  { id: 4, target: 10, title: 'Invite 10 Friends', apples: 30000, diamonds: 8 },
  { id: 5, target: 25, title: 'Invite 25 Friends', apples: 100000, diamonds: 25 },
];

export default function InviteFriendsPage({ 
  user = { username: 'Farmer', id: null, invitedFriends: [], claimedReferMissions: {} }, 
  onBack,
  onClaimReward,
  onClaimCommission,
  onClaimPartnerProfit,
  onShowPopup
}) {
  const [copied, setCopied] = useState(false);
  const [claimedMissions, setClaimedMissions] = useState(user?.claimedReferMissions || {});
  
  // ⚡ পার্টনার প্রফিট স্টেট (১৫% GRAM কমিশন)
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);
  const [isClaimingProfit, setIsClaimingProfit] = useState(false);
  const [profitHistory, setProfitHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 👛 TonConnect স্টেট
  const [tonConnectUI, setTonConnectUI] = useState(null);
  const [connectedWallet, setConnectedWallet] = useState(user?.walletAddress || '');

  // পার্টনার প্রফিট ব্যালেন্স ও মেট্টিক
  const claimablePartnerGram = Math.max(0, Number(user?.claimablePartnerGram || 0));
  const totalPartnerGramEarned = Math.max(0, Number(user?.totalPartnerGramEarned || 0));
  const claimedPartnerGram = Math.max(0, Number(user?.claimedPartnerGram || 0));
  const partnerReferralTaskCount = Math.max(0, Number(user?.partnerReferralTaskCount || 0));

  // 🎯 ১.০ GRAM টার্গেট ও প্রোগ্রেস বার ক্যালকুলেশন
  const MIN_CLAIM_GRAM = 1.0;
  const progressPercent = Math.min(100, Math.max(0, (claimablePartnerGram / MIN_CLAIM_GRAM) * 100));
  const canClaim = claimablePartnerGram >= MIN_CLAIM_GRAM;

  // TonConnect ইনিশিয়ালাইজেশন
  useEffect(() => {
    try {
      const manifest = `${window.location.origin}/tonconnect-manifest.json`;
      const tc = window.__tonConnectUI || new TonConnectUI({ manifestUrl: manifest });
      window.__tonConnectUI = tc;
      setTonConnectUI(tc);

      if (tc.wallet?.account?.address) {
        setConnectedWallet(tc.wallet.account.address);
      }

      const unsubscribe = tc.onStatusChange((wallet) => {
        if (wallet?.account?.address) {
          setConnectedWallet(wallet.account.address);
        } else {
          setConnectedWallet('');
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('TonConnect init in InviteFriendsPage:', e);
    }
  }, []);

  useEffect(() => {
    if (user?.claimedReferMissions) {
      setClaimedMissions(user.claimedReferMissions);
    }
  }, [user?.claimedReferMissions]);

  // পার্টনার কমিশন হিস্ট্রি লোড
  useEffect(() => {
    if (isProfitModalOpen && user?.id) {
      setIsLoadingHistory(true);
      getPartnerProfitHistoryFromDB(user.id)
        .then((items) => {
          setProfitHistory(items);
        })
        .catch((err) => console.warn('History fetch err:', err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [isProfitModalOpen, user?.id]);

  // ⚡ পার্টনার প্রফিট ক্লেইম হ্যান্ডলার (১.০ GRAM মিনিমাম হলে মাস্টার ওয়ালেট থেকে ইউজারের ওয়ালেটে পাঠানো)
  const handleClaimProfit = async () => {
    if (isClaimingProfit || !user?.id) return;

    // ১. ওয়ালেট কানেক্টেড আছে কিনা চেক
    const targetWallet = connectedWallet || tonConnectUI?.wallet?.account?.address || user?.walletAddress;
    if (!targetWallet) {
      soundManager.playClickSound();
      if (tonConnectUI) {
        tonConnectUI.openModal();
      } else {
        alert('Please connect your TON wallet first to receive your payout.');
      }
      return;
    }

    // ২. মিনিমাম ১.০ GRAM ব্যালেন্স চেক
    if (claimablePartnerGram < MIN_CLAIM_GRAM) {
      soundManager.playClickSound();
      alert(`Minimum 1.0000 GRAM required to trigger on-chain payout! Current available: ${claimablePartnerGram.toFixed(4)} GRAM.`);
      return;
    }

    setIsClaimingProfit(true);
    soundManager.playClickSound();

    try {
      const res = await claimPartnerProfitInDB(user.id, targetWallet);
      if (res && res.success) {
        soundManager.playSuccessSound();
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        if (onClaimPartnerProfit) {
          onClaimPartnerProfit(res.claimedGram || claimablePartnerGram);
        }
        // হিস্ট্রি রিফ্রেশ
        getPartnerProfitHistoryFromDB(user.id).then(setProfitHistory).catch(() => {});
        alert(`🎉 Payout Sent! ${Number(res.claimedGram || claimablePartnerGram).toFixed(4)} GRAM has been sent from Master Wallet to your connected wallet!`);
      } else {
        alert(res?.message || 'Failed to claim profit. Please try again.');
      }
    } catch (err) {
      console.error('Profit claim exception:', err);
      alert('Network error while claiming profit.');
    } finally {
      setIsClaimingProfit(false);
    }
  };

  const botUsername = 'AppleFarmOfficialBot';
  const refCode = user?.id || user?.username || '40281';
  const referralLink = `t.me/${botUsername}/App?startapp=${refCode}`;

  // রিয়েল ইনভাইট সংখ্যা (কোনো ডামি ডিফল্ট ডাটা নেই)
  const invitedFriendsList = Array.isArray(user?.invitedFriends) ? user.invitedFriends : [];
  const invitedCount = invitedFriendsList.length || user?.referralsCount || 0;

  // কমিশন ব্যালেন্স
  const applesCommission = Math.max(0, Number(user?.referralApplesCommission || 0));
  const diamondsCommission = Math.max(0, Number(user?.referralDiamondsCommission || 0));

  // কমিশন ক্লেইম হ্যান্ডলার (Apples)
  const handleClaimApplesCommission = () => {
    if (applesCommission <= 0) return;
    soundManager.playSuccessSound();
    confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    if (onClaimCommission) {
      onClaimCommission('apple', applesCommission);
    }
  };

  // কমিশন ক্লেইম হ্যান্ডলার (Diamonds)
  const handleClaimDiamondsCommission = () => {
    if (diamondsCommission <= 0) return;
    soundManager.playSuccessSound();
    confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    if (onClaimCommission) {
      onClaimCommission('diamond', diamondsCommission);
    }
  };

  // লিংক কপি করার ফাংশন
  const handleCopyLink = () => {
    soundManager.playClickSound();
    navigator.clipboard.writeText(`https://${referralLink}`);
    setCopied(true);

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    setTimeout(() => setCopied(false), 2000);
  };

  // সরাসরি টেলিগ্রামে বন্ধুদের শেয়ার করার ফাংশন
  const handleShareNow = () => {
    soundManager.playClickSound();
    const fullRefUrl = `https://${referralLink}`;
    const shareText = encodeURIComponent('🍎 Join Apple Farm with me! Grow apples, harvest rewards and earn lifetime commission together!');
    const fullShareUrl = `https://t.me/share/url?url=${encodeURIComponent(fullRefUrl)}&text=${shareText}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(fullShareUrl);
    } else {
      window.open(fullShareUrl, '_blank');
    }
  };

  // মিশন রিওয়ার্ড ক্লেইম ফাংশন
  const handleClaimMission = (mission) => {
    if (claimedMissions[mission.id]) return;
    if (invitedCount < mission.target) return;

    soundManager.playSuccessSound();

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    setClaimedMissions(prev => ({ ...prev, [mission.id]: true }));

    if (onClaimReward) {
      onClaimReward(mission);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#eaf6ff] via-[#f4f9ff] to-[#e8f5e9] flex flex-col justify-between p-4 select-none font-sans overflow-hidden">
      
      {/* ----------------- TOP HEADER ----------------- */}
      <div className="flex-shrink-0">
        <CustomTitleBar title="Apple Farm" darkText={true} />
        <div className="relative flex items-center justify-between pt-1 mb-2">
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform shadow-sm">
            <svg className="w-5 h-5 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title */}
          <h1 className="text-xl font-black text-[#192f52] tracking-tight">
            Invite Friends
          </h1>

          {/* 💰 Claim Profit Button (Top Right Header - Marked in Red Box) */}
          <button
            onClick={() => {
              soundManager.playClickSound();
              setIsProfitModalOpen(true);
            }}
            className="relative px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-xs shadow-[0_3px_10px_rgba(245,158,11,0.35)] flex items-center gap-1 active:scale-95 transition-all border border-amber-300/40 hover:brightness-105"
            title="Claim 15% Partner Task Profit"
          >
            <span className="text-xs">💰</span>
            <span className="tracking-tight">Claim Profit</span>
            {claimablePartnerGram > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white"></span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ----------------- SCROLLABLE MAIN CONTENT ----------------- */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 max-h-[calc(100vh-170px)] pb-3">
        
        {/* 1. TOP ILLUSTRATION BANNER */}
        <div className="w-full h-44 rounded-3xl overflow-hidden border-2 border-white shadow-[0_6px_20px_rgba(0,0,0,0.08)] bg-sky-100 relative flex items-center justify-center flex-shrink-0">
          <img 
            src={inviteBannerImg} 
            alt="Invite Friends Banner"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 2. HEADLINE & COMMISSION TEXT */}
        <div className="text-center space-y-1 pt-0.5">
          <h2 className="text-xl font-black text-[#192f52] tracking-tight leading-tight">
            Invite Your Friends
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="text-[11px] font-black text-emerald-800">
              Get +500 Apples + 10% Lifetime Commission
            </span>
          </div>
        </div>

        {/* 2.5 💰 2x LIFETIME COMMISSION CLAIM CARDS */}
        <div className="grid grid-cols-2 gap-2.5 px-0.5">
          
          {/* Card 1: Apples Commission */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-red-100 shadow-[0_2px_12px_rgba(239,68,68,0.06)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center">
                  <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Apples
                </span>
              </div>
              <span className="text-[9px] font-black bg-red-100 text-red-700 px-1.5 py-0.2 rounded-full">
                10%
              </span>
            </div>

            <div className="my-2 text-left">
              <div className="text-base font-black text-[#192f52] flex items-center gap-1">
                <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain inline" />
                <span>{applesCommission.toLocaleString()}</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400">Available to Claim</span>
            </div>

            <button
              onClick={handleClaimApplesCommission}
              disabled={applesCommission <= 0}
              className={`w-full py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-1 shadow-sm active:scale-95 ${
                applesCommission > 0
                  ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e8a4a] text-white hover:brightness-105 cursor-pointer shadow-emerald-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{applesCommission > 0 ? 'Claim Apples' : 'Claim'}</span>
            </button>
          </div>

          {/* Card 2: Diamonds Commission */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-sky-100 shadow-[0_2px_12px_rgba(2,132,199,0.06)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-sky-50 flex items-center justify-center">
                  <img src={diamondImg} alt="Diamond" className="w-4 h-4 object-contain" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Diamonds
                </span>
              </div>
              <span className="text-[9px] font-black bg-sky-100 text-sky-700 px-1.5 py-0.2 rounded-full">
                10%
              </span>
            </div>

            <div className="my-2 text-left">
              <div className="text-base font-black text-[#0284c7] flex items-center gap-1">
                <img src={diamondImg} alt="Diamond" className="w-4 h-4 object-contain inline" />
                <span>{diamondsCommission.toFixed(1)}</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400">Available to Claim</span>
            </div>

            <button
              onClick={handleClaimDiamondsCommission}
              disabled={diamondsCommission <= 0}
              className={`w-full py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-1 shadow-sm active:scale-95 ${
                diamondsCommission > 0
                  ? 'bg-gradient-to-r from-[#0098EA] to-[#0077c2] text-white hover:brightness-105 cursor-pointer shadow-sky-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{diamondsCommission > 0 ? 'Claim Diamonds' : 'Claim'}</span>
            </button>
          </div>

        </div>

        {/* 2.6 🚀 PARTNER TASK 15% PROFIT FEATURE BANNER */}
        <div 
          onClick={() => {
            soundManager.playClickSound();
            setIsProfitModalOpen(true);
          }}
          className="bg-gradient-to-r from-[#17253d] to-[#0f1a2e] rounded-2xl p-3 border border-amber-400/30 shadow-[0_4px_16px_rgba(245,158,11,0.12)] cursor-pointer active:scale-[0.99] transition-all relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-300">Partner Task 15% Profit</span>
                  <span className="text-[9px] font-black bg-amber-400/20 text-amber-200 border border-amber-400/30 px-1.5 py-0.2 rounded-full">
                    GRAM
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium">
                  {claimablePartnerGram > 0 
                    ? `${claimablePartnerGram.toFixed(4)} GRAM ready to claim!`
                    : 'Earn 15% GRAM when friends post partner tasks'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2 py-1 rounded-xl text-[11px] font-black group-hover:bg-amber-500 group-hover:text-white transition-all">
              <span>{claimablePartnerGram > 0 ? 'Claim' : 'View'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* 3. REFERRAL LINK BOX */}
        <div className="w-full">
          <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-2.5 pl-4 pr-2.5 border border-sky-100 shadow-[0_2px_12px_rgba(0,140,255,0.06)] flex items-center justify-between gap-2">
            
            <span className="text-xs font-bold text-[#1e4878] truncate select-all flex-1">
              {referralLink}
            </span>

            {/* Integrated Clean Copy Button */}
            <button 
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black transition-all shadow-sm active:scale-95 flex-shrink-0 ${
                copied 
                  ? 'bg-emerald-600 text-white shadow-emerald-200' 
                  : 'bg-gradient-to-r from-[#2ecc71] to-[#1e8a4a] text-white hover:brightness-105'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 stroke-white stroke-[2.5] fill-none" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Copied Toast Alert */}
        {copied && (
          <div className="text-center text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-sm animate-fade-in mx-auto w-fit">
            ✓ Referral Link Copied to Clipboard!
          </div>
        )}

        {/* 4. 🎁 REAL REFER MISSIONS & MILESTONES */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#192f52] tracking-tight flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-emerald-600" />
              <span>Referral Missions</span>
            </h3>
            <span className="text-[11px] font-black text-[#38587f] bg-sky-100/70 px-2.5 py-0.5 rounded-full">
              {invitedCount} Invited
            </span>
          </div>

          <div className="space-y-2">
            {REFER_MISSIONS.map((mission) => {
              const isClaimed = !!claimedMissions[mission.id];
              const isReady = !isClaimed && invitedCount >= mission.target;
              const progressRatio = Math.min(1, invitedCount / mission.target);
              const progressPercent = Math.round(progressRatio * 100);

              return (
                <div
                  key={mission.id}
                  className="bg-white/95 backdrop-blur-md rounded-2xl p-3 px-3.5 border border-slate-100 shadow-xs flex flex-col gap-2 transition-all hover:border-sky-200"
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Icon & Mission Info */}
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                        isClaimed 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : isReady 
                          ? 'bg-amber-100 text-amber-600 animate-bounce' 
                          : 'bg-sky-50 text-sky-600'
                      }`}>
                        <Users className="w-4 h-4 stroke-[2.5]" />
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-[#192f52] leading-tight">
                          {mission.title}
                        </h4>
                        
                        {/* Reward Badges */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-[11px] font-extrabold text-red-600">
                            <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
                            +{mission.apples.toLocaleString()}
                          </span>
                          {mission.diamonds > 0 && (
                            <span className="flex items-center gap-1 text-[11px] font-extrabold text-sky-600">
                              <img src={diamondImg} alt="Diamond" className="w-3 h-3 object-contain" />
                              +{mission.diamonds}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Action / Status Button */}
                    <div>
                      {isClaimed ? (
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[11px] font-black px-2.5 py-1 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Claimed</span>
                        </div>
                      ) : isReady ? (
                        <button
                          onClick={() => handleClaimMission(mission)}
                          className="bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-105 active:scale-95 text-white text-[11px] font-black px-3 py-1 rounded-xl shadow-md flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 fill-white" />
                          <span>Claim</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {invitedCount}/{mission.target}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Line */}
                  {!isClaimed && (
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. 👥 REAL INVITED FRIENDS LIST */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#192f52] tracking-tight flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-sky-600" />
              <span>Your Friends List</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              {invitedCount} {invitedCount === 1 ? 'Friend' : 'Friends'}
            </span>
          </div>

          {invitedFriendsList.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-slate-100 py-5">
              <p className="text-xs font-bold text-slate-500">No friends joined yet</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Share your referral link with friends to earn instant rewards!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {invitedFriendsList.map((friend, idx) => (
                <div 
                  key={friend.id || idx}
                  className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 px-3 border border-slate-100 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img src={getAvatarSrc(friend.avatar || 'avatar-1')} alt={friend.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#192f52] leading-tight">
                        {friend.name || 'Friend'}
                      </h4>
                      <p className="text-[10px] font-medium text-slate-400">
                        Joined {friend.date || 'Recently'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <img src={appleImg} alt="Apple" className="w-3 h-3 object-contain" />
                    +100
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ----------------- BOTTOM ACTION (SHARE NOW) ----------------- */}
      <div className="pt-2 flex-shrink-0">
        <button 
          onClick={handleShareNow}
          className="w-full py-3.5 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 transition-all shadow-[0_4px_0_#145a32] border-t border-emerald-300"
        >
          {/* Share/Send Paper Airplane Icon */}
          <div className="w-6 h-6 rounded-lg bg-white/20 border border-white/40 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
          <span>Share Now</span>
        </button>
      </div>

      {/* ================= 💰 CLAIM PROFIT MODAL (15% PARTNER TASK COMMISSION) ================= */}
      {isProfitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#18263e] via-[#101b2d] to-[#0c1424] text-white rounded-3xl p-5 border border-amber-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.7)] flex flex-col max-h-[88vh] overflow-hidden">
            
            {/* Top Glow Accent */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center shadow-md">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-black text-white tracking-tight">Claim Profit</h3>
                    <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-1.5 py-0.2 rounded-full">
                      15% GRAM
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Partner Section Task Tracking Engine</p>
                </div>
              </div>

              <button
                onClick={() => setIsProfitModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto space-y-3.5 py-3 pr-0.5 relative z-10">
              
              {/* 1. Main Profit Balance Card */}
              <div className="bg-gradient-to-b from-white/10 to-white/5 rounded-2xl p-4 border border-amber-400/20 text-center relative overflow-hidden">
                <span className="text-[10px] font-black tracking-wider text-amber-300 uppercase">
                  Available Claimable Profit
                </span>
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-400 my-1">
                  {claimablePartnerGram.toFixed(4)} <span className="text-base font-bold text-amber-300">GRAM</span>
                </div>

                {/* Micro Stats Row */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 mt-2 border-t border-white/10 text-center">
                  <div className="bg-black/25 rounded-xl p-1.5">
                    <div className="text-[9px] text-slate-400 font-bold">Lifetime Earned</div>
                    <div className="text-xs font-black text-emerald-400 truncate">
                      {totalPartnerGramEarned.toFixed(4)} G
                    </div>
                  </div>
                  <div className="bg-black/25 rounded-xl p-1.5">
                    <div className="text-[9px] text-slate-400 font-bold">Claimed</div>
                    <div className="text-xs font-black text-sky-400 truncate">
                      {claimedPartnerGram.toFixed(4)} G
                    </div>
                  </div>
                  <div className="bg-black/25 rounded-xl p-1.5">
                    <div className="text-[9px] text-slate-400 font-bold">Partner Tasks</div>
                    <div className="text-xs font-black text-amber-300 truncate">
                      {partnerReferralTaskCount || profitHistory.length}
                    </div>
                  </div>
                </div>

                {/* 📊 Target 1.0 GRAM Progress Bar (Process Bar - Red Box) */}
                <div className="pt-3 mt-2 border-t border-white/10 text-left space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-black">
                    <span className="text-slate-300 flex items-center gap-1">
                      <span>Payout Target</span>
                      <span className="text-amber-300 font-bold">(Min 1.0 GRAM)</span>
                    </span>
                    <span className="text-emerald-400 font-black">
                      {claimablePartnerGram.toFixed(4)} / 1.0000 GRAM ({progressPercent.toFixed(1)}%)
                    </span>
                  </div>

                  {/* The Process Bar */}
                  <div className="w-full h-3 bg-black/45 rounded-full p-0.5 border border-white/10 overflow-hidden relative">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-500 relative"
                      style={{ width: `${progressPercent}%` }}
                    >
                      {progressPercent > 6 && (
                        <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/80 rounded-full blur-[1px] animate-pulse" />
                      )}
                    </div>
                  </div>

                  <p className="text-[9.5px] text-slate-400 leading-tight">
                    {canClaim 
                      ? '🎉 1.0 GRAM target achieved! Payout will be sent directly from Master Wallet.'
                      : `Earn ${(1.0 - claimablePartnerGram).toFixed(4)} more GRAM to unlock automated on-chain TON payout.`}
                  </p>
                </div>
              </div>

              {/* 👛 Connected TON Wallet Recipient Box */}
              <div className="bg-sky-950/40 border border-sky-500/25 rounded-2xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center flex-shrink-0">
                    <img src={diamondImg} alt="TON" className="w-4 h-4 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-bold">Payout Destination (TON Wallet)</div>
                    <div className="text-xs font-black text-sky-300 truncate">
                      {connectedWallet 
                        ? `${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-6)}` 
                        : 'No Wallet Connected'}
                    </div>
                  </div>
                </div>

                {!connectedWallet ? (
                  <button
                    onClick={() => tonConnectUI?.openModal()}
                    className="px-2.5 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-[10px] active:scale-95 transition-all shadow-sm"
                  >
                    Connect
                  </button>
                ) : (
                  <button
                    onClick={() => tonConnectUI?.openModal()}
                    className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-[9px] active:scale-95 transition-all"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* 2. Main Claim Button */}
              <button
                onClick={handleClaimProfit}
                disabled={isClaimingProfit || (connectedWallet && !canClaim)}
                className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                  isClaimingProfit
                    ? 'bg-amber-600/70 text-white cursor-wait'
                    : !connectedWallet
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:brightness-110 shadow-sky-500/25 cursor-pointer'
                    : canClaim
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white hover:brightness-110 shadow-emerald-500/25 cursor-pointer animate-pulse'
                    : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                }`}
              >
                {isClaimingProfit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending On-Chain Payout from Master...</span>
                  </>
                ) : !connectedWallet ? (
                  <>
                    <span>Connect TON Wallet to Claim</span>
                  </>
                ) : canClaim ? (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                    <span>Claim {claimablePartnerGram.toFixed(4)} GRAM to TON Wallet</span>
                  </>
                ) : (
                  <span>Need 1.0 GRAM to Claim ({progressPercent.toFixed(0)}%)</span>
                )}
              </button>

              {/* 3. How Engine Works Explanation Box */}
              <div className="bg-emerald-950/40 border border-emerald-500/25 rounded-2xl p-3 text-left space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Automated 15% Profit Tracking Engine</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                  <li>
                    Share your invite link with channel owners, bot creators & community leaders.
                  </li>
                  <li>
                    When any friend joins through your link and posts a task in <strong className="text-amber-300">Task → Partner</strong> section, they pay in GRAM.
                  </li>
                  <li>
                    You automatically receive <strong className="text-emerald-400">15% of that GRAM amount</strong> credited directly into your Claim Profit balance!
                  </li>
                </ul>
              </div>

              {/* 4. Referral Partner Campaign History */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-300">Recent Partner Tasks History</span>
                  <span className="text-[10px] text-slate-400 font-bold">{profitHistory.length} Recorded</span>
                </div>

                {isLoadingHistory ? (
                  <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Checking campaign records...</span>
                  </div>
                ) : profitHistory.length === 0 ? (
                  <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-white/5 mx-auto flex items-center justify-center text-slate-400">
                      <Coins className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-300">No partner tasks from your friends yet</p>
                    <p className="text-[10px] text-slate-400">
                      Invite channels and users who launch promotional tasks to start receiving 15% GRAM commission!
                    </p>
                    <button
                      onClick={handleShareNow}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-black text-xs active:scale-95 transition-all shadow-sm inline-flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Share Invite Link</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                    {profitHistory.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-left"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-black text-white truncate">
                            {item.taskTitle || 'Partner Campaign'}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span>By: {item.creatorName || item.creatorUsername || 'Friend'}</span>
                            <span>•</span>
                            <span>Cost: {item.taskGramAmount || 0} GRAM</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-black text-emerald-400">
                            +{Number(item.profitGram || 0).toFixed(4)} G
                          </div>
                          <span className="text-[9px] text-emerald-500/80 font-bold bg-emerald-500/10 px-1 rounded">
                            15% Profit
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-white/10 text-center flex-shrink-0">
              <button
                onClick={() => setIsProfitModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
