import React from 'react';
import confetti from 'canvas-confetti';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';

// Utility to remove all '!' and emojis from popup text
export function sanitizePopupText(val) {
  if (val === null || val === undefined) return '';
  if (typeof val !== 'string') return val;
  return val
    .replace(/!+/g, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{20E3}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export default function CustomPopupModal({
  isOpen = false,
  type = 'success', // 'success' | 'warn' | 'reward' | 'error' | 'info'
  title = '',
  message = '',
  rewardAmount = null,
  rewardType = 'apple', // 'apple' | 'diamond'
  confirmText = 'Got It',
  cancelText = null,
  hideClose = false,
  isMandatory = false,
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  const cleanTitle = sanitizePopupText(title || (type === 'success' ? 'Success' : type === 'warn' ? 'Attention' : 'Notification'));
  const cleanMessage = sanitizePopupText(message);
  const cleanConfirmText = sanitizePopupText(confirmText || 'Got It');
  const cleanCancelText = cancelText ? sanitizePopupText(cancelText) : null;

  const handleConfirm = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    if (type === 'success' || type === 'reward') {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    }
    if (onConfirm) onConfirm();
    if (onClose && !isMandatory) onClose();
  };

  const handleCancel = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    if (onClose) onClose();
  };

  // Vector Graphics & Theme Palettes for different modal types
  const config = {
    success: {
      gradient: 'from-emerald-500 to-green-600',
      shadow: 'shadow-emerald-500/25',
      border: 'border-emerald-200',
      btnBg: 'bg-gradient-to-b from-[#2ecc71] to-[#1e824c] border-emerald-300 shadow-[0_4px_0_#145a32]',
      icon: (
        <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" fill="#2ecc71" stroke="#27ae60" strokeWidth="1.5" />
          <path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      halo: 'bg-emerald-100 ring-8 ring-emerald-50',
    },
    warn: {
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
      border: 'border-amber-200',
      btnBg: 'bg-gradient-to-b from-[#f39c12] to-[#d68910] border-amber-300 shadow-[0_4px_0_#9c640c]',
      icon: (
        <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L1 21h22L12 2z" fill="#f39c12" stroke="#d68910" strokeWidth="1.5" />
          <path d="M12 9v5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.25" fill="white" />
        </svg>
      ),
      halo: 'bg-amber-100 ring-8 ring-amber-50',
    },
    reward: {
      gradient: 'from-amber-400 via-yellow-400 to-amber-500',
      shadow: 'shadow-amber-400/30',
      border: 'border-amber-300',
      btnBg: 'bg-gradient-to-b from-[#f1c40f] to-[#d4ac0d] text-amber-950 border-yellow-200 shadow-[0_4px_0_#9a7d0a]',
      icon: (
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 animate-ping opacity-25 rounded-full bg-amber-400" />
          <img
            src={rewardType === 'diamond' ? diamondImg : appleImg}
            alt="Reward"
            className="w-14 h-14 object-contain filter drop-shadow-lg transform hover:scale-110 transition-transform"
          />
        </div>
      ),
      halo: 'bg-amber-100 ring-8 ring-amber-50',
    },
    error: {
      gradient: 'from-rose-500 to-red-600',
      shadow: 'shadow-rose-500/25',
      border: 'border-rose-200',
      btnBg: 'bg-gradient-to-b from-[#e74c3c] to-[#c0392b] border-rose-300 shadow-[0_4px_0_#922b21]',
      icon: (
        <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#e74c3c" stroke="#c0392b" strokeWidth="1.5" />
          <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
      halo: 'bg-rose-100 ring-8 ring-rose-50',
    },
    info: {
      gradient: 'from-sky-500 to-blue-600',
      shadow: 'shadow-sky-500/25',
      border: 'border-sky-200',
      btnBg: 'bg-gradient-to-b from-[#3498db] to-[#2980b9] border-sky-300 shadow-[0_4px_0_#1b4f72]',
      icon: (
        <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#3498db" stroke="#2980b9" strokeWidth="1.5" />
          <path d="M12 8v.01M12 11v5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
      halo: 'bg-sky-100 ring-8 ring-sky-50',
    }
  }[type] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in select-none">
      <div 
        className={`relative w-full max-w-xs bg-white/95 backdrop-blur-md rounded-3xl p-6 text-center shadow-2xl border ${config.border} space-y-4 animate-scale-up`}
      >
        {/* Top Close Button */}
        {!hideClose && !isMandatory && (
          <button
            onClick={handleCancel}
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold text-xs active:scale-90 transition-all cursor-pointer"
          >
            ✕
          </button>
        )}

        {/* Vector Icon Badge Container */}
        <div className="flex justify-center pt-1">
          <div className={`w-20 h-20 rounded-full ${config.halo} flex items-center justify-center transition-transform transform hover:scale-105`}>
            {config.icon}
          </div>
        </div>

        {/* Title & Message */}
        <div className="space-y-1.5 px-1">
          <h3 className="text-lg font-black text-[#192f52] tracking-tight leading-snug">
            {cleanTitle}
          </h3>
          <p className="text-xs font-bold text-[#6483a7] leading-relaxed">
            {cleanMessage}
          </p>
        </div>

        {/* Optional Reward Counter Badge */}
        {rewardAmount !== null && (
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 px-4 py-2 rounded-2xl shadow-xs">
            <img 
              src={rewardType === 'diamond' ? diamondImg : appleImg} 
              alt="Reward" 
              className="w-6 h-6 object-contain filter drop-shadow-sm" 
            />
            <span className="text-base font-black text-[#192f52]">
              +{Number(rewardAmount).toLocaleString()} {rewardType === 'diamond' ? 'Diamonds' : 'Apples'}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className={`pt-2 flex gap-2 ${cleanCancelText ? 'grid grid-cols-2' : ''}`}>
          {cleanCancelText && (
            <button
              onClick={handleCancel}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs active:scale-95 transition-all"
            >
              {cleanCancelText}
            </button>
          )}

          <button
            onClick={handleConfirm}
            className={`w-full py-3 rounded-2xl ${config.btnBg} text-white font-black text-xs tracking-wide active:scale-95 transition-all border-t`}
          >
            {cleanConfirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
