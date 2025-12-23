
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Trade, AnalysisEntry, CustomFolder } from '../types';
import TradingViewWidget from '../components/TradingViewWidget';
import { GoogleGenAI } from "@google/genai";

interface AnalysisProps {
  trades: Trade[];
  analyses: AnalysisEntry[];
  setAnalyses: React.Dispatch<React.SetStateAction<AnalysisEntry[]>>;
}

type GroupBy = 'pair' | 'date' | 'custom';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const Analysis: React.FC<AnalysisProps> = ({ analyses, setAnalyses }) => {
  // New Analysis form state
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const [bias, setBias] = useState<'Bullish' | 'Bearish' | null>(null);
  const [quality, setQuality] = useState<'Good' | 'Bad' | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Archive & Folder UI state
  const [viewMode, setViewMode] = useState<'list' | 'folders'>('folders');
  const [groupBy, setGroupBy] = useState<GroupBy>(() => {
    const saved = localStorage.getItem('analysis_group_by');
    return (saved as GroupBy) || 'custom';
  });
  
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>(() => {
    const saved = localStorage.getItem('custom_folders');
    return saved ? JSON.parse(saved) : [
      { id: 'f_default_1', name: 'Strategy A' },
      { id: 'f_default_2', name: 'Case Studies' }
    ];
  });

  // activeFolderId now stores a path for dates (e.g., "2024/03/15")
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  
  // TradingView state
  const [showChart, setShowChart] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState('EURUSD');

  // Zoom and Pan State
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Persistence
  useEffect(() => {
    localStorage.setItem('analysis_group_by', groupBy);
  }, [groupBy]);

  useEffect(() => {
    localStorage.setItem('custom_folders', JSON.stringify(customFolders));
  }, [customFolders]);

  // Debounced symbol sync
  useEffect(() => {
    const timer = setTimeout(() => {
      if (newTitle.length >= 3) {
        setActiveSymbol(newTitle.toUpperCase());
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [newTitle]);

  // Timer logic for recording
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const transcribeAudio = async (base64Data: string) => {
    setIsTranscribing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Data.split(',')[1],
                  mimeType: 'audio/webm',
                },
              },
              { text: "Please transcribe this trading analysis audio accurately. Output only the transcription text." },
            ],
          },
        ],
      });
      
      const text = response.text;
      if (text) {
        setNewText(prev => prev ? `${prev}\n\n[Transcribed Analysis]:\n${text}` : text);
      }
    } catch (err) {
      console.error("Transcription error:", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setAudioBlob(base64);
          transcribeAudio(base64);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAddAnalysis = () => {
    if (!newTitle.trim()) {
      alert("Please enter a title.");
      return;
    }
    const entry: AnalysisEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      title: newTitle.toUpperCase(),
      text: newText,
      images: newImages,
      audio: audioBlob || undefined,
      bias: bias || undefined,
      quality: quality || undefined,
      customFolderId: activeFolderId || undefined
    };
    setAnalyses([entry, ...analyses]);
    setNewTitle('');
    setNewText('');
    setNewImages([]);
    setAudioBlob(null);
    setBias(null);
    setQuality(null);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: CustomFolder = {
      id: 'f_' + Math.random().toString(36).substr(2, 9),
      name: newFolderName.trim()
    };
    setCustomFolders([...customFolders, newFolder]);
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const deleteFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this folder? Entries will become uncategorized.')) {
      setCustomFolders(customFolders.filter(f => f.id !== id));
      setAnalyses(analyses.map(a => a.customFolderId === id ? { ...a, customFolderId: undefined } : a));
      if (activeFolderId === id) setActiveFolderId(null);
    }
  };

  // Drag and Drop
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedEntryId(id);
    e.dataTransfer.setData('entryId', id);
  };

  const onDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const entryId = e.dataTransfer.getData('entryId');
    if (!entryId) return;

    setAnalyses(prev => prev.map(a => 
      a.id === entryId ? { ...a, customFolderId: folderId || undefined } : a
    ));
    setDraggedEntryId(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Folder Grouping logic
  const folders = useMemo(() => {
    const grouped: Record<string, AnalysisEntry[]> = {};
    
    if (groupBy === 'custom') {
      customFolders.forEach(f => grouped[f.id] = []);
      grouped['uncategorized'] = [];
      analyses.forEach(entry => {
        const key = entry.customFolderId && grouped[entry.customFolderId] ? entry.customFolderId : 'uncategorized';
        grouped[key].push(entry);
      });
    } else if (groupBy === 'pair') {
      analyses.forEach(entry => {
        const match = entry.title.match(/[A-Z]{3,6}/);
        const key = match ? match[0] : 'General';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(entry);
      });
    } else if (groupBy === 'date') {
      // HIERARCHICAL DATE LOGIC
      // Path logic: null (Root/Years) -> "YYYY" (Year/Months) -> "YYYY/MM" (Month/Days) -> "YYYY/MM/DD" (Entries)
      const path = activeFolderId ? activeFolderId.split('/') : [];
      
      analyses.forEach(entry => {
        const d = new Date(entry.date);
        const year = d.getUTCFullYear().toString();
        const month = (d.getUTCMonth() + 1).toString().padStart(2, '0'); // MM
        const day = d.getUTCDate().toString().padStart(2, '0'); // DD

        let key = '';
        if (path.length === 0) {
          key = year; // At Root, folders are Years
        } else if (path.length === 1 && path[0] === year) {
          key = `${year}/${month}`; // In Year, folders are Months
        } else if (path.length === 2 && path[0] === year && path[1] === month) {
          key = `${year}/${month}/${day}`; // In Month, folders are Days
        }

        if (key) {
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(entry);
        }
      });
    }

    return grouped;
  }, [analyses, groupBy, customFolders, activeFolderId]);

  const displayedEntries = useMemo(() => {
    if (groupBy === 'date') {
      const path = activeFolderId ? activeFolderId.split('/') : [];
      // We only show entries when we are at the deepest level (YYYY/MM/DD)
      if (path.length === 3) {
        let list = folders[activeFolderId!] || [];
        if (searchTerm) {
          list = list.filter(e => 
            e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            e.text.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        return list;
      }
      return [];
    }

    let list = activeFolderId ? folders[activeFolderId] || [] : analyses;
    if (searchTerm) {
      list = list.filter(e => 
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return list;
  }, [analyses, folders, activeFolderId, searchTerm, groupBy]);

  // Breadcrumb helper
  const breadcrumbSegments = useMemo(() => {
    if (!activeFolderId) return [];
    if (groupBy !== 'date') {
      const name = groupBy === 'custom' 
        ? (activeFolderId === 'uncategorized' ? 'Uncategorized' : customFolders.find(f => f.id === activeFolderId)?.name || activeFolderId)
        : activeFolderId;
      return [{ id: activeFolderId, name }];
    }

    // Date segments: 2024 / 03 / 15
    const parts = activeFolderId.split('/');
    const segments = [];
    if (parts[0]) segments.push({ id: parts[0], name: parts[0] });
    if (parts[1]) segments.push({ id: `${parts[0]}/${parts[1]}`, name: MONTH_NAMES[parseInt(parts[1]) - 1] });
    if (parts[2]) {
      const day = parseInt(parts[2]);
      const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10];
      segments.push({ id: activeFolderId, name: `${day}${suffix}` });
    }
    return segments;
  }, [activeFolderId, groupBy, customFolders]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const resetZoom = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

  return (
    <div className="max-w-7xl mx-auto pb-32 px-4 space-y-16 animate-in fade-in duration-700">
      
      {/* Zoom Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-300 backdrop-blur-2xl overflow-hidden touch-none"
          onWheel={(e) => setZoom(prev => Math.max(0.2, Math.min(10, prev + (e.deltaY > 0 ? -0.1 : 0.1))))}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onDoubleClick={resetZoom}
        >
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-4 bg-neutral-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl">
            <span className="text-indigo-400 font-black text-xs px-4">{Math.round(zoom * 100)}%</span>
            <button onClick={resetZoom} className="px-6 h-10 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase">Reset</button>
            <button onClick={() => setSelectedImage(null)} className="px-6 h-10 rounded-xl bg-neutral-800 text-white text-[10px] font-black uppercase ml-2">Close</button>
          </div>
          <div 
            className={`transition-transform duration-75 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
            onMouseDown={handleMouseDown}
          >
            <img src={selectedImage} className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl" alt="Zoomed" draggable={false} />
          </div>
        </div>
      )}

      {/* Analysis Input Section */}
      <section className="bg-neutral-900 border-2 border-neutral-800 rounded-[3rem] p-8 md:p-12 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="flex justify-between items-center bg-neutral-950 p-4 rounded-3xl border border-neutral-800">
          <div className="flex items-center gap-4">
            <span className="text-2xl">📈</span>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Analysis Creator</span>
              {activeFolderId && <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Context: {breadcrumbSegments.map(s => s.name).join(' / ')}</span>}
            </div>
          </div>
          <button onClick={() => setShowChart(!showChart)} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase transition-all ${showChart ? 'bg-red-500/10 text-red-500' : 'bg-indigo-600 text-white'}`}>
            {showChart ? 'Hide Chart' : 'Show Live Chart'}
          </button>
        </div>

        {showChart && (
          <div className="h-[500px] w-full rounded-[2rem] overflow-hidden border-2 border-neutral-800 animate-in slide-in-from-top-4">
             <TradingViewWidget symbol={activeSymbol} height="100%" />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-10">
          <div className="flex flex-col gap-4 w-full md:w-32">
            <button onClick={() => setBias(bias === 'Bullish' ? null : 'Bullish')} className={`py-6 rounded-2xl font-black text-xs uppercase ${bias === 'Bullish' ? 'bg-green-500 text-white shadow-lg' : 'bg-neutral-800 text-neutral-500 hover:text-white'}`}>Bullish</button>
            <button onClick={() => setBias(bias === 'Bearish' ? null : 'Bearish')} className={`py-6 rounded-2xl font-black text-xs uppercase ${bias === 'Bearish' ? 'bg-red-500 text-white shadow-lg' : 'bg-neutral-800 text-neutral-500 hover:text-white'}`}>Bearish</button>
            <div className="h-px bg-neutral-800 my-2"></div>
            <button onClick={() => setQuality(quality === 'Good' ? null : 'Good')} className={`py-6 rounded-2xl font-black text-xs uppercase ${quality === 'Good' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-neutral-800 text-neutral-500 hover:text-white'}`}>Good</button>
            <button onClick={() => setQuality(quality === 'Bad' ? null : 'Bad')} className={`py-6 rounded-2xl font-black text-xs uppercase ${quality === 'Bad' ? 'bg-amber-500 text-white shadow-lg' : 'bg-neutral-800 text-neutral-500 hover:text-white'}`}>Bad</button>
          </div>

          <div className="flex-1 space-y-8">
            <input 
              type="text" 
              placeholder="Analysis Title / Pair" 
              className="w-full bg-neutral-800 border-2 border-neutral-700 rounded-2xl p-6 text-3xl font-black text-white focus:border-indigo-500 outline-none uppercase"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="min-h-[350px] bg-neutral-800 border-4 border-dashed border-neutral-700 rounded-[2.5rem] flex items-center justify-center overflow-hidden">
                {newImages.length > 0 ? (
                  <div className="flex gap-4 p-6 overflow-x-auto w-full">
                    {newImages.map((img, i) => (
                      <div key={i} className="relative w-48 aspect-video flex-shrink-0">
                        <img src={img} className="w-full h-full object-cover rounded-xl" alt="Preview" />
                        <button onClick={() => setNewImages(newImages.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-black/80 w-6 h-6 rounded-full text-white text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <label className="cursor-pointer text-center p-12">
                    <span className="text-4xl">📸</span>
                    <p className="text-[10px] font-black uppercase text-neutral-500 mt-2">Upload Charts</p>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                )}
              </div>
              <textarea 
                placeholder="Logic, confluence, and thoughts..."
                className="w-full h-[350px] bg-neutral-800 border-2 border-neutral-700 rounded-[2.5rem] p-8 text-xl text-neutral-300 focus:border-indigo-500 outline-none resize-none"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-neutral-800">
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-8 py-4 rounded-full font-black text-xs uppercase flex items-center gap-3 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-neutral-800 text-indigo-400'}`}
              >
                {isRecording ? '⏹ Stop' : '🎙 Voice Memo'}
                {isRecording && <span className="mono">{recordingSeconds}s</span>}
              </button>
              <button onClick={handleAddAnalysis} className="px-16 py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-2xl rounded-[2rem] shadow-2xl active:scale-95 transition-all">
                Save Analysis
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Structured Archive Section */}
      <section className="space-y-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-neutral-900/40 p-8 rounded-[3rem] border border-neutral-800">
          <div className="flex-1">
            <h3 className="text-3xl font-black text-white tracking-tighter">Market Archives</h3>
            <p className="text-neutral-500 font-bold uppercase text-[10px] tracking-widest">Organize and Review History</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-neutral-800 border border-neutral-700 rounded-full py-3 px-6 text-sm focus:border-indigo-500 outline-none w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800">
              <button onClick={() => { setGroupBy('custom'); setActiveFolderId(null); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'custom' ? 'bg-indigo-600 text-white' : 'text-neutral-500'}`}>Manual</button>
              <button onClick={() => { setGroupBy('pair'); setActiveFolderId(null); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'pair' ? 'bg-indigo-600 text-white' : 'text-neutral-500'}`}>Pair</button>
              <button onClick={() => { setGroupBy('date'); setActiveFolderId(null); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'date' ? 'bg-indigo-600 text-white' : 'text-neutral-500'}`}>Date</button>
            </div>
          </div>
        </div>

        {/* Navigation / Breadcrumbs */}
        <div className="flex items-center gap-4 px-6 overflow-x-auto pb-2">
          <button onClick={() => setActiveFolderId(null)} className={`font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all ${!activeFolderId ? 'text-indigo-400' : 'text-neutral-500 hover:text-white'}`}>Root</button>
          {breadcrumbSegments.map((segment, idx) => (
            <React.Fragment key={segment.id}>
              <span className="text-neutral-700">/</span>
              <button 
                onClick={() => setActiveFolderId(segment.id)}
                className={`font-black text-xs uppercase tracking-widest whitespace-nowrap px-4 py-1 rounded-full transition-all ${idx === breadcrumbSegments.length - 1 ? 'bg-indigo-600/10 border border-indigo-500/20 text-white' : 'text-neutral-500 hover:text-white'}`}
              >
                {segment.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Folder Grid View */}
        {viewMode === 'folders' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 px-4 animate-in fade-in duration-500">
            {Object.keys(folders).map(id => {
              let name = id;
              if (groupBy === 'custom') {
                name = id === 'uncategorized' ? 'Uncategorized' : customFolders.find(f => f.id === id)?.name || id;
              } else if (groupBy === 'date') {
                const parts = id.split('/');
                if (parts.length === 1) name = parts[0]; // Year
                else if (parts.length === 2) name = MONTH_NAMES[parseInt(parts[1]) - 1]; // Month
                else if (parts.length === 3) {
                   const day = parseInt(parts[2]);
                   const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10];
                   name = `${day}${suffix}`;
                }
              }
              
              return (
                <div 
                  key={id}
                  onClick={() => setActiveFolderId(id)}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, id === 'uncategorized' ? null : id)}
                  className="group relative flex flex-col items-center gap-4 transition-all hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative w-full aspect-square bg-neutral-900 border-2 border-neutral-800 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-xl group-hover:border-indigo-500 group-hover:bg-neutral-800 transition-all overflow-hidden">
                    <span className="transition-transform group-hover:scale-110">📂</span>
                    <div className="absolute top-3 right-3 bg-indigo-600 text-white min-w-[24px] h-6 rounded-full flex items-center justify-center text-[10px] font-black px-1.5 shadow-lg">
                      {folders[id].length}
                    </div>
                    {groupBy === 'custom' && id !== 'uncategorized' && (
                      <button onClick={(e) => deleteFolder(id, e)} className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 p-2 bg-red-500/10 text-red-500 rounded-lg text-xs hover:bg-red-500 hover:text-white transition-all">🗑</button>
                    )}
                  </div>
                  <div className="text-center px-2">
                    <p className="font-black text-white text-sm uppercase tracking-tight truncate w-full group-hover:text-indigo-400 transition-colors">{name}</p>
                  </div>
                </div>
              );
            })}
            
            {/* Add Folder Button (Custom Only) */}
            {groupBy === 'custom' && !activeFolderId && (
              <div className="flex flex-col items-center gap-4">
                {isAddingFolder ? (
                  <div className="w-full space-y-2 animate-in zoom-in-95">
                    <input 
                      autoFocus
                      className="w-full bg-neutral-800 border-2 border-indigo-500/50 rounded-2xl p-4 text-xs font-bold text-white outline-none"
                      placeholder="Folder Name..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleCreateFolder} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase">Create</button>
                      <button onClick={() => setIsAddingFolder(false)} className="flex-1 py-2 bg-neutral-800 text-neutral-400 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAddingFolder(true)}
                    className="w-full aspect-square bg-neutral-900 border-2 border-dashed border-neutral-800 rounded-[2.5rem] flex items-center justify-center text-4xl text-neutral-700 hover:border-indigo-500/50 hover:text-indigo-500 transition-all"
                  >
                    +
                  </button>
                )}
                <p className="text-[10px] font-black uppercase text-neutral-600 tracking-widest mt-2">New Collection</p>
              </div>
            )}

            {Object.keys(folders).length === 0 && !activeFolderId && (
               <div className="col-span-full py-24 text-center border-4 border-dashed border-neutral-900 rounded-[4rem] opacity-30">
                  <p className="text-6xl mb-6">📁</p>
                  <p className="font-black text-xl uppercase tracking-widest">No archives found</p>
               </div>
            )}
          </div>
        )}

        {/* Entries List / Actual Analysis Content */}
        {(viewMode === 'list' || (groupBy === 'date' && activeFolderId?.split('/').length === 3) || (groupBy !== 'date' && activeFolderId)) && (
          <div className="grid grid-cols-1 gap-12 animate-in slide-in-from-bottom-4 duration-500">
            {displayedEntries.map(entry => (
              <div 
                key={entry.id} 
                draggable 
                onDragStart={(e) => onDragStart(e, entry.id)}
                className={`bg-neutral-950/50 border border-neutral-900 rounded-[3rem] p-10 flex flex-col md:flex-row gap-10 hover:border-indigo-500/30 transition-all shadow-2xl relative ${draggedEntryId === entry.id ? 'opacity-30 scale-95' : ''}`}
              >
                {draggedEntryId === entry.id && (
                  <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-sm z-10 flex items-center justify-center rounded-[3rem]">
                    <span className="bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">Moving {entry.title}...</span>
                  </div>
                )}

                <div className="flex flex-col gap-3 md:w-32">
                  <div className={`py-3 rounded-xl text-center font-black text-[10px] uppercase tracking-widest ${entry.bias === 'Bullish' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {entry.bias || 'No Bias'}
                  </div>
                  <div className={`py-3 rounded-xl text-center font-black text-[10px] uppercase tracking-widest ${entry.quality === 'Good' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {entry.quality || 'No Rating'}
                  </div>
                  <div className="mt-auto opacity-30 cursor-grab active:cursor-grabbing p-4 flex flex-col items-center">
                    <span className="text-2xl">⠿</span>
                    <span className="text-[8px] font-black uppercase mt-1">Drag to Move</span>
                  </div>
                </div>

                <div className="flex-1 space-y-12">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-4xl font-black text-white tracking-tighter uppercase">{entry.title}</h4>
                      <p className="text-neutral-500 text-[10px] font-bold uppercase mt-2 tracking-widest">{new Date(entry.date).toLocaleString()}</p>
                    </div>
                    <button onClick={() => setAnalyses(analyses.filter(a => a.id !== entry.id))} className="text-neutral-800 hover:text-red-500 p-4 transition-all bg-neutral-900 rounded-2xl">🗑</button>
                  </div>

                  {entry.images.length > 0 && (
                    <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
                      {entry.images.map((img, i) => (
                        <div key={i} className="relative flex-shrink-0 w-80 aspect-video rounded-2xl overflow-hidden cursor-zoom-in border-2 border-neutral-900 hover:border-indigo-500 transition-all shadow-xl" onClick={() => setSelectedImage(img)}>
                          <img src={img} className="w-full h-full object-cover" alt="Chart" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-neutral-900/60 p-8 rounded-[2.5rem] border border-neutral-800/50 shadow-inner">
                    <p className="text-neutral-300 text-lg leading-relaxed whitespace-pre-wrap">{entry.text || "No notes provided."}</p>
                  </div>

                  {entry.audio && (
                    <div className="pt-8 border-t border-neutral-900/50">
                      <audio src={entry.audio} controls className="w-full h-10 invert brightness-125 opacity-70" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {displayedEntries.length === 0 && (viewMode === 'list' || activeFolderId) && (
               <div className="py-24 text-center border-4 border-dashed border-neutral-900 rounded-[4rem] opacity-30">
                  <p className="text-6xl mb-6">📂</p>
                  <p className="text-neutral-600 font-black text-xl uppercase tracking-widest">No entries in this view</p>
               </div>
            )}
          </div>
        )}
      </section>

      <div className="flex justify-center gap-4">
        <button onClick={() => setViewMode(viewMode === 'list' ? 'folders' : 'list')} className="px-10 py-5 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
          {viewMode === 'list' ? '📂 Folder Hierarchy' : '📋 Continuous List'}
        </button>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-10 py-5 rounded-[2rem] bg-neutral-900 border border-neutral-800 text-neutral-500 font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
          ↑ Back to Top
        </button>
      </div>

    </div>
  );
};
