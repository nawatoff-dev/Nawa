
import React, { useState, useMemo } from 'react';
import { Trade } from '../types';

interface JournalProps {
  trades: Trade[];
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
}

export const Journal: React.FC<JournalProps> = ({ trades, setTrades }) => {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    pair: '',
    status: 'All',
    type: 'All'
  });

  const [formData, setFormData] = useState<Partial<Trade>>({
    pair: 'EURUSD',
    type: 'Long',
    entry: 0,
    exit: 0,
    lotSize: 0.1,
    notes: '',
    status: 'Win',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      const dateInRange = (!filters.startDate || trade.date >= filters.startDate) &&
                         (!filters.endDate || trade.date <= filters.endDate);
      const pairMatch = !filters.pair || trade.pair.toLowerCase().includes(filters.pair.toLowerCase());
      const statusMatch = filters.status === 'All' || trade.status === filters.status;
      const typeMatch = filters.type === 'All' || trade.type === filters.type;
      return dateInRange && pairMatch && statusMatch && typeMatch;
    });
  }, [trades, filters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const multiplier = 100000;
    const pnl = formData.type === 'Long' 
      ? (formData.exit! - formData.entry!) * (formData.lotSize! * multiplier) 
      : (formData.entry! - formData.exit!) * (formData.lotSize! * multiplier);
    
    const newTrade: Trade = {
      ...(formData as Trade),
      id: Math.random().toString(36).substr(2, 9),
      pnl: parseFloat(pnl.toFixed(2)),
      status: pnl > 0 ? 'Win' : (pnl < 0 ? 'Loss' : 'Break-even')
    };

    setTrades([newTrade, ...trades]);
    setShowForm(false);
    setFormData({
        pair: 'EURUSD',
        type: 'Long',
        entry: 0,
        exit: 0,
        lotSize: 0.1,
        notes: '',
        status: 'Win',
        date: new Date().toISOString().split('T')[0]
    });
  };

  const deleteTrade = (id: string) => {
    if (confirm('Delete this trade entry?')) {
      setTrades(trades.filter(t => t.id !== id));
    }
  };

  const clearFilters = () => setFilters({ startDate: '', endDate: '', pair: '', status: 'All', type: 'All' });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h3 className="text-3xl font-black tracking-tight">Trade Records</h3>
          <p className="text-neutral-500 text-sm">Review your historical execution and logic.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-xl ${
            showForm ? 'bg-neutral-800 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
          }`}
        >
          {showForm ? '✕ Close' : '+ Log Trade'}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-indigo-400">🔍</span>
          <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400">Filter History</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase">From Date</label>
            <input 
              type="date" 
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase">To Date</label>
            <input 
              type="date" 
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase">Pair</label>
            <input 
              type="text" 
              placeholder="e.g. EURUSD"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
              value={filters.pair}
              onChange={e => setFilters({...filters, pair: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase">Status</label>
            <select 
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
              value={filters.status}
              onChange={e => setFilters({...filters, status: e.target.value})}
            >
              <option value="All">All Statuses</option>
              <option value="Win">Win</option>
              <option value="Loss">Loss</option>
              <option value="Break-even">Break-even</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Type</label>
              <select 
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                value={filters.type}
                onChange={e => setFilters({...filters, type: e.target.value})}
              >
                <option value="All">All Types</option>
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </div>
            <button 
              onClick={clearFilters}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-neutral-400 transition-colors"
              title="Clear Filters"
            >
              🧹
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Date</label>
            <input 
              type="date" 
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-white" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Trading Pair</label>
            <input 
              type="text" 
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-white font-bold" 
              placeholder="e.g. EURUSD"
              value={formData.pair}
              onChange={e => setFormData({...formData, pair: e.target.value.toUpperCase()})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Type</label>
            <select 
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-white font-bold appearance-none"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value as any})}
            >
              <option value="Long">Long / Buy</option>
              <option value="Short">Short / Sell</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Lot Size</label>
            <input 
              type="number" 
              step="0.01"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-white font-mono" 
              value={formData.lotSize}
              onChange={e => setFormData({...formData, lotSize: parseFloat(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Entry Price</label>
            <input 
              type="number" 
              step="0.00001"
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-white font-mono" 
              value={formData.entry}
              onChange={e => setFormData({...formData, entry: parseFloat(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Exit Price</label>
            <input 
              type="number" 
              step="0.00001"
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-white font-mono" 
              value={formData.exit}
              onChange={e => setFormData({...formData, exit: parseFloat(e.target.value)})}
            />
          </div>
          <div className="lg:col-span-2 space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Notes & Context</label>
            <textarea 
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-white h-[58px]" 
              placeholder="Why did you take this trade? Confluences?"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-12 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all transform active:scale-95">Save Position</button>
          </div>
        </form>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-800/50 border-b border-neutral-800">
              <tr>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-neutral-500">Date</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-neutral-500">Pair</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-neutral-500">Type</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-neutral-500">Lot</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-neutral-500">Entry / Exit</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-neutral-500">P&L</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-neutral-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredTrades.map(trade => (
                <tr key={trade.id} className="hover:bg-neutral-800/30 transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-neutral-400 font-medium">{trade.date}</td>
                  <td className="px-6 py-5 whitespace-nowrap font-black text-white">{trade.pair}</td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${trade.type === 'Long' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm mono text-neutral-300">{trade.lotSize}</td>
                  <td className="px-6 py-5 whitespace-nowrap text-xs mono text-neutral-400">
                    <div>{trade.entry}</div>
                    <div className="text-neutral-600">→ {trade.exit}</div>
                  </td>
                  <td className={`px-6 py-5 whitespace-nowrap font-black mono text-lg ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right text-sm">
                    <button 
                      onClick={() => deleteTrade(trade.id)} 
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete Entry"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-5xl opacity-10 grayscale">📖</div>
                      <div className="text-neutral-500 italic font-medium">
                        {trades.length === 0 ? "Your journal is empty." : "No trades match your filters."}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
