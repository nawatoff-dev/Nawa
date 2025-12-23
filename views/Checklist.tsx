
import React from 'react';
import { ChecklistItem } from '../types';

interface ChecklistProps {
  checklist: ChecklistItem[];
  setChecklist: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
}

export const Checklist: React.FC<ChecklistProps> = ({ checklist, setChecklist }) => {
  const toggleItem = (id: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const resetChecklist = () => {
    if (confirm('Reset all items for today?')) {
      setChecklist(checklist.map(item => ({ ...item, completed: false })));
    }
  };

  const completedCount = checklist.filter(i => i.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-neutral-800">
          <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-1">Pre-Trade Protocol</h3>
            <p className="text-neutral-500">Master your routine, master the markets.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-500">{completedCount}/{checklist.length}</div>
            <div className="text-xs uppercase tracking-widest text-neutral-600 font-bold">Steps Complete</div>
          </div>
        </div>

        <div className="space-y-4">
          {checklist.map((item) => (
            <div 
              key={item.id} 
              onClick={() => toggleItem(item.id)}
              className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all border ${
                item.completed 
                ? 'bg-indigo-600/10 border-indigo-600/30 text-white' 
                : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600 text-neutral-400'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                item.completed ? 'bg-indigo-600 border-indigo-600' : 'border-neutral-600'
              }`}>
                {item.completed && <span>✓</span>}
              </div>
              <span className={`flex-1 font-medium text-lg ${item.completed ? 'line-through opacity-50' : ''}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        <button 
          onClick={resetChecklist}
          className="mt-8 w-full py-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-2xl font-bold transition-all border border-neutral-700"
        >
          Reset Session
        </button>
      </div>
      
      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex gap-4 items-start">
        <span className="text-2xl">⚠️</span>
        <p className="text-amber-500 text-sm leading-relaxed">
          <strong>Trading Discipline:</strong> Research shows that traders who follow a strict checklist reduce emotional errors by up to 40%. Never enter a position unless every box is checked.
        </p>
      </div>
    </div>
  );
};
