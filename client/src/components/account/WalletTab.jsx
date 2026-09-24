import React, { useState } from 'react';
import { Wallet, PlusCircle, ArrowUpRight, ShieldCheck, Zap, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_URL } from '../../config';

const WalletTab = ({ walletData, onRefreshWallet }) => {
  const [customAmount, setCustomAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const balance = walletData?.balance || 0;
  const transactions = walletData?.transactions || [];

  const handleAddMoney = async (amountToAdd) => {
    const amt = Number(amountToAdd);
    if (!amt || amt <= 0) {
      setNotice({ type: 'error', text: 'Please select or enter a valid amount' });
      return;
    }

    setIsAdding(true);
    setNotice({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/account/wallet/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: amt })
      });

      const data = await res.json();
      if (res.ok) {
        setNotice({ type: 'success', text: data.message || `₹${amt} added successfully!` });
        setCustomAmount('');
        if (onRefreshWallet) onRefreshWallet();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to add money' });
      }
    } catch (err) {
      setNotice({ type: 'error', text: 'Server connection error. Please retry.' });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet size={18} />
            </span>
            <span>FreshCart Wallet</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Instant 1-click checkout, zero payment drops, and automatic refund credits.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefreshWallet}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition self-end sm:self-center"
          title="Refresh Balance"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Notice */}
      {notice.text && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
          notice.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
        }`}>
          {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Balance Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#00B074] via-[#009663] to-emerald-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-[#00B074]/20">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100/80">Available Wallet Balance</span>
            <div className="text-4xl sm:text-5xl font-black tracking-tight mt-1">
              ₹{balance.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-emerald-100/90 font-medium mt-2 flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span>100% Reserve Protected • RBI Compliant</span>
            </p>
          </div>

          {/* Quick Recharge Chips */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 w-full md:w-auto space-y-3">
            <span className="text-[11px] font-bold text-emerald-100 block">Quick Top-Up</span>
            <div className="flex items-center gap-2">
              {[100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={isAdding}
                  onClick={() => handleAddMoney(amt)}
                  className="px-3.5 py-1.5 bg-white text-emerald-900 rounded-xl text-xs font-black hover:bg-emerald-50 transition shadow-sm active:scale-95 disabled:opacity-50"
                >
                  +₹{amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Custom Amount Form */}
      <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-3">
        <label className="text-xs font-bold text-slate-700 block">Recharge with custom amount</label>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="10"
              max="10000"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount (e.g. 150)"
              className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00B074]/30"
            />
          </div>
          <button
            type="button"
            disabled={isAdding || !customAmount}
            onClick={() => handleAddMoney(customAmount)}
            className="px-5 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
          >
            <PlusCircle size={14} />
            <span>{isAdding ? 'Adding...' : 'Add Funds'}</span>
          </button>
        </div>
      </div>

      {/* Perks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/60 space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Zap size={16} />
          </div>
          <h4 className="text-xs font-black text-slate-900">Zero Payment Failure</h4>
          <p className="text-[11px] text-slate-500 font-medium">Bypass bank OTPs and gateway downtime for instant quick checkout.</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/60 space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <RefreshCw size={16} />
          </div>
          <h4 className="text-xs font-black text-slate-900">Instant Refunds</h4>
          <p className="text-[11px] text-slate-500 font-medium">Out-of-stock items or canceled orders refund back to wallet in 5 seconds.</p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100/60 space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <ShieldCheck size={16} />
          </div>
          <h4 className="text-xs font-black text-slate-900">Cashback Rewards</h4>
          <p className="text-[11px] text-slate-500 font-medium">Referral bonuses and seasonal cashback deposit directly to your wallet.</p>
        </div>
      </div>

      {/* Passbook / Transactions */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-black text-slate-900 tracking-tight">Recent Wallet Passbook</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">No recent wallet transactions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
            {transactions.slice(0, 10).map((tx, idx) => (
              <div key={tx.id || idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === 'debit' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    <ArrowUpRight size={15} className={tx.type === 'debit' ? 'rotate-180' : ''} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{tx.description || 'Wallet Transaction'}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                  </div>
                </div>

                <div className={`text-xs font-black ${
                  tx.type === 'debit' ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {tx.type === 'debit' ? '-' : '+'}₹{Math.abs(tx.amount || 0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default WalletTab;
