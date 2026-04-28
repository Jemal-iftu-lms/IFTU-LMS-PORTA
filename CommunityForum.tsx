import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { User } from '../types';
import { MessageSquare, Plus, Search, Tag, User as UserIcon, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Discussion {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

const CommunityForum: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'General' });

  useEffect(() => {
    const unsub = dbService.subscribeToDiscussions(setDiscussions);
    return () => unsub();
  }, []);

  const handlePost = async () => {
    if (!newPost.title || !newPost.content) return;

    const post: Discussion = {
      id: `post_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      title: newPost.title,
      content: newPost.content,
      category: newPost.category,
      createdAt: new Date().toISOString()
    };

    await dbService.createDiscussion(post);
    setIsPosting(false);
    setNewPost({ title: '', content: '', category: 'General' });
  };

  const filteredDiscussions = discussions.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-black uppercase tracking-tighter text-gray-900 leading-none">
              Community<br /><span className="text-blue-600">Discourse</span>
            </h1>
            <p className="text-xl font-bold text-gray-400 uppercase tracking-widest italic">
              Sovereign knowledge exchange portal
            </p>
          </div>
          <button 
            onClick={() => setIsPosting(true)}
            className="group flex items-center gap-4 bg-black text-white px-8 py-6 rounded-[2rem] border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(37,99,235,1)] hover:translate-y-1 hover:shadow-none transition-all"
          >
            <Plus size={24} />
            Initialize Thread
          </button>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={24} />
          <input 
            type="text"
            placeholder="Search intelligence threads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-20 pr-8 py-8 bg-white border-8 border-black rounded-[3rem] font-black uppercase text-xl outline-none shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] focus:shadow-none transition-all"
          />
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {isPosting && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white border-8 border-black rounded-[4rem] p-12 max-w-2xl w-full space-y-8 relative shadow-[20px_20px_0px_0px_rgba(37,99,235,1)]"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-4xl font-black uppercase italic">New Intelligence Thread</h2>
                  <button onClick={() => setIsPosting(false)} className="text-gray-400 hover:text-black">
                     <Plus size={40} className="rotate-45" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Thread Security Title</label>
                    <input 
                      type="text"
                      placeholder="Protocol: Topic Identification"
                      className="w-full p-6 bg-gray-50 border-4 border-black rounded-3xl font-black outline-none focus:bg-white"
                      value={newPost.title}
                      onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Content Deployment</label>
                    <textarea 
                      rows={5}
                      placeholder="Input thread data..."
                      className="w-full p-6 bg-gray-50 border-4 border-black rounded-3xl font-black outline-none focus:bg-white"
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-4">
                    {['General', 'Science', 'Math', 'Language', 'Tech'].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setNewPost({...newPost, category: cat})}
                        className={`px-6 py-3 rounded-full border-4 border-black font-black uppercase text-xs transition-all ${newPost.category === cat ? 'bg-blue-600 text-white' : 'bg-white text-black'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handlePost}
                  className="w-full py-8 bg-black text-white rounded-[2rem] border-4 border-black font-black uppercase text-2xl shadow-[12px_12px_0px_0px_rgba(37,99,235,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-4"
                >
                  <ArrowRight size={32} />
                  Deploy Thread
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thread List */}
        <div className="grid gap-8">
          {filteredDiscussions.map((d, i) => (
            <motion.div 
              key={d.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white border-8 border-black rounded-[3rem] p-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 lg:flex gap-12 transition-all cursor-pointer overflow-hidden relative"
            >
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase border-2 border-black">
                    {d.category}
                  </span>
                  <span className="text-gray-400 text-xs font-black uppercase flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-3xl font-black uppercase group-hover:text-blue-600 transition-colors leading-tight italic">
                  {d.title}
                </h3>
                <p className="text-lg text-gray-600 font-bold line-clamp-2">
                  {d.content}
                </p>
                <div className="flex items-center gap-8 pt-4 border-t-2 border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-xl border-2 border-white flex items-center justify-center text-white font-black italic">
                      {d.authorName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-gray-400">Intelligence Author</div>
                      <div className="text-xs font-black uppercase">{d.authorName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-gray-400">
                    <div className="flex items-center gap-2 font-black text-xs">
                      <MessageSquare size={16} />
                      {/* Placeholder for reply count */}
                      0 Replies
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:flex flex-col justify-center gap-4 bg-gray-50 border-l-8 border-black p-8 -my-10 -mr-10 w-48">
                <div className="text-center">
                   <div className="text-3xl font-black italic text-blue-600">12</div>
                   <div className="text-[10px] font-black uppercase text-gray-400">Views</div>
                </div>
                <div className="text-center">
                   <div className="text-3xl font-black italic text-green-600">5</div>
                   <div className="text-[10px] font-black uppercase text-gray-400">Support</div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredDiscussions.length === 0 && (
            <div className="text-center py-20 border-8 border-dashed border-gray-200 rounded-[4rem]">
              <div className="text-gray-300 mb-6">
                <MessageSquare size={80} className="mx-auto" />
              </div>
              <h3 className="text-2xl font-black uppercase text-gray-400">Zero Intelligence Threads Detected</h3>
              <p className="text-gray-400 font-bold italic mt-2 underline-offset-4 underline decoration-blue-600 decoration-4">Initiate a thread to begin sovereign exchange</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityForum;
