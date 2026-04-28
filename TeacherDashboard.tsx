
import React, { useState, useRef, useEffect } from 'react';
import { User, Exam, Question, Grade, Stream, QuestionType, Course, Lesson, Difficulty, Assignment, AssignmentSubmission, EducationLevel, ExamType, CourseMaterial } from '../types';
import { parseExamDocument, generateExamQuestions, parseExamFromDocument, generateQuizFromLessonContent } from '../services/geminiService';
import { validateExam } from '../services/validationService';
import { dbService } from '../services/dbService';
import { auth } from '../firebase';
import { getEthiopianDateString } from '../lib/dateUtils';
import { NotificationCenter } from './NotificationCenter';
import { VideoGenerator } from './VideoGenerator';
import { getSubjectsBySelection } from '../constants';
import { motion } from 'framer-motion';

const PreviewExamModal: React.FC<{ 
  exam: Partial<Exam>, 
  currentUser: User,
  onClose: () => void, 
  onConfirm: () => void 
}> = ({ exam, currentUser, onClose, onConfirm }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  if (isConfirming) {
    return (
      <div className="fixed inset-0 z-[8000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white border-[12px] border-black rounded-[5rem] p-12 md:p-20 max-w-2xl w-full text-center space-y-10 shadow-[30px_30px_0px_0px_rgba(59,130,246,1)]"
        >
          <div className="w-32 h-32 bg-blue-600 border-8 border-black rounded-[2.5rem] flex items-center justify-center text-6xl mx-auto shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            🛡️
          </div>
          <div className="space-y-4">
            <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">Security Clearance.</h3>
            <p className="text-xl font-black text-slate-500 uppercase tracking-widest italic">Proceed with deployment to the Sovereign Registry?</p>
          </div>

          <div className="grid grid-cols-1 gap-4 text-left p-8 bg-blue-50 border-4 border-black rounded-[3rem]">
            <div className="flex justify-between border-b-2 border-black/10 pb-2">
              <span className="font-black uppercase text-[10px] text-slate-400">Initiator</span>
              <span className="font-black uppercase italic text-blue-600">{currentUser.name} ({currentUser.role.replace('_', ' ')})</span>
            </div>
            <div className="flex justify-between border-b-2 border-black/10 pb-2">
              <span className="font-black uppercase text-[10px] text-slate-400">Payload Title</span>
              <span className="font-black uppercase italic text-black">{exam.title}</span>
            </div>
            <div className="flex justify-between border-b-2 border-black/10 pb-2">
              <span className="font-black uppercase text-[10px] text-slate-400">Registry Path</span>
              <span className="font-black uppercase italic text-black">{exam.subject} • {exam.grade}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-black uppercase text-[10px] text-slate-400">Total Intel</span>
              <span className="font-black uppercase italic text-black">{exam.questions?.length} Qs • {exam.totalPoints} Pts</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={onConfirm}
              className="w-full py-8 bg-blue-600 text-white border-8 border-black rounded-[2.5rem] font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-700 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-4"
            >
              Confirm Deployment →
            </button>
            <button 
              onClick={() => setIsConfirming(false)}
              className="w-full py-6 bg-white border-4 border-black rounded-2xl font-black uppercase text-xl hover:bg-slate-50 transition-all text-slate-400"
            >
              ← Back to Review
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[7000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-fadeIn">
      <div className="bg-white border-[12px] border-black rounded-[5rem] w-full max-w-5xl h-[90vh] flex flex-col shadow-[40px_40px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-8 ethiopian-gradient"></div>
        
        <div className="p-8 md:p-14 flex-1 overflow-y-auto space-y-12 custom-scrollbar">
          <div className="flex justify-between items-start border-b-8 border-black pb-8">
            <div className="space-y-4">
              <span className="px-4 py-1 bg-blue-600 text-white rounded-lg font-black uppercase text-[10px] tracking-widest">Sovereign Registry Preview</span>
              <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">{exam.title || 'Untitled Exam'}</h2>
              <div className="flex flex-wrap gap-4 text-sm md:text-xl font-black uppercase italic text-slate-400">
                <span className="text-blue-600">{exam.subject}</span>
                <span>•</span>
                <span>{exam.grade}</span>
                <span>•</span>
                <span>{exam.questions?.length} Questions</span>
                <span>•</span>
                <span className="text-black">{exam.totalPoints} Total PTS</span>
              </div>
            </div>
            <button onClick={onClose} className="w-14 h-14 bg-rose-50 border-4 border-black rounded-[1.5rem] flex items-center justify-center text-2xl font-black hover:bg-rose-100 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">✕</button>
          </div>

          <div className="space-y-8">
            {exam.questions?.map((q, idx) => (
              <div key={q.id} className="p-8 bg-slate-50 border-4 border-black rounded-[2.5rem] space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-4 items-start">
                    <span className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0 font-black text-xl">{idx + 1}</span>
                    <p className="text-2xl font-black uppercase tracking-tight italic">{q.text}</p>
                  </div>
                  <span className="px-3 py-1 bg-white border-2 border-black rounded-lg font-black text-[10px] uppercase shadow-sm shrink-0 mt-1">{q.points} PTS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-0 md:ml-14">
                  {q.type === 'multiple-choice' ? (
                    q.options.map((opt, oIdx) => (
                      <div 
                        key={oIdx}
                        className={`p-4 rounded-xl border-4 border-black font-black uppercase text-sm transition-all flex items-center gap-3 ${
                          oIdx === q.correctAnswer 
                            ? 'bg-amber-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1' 
                            : 'bg-white'
                        }`}
                      >
                        <span className={`w-6 h-6 border-2 border-black rounded-lg flex items-center justify-center text-[10px] ${oIdx === q.correctAnswer ? 'bg-black text-amber-400' : 'bg-slate-100'}`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {oIdx === q.correctAnswer && <span className="font-black">✅</span>}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-4 bg-amber-50 border-4 border-black rounded-xl">
                      <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest block mb-1">Standardized Response Key:</span>
                      <span className="text-xl font-black uppercase italic">{q.correctAnswer}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 border-t-[10px] border-black bg-white flex flex-col md:flex-row gap-6 shrink-0">
          <button 
            onClick={onClose}
            className="flex-1 py-6 bg-rose-50 border-4 border-black rounded-2xl font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-rose-100 active:translate-y-1 active:shadow-none transition-all"
          >
            ← Modify Draft
          </button>
          <button 
            onClick={() => setIsConfirming(true)}
            className="flex-1 py-6 bg-blue-600 text-white border-4 border-black rounded-2xl font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-700 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
          >
            Launch to Registry →
          </button>
        </div>
      </div>
    </div>
  );
};

interface TeacherDashboardProps {
  currentUser: User;
  exams: Exam[];
  courses: Course[];
  onAddExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onUpdateExam: (exam: Exam) => void;
  onAddCourse: (course: Course) => void;
  onDeleteCourse: (id: string) => void;
  onUpdateCourse: (course: Course) => void;
  onAddAssignment: (assignment: Assignment) => void;
  onUpdateAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (id: string) => void;
  onUpdateSubmission: (submission: AssignmentSubmission) => void;
  onSendSMS?: (to: string, message: string) => void;
  onNavClick: (view: string) => void;
}

const GradingForm = ({ submission, onSave, onCancel }: { submission: AssignmentSubmission, onSave: (sub: AssignmentSubmission) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState({ 
    grade: submission.grade || 0, 
    feedback: submission.feedback || '',
    gradedFileUrl: submission.gradedFileUrl || ''
  });
  
  return (
    <div className="mt-4 p-6 bg-white border-4 border-black rounded-2xl space-y-4">
      <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg border-2 border-black">
        <span className="text-[10px] font-black uppercase">Grading {submission.studentName}</span>
        <button onClick={onCancel} className="text-rose-600 font-black">Cancel</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Score (Points)</label>
          <input 
            type="number" 
            value={formData.grade} 
            onChange={e => setFormData({...formData, grade: parseInt(e.target.value) || 0})}
            className="w-full p-2 border-2 border-black rounded-lg font-black"
          />
        </div>
        <div>
          <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Graded File URL (Optional)</label>
          <input 
            type="text" 
            value={formData.gradedFileUrl} 
            onChange={e => setFormData({...formData, gradedFileUrl: e.target.value})}
            className="w-full p-2 border-2 border-black rounded-lg font-bold"
            placeholder="Link to annotated PDF..."
          />
        </div>
      </div>
      <div>
        <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Feedback</label>
        <textarea 
          value={formData.feedback} 
          onChange={e => setFormData({...formData, feedback: e.target.value})}
          className="w-full p-2 border-2 border-black rounded-lg font-bold min-h-[80px]"
          placeholder="Excellent work, keep it up!"
        />
      </div>
      <button 
        onClick={() => onSave({ ...submission, ...formData, status: 'graded', gradedBy: auth.currentUser?.uid || 'Unknown', gradedAt: new Date().toISOString() })}
        className="w-full py-2 bg-green-600 text-white border-2 border-black rounded-lg font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
      >
        Submit Grade
      </button>
    </div>
  );
};

const AssignmentModal = ({ isOpen, onClose, onSave, assignment, courses }: { isOpen: boolean, onClose: () => void, onSave: (assignment: Assignment, file: File | null) => void, assignment: Assignment | null, courses: Course[] }) => {
  const [formData, setFormData] = useState<Assignment>(assignment || { id: '', title: '', description: '', dueDate: '', points: 0, courseCode: '', rubricUrl: '', status: 'draft', progressStatus: 'Not Started' });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (assignment) setFormData(assignment);
    else setFormData({ id: '', title: '', description: '', dueDate: '', points: 0, courseCode: '', rubricUrl: '', status: 'draft', progressStatus: 'Not Started' });
    setFile(null);
  }, [assignment, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[7000] p-4">
      <div className="bg-white p-8 rounded-[3rem] border-8 border-black w-full max-w-2xl shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-black uppercase italic mb-6 border-b-4 border-black pb-4">{assignment ? 'Edit Assignment' : 'New Assignment'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Title</label>
            <input type="text" placeholder="Assignment Title" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 border-4 border-black rounded-xl font-bold outline-none focus:bg-gray-50" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Description</label>
            <textarea placeholder="Describe the task..." value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 border-4 border-black rounded-xl font-bold outline-none focus:bg-gray-50 h-32" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Due Date (Gregorian)</label>
              <input type="date" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full p-4 border-4 border-black rounded-xl font-bold outline-none focus:bg-gray-50" />
              {formData.dueDate && (
                <p className="text-[10px] font-black text-blue-600 mt-1 uppercase tracking-widest">
                  Ethiopian: {getEthiopianDateString(formData.dueDate)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Points</label>
              <input type="number" placeholder="100" value={formData.points || 0} onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 0})} className="w-full p-4 border-4 border-black rounded-xl font-bold outline-none focus:bg-gray-50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Course</label>
              <select value={formData.courseCode || ''} onChange={e => setFormData({...formData, courseCode: e.target.value})} className="w-full p-4 border-4 border-black rounded-xl font-bold outline-none focus:bg-gray-50">
                <option value="">Select Course</option>
                {courses.map(c => <option key={c.id} value={c.code}>{c.title} ({c.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Progress Status</label>
              <select 
                value={formData.progressStatus || 'Not Started'} 
                onChange={e => setFormData({...formData, progressStatus: e.target.value as any})} 
                className="w-full p-4 border-4 border-black rounded-xl font-bold outline-none focus:bg-gray-50"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Needs Review">Needs Review</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Rubric (Optional)</label>
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full p-4 border-4 border-black rounded-xl font-bold outline-none focus:bg-gray-50" />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button onClick={onClose} className="px-8 py-4 bg-gray-200 border-4 border-black rounded-2xl font-black uppercase text-sm hover:bg-gray-300 transition-colors">Cancel</button>
          <button onClick={() => onSave({...formData, id: formData.id || Date.now().toString()}, file)} className="px-8 py-4 bg-black text-white border-4 border-black rounded-2xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 transition-all">Save Assignment</button>
        </div>
      </div>
    </div>
  );
};

const QuestionBankView: React.FC<{
  questions: Question[],
  onUpdate: (q: Question) => void,
  onDelete: (id: string) => void,
  onAdd: (q: Question) => void
}> = ({ questions, onUpdate, onDelete, onAdd }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<QuestionType | 'all'>('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newQ, setNewQ] = useState<Partial<Question>>({
    text: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 10,
    category: 'General',
    tags: []
  });

  const subjects = Array.from(new Set(questions.map(q => q.subject).filter(Boolean)));

  const filtered = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(search.toLowerCase()) || 
                          q.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || q.type === filterType;
    const matchesSubject = filterSubject === 'all' || q.subject === filterSubject;
    return matchesSearch && matchesType && matchesSubject;
  });

  return (
    <div className="space-y-12 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b-8 border-black pb-10">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">Intelligence Bank.</h2>
          <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Global Question Registry for National Assessment</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-12 py-6 bg-indigo-600 text-white border-4 border-black rounded-3xl font-black uppercase text-xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 active:translate-y-4 transition-all"
        >
          + Add New Intel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <input 
            type="text" 
            placeholder="Search Intelligence Registry..." 
            className="w-full p-6 border-4 border-black rounded-2xl font-black text-xl italic uppercase tracking-tighter outline-none bg-white shadow-inner"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="p-6 border-4 border-black rounded-2xl font-black uppercase text-sm bg-white"
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
        >
          <option value="all">All Payload Types</option>
          <option value="multiple-choice">Multiple Choice</option>
          <option value="true-false">True/False</option>
          <option value="fill-in-the-blank">Fill-in-the-blank</option>
          <option value="short-answer">Short Answer</option>
        </select>
        <select 
          className="p-6 border-4 border-black rounded-2xl font-black uppercase text-sm bg-white"
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
        >
          <option value="all">All Domain Subjects</option>
          {subjects.map(s => <option key={s} value={s!}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {filtered.map(q => (
          <div key={q.id} className="p-10 bg-white border-8 border-black rounded-[4rem] flex flex-col md:flex-row gap-10 shadow-[15px_15px_0_0_rgba(0,0,0,1)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-8 h-full bg-indigo-600"></div>
            <div className="flex-1 ml-4 space-y-6">
              <div className="flex flex-wrap gap-4 items-center">
                <span className="px-3 py-1 bg-indigo-100 border-2 border-black rounded-lg text-[10px] font-black uppercase">{q.type}</span>
                <span className="px-3 py-1 bg-amber-100 border-2 border-black rounded-lg text-[10px] font-black uppercase">{q.subject}</span>
                <span className="px-3 py-1 bg-slate-100 border-2 border-black rounded-lg text-[10px] font-black uppercase">{q.grade}</span>
                <span className="flex-1"></span>
                <span className="text-xl font-black uppercase italic text-indigo-600">{q.points} PTS</span>
              </div>
              <p className="text-3xl font-black uppercase italic tracking-tighter leading-tight">"{q.text}"</p>
              <div className="flex flex-wrap gap-2">
                {q.tags?.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-50 border border-black rounded text-[8px] font-bold uppercase">#{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex md:flex-col gap-4 justify-center md:items-end w-full md:w-auto">
              <button 
                onClick={() => onDelete(q.id)}
                className="p-4 bg-rose-50 border-4 border-black rounded-2xl hover:bg-rose-100 transition-colors"
                title="Purge Intel"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[8000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-8 border-black rounded-[4rem] w-full max-w-4xl p-12 space-y-8 animate-scaleIn my-10">
            <h3 className="text-4xl font-black uppercase italic border-b-4 border-black pb-4">New Intelligence Fragment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payload Logic (Question Text)</label>
                  <textarea 
                    className="w-full p-6 border-4 border-black rounded-2xl font-black h-32 outline-none focus:bg-gray-50 transition-all"
                    placeholder="Enter the question text here..."
                    value={newQ.text}
                    onChange={e => setNewQ({...newQ, text: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Intel Type</label>
                    <select 
                      className="w-full p-4 border-4 border-black rounded-xl font-black outline-none focus:bg-gray-50"
                      value={newQ.type}
                      onChange={e => setNewQ({...newQ, type: e.target.value as any, options: e.target.value === 'multiple-choice' ? ['', '', '', ''] : e.target.value === 'true-false' ? ['True', 'False'] : []})}
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                      <option value="fill-in-the-blank">Fill-in-the-blank</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reward points</label>
                    <input 
                      type="number"
                      className="w-full p-4 border-4 border-black rounded-xl font-black outline-none focus:bg-gray-50"
                      value={newQ.points}
                      onChange={e => setNewQ({...newQ, points: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Domain Subject</label>
                    <input 
                      type="text"
                      className="w-full p-4 border-4 border-black rounded-xl font-black outline-none focus:bg-gray-50"
                      placeholder="e.g. Physics"
                      value={newQ.subject || ''}
                      onChange={e => setNewQ({...newQ, subject: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Section Category</label>
                    <input 
                      type="text"
                      className="w-full p-4 border-4 border-black rounded-xl font-black outline-none focus:bg-gray-50"
                      placeholder="e.g. Mechanics"
                      value={newQ.category}
                      onChange={e => setNewQ({...newQ, category: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Grade Level</label>
                    <select 
                      className="w-full p-4 border-4 border-black rounded-xl font-black outline-none focus:bg-gray-50"
                      value={newQ.grade}
                      onChange={e => setNewQ({...newQ, grade: e.target.value as Grade})}
                    >
                      {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stream</label>
                    <select 
                      className="w-full p-4 border-4 border-black rounded-xl font-black outline-none focus:bg-gray-50"
                      value={newQ.stream}
                      onChange={e => setNewQ({...newQ, stream: e.target.value as Stream})}
                    >
                      {Object.values(Stream).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Search Tags (Comma separated)</label>
                  <input 
                    type="text"
                    className="w-full p-4 border-4 border-black rounded-xl font-black outline-none focus:bg-gray-50"
                    placeholder="gravity, dynamics, motion"
                    value={newQ.tags?.join(', ') || ''}
                    onChange={e => setNewQ({...newQ, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                  />
                </div>
              </div>

              <div className="space-y-6">
                {newQ.type === 'multiple-choice' || newQ.type === 'true-false' ? (
                  <>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Response Options & Decoder Key</label>
                    <div className="space-y-4">
                      {newQ.options?.map((opt, idx) => (
                        <div key={idx} className="flex gap-4 items-center">
                          <button 
                            onClick={() => setNewQ({...newQ, correctAnswer: idx})}
                            className={`w-12 h-12 border-4 border-black rounded-xl shrink-0 font-black text-xl flex items-center justify-center transition-all ${newQ.correctAnswer === idx ? 'bg-indigo-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-100 hover:bg-gray-200'}`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </button>
                          <input 
                            type="text" 
                            className={`flex-1 p-4 border-4 border-black rounded-xl font-black outline-none focus:bg-gray-50 ${newQ.correctAnswer === idx ? 'bg-indigo-50 border-indigo-600' : ''}`}
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            value={opt}
                            disabled={newQ.type === 'true-false'}
                            onChange={e => {
                              const opts = [...(newQ.options || [])];
                              opts[idx] = e.target.value;
                              setNewQ({...newQ, options: opts});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registry Correction Key (FITB)</label>
                    <input 
                      type="text"
                      className="w-full p-6 border-4 border-black rounded-2xl font-black text-2xl outline-none focus:bg-gray-50"
                      placeholder="Enter the exact answer..."
                      value={newQ.correctAnswer?.toString() || ''}
                      onChange={e => setNewQ({...newQ, correctAnswer: e.target.value})}
                    />
                    <p className="text-[8px] font-black uppercase text-slate-400 text-right mt-2 italic">Standardized string input required</p>
                  </div>
                )}
                
                <div className="p-8 bg-indigo-50 border-4 border-indigo-600 border-dashed rounded-[3rem] space-y-4">
                  <h4 className="text-xl font-black uppercase italic text-indigo-600">Sovereign Validation</h4>
                  <ul className="text-[10px] font-bold text-indigo-900 space-y-1">
                    <li className={newQ.text ? 'text-green-600' : 'text-rose-600'}>• {newQ.text ? 'Payload text detected' : 'Question text missing'}</li>
                    <li className={newQ.correctAnswer !== undefined ? 'text-green-600' : 'text-rose-600'}>• {newQ.correctAnswer !== undefined ? 'Decoder key mapped' : 'No correct answer defined'}</li>
                    <li className={newQ.subject ? 'text-green-600' : 'text-amber-600'}>• {newQ.subject ? `Subject: ${newQ.subject}` : 'General subject mapping used'}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-8">
              <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 py-6 bg-gray-100 border-4 border-black rounded-2xl font-black uppercase text-xl hover:bg-gray-200 transition-colors"
              >
                Abort Deployment
              </button>
              <button 
                onClick={() => {
                  if (!newQ.text || newQ.correctAnswer === undefined) {
                    alert('Deployment Blocked: Core intelligence fields incomplete.');
                    return;
                  }
                  onAdd({ ...newQ, id: Date.now().toString() } as Question);
                  setIsAdding(false);
                  setNewQ({ text: '', type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: 0, points: 10, category: 'General', tags: [], grade: Grade.G12, stream: Stream.NATURAL_SCIENCE });
                }}
                className="flex-1 py-6 bg-indigo-600 text-white border-4 border-black rounded-2xl font-black uppercase text-xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-700 active:translate-y-2 active:shadow-none transition-all"
              >
                Finalize Intel Commit →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ExamQuestionPicker: React.FC<{
  bank: Question[],
  onClose: () => void,
  onSelect: (questions: Question[]) => void
}> = ({ bank, onClose, onSelect }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const filtered = bank.filter(q => q.text.toLowerCase().includes(search.toLowerCase()) || q.category.toLowerCase().includes(search.toLowerCase()));

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-[7500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border-[12px] border-black rounded-[5rem] w-full max-w-4xl h-[85vh] flex flex-col shadow-[30px_30px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="p-10 border-b-8 border-black">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-4xl font-black uppercase italic leading-none">Intelligence Retrieval</h3>
            <button onClick={onClose} className="w-12 h-12 bg-rose-50 border-4 border-black rounded-xl text-xl font-black">✕</button>
          </div>
          <input 
            type="text" 
            placeholder="Filter bank..."
            className="w-full p-6 border-4 border-black rounded-2xl font-black text-xl italic"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar bg-slate-50">
          {filtered.map(q => (
            <div 
              key={q.id}
              onClick={() => toggleSelect(q.id)}
              className={`p-6 border-4 border-black rounded-3xl cursor-pointer transition-all flex items-center gap-6 ${selected.includes(q.id) ? 'bg-indigo-600 text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -translate-y-1' : 'bg-white hover:bg-gray-50'}`}
            >
              <div className={`w-10 h-10 border-4 border-black rounded-xl flex items-center justify-center font-black ${selected.includes(q.id) ? 'bg-white text-indigo-600' : 'bg-gray-100'}`}>
                {selected.includes(q.id) ? '✓' : ''}
              </div>
              <div className="flex-1">
                <p className="font-black uppercase italic leading-tight text-lg">"{q.text}"</p>
                <div className="flex gap-4 mt-2 text-[10px] font-black uppercase opacity-60">
                  <span>{q.type}</span>
                  <span>•</span>
                  <span>{q.subject}</span>
                </div>
              </div>
              <span className="font-black italic text-xl shrink-0">{q.points} PTS</span>
            </div>
          ))}
        </div>
        <div className="p-10 border-t-8 border-black bg-white flex justify-between items-center">
          <span className="text-xl font-black uppercase italic">{selected.length} Fragments Selected</span>
          <button 
            disabled={selected.length === 0}
            onClick={() => {
              const selectedQs = bank.filter(q => selected.includes(q.id));
              onSelect(selectedQs);
            }}
            className="px-12 py-6 bg-indigo-600 text-white border-4 border-black rounded-2xl font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 disabled:opacity-30 disabled:translate-y-0"
          >
            Integrate Intel →
          </button>
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  currentUser,
  exams, 
  courses, 
  onAddExam, 
  onDeleteExam,
  onUpdateExam,
  onAddCourse,
  onDeleteCourse,
  onUpdateCourse,
  onAddAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onUpdateSubmission,
  onNavClick
}) => {
  const [activeTab, setActiveTab] = useState<'exams' | 'courses' | 'assignments' | 'submissions' | 'videos' | 'database' | 'questions'>('exams');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission[]>>({});
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [isExamPickerOpen, setIsExamPickerOpen] = useState(false);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [creationMethod, setCreationMethod] = useState<'manual' | 'ai' | 'generate' | 'upload'>('manual');
  const [isScanning, setIsScanning] = useState(false);
  const [rawText, setRawText] = useState('');
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [showGenPreview, setShowGenPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      const fetchedAssignments = await dbService.fetchAssignments();
      setAssignments(fetchedAssignments);
      
      const submissionsMap: Record<string, AssignmentSubmission[]> = {};
      for (const assignment of fetchedAssignments) {
        const fetchedSubmissions = await dbService.fetchSubmissions(assignment.id);
        submissionsMap[assignment.id] = fetchedSubmissions;
      }
      setSubmissions(submissionsMap);

      const fetchedQuestions = await dbService.fetchQuestionBank();
      setQuestionBank(fetchedQuestions);
    };
    fetchData();
  }, []);

  const handleUpdateQuestionInBank = async (q: Question) => {
    await dbService.updateQuestionInBank(q);
    setQuestionBank(prev => prev.map(item => item.id === q.id ? q : item));
  };

  const handleDeleteQuestionFromBank = async (id: string) => {
    if (window.confirm("Purge this intel from the sovereign registry?")) {
      await dbService.deleteQuestionFromBank(id);
      setQuestionBank(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleAddQuestionToBank = async (q: Question) => {
    await dbService.addQuestionToBank(q);
    setQuestionBank(prev => [q, ...prev]);
  };

  // Generation Params
  const [genSubject, setGenSubject] = useState('');
  const [genTopic, setGenTopic] = useState('');
  const [genDifficulty, setGenDifficulty] = useState('Standard');
  const [genQuestionTypes, setGenQuestionTypes] = useState<string[]>(['multiple-choice']);
  const [genCount, setGenCount] = useState(5);

  const [newExam, setNewExam] = useState<Partial<Exam>>({
    title: '',
    durationMinutes: 90,
    questions: [],
    categories: [],
    grade: Grade.G12,
    stream: Stream.NATURAL_SCIENCE,
    academicYear: new Date().getFullYear(),
    totalPoints: 0,
    status: 'published',
    subject: 'Physics',
    difficulty: 'Medium',
    type: 'mid',
    semester: 1
  });

  useEffect(() => {
    if (newExam.grade && newExam.stream) {
      const subjects = getSubjectsBySelection(newExam.grade as Grade, newExam.stream as Stream);
      if (subjects.length > 0 && !subjects.includes(newExam.subject || '')) {
        setNewExam(prev => ({ ...prev, subject: subjects[0] }));
      }
    }
  }, [newExam.grade, newExam.stream]);

  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 10,
    category: 'General'
  });

  const [wizardStep, setWizardStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [courseWizardStep, setCourseWizardStep] = useState(1);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!newExam.title?.trim()) newErrors.title = "Exam title is required";
    if (!newExam.subject?.trim()) newErrors.subject = "Subject is required";
    if (!newExam.durationMinutes || newExam.durationMinutes <= 0) newErrors.duration = "Valid duration is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateQuestion = () => {
    const newErrors: Record<string, string> = {};
    if (!currentQuestion.text?.trim()) newErrors.qText = "Question text is required";
    if (!currentQuestion.category?.trim()) newErrors.qCategory = "Category is required";
    if (!currentQuestion.points || currentQuestion.points <= 0) newErrors.qPoints = "Points must be greater than 0";
    
    if (currentQuestion.type === 'multiple-choice') {
      if (currentQuestion.options?.some(opt => !opt.trim())) newErrors.qOptions = "All options must be filled";
    } else if (currentQuestion.type === 'fill-in-the-blank') {
      if (!currentQuestion.correctAnswer?.toString().trim()) newErrors.qAnswer = "Correct answer is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateCategories = (questions: Question[]) => {
    const uniqueCats = Array.from(new Set(questions.map(q => q.category)));
    setNewExam(prev => ({ ...prev, categories: uniqueCats }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      let mimeType = file.type;
      if (!mimeType) {
        if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (file.name.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (file.name.endsWith('.doc')) mimeType = 'application/msword';
        else mimeType = 'application/pdf';
      }
      
      try {
        const extracted = await parseExamFromDocument(base64Data, mimeType);
        const formatted: Question[] = extracted.map((q, idx) => ({
          ...q,
          id: `upload-${Date.now()}-${idx}`,
          grade: newExam.grade,
          stream: newExam.stream,
          subject: newExam.subject
        })) as Question[];
        
        const updatedQuestions = [...(newExam.questions || []), ...formatted];
        setNewExam(prev => ({
          ...prev,
          questions: updatedQuestions,
          totalPoints: (prev.totalPoints || 0) + formatted.reduce((sum, q) => sum + q.points, 0)
        }));
        updateCategories(updatedQuestions);
        setIsScanning(false);
        setCreationMethod('manual');
        setWizardStep(2); // Jump to questions step
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error(error);
        setIsScanning(false);
        alert("Artifact Ingestion Failed. Ensure the document is high-contrast and readable.");
      }
    };
    reader.readAsDataURL(file);
  };

  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [lessonQuizPreview, setLessonQuizPreview] = useState<Partial<Question>[]>([]);
  const [quizDifficulty, setQuizDifficulty] = useState<Difficulty>('Medium');
  const [quizQuestionTypes, setQuizQuestionTypes] = useState<QuestionType[]>(['multiple-choice']);

  const handleGenerateLessonQuiz = async () => {
    if (!currentLesson.content.trim()) {
      alert('Please add lesson content first to generate a quiz.');
      return;
    }

    setIsGeneratingQuiz(true);
    try {
      const questions = await generateQuizFromLessonContent(
        currentLesson.content, 
        quizDifficulty, 
        quizQuestionTypes
      );
      setLessonQuizPreview(questions);
    } catch (error) {
      console.error('Quiz Generation Error:', error);
      alert('Failed to generate quiz. Please try again.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const addLessonQuiz = () => {
    const questions = lessonQuizPreview as Question[];
    setCurrentLesson({
      ...currentLesson,
      questions: [...(currentLesson.questions || []), ...questions]
    });
    setLessonQuizPreview([]);
  };

  const handleAIScan = async () => {
    if (!rawText.trim()) return;
    setIsScanning(true);
    try {
      const extracted = await parseExamDocument(rawText);
      const formatted: Question[] = extracted.map((q, idx) => ({
        ...q,
        id: `ai-${Date.now()}-${idx}`,
        grade: newExam.grade,
        stream: newExam.stream,
        subject: newExam.subject
      })) as Question[];
      
      const updatedQuestions = [...(newExam.questions || []), ...formatted];
      setNewExam(prev => ({
        ...prev,
        questions: updatedQuestions,
        totalPoints: (prev.totalPoints || 0) + formatted.reduce((sum, q) => sum + q.points, 0)
      }));
      updateCategories(updatedQuestions);
      setIsScanning(false);
      setRawText('');
      setCreationMethod('manual');
      setWizardStep(2); // Jump to questions step
    } catch (error) {
      console.error(error);
      setIsScanning(false);
      alert("AI Processing Failed.");
    }
  };

  const handleAIGeneration = async () => {
    const newErrors: Record<string, string> = {};
    if (!genSubject.trim()) newErrors.genSubject = "Subject is required";
    if (!genTopic.trim()) newErrors.genTopic = "Topic is required";
    if (genQuestionTypes.length === 0) newErrors.genTypes = "Select at least one question type";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsScanning(true);
    try {
      const extracted = await generateExamQuestions(genSubject, genTopic, genDifficulty, genQuestionTypes, genCount);
      const formatted: Question[] = extracted.map((q, idx) => ({
        ...q,
        id: `gen-${Date.now()}-${idx}`,
        grade: newExam.grade,
        stream: newExam.stream,
        subject: newExam.subject
      })) as Question[];
      
      setGeneratedQuestions(formatted);
      setShowGenPreview(true);
      setIsScanning(false);
    } catch (error) {
      console.error(error);
      setIsScanning(false);
      alert("AI Generation Failed.");
    }
  };

  const addGeneratedQuestions = () => {
    const updatedQuestions = [...(newExam.questions || []), ...generatedQuestions];
    setNewExam(prev => ({
      ...prev,
      questions: updatedQuestions,
      totalPoints: (prev.totalPoints || 0) + generatedQuestions.reduce((sum, q) => sum + q.points, 0)
    }));
    updateCategories(updatedQuestions);
    setGeneratedQuestions([]);
    setShowGenPreview(false);
    setCreationMethod('manual');
    setWizardStep(2);
  };

  const addQuestion = () => {
    if (!validateQuestion()) return;
    const q = { 
      ...currentQuestion, 
      id: Date.now().toString(),
      grade: newExam.grade,
      stream: newExam.stream,
      subject: newExam.subject
    } as Question;
    const updatedQuestions = [...(newExam.questions || []), q];
    setNewExam(prev => ({
      ...prev,
      questions: updatedQuestions,
      totalPoints: (prev.totalPoints || 0) + q.points
    }));
    updateCategories(updatedQuestions);
    setCurrentQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0, points: 10, category: 'General' });
  };

  const handleSaveExam = async () => {
    setServerErrors([]);
    
    if (!newExam.title || !newExam.questions?.length) {
      alert("Please ensure the exam has a title and at least one question.");
      return;
    }

    setIsValidating(true);
    try {
      const result = validateExam(newExam);

      if (!result.valid) {
        setServerErrors(result.errors || ["Validation failed locally."]);
        setIsValidating(false);
        return;
      }
    } catch (err) {
      console.error("Validation Error:", err);
      alert("Local integrity check failed. Please check your data.");
    } finally {
      setIsValidating(false);
    }
    
    if (editingExamId) {
      onUpdateExam({
        ...newExam,
        id: editingExamId,
      } as Exam);
    } else {
      onAddExam({ 
        ...newExam, 
        id: Date.now().toString(),
        type: 'mock-eaes',
        semester: 2,
        status: 'published'
      } as Exam);
    }
    
    setIsCreating(false);
    setEditingExamId(null);
    setWizardStep(1);
    setServerErrors([]);
    // Reset
    setNewExam({
      title: '',
      durationMinutes: 90,
      questions: [],
      categories: [],
      grade: Grade.G12,
      stream: Stream.NATURAL_SCIENCE,
      academicYear: new Date().getFullYear(),
      totalPoints: 0,
      status: 'published',
      subject: 'General',
      difficulty: 'Medium'
    });
  };

  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    title: '',
    code: '',
    description: '',
    grade: Grade.G9,
    stream: Stream.GENERAL,
    subject: 'Physics',
    level: EducationLevel.SECONDARY,
    lessons: [],
    thumbnail: 'https://picsum.photos/seed/course/800/600',
    prerequisites: [],
    syllabus: '',
    learningObjectives: [],
    materials: []
  });
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);

  const [newObjective, setNewObjective] = useState('');
  const [newMaterial, setNewMaterial] = useState<Partial<CourseMaterial>>({
    title: '',
    type: 'document',
    url: ''
  });

  useEffect(() => {
    if (newCourse.grade && newCourse.stream) {
      const subjects = getSubjectsBySelection(newCourse.grade as Grade, newCourse.stream as Stream);
      if (subjects.length > 0 && !subjects.includes(newCourse.subject || '')) {
        setNewCourse(prev => ({ ...prev, subject: subjects[0] }));
      }
    }
  }, [newCourse.grade, newCourse.stream]);

  const [currentLesson, setCurrentLesson] = useState<Partial<Lesson>>({
    title: '',
    content: '',
    contentType: 'video',
    videoUrl: '',
    pdfUrl: '',
    fileUrl: '',
    fileName: ''
  });

  const handleSaveCourse = () => {
    if (!newCourse.title || !newCourse.lessons?.length) {
      alert("Please ensure the course has a title and at least one lesson.");
      return;
    }
    
    if (editingCourseId) {
      onUpdateCourse({
        ...newCourse,
        id: editingCourseId,
      } as Course);
    } else {
      onAddCourse({
        ...newCourse,
        id: `course-${Date.now()}`,
      } as Course);
    }
    
    setIsCreatingCourse(false);
    setEditingCourseId(null);
    setNewCourse({
      title: '',
      description: '',
      grade: Grade.G12,
      stream: Stream.NATURAL_SCIENCE,
      lessons: [],
      thumbnail: 'https://picsum.photos/seed/course/800/600',
      points: 100,
      enrolledCount: 0,
      rating: 5.0
    });
  };

  const addLesson = () => {
    if (!currentLesson.title || !currentLesson.content) {
      alert("Lesson title and content are required.");
      return;
    }
    const lesson = { 
      ...currentLesson, 
      id: currentLesson.id || `lesson-${Date.now()}`,
      duration: currentLesson.duration || '15 mins',
      type: currentLesson.contentType === 'video' ? 'video' : 'reading'
    } as Lesson;

    const updatedLessons = [...(newCourse.lessons || [])];
    if (editingLessonIndex !== null) {
      updatedLessons[editingLessonIndex] = lesson;
    } else {
      updatedLessons.push(lesson);
    }

    setNewCourse(prev => ({
      ...prev,
      lessons: updatedLessons
    }));
    setCurrentLesson({ title: '', content: '', contentType: 'video', videoUrl: '', pdfUrl: '', fileUrl: '', fileName: '' });
    setEditingLessonIndex(null);
  };

  const editLesson = (index: number) => {
    if (!newCourse.lessons) return;
    const lesson = newCourse.lessons[index];
    setCurrentLesson(lesson);
    setEditingLessonIndex(index);
  };

  const handleSaveAssignment = async (assignment: Assignment, file: File | null) => {
    let rubricUrl = assignment.rubricUrl;
    if (file) {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../firebase');
      const storageRef = ref(storage, `rubrics/${assignment.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      rubricUrl = await getDownloadURL(storageRef);
    }
    const updatedAssignment = { ...assignment, rubricUrl };
    if (editingAssignment) {
      await onUpdateAssignment(updatedAssignment);
      setAssignments(assignments.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
    } else {
      await onAddAssignment(updatedAssignment);
      setAssignments([...assignments, updatedAssignment]);
      
      // Notify students in relevant grade and stream
      const course = courses.find(c => c.code === updatedAssignment.courseCode);
      if (course) {
        await dbService.notifyRelevantStudents({
          title: 'Hojii Manee Haaraa',
          message: `${course.title}: Hojii manee haaraa '${updatedAssignment.title}' dabalamee jira. Akka galmeessitan kabajaan isin beeksifna.`,
          type: 'assignment',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: `/assignments/${updatedAssignment.id}`
        }, course.grade, course.stream);
      }
    }
    setIsCreatingAssignment(false);
    setEditingAssignment(null);
  };

  const handleDeleteAssignment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      await onDeleteAssignment(id);
      setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      {/* TAB NAVIGATION */}
      <div className="flex justify-between items-center border-b-8 border-black pb-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onNavClick('home')}
            className="w-14 h-14 bg-white border-4 border-black rounded-xl flex items-center justify-center text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 transition-all mr-4"
            title="Return to Student Home"
          >
            🏠
          </button>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('exams')}
              className={`px-10 py-4 rounded-t-3xl border-x-4 border-t-4 border-black font-black uppercase text-sm transition-all ${activeTab === 'exams' ? 'bg-blue-600 text-white translate-y-2' : 'bg-gray-100'}`}
            >
              Exam Repository
            </button>
          <button 
            onClick={() => setActiveTab('courses')}
            className={`px-10 py-4 rounded-t-3xl border-x-4 border-t-4 border-black font-black uppercase text-sm transition-all ${activeTab === 'courses' ? 'bg-purple-600 text-white translate-y-2' : 'bg-gray-100'}`}
          >
            Course Curriculum
          </button>
          <button 
            onClick={() => setActiveTab('assignments')}
            className={`px-10 py-4 rounded-t-3xl border-x-4 border-t-4 border-black font-black uppercase text-sm transition-all ${activeTab === 'assignments' ? 'bg-orange-600 text-white translate-y-2' : 'bg-gray-100'}`}
          >
            Assignments
          </button>
          <button 
            onClick={() => setActiveTab('submissions')}
            className={`px-10 py-4 rounded-t-3xl border-x-4 border-t-4 border-black font-black uppercase text-sm transition-all ${activeTab === 'submissions' ? 'bg-green-600 text-white translate-y-2' : 'bg-gray-100'}`}
          >
            Assignment Submissions
          </button>
          <button 
            onClick={() => setActiveTab('videos')}
            className={`px-10 py-4 rounded-t-3xl border-x-4 border-t-4 border-black font-black uppercase text-sm transition-all ${activeTab === 'videos' ? 'bg-pink-600 text-white translate-y-2' : 'bg-gray-100'}`}
          >
            Video Gen
          </button>
          <button 
            onClick={() => setActiveTab('questions')}
            className={`px-10 py-4 rounded-t-3xl border-x-4 border-t-4 border-black font-black uppercase text-sm transition-all ${activeTab === 'questions' ? 'bg-indigo-600 text-white translate-y-2' : 'bg-gray-100'}`}
          >
            Bank.
          </button>
          <button 
            onClick={() => setActiveTab('database')}
            className={`px-10 py-4 rounded-t-3xl border-x-4 border-t-4 border-black font-black uppercase text-sm transition-all ${activeTab === 'database' ? 'bg-amber-500 text-white translate-y-2' : 'bg-gray-100'}`}
          >
            📝 Data Intel
          </button>
        </div>
      </div>
      <NotificationCenter userId={currentUser.id} />
    </div>

      {activeTab === 'exams' ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b-8 border-black pb-10">
            <div>
              <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none text-blue-900">Mock Repository.</h2>
              <p className="text-blue-600 font-black uppercase text-sm mt-4 tracking-[0.3em]">Official EAES Standard Creator</p>
            </div>
            <button 
              onClick={() => {
                setIsCreating(true);
                setWizardStep(1);
              }} 
              className="bg-black text-white px-10 py-5 rounded-[2.5rem] border-4 border-black font-black uppercase text-xl shadow-[10px_10px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 transition-all"
            >
              ＋ Deploy New Exam
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {exams.map(ex => (
              <div key={ex.id} className="bg-white p-10 rounded-[4rem] border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase border-2 border-black ${ex.stream === Stream.NATURAL_SCIENCE ? 'bg-cyan-400' : 'bg-amber-400'}`}>
                        {ex.grade}
                      </span>
                      <span className="px-4 py-1 rounded-xl text-[10px] font-black uppercase border-2 border-black bg-purple-400">
                        {ex.type?.toUpperCase()}
                      </span>
                      <span className="px-4 py-1 rounded-xl text-[10px] font-black uppercase border-2 border-black bg-blue-400">
                        S{ex.semester}
                      </span>
                      {ex.difficulty && (
                        <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase border-2 border-black ${ex.difficulty === 'Easy' ? 'bg-green-400' : ex.difficulty === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'}`}>
                          {ex.difficulty}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-gray-400 uppercase">{ex.durationMinutes}m</span>
                  </div>
                  <h4 className="text-4xl font-black uppercase italic tracking-tighter leading-none group-hover:text-blue-700 transition-all">{ex.title}</h4>
                  <div className="flex flex-wrap gap-2">
                    {ex.categories?.map(cat => (
                      <span key={cat} className="bg-gray-100 text-[8px] font-black uppercase px-2 py-1 rounded border border-black">{cat}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-10 pt-8 border-t-4 border-black flex justify-between items-center">
                  <span className="text-2xl font-black">{ex.questions.length} Items</span>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setNewExam(ex);
                        setEditingExamId(ex.id);
                        setIsCreating(true);
                        setWizardStep(1);
                      }} 
                      className="w-12 h-12 bg-blue-50 border-4 border-black rounded-xl text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                    >
                      ✏️
                    </button>
                    <button onClick={() => onDeleteExam(ex.id)} className="w-12 h-12 bg-rose-50 border-4 border-black rounded-xl text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : activeTab === 'courses' ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b-8 border-black pb-10">
            <div>
              <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none text-purple-900">Curriculum Forge.</h2>
              <p className="text-purple-600 font-black uppercase text-sm mt-4 tracking-[0.3em]">National Lesson Architect</p>
            </div>
            <button 
              onClick={() => setIsCreatingCourse(true)} 
              className="bg-black text-white px-10 py-5 rounded-[2.5rem] border-4 border-black font-black uppercase text-xl shadow-[10px_10px_0px_0px_rgba(147,51,234,1)] hover:translate-y-1 transition-all"
            >
              ＋ Architect New Course
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {courses.map(course => (
              <div key={course.id} className="bg-white p-10 rounded-[4rem] border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase border-2 border-black bg-purple-100`}>
                      {course.grade}
                    </span>
                    <span className="text-xs font-black text-gray-400 uppercase">{course.lessons.length} Lessons</span>
                  </div>
                  <h4 className="text-4xl font-black uppercase italic tracking-tighter leading-none group-hover:text-purple-700 transition-all">{course.title}</h4>
                  <p className="text-sm font-bold text-gray-500 italic line-clamp-2">{course.description}</p>
                </div>
                <div className="mt-10 pt-8 border-t-4 border-black flex justify-between items-center">
                  <span className="text-2xl font-black">{course.points} XP</span>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setNewCourse(course);
                        setEditingCourseId(course.id);
                        setIsCreatingCourse(true);
                      }} 
                      className="w-12 h-12 bg-purple-50 border-4 border-black rounded-xl text-purple-600 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all"
                    >
                      ✏️
                    </button>
                    <button onClick={() => onDeleteCourse(course.id)} className="w-12 h-12 bg-rose-50 border-4 border-black rounded-xl text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : activeTab === 'assignments' ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b-8 border-black pb-10">
            <div>
              <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none text-orange-900">Assignment Forge.</h2>
              <p className="text-orange-600 font-black uppercase text-sm mt-4 tracking-[0.3em]">National Task Architect</p>
            </div>
            <button 
              onClick={() => {
                setEditingAssignment(null);
                setIsCreatingAssignment(true);
              }} 
              className="bg-black text-white px-10 py-5 rounded-[2.5rem] border-4 border-black font-black uppercase text-xl shadow-[10px_10px_0px_0px_rgba(249,115,22,1)] hover:translate-y-1 transition-all"
            >
              ＋ Architect New Task
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {assignments.map(assignment => (
              <div key={assignment.id} className="bg-white p-10 rounded-[4rem] border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 items-center">
                      <span className="px-4 py-1 rounded-xl text-[10px] font-black uppercase border-2 border-black bg-orange-100">
                        {assignment.courseCode}
                      </span>
                      {assignment.progressStatus && (
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border-2 border-black ${
                          assignment.progressStatus === 'Completed' ? 'bg-green-400' :
                          assignment.progressStatus === 'In Progress' ? 'bg-blue-400' :
                          assignment.progressStatus === 'Needs Review' ? 'bg-orange-400' :
                          'bg-gray-200'
                        }`}>
                          {assignment.progressStatus}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-gray-400 uppercase">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{getEthiopianDateString(assignment.dueDate)}</span>
                    </div>
                  </div>
                  <h4 className="text-4xl font-black uppercase italic tracking-tighter leading-none group-hover:text-orange-700 transition-all">{assignment.title}</h4>
                  <p className="text-sm font-bold text-gray-500 italic line-clamp-2">{assignment.description}</p>
                </div>
                <div className="mt-10 pt-8 border-t-4 border-black flex justify-between items-center">
                  <span className="text-2xl font-black">{assignment.points} Points</span>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setEditingAssignment(assignment);
                        setIsCreatingAssignment(true);
                      }} 
                      className="w-12 h-12 bg-orange-50 border-4 border-black rounded-xl text-orange-600 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all"
                    >
                      ✏️
                    </button>
                    <button onClick={() => handleDeleteAssignment(assignment.id)} className="w-12 h-12 bg-rose-50 border-4 border-black rounded-xl text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : activeTab === 'submissions' ? (
        <div className="space-y-10">
          <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none text-green-900">Assignment Submissions.</h2>
          {assignments.map(assignment => (
            <div key={assignment.id} className="bg-white p-10 rounded-[4rem] border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-3xl font-black uppercase italic">{assignment.title}</h3>
              <div className="flex flex-col mb-6">
                <p className="text-gray-500 font-black uppercase text-sm">{assignment.courseCode} - Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                <p className="text-blue-500 font-black uppercase text-xs tracking-widest">{getEthiopianDateString(assignment.dueDate)}</p>
              </div>
              
              <div className="space-y-4">
                {submissions[assignment.id]?.length > 0 ? (
                  submissions[assignment.id].map(sub => (
                    <div key={sub.id} className="flex flex-col">
                      <div className="bg-gray-50 p-6 rounded-2xl border-4 border-black flex justify-between items-center">
                        <div>
                          <p className="font-black text-xl">{sub.studentName}</p>
                          <p className="text-xs text-gray-500 font-black uppercase tracking-widest">{new Date(sub.submittedAt).toLocaleString()}</p>
                          {sub.status === 'graded' && (
                            <p className="text-sm font-black text-green-600 uppercase mt-2 flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              Grade: {sub.grade} / {assignment.points}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-4 items-center">
                          <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all">Download Artifact</a>
                          <button 
                            onClick={() => setGradingSubId(gradingSubId === sub.id ? null : sub.id)}
                            className="bg-black text-white px-6 py-3 rounded-xl font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] hover:translate-y-0.5 transition-all"
                          >
                            {sub.status === 'graded' ? 'Update Grade' : 'Grade Tool'}
                          </button>
                        </div>
                      </div>
                      {gradingSubId === sub.id && (
                        <div className="animate-scaleIn origin-top">
                          <GradingForm 
                            submission={sub} 
                            onSave={async (updatedSub) => {
                              await onUpdateSubmission(updatedSub);
                              // Local update for responsiveness
                              const currentSubmissions = submissions[assignment.id] || [];
                              setSubmissions({
                                ...submissions,
                                [assignment.id]: currentSubmissions.map(s => s.id === updatedSub.id ? updatedSub : s)
                              });

                              // Notify Student about the grade/result
                              if (updatedSub.status === 'graded') {
                                await dbService.createNotification({
                                  userId: updatedSub.studentId,
                                  title: 'Hojii Mannee Qullaraa',
                                  message: `Hojii mannee '${assignment.title}' sirreeffamee jira. Qabxii: ${updatedSub.grade}/${assignment.points}. Galatoomaa!`,
                                  type: 'grade',
                                  isRead: false,
                                  createdAt: new Date().toISOString(),
                                  link: `/assignments/${assignment.id}`
                                });
                              }

                              setGradingSubId(null);
                            }} 
                            onCancel={() => setGradingSubId(null)} 
                          />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-12 border-4 border-dashed border-gray-200 rounded-3xl text-center">
                    <p className="font-black text-gray-400 italic uppercase text-xs tracking-widest">No artifact submissions detected.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'videos' ? (
        <div className="mt-8">
          <VideoGenerator />
        </div>
      ) : activeTab === 'questions' ? (
        <QuestionBankView 
          questions={questionBank}
          onAdd={handleAddQuestionToBank}
          onUpdate={handleUpdateQuestionInBank}
          onDelete={handleDeleteQuestionFromBank}
        />
      ) : activeTab === 'database' ? (
        <div className="space-y-12 animate-fadeIn pb-20">
          <div className="flex justify-between items-center bg-white border-8 border-black p-8 rounded-[3rem] shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]">
             <div>
               <h2 className="text-4xl font-black uppercase italic tracking-tighter text-amber-900">Sovereign Data Intel.</h2>
               <p className="text-amber-600 font-bold mt-2 font-mono uppercase tracking-widest text-xs">Registry Node: {currentUser.name}</p>
             </div>
             <button onClick={() => window.location.reload()} className="bg-black text-white px-8 py-4 rounded-2xl border-4 border-black font-black uppercase text-sm shadow-[6px_6px_0px_0px_rgba(245,158,11,1)] hover:translate-y-1 transition-all">Refresh Sync</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase text-gray-400">Total Exams</p>
              <p className="text-4xl font-black italic">{exams.length}</p>
            </div>
            <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase text-gray-400">Total Courses</p>
              <p className="text-4xl font-black italic">{courses.length}</p>
            </div>
            <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase text-gray-400">Total Assignments</p>
              <p className="text-4xl font-black italic">{assignments.length}</p>
            </div>
          </div>

          <div className="space-y-6">
            {[
              { id: 'exams', data: exams, label: 'Exam Registry (Raw)' },
              { id: 'courses', data: courses, label: 'Course Catalog (Raw)' },
              { id: 'assignments', data: assignments, label: 'Assignment Registry (Raw)' },
              { id: 'submissions', data: Object.values(submissions).flat(), label: 'Global Submissions (Raw)' }
            ].map(col => (
              <details key={col.id} className="group border-8 border-black rounded-[2.5rem] bg-white overflow-hidden shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                <summary className="p-8 cursor-pointer bg-gray-50 flex justify-between items-center font-black uppercase italic list-none hover:bg-amber-50">
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black italic group-open:rotate-90 transition-transform">→</div>
                    <span className="text-2xl tracking-tighter">{col.label}</span>
                  </div>
                  <span className="bg-black text-white px-5 py-2 rounded-xl text-xs font-black">{col.data.length} RECORDS</span>
                </summary>
                <div className="p-8 bg-gray-100 border-t-8 border-black font-mono text-[10px] overflow-auto max-h-[500px]">
                  <pre className="whitespace-pre-wrap break-all">{JSON.stringify(col.data, null, 2)}</pre>
                </div>
              </details>
            ))}
          </div>
        </div>
      ) : null}

      {/* COURSE CREATION MODAL */}
      <AssignmentModal 
        isOpen={isCreatingAssignment} 
        onClose={() => { setIsCreatingAssignment(false); setEditingAssignment(null); }} 
        onSave={handleSaveAssignment} 
        assignment={editingAssignment} 
        courses={courses}
      />

      {isCreatingCourse && (
        <div className="fixed inset-0 z-[6000] bg-white overflow-y-auto p-6 md:p-20 flex flex-col items-center">
          <div className="w-full max-w-6xl space-y-12 py-12">
            <div className="flex justify-between items-center border-b-[10px] border-black pb-10">
              <div className="flex flex-col">
                <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">{editingCourseId ? 'Update Module.' : 'Course Architect.'}</h3>
                <div className="flex gap-4 mt-6">
                  {[1, 2, 3].map(step => (
                    <div key={step} className={`w-12 h-12 rounded-full border-4 border-black flex items-center justify-center font-black text-xl ${courseWizardStep >= step ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>
                      {step}
                    </div>
                  ))}
                  <div className="flex items-center ml-4 text-sm font-black uppercase tracking-widest text-purple-600">
                    {courseWizardStep === 1 && 'Basic Details'}
                    {courseWizardStep === 2 && 'Prerequisites'}
                    {courseWizardStep === 3 && 'Lesson Forge'}
                  </div>
                </div>
              </div>
              <button onClick={() => { setIsCreatingCourse(false); setEditingCourseId(null); setCourseWizardStep(1); }} className="w-20 h-20 bg-rose-50 border-8 border-black rounded-[2.5rem] flex items-center justify-center text-4xl font-black">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-12 rounded-[4rem] border-8 border-black shadow-[25px_25px_0px_0px_rgba(147,51,234,1)]">
              {courseWizardStep === 1 && (
                <>
                  <div className="md:col-span-2 border-b-4 border-black pb-6">
                     <h4 className="text-4xl font-black uppercase italic text-purple-900">Course Identity</h4>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Course Title</label>
                    <input placeholder="Advanced Physics Core" className="w-full p-8 border-4 border-black rounded-[2.5rem] text-3xl font-black outline-none" value={newCourse.title || ''} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Course Code</label>
                    <input placeholder="PHYS-G12-A" className="w-full p-8 border-4 border-black rounded-[2.5rem] text-3xl font-black outline-none" value={newCourse.code || ''} onChange={e => setNewCourse({...newCourse, code: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Grade Level</label>
                    <select 
                      className="w-full p-8 border-4 border-black rounded-[2.5rem] text-2xl font-black outline-none" 
                      value={newCourse.grade} 
                      onChange={e => {
                        const newGrade = e.target.value as Grade;
                        let newStream = newCourse.stream;
                        if (newGrade === Grade.G9 || newGrade === Grade.G10) {
                          newStream = Stream.GENERAL;
                        }
                        setNewCourse({...newCourse, grade: newGrade, stream: newStream, subject: ''});
                      }}
                    >
                      {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Stream</label>
                    <select 
                      className={`w-full p-8 border-4 border-black rounded-[2.5rem] text-2xl font-black outline-none transition-all ${(newCourse.grade === Grade.G9 || newCourse.grade === Grade.G10) ? 'bg-gray-100 opacity-50 cursor-not-allowed' : ''}`}
                      value={newCourse.stream} 
                      onChange={e => {
                        const newStream = e.target.value as Stream;
                        setNewCourse({...newCourse, stream: newStream, subject: ''});
                      }}
                      disabled={newCourse.grade === Grade.G9 || newCourse.grade === Grade.G10}
                    >
                      {Object.values(Stream).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Subject</label>
                    <select className="w-full p-8 border-4 border-black rounded-[2.5rem] text-2xl font-black outline-none" value={newCourse.subject} onChange={e => setNewCourse({...newCourse, subject: e.target.value})}>
                      {getSubjectsBySelection(newCourse.grade as Grade, newCourse.stream as Stream).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Education Level</label>
                    <select className="w-full p-8 border-4 border-black rounded-[2.5rem] text-2xl font-black outline-none" value={newCourse.level} onChange={e => setNewCourse({...newCourse, level: e.target.value as EducationLevel})}>
                      {Object.values(EducationLevel).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Description</label>
                    <textarea placeholder="Comprehensive guide to..." className="w-full p-8 border-4 border-black rounded-[2.5rem] text-xl font-black outline-none h-32" value={newCourse.description || ''} onChange={e => setNewCourse({...newCourse, description: e.target.value})} />
                  </div>
                </>
              )}

              {courseWizardStep === 2 && (
                <>
                  <div className="md:col-span-2 border-b-4 border-black pb-6">
                     <h4 className="text-4xl font-black uppercase italic text-purple-900">Prerequisites</h4>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Select Prerequisite Courses</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courses.filter(c => c.id !== editingCourseId).map(course => (
                        <label key={course.id} className="flex items-center gap-4 p-6 bg-gray-50 border-4 border-black rounded-2xl cursor-pointer hover:bg-purple-50 transition-all">
                          <input 
                            type="checkbox" 
                            className="w-6 h-6 border-4 border-black rounded"
                            checked={newCourse.prerequisites?.includes(course.code)}
                            onChange={(e) => {
                              const currentPrereqs = newCourse.prerequisites || [];
                              if (e.target.checked) {
                                setNewCourse({...newCourse, prerequisites: [...currentPrereqs, course.code]});
                              } else {
                                setNewCourse({...newCourse, prerequisites: currentPrereqs.filter(code => code !== course.code)});
                              }
                            }}
                          />
                          <span className="font-black text-sm">{course.title} ({course.code})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {courseWizardStep === 3 && (
                <>
                  <div className="md:col-span-2 border-b-4 border-black pb-6">
                     <h4 className="text-4xl font-black uppercase italic text-purple-900">Lesson Forge</h4>
                  </div>
                  
                  <div className="md:col-span-2 space-y-8 bg-purple-50 p-10 rounded-[3rem] border-4 border-black">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lesson Title</label>
                        <input className="w-full p-6 border-4 border-black rounded-2xl font-black" value={currentLesson.title} onChange={e => setCurrentLesson({...currentLesson, title: e.target.value})} />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Content Type</label>
                        <select className="w-full p-6 border-4 border-black rounded-2xl font-black" value={currentLesson.contentType} onChange={e => setCurrentLesson({...currentLesson, contentType: e.target.value as 'video' | 'reading' | 'document'})}>
                          <option value="video">Video Stream</option>
                          <option value="reading">Secure PDF</option>
                          <option value="document">Document (PDF/Word/PPT)</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {currentLesson.contentType === 'document' ? 'Upload Lesson Document' : 'Resource URL'}
                        </label>
                        {currentLesson.contentType === 'document' ? (
                          <div className="flex flex-col gap-4">
                            <input 
                              type="file" 
                              accept=".pdf,.doc,.docx,.ppt,.pptx"
                              className="w-full p-6 border-4 border-black rounded-2xl font-black bg-white"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setCurrentLesson({
                                      ...currentLesson,
                                      fileUrl: reader.result as string,
                                      fileName: file.name
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            {currentLesson.fileName && (
                              <p className="text-xs font-black text-blue-600 uppercase">Selected: {currentLesson.fileName}</p>
                            )}
                          </div>
                        ) : (
                          <input className="w-full p-6 border-4 border-black rounded-2xl font-black" placeholder={currentLesson.contentType === 'video' ? 'YouTube URL' : 'PDF URL'} value={currentLesson.contentType === 'video' ? currentLesson.videoUrl : currentLesson.pdfUrl} onChange={e => setCurrentLesson({...currentLesson, [currentLesson.contentType === 'video' ? 'videoUrl' : 'pdfUrl']: e.target.value})} />
                        )}
                      </div>
                      <div className="md:col-span-2 space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lesson Content (Markdown)</label>
                        <textarea className="w-full p-6 border-4 border-black rounded-2xl font-black h-40" value={currentLesson.content} onChange={e => setCurrentLesson({...currentLesson, content: e.target.value})} />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Quiz Complexity</label>
                            <select 
                              className="w-full p-4 border-2 border-black rounded-xl font-bold bg-white text-xs outline-none"
                              value={quizDifficulty}
                              onChange={e => setQuizDifficulty(e.target.value as Difficulty)}
                            >
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Question Architectures</label>
                            <div className="flex flex-wrap gap-2 p-3 border-2 border-black rounded-xl bg-white min-h-[50px]">
                              {['multiple-choice', 'true-false', 'fill-in-the-blank', 'short-answer'].map(type => (
                                <label key={type} className="flex items-center gap-1 font-black uppercase text-[8px] cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={quizQuestionTypes.includes(type as QuestionType)}
                                    onChange={e => {
                                      if (e.target.checked) setQuizQuestionTypes([...quizQuestionTypes, type as QuestionType]);
                                      else if (quizQuestionTypes.length > 1) setQuizQuestionTypes(quizQuestionTypes.filter(t => t !== type));
                                    }}
                                    className="w-3 h-3 accent-black"
                                  />
                                  {type.replace(/-/g, ' ')}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button 
                            onClick={handleGenerateLessonQuiz}
                            disabled={isGeneratingQuiz || !currentLesson.content.trim()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl border-4 border-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all disabled:opacity-50"
                          >
                            {isGeneratingQuiz ? 'Generating...' : '✨ Generate Quiz from Content'}
                          </button>
                        </div>
                      </div>

                      {lessonQuizPreview.length > 0 && (
                        <div className="md:col-span-2 space-y-6 bg-white p-8 rounded-[2rem] border-4 border-black">
                          <div className="flex justify-between items-center border-b-4 border-black pb-4">
                            <h5 className="text-xl font-black uppercase italic text-blue-900">Quiz Preview</h5>
                            <button onClick={() => setLessonQuizPreview([])} className="text-rose-600 font-black uppercase text-xs">Discard</button>
                          </div>
                          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                            {lessonQuizPreview.map((q, idx) => (
                              <div key={idx} className="p-4 bg-gray-50 border-2 border-black rounded-xl">
                                <p className="font-bold text-sm italic">"{q.text}"</p>
                                <p className="text-[10px] font-black text-blue-600 uppercase mt-1">{q.type} • {q.points} Points</p>
                              </div>
                            ))}
                          </div>
                          <button 
                            onClick={addLessonQuiz}
                            className="w-full py-4 bg-black text-white rounded-xl border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 transition-all"
                          >
                            Add {lessonQuizPreview.length} Questions to Lesson
                          </button>
                        </div>
                      )}
                    </div>
                    <button onClick={addLesson} className="w-full py-6 bg-purple-600 text-white rounded-2xl border-4 border-black font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">
                      {editingLessonIndex !== null ? 'Update Lesson' : '＋ Add Lesson to Curriculum'}
                    </button>
                    {editingLessonIndex !== null && (
                      <button onClick={() => { setEditingLessonIndex(null); setCurrentLesson({ title: '', content: '', contentType: 'video', videoUrl: '', pdfUrl: '', fileUrl: '', fileName: '' }); }} className="w-full mt-4 text-rose-600 font-black uppercase text-xs">Cancel Edit</button>
                    )}
                  </div>

                  {newCourse.lessons && newCourse.lessons.length > 0 && (
                    <div className="md:col-span-2 space-y-6">
                      <h5 className="text-2xl font-black uppercase italic">Curriculum Inventory</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {newCourse.lessons.map((l, idx) => (
                          <div key={idx} className="bg-white p-6 rounded-3xl border-4 border-black flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center gap-4 overflow-hidden">
                              <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-black text-xs shrink-0">{idx + 1}</span>
                              <div className="truncate">
                                <p className="font-black italic truncate pr-4">{l.title}</p>
                                <p className="text-[10px] font-bold text-purple-600 uppercase">{l.contentType}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => editLesson(idx)} className="text-purple-600 font-black text-[10px] p-2">EDIT</button>
                              <button onClick={() => {
                                 const ls = [...(newCourse.lessons || [])];
                                 ls.splice(idx, 1);
                                 setNewCourse({...newCourse, lessons: ls});
                              }} className="text-rose-600 font-black text-[10px] p-2">✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {courseWizardStep === 4 && (
                <>
                  <div className="md:col-span-2 border-b-4 border-black pb-6">
                     <h4 className="text-4xl font-black uppercase italic text-purple-900">Syllabus & Resources</h4>
                  </div>
                  
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syllabus (Markdown or URL)</label>
                        <textarea className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none h-40 focus:bg-purple-50" value={newCourse.syllabus} onChange={e => setNewCourse({...newCourse, syllabus: e.target.value})} placeholder="Enter course syllabus or link to PDF..." />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Learning Objectives</label>
                        <div className="flex gap-4">
                          <input className="flex-1 p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-purple-50" value={newObjective} onChange={e => setNewObjective(e.target.value)} placeholder="e.g. Master quantum mechanics" />
                          <button 
                            onClick={() => {
                              if (newObjective) {
                                setNewCourse({...newCourse, learningObjectives: [...(newCourse.learningObjectives || []), newObjective]});
                                setNewObjective('');
                              }
                            }}
                            className="px-8 bg-black text-white rounded-2xl border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          >Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {newCourse.learningObjectives?.map((obj, idx) => (
                            <span key={idx} className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full border-2 border-purple-200 font-black text-xs flex items-center gap-2">
                              {obj}
                              <button onClick={() => setNewCourse({...newCourse, learningObjectives: newCourse.learningObjectives?.filter((_, i) => i !== idx)})} className="hover:text-purple-600">×</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4 p-8 bg-gray-50 border-4 border-black rounded-[3rem]">
                        <h5 className="text-xl font-black uppercase italic">Add Course Material</h5>
                        <div className="space-y-4">
                          <input className="w-full p-4 border-4 border-black rounded-xl font-black" placeholder="Material Title" value={newMaterial.title} onChange={e => setNewMaterial({...newMaterial, title: e.target.value})} />
                          <select className="w-full p-4 border-4 border-black rounded-xl font-black" value={newMaterial.type} onChange={e => setNewMaterial({...newMaterial, type: e.target.value as any})}>
                            <option value="document">Document (PDF/Doc)</option>
                            <option value="video">Video Resource</option>
                            <option value="link">External Link</option>
                            <option value="other">Other Resource</option>
                          </select>
                          <input className="w-full p-4 border-4 border-black rounded-xl font-black" placeholder="Resource URL" value={newMaterial.url} onChange={e => setNewMaterial({...newMaterial, url: e.target.value})} />
                          <button 
                            onClick={() => {
                              if (newMaterial.title && newMaterial.url) {
                                const material: CourseMaterial = {
                                  ...newMaterial as CourseMaterial,
                                  id: `mat-${Date.now()}`,
                                  addedAt: new Date().toISOString()
                                };
                                setNewCourse({...newCourse, materials: [...(newCourse.materials || []), material]});
                                setNewMaterial({ title: '', type: 'document', url: '' });
                              }
                            }}
                            className="w-full py-4 bg-purple-600 text-white rounded-xl border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          >Deploy Material</button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Material Inventory</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {newCourse.materials?.map((mat, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <div>
                                <p className="font-black text-sm">{mat.title}</p>
                                <p className="text-[8px] font-bold text-purple-600 uppercase">{mat.type}</p>
                              </div>
                              <button onClick={() => setNewCourse({...newCourse, materials: newCourse.materials?.filter((_, i) => i !== idx)})} className="text-rose-600 font-black text-xs">REMOVE</button>
                            </div>
                          ))}
                          {(!newCourse.materials || newCourse.materials.length === 0) && <p className="text-center text-xs font-bold text-gray-400 py-4 uppercase">No materials deployed.</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="md:col-span-2 pt-10 flex gap-6">
                {courseWizardStep > 1 && (
                  <button 
                    onClick={() => setCourseWizardStep(prev => prev - 1)}
                    className="flex-1 py-10 bg-gray-100 text-black rounded-[3rem] border-8 border-black font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 transition-all"
                  >
                    ← Back
                  </button>
                )}
                
                {courseWizardStep < 4 ? (
                  <button 
                    onClick={() => setCourseWizardStep(prev => prev + 1)}
                    className="flex-1 py-10 bg-purple-600 text-white rounded-[3rem] border-8 border-black font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 transition-all"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button 
                    onClick={handleSaveCourse}
                    className="flex-1 py-10 bg-black text-white rounded-[3rem] border-8 border-black font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(147,51,234,1)] hover:translate-y-2 transition-all"
                  >
                    {editingCourseId ? 'Synchronize Updates →' : 'Deploy Curriculum Registry →'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 z-[6000] bg-white overflow-y-auto p-6 md:p-20 flex flex-col items-center">
          <div className="w-full max-w-6xl space-y-12 py-12">
            <div className="flex justify-between items-center border-b-[10px] border-black pb-10">
              <div className="flex items-center gap-8">
                <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">{editingExamId ? 'Update Forge.' : 'Exam Forge.'}</h3>
                {newExam.questions && newExam.questions.length > 0 && (
                  <button 
                    onClick={() => setIsPreviewing(true)}
                    className="px-8 py-4 bg-amber-400 border-4 border-black rounded-2xl font-black uppercase text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all"
                  >
                    👁️ Preview Exam
                  </button>
                )}
              </div>
              <button onClick={() => { setIsCreating(false); setEditingExamId(null); }} className="w-20 h-20 bg-rose-50 border-8 border-black rounded-[2.5rem] flex items-center justify-center text-4xl font-black">✕</button>
            </div>

            <div className="flex flex-wrap gap-4">
               <button onClick={() => { setCreationMethod('manual'); setWizardStep(1); }} className={`px-10 py-6 rounded-2xl border-4 border-black font-black uppercase tracking-widest text-sm transition-all ${creationMethod === 'manual' ? 'bg-black text-white' : 'bg-gray-100'}`}>Manual Builder</button>
               <button onClick={() => setCreationMethod('upload')} className={`px-10 py-6 rounded-2xl border-4 border-black font-black uppercase tracking-widest text-sm transition-all ${creationMethod === 'upload' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>Upload Artifact (PDF/Word)</button>
               <button onClick={() => setCreationMethod('ai')} className={`px-10 py-6 rounded-2xl border-4 border-black font-black uppercase tracking-widest text-sm transition-all ${creationMethod === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>AI Intelligence Scan</button>
               <button onClick={() => setCreationMethod('generate')} className={`px-10 py-6 rounded-2xl border-4 border-black font-black uppercase tracking-widest text-sm transition-all ${creationMethod === 'generate' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>AI Generation Hall</button>
            </div>

            {creationMethod === 'upload' && (
              <div className="bg-purple-50 border-8 border-black rounded-[4rem] p-12 space-y-10 animate-fadeIn text-center">
                 <div className="flex flex-col items-center gap-6">
                    <h4 className="text-4xl font-black uppercase italic text-purple-900">National Archive Ingestion</h4>
                    <p className="text-sm font-black text-purple-600 uppercase tracking-widest">Sovereign OCR Engine Ready</p>
                 </div>
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full h-80 border-8 border-dashed border-purple-300 rounded-[4rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-purple-100 transition-all bg-white shadow-inner group"
                 >
                    <div className="text-7xl group-hover:scale-110 transition-transform duration-500">📄</div>
                    <div className="space-y-2">
                       <p className="text-2xl font-black uppercase italic tracking-tighter">Click to Select Artifact</p>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Supports PDF and Word (.docx) formats</p>
                    </div>
                 </div>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept=".pdf,.docx,.txt"
                   onChange={handleFileUpload}
                 />
                 {isScanning && (
                   <div className="py-10 animate-pulse space-y-8">
                      <div className="w-16 h-16 border-[8px] border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-3xl font-black uppercase italic tracking-tighter">Decompiling Document Logic...</p>
                   </div>
                 )}
              </div>
            )}

            {creationMethod === 'ai' && (
              <div className="bg-blue-50 border-8 border-black rounded-[4rem] p-12 space-y-10 animate-fadeIn">
                 <h4 className="text-4xl font-black uppercase italic text-blue-900">AI Subject Scanner</h4>
                 <textarea 
                   placeholder="Paste educational data here for processing..."
                   className="w-full h-80 p-10 bg-white border-4 border-black rounded-[3rem] font-black text-xl outline-none shadow-inner"
                   value={rawText}
                   onChange={e => setRawText(e.target.value)}
                 />
                 <button 
                   onClick={handleAIScan}
                   disabled={isScanning || !rawText.trim()}
                   className="w-full py-10 bg-blue-600 text-white rounded-[3rem] border-8 border-black font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 transition-all disabled:opacity-30"
                 >
                   {isScanning ? 'Synchronizing Lab Logic...' : 'Trigger Structure Extraction'}
                 </button>
              </div>
            )}

            {creationMethod === 'generate' && (
              <div className="bg-green-50 border-8 border-black rounded-[4rem] p-12 space-y-10 animate-fadeIn">
                 <h4 className="text-4xl font-black uppercase italic text-green-900">AI Logic Generator</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Main Subject</label>
                     <input className="w-full p-6 border-4 border-black rounded-2xl font-black outline-none" placeholder="Ex: Physics" value={genSubject} onChange={e => setGenSubject(e.target.value)} />
                   </div>
                   <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Specific Topic</label>
                     <input className="w-full p-6 border-4 border-black rounded-2xl font-black outline-none" placeholder="Ex: Newton's Laws" value={genTopic} onChange={e => setGenTopic(e.target.value)} />
                   </div>
                   <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Question Format</label>
                     <div className="flex flex-wrap gap-4 p-6 border-4 border-black rounded-2xl bg-white">
                        {['multiple-choice', 'true-false', 'fill-in-the-blank', 'short-answer'].map(type => (
                          <label key={type} className="flex items-center gap-2 font-black uppercase text-xs cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={genQuestionTypes.includes(type)}
                              onChange={e => {
                                if (e.target.checked) setGenQuestionTypes([...genQuestionTypes, type]);
                                else setGenQuestionTypes(genQuestionTypes.filter(t => t !== type));
                              }}
                              className="w-5 h-5 accent-black"
                            />
                            {type.replace(/-/g, ' ')}
                          </label>
                        ))}
                     </div>
                     {errors.genTypes && <p className="text-rose-600 text-[10px] font-black uppercase">{errors.genTypes}</p>}
                   </div>
                   <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Difficulty Level</label>
                     <select className="w-full p-6 border-4 border-black rounded-2xl font-black outline-none" value={genDifficulty} onChange={e => setGenDifficulty(e.target.value)}>
                        <option>Introductory</option>
                        <option>Standard</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                        <option>Expert (EAES Prep)</option>
                     </select>
                   </div>
                   <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Unit Count</label>
                     <input type="number" min="1" max="50" className="w-full p-6 border-4 border-black rounded-2xl font-black outline-none" value={genCount} onChange={e => setGenCount(parseInt(e.target.value))} />
                   </div>
                 </div>
                 <button 
                   onClick={handleAIGeneration}
                   disabled={isScanning || !genSubject || !genTopic}
                   className="w-full py-10 bg-green-600 text-white rounded-[3rem] border-8 border-black font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 transition-all disabled:opacity-30"
                 >
                   {isScanning ? 'Synthesizing Educational Artifacts...' : 'Deploy Generative Protocol'}
                 </button>

                 {showGenPreview && (
                    <div className="mt-12 space-y-8 animate-fadeIn">
                       <div className="flex justify-between items-center border-b-4 border-black pb-4">
                          <h5 className="text-3xl font-black uppercase italic text-green-800">Generated Artifacts Preview</h5>
                          <button onClick={() => setShowGenPreview(false)} className="text-rose-600 font-black uppercase text-xs">Discard All</button>
                       </div>
                       <div className="grid grid-cols-1 gap-6">
                          {generatedQuestions.map((q, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                               <div className="flex justify-between items-start mb-4">
                                  <span className="px-3 py-1 bg-green-100 border-2 border-black rounded-lg text-[10px] font-black uppercase">{q.type}</span>
                                  <span className="text-xs font-black text-gray-400 uppercase">{q.points} Points</span>
                               </div>
                               <p className="font-black text-lg mb-4 italic">"{q.text}"</p>
                               {q.options && q.options.length > 0 && (
                                 <div className="grid grid-cols-2 gap-2 mb-4">
                                    {q.options.map((opt, i) => (
                                      <div key={i} className={`p-3 border-2 border-black rounded-xl text-xs font-bold ${i === q.correctAnswer ? 'bg-green-100' : 'bg-gray-50'}`}>
                                         {String.fromCharCode(65 + i)}. {opt}
                                      </div>
                                    ))}
                                 </div>
                               )}
                               {q.type === 'fill-in-the-blank' || q.type === 'short-answer' ? (
                                 <p className="text-xs font-black uppercase text-green-600">Answer: <span className="text-black italic">{q.correctAnswer}</span></p>
                               ) : null}
                            </div>
                          ))}
                       </div>
                       <button 
                         onClick={addGeneratedQuestions}
                         className="w-full py-8 bg-black text-white rounded-[2rem] border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(34,197,94,1)] hover:translate-y-1 transition-all"
                       >
                         Confirm & Integrate into Exam Forge
                       </button>
                    </div>
                  )}
              </div>
            )}

            {creationMethod === 'manual' && (
              <div className="space-y-12 animate-fadeIn">
                {/* WIZARD PROGRESS BAR */}
                <div className="flex items-center justify-between px-10">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className={`w-16 h-16 rounded-full border-4 border-black flex items-center justify-center font-black text-xl transition-all ${wizardStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {step}
                      </div>
                      {step < 3 && (
                        <div className={`flex-1 h-2 mx-4 border-2 border-black rounded-full transition-all ${wizardStep > step ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* STEP 1: BASIC INFO */}
                {wizardStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-12 rounded-[4rem] border-8 border-black shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] animate-fadeIn">
                    <div className="md:col-span-2 border-b-4 border-black pb-6">
                       <h4 className="text-4xl font-black uppercase italic">Step 1: Identity & Parameters</h4>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Exam Title</label>
                      <input placeholder="National Mock Series" className={`w-full p-8 border-4 border-black rounded-[2.5rem] text-3xl font-black outline-none ${errors.title ? 'border-rose-500 bg-rose-50' : ''}`} value={newExam.title || ''} onChange={e => { setNewExam({...newExam, title: e.target.value}); setErrors({...errors, title: ''}); }} />
                      {errors.title && <p className="text-rose-600 text-xs font-black uppercase ml-4">{errors.title}</p>}
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Exam Type</label>
                      <select className="w-full p-8 border-4 border-black rounded-[2.5rem] text-2xl font-black outline-none" value={newExam.type} onChange={e => setNewExam({...newExam, type: e.target.value as ExamType})}>
                        <option value="mid">Mid-Term Exam</option>
                        <option value="final">Final Exam</option>
                        <option value="mock-eaes">Mock EAES Exam</option>
                        <option value="national-eaes">National EAES Certificate</option>
                        <option value="tvet-exit">TVET Exit Exam</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Grade Level</label>
                      <select 
                        className="w-full p-8 border-4 border-black rounded-[2.5rem] text-2xl font-black outline-none" 
                        value={newExam.grade} 
                        onChange={e => {
                          const newGrade = e.target.value as Grade;
                          let newStream = newExam.stream;
                          if (newGrade === Grade.G9 || newGrade === Grade.G10) {
                            newStream = Stream.GENERAL;
                          }
                          setNewExam({...newExam, grade: newGrade, stream: newStream, subject: ''});
                        }}
                      >
                        {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Department / Stream</label>
                      <select 
                        className={`w-full p-8 border-4 border-black rounded-[2.5rem] text-2xl font-black outline-none transition-all ${(newExam.grade === Grade.G9 || newExam.grade === Grade.G10) ? 'bg-gray-100 opacity-50 cursor-not-allowed' : ''}`}
                        value={newExam.stream} 
                        onChange={e => {
                          const newStream = e.target.value as Stream;
                          setNewExam({...newExam, stream: newStream, subject: ''});
                        }}
                        disabled={newExam.grade === Grade.G9 || newExam.grade === Grade.G10}
                      >
                        {Object.values(Stream).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {(newExam.grade === Grade.G9 || newExam.grade === Grade.G10) && (
                        <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest ml-4">General Stream Enforced for JSS/Secondary</p>
                      )}
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Subject (Course)</label>
                      <select 
                        className="w-full p-8 border-4 border-black rounded-[2.5rem] text-2xl font-black outline-none" 
                        value={newExam.subject} 
                        onChange={e => setNewExam({...newExam, subject: e.target.value})}
                      >
                        <option value="">Select Domain Subject</option>
                        {getSubjectsBySelection(newExam.grade as Grade, newExam.stream as Stream).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Semester</label>
                      <select className="w-full p-8 border-4 border-black rounded-[2.5rem] text-2xl font-black outline-none" value={newExam.semester} onChange={e => setNewExam({...newExam, semester: parseInt(e.target.value) as 1 | 2})}>
                        <option value={1}>Semester 1</option>
                        <option value={2}>Semester 2</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Duration (Minutes)</label>
                      <input type="number" className={`w-full p-8 border-4 border-black rounded-[2.5rem] text-3xl font-black outline-none ${errors.duration ? 'border-rose-500 bg-rose-50' : ''}`} value={newExam.durationMinutes || 0} onChange={e => { setNewExam({...newExam, durationMinutes: parseInt(e.target.value) || 0}); setErrors({...errors, duration: ''}); }} />
                      {errors.duration && <p className="text-rose-600 text-xs font-black uppercase ml-4">{errors.duration}</p>}
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Difficulty Level</label>
                      <select className="w-full p-8 border-4 border-black rounded-[2.5rem] text-2xl font-black outline-none" value={newExam.difficulty} onChange={e => setNewExam({...newExam, difficulty: e.target.value as Difficulty})}>
                        <option value="Easy">EASY</option>
                        <option value="Medium">MEDIUM</option>
                        <option value="Hard">HARD</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 pt-10">
                      <button 
                        onClick={() => { if (validateStep1()) setWizardStep(2); }}
                        className="w-full py-10 bg-black text-white rounded-[3rem] border-8 border-black font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(59,130,246,1)] hover:translate-y-2 transition-all"
                      >
                        Proceed to Unit Forge →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: UNIT FORGE */}
                {wizardStep === 2 && (
                  <div className="space-y-12 animate-fadeIn">
                    <div className="bg-white border-8 border-black rounded-[5rem] p-12 md:p-20 space-y-12 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-center border-b-4 border-black pb-8">
            <h4 className="text-5xl font-black uppercase italic">Step 2: Unit Forge</h4>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsExamPickerOpen(true)}
                className="px-6 py-3 bg-indigo-600 text-white border-4 border-black rounded-xl font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all"
              >
                📥 Retrieve from Bank
              </button>
              <span className="text-2xl font-black text-blue-600">{newExam.questions?.length} Items Staged</span>
            </div>
          </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-3 space-y-2">
                          <textarea placeholder="The derivative of sin(x) is..." className={`w-full p-10 border-4 border-black rounded-[3rem] font-black h-32 text-2xl bg-gray-50 outline-none ${errors.qText ? 'border-rose-500' : ''}`} value={currentQuestion.text || ''} onChange={e => { setCurrentQuestion({...currentQuestion, text: e.target.value}); setErrors({...errors, qText: ''}); }} />
                          {errors.qText && <p className="text-rose-600 text-xs font-black uppercase ml-4">{errors.qText}</p>}
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Question Type</label>
                          <select className="w-full p-6 border-4 border-black rounded-2xl font-black" value={currentQuestion.type} onChange={e => setCurrentQuestion({...currentQuestion, type: e.target.value as QuestionType, options: e.target.value === 'fill-in-the-blank' ? [] : (e.target.value === 'true-false' ? ['True', 'False'] : ['', '', '', '']), correctAnswer: e.target.value === 'fill-in-the-blank' ? '' : 0})}>
                            <option value="multiple-choice">Multiple Choice</option>
                            <option value="true-false">True / False</option>
                            <option value="fill-in-the-blank">Fill in the Blank</option>
                          </select>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
                          <input placeholder="Ex: Calculus" className={`w-full p-6 border-4 border-black rounded-2xl font-black ${errors.qCategory ? 'border-rose-500' : ''}`} value={currentQuestion.category || ''} onChange={e => { setCurrentQuestion({...currentQuestion, category: e.target.value}); setErrors({...errors, qCategory: ''}); }} />
                          {errors.qCategory && <p className="text-rose-600 text-[10px] font-black uppercase">{errors.qCategory}</p>}
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Points</label>
                          <input placeholder="Points" type="number" className={`w-full p-6 border-4 border-black rounded-2xl font-black ${errors.qPoints ? 'border-rose-500' : ''}`} value={currentQuestion.points || 0} onChange={e => { setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value) || 0}); setErrors({...errors, qPoints: ''}); }} />
                          {errors.qPoints && <p className="text-rose-600 text-[10px] font-black uppercase">{errors.qPoints}</p>}
                        </div>
                      </div>
                      
                      {currentQuestion.type === 'fill-in-the-blank' ? (
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Correct Answer (Exact Match)</label>
                          <input 
                            placeholder="Type the correct answer" 
                            className={`w-full p-8 border-4 border-black rounded-[2.5rem] text-2xl font-black outline-none bg-green-50 ${errors.qAnswer ? 'border-rose-500' : ''}`}
                            value={currentQuestion.correctAnswer || ''}
                            onChange={e => { setCurrentQuestion({...currentQuestion, correctAnswer: e.target.value}); setErrors({...errors, qAnswer: ''}); }}
                          />
                          {errors.qAnswer && <p className="text-rose-600 text-xs font-black uppercase ml-4">{errors.qAnswer}</p>}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             {currentQuestion.options?.map((opt, i) => (
                               <div key={i} className="relative">
                                 <input 
                                   placeholder={`Option ${String.fromCharCode(65+i)}`}
                                   className={`w-full p-8 border-4 border-black rounded-[2rem] font-black text-xl ${currentQuestion.correctAnswer === i ? 'bg-green-100' : 'bg-white'} ${errors.qOptions ? 'border-rose-500' : ''}`}
                                   value={opt || ''}
                                   onChange={e => {
                                     const opts = [...(currentQuestion.options || [])];
                                     opts[i] = e.target.value;
                                     setCurrentQuestion({...currentQuestion, options: opts});
                                     setErrors({...errors, qOptions: ''});
                                   }}
                                 />
                                 <button 
                                   onClick={() => setCurrentQuestion({...currentQuestion, correctAnswer: i})}
                                   className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-black ${currentQuestion.correctAnswer === i ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
                                 >
                                   {currentQuestion.correctAnswer === i ? '✓' : ''}
                                 </button>
                               </div>
                             ))}
                          </div>
                          {errors.qOptions && <p className="text-rose-600 text-xs font-black uppercase ml-4">{errors.qOptions}</p>}
                        </div>
                      )}
                      <button onClick={addQuestion} className="w-full py-10 bg-black text-white rounded-[3rem] border-8 border-black font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(34,197,94,1)] hover:translate-y-2 transition-all">Lock Unit to Forge</button>
                    </div>

                    {newExam.questions && newExam.questions.length > 0 && (
                      <div className="space-y-6">
                        <h5 className="text-2xl font-black uppercase italic">Staged Units</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {newExam.questions.map((q, idx) => (
                            <div key={idx} className="bg-gray-50 p-6 rounded-3xl border-4 border-black flex justify-between items-center">
                              <p className="font-black italic truncate pr-4">{q.text}</p>
                              <button onClick={() => {
                                 const qs = [...(newExam.questions || [])];
                                 qs.splice(idx, 1);
                                 setNewExam({...newExam, questions: qs});
                                 updateCategories(qs);
                              }} className="text-rose-600 font-black">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-6">
                      <button onClick={() => setWizardStep(1)} className="flex-1 py-10 bg-gray-100 border-8 border-black rounded-[3rem] font-black uppercase text-3xl hover:bg-gray-200 transition-all">← Back</button>
                      <button 
                        onClick={() => setWizardStep(3)} 
                        disabled={!newExam.questions?.length}
                        className="flex-[2] py-10 bg-blue-600 text-white border-8 border-black rounded-[3rem] font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 transition-all disabled:opacity-30"
                      >
                        Review & Finalize →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: REVIEW */}
                {wizardStep === 3 && (
                  <div className="bg-white border-8 border-black rounded-[4rem] p-12 md:p-20 space-y-12 shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] animate-fadeIn">
                    <div className="border-b-4 border-black pb-6">
                       <h4 className="text-4xl font-black uppercase italic">Step 3: Final Review</h4>
                    </div>

                    {serverErrors.length > 0 && (
                      <div className="bg-rose-50 border-8 border-rose-600 p-10 rounded-[3rem] space-y-6">
                        <h5 className="text-rose-600 text-2xl font-black uppercase italic tracking-tighter">Sovereign Validation Failures:</h5>
                        <ul className="space-y-3">
                          {serverErrors.map((err, i) => (
                            <li key={i} className="text-rose-800 font-bold text-lg flex items-start gap-3">
                              <span className="text-rose-600">⚠</span> {err}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      <div className="bg-blue-50 p-8 rounded-3xl border-4 border-black">
                        <p className="text-[10px] font-black uppercase text-blue-600 mb-2">Title</p>
                        <p className="text-2xl font-black italic">{newExam.title}</p>
                      </div>
                      <div className="bg-green-50 p-8 rounded-3xl border-4 border-black">
                        <p className="text-[10px] font-black uppercase text-green-600 mb-2">Subject</p>
                        <p className="text-2xl font-black italic">{newExam.subject}</p>
                      </div>
                      <div className="bg-purple-50 p-8 rounded-3xl border-4 border-black">
                        <p className="text-[10px] font-black uppercase text-purple-600 mb-2">Parameters</p>
                        <p className="text-2xl font-black italic">{newExam.grade} // {newExam.durationMinutes}m</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h5 className="text-2xl font-black uppercase italic">Inventory Summary</h5>
                      <div className="bg-gray-50 p-10 rounded-[3rem] border-4 border-black">
                        <div className="flex justify-between items-center mb-8">
                          <span className="text-4xl font-black">{newExam.questions?.length} Total Units</span>
                          <span className="text-4xl font-black text-blue-600">{newExam.totalPoints} Points</span>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {newExam.categories?.map(cat => (
                            <span key={cat} className="bg-white px-6 py-2 rounded-full border-2 border-black font-black uppercase text-xs">{cat}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 pt-10">
                      <button onClick={() => setWizardStep(2)} className="flex-1 py-10 bg-gray-100 border-8 border-black rounded-[3rem] font-black uppercase text-3xl hover:bg-gray-200 transition-all">← Edit Units</button>
                      <button 
                        onClick={handleSaveExam} 
                        disabled={isValidating}
                        className="flex-[2] py-16 bg-blue-700 text-white rounded-[5rem] border-[10px] border-black font-black uppercase text-3xl md:text-5xl shadow-[30px_30px_0px_0px_rgba(239,51,64,1)] hover:translate-y-4 transition-all disabled:opacity-50"
                      >
                        {isValidating ? 'Validating...' : editingExamId ? 'Sync Updates' : 'Deploy Registry'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isExamPickerOpen && (
        <ExamQuestionPicker 
          bank={questionBank}
          onClose={() => setIsExamPickerOpen(false)}
          onSelect={(qs) => {
            const formattedQs = qs.map((q, idx) => ({ ...q, id: `bank-${Date.now()}-${idx}` }));
            const updatedQuestions = [...(newExam.questions || []), ...formattedQs];
            setNewExam(prev => ({
              ...prev,
              questions: updatedQuestions,
              totalPoints: (prev.totalPoints || 0) + formattedQs.reduce((sum, item) => sum + item.points, 0)
            }));
            updateCategories(updatedQuestions);
            setIsExamPickerOpen(false);
          }}
        />
      )}

      {isPreviewing && (
        <PreviewExamModal 
          exam={newExam}
          currentUser={currentUser}
          onClose={() => setIsPreviewing(false)}
          onConfirm={() => {
            setIsPreviewing(false);
            handleSaveExam();
          }}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
