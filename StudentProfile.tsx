import React, { useState, useRef } from 'react';
import { User, Badge, AcademicRecord, Course, ExamResult } from '../types';
import { db, storage } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { 
  Upload, Save, User as UserIcon, Award, BookOpen, BarChart2, FileText, 
  ChevronRight, Trash2, ExternalLink, Calendar, GraduationCap, MapPin, 
  Mail, Phone, ShieldCheck, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

interface StudentProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  allCourses: Course[];
  examResults: ExamResult[];
}

const StudentProfile: React.FC<StudentProfileProps> = ({ user, onUpdateUser, allCourses, examResults }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(user);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'achievements' | 'records'>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completedCourses = allCourses.filter(c => user.completedCourses?.includes(c.id));

  // Prepare chart data
  const chartData = examResults
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .map(res => ({
      date: new Date(res.completedAt).toLocaleDateString(),
      score: (res.score / res.totalPoints) * 100,
      label: res.examId.substring(0, 8)
    }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      setUploadProgress(0);
      
      const storageRef = ref(storage, `academic_records/${user.id}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Error uploading record:", error);
          setUploading(false);
          setUploadProgress(0);
        }, 
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          
          const newRecord: AcademicRecord = {
            id: Date.now().toString(),
            name: file.name,
            url,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            size: file.size
          };

          const userRef = doc(db, 'users', user.id);
          await updateDoc(userRef, {
            academicRecords: arrayUnion(newRecord)
          });

          const updatedUser = {
            ...user,
            academicRecords: [...(user.academicRecords || []), newRecord]
          };
          onUpdateUser(updatedUser);
          setFormData(updatedUser);
          setUploading(false);
          setUploadProgress(0);
        }
      );
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    const updatedRecords = user.academicRecords?.filter(r => r.id !== recordId) || [];
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { academicRecords: updatedRecords });
      const updatedUser = { ...user, academicRecords: updatedRecords };
      onUpdateUser(updatedUser);
      setFormData(updatedUser);
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  const handleSave = async () => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { ...formData });
      onUpdateUser(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      {/* Identity Header */}
      <div className="bg-white border-8 border-black rounded-[4rem] p-10 md:p-16 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col md:flex-row gap-12 items-center">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <span className="font-black text-9xl">IF</span>
        </div>
        
        <div className="relative group">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-[10px] border-black overflow-hidden shadow-[10px_10px_0px_0px_rgba(59,130,246,1)] group-hover:scale-105 transition-transform duration-500">
            <img src={user.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} className="w-full h-full object-cover" alt={user.name} />
          </div>
          <div className="absolute -bottom-4 right-4 w-16 h-16 bg-yellow-400 border-4 border-black rounded-2xl flex items-center justify-center text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce-slow">
            ⚡
          </div>
        </div>

        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="space-y-2">
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
              <span className="px-4 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full">Sovereign Identity</span>
              <span className="px-4 py-1 bg-blue-100 text-blue-600 border-2 border-black text-[10px] font-black uppercase tracking-widest rounded-full">Rank #{user.sovereignIndex || '??'}</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">{user.name}</h1>
            <p className="text-2xl font-black text-gray-400 uppercase italic">ID: {user.studentIdNumber || 'IFTU-SEC-UNK'}</p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 border-2 border-black rounded-xl flex items-center justify-center text-xl">🏆</div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400">Knowledge Points</p>
                <p className="text-xl font-black">{user.points} KP</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 border-2 border-black rounded-xl flex items-center justify-center text-xl">🎓</div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400">Education Level</p>
                <p className="text-xl font-black">{user.level || 'Secondary'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`px-10 py-6 ${isEditing ? 'bg-rose-600' : 'bg-black'} text-white border-4 border-black rounded-[2rem] font-black uppercase italic text-xl shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 transition-all flex items-center gap-4`}
          >
            {isEditing ? 'Discard Changes' : 'Update Profile'}
          </button>
          {isEditing && (
            <button 
              onClick={handleSave}
              className="px-10 py-6 bg-green-600 text-white border-4 border-black rounded-[2rem] font-black uppercase italic text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all flex items-center gap-4"
            >
              <Save /> Commit Data
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {[
          { id: 'overview', icon: BarChart2, label: 'Performance Matrix' },
          { id: 'academics', icon: BookOpen, label: 'Knowledge Trace' },
          { id: 'achievements', icon: Award, label: 'Vault of Medals' },
          { id: 'records', icon: FileText, label: 'Sovereign Records' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-4 px-8 py-5 rounded-[2rem] border-4 border-black font-black uppercase italic transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-y-1' : 'bg-white hover:bg-gray-50'}`}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white border-8 border-black rounded-[5rem] p-12 md:p-20 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]"
        >
          {activeTab === 'overview' && (
            <div className="space-y-16">
              <div className="flex justify-between items-center border-b-4 border-black pb-8">
                <h3 className="text-4xl font-black uppercase italic">Performance Analytics</h3>
                <div className="flex gap-4">
                  <span className="px-4 py-2 bg-blue-50 border-2 border-black rounded-xl text-xs font-black">N = {examResults.length} SESSIONS</span>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="date" stroke="#000" fontSize={12} fontWeight="bold" />
                      <YAxis stroke="#000" fontSize={12} fontWeight="bold" domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '4px solid black', 
                          borderRadius: '1rem',
                          fontWeight: 'bold'
                        }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={6} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-6 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem]">
                  <BarChart2 size={64} className="text-slate-300" />
                  <p className="text-2xl font-black uppercase italic text-slate-400">No Assessment Data Found</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-blue-50 border-4 border-black rounded-[3rem] space-y-4">
                  <h4 className="text-xl font-black uppercase italic">Identity Verification</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { icon: Mail, label: 'Primary Email', value: user.email },
                      { icon: Phone, label: 'Contact Node', value: user.phoneNumber || 'NOT_CONNECTED' },
                      { icon: MapPin, label: 'Locality', value: user.address || user.school || 'Unmapped' },
                      { icon: Calendar, label: 'Date of Birth', value: user.dob || 'Unknown' },
                      { icon: UserIcon, label: 'Gender', value: user.gender || 'Unknown' },
                      { icon: ShieldCheck, label: 'Security State', value: 'REGISTRY_LOCKED' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <item.icon size={18} className="text-blue-500" />
                        <div>
                          <p className="text-[8px] font-black uppercase text-gray-400">{item.label}</p>
                          <p className="font-black italic">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {isEditing && (
                  <div className="p-8 bg-yellow-50 border-4 border-black rounded-[3rem] space-y-4">
                    <h4 className="text-xl font-black uppercase italic">Mutation Core</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Display Name</label>
                        <input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-4 border-4 border-black rounded-2xl font-black text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Student ID Number</label>
                        <input name="studentIdNumber" value={formData.studentIdNumber || ''} onChange={handleInputChange} className="w-full p-4 border-4 border-black rounded-2xl font-black text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Date of Birth</label>
                        <input type="date" name="dob" value={formData.dob || ''} onChange={handleInputChange} className="w-full p-4 border-4 border-black rounded-2xl font-black text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Gender</label>
                        <select name="gender" value={formData.gender || ''} onChange={handleInputChange} className="w-full p-4 border-4 border-black rounded-2xl font-black text-sm">
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Phone Link</label>
                        <input name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleInputChange} className="w-full p-4 border-4 border-black rounded-2xl font-black text-sm" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'academics' && (
            <div className="space-y-12">
              <div className="flex justify-between items-center border-b-4 border-black pb-8">
                <h3 className="text-4xl font-black uppercase italic">Completed Curricula</h3>
                <span className="px-4 py-2 bg-black text-white rounded-xl text-xs font-black">{completedCourses.length} Artifacts Collected</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {completedCourses.map(course => (
                  <div key={course.id} className="p-8 bg-gray-50 border-4 border-black rounded-[3rem] flex gap-6 hover:translate-x-2 transition-all">
                    <div className="w-24 h-24 shrink-0 border-4 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <img src={course.thumbnail} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-2xl font-black uppercase italic leading-none">{course.title}</h4>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{course.code} • {course.subject}</p>
                      <div className="flex items-center gap-2 pt-2">
                        <div className="h-2 flex-1 bg-gray-200 border-2 border-black rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-full"></div>
                        </div>
                        <span className="text-[10px] font-black uppercase">100%</span>
                      </div>
                    </div>
                  </div>
                ))}
                {completedCourses.length === 0 && (
                   <div className="md:col-span-2 py-32 text-center bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] space-y-6">
                     <BookOpen size={48} className="mx-auto text-slate-300" />
                     <p className="text-2xl font-black uppercase italic text-slate-400">No Courses Completed Yet</p>
                   </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-12">
              <div className="flex justify-between items-center border-b-4 border-black pb-8">
                <h3 className="text-4xl font-black uppercase italic">Vault of Achievements</h3>
                <span className="px-4 py-2 bg-yellow-400 border-2 border-black rounded-xl text-xs font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">GLORY TRACE</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {user.badges?.map(badge => (
                  <div key={badge.id} className="group aspect-square p-8 bg-white border-8 border-black rounded-[3rem] flex flex-col items-center justify-center text-center shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-yellow-50 hover:-translate-y-2 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
                    <span className="text-6xl mb-4 group-hover:scale-125 transition-transform duration-500">{badge.icon}</span>
                    <h4 className="text-sm font-black uppercase italic leading-tight">{badge.title}</h4>
                    <p className="text-[8px] font-black text-gray-400 uppercase mt-2">{new Date(badge.earnedAt).getFullYear()}</p>
                  </div>
                ))}
                {(!user.badges || user.badges.length === 0) && (
                   <div className="col-span-full py-32 text-center bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] space-y-6">
                     <Award size={48} className="mx-auto text-slate-300" />
                     <p className="text-2xl font-black uppercase italic text-slate-400">Vault Currently Empty</p>
                   </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-4 border-black pb-8">
                <div>
                  <h3 className="text-4xl font-black uppercase italic">Sovereign Registry</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Permanent Academic Archiving System</p>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-10 py-5 bg-blue-600 text-white border-4 border-black rounded-2xl font-black uppercase italic text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all flex items-center gap-4 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="animate-spin" /> : <Upload />} {uploading ? `INGESTING (${Math.round(uploadProgress)}%)...` : 'Archive New Record'}
                </button>
                {uploading && (
                  <div className="w-full max-w-md mt-4">
                    <div className="h-4 bg-gray-100 border-4 border-black rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-blue-600"
                      />
                    </div>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              </div>

              <div className="grid grid-cols-1 gap-6">
                {(user.academicRecords || []).map(record => (
                  <div key={record.id} className="p-8 bg-gray-50 border-4 border-black rounded-[3rem] flex flex-col md:flex-row justify-between items-center gap-8 group hover:bg-white transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[10px_10px_0px_0px_rgba(59,130,246,1)]">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white border-4 border-black rounded-2xl flex items-center justify-center text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <FileText />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-2xl font-black italic">{record.name}</h4>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                          {new Date(record.uploadedAt).toLocaleString()} • {(record.size || 0) / 1024 < 1024 ? `${((record.size || 0)/1024).toFixed(1)} KB` : `${((record.size || 0)/(1024*1024)).toFixed(1)} MB`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <a 
                        href={record.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-5 bg-white border-4 border-black rounded-2xl hover:bg-blue-50 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
                        title="Decipher/View Record"
                      >
                        <ExternalLink size={24} />
                      </a>
                      <button 
                        onClick={() => handleDeleteRecord(record.id)}
                        className="p-5 bg-rose-50 border-4 border-black text-rose-600 rounded-2xl hover:bg-rose-100 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
                        title="Purge Artifact"
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {(!user.academicRecords || user.academicRecords.length === 0) && (
                   <div className="py-40 text-center bg-slate-50 border-4 border-dashed border-slate-200 rounded-[5rem] space-y-6">
                     <FileText size={48} className="mx-auto text-slate-300" />
                     <p className="text-2xl font-black uppercase italic text-slate-400">No Records Salvaged</p>
                     <p className="text-xs font-black uppercase text-slate-300 max-w-md mx-auto">Upload diplomas, transcripts, or certificates to secure your academic footprint.</p>
                   </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default StudentProfile;
