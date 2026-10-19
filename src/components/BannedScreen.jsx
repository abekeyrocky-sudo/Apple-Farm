import React from 'react';
import { ShieldAlert, AlertTriangle, XCircle, LogOut } from 'lucide-react';
import CustomTitleBar from './CustomTitleBar';

export default function BannedScreen({ user }) {
  const handleClose = () => {
    if (window.Telegram?.WebApp?.close) {
      window.Telegram.WebApp.close();
    } else {
      window.location.href = 'about:blank';
    }
  };

  const banReason = user?.banReason || "Permanent Ban: Fraudulent unauthorized balance injection and violation of Apple Farm Fair-Play Terms.";
  const userId = user?.id || 'Unknown';
  const userName = user?.name || 'Farmer';

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-slate-900 via-rose-950 to-slate-950 text-white flex flex-col justify-between select-none font-sans overflow-hidden">
      
      {/* Background Warning Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="pt-2 px-4 pb-2 z-20">
        <CustomTitleBar title="Apple Farm" darkText={false} />
      </div>

      {/* Center Notice Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center z-10">
        
        {/* Animated Warning Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center animate-pulse">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center shadow-lg shadow-rose-900/50">
              <ShieldAlert className="w-9 h-9 text-white stroke-[2.2]" />
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-600 border-2 border-slate-900 flex items-center justify-center">
            <XCircle className="w-4 h-4 text-white" />
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-rose-100 tracking-tight mb-2">
          Account Suspended
        </h1>
        <div className="inline-flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-6">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Permanently Banned</span>
        </div>

        {/* Details Card */}
        <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-left space-y-3 mb-6 shadow-xl">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Farmer Account</span>
            <span className="text-sm font-black text-white">{userName} <span className="text-xs text-slate-400 font-mono">(ID: {userId})</span></span>
          </div>

          <div className="border-t border-white/5 pt-2">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Reason for Ban</span>
            <p className="text-xs font-semibold text-rose-200 mt-0.5 leading-relaxed">
              {banReason}
            </p>
          </div>

          <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Status</span>
            <span className="text-rose-400 font-black">Access Revoked</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Your access to Apple Farm features, leaderboards, and balances has been permanently revoked due to fair-play violations.
        </p>
      </div>

      {/* Bottom Button */}
      <div className="p-6 z-20">
        <button
          onClick={handleClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:brightness-110 active:scale-95 text-white font-black text-sm tracking-wide shadow-lg shadow-rose-950/60 border-t border-rose-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Close App</span>
        </button>
      </div>

    </div>
  );
}
