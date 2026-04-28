
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Sparkles, CheckCircle, Circle, PlayCircle, FileText, HelpCircle, Send, Trophy, Brain } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Course, Lesson, Question, Language, User, AssignmentSubmission } from '../types';
import { getLessonDeepDive, generateLessonCheckpoints } from '../services/geminiService';
import Markdown from 'react-markdown';
import { dbService } from '../services/dbService';
import LiveInterviewer from './LiveInterviewer';
import CertificatePortal from './CertificatePortal';
import VideoPlayer from './VideoPlayer';
import LessonCheckpoint from './LessonCheckpoint';

const SovereignSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 border-4 border-black/5 rounded-2xl ${className}`}>
    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
  </div>
);

interface SecurePDFViewerProps {
  url: string;
  title: string;
}

const SecurePDFViewer: React.FC<SecurePDFViewerProps> = ({ url, title }) => {
  const [loadError, setLoadError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(false);
    setLoadError(false);
  }, [url]);
  const secureUrl = url ? `${url}#toolbar=0&navpanes=0&scrollbar=0` : '';
  if (loadError || !url) {
    return (
      <div className="w-full h-[800px] bg-rose-50 border-8 border-black rounded-[3.5rem] flex flex-col items-center justify-center p-12 text-center space-y-8">
        <div className="text-9xl">📖</div>
        <h3 className="text-5xl font-black uppercase italic tracking-tighter text-rose-600">Secure Stream Failure</h3>
      </div>
    );
  }
  return (
    <div className="w-full h-[850px] bg-gray-200 border-8 border-black rounded-[3.5rem] shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative group">
      {!isLoaded && (
        <div className="absolute inset-0 bg-white p-20 z-10 space-y-12 flex flex-col items-center justify-center">
           <div className="w-24 h-24 border-[10px] border-black border-t-blue-600 rounded-full animate-spin"></div>
           <p className="text-2xl font-black uppercase italic tracking-tighter animate-pulse">Establishing Sovereign Stream...</p>
        </div>
      )}
      <iframe src={secureUrl} className="w-full h-full border-none" title={title} onLoad={() => setIsLoaded(true)}></iframe>
    </div>
  );
};

interface LessonQuizProps {
  questions: Question[];
  onComplete: (score: number) => void;
  onCancel: () => void;
}

const LessonQuiz: React.FC<LessonQuizProps> = ({ questions, onComplete, onCancel }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentIdx];

  const handleAnswer = (answer: number | string) => {
    setAnswers({ ...answers, [currentQuestion.id]: answer });
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return Math.round((correct / questions.length) * 100);
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="bg-white p-12 rounded-[3rem] border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] text-center space-y-8 animate-scaleIn">
        <div className="text-8xl">🎯</div>
        <h3 className="text-4xl font-black uppercase italic tracking-tighter">Quiz Complete!</h3>
        <div className="text-6xl font-black text-blue-600">{score}%</div>
        <p className="text-xl font-bold text-gray-500 uppercase tracking-widest">
          {score >= 70 ? 'Excellent Work! You have mastered this lesson.' : 'Good effort, but you might want to review the material again.'}
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={onCancel} className="px-8 py-4 bg-gray-100 border-4 border-black rounded-2xl font-black uppercase text-sm">Review Lesson</button>
          <button onClick={() => onComplete(score)} className="px-12 py-4 bg-black text-white border-4 border-black rounded-2xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]">Continue →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-12 rounded-[3rem] border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center border-b-4 border-black pb-4">
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Question {currentIdx + 1} of {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`w-8 h-2 rounded-full border-2 border-black ${i <= currentIdx ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
          ))}
        </div>
      </div>

      <h4 className="text-2xl md:text-3xl font-black leading-tight">{currentQuestion.text}</h4>

      <div className="grid gap-4">
        {currentQuestion.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            className={`w-full text-left p-6 rounded-2xl border-4 border-black font-black transition-all flex items-center gap-4 ${answers[currentQuestion.id] === i ? 'bg-blue-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'}`}
          >
            <span className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center bg-black/10 text-xs">{String.fromCharCode(65 + i)}</span>
            {opt}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4">
        <button onClick={onCancel} className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Exit Quiz</button>
        <button 
          onClick={nextQuestion}
          disabled={answers[currentQuestion.id] === undefined}
          className={`px-10 py-4 rounded-2xl border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${answers[currentQuestion.id] === undefined ? 'bg-gray-100 text-gray-400 shadow-none' : 'bg-yellow-400 hover:translate-y-1'}`}
        >
          {currentIdx === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

interface CourseViewerProps {
  course: Course;
  initialLessonId?: string;
  onClose: () => void;
  currentUser: User | null;
  onUserUpdate: (user: User) => void;
  language?: Language;
  onOpenTutor?: (content: string, title: string, prompt?: string) => void;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ 
  course, 
  initialLessonId, 
  onClose, 
  currentUser,
  onUserUpdate,
  language = 'en',
  onOpenTutor
}) => {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(
    course.lessons.find(l => l.id === initialLessonId) || course.lessons[0] || null
  );
  const [deepDive, setDeepDive] = useState<{ content: string; type: 'simpler' | 'advanced' | null }>({ content: '', type: null });
  const [isDeepDiving, setIsDeepDiving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [showPrerequisiteLocked, setShowPrerequisiteLocked] = useState(false);
  const [lessonCheckpoints, setLessonCheckpoints] = useState<{ question: Partial<Question>, context: string }[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleSynthesizeCheckpoints = async () => {
    if (!activeLesson || isSynthesizing) return;
    setIsSynthesizing(true);
    const checkpoints = await generateLessonCheckpoints(activeLesson.content, language as Language);
    setLessonCheckpoints(checkpoints);
    setIsSynthesizing(false);
  };

  const missingPrerequisites = useMemo(() => {
    if (!course.prerequisites || course.prerequisites.length === 0) return [];
    return course.prerequisites.filter(code => !currentUser?.completedCourses?.includes(code));
  }, [course.prerequisites, currentUser?.completedCourses]);

  useEffect(() => {
    if (missingPrerequisites.length > 0) {
      setShowPrerequisiteLocked(true);
    }
  }, [missingPrerequisites]);

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const completedLessonIds = currentUser?.completedLessons || [];
  const isCourseComplete = course.lessons.every(l => completedLessonIds.includes(l.id));

  const progressPercentage = useMemo(() => {
    if (course.lessons.length === 0) return 0;
    const completedCount = course.lessons.filter(l => completedLessonIds.includes(l.id)).length;
    return Math.round((completedCount / course.lessons.length) * 100);
  }, [course.lessons, completedLessonIds]);

  const getLessonIcon = (lesson: Lesson) => {
    switch (lesson.contentType) {
      case 'video': return <PlayCircle className="w-5 h-5" />;
      case 'assignment': return <Send className="w-5 h-5" />;
      case 'quiz': return <HelpCircle className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  useEffect(() => {
    const fetchSubmission = async () => {
      if (activeLesson?.contentType === 'assignment' && currentUser) {
        const sub = await dbService.fetchUserSubmission(activeLesson.id, currentUser.id);
        setSubmission(sub);
      } else {
        setSubmission(null);
      }
    };
    fetchSubmission();
  }, [activeLesson, currentUser]);

  const handleAssignmentSubmit = async () => {
    if (!activeLesson || !currentUser || !uploadFile) return;

    setIsSubmitting(true);
    try {
      // Simulate file upload - in a real app, this would be Firebase Storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fileUrl = reader.result as string; // Data URL for simulation
        
        const newSubmission: AssignmentSubmission = {
          id: `sub-${Date.now()}`,
          assignmentId: activeLesson.id,
          studentId: currentUser.id,
          studentName: currentUser.name,
          submittedAt: new Date().toISOString(),
          fileUrl: fileUrl,
          status: 'submitted',
        };

        await dbService.syncSubmission(newSubmission);
        setSubmission(newSubmission);
        setUploadFile(null);
        alert("Assignment Submitted Successfully!");
        
        // Mark lesson as complete after submission
        handleFinish(100);
      };
      reader.readAsDataURL(uploadFile);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async (score?: number) => {
    if (!activeLesson || isSyncing) return;

    if (!currentUser) {
      alert("Please login to track your progress and earn points.");
      return;
    }

    // If lesson has a quiz and we haven't shown it yet, show it
    if (activeLesson.questions && activeLesson.questions.length > 0 && !showQuiz && !completedLessonIds.includes(activeLesson.id)) {
      setShowQuiz(true);
      return;
    }

    const points = score !== undefined ? Math.round(score / 2) : 50;
    
    // Check if already completed to avoid duplicate points/entries
    const isAlreadyCompleted = completedLessonIds.includes(activeLesson.id);
    
    setIsSyncing(true);
    try {
      const updatedCompletedLessons = Array.from(new Set([...completedLessonIds, activeLesson.id]));
      
      // Check if course is now complete
      const isCourseComplete = course.lessons.every(l => updatedCompletedLessons.includes(l.id));
      const updatedCompletedCourses = isCourseComplete 
        ? Array.from(new Set([...(currentUser.completedCourses || []), course.code])) 
        : (currentUser.completedCourses || []);

      const updatedUser: User = { 
        ...currentUser, 
        points: isAlreadyCompleted ? currentUser.points : currentUser.points + points, 
        completedLessons: updatedCompletedLessons, 
        completedCourses: updatedCompletedCourses 
      };

      // Update local state
      onUserUpdate(updatedUser);

      // Persist to database
      await dbService.syncUser(updatedUser);

      setJustCompletedId(activeLesson.id);
      setShowQuiz(false);
      setTimeout(() => setJustCompletedId(null), 2000);

      // Move to next lesson or close
      const currentIdx = course.lessons.findIndex(l => l.id === activeLesson.id);
      if (currentIdx < course.lessons.length - 1) {
        // Optional: show a small success message
        setTimeout(() => {
          setActiveLesson(course.lessons[currentIdx + 1]);
          setDeepDive({ content: '', type: null });
          setLessonCheckpoints([]);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
      } else if (isCourseComplete) {
        setTimeout(() => {
          setShowCompletionScreen(true);
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#009b44', '#ffcd00', '#ef3340', '#3b82f6'] // Ethiopian + Blue
          });
        }, 1500);
      } else {
        setTimeout(() => alert("Lesson Completed! You have finished all lessons in this course."), 1500);
      }
    } catch (error) {
      console.error("Failed to sync completion:", error);
      alert("National Registry Sync Interrupted. Please check your connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeepDive = async (type: 'simpler' | 'advanced') => {
    if (!activeLesson || isDeepDiving) return;
    setIsDeepDiving(true);
    setDeepDive({ content: '', type });
    const response = await getLessonDeepDive(activeLesson.content, type, language as Language);
    setDeepDive({ content: response, type });
    setIsDeepDiving(false);
  };

  if (!activeLesson) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden animate-fadeIn no-select">
      {justCompletedId === activeLesson.id && (
        <div className="absolute top-40 left-1/2 -translate-x-1/2 z-[300] bg-green-500 text-white px-10 py-5 rounded-[2.5rem] border-4 border-black font-black uppercase text-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 animate-bounce">
          <span className="text-4xl bg-white text-green-500 rounded-full w-10 h-10 flex items-center justify-center">✓</span>
          Lesson Mastered!
        </div>
      )}
      <div className="h-24 md:h-32 border-b-8 border-black flex items-center justify-between px-8 md:px-16 bg-white z-20 relative">
        {/* Sovereign Progress Bar Indicator - Integrated into bottom border area */}
        <div className="absolute -bottom-2 left-0 w-full h-2 bg-gray-100 overflow-hidden z-30">
           <div 
             className="h-full bg-blue-600 transition-all duration-1000 ease-out relative" 
             style={{ width: `${progressPercentage}%` }}
           >
             <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
           </div>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="w-16 h-16 bg-gray-50 border-4 border-black rounded-2xl flex items-center justify-center text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">←</button>
          <div className="flex flex-col">
            <h2 className="text-xl md:text-4xl font-black uppercase tracking-tighter italic leading-none">{course.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest hidden md:inline">
                Sovereign Registry Intel: {completedLessonIds.length} / {course.lessons.length} Modules cataloged
              </span>
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest md:hidden">
                {completedLessonIds.length}/{course.lessons.length} Completed
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-600 text-white rounded-2xl border-4 border-black flex items-center justify-center text-2xl">🔒</div>
          </div>
          <button 
            onClick={() => setShowMobileSidebar(true)}
            className="lg:hidden w-16 h-16 bg-blue-600 text-white border-4 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Trophy className="w-8 h-8" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <div className="fixed inset-0 z-[400] lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)}></div>
            <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white border-r-8 border-black flex flex-col animate-slideInLeft">
               <div className="p-8 border-b-8 border-black bg-gray-50 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black uppercase italic text-2xl">Modules</h3>
                    <button onClick={() => setShowMobileSidebar(false)} className="text-3xl font-black">✕</button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-500">
                      <span>Course Progress</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <div className="w-full h-4 bg-white border-2 border-black rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {course.lessons.map((lesson, idx) => {
                    const isCompleted = completedLessonIds.includes(lesson.id);
                    const isActive = activeLesson.id === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          setActiveLesson(lesson);
                          setShowMobileSidebar(false);
                          setDeepDive({ content: '', type: null });
                          setLessonCheckpoints([]);
                        }}
                        className={`w-full flex items-center gap-4 p-5 rounded-2xl border-4 font-black transition-all ${isActive ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(37,99,235,1)]' : isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-black/5'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-sm truncate uppercase tracking-tight">{lesson.title}</div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lesson.duration || '5m'}</div>
                        </div>
                      </button>
                    );
                  })}
               </div>
            </div>
          </div>
        )}

        {/* Sticky Sidebar Navigation (Desktop) */}
        <div className="hidden lg:flex w-96 border-r-8 border-black flex-col bg-white overflow-hidden">
          <div className="p-8 border-b-8 border-black space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black uppercase italic text-xl tracking-tighter">Course Progress</h3>
              <span className="font-black text-blue-600 tabular-nums">{progressPercentage}%</span>
            </div>
            <div className="w-full h-6 bg-gray-100 border-4 border-black rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>{completedLessonIds.length} of {course.lessons.length} Modules cataloged</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-8 space-y-3 custom-scrollbar">
            {course.lessons.map((lesson, idx) => {
              const isCompleted = completedLessonIds.includes(lesson.id);
              const isActive = activeLesson.id === lesson.id && !showCompletionScreen;

              return (
                <button
                  key={lesson.id}
                  onClick={() => { 
                    setActiveLesson(lesson); 
                    setDeepDive({ content: '', type: null }); 
                    setShowQuiz(false);
                    setShowCompletionScreen(false);
                    setLessonCheckpoints([]);
                  }}
                  className={`
                    w-full group relative flex items-center gap-4 p-5 rounded-2xl border-4 text-left transition-all
                    ${isActive 
                      ? 'bg-black text-white border-black shadow-[6px_6px_0px_0px_rgba(37,99,235,1)] translate-x-2' 
                      : isCompleted
                        ? 'bg-green-50 border-green-200 hover:border-black'
                        : 'bg-white border-transparent hover:border-black hover:bg-gray-50'
                    }
                  `}
                >
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-colors
                    ${isActive 
                      ? 'bg-blue-600 border-white text-white' 
                      : isCompleted ? 'bg-green-500 border-black text-white' : 'bg-gray-100 border-gray-200 text-gray-400'
                    }
                  `}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : getLessonIcon(lesson)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`text-[10px] uppercase tracking-[0.2em] font-black pb-0.5 ${isActive ? 'text-blue-400' : 'text-gray-400'}`}>
                      Module {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="font-black text-sm truncate uppercase tracking-tight">
                        {lesson.title}
                      </div>
                      <div className={`text-[10px] font-black tabular-nums ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                        {lesson.duration || '5m'}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="absolute right-4 animate-pulse">
                      <div className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-8 border-t-8 border-black bg-gray-50">
            {isCourseComplete ? (
              <button 
                onClick={() => setShowCompletionScreen(true)}
                className="w-full p-6 bg-yellow-400 border-4 border-black rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3"
              >
                <span>🎓</span> Claim Achievement
              </button>
            ) : (
              <div className="p-5 bg-white border-4 border-black rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center border-2 border-black">
                  <PlayCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-gray-400">Up Next</div>
                  <div className="text-xs font-black uppercase truncate max-w-[150px]">
                    {course.lessons.find(l => !completedLessonIds.includes(l.id))?.title || 'Finish Up!'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#f0f2f5] p-6 md:p-12 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-12 pb-24">
              {showPrerequisiteLocked ? (
                <div className="bg-white p-12 md:p-24 rounded-[5rem] border-8 border-black shadow-[30px_30px_0px_0px_rgba(239,51,64,1)] text-center space-y-12 animate-scaleIn">
                  <div className="text-9xl">🔒</div>
                  <div className="space-y-4">
                    <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-rose-900 leading-none">Access <br/>Denied.</h2>
                    <p className="text-2xl font-bold text-gray-500 uppercase tracking-widest">Sovereign clearance level insufficient for this module.</p>
                  </div>
                  <div className="bg-rose-50 border-4 border-black p-8 rounded-3xl space-y-6">
                    <h4 className="text-xl font-black uppercase italic text-rose-600">Missing Prerequisites:</h4>
                    <div className="flex flex-wrap gap-4 justify-center">
                      {missingPrerequisites.map(code => (
                        <div key={code} className="px-6 py-3 bg-black text-white border-2 border-black rounded-xl font-black uppercase text-sm">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={onClose}
                    className="px-12 py-8 bg-black text-white rounded-[2.5rem] border-8 border-black font-black uppercase text-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 transition-all"
                  >
                    Return to Catalog
                  </button>
                </div>
              ) : showCompletionScreen ? (
              <div className="bg-white p-12 md:p-24 rounded-[5rem] border-8 border-black shadow-[30px_30px_0px_0px_rgba(34,197,94,1)] text-center space-y-12 animate-scaleIn">
                <div className="text-9xl">🏆</div>
                <div className="space-y-4">
                  <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-blue-900 leading-none">Course <br/>Mastered!</h2>
                  <p className="text-2xl font-bold text-gray-500 uppercase tracking-widest">You have successfully cataloged all knowledge modules.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-6 justify-center">
                  <button 
                    onClick={() => setShowCertificate(true)}
                    className="px-12 py-8 bg-[#00D05A] text-white rounded-[2.5rem] border-8 border-black font-black uppercase text-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 transition-all"
                  >
                    Claim Official Certificate →
                  </button>
                  <button 
                    onClick={() => setShowCompletionScreen(false)}
                    className="px-12 py-8 bg-white text-black rounded-[2.5rem] border-8 border-black font-black uppercase text-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 transition-all"
                  >
                    Review Lessons
                  </button>
                </div>
              </div>
            ) : showQuiz && activeLesson.questions ? (
              <LessonQuiz 
                questions={activeLesson.questions} 
                onComplete={handleFinish} 
                onCancel={() => setShowQuiz(false)} 
              />
            ) : (
              <>
                {/* Conditional Rendering for TVET Oral Assessment or Standard Content */}
            {activeLesson.id.includes('oral') ? (
              <LiveInterviewer topic={activeLesson.title} onComplete={handleFinish} onCancel={onClose} />
            ) : (
              <>
                {activeLesson.contentType === 'video' ? (
                  <VideoPlayer 
                    src={activeLesson.videoUrl || ''} 
                    title={activeLesson.title} 
                    onEnded={() => handleFinish()}
                  />
                ) : activeLesson.contentType === 'assignment' ? (
                  <div className="w-full bg-white border-8 border-black rounded-[3.5rem] p-12 md:p-20 shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] space-y-10">
                    <div className="flex items-center gap-8 border-b-8 border-black pb-8">
                       <div className="w-24 h-24 bg-purple-600 text-white rounded-3xl border-4 border-black flex items-center justify-center text-5xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">📝</div>
                       <div>
                         <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">Assignment Portal</h3>
                         <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Submit your work for evaluation</p>
                       </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-2xl font-black uppercase italic">Task Description</h4>
                      <div className="prose prose-xl max-w-none text-gray-700 bg-gray-50 p-8 rounded-3xl border-4 border-black">
                        <Markdown>{activeLesson.content}</Markdown>
                      </div>
                    </div>

                    {submission ? (
                      <div className="bg-green-50 border-4 border-green-600 p-8 rounded-3xl space-y-4">
                        <div className="flex items-center gap-4 text-green-700">
                          <span className="text-3xl">✓</span>
                          <h5 className="text-xl font-black uppercase italic">Work Submitted</h5>
                        </div>
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border-2 border-green-200">
                          <p className="font-bold text-sm">Submitted on: {new Date(submission.submittedAt).toLocaleDateString()} | Duration: {activeLesson.duration}</p>
                          <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-black uppercase text-xs hover:underline">View Submission</a>
                        </div>
                        {submission.grade !== undefined && (
                          <div className="mt-6 p-6 bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <h6 className="text-lg font-black uppercase italic mb-2">Evaluation Result</h6>
                            <div className="flex items-center gap-4">
                              <span className="text-4xl font-black text-purple-600">{submission.grade}%</span>
                              <p className="text-sm font-bold text-gray-500 italic">"{submission.feedback || 'No feedback provided.'}"</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="p-12 border-4 border-dashed border-black rounded-[3rem] bg-gray-50 flex flex-col items-center justify-center space-y-6 text-center">
                          <div className="text-6xl">📤</div>
                          <div>
                            <p className="text-xl font-black uppercase italic">Upload your work</p>
                            <p className="text-xs font-bold text-gray-400 uppercase">PDF, DOCX, or ZIP (Max 10MB)</p>
                          </div>
                          <input 
                            type="file" 
                            id="assignment-upload" 
                            className="hidden" 
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          />
                          <label 
                            htmlFor="assignment-upload" 
                            className="px-10 py-4 bg-white border-4 border-black rounded-2xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:translate-y-1 transition-all"
                          >
                            {uploadFile ? uploadFile.name : 'Select File'}
                          </label>
                        </div>

                        <button 
                          onClick={handleAssignmentSubmit}
                          disabled={!uploadFile || isSubmitting}
                          className={`w-full py-8 rounded-[2.5rem] border-8 border-black font-black uppercase text-2xl shadow-[12px_12px_0px_0px_rgba(147,51,234,1)] transition-all ${!uploadFile || isSubmitting ? 'bg-gray-200 text-gray-400 shadow-none' : 'bg-purple-600 text-white hover:translate-y-2'}`}
                        >
                          {isSubmitting ? 'Transmitting...' : 'Deploy Submission →'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : activeLesson.contentType === 'document' ? (
                  <div className="w-full bg-white border-8 border-black rounded-[3.5rem] p-12 md:p-20 shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] space-y-10">
                    <div className="flex items-center gap-8 border-b-8 border-black pb-8">
                       <div className="w-24 h-24 bg-blue-600 text-white rounded-3xl border-4 border-black flex items-center justify-center text-5xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">📚</div>
                       <div>
                         <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">Lesson Resource</h3>
                         <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Download or view lesson materials</p>
                       </div>
                    </div>

                    <div className="space-y-8">
                      <div className="p-12 border-4 border-black rounded-[3rem] bg-gray-50 flex flex-col items-center justify-center space-y-6 text-center">
                        <div className="text-8xl">📄</div>
                        <h4 className="text-3xl font-black uppercase italic">{activeLesson.fileName || 'Lesson Document'}</h4>
                        <a 
                          href={activeLesson.fileUrl} 
                          download={activeLesson.fileName || 'lesson-document'}
                          className="px-12 py-6 bg-black text-white border-4 border-black rounded-2xl font-black uppercase text-lg shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 transition-all"
                        >
                          📥 Download Document
                        </a>
                      </div>
                      
                      {activeLesson.fileName?.toLowerCase().endsWith('.pdf') && (
                        <SecurePDFViewer url={activeLesson.fileUrl || ''} title={activeLesson.title} />
                      )}
                    </div>
                  </div>
                ) : (
                  <SecurePDFViewer url={activeLesson.pdfUrl || ''} title={activeLesson.title} />
                )}
                
                <div className="bg-white p-10 md:p-20 rounded-[4rem] border-8 border-black shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] space-y-12">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-none">{activeLesson.title}</h1>
                      <button 
                        onClick={() => {
                          if (onOpenTutor && activeLesson) {
                            onOpenTutor(activeLesson.content, activeLesson.title);
                          }
                        }}
                        className="flex flex-col items-center gap-2 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-4 border-black bg-blue-600 text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all"
                      >
                        <Brain size={24} />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-center">Ask AI <br className="hidden md:block"/>Tutor</span>
                      </button>
                      <button 
                        onClick={handleSynthesizeCheckpoints}
                        disabled={isSynthesizing || lessonCheckpoints.length > 0}
                        className={`flex flex-col items-center gap-2 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-4 border-black transition-all ${isSynthesizing ? 'bg-gray-100' : lessonCheckpoints.length > 0 ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none'}`}
                      >
                        {isSynthesizing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Synthesizing...</span>
                          </div>
                        ) : lessonCheckpoints.length > 0 ? (
                          <>
                            <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Active</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-center">Interactive <br className="hidden md:block"/>Mode</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => handleDeepDive('simpler')} 
                        className="flex items-center gap-2 bg-yellow-400 border-4 border-black px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all hover:bg-yellow-300"
                      >
                        <Sparkles className="w-4 h-4" />
                        Explain This Simply
                      </button>
                      <button 
                        onClick={() => handleDeepDive('advanced')} 
                        className="bg-blue-600 text-white border-4 border-black px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all hover:bg-blue-500"
                      >
                        Advanced Context
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-2xl max-w-none text-gray-700 leading-relaxed">
                    {lessonCheckpoints.length > 0 ? (
                      activeLesson.content.split('\n\n').map((para, pIdx) => (
                        <React.Fragment key={pIdx}>
                          <div className="mb-8">
                            <Markdown>{para}</Markdown>
                          </div>
                          {/* Inject checkpoint after roughly 1/3rd intervals of content */}
                          {pIdx === Math.floor(activeLesson.content.split('\n\n').length / 3) && lessonCheckpoints[0] && (
                            <LessonCheckpoint 
                              checkpoint={lessonCheckpoints[0]} 
                              onCorrect={(pts) => onUserUpdate({ ...currentUser!, points: currentUser!.points + pts })} 
                            />
                          )}
                          {pIdx === Math.floor(2 * activeLesson.content.split('\n\n').length / 3) && lessonCheckpoints[1] && (
                            <LessonCheckpoint 
                              checkpoint={lessonCheckpoints[1]} 
                              onCorrect={(pts) => onUserUpdate({ ...currentUser!, points: currentUser!.points + pts })} 
                            />
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <Markdown>{activeLesson.content}</Markdown>
                    )}
                  </div>
                  <div className="pt-10 flex justify-center">
                    <button 
                      onClick={() => handleFinish()} 
                      disabled={isSyncing}
                      className={`px-20 py-8 rounded-[2.5rem] border-8 border-black font-black uppercase text-2xl transition-all duration-500 ${
                        !currentUser 
                          ? 'bg-gray-200 text-gray-500 shadow-none'
                          : completedLessonIds.includes(activeLesson.id) 
                            ? `bg-green-500 text-white shadow-none cursor-default ${justCompletedId === activeLesson.id ? 'scale-105' : ''}` 
                            : 'bg-black text-white shadow-[12px_12px_0px_0px_rgba(34,197,94,1)] hover:translate-y-2'
                      }`}
                    >
                      {isSyncing ? 'Syncing...' : !currentUser ? 'Login to Track Progress' : completedLessonIds.includes(activeLesson.id) ? (
                        <span className="flex items-center gap-4">
                          Lesson Completed 
                          <span className={`inline-block ${justCompletedId === activeLesson.id ? 'animate-bounce text-4xl' : ''}`}>✓</span>
                        </span>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <div className="text-[10px] font-black uppercase text-gray-400 animate-pulse">Sovereign Knowledge Cataloging Required</div>
                          <span className="flex items-center gap-4">
                            Mark as Complete & Claim 50 Points →
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {(deepDive.type || isDeepDiving) && (
                  <div className="bg-blue-50 border-8 border-black rounded-[4rem] p-12 md:p-20 shadow-[25px_25px_0px_0px_rgba(59,130,246,1)] relative">
                    <button 
                      onClick={() => setDeepDive({ content: '', type: null })}
                      className="absolute top-8 right-8 w-12 h-12 bg-white border-4 border-black rounded-xl flex items-center justify-center text-xl hover:bg-gray-100 transition-colors"
                    >
                      ✕
                    </button>
                    <h4 className="text-4xl font-black uppercase italic mb-8">{deepDive.type === 'simpler' ? 'Simpler logic' : 'Advanced context'}</h4>
                    {isDeepDiving ? <p className="animate-pulse">Synthesizing...</p> : <p className="text-2xl leading-relaxed italic">{deepDive.content}</p>}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  </div>
      {showCertificate && currentUser && (
        <CertificatePortal 
          user={currentUser} 
          course={course} 
          onClose={() => { setShowCertificate(false); onClose(); }} 
        />
      )}
    </div>
  );
};

export default CourseViewer;
