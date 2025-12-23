
import React, { useState, useEffect } from 'react';
import { Trade } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  trades: Trade[];
  balance: number;
  setBalance: (v: number) => void;
  dailyPnL: number;
  setDailyPnL: (v: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ trades, balance, setBalance, dailyPnL, setDailyPnL }) => {
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [isEditingDaily, setIsEditingDaily] = useState(false);
  const [tempBalance, setTempBalance] = useState(balance.toString());
  const [tempDaily, setTempDaily] = useState(dailyPnL.toString());

  // Keep local state in sync with props
  useEffect(() => {
    if (!isEditingBalance) setTempBalance(balance.toString());
  }, [balance, isEditingBalance]);

  useEffect(() => {
    if (!isEditingDaily) setTempDaily(dailyPnL.toString());
  }, [dailyPnL, isEditingDaily]);

  const handleBalanceSubmit = () => {
    const val = parseFloat(tempBalance);
    if (!isNaN(val)) {
      setBalance(val);
    }
    setIsEditingBalance(false);
  };

  const handleDailySubmit = () => {
    const newVal = parseFloat(tempDaily);
    if (!isNaN(newVal)) {
      // Calculate the difference from the previous Daily P&L
      const delta = newVal - dailyPnL;
      // Adjust the current balance by that difference
      setBalance(balance + delta);
      // Update the Daily P&L state
      setDailyPnL(newVal);
    }
    setIsEditingDaily(false);
  };

  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winCount = trades.filter(t => t.status === 'Win').length;
  const winRate = trades.length > 0 ? ((winCount / trades.length) * 100).toFixed(1) : 0;
  
  const recentTrades = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const chartData = trades.slice(-10).map(t => ({
    name: t.pair,
    pnl: t.pnl
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      {/* Account Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Balance Card */}
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-xl hover:border-indigo-500/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">🏦</span>
          </div>
          <div className="relative z-10">
            <div className="text-neutral-500 text-sm font-bold uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>Current Balance</span>
              {!isEditingBalance && (
                <button onClick={() => setIsEditingBalance(true)} className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold px-2 py-1 bg-indigo-500/10 rounded-lg">Update</button>
              )}
            </div>
            {isEditingBalance ? (
              <div className="flex gap-2 animate-in zoom-in-95 duration-200">
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl text-neutral-500">$</span>
                  <input 
                    autoFocus
                    type="number"
                    step="0.01"
                    className="bg-neutral-800 border border-indigo-500/50 rounded-xl p-3 pl-8 text-3xl font-bold w-full focus:ring-4 focus:ring-indigo-500/20 outline-none mono text-white"
                    value={tempBalance}
                    onChange={(e) => setTempBalance(e.target.value)}
                    onBlur={handleBalanceSubmit}
                    onKeyDown={(e) => e.key === 'Enter' && handleBalanceSubmit()}
                  />
                </div>
              </div>
            ) : (
              <div 
                className="text-5xl font-black tracking-tight text-white mono cursor-pointer hover:text-indigo-400 transition-colors"
                onClick={() => setIsEditingBalance(true)}
              >
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <p className="text-neutral-600 text-xs mt-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Live Account Total
            </p>
          </div>
        </div>

        {/* Daily P&L Card */}
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-xl hover:border-neutral-700 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">{dailyPnL >= 0 ? '📈' : '📉'}</span>
          </div>
          <div className="relative z-10">
            <div className="text-neutral-500 text-sm font-bold uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>Today's Profit / Loss</span>
              {!isEditingDaily && (
                <button onClick={() => setIsEditingDaily(true)} className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold px-2 py-1 bg-indigo-500/10 rounded-lg">Log Result</button>
              )}
            </div>
            {isEditingDaily ? (
              <div className="flex gap-2 animate-in zoom-in-95 duration-200">
                 <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl text-neutral-500">$</span>
                  <input 
                    autoFocus
                    type="number"
                    step="0.01"
                    className={`bg-neutral-800 border rounded-xl p-3 pl-8 text-3xl font-bold w-full focus:ring-4 outline-none mono ${parseFloat(tempDaily) >= 0 ? 'border-green-500/50 focus:ring-green-500/20 text-green-400' : 'border-red-500/50 focus:ring-red-500/20 text-red-400'}`}
                    value={tempDaily}
                    onChange={(e) => setTempDaily(e.target.value)}
                    onBlur={handleDailySubmit}
                    onKeyDown={(e) => e.key === 'Enter' && handleDailySubmit()}
                    placeholder="Losses use -"
                  />
                </div>
              </div>
            ) : (
              <div 
                className={`text-5xl font-black tracking-tight mono cursor-pointer transition-all hover:opacity-80 ${dailyPnL > 0 ? 'text-green-500' : dailyPnL < 0 ? 'text-red-500' : 'text-neutral-400'}`}
                onClick={() => setIsEditingDaily(true)}
              >
                {dailyPnL > 0 ? '+' : ''}${Math.abs(dailyPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <p className="text-neutral-600 text-xs mt-3 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> 
              Changing this automatically adjusts your Balance.
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Journal P&L" value={`$${totalPnL.toFixed(2)}`} color={totalPnL >= 0 ? 'text-green-500' : 'text-red-500'} icon="💰" />
        <StatCard label="Win Rate" value={`${winRate}%`} color="text-indigo-400" icon="🎯" />
        <StatCard label="Total Trades" value={trades.length.toString()} color="text-blue-400" icon="📊" />
        <StatCard label="Avg. RR Ratio" value="1:2.4" color="text-orange-400" icon="📏" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
            Performance History
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                <Tooltip 
                   cursor={{fill: 'rgba(255,255,255,0.05)'}}
                   contentStyle={{backgroundColor: '#171717', border: '1px solid #333', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'}}
                   itemStyle={{color: '#fff', fontWeight: 'bold'}}
                />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-xl flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
            Recent Trades
          </h3>
          <div className="space-y-3 flex-1">
            {recentTrades.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-500 italic space-y-2">
                <span className="text-4xl opacity-20">📭</span>
                <span>No trades logged</span>
              </div>
            ) : (
              recentTrades.map(trade => (
                <div key={trade.id} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/50 hover:bg-neutral-800 transition-all border border-transparent hover:border-neutral-700">
                  <div>
                    <div className="font-bold text-white">{trade.pair}</div>
                    <div className="text-[10px] uppercase tracking-tighter text-neutral-500">{new Date(trade.date).toLocaleDateString()}</div>
                  </div>
                  <div className={`font-mono font-bold text-lg ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl}
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="mt-6 w-full py-4 bg-neutral-800 hover:bg-neutral-700 rounded-2xl transition-all font-bold text-sm text-neutral-300 border border-neutral-700">
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) => (
  <div className="bg-neutral-900 border border-neutral-800 p-5 md:p-6 rounded-3xl shadow-xl hover:border-neutral-700 transition-all cursor-default group overflow-hidden relative">
    <div className="flex items-center justify-between mb-4 relative z-10">
      <span className="text-2xl opacity-80 group-hover:scale-110 transition-transform">{icon}</span>
      <div className="w-6 h-6 rounded-full bg-neutral-800/50 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-neutral-600"></div>
      </div>
    </div>
    <div className="text-neutral-500 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 relative z-10">{label}</div>
    <div className={`text-xl md:text-2xl font-black mono relative z-10 ${color}`}>{value}</div>
    {/* Decorative background circle */}
    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
  </div>
);
