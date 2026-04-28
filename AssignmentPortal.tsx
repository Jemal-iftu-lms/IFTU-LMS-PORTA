import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Clock, CheckCircle2, AlertCircle, Upload, 
  Search, Filter, ChevronRight, Download, Send, 
  Award, MessageSquare, ExternalLink, Trash2, Edit3
} from 'lucide-react';
import { User, Assignment, AssignmentSubmission, Course } from '../types';
import { dbService } from '../services/dbService';

interface AssignmentPortalProps {
  currentUser: User;
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  courses: Course[];
}

export const AssignmentPortal: React.FC<AssignmentPortalProps> = ({ 
  currentUser, 
  assignments, 
  submissions,
  courses
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'submitted' | 'graded' | 'resubmit'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Student Helpers
  const getSubmissionForAssignment = (assignmentId: string) => {
    return submissions.find(s => s.assignmentId === assignmentId && s.studentId === currentUser.id);
  };

  // Teacher Helpers
  const getSubmissionsForAssignment = (assignmentId: string) => {
    return submissions.filter(s => s.assignmentId === assignmentId);
  };

  const getPendingSubmissionsCount = (assignmentId: string) => {
    return submissions.filter(s => s.assignmentId === assignmentId && s.status === 'submitted').length;
  };

  const stats = useMemo(() => {
    if (currentUser.role === 'student') {
      const studentSubs = submissions.filter(s => s.studentId === currentUser.id);
      return {
        total: assignments.length,
        submitted: studentSubs.length,
        graded: studentSubs.filter(s => s.status === 'graded').length,
        resubmit: studentSubs.filter(s => s.status === 'resubmission_required').length,
        pending: assignments.length - studentSubs.filter(s => s.status === 'submitted' || s.status === 'graded').length
      };
    } else {
      return {
        total: assignments.length,
        totalSubmissions: submissions.length,
        pendingGrading: submissions.filter(s => s.status === 'submitted').length,
        resubmitRequested: submissions.filter(s => s.status === 'resubmission_required').length,
        published: assignments.filter(a => a.status === 'published').length
      };
    }
  }, [assignments, submissions, currentUser]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            a.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (currentUser.role === 'student') {
        const sub = getSubmissionForAssignment(a.id);
        if (activeTab === 'pending') return !sub || sub.status === 'resubmission_required';
        if (activeTab === 'submitted') return sub && sub.status === 'submitted';
        if (activeTab === 'graded') return sub && sub.status === 'graded';
        if (activeTab === 'resubmit') return sub && sub.status === 'resubmission_required';
      } else {
        const teacherSubs = getSubmissionsForAssignment(a.id);
        if (activeTab === 'pending') return teacherSubs.some(s => s.status === 'submitted');
        if (activeTab === 'submitted') return teacherSubs.length > 0;
        if (activeTab === 'graded') return teacherSubs.some(s => s.status === 'graded');
        if (activeTab === 'resubmit') return teacherSubs.some(s => s.status === 'resubmission_required');
      }

      return true;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [assignments, searchTerm, activeTab, currentUser, submissions]);

  const handleFileSubmit = async (assignment: Assignment, file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const fileUrl = await dbService.uploadSubmissionFile(assignment.id, currentUser.id, file);
      
      const submission: AssignmentSubmission = {
        id: `${assignment.id}_${currentUser.id}`,
        assignmentId: assignment.id,
        studentId: currentUser.id,
        studentName: currentUser.name,
        submittedAt: new Date().toISOString(),
        fileUrl: fileUrl,
        status: 'submitted'
      };

      await dbService.syncSubmission(submission);
      
      // Notify Teacher/Instructor
      const course = courses.find(c => c.code === assignment.courseCode);
      const recipientId = course?.instructorId || 'admin';
      
      await dbService.createNotification({
        userId: recipientId,
        title: 'Payload Transmitted',
        message: `Student ${currentUser.name} uploaded '${file.name}' for '${assignment.title}'.`,
        type: 'submission',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: `/teacher/assignments/${assignment.id}`
      });
      
      setIsSubmitModalOpen(false);
      setSelectedAssignment(null);
    } catch (error) {
      console.error("Submission failed:", error);
      setUploadError("Deployment of work failed. Please check your connectivity and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGrading = async (submission: AssignmentSubmission, grade: number, feedback: string, status: 'graded' | 'resubmission_required' = 'graded') => {
    const updatedSubmission: AssignmentSubmission = {
      ...submission,
      grade,
      feedback,
      status,
      gradedBy: currentUser.name,
      gradedAt: new Date().toISOString()
    };

    try {
      await dbService.syncSubmission(updatedSubmission);
      
      // Notify Student
      const assignment = assignments.find(a => a.id === submission.assignmentId);
      const isResubmit = status === 'resubmission_required';
      
      await dbService.createNotification({
        userId: submission.studentId,
        title: isResubmit ? 'Resubmission Requested' : 'Assignment Graded',
        message: isResubmit 
          ? `Updates required for '${assignment?.title}'. Feedback: ${feedback}`
          : `Assignment '${assignment?.title}' has been graded. Score: ${grade}/${assignment?.points}.`,
        type: isResubmit ? 'assignment' : 'grade',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: `/assignments/${submission.assignmentId}`
      });
      
      setIsGradeModalOpen(false);
      setSelectedSubmission(null);
    } catch (error) {
      console.error("Grading failed:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none">
            Assignment <br /> <span className="text-blue-600">Portal.</span>
          </h1>
          <p className="text-xl font-bold text-gray-500 uppercase tracking-widest">
            {currentUser.role === 'student' ? 'Manage your academic deliverables' : 'Review and facilitate student growth'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 w-full md:w-auto">
          {currentUser.role === 'student' ? (
            <>
              <StatCard label="Total" value={stats.total} color="bg-blue-50" />
              <StatCard label="Submitted" value={stats.submitted} color="bg-green-50" />
              <StatCard label="Graded" value={stats.graded} color="bg-purple-50" />
              <StatCard label="Resubmit" value={stats.resubmit} color="bg-rose-50" />
              <StatCard label="Pending" value={stats.pending} color="bg-gray-50" />
            </>
          ) : (
            <>
              <StatCard label="Assignments" value={stats.total} color="bg-blue-50" />
              <StatCard label="Submissions" value={stats.totalSubmissions} color="bg-green-50" />
              <StatCard label="Pending Grade" value={stats.pendingGrading} color="bg-rose-50" />
              <StatCard label="Resubmit Requests" value={stats.resubmitRequested} color="bg-orange-50" />
              <StatCard label="Published" value={stats.published} color="bg-purple-50" />
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-8 border-black rounded-[3rem] p-8 flex flex-col md:flex-row gap-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search assignments or codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-6 bg-gray-50 border-4 border-black rounded-3xl font-black uppercase text-sm tracking-widest outline-none focus:bg-white transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4 bg-gray-100 p-3 rounded-3xl border-4 border-black overflow-x-auto">
          {['all', 'pending', 'submitted', 'graded', 'resubmit'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
                activeTab === tab ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]' : 'text-gray-400 hover:text-black'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredAssignments.map((assignment) => {
            const submission = getSubmissionForAssignment(assignment.id);
            const teacherSubs = getSubmissionsForAssignment(assignment.id);
            
            return (
              <motion.div
                key={assignment.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-white border-8 border-black rounded-[3rem] overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] transition-all flex flex-col"
              >
                <div className="p-8 space-y-6 flex-1">
                  <div className="flex justify-between items-start">
                    <span className="px-4 py-2 bg-blue-100 border-2 border-black rounded-xl font-black text-[10px] uppercase tracking-widest">
                      {assignment.courseCode}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  </div>

                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">
                    {assignment.title}
                  </h3>

                  <p className="text-gray-500 font-bold line-clamp-2 text-sm">
                    {assignment.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border-4 border-black">
                      <div className="text-[8px] font-black uppercase text-gray-400 mb-1">Max Points</div>
                      <div className="text-xl font-black italic">{assignment.points}</div>
                    </div>
                    {currentUser.role === 'student' ? (
                      <div className={`p-4 rounded-2xl border-4 border-black ${
                        submission?.status === 'graded' ? 'bg-green-50' : 
                        submission?.status === 'resubmission_required' ? 'bg-rose-50' :
                        submission ? 'bg-blue-50' : 'bg-gray-50'
                      }`}>
                        <div className="text-[8px] font-black uppercase text-gray-400 mb-1 font-sans">Status</div>
                        <div className="text-[10px] font-black uppercase italic">
                          {submission ? submission.status.replace('_', ' ') : 'Pending'}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 p-4 rounded-2xl border-4 border-black font-sans">
                        <div className="text-[8px] font-black uppercase text-gray-400 mb-1">Submissions</div>
                        <div className="text-xl font-black italic">{teacherSubs.length}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-8 bg-gray-50 border-t-8 border-black font-sans">
                  {currentUser.role === 'student' ? (
                    submission?.status === 'graded' ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-400 rounded-lg border-2 border-black flex items-center justify-center text-xl">🏆</div>
                          <div>
                            <div className="text-[8px] font-black uppercase text-gray-400">Final Grade</div>
                            <div className="text-lg font-black">{submission.grade}/{assignment.points}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => { setSelectedSubmission(submission); setIsGradeModalOpen(true); }}
                          className="px-6 py-2 bg-white border-2 border-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                        >
                          View Feedback
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setSelectedAssignment(assignment); setIsSubmitModalOpen(true); }}
                        className={`w-full py-4 rounded-2xl border-4 border-black font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 ${
                          submission ? 'bg-blue-400 text-white' : 'bg-yellow-400 text-black'
                        }`}
                      >
                        {submission ? <Edit3 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                        {submission ? 'Update Submission' : 'Deploy Work'}
                      </button>
                    )
                  ) : (
                    <button 
                      onClick={() => { setSelectedAssignment(assignment); setIsGradeModalOpen(true); }}
                      className="w-full py-4 bg-black text-white rounded-2xl border-4 border-black font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3"
                    >
                      <FileText className="w-4 h-4" />
                      Manage Submissions
                      {getPendingSubmissionsCount(assignment.id) > 0 && (
                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse ml-2" />
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Student Submission Modal */}
      {isSubmitModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-white border-8 border-black rounded-[4rem] overflow-hidden shadow-[20px_20px_0px_0px_rgba(59,130,246,1)]"
          >
            <div className="p-10 md:p-14 space-y-10">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">
                    Submit <br /> Work.
                  </h3>
                  <div className="flex items-center gap-3 px-4 py-2 bg-blue-100 border-2 border-black rounded-xl">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-black uppercase">{selectedAssignment.title}</span>
                  </div>
                </div>
                <button onClick={() => setIsSubmitModalOpen(false)} className="w-12 h-12 bg-gray-100 rounded-xl border-4 border-black flex items-center justify-center text-2xl hover:bg-rose-100 transition-colors">✕</button>
              </div>

              <div className="bg-gray-50 border-4 border-black p-8 rounded-3xl space-y-6">
                <h4 className="text-xl font-black uppercase italic text-gray-400">Technical Brief</h4>
                <p className="text-lg leading-relaxed">{selectedAssignment.description}</p>
                <div className="flex justify-between items-center text-[10px] font-black uppercase border-t-2 border-black/10 pt-4">
                  <span>Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}</span>
                  <span>Payload Weight: {selectedAssignment.points} KP</span>
                </div>
              </div>

              <div className="space-y-6">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">File Transmission Protocol</label>
                <div className="relative">
                  <input 
                    type="file" 
                    id="assignment-file"
                    className="hidden"
                    onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) handleFileSubmit(selectedAssignment, file);
                    }}
                    accept=".pdf,.docx,.doc,.ppt,.pptx"
                  />
                  <label 
                    htmlFor="assignment-file"
                    className={`w-full flex flex-col items-center justify-center gap-6 p-12 border-8 border-dashed border-black rounded-[3rem] cursor-pointer hover:bg-blue-50 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {isUploading ? (
                      <div className="animate-spin text-blue-600">
                        <Upload size={48} />
                      </div>
                    ) : (
                      <Upload size={48} className="text-gray-400" />
                    )}
                    <div className="text-center space-y-2">
                       <p className="text-xl font-black uppercase italic">
                        {isUploading ? 'Transmitting Data...' : 'Select Deployment File'}
                       </p>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Supported: PDF, DOCX, PPTX (MAX 25MB)</p>
                    </div>
                  </label>
                </div>
                {uploadError && (
                  <div className="p-4 bg-rose-50 border-4 border-rose-600 text-rose-600 rounded-2xl font-black text-xs flex items-center gap-3">
                    <AlertCircle size={16} />
                    {uploadError}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-10 bg-gray-50 border-t-8 border-black flex justify-end">
              <button 
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-10 py-4 bg-white border-4 border-black rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-black hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
              >
                Abort Mission
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Teacher Grading Modal */}
      {isGradeModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-4xl bg-white border-8 border-black rounded-[4rem] overflow-hidden shadow-[20px_20px_0px_0px_rgba(147,51,234,1)] flex flex-col max-h-[90vh]"
          >
            <div className="p-10 md:p-14 border-b-8 border-black">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">
                    Review <br /> Submissions.
                  </h3>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{selectedAssignment.title}</p>
                </div>
                <button onClick={() => setIsGradeModalOpen(false)} className="w-12 h-12 bg-gray-100 rounded-xl border-4 border-black flex items-center justify-center text-2xl hover:bg-rose-100 transition-colors">✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 md:p-14 space-y-8 custom-scrollbar">
              {currentUser.role === 'student' ? (
                // Feedback View for Student
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-green-50 border-8 border-black p-10 rounded-[3rem] text-center space-y-4">
                      <div className="text-6xl">🎯</div>
                      <h4 className="text-2xl font-black uppercase italic">Score Index</h4>
                      <div className="text-7xl font-black text-green-700 tabular-nums">
                        {selectedSubmission?.grade || 0}
                        <span className="text-2xl text-black/20 ml-2">/ {selectedAssignment.points}</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 border-8 border-black p-10 rounded-[3rem] space-y-4 font-sans">
                       <h4 className="text-2xl font-black uppercase italic flex items-center gap-3">
                          <MessageSquare className="w-6 h-6" />
                          Educator Insights
                       </h4>
                       <p className="text-lg italic leading-relaxed text-blue-900">
                          "{selectedSubmission?.feedback || 'No feedback provided yet. Keep pushing the boundaries of knowledge.'}"
                       </p>
                    </div>
                  </div>
                  
                  <div className="bg-black text-white p-8 rounded-3xl space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Payload Metadata</div>
                    <div className="flex justify-between items-center text-xs">
                      <span>Evaluated By: {selectedSubmission?.gradedBy || 'N/A'}</span>
                      <span>Date: {selectedSubmission?.gradedAt ? new Date(selectedSubmission.gradedAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                // Submission List View for Teacher
                <div className="space-y-6">
                  {getSubmissionsForAssignment(selectedAssignment.id).length === 0 ? (
                    <div className="p-20 text-center space-y-4 opacity-30">
                       <Upload className="w-20 h-20 mx-auto" strokeWidth={1} />
                       <p className="text-xl font-black uppercase">No Data Transmissions Received</p>
                    </div>
                  ) : (
                    getSubmissionsForAssignment(selectedAssignment.id).map(sub => (
                      <div key={sub.id} className="bg-white border-4 border-black rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-gray-100 rounded-2xl border-4 border-black flex items-center justify-center text-3xl font-sans">
                             👤
                           </div>
                           <div>
                             <h5 className="text-xl font-black uppercase italic truncate max-w-[200px]">{sub.studentName}</h5>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Submitted {new Date(sub.submittedAt).toLocaleDateString()}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                           <a 
                             href={sub.fileUrl} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex-1 md:flex-none px-6 py-3 bg-blue-100 text-blue-700 border-2 border-black rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                           >
                             <Download className="w-3 h-3" />
                             Review Work
                           </a>
                           {sub.status === 'graded' ? (
                             <div className="px-6 py-3 bg-green-100 text-green-700 border-2 border-black rounded-xl font-black uppercase text-[10px] tracking-widest">
                                Grade: {sub.grade}
                             </div>
                           ) : (
                             <button 
                               onClick={() => setSelectedSubmission(sub)}
                               className="flex-1 md:flex-none px-6 py-3 bg-yellow-400 border-2 border-black rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                             >
                               Assign Grade
                             </button>
                           )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Grading Form for Teacher (overlay) */}
              {currentUser.role !== 'student' && selectedSubmission && (
                <div className="mt-12 bg-purple-50 border-4 border-black rounded-[2.5rem] p-10 space-y-8 animate-slideUp">
                  <div className="flex justify-between items-start">
                    <h4 className="text-3xl font-black uppercase italic tracking-tighter">Evaluation: {selectedSubmission.studentName}</h4>
                    <button onClick={() => setSelectedSubmission(null)} className="font-black text-rose-600 hover:scale-110 transition-transform">CANCEL</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Final KP Score (Max {selectedAssignment.points})</label>
                        <input 
                          type="number" 
                          max={selectedAssignment.points}
                          min={0}
                          defaultValue={selectedSubmission.grade}
                          className="w-full p-6 border-4 border-black rounded-2xl font-black text-3xl outline-none focus:bg-white transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                              setSelectedSubmission({ ...selectedSubmission, grade: val });
                            }
                          }}
                        />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Educator Feedback</label>
                        <textarea 
                          placeholder="Provide constructive insights for the student..."
                          defaultValue={selectedSubmission.feedback}
                          className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-white transition-all h-32 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                          onBlur={(e) => setSelectedSubmission({ ...selectedSubmission, feedback: e.target.value })}
                        />
                     </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => handleGrading(selectedSubmission, selectedSubmission.grade || 0, selectedSubmission.feedback || '')}
                      className="flex-1 py-6 bg-purple-600 text-white rounded-2xl border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-4"
                    >
                      <Send className="w-5 h-5" />
                      Finalize & Notify
                    </button>
                    <button 
                      onClick={() => handleGrading(selectedSubmission, 0, selectedSubmission.feedback || '', 'resubmission_required')}
                      className="px-8 py-6 bg-rose-500 text-white rounded-2xl border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-4"
                    >
                      <AlertCircle className="w-5 h-5" />
                      Resubmit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number | string; color: string }> = ({ label, value, color }) => (
  <div className={`${color} border-4 border-black p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-sans`}>
    <div className="text-[8px] font-black uppercase text-gray-400 mb-1 tracking-widest">{label}</div>
    <div className="text-3xl font-black italic tabular-nums leading-none">{value}</div>
  </div>
);
