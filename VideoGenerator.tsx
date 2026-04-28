import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { dbService } from '../services/dbService';
import { VideoLabItem, Grade } from '../types';
import { Save, CheckCircle } from 'lucide-react';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [videoMeta, setVideoMeta] = useState({
    title: '',
    description: '',
    subject: '',
    grade: Grade.G12
  });

  const [mode, setMode] = useState<'ai' | 'registry'>('ai');
  const [uploadUrl, setUploadUrl] = useState('');

  const handleSaveToLibrary = async () => {
    const finalUrl = mode === 'ai' ? videoUrl : uploadUrl;
    if (!finalUrl || !videoMeta.title || !videoMeta.subject) {
      setError('Intel Missing: Title, Subject, and Media URL are required for indexing.');
      return;
    }

    setSaveStatus('saving');
    try {
      const newItem: VideoLabItem = {
        id: `vid-${Date.now()}`,
        title: videoMeta.title,
        description: videoMeta.description,
        url: finalUrl,
        subject: videoMeta.subject,
        grade: videoMeta.grade,
        createdBy: 'National Registry Admin',
        createdAt: new Date().toISOString(),
        views: 0
      };
      await dbService.addVideo(newItem);
      
      // Auto-trigger system broadcast or targeted notification
      if (videoMeta.grade && videoMeta.subject) {
         await dbService.broadcastNotification({
          title: '📜 Sovereign Intel Indexed',
          message: `New ${videoMeta.subject} resource published for ${videoMeta.grade}: "${videoMeta.title}"`,
          type: 'info',
          createdAt: new Date().toISOString(),
          isRead: false
        });
      }

      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        if (mode === 'registry') {
          setUploadUrl('');
          setVideoMeta({ title: '', description: '', subject: '', grade: Grade.G12 });
        }
      }, 3000);
    } catch (err: any) {
      setError('Library indexing failed: ' + err.message);
      setSaveStatus('idle');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Semantic prompt required for generation.');
      return;
    }

    setError('');
    setVideoUrl('');

    // Check API key selection
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      try {
        await window.aistudio.openSelectKey();
      } catch (e) {
        setError('Security Clearance Required: API key selection is mandatory.');
        return;
      }
    }

    setIsGenerating(true);
    setStatus('Initializing Sovereign Synthesis...');

    try {
      const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        setStatus('Synthesizing visual intelligence... High latency expected (30-60s).');
        await new Promise(resolve => setTimeout(resolve, 30000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (videoUri) {
        setStatus('Ingesting binary stream...');
        const response = await fetch(videoUri, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey,
          },
        });
        
        if (!response.ok) {
          throw new Error('Signal Interrupted: Failed to fetch synthesized intelligence.');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setStatus('Synthesis Complete. Manifest Loaded.');
      } else {
        throw new Error('Null Response: Fragment generation returned empty.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Generation node failure.');
      setStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-4 p-4 bg-black rounded-[2.5rem] border-8 border-black">
        <button 
          onClick={() => setMode('ai')}
          className={`flex-1 py-4 rounded-2xl font-black uppercase text-sm transition-all ${mode === 'ai' ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)]' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
        >
          AI Synthesis
        </button>
        <button 
          onClick={() => setMode('registry')}
          className={`flex-1 py-4 rounded-2xl font-black uppercase text-sm transition-all ${mode === 'registry' ? 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
        >
          Registry Upload
        </button>
      </div>

      <div className="bg-white border-8 border-black rounded-[3rem] p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-5xl font-black uppercase tracking-tighter">
              {mode === 'ai' ? 'AI Video Synthesis' : 'Sovereign Asset Ingestion'}
            </h2>
            <p className="text-xl font-bold text-gray-500 mt-2">
              {mode === 'ai' ? 'Generate futuristic educational content via Veo.' : 'Register existing physical assets to the national metadata registry.'}
            </p>
          </div>
          <div className={`w-24 h-24 rounded-full border-4 border-black flex items-center justify-center text-4xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${mode === 'ai' ? 'bg-purple-100' : 'bg-amber-100'}`}>
            {mode === 'ai' ? '🎥' : '📁'}
          </div>
        </div>

        <div className="space-y-8">
          {mode === 'ai' ? (
            <>
              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-4">Synthesis Prompt (Veo Logic)</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., A cinematic fly-through of the African Union headquarters, illustrating diplomatic architecture..."
                  className="w-full p-6 bg-gray-50 border-4 border-black rounded-3xl font-bold text-lg outline-none focus:bg-white focus:shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] transition-all min-h-[150px]"
                  disabled={isGenerating}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-6 bg-purple-600 text-white rounded-2xl border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
              >
                {isGenerating ? 'Synthesizing...' : 'Begin Synthesis'}
              </button>
            </>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              <div className="p-10 bg-amber-50 border-8 border-black border-dashed rounded-[3rem] text-center space-y-6">
                <div className="text-6xl">📥</div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black uppercase italic">Binary Payload Detection</h4>
                  <p className="text-sm font-bold text-amber-900/60">Input the direct binary URL or IPFS manifest for the asset.</p>
                </div>
                <input 
                  type="text"
                  placeholder="https://content.national.edu/vids/physics_01.mp4"
                  className="w-full p-6 border-4 border-black rounded-2xl font-black outline-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                  value={uploadUrl}
                  onChange={e => setUploadUrl(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Asset Title</label>
                  <input 
                    className="w-full p-6 border-4 border-black rounded-2xl font-black"
                    value={videoMeta.title}
                    onChange={e => setVideoMeta({...videoMeta, title: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Academic Domain</label>
                  <input 
                    className="w-full p-6 border-4 border-black rounded-2xl font-black"
                    value={videoMeta.subject}
                    onChange={e => setVideoMeta({...videoMeta, subject: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target Grade</label>
                  <select 
                    className="w-full p-6 border-4 border-black rounded-2xl font-black"
                    value={videoMeta.grade}
                    onChange={e => setVideoMeta({...videoMeta, grade: e.target.value as Grade})}
                  >
                    {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Intel Summary</label>
                  <textarea 
                    className="w-full p-6 border-4 border-black rounded-2xl font-black min-h-[100px]"
                    value={videoMeta.description}
                    onChange={e => setVideoMeta({...videoMeta, description: e.target.value})}
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveToLibrary}
                disabled={saveStatus !== 'idle' || !uploadUrl}
                className={`w-full py-8 rounded-[2.5rem] border-8 border-black font-black uppercase text-2xl transition-all shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${
                  saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white hover:bg-black active:translate-y-2 active:shadow-none'
                }`}
              >
                {saveStatus === 'saving' ? 'INDEXING...' : saveStatus === 'saved' ? 'INDEXED SUCCESSFULLY' : 'INGEST ASSET'}
              </button>
            </div>
          )}

          {error && (
            <div className="p-6 bg-rose-50 border-4 border-black rounded-2xl text-rose-600 font-black flex items-center gap-4">
              <span className="text-2xl">⚠️</span> {error}
            </div>
          )}

          {status && !error && (
            <div className="p-6 bg-indigo-50 border-4 border-black rounded-2xl text-indigo-600 font-black flex items-center gap-4">
              {isGenerating && <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
              {status}
            </div>
          )}

          {mode === 'ai' && videoUrl && (
            <div className="mt-12 space-y-8 animate-fadeIn">
              <div className="border-[12px] border-black rounded-[4rem] overflow-hidden bg-black shadow-[25px_25px_0px_0px_rgba(0,0,0,1)]">
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full h-auto aspect-video"
                  autoPlay
                />
              </div>

              <div className="bg-purple-50 border-8 border-black rounded-[3rem] p-10 space-y-8">
                <h3 className="text-3xl font-black uppercase italic border-b-4 border-black pb-4">Index Synthesized Intellectual Property</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Library Metadata: Title</label>
                    <input 
                      className="w-full p-6 border-4 border-black rounded-2xl font-black"
                      value={videoMeta.title}
                      onChange={e => setVideoMeta({...videoMeta, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Library Metadata: Domain</label>
                    <input 
                      className="w-full p-6 border-4 border-black rounded-2xl font-black"
                      value={videoMeta.subject}
                      onChange={e => setVideoMeta({...videoMeta, subject: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveToLibrary}
                  disabled={saveStatus !== 'idle'}
                  className={`w-full py-8 flex items-center justify-center gap-4 rounded-[2.5rem] border-8 border-black font-black uppercase text-2xl transition-all shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${
                    saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-black hover:text-white'
                  }`}
                >
                  {saveStatus === 'saving' ? 'INDEXING...' : saveStatus === 'saved' ? 'INDEXED' : 'COMMIT TO REGISTRY'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
