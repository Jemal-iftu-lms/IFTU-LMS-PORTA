
import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Bookmark, Lock, Play, Download, FileText, Sparkles } from 'lucide-react';
import { Course, Stream, Language } from '../types';
import { NATIONAL_CENTER_INFO } from '../constants';

interface CourseCardProps {
  course: Course;
  onClick: (course: Course) => void;
  completedLessonIds?: string[];
  completedCourseIds?: string[];
  userRole?: 'student' | 'teacher' | 'admin' | 'content_creator' | 'teaching_assistant' | 'guest_user';
  language?: Language;
  isEnrolled?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  onClick, 
  completedLessonIds = [], 
  completedCourseIds = [],
  userRole,
  language = 'en',
  isEnrolled = false
}) => {
  const totalLessons = course.lessons.length || 0;
  const completedInCourse = course.lessons.filter(l => completedLessonIds.includes(l.id)).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedInCourse / totalLessons) * 100) : 0;
  const isFullyCompleted = progressPercent === 100;

  // SOVEREIGN BYPASS: Admin never gets locked out
  const isAdmin = userRole === 'admin';
  const hasPrereqs = course.prerequisites && course.prerequisites.length > 0;
  const prereqsMet = hasPrereqs ? course.prerequisites!.every(preReqId => completedCourseIds.includes(preReqId)) : true;
  
  const isLocked = !isAdmin && !prereqsMet;

  // Stream-based branding
  const branding = {
    [Stream.NATURAL_SCIENCE]: { color: '#3b82f6', bg: 'bg-blue-50', shadow: 'rgba(59, 130, 246, 1)', label: 'STEM', accent: 'text-blue-600' },
    [Stream.SOCIAL_SCIENCE]: { color: '#ffcd00', bg: 'bg-yellow-50', shadow: 'rgba(255, 205, 0, 1)', label: 'SOCIAL', accent: 'text-yellow-600' },
    [Stream.GENERAL]: { color: '#009b44', bg: 'bg-green-50', shadow: 'rgba(0, 155, 68, 1)', label: 'CORE', accent: 'text-green-600' }
  }[course.stream] || { color: '#000000', bg: 'bg-gray-50', shadow: 'rgba(0, 0, 0, 1)', label: 'GENERAL', accent: 'text-black' };

  const handleDownloadSyllabus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const syllabusContent = `
      ${NATIONAL_CENTER_INFO.name}
      OFFICIAL COURSE SYLLABUS: ${course.title}
      CODE: ${course.code}
      INSTRUCTOR: ${course.instructor}
      
      DESCRIPTION:
      ${course.description}
      
      MODULES:
      ${course.lessons.map((l, i) => `${i + 1}. ${l.title} (${l.duration})`).join('\n      ')}
      
      This document is a certified digital artifact of the IFTU National Registry.
      Authorized by: ${NATIONAL_CENTER_INFO.authorizedBy}
    `;
    
    const blob = new Blob([syllabusContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${course.code}_Syllabus.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCacheCourse = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('caches' in window)) {
      alert("Offline caching is not supported in this browser.");
      return;
    }

    try {
      const cache = await caches.open('iftu-lms-courses');
      const urlsToCache = [
        course.thumbnail,
        ...(course.lessons.map(l => l.videoUrl).filter(Boolean) as string[]),
        ...(course.lessons.map(l => l.pdfUrl).filter(Boolean) as string[]),
      ];
      
      await cache.addAll(urlsToCache);
      alert(`${course.title} cached for offline access!`);
    } catch (error) {
      console.error("Caching failed:", error);
      alert("Failed to cache some course materials. Check your connection.");
    }
  };

  const handleCardClick = () => {
    if (isLocked) {
      alert(`Access Denied: Prerequisite required. Consult Admin for override.`);
      return;
    }
    onClick(course);
  };

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercent / 100) * circumference;

  return (
    <motion.div 
      whileHover={!isLocked ? { scale: 1.02, x: -4, y: -4 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      onClick={handleCardClick}
      className={`group relative bg-white rounded-[3.5rem] border-8 border-black overflow-hidden transition-all cursor-pointer ${isLocked ? 'grayscale opacity-75' : ''}`}
      style={{ boxShadow: !isLocked ? `12px 12px 0px 0px ${branding.shadow}` : 'none' }}
    >
      {/* Visual Status Indicators */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
        {isFullyCompleted && (
          <div className="bg-green-500 text-white px-4 py-2 rounded-2xl border-4 border-black font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2">
             <Sparkles size={14} />
             Mastered
          </div>
        )}
        {isEnrolled && !isFullyCompleted && (
          <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl border-4 border-black font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2">
             <Bookmark size={14} fill="white" />
             Enrolled
          </div>
        )}
        {isAdmin && (
          <div className="bg-black text-white px-4 py-2 rounded-2xl border-2 border-yellow-400 font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2">
            <span className="text-yellow-400 animate-pulse">●</span>
            Sovereign
          </div>
        )}
      </div>

      {/* Locked Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full border-4 border-white mb-4 flex items-center justify-center">
            <Lock size={40} strokeWidth={3} />
          </div>
          <p className="font-black uppercase tracking-widest text-sm">Module Restricted</p>
          <p className="text-[10px] font-bold opacity-70 mt-2 italic">Requires Mastery of Prerequisites</p>
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative h-60 border-b-8 border-black bg-gray-100 overflow-hidden">
        <img 
          src={course.thumbnail} 
          alt={course.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/40 transition-colors" />
        
        <div className="absolute bottom-6 left-6 flex items-center gap-3">
          <span className="bg-black text-white px-4 py-2 rounded-xl border-2 border-white text-[10px] font-black uppercase tracking-widest shadow-xl">
            {course.code}
          </span>
          <span className="bg-white text-black px-4 py-2 rounded-xl border-4 border-black text-[10px] font-black uppercase tracking-widest shadow-lg">
            G-{course.grade}
          </span>
        </div>
        
        {/* Progress Orbit */}
        <div className="absolute -bottom-12 right-8 z-10 w-24 h-24 bg-white border-8 border-black rounded-full flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform duration-500">
           <svg className="w-20 h-20 transform -rotate-90">
             <circle cx="40" cy="40" r={radius} stroke="#f3f4f6" strokeWidth="10" fill="transparent" />
             <motion.circle 
               cx="40" cy="40" r={radius} 
               stroke={branding.color} strokeWidth="10" fill="transparent" 
               strokeDasharray={circumference}
               initial={{ strokeDashoffset: circumference }}
               animate={{ strokeDashoffset: offset }}
               transition={{ duration: 1.5, ease: "easeOut" }}
               strokeLinecap="round"
             />
           </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isFullyCompleted ? (
                <CheckCircle2 size={24} className="text-green-600" />
              ) : (
                <>
                  <span className="text-sm font-black italic">{progressPercent}%</span>
                  <span className="text-[7px] font-black uppercase tracking-tighter text-gray-400 font-mono">Trace</span>
                </>
              )}
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 pt-16 space-y-6">
        <div className="space-y-3">
          <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-[0.85] group-hover:text-blue-600 transition-colors">
            {course.title}
          </h3>
          <div className="h-1.5 w-16 bg-black group-hover:w-32 transition-all duration-500" />
        </div>

        <p className="text-sm font-bold text-gray-500 line-clamp-2 italic leading-tight uppercase tracking-tight">
          {course.description}
        </p>

        <div className="flex items-center justify-between pt-6 border-t-8 border-black/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl border-4 border-black overflow-hidden bg-gray-50 shadow-md transform group-hover:rotate-6 transition-transform">
              <img src={course.instructorPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${course.instructor}`} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="leading-none">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 italic">Mentor</p>
              <p className="text-xs font-black uppercase italic">{course.instructor}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCacheCourse}
                title="Download for Offline"
                className="bg-blue-50 border-4 border-black p-2 rounded-xl hover:bg-blue-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
              >
                <Download size={18} strokeWidth={3} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDownloadSyllabus}
                className="bg-white border-4 border-black px-4 py-2 rounded-xl font-black uppercase text-[10px] hover:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none flex items-center gap-2"
              >
                <FileText size={14} strokeWidth={3} />
                Syllabus
              </motion.button>
            </div>
            <div className={`px-5 py-2 rounded-[1.25rem] border-4 border-black font-black uppercase text-[10px] tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 ${branding.bg}`}>
               <div className={`w-2 h-2 rounded-full ${branding.accent} bg-current`} />
               {branding.label}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Corner Trace */}
      {!isLocked && (
        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <Play size={16} fill="black" className="animate-pulse" />
        </div>
      )}
    </motion.div>
  );
};

export default CourseCard;
