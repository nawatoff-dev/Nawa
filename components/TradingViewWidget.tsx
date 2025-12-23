
import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  interval?: string;
  height?: string | number;
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ 
  symbol = "FX:EURUSD", 
  interval = "D",
  height = "100%" 
}) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current) {
      // Clear existing widget
      container.current.innerHTML = '';
      
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      
      // Ensure the symbol is formatted correctly for TradingView
      // If it doesn't have a colon, we assume it's a forex pair or common asset
      const formattedSymbol = symbol.includes(':') ? symbol : `FX:${symbol.toUpperCase()}`;

      script.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": formattedSymbol,
        "interval": interval,
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "hide_top_toolbar": false,
        "allow_symbol_change": true,
        "save_image": false,
        "calendar": false,
        "hide_volume": true,
        "support_host": "https://www.tradingview.com"
      });
      container.current.appendChild(script);
    }
  }, [symbol, interval]);

  return (
    <div className="w-full h-full bg-neutral-900 overflow-hidden" style={{ height }}>
      <div className="tradingview-widget-container h-full w-full" ref={container}>
        <div className="tradingview-widget-container__widget h-full w-full"></div>
      </div>
    </div>
  );
};

export default memo(TradingViewWidget);
