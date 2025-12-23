
import React, { useState, useEffect } from 'react';
import { MARKET_SESSIONS } from '../constants';

export const MarketSessions: React.FC = () => {
  const [currentUTC, setCurrentUTC] = useState(new Date().getUTCHours());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentUTC(new Date().getUTCHours());
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  const isSessionOpen = (open: number, close: number) => {
    if (open < close) {
      return currentUTC >= open && currentUTC < close;
    } else {
      // Over midnight session (like Asian session sometimes)
      return currentUTC >= open || currentUTC < close;
    }
  };

  return (
    <div className="flex items-center gap-8 bg-neutral-800/50 px-6 py-2 rounded-full border border-neutral-700">
      {MARKET_SESSIONS.map((session) => {
        const isOpen = isSessionOpen(session.openHourUTC, session.closeHourUTC);
        return (
          <div key={session.name} className="flex items-center gap-3">
            <div className={`relative flex h-3 w-3`}>
              {isOpen && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${session.color} opacity-75`}></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isOpen ? session.color : 'bg-neutral-600'}`}></span>
            </div>
            <span className={`text-xs font-bold uppercase tracking-widest ${isOpen ? 'text-white' : 'text-neutral-500'}`}>
              {session.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};
