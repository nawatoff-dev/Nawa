
import { MarketSession } from './types';

export const MARKET_SESSIONS: MarketSession[] = [
  { name: 'Asian', color: 'bg-red-500', openHourUTC: 0, closeHourUTC: 9 },
  { name: 'London', color: 'bg-blue-500', openHourUTC: 8, closeHourUTC: 17 },
  { name: 'New York', color: 'bg-orange-500', openHourUTC: 13, closeHourUTC: 22 },
];

export const INITIAL_CHECKLIST = [
  "Check Economic Calendar for high impact news",
  "Identify Daily/Weekly Bias",
  "Mark key Support and Resistance levels",
  "Check Correlation (DXY, Related Pairs)",
  "Set Alerts for Entry Zones",
  "Confirm Risk Management (Max 1% per trade)",
  "Review Trading Plan"
];
