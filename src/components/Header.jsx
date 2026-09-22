import React from 'react';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';

export default function Header({ user, onWithdrawClick }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-emerald-100">
      {/* Profile info */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full border-2 border-amber-400 bg-amber-100 flex items-center justify-center font-bold text-amber-800 text-sm">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <div className="text-sm font-bold text-gray-800">{user.name}</div>
          <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold">
            Lv.{user.level}
          </span>
        </div>
      </div>

      {/* Balances */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
          <img src={diamondImg} alt="Diamond" className="w-4 h-4 object-contain" />
          <span className="text-xs font-bold text-sky-800">{Number(user.diamonds || 0).toFixed(1)}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-red-50 pl-2 pr-1 py-1 rounded-full border border-red-200">
          <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
          <span className="text-xs font-bold text-red-700">{(user.apples || 0).toLocaleString()}</span>
          <button 
            onClick={onWithdrawClick}
            className="ml-1 bg-farm-light-green hover:bg-farm-green text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm active:scale-95 transition-all">
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}
