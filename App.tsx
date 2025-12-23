
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Analysis } from './views/Analysis';
import { Checklist } from './views/Checklist';
import { Journal } from './views/Journal';
import { AICoach } from './views/AICoach';
import { ZoomMeeting } from './views/ZoomMeeting';
import { TradingView } from './views/TradingView';
import { Section, Trade, ChecklistItem, AnalysisEntry } from './types';
import { INITIAL_CHECKLIST } from './constants';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('Dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [balance, setBalance] = useState<number>(0);
  const [dailyPnL, setDailyPnL] = useState<number>(0);

  useEffect(() => {
    const savedTrades = localStorage.getItem('trades');
    if (savedTrades) setTrades(JSON.parse(savedTrades));

    const savedAnalysesRaw = localStorage.getItem('analyses');
    if (savedAnalysesRaw) {
      const parsedAnalyses: AnalysisEntry[] = JSON.parse(savedAnalysesRaw);
      // RESET AFTER 24HR LOGIC: Filter out entries older than 24 hours
      const now = new Date().getTime();
      const dayInMs = 24 * 60 * 60 * 1000;
      const filtered = parsedAnalyses.filter(a => (now - new Date(a.date).getTime()) < dayInMs);
      setAnalyses(filtered);
    }

    const savedChecklist = localStorage.getItem('checklist');
    if (savedChecklist) {
      setChecklist(JSON.parse(savedChecklist));
    } else {
      setChecklist(INITIAL_CHECKLIST.map(item => ({ id: Math.random().toString(), text: item, completed: false })));
    }

    const savedBalance = localStorage.getItem('accountBalance');
    if (savedBalance) setBalance(parseFloat(savedBalance));

    const savedDaily = localStorage.getItem('dailyPnL');
    const lastReset = localStorage.getItem('lastResetDate');
    const today = new Date().toISOString().split('T')[0];

    if (lastReset !== today) {
      setDailyPnL(0);
      localStorage.setItem('dailyPnL', '0');
      localStorage.setItem('lastResetDate', today);
    } else if (savedDaily) {
      setDailyPnL(parseFloat(savedDaily));
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('accountBalance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('dailyPnL', dailyPnL.toString());
    localStorage.setItem('lastResetDate', new Date().toISOString().split('T')[0]);
  }, [dailyPnL]);

  useEffect(() => {
    localStorage.setItem('trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('analyses', JSON.stringify(analyses));
  }, [analyses]);

  useEffect(() => {
    localStorage.setItem('checklist', JSON.stringify(checklist));
  }, [checklist]);

  const renderContent = () => {
    switch (activeSection) {
      case 'Dashboard': 
        return (
          <Dashboard 
            trades={trades} 
            balance={balance} 
            setBalance={setBalance} 
            dailyPnL={dailyPnL} 
            setDailyPnL={setDailyPnL} 
          />
        );
      case 'Analysis': return <Analysis trades={trades} analyses={analyses} setAnalyses={setAnalyses} />;
      case 'Checklist': return <Checklist checklist={checklist} setChecklist={setChecklist} />;
      case 'Journal': return <Journal trades={trades} setTrades={setTrades} />;
      case 'AICoach': return <AICoach trades={trades} isOnline={isOnline} />;
      case 'Zoom': return <ZoomMeeting />;
      case 'TradingView': return <TradingView />;
      default: return <Dashboard trades={trades} balance={balance} setBalance={setBalance} dailyPnL={dailyPnL} setDailyPnL={setDailyPnL} />;
    }
  };

  return (
    <Layout 
      activeSection={activeSection} 
      setActiveSection={setActiveSection}
      isOnline={isOnline}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
