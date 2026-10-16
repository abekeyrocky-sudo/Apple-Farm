import React from 'react';
import confetti from 'canvas-confetti';

export default function HubcoinRewardModal({
  reward,
  onClaim
}) {
  if (!reward) return null;

  const isApple = reward.type === 'apple';
  const amount = Number(reward.amount || 0);
  const txId = reward.txId || 'TXHUB-DIRECT';

  const handleClaim = () => {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (e) {}
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}
    if (onClaim) onClaim();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in select-none">
      <div 
        className="relative w-full max-w-xs bg-white/98 backdrop-blur-md rounded-3xl p-6 text-center shadow-2xl border border-emerald-100 space-y-3.5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          onClick={handleClaim}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold text-xs active:scale-90 transition-all cursor-pointer"
          title="Close"
        >
          ✕
        </button>

        {/* Top Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-700 tracking-wide uppercase shadow-xs">
          <span>Apple Mission Transfer</span>
        </div>

        {/* Still Reward Icon (Static, Light Emerald Halo) */}
        <div className="flex justify-center pt-1">
          <div className="w-20 h-20 rounded-full bg-emerald-50 ring-8 ring-emerald-50/70 border border-emerald-100 flex items-center justify-center shadow-xs">
            <img
              src={isApple ? '/apple.png' : '/daimond.png'}
              alt={isApple ? 'Apple' : 'Diamond'}
              className="w-13 h-13 object-contain filter drop-shadow-sm"
            />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1 px-1">
          <h3 className="text-lg font-black text-[#192f52] tracking-tight leading-snug">
            Rewards Received
          </h3>
          <p className="text-xs font-semibold text-[#6483a7] leading-relaxed">
            Your rewards from the <strong>Apple Mission</strong> have been successfully credited to your Apple Farm orchard.
          </p>
        </div>

        {/* Reward Counter Badge (Clean Light Green) */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 px-4 py-2 rounded-2xl shadow-xs">
          <img
            src={isApple ? '/apple.png' : '/daimond.png'}
            alt="Reward"
            className="w-5 h-5 object-contain filter drop-shadow-xs"
          />
          <span className="text-base font-black text-emerald-700">
            +{amount.toLocaleString()} {isApple ? 'Apples' : 'Diamonds'}
          </span>
        </div>

        {/* Transaction Info Pill */}
        <div>
          <div className="inline-block px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 font-mono">
            Ref TX: <span className="text-slate-700 font-semibold">{txId}</span>
          </div>
        </div>

        {/* Claim / Continue Button (Clean, No Emojis, No Bounce) */}
        <div className="pt-1">
          <button
            onClick={handleClaim}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 active:scale-95 text-white font-black text-xs tracking-wide shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
          >
            Claim to Orchard
          </button>
        </div>
      </div>
    </div>
  );
}
