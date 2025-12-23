
import React from 'react';
import TradingViewWidget from '../components/TradingViewWidget';

export const TradingView: React.FC = () => {
  return (
    <div className="h-[calc(100vh-12rem)] w-full bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden animate-in zoom-in-95 duration-700 shadow-2xl">
      <TradingViewWidget height="100%" />
    </div>
  );
};
