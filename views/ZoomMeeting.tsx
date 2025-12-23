
import React from 'react';

export const ZoomMeeting: React.FC = () => {
  const meetings = [
    { title: 'Weekly Market Review', time: 'Mon 09:00 UTC', type: 'Strategy' },
    { title: 'New York Session Live', time: 'Daily 13:30 UTC', type: 'Live Trading' },
    { title: 'Psychology & Risk Management', time: 'Wed 18:00 UTC', type: 'Webinar' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Community Meetings</h3>
          <p className="text-neutral-500">Connect with fellow traders and mentors.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">
          + Schedule New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {meetings.map((m, idx) => (
          <div key={idx} className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between hover:border-blue-500/50 transition-all cursor-pointer group">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="bg-blue-600/10 text-blue-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{m.type}</span>
                <span className="text-2xl group-hover:scale-110 transition-transform">🎥</span>
              </div>
              <h4 className="text-xl font-bold mb-2">{m.title}</h4>
              <p className="text-neutral-400 font-medium mb-6 flex items-center gap-2">
                <span>🕒</span> {m.time}
              </p>
            </div>
            <button className="w-full py-3 bg-neutral-800 hover:bg-blue-600 rounded-xl font-bold transition-all">Join Session</button>
          </div>
        ))}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-4">
        <div className="text-4xl">🔗</div>
        <h4 className="text-xl font-bold">Your Personal Zoom Link</h4>
        <div className="bg-neutral-800 p-4 rounded-xl flex items-center justify-center gap-4 border border-neutral-700 group hover:border-neutral-500 transition-colors">
          <code className="text-blue-400 font-mono">zoom.us/j/123-456-7890</code>
          <button className="text-xs bg-neutral-700 px-3 py-1 rounded hover:bg-neutral-600 transition-colors">Copy</button>
        </div>
      </div>
    </div>
  );
};
