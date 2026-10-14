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
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
    if (onClaim) onClaim();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#18392b] via-[#10241b] to-[#0a1811] border border-emerald-500/30 rounded-3xl p-6 text-center shadow-2xl shadow-emerald-950/60 overflow-hidden animate-scale-up">
        {/* Glow backdrop decoration */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-green-500/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Top Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-400/30 rounded-full text-[11px] font-bold text-emerald-300 tracking-wide uppercase mb-3 shadow-sm">
          <span>⚡</span>
          <span>HubCoin Mission Transfer</span>
        </div>

        {/* Floating Reward Icon */}
        <div className="relative my-3 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500/20 to-lime-400/20 flex items-center justify-center border border-emerald-400/30 shadow-lg shadow-emerald-500/20">
            <img
              src={isApple ? '/apple.png' : '/daimond.png'}
              alt={isApple ? 'Apple' : 'Diamond'}
              className="w-16 h-16 object-contain drop-shadow-[0_8px_16px_rgba(16,185,129,0.4)] animate-bounce"
              style={{ animationDuration: '2s' }}
            />
          </div>
        </div>

        {/* Title & Amount */}
        <h3 className="text-xl font-black text-white tracking-tight mt-2">
          Rewards Received!
        </h3>

        <div className="my-2.5 inline-block px-4 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/20">
          <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 via-lime-300 to-green-400 bg-clip-text text-transparent">
            +{amount.toLocaleString()} {isApple ? 'Apples' : 'Diamonds'}
          </span>
        </div>

        <p className="text-xs text-emerald-100/70 leading-relaxed px-2">
          Your rewards from the <strong>HubCoin Mini App</strong> mission have been successfully credited to your Apple Farm orchard!
        </p>

        {/* Transaction Info Pill */}
        <div className="mt-3.5 mb-4 px-3 py-1.5 bg-black/30 border border-emerald-500/15 rounded-xl text-[10px] text-emerald-300/60 font-mono">
          Ref TX: <span className="text-emerald-300/90 font-semibold">{txId}</span>
        </div>

        {/* Claim / Continue Button */}
        <button
          onClick={handleClaim}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 active:scale-95 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-600/30 transition-all duration-150 flex items-center justify-center gap-2"
        >
          <span>Claim to Orchard</span>
          <span>🍎</span>
        </button>
      </div>
    </div>
  );
}
