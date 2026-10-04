import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  Filter,
  CheckCircle2,
  Wallet,
  AlertCircle
} from 'lucide-react';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import gramImg from '../../assets/gram.png';
import bksImg from '../../assets/bks.png';
import { getTransactions, fetchUserTransactions } from '../utils/transactionHistory';

export default function TransactionHistoryModal({ isOpen, onClose, userId, mode = 'all' }) {
  const isWithdrawMode = mode === 'withdraw';
  const [filter, setFilter] = useState(isWithdrawMode ? 'all' : 'earn'); // in withdraw mode: 'all' | 'completed' | 'pending'; in all mode: 'earn' | 'spend'
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFilter(isWithdrawMode ? 'all' : 'earn');
      const cached = getTransactions(userId);
      setTransactions(cached);
      if (userId) {
        setIsLoading(true);
        fetchUserTransactions(userId).then((res) => {
          setTransactions(res || []);
          setIsLoading(false);
        });
      }
    }
  }, [isOpen, userId, isWithdrawMode]);

  if (!isOpen) return null;

  // Filtered transactions
  let filteredList = [];
  if (isWithdrawMode) {
    const withdrawTxs = transactions.filter((tx) => 
      tx.category === 'withdraw' || 
      tx.type === 'spend' || 
      tx.title?.toLowerCase().includes('withdraw') || 
      tx.title?.toLowerCase().includes('payout')
    );
    if (filter === 'completed') {
      filteredList = withdrawTxs.filter((tx) => tx.status === 'Completed' || tx.status === 'Success');
    } else if (filter === 'pending') {
      filteredList = withdrawTxs.filter((tx) => tx.status !== 'Completed' && tx.status !== 'Success');
    } else {
      filteredList = withdrawTxs;
    }
  } else {
    filteredList = transactions.filter((tx) => {
      if (filter === 'spend') return tx.type === 'spend';
      return tx.type === 'earn'; // Default to Earned
    });
  }

  // Calculate totals
  const totalEarnedApples = transactions
    .filter((tx) => tx.type === 'earn' && tx.currency === 'apple')
    .reduce((acc, tx) => acc + (parseFloat(tx.amount.replace('+', '')) || 0), 0);

  const withdrawOnlyList = transactions.filter((tx) => 
    tx.category === 'withdraw' || 
    tx.type === 'spend' || 
    tx.title?.toLowerCase().includes('withdraw') || 
    tx.title?.toLowerCase().includes('payout')
  );

  const totalSpentApples = withdrawOnlyList
    .reduce((acc, tx) => acc + (Math.abs(parseFloat(tx.amount.replace('-', ''))) || 0), 0);

  const completedWithdrawalsCount = withdrawOnlyList.filter(
    (tx) => tx.status === 'Completed' || tx.status === 'Success'
  ).length;

  const pendingWithdrawalsCount = withdrawOnlyList.filter(
    (tx) => tx.status !== 'Completed' && tx.status !== 'Success'
  ).length;

  // Category Icon Resolver
  const getCategoryIcon = (tx) => {
    if (isWithdrawMode || tx.category === 'withdraw') {
      if (tx.title?.includes('GRAM') || tx.subtitle?.includes('GRAM')) {
        return (
          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center p-1.5 flex-shrink-0 shadow-xs">
            <img src={gramImg} alt="GRAM" className="w-full h-full object-contain" />
          </div>
        );
      }
      if (tx.title?.toLowerCase().includes('bkash') || tx.subtitle?.toLowerCase().includes('bkash')) {
        return (
          <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center p-1.5 flex-shrink-0 shadow-xs">
            <img src={bksImg} alt="bKash" className="w-full h-full object-contain" />
          </div>
        );
      }
      return (
        <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 flex-shrink-0 shadow-xs">
          <ArrowUpRight className="w-5 h-5 stroke-[2.8]" />
        </div>
      );
    }

    if (tx.type === 'spend') {
      return (
        <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 flex-shrink-0 shadow-xs">
          <ArrowUpRight className="w-5 h-5 stroke-[2.8]" />
        </div>
      );
    }

    // Earned / Received
    return (
      <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-xs">
        <ArrowDownLeft className="w-5 h-5 stroke-[2.8]" />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in p-0 sm:p-4">
      <div className="bg-gradient-to-b from-[#f7fbff] to-[#edf7ee] w-full max-w-md h-[90vh] sm:h-[85vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border border-sky-100 animate-slide-up">
        
        {/* ----------------- TOP HEADER ----------------- */}
        <div className="p-4 px-5 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#192f52] tracking-tight">
                {isWithdrawMode ? 'Withdrawal History' : 'Transaction History'}
              </h2>
              <span className="text-[10px] font-black bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                {filteredList.length} Records
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400">
              {isWithdrawMode 
                ? 'Overview of your payouts, on-chain TON and cashout records'
                : 'Overview of all earnings, rewards & payouts'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center active:scale-95 transition-all"
          >
            ✕
          </button>
        </div>

        {/* ----------------- SUMMARY CARDS ----------------- */}
        <div className="p-4 pb-2 grid grid-cols-2 gap-3">
          {isWithdrawMode ? (
            <>
              {/* Total Withdrawn Apples */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-rose-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Total Payouts</span>
                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                    <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                  <span className="text-base font-black text-[#192f52]">
                    -{totalSpentApples.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Success Count */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-emerald-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Completed</span>
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-base font-black text-emerald-600">
                    {completedWithdrawalsCount} Payouts
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Total Earned */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-emerald-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Total Inflow</span>
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <ArrowDownLeft className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                  <span className="text-base font-black text-emerald-600">
                    +{totalEarnedApples.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Total Spent / Withdrawn */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-rose-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Total Outflow</span>
                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                    <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                  <span className="text-base font-black text-[#192f52]">
                    -{totalSpentApples.toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ----------------- CATEGORY / STATUS TABS ----------------- */}
        <div className="px-4 py-2">
          {isWithdrawMode ? (
            /* Withdraw Mode: 3 Tabs (All, Completed, Pending) */
            <div className="flex items-center bg-[#e4eff8] p-1 rounded-2xl gap-1">
              <button
                onClick={() => {
                  setFilter('all');
                  if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.selectionChanged();
                }}
                className={`flex-1 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 ${
                  filter === 'all'
                    ? 'bg-white text-[#192f52] shadow-sm'
                    : 'text-[#506e8c] hover:text-[#192f52]'
                }`}
              >
                <span>All</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-600">
                  {withdrawOnlyList.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setFilter('completed');
                  if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.selectionChanged();
                }}
                className={`flex-1 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 ${
                  filter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[#506e8c] hover:text-[#192f52]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  filter === 'completed' ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {completedWithdrawalsCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setFilter('pending');
                  if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.selectionChanged();
                }}
                className={`flex-1 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 ${
                  filter === 'pending'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-[#506e8c] hover:text-[#192f52]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  filter === 'pending' ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {pendingWithdrawalsCount}
                </span>
              </button>
            </div>
          ) : (
            /* General Mode: 2 Tabs (Earned vs Spent) */
            <div className="flex items-center bg-[#e4eff8] p-1 rounded-2xl">
              <button
                onClick={() => {
                  setFilter('earn');
                  if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.selectionChanged();
                }}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  filter === 'earn'
                    ? 'bg-gradient-to-r from-[#2ecc71] to-[#20a058] text-white shadow-md'
                    : 'text-[#506e8c] hover:text-[#192f52]'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
                <span>Earned</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  filter === 'earn' ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {transactions.filter(t => t.type === 'earn').length}
                </span>
              </button>

              <button
                onClick={() => {
                  setFilter('spend');
                  if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.selectionChanged();
                }}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  filter === 'spend'
                    ? 'bg-gradient-to-r from-[#ff5252] to-[#d63031] text-white shadow-md'
                    : 'text-[#506e8c] hover:text-[#192f52]'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                <span>Spent</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  filter === 'spend' ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {transactions.filter(t => t.type === 'spend').length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ----------------- TRANSACTIONS LIST ----------------- */}
        <div className="flex-1 p-4 pt-1 space-y-2.5 overflow-y-auto">
          {filteredList.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                {isWithdrawMode ? <Wallet className="w-6 h-6 stroke-[2]" /> : <Filter className="w-6 h-6 stroke-[2]" />}
              </div>
              <p className="text-sm font-extrabold text-slate-600">
                {isWithdrawMode ? 'No Withdrawals Found' : 'No Transactions Found'}
              </p>
              <p className="text-xs font-medium text-slate-400">
                {isWithdrawMode 
                  ? 'Your payout records will appear here after you place a withdrawal.' 
                  : 'There are no records in this category yet.'}
              </p>
            </div>
          ) : (
            filteredList.map((tx) => {
              const isEarn = tx.type === 'earn';
              const isDiamond = tx.currency === 'diamond';
              const isCompleted = tx.status === 'Completed' || tx.status === 'Success';

              return (
                <div
                  key={tx.id}
                  className="bg-white/95 backdrop-blur-md rounded-2xl p-3 px-3.5 border border-slate-100 shadow-xs flex items-center justify-between gap-3 hover:border-sky-200 transition-all"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    {getCategoryIcon(tx)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-[#192f52] truncate">
                          {tx.title}
                        </h4>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 truncate">
                        {tx.subtitle || tx.category}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {tx.date}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md flex items-center gap-1 ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount Badge */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center justify-end gap-1">
                      <img
                        src={isDiamond ? diamondImg : appleImg}
                        alt="Currency"
                        className="w-4 h-4 object-contain"
                      />
                      <span
                        className={`text-sm font-black ${
                          isEarn
                            ? isDiamond ? 'text-[#0098EA]' : 'text-emerald-600'
                            : 'text-[#e74c3c]'
                        }`}
                      >
                        {tx.amount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ----------------- BOTTOM CLOSE BUTTON ----------------- */}
        <div className="p-4 bg-white/90 backdrop-blur-md border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-[#2ecc71] to-[#1e8a4a] text-white font-black text-sm rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
