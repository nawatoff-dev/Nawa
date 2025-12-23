
export type Section = 'Dashboard' | 'Analysis' | 'Checklist' | 'Journal' | 'AICoach' | 'Zoom' | 'TradingView';

export interface Trade {
  id: string;
  date: string;
  pair: string;
  type: 'Long' | 'Short';
  entry: number;
  exit: number;
  lotSize: number;
  pnl: number;
  status: 'Win' | 'Loss' | 'Break-even';
  notes: string;
  screenshotUrl?: string;
}

export interface AnalysisEntry {
  id: string;
  date: string;
  title: string;
  text: string;
  images: string[]; // base64 strings
  audio?: string;   // base64 string
  bias?: 'Bullish' | 'Bearish';
  quality?: 'Good' | 'Bad';
  customFolderId?: string; // ID of the manual folder it belongs to
}

export interface CustomFolder {
  id: string;
  name: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface MarketSession {
  name: string;
  color: string;
  openHourUTC: number;
  closeHourUTC: number;
}
