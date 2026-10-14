import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  verifyTelegramMembership, 
  OFFICIAL_COMMUNITY_URL, 
  OFFICIAL_PAYOUTS_URL 
} from '../utils/telegramVerify';
import { soundManager } from '../utils/soundManager';

export default function MandatoryChannelGate({ user, onUnlocked }) {
  const [communityVerified, setCommunityVerified] = useState(false);
  const [payoutVerified, setPayoutVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasCheckedInitially, setHasCheckedInitially] = useState(false);

  const tgUserId = user?.id || window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  if (!tgUserId) {
    return null;
  }

  // Verify both channels via real Telegram Bot API
  const performVerification = useCallback(async (isInitial = false) => {
    if (!tgUserId) return;
    setIsVerifying(true);
    setErrorMessage('');

    try {
      // 1. Check Community Channel
      const commRes = await verifyTelegramMembership(tgUserId, OFFICIAL_COMMUNITY_URL);
      const isCommMember = !!commRes.verified;
      setCommunityVerified(isCommMember);

      // 2. Check Payout Proofs Channel
      const payRes = await verifyTelegramMembership(tgUserId, OFFICIAL_PAYOUTS_URL);
      const isPayMember = !!payRes.verified;
      setPayoutVerified(isPayMember);

      if (isCommMember && isPayMember) {
        soundManager.play('reward');
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#2ecc71', '#f1c40f', '#3498db']
        });
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        setTimeout(() => {
          if (onUnlocked) onUnlocked();
        }, 700);
      } else if (!isInitial) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
        if (!isCommMember && !isPayMember) {
          setErrorMessage('Please join BOTH channels below to enter Apple Farm.');
        } else if (!isCommMember) {
          setErrorMessage('Please join our Official Community Channel first.');
        } else {
          setErrorMessage('Please join our Payment Proofs Channel first.');
        }
      }
    } catch (err) {
      console.warn('Channel verification error:', err);
      if (!isInitial) {
        setErrorMessage('Verification server busy. Please make sure you joined and click Verify again.');
      }
    } finally {
      setIsVerifying(false);
      setHasCheckedInitially(true);
    }
  }, [tgUserId, onUnlocked]);

  // Initial check on mount
  useEffect(() => {
    if (tgUserId) {
      performVerification(true);
    }
  }, [tgUserId, performVerification]);

  // Re-check automatically when user returns from joining channel in Telegram
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && tgUserId && (!communityVerified || !payoutVerified)) {
        performVerification(false);
      }
    };
    const handleFocus = () => {
      if (tgUserId && (!communityVerified || !payoutVerified)) {
        performVerification(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [tgUserId, communityVerified, payoutVerified, performVerification]);

  const handleOpenLink = (url) => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    try {
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(url);
      } else if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  // If both are already verified and checked, gate is unlocked
  if (communityVerified && payoutVerified && hasCheckedInitially) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade-in"
      style={{ touchAction: 'none' }}
    >
      <div 
        className="relative w-full max-w-[340px] bg-gradient-to-b from-[#f0fbf2] via-white to-[#e6f7ec] rounded-3xl p-5 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)] border-2 border-white/90 space-y-3.5 overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background decorative glows matching Apple Farm */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-300/30 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-amber-300/25 rounded-full blur-xl pointer-events-none" />

        {/* Top Halo Icon */}
        <div className="flex justify-center pt-1">
          <div className="w-16 h-16 rounded-full bg-emerald-100 ring-8 ring-emerald-50 flex items-center justify-center shadow-xs">
            <svg className="w-9 h-9 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#d1fae5" />
              <path d="m9 12 2 2 4-4" stroke="#059669" strokeWidth="3" />
            </svg>
          </div>
        </div>

        {/* Title & Instructions */}
        <div className="space-y-1 px-1">
          <h2 className="text-xl font-black text-[#152e4d] tracking-tight leading-tight">
            Join Official Channels
          </h2>
          <p className="text-[11px] font-bold text-slate-500 leading-snug">
            To prevent bots, protect your airdrop rewards, and enter Apple Farm, please join both channels below.
          </p>
        </div>

        {/* Channel 1: Official Community */}
        <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-2.5 text-left transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-5 h-5 text-white fill-white" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-[#152e4d] truncate">Main Community</h4>
              <p className="text-[10px] font-bold text-sky-600 truncate">@AppleFarmCommunity</p>
            </div>
          </div>

          <div>
            {communityVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 text-[11px] font-black">
                <svg className="w-3.5 h-3.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Joined
              </span>
            ) : (
              <button
                onClick={() => handleOpenLink(OFFICIAL_COMMUNITY_URL)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-b from-[#0088cc] to-[#006699] text-white font-black text-xs shadow-[0_3px_0_#004d73] active:translate-y-0.5 transition-all cursor-pointer"
              >
                Join
              </button>
            )}
          </div>
        </div>

        {/* Channel 2: Payment Proofs Channel */}
        <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-2.5 text-left transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-[#152e4d] truncate">Payment Proofs</h4>
              <p className="text-[10px] font-bold text-amber-600 truncate">@AppleFarmPayouts</p>
            </div>
          </div>

          <div>
            {payoutVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 text-[11px] font-black">
                <svg className="w-3.5 h-3.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Joined
              </span>
            ) : (
              <button
                onClick={() => handleOpenLink(OFFICIAL_PAYOUTS_URL)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-b from-[#f39c12] to-[#d68910] text-white font-black text-xs shadow-[0_3px_0_#9c640c] active:translate-y-0.5 transition-all cursor-pointer"
              >
                Join
              </button>
            )}
          </div>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold leading-tight animate-shake">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Verify & Enter Button */}
        <div className="pt-1">
          <button
            onClick={() => performVerification(false)}
            disabled={isVerifying}
            className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide text-white transition-all shadow-[0_4px_0_#145a32] active:translate-y-1 active:shadow-none cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-b from-[#2ecc71] to-[#1e824c] border-t border-emerald-300 ${
              isVerifying ? 'opacity-80 cursor-wait' : ''
            }`}
          >
            {isVerifying ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Verifying with Telegram...</span>
              </>
            ) : (
              <span>Verify & Enter App</span>
            )}
          </button>
        </div>

        {/* Security / Verification footer note */}
        <p className="text-[10px] text-slate-400 font-bold">
          Official verification powered by @AppleFarmOfficialBot
        </p>

      </div>
    </div>
  );
}
