
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { Trade } from '../types';

interface AICoachProps {
  trades: Trade[];
  isOnline: boolean;
}

export const AICoach: React.FC<AICoachProps> = ({ trades, isOnline }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: "Hello Trader. I'm your AI Coach. I've reviewed your recent data. Ready to analyze your edge or work on your discipline today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !isOnline) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const gemini = new GeminiService();
    const advice = await gemini.getTradingAdvice(userMsg, trades);
    
    setMessages(prev => [...prev, { role: 'bot', text: advice || "I'm sorry, I couldn't process that." }]);
    setLoading(false);
  };

  if (!isOnline) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 animate-in fade-in">
        <div className="text-6xl">📡</div>
        <h3 className="text-2xl font-bold">Offline Mode</h3>
        <p className="text-neutral-500 max-w-md text-center">
          The AI Coach requires an active internet connection to process market data and psychological insights. Your journal and checklist remain accessible.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col animate-in fade-in duration-500">
      <div className="flex-1 overflow-y-auto space-y-6 pr-4 mb-4" ref={scrollRef}>
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' 
                : 'bg-neutral-800 border border-neutral-700 text-gray-200 rounded-tl-none'
            }`}>
              <div className="text-xs opacity-50 mb-1 font-bold uppercase tracking-wider">{m.role === 'user' ? 'You' : 'Coach'}</div>
              <p className="leading-relaxed">{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-neutral-800 border border-neutral-700 p-4 rounded-2xl rounded-tl-none animate-pulse">
               Thinking...
             </div>
          </div>
        )}
      </div>

      <div className="relative">
        <input 
          type="text" 
          className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 pr-20 focus:outline-none focus:border-indigo-500 shadow-2xl transition-all"
          placeholder="Ask about strategy, risk, or emotions..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="absolute right-3 top-3 bottom-3 bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-xl font-bold transition-all disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
};
