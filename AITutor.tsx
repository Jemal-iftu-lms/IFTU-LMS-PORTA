
import React, { useState, useRef, useEffect } from 'react';
import { askTutor } from '../services/geminiService';
import { Language } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";
import { Paperclip, X, FileText, Mic, MicOff, Send, Brain, Volume2, RotateCcw } from 'lucide-react';

interface AITutorProps {
  contextContent?: string;
  contextTitle?: string;
  initialPrompt?: string;
}

const AITutor: React.FC<AITutorProps> = ({ contextContent, contextTitle, initialPrompt }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; attachmentName?: string; isError?: boolean }[]>([]);
  const [input, setInput] = useState('');

  // Auto-initialize messages
  useEffect(() => {
    let welcome = 'Salam! I am IFTU AI (Sovereign Lab). How can I assist with your studies today?';
    if (contextTitle) {
      welcome = `Salam! I am IFTU AI. I see you are studying "${contextTitle}". How can I help you understand this lesson better?`;
    }
    setMessages([{ role: 'ai', text: welcome }]);

    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [contextTitle]);
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string, data: string, mimeType: string } | null>(null);
  const [parsedContent, setParsedContent] = useState<string>('');
  const [activeContextTitle, setActiveContextTitle] = useState<string>(contextTitle || '');
  const [activeContextContent, setActiveContextContent] = useState<string>(contextContent || '');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync props to state for clearability
  useEffect(() => {
    setActiveContextTitle(contextTitle || '');
    setActiveContextContent(contextContent || '');
  }, [contextTitle, contextContent]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    let timer: any;
    if (isHandsFree && !isListening && !isSpeaking && !isLoading) {
      timer = setTimeout(() => {
        // Double check conditions haven't changed during the delay
        if (isHandsFree && !isListening && !isSpeaking && !isLoading) {
          toggleListening();
        }
      }, 1500); // Increased delay
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isHandsFree, isListening, isSpeaking, isLoading]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map(result => result.transcript)
          .join('');
        
        if (event.results[0].isFinal) {
          const finalTranscript = transcript.trim();
          if (finalTranscript) {
            setInput(finalTranscript);
            if (isHandsFree) {
              handleSend(finalTranscript);
            }
          }
          setIsListening(false);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert("Microphone permission was denied. Please click the padlock in your browser's address bar and set Microphone to 'Allow', then refresh.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isHandsFree, lang]);

  const toggleListening = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = lang === 'am' ? 'am-ET' : lang === 'om' ? 'om-ET' : 'en-US';
          recognitionRef.current.start();
          // setIsListening(true); // Don't set here, let onstart handle it
        } catch (e: any) {
          if (e.name === 'InvalidStateError') {
            console.warn("Recognition already started, ignoring toggle.");
          } else {
            console.error("Error starting recognition:", e);
          }
        }
      } else {
        alert("Speech recognition is not supported in your browser.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.");
      return;
    }

    if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|csv|json)$/i)) {
      const textReader = new FileReader();
      textReader.onload = (event) => {
        setParsedContent(event.target?.result as string);
      };
      textReader.readAsText(file);
    } else {
      setParsedContent('');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      let mimeType = file.type;
      if (!mimeType) {
        if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (file.name.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (file.name.endsWith('.doc')) mimeType = 'application/msword';
      }
      setAttachment({
        name: file.name,
        data: base64String,
        mimeType: mimeType
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (voiceText?: string) => {
    const messageToSend = voiceText || input;
    if ((!messageToSend.trim() && !attachment) || isLoading) return;
    
    const userMsg = messageToSend;
    const currentAttachment = attachment;
    const currentParsedContent = parsedContent;
    
    setInput('');
    setAttachment(null);
    setParsedContent('');
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: userMsg, 
      attachmentName: currentAttachment?.name 
    }]);
    
    setIsLoading(true);
    try {
      const activeContext = activeContextContent || currentParsedContent || undefined;
      const response = await askTutor(userMsg, lang, activeContext, currentAttachment || undefined);
      
      const isErrorMessage = response === "I'm sorry, the connection to the National AI Lab was interrupted. Please check your internet or try a different question.";
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: response || 'Failed to connect.',
        isError: isErrorMessage
      }]);
      
      if (!isErrorMessage && (isHandsFree || autoSpeak) && response) {
        speakResponse(response);
      }
    } catch (error) {
      console.error("Tutor Error:", error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'Sorry, I encountered a critical error. Please try refreshing or checking your connectivity.',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    
    // Try Browser TTS first for Amharic/Oromiffa or if Gemini fails
    const runBrowserTTS = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      if (lang === 'am') utterance.lang = 'am-ET';
      else if (lang === 'om') utterance.lang = 'om-ET';
      else utterance.lang = 'en-US';
      
      utterance.onend = () => {
        setIsSpeaking(false);
        if (isHandsFree) setTimeout(() => !isListening && toggleListening(), 1000);
      };
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    };

    if (lang === 'am' || lang === 'om') {
      runBrowserTTS();
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say clearly in a professional educational tone: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        
        const dataInt16 = new Int16Array(bytes.buffer);
        const frameCount = dataInt16.length;
        const buffer = audioCtx.createBuffer(1, frameCount, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i] / 32768.0;

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.onended = () => {
          setIsSpeaking(false);
          if (isHandsFree) setTimeout(() => !isListening && toggleListening(), 1000);
        };
        source.start();
      } else {
        runBrowserTTS();
      }
    } catch (err) {
      console.error("TTS Gemini Error, falling back to browser:", err);
      runBrowserTTS();
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[800px] flex flex-col bg-white rounded-[4rem] border-8 border-black shadow-[24px_24px_0px_0px_rgba(59,130,246,1)] overflow-hidden animate-fadeIn">
      <div className="p-8 md:p-12 bg-blue-600 text-white border-b-8 border-black flex justify-between items-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-2 ethiopian-gradient"></div>
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl border-4 border-black flex items-center justify-center text-4xl shadow-lg">
              <Brain size={32} />
            </div>
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tighter italic">National AI Lab</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Sovereign Knowledge Engine v4.0</p>
            </div>
         </div>
         <div className="flex flex-col md:flex-row gap-4 items-center">
            {activeContextTitle && (
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 bg-yellow-400 text-black border-4 border-black rounded-xl font-black text-[10px] uppercase flex items-center gap-2 animate-bounce">
                  <FileText size={14} />
                  Context: {activeContextTitle}
                </div>
                <button 
                  onClick={() => {
                    setActiveContextTitle('');
                    setActiveContextContent('');
                  }}
                  className="bg-black text-white p-2 rounded-lg border-2 border-white hover:bg-white hover:text-black transition-colors"
                  title="Clear Lesson Context"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <div className="flex gap-4">
               <button 
                 onClick={() => setAutoSpeak(!autoSpeak)}
                 className={`px-4 py-2 rounded-xl border-4 border-black font-black uppercase text-[10px] transition-all flex items-center gap-2 ${autoSpeak ? 'bg-indigo-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-gray-400'}`}
                 title="Auto-Read: AI will always read responses aloud"
               >
                 <Volume2 size={14} />
                 Auto-Read
               </button>
               <button 
                 onClick={() => setIsHandsFree(!isHandsFree)}
                 className={`px-4 py-2 rounded-xl border-4 border-black font-black uppercase text-[10px] transition-all flex items-center gap-2 ${isHandsFree ? 'bg-green-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-gray-400'}`}
                 title="Hands-Free Mode: Automatic send and reply"
               >
                 <div className={`w-3 h-3 rounded-full ${isHandsFree ? 'bg-white animate-pulse' : 'bg-gray-300'}`}></div>
                 Hands-Free
               </button>
               {(['en', 'am', 'om'] as Language[]).map(l => (
                 <button 
                   key={l}
                   onClick={() => setLang(l)}
                   className={`w-12 h-12 rounded-xl border-4 border-black font-black uppercase text-xs transition-all ${lang === l ? 'bg-yellow-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-gray-400'}`}
                 >
                   {l}
                 </button>
               ))}
            </div>
         </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative group max-w-[85%] p-8 rounded-[3rem] border-4 border-black shadow-xl font-black text-xl leading-relaxed ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : m.isError 
                  ? 'bg-red-50 text-red-600 border-red-600 rounded-bl-none italic' 
                  : 'bg-white text-gray-900 rounded-bl-none'
            }`}>
              {m.attachmentName && (
                <div className="flex items-center gap-2 mb-4 bg-black/20 p-3 rounded-2xl w-fit">
                  <FileText size={20} />
                  <span className="text-sm truncate max-w-[200px]">{m.attachmentName}</span>
                </div>
              )}
              {m.text}
              {m.isError && (
                <button 
                  onClick={() => {
                    const lastUserMsg = [...messages].reverse().find(msg => msg.role === 'user')?.text;
                    if (lastUserMsg) handleSend(lastUserMsg);
                  }}
                  className="mt-4 flex items-center gap-2 text-sm bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors"
                >
                  <RotateCcw size={14} />
                  Retry Question
                </button>
              )}
              {m.role === 'ai' && !m.isError && (
                <div className="flex gap-2 absolute -bottom-4 -right-4">
                  <button 
                    onClick={() => speakResponse(m.text)}
                    disabled={isSpeaking}
                    className="w-12 h-12 bg-yellow-400 border-4 border-black rounded-full flex items-center justify-center text-xl shadow-lg hover:scale-110 active:scale-95 transition-all disabled:grayscale"
                    title="Listen to response (Amharic/Oromiffa supported via Browser fallback)"
                  >
                    {isSpeaking ? '⏳' : <Volume2 size={20} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white p-6 rounded-3xl border-4 border-black flex gap-2 shadow-lg animate-pulse">
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
          </div>
        )}
      </div>

      <div className="p-8 md:p-12 bg-white border-t-8 border-black flex flex-col gap-4">
        {attachment && (
          <div className="flex items-center justify-between bg-blue-50 border-4 border-black p-4 rounded-2xl w-fit max-w-full">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText className="shrink-0 text-blue-600" />
              <span className="font-black text-sm truncate">{attachment.name}</span>
            </div>
            <button onClick={() => { setAttachment(null); setParsedContent(''); }} className="ml-4 p-1 hover:bg-black/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="flex gap-4 md:gap-6 items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,.pdf,.docx,.txt"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-100 text-black w-16 h-16 md:w-20 md:h-20 rounded-[2rem] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all shrink-0 hover:bg-gray-200"
            title="Attach Document or Image"
          >
            <Paperclip size={24} strokeWidth={3} />
          </button>
          
          <button 
            onClick={toggleListening}
            className={`w-16 h-16 md:w-20 md:h-20 rounded-[2rem] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-black hover:bg-gray-200'}`}
            title={isListening ? "Stop Listening" : "Start Voice Input"}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Interrogate the National Registry..."
            className="flex-1 bg-gray-50 border-4 border-black rounded-[2.5rem] px-6 md:px-10 py-6 md:py-8 font-black text-xl md:text-2xl outline-none focus:bg-white transition-all shadow-inner min-w-0"
          />
          
          <button 
            onClick={() => handleSend()} 
            disabled={isLoading || (!input.trim() && !attachment)} 
            className="bg-blue-600 text-white w-16 h-16 md:w-24 md:h-20 rounded-[2rem] border-4 border-black flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-2 active:shadow-none transition-all disabled:opacity-50 shrink-0"
            title="Send Message"
          >
            <Send size={32} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITutor;

