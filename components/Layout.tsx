
import React, { useState } from 'react';
import { Section } from '../types';
import { MarketSessions } from './MarketSessions';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: Section;
  setActiveSection: (s: Section) => void;
  isOnline: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeSection, setActiveSection, isOnline }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const menuItems: { name: Section; icon: string; label: string }[] = [
    { name: 'Dashboard', icon: '📊', label: 'Dashboard' },
    { name: 'Analysis', icon: '📈', label: 'Analysis' },
    { name: 'Checklist', icon: '✅', label: 'Checklist' },
    { name: 'Journal', icon: '📖', label: 'Journal' },
    { name: 'AICoach', icon: '🤖', label: 'AI Coach' },
    { name: 'Zoom', icon: '🎥', label: 'Zoom Meeting' },
    { name: 'TradingView', icon: '📉', label: 'Trading View' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-black text-gray-200">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-neutral-900 border-r border-neutral-800 flex flex-col`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-900/20">E</div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">EdgeLog</span>}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveSection(item.name)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                activeSection === item.name 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'hover:bg-neutral-800 text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-800">
           <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-white transition-colors"
           >
             <span>{isSidebarOpen ? '⬅️ Collapse' : '➡️'}</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header with Session Indicators */}
        <header className="h-20 border-b border-neutral-800 flex items-center justify-between px-8 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{activeSection}</h2>
            <div className={`ml-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${isOnline ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
          
          <MarketSessions />
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
