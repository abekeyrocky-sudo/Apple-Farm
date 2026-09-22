import React from 'react';
import { CheckSquare, PlayCircle, Users } from 'lucide-react';

export default function Home({ setTab }) {
  return (
    <div className="space-y-4">
      {/* 3 Quick Cards */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setTab('task')} className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex flex-col items-center hover:bg-amber-100/70 active:scale-95 transition-all">
          <CheckSquare className="w-6 h-6 text-amber-600 mb-1" />
          <span className="text-[11px] font-bold text-gray-700">Daily Task</span>
          <span className="text-[9px] text-amber-700">Get Rewards</span>
        </button>

        <button onClick={() => setTab('ads')} className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200 flex flex-col items-center hover:bg-indigo-100/70 active:scale-95 transition-all">
          <PlayCircle className="w-6 h-6 text-indigo-600 mb-1" />
          <span className="text-[11px] font-bold text-gray-700">Watch Ads</span>
          <span className="text-[9px] text-indigo-700">+50 Apples</span>
        </button>

        <button onClick={() => setTab('invite')} className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 flex flex-col items-center hover:bg-purple-100/70 active:scale-95 transition-all">
          <Users className="w-6 h-6 text-purple-600 mb-1" />
          <span className="text-[11px] font-bold text-gray-700">Invite Friends</span>
          <span className="text-[9px] text-purple-700">10% Comm.</span>
        </button>
      </div>

      {/* Main Farm Illustration / Mini Click Banner */}
      <div className="relative h-72 rounded-3xl overflow-hidden bg-gradient-to-b from-sky-300 via-sky-100 to-green-100 border-2 border-emerald-300 shadow-inner flex flex-col items-center justify-end p-4">
        <div className="absolute top-4 text-center">
          <h3 className="font-extrabold text-emerald-900 text-lg">Harvest Season is Live!</h3>
          <p className="text-xs text-emerald-700">Tap tree to collect fresh apples</p>
        </div>

        <div className="text-7xl mb-2 animate-bounce cursor-pointer" onClick={() => setTab('mine')}>
          🌳
        </div>

        <button 
          onClick={() => setTab('mine')}
          className="w-full py-2.5 bg-gradient-to-r from-farm-light-green to-farm-green hover:from-emerald-500 hover:to-emerald-700 text-white font-extrabold rounded-2xl shadow-lg border border-emerald-400 active:scale-98 transition-all">
          GO TO ORCHARD 🍎
        </button>
      </div>
    </div>
  );
}
