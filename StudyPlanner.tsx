import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { askTutor } from '../services/geminiService';
import { User } from '../types';
import { Calendar, Sparkles, CheckCircle, Clock, Save, RefreshCw, ChevronRight, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

const StudyPlanner: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [plans, setPlans] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    loadExistingPlan();
  }, []);

  const loadExistingPlan = async () => {
    const plan = await dbService.fetchStudyPlan(currentUser.id);
    if (plan) setPlans(plan);
  };

  const generatePlan = async () => {
    if (!goalInput) return;
    setIsLoading(true);
    try {
      const prompt = `Generate a structured study plan for a student based on these goals: "${goalInput}". 
      Include 5 major milestones with specific actionable tasks. 
      Format as JSON: { "goals": ["string"], "milestones": [{ "title": "string", "tasks": ["string"], "estimate": "string" }] }`;
      
      const response = await askTutor(prompt, 'en');
      // Simple parser for AI response
      const jsonStr = response.match(/\{[\s\S]*\}/)?.[0];
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        setPlans(parsed);
        await dbService.saveStudyPlan(currentUser.id, parsed);
      }
    } catch (error) {
      console.error("AI Planner Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="relative">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-20 -left-20 w-80 h-80 bg-blue-100 rounded-full blur-[100px] pointer-events-none"
          />
          <div className="relative space-y-6">
            <h1 className="text-7xl font-black uppercase tracking-tighter text-gray-900 leading-[0.8]">
              Tactical<br /><span className="text-blue-600">Scheduler</span>
            </h1>
            <p className="text-xl font-bold text-gray-400 uppercase tracking-widest italic flex items-center gap-4">
              <Sparkles className="text-blue-600" />
              Sovereign Intelligence Optimization
            </p>
          </div>
        </div>

        {/* Input Controls */}
        <div className="bg-white border-8 border-black rounded-[4rem] p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 border-l-8 border-b-8 border-black rounded-bl-[4rem]" />
          
          <div className="space-y-8 max-w-2xl">
            <div className="space-y-4">
              <label className="text-sm font-black uppercase tracking-widest text-gray-400">Objective Input Matrix</label>
              <textarea 
                rows={3}
                placeholder="Ex: I want to master Grade 12 Advanced Physics and prepare for National Mock Exams within 4 weeks..."
                className="w-full text-2xl font-black p-8 bg-gray-50 border-4 border-black rounded-[2rem] outline-none focus:bg-white focus:shadow-[8px_8px_0px_0px_rgba(37,99,235,1)] transition-all"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
              />
            </div>
            
            <button 
              onClick={generatePlan}
              disabled={isLoading || !goalInput}
              className={`group flex items-center gap-6 bg-black text-white px-12 py-8 rounded-[2.5rem] border-4 border-black font-black uppercase text-2xl shadow-[12px_12px_0px_0px_rgba(37,99,235,1)] hover:translate-y-1 hover:shadow-none transition-all ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {isLoading ? (
                <RefreshCw size={32} className="animate-spin" />
              ) : (
                <Brain size={32} className="group-hover:scale-110 transition-transform" />
              )}
              {isLoading ? 'Computing Optimization...' : 'Synthesize Plan'}
            </button>
          </div>
        </div>

        {/* Plan Display */}
        {plans ? (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Milestones */}
            <div className="lg:col-span-2 space-y-8">
              {plans.milestones?.map((m: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white border-8 border-black rounded-[3rem] p-10 flex gap-8 items-start hover:bg-gray-50 transition-colors group shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex-shrink-0 w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-2xl font-black italic border-4 border-white shadow-[4px_4px_0px_0px_rgba(37,99,235,1)]">
                    {i + 1}
                  </div>
                  <div className="space-y-6 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-3xl font-black uppercase italic tracking-tight">{m.title}</h3>
                      <span className="flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-xs font-black border-2 border-black">
                        <Clock size={14} />
                        {m.estimate}
                      </span>
                    </div>
                    <div className="grid gap-4">
                      {m.tasks?.map((t: string, ti: number) => (
                        <div key={ti} className="flex items-start gap-4 p-4 bg-gray-100 rounded-2xl border-4 border-black hover:bg-white transition-colors cursor-pointer group/task">
                          <div className="w-6 h-6 border-4 border-black rounded-lg group-hover/task:bg-blue-600 transition-colors shrink-0 mt-1" />
                          <span className="text-lg font-bold uppercase">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Goals & Progress */}
            <div className="space-y-8">
              <div className="bg-black text-white border-8 border-black rounded-[3rem] p-10 shadow-[12px_12px_0px_0px_rgba(59,130,246,1)] space-y-8">
                <h2 className="text-4xl font-black uppercase italic border-b-4 border-white/20 pb-4 flex items-center gap-4">
                  <CheckCircle />
                  Target Matrix
                </h2>
                <div className="space-y-6">
                  {plans.goals?.map((g: string, i: number) => (
                    <div key={i} className="flex gap-4 items-center">
                      <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,1)]" />
                      <span className="text-lg font-bold uppercase opacity-80">{g}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-8 border-t-4 border-white/20">
                   <div className="flex justify-between text-xs font-black uppercase mb-4">
                      <span>Deployment Stability</span>
                      <span>40%</span>
                   </div>
                   <div className="w-full h-8 bg-white/10 rounded-xl border-4 border-white relative overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '40%' }}
                        className="absolute h-full bg-blue-600 border-r-4 border-white shadow-[inset_-8px_0_10px_rgba(255,255,255,0.4)]"
                      />
                   </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-8 border-black rounded-[3rem] p-10 space-y-6">
                <div className="flex items-center gap-4 text-yellow-600">
                  <Clock size={32} />
                  <span className="text-2xl font-black uppercase italic">Study Protocol</span>
                </div>
                <p className="text-gray-600 font-bold leading-relaxed italic">
                  Systems initialized. Generated at: {new Date(plans.generatedAt).toLocaleString()}.
                  Follow milestone progression for maximum knowledge retention.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-40 border-8 border-dashed border-gray-200 rounded-[6rem] space-y-8">
             <div className="w-32 h-32 bg-gray-100 rounded-[2.5rem] flex items-center justify-center mx-auto border-4 border-black group cursor-wait">
                <Brain size={64} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
             </div>
             <div className="space-y-4">
               <h3 className="text-3xl font-black uppercase text-gray-400 italic">Synthetic Intelligence Idle</h3>
               <p className="text-xl font-bold text-gray-300 uppercase tracking-widest">Input core objectives to activate Tactical Scheduler</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPlanner;
