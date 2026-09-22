import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

const GATEWAYS = [
  { id: 'ton', name: 'GRAM (TON)', fee: 'Instant • Low Fee', icon: '💎' },
  { id: 'bkash', name: 'bKash', fee: 'Instant • 1.5% Fee', icon: '🇧🇩' },
  { id: 'upi', name: 'UPI', fee: 'Instant • Low Fee', icon: '🇮🇳' },
  { id: 'jazzcash', name: 'JazzCash', fee: 'Instant • Low Fee', icon: '🇵🇰' },
  { id: 'esewa', name: 'eSewa', fee: 'Instant • Low Fee', icon: '🇳🇵' },
  { id: 'stcpay', name: 'STC Pay', fee: 'Instant • Low Fee', icon: '🇸🇦' },
];

export default function Withdraw({ user, setTab }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [success, setSuccess] = useState(false);

  const handleWithdraw = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setSelectedMethod(null);
      setAccountNumber('');
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => setTab('home')} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h2 className="text-base font-bold text-gray-800">Withdraw Funds</h2>
      </div>

      {/* Balance Summary Card */}
      <div className="p-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl text-white shadow-md flex justify-between items-center">
        <div>
          <span className="text-xs opacity-90">Available Harvest</span>
          <div className="text-2xl font-black">{(user.apples || 0).toLocaleString()} 🍎</div>
        </div>
        <div className="text-right">
          <span className="text-xs opacity-90">Estimated Value</span>
          <div className="text-lg font-bold">${((user.apples || 0) * 0.001).toFixed(2)}</div>
        </div>
      </div>

      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Choose Payment Method</h3>

      {/* Gateway List */}
      <div className="space-y-2">
        {GATEWAYS.map((g) => (
          <div 
            key={g.id}
            onClick={() => setSelectedMethod(g)}
            className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-emerald-400 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{g.icon}</span>
              <div>
                <div className="text-sm font-bold text-gray-800">{g.name}</div>
                <div className="text-[10px] text-gray-400">{g.fee}</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        ))}
      </div>

      {/* Withdraw Modal */}
      {selectedMethod && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-gray-800 text-base">Withdraw via {selectedMethod.name}</h3>
            
            {success ? (
              <div className="py-6 text-center text-emerald-600 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                <span className="font-bold">Withdrawal Request Submitted!</span>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-3">
                <input 
                  type="text" 
                  placeholder={`Enter ${selectedMethod.name} Number/Address`}
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-farm-light-green"
                />
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setSelectedMethod(null)}
                    className="w-1/2 py-2.5 bg-gray-100 font-bold text-xs text-gray-600 rounded-xl active:scale-95 transition-all">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 py-2.5 bg-farm-light-green hover:bg-farm-green text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all">
                    Confirm
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
