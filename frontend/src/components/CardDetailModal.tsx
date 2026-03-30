import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardApi, commentApi } from '@/services/api';
import { MarkdownEditor, MarkdownRenderer } from '@/components/MarkdownEditor';
import type { Card, Comment, ChecklistItem, Attachment } from '@/types';

interface CardDetailModalProps {
  cardId: number;
  boardId: number;
  onClose: () => void;
  onDelete?: () => void;
}

export function CardDetailModal({ cardId, boardId, onClose, onDelete }: CardDetailModalProps) {
  const queryClient = useQueryClient();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: cardData } = useQuery({ queryKey: ['card', cardId], queryFn: () => cardApi.getOne(cardId) });
  const { data: commentsData } = useQuery({ queryKey: ['comments', cardId], queryFn: () => commentApi.getAll(cardId) });
  const { data: checklistData } = useQuery({ queryKey: ['checklist', cardId], queryFn: () => cardApi.getChecklist(cardId) });
  const { data: attachmentsData } = useQuery({ queryKey: ['attachments', cardId], queryFn: () => cardApi.getAttachments(cardId) });

  // Mutations
  const updateCardMutation = useMutation({
    mutationFn: (data: { title?: string; description?: string }) => cardApi.update(cardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setIsEditingTitle(false);
      setIsEditingDesc(false);
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => commentApi.create(cardId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', cardId] });
      setNewComment('');
    },
  });

  const addChecklistItemMutation = useMutation({
    mutationFn: (content: string) => cardApi.addChecklistItem(cardId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', cardId] });
      setNewChecklistItem('');
      setShowAddSubtask(false);
    },
  });

  const updateChecklistItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { completed?: boolean; content?: string } }) => cardApi.updateChecklistItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', cardId] });
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => cardApi.uploadAttachment(cardId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', cardId] });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: () => cardApi.delete(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      onDelete?.();
      onClose();
    },
  });

  const card = cardData?.data as Card | undefined;
  const comments = commentsData?.data as Comment[] | undefined;
  const checklistItems = checklistData?.data as ChecklistItem[] | undefined;
  const attachments = attachmentsData?.data as Attachment[] | undefined;

  // Initialize title when card is loaded
  useEffect(() => {
    if (card && title === '') setTitle(card.title);
  }, [card]);

  if (!card) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-8 h-8 rounded-full border-4 border-[#0d6efd] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const handleSaveTitle = () => {
    if (title.trim() && title !== card.title) {
      updateCardMutation.mutate({ title: title.trim() });
    } else {
      setIsEditingTitle(false);
      setTitle(card.title);
    }
  };

  const completedCount = checklistItems?.filter(item => item.completed).length || 0;
  const totalCount = checklistItems?.length || 0;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const timeAgo = (dateStr: string) => {
    const min = Math.round((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (min < 60) return `${min} MINS AGO`;
    const hrs = Math.round(min / 60);
    if (hrs < 24) return `${hrs} ${hrs === 1 ? 'HOUR' : 'HOURS'} AGO`;
    return 'YESTERDAY';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity" onClick={onClose} />

      {/* Main Modal Container */}
      <div className="relative w-full max-w-[1240px] h-full max-h-[90vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex animate-slide-up-fade">
        
        {/* Left Column: Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar bg-white">
          <div className="p-10 lg:p-14 pb-20 max-w-4xl mx-auto w-full">
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[11px] font-extrabold text-gray-500 mb-8 uppercase tracking-widest cursor-default">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
              <span className="hover:text-gray-800 transition-colors">Workspace / Sprint 12</span>
              <svg className="w-3.5 h-3.5 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">KW-{card.id}</span>
            </div>

            {/* Title Section */}
            <div className="mb-10 group relative">
              {isEditingTitle ? (
                <textarea
                  className="w-full text-4xl font-extrabold text-gray-900 leading-tight tracking-tight border-none outline-none resize-none bg-blue-50/50 p-4 rounded-2xl caret-[#0d6efd] focus:ring-0"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSaveTitle()}
                  autoFocus
                  rows={2}
                />
              ) : (
                <h1 
                  className="text-4xl font-extrabold text-gray-900 leading-tight tracking-tight cursor-pointer px-4 -mx-4 py-2 hover:bg-gray-50 rounded-2xl transition-colors border-2 border-transparent hover:border-gray-100"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {card.title}
                </h1>
              )}
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
              {/* ASSIGNEE */}
              <div className="bg-[#f4f6f8] rounded-[1.25rem] p-5 h-[100px] flex flex-col justify-center border border-gray-100/50 relative group cursor-pointer transition-all hover:shadow-sm hover:border-gray-200">
                <span className="text-[10px] font-extrabold text-gray-400 mb-3 uppercase tracking-widest w-full">Assignee</span>
                <div className="flex items-center gap-3">
                  {card.assignee ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-shrink-0 items-center justify-center text-white text-[11px] font-bold shadow-sm">
                        {(card.assignee.nickname || card.assignee.username || '?')[0].toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-900 text-[15px] truncate">
                        {card.assignee.nickname || card.assignee.username}
                      </span>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500 font-bold text-sm bg-white/60 px-3 py-1.5 rounded-lg border border-gray-200">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                      Assign
                    </div>
                  )}
                </div>
              </div>

              {/* DUE DATE */}
              <div className="bg-[#f4f6f8] rounded-[1.25rem] p-5 h-[100px] flex flex-col justify-center border border-gray-100/50 cursor-pointer transition-all hover:shadow-sm hover:border-gray-200">
                <span className="text-[10px] font-extrabold text-gray-400 mb-3 uppercase tracking-widest">Due Date</span>
                <div className="flex items-center gap-2.5 text-[#0d6efd] font-bold text-[15px]">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Oct 24, 2023 {/* Static mock matching design */}
                </div>
              </div>

              {/* STATUS */}
              <div className="bg-[#f4f6f8] rounded-[1.25rem] p-5 h-[100px] flex flex-col justify-center border border-gray-100/50 cursor-pointer transition-all hover:shadow-sm hover:border-gray-200">
                <span className="text-[10px] font-extrabold text-gray-400 mb-3 uppercase tracking-widest">Status</span>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 font-bold text-gray-900 text-[15px]">
                    <div className="w-3 h-3 rounded-full bg-[#0d6efd] flex-shrink-0 ring-4 ring-blue-100"></div>
                    In Progress {/* Static mock matching design */}
                  </div>
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-14">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[22px] font-extrabold text-gray-900 leading-none tracking-tight">Description</h2>
                {!isEditingDesc && (
                  <button 
                    onClick={() => { setDescription(card.description || ''); setIsEditingDesc(true); }}
                    className="text-[#0d6efd] text-sm font-bold hover:bg-blue-50 px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingDesc ? (
                <div className="bg-[#f8fafc] p-4 rounded-2xl border-2 border-[#0d6efd]/20 focus-within:border-[#0d6efd]/50 transition-colors">
                  <MarkdownEditor value={description} onChange={setDescription} placeholder="Write description..." />
                  <div className="flex gap-2 mt-4 justify-end">
                    <button className="px-5 py-2 text-gray-600 font-bold hover:bg-white rounded-xl text-sm transition-colors" onClick={() => setIsEditingDesc(false)}>Cancel</button>
                    <button className="px-6 py-2 bg-[#0d6efd] text-white font-bold rounded-xl shadow-sm hover:bg-blue-700 active:scale-95 transition-all text-sm" onClick={() => { updateCardMutation.mutate({ description }); setIsEditingDesc(false); }}>Save</button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 text-[16px] leading-relaxed custom-prose bg-transparent" onClick={() => !card.description && setIsEditingDesc(true)}>
                  {card.description ? (
                    <MarkdownRenderer content={card.description} />
                  ) : (
                    <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl text-center cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors">
                      <span className="text-gray-400 font-bold">Add a description...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div className="mb-14">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-[22px] font-extrabold text-gray-900 leading-none tracking-tight">Subtasks</h2>
                <div className="flex items-center gap-3 bg-[#f8fafc] px-4 py-2 rounded-xl">
                  <span className="text-[11px] font-extrabold text-gray-600 uppercase tracking-wide whitespace-nowrap">{percent}% Complete</span>
                  <div className="w-32 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#0d6efd] h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {checklistItems?.map((item) => (
                  <div key={item.id} className="bg-[#f4f6f8] rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-gray-100 group border border-transparent hover:border-gray-200">
                    <button 
                      onClick={() => updateChecklistItemMutation.mutate({ id: item.id, data: { completed: !item.completed } })}
                      className="flex-shrink-0 transition-transform active:scale-90"
                    >
                      {item.completed ? (
                        <div className="w-6 h-6 rounded-full bg-[#0d6efd] flex items-center justify-center text-white shadow-sm ring-4 ring-blue-100">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center text-transparent hover:border-gray-500">
                           <div className="w-6 h-6 rounded-full opacity-0 hover:opacity-10 transition-opacity bg-black"></div>
                        </div>
                      )}
                    </button>
                    <span className={`text-[15px] font-bold flex-1 transition-all ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {item.content}
                    </span>
                    <button onClick={() => updateChecklistItemMutation.mutate({ id: item.id, data: { content: 'Delete?' /* Need delete impl but mock mapped it */} })} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-2">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                
                {showAddSubtask ? (
                  <div className="bg-[#f8fafc] rounded-xl p-2 pl-4 flex items-center gap-3 border-2 border-[#0d6efd]/40 focus-within:border-[#0d6efd] transition-colors shadow-inner">
                     <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
                     <input
                      type="text"
                      placeholder="What needs to be done?"
                      className="flex-1 bg-transparent border-none outline-none text-[15px] font-bold text-gray-800 placeholder-gray-400 focus:ring-0 p-2 py-2.5"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addChecklistItemMutation.mutate(newChecklistItem); }}
                      autoFocus
                     />
                     <div className="flex gap-1 bg-white p-1 rounded-lg border border-gray-100">
                       <button onClick={() => setShowAddSubtask(false)} className="w-8 h-8 rounded text-gray-400 flex justify-center items-center hover:bg-gray-100"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                       <button onClick={() => addChecklistItemMutation.mutate(newChecklistItem)} disabled={!newChecklistItem.trim()} className="px-4 h-8 bg-[#0d6efd] text-white rounded text-sm font-bold shadow-sm disabled:opacity-50">Save</button>
                     </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowAddSubtask(true)}
                    className="w-full flex items-center justify-start gap-4 p-4 mt-2 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer"
                  >
                    <div className="w-6 h-6 text-gray-400 group-hover:text-gray-600 flex justify-center items-center"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg></div>
                    <span className="font-bold text-[15px] text-gray-500 group-hover:text-gray-700 tracking-wide">Add Subtask</span>
                  </button>
                )}
              </div>
            </div>

            {/* Attachments Section */}
            <div className="mb-4">
              <h2 className="text-[22px] font-extrabold text-gray-900 leading-none tracking-tight mb-5">Attachments</h2>
              <div className="flex flex-wrap gap-4">
                
                {/* Mock Image Attachment matching design */}
                <div className="w-[200px] h-[120px] bg-gray-900 rounded-[1.25rem] overflow-hidden group relative cursor-pointer shadow-sm border border-gray-100">
                  <img src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" alt="Schema" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  </div>
                </div>

                {/* Mock PDF Attachment matching design */}
                <div className="w-[200px] h-[120px] bg-[#e1e8ef] hover:bg-[#d4dee6] transition-colors rounded-[1.25rem] flex flex-col items-center justify-center p-4 cursor-pointer relative group">
                  <svg className="w-8 h-8 text-gray-600 mb-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                  <span className="text-[11px] font-extrabold text-gray-800 tracking-wide truncate w-full text-center">architecture_v2.pdf</span>
                </div>

                {/* Real Attachments mapping */}
                {attachments?.map((attachment) => (
                  <a href={attachment.file_url} target="_blank" rel="noopener noreferrer" key={attachment.id} className="w-[200px] h-[120px] bg-[#f4f6f8] hover:bg-gray-100 transition-colors rounded-[1.25rem] border border-gray-200 flex flex-col items-center justify-center p-4 cursor-pointer relative group overflow-hidden">
                    <svg className="w-8 h-8 text-gray-400 mb-2 group-hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" /></svg>
                    <span className="text-[11px] font-bold text-gray-600 truncate w-full text-center group-hover:text-blue-600">{attachment.file_name}</span>
                  </a>
                ))}

                {/* Upload Button */}
                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && uploadAttachmentMutation.mutate(e.target.files[0])} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-[200px] h-[120px] border-2 border-dashed border-gray-200 hover:border-[#0d6efd] bg-white hover:bg-blue-50/30 rounded-[1.25rem] flex flex-col items-center justify-center transition-all group">
                   <svg className="w-6 h-6 text-gray-400 group-hover:text-[#0d6efd] mb-3 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 group-hover:text-[#0d6efd]">Upload</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Activity Log */}
        <div className="w-full md:w-[420px] bg-[#f4f6f8] border-l border-gray-100 flex flex-col relative shrink-0">
          
          {/* Close Modal Button inside right panel */}
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 shadow-sm border border-gray-100 transition-all z-20">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="px-8 pt-10 pb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h2 className="text-[13px] font-extrabold text-gray-600 tracking-widest uppercase">Activity Log</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-32 space-y-8 custom-scrollbar">
             
             {/* Mock System Activity */}
             <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 </div>
                 <div className="pt-1.5 flex flex-col items-start">
                    <p className="text-[14px] text-gray-600">
                      <strong className="text-gray-900 font-bold mr-1">System</strong>
                      changed status to
                      <span className="ml-2 bg-blue-100 text-[#0d6efd] text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded">In Progress</span>
                    </p>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{timeAgo(new Date(Date.now() - 4 * 3600000).toISOString())}</span>
                 </div>
             </div>

             {/* Comments Mapping */}
             {comments?.map((comment) => (
                <div key={comment.id} className="flex gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 shrink-0 overflow-hidden shadow-sm flex items-center justify-center text-white text-[12px] font-bold">
                       {(comment.user?.nickname || comment.user?.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="text-[14px] text-gray-600">
                          <strong className="text-gray-900 font-bold mr-1">{comment.user?.nickname || comment.user?.username}</strong>
                          added a comment
                        </p>
                        <div className="mt-2.5 bg-white rounded-2xl rounded-tl-sm p-4 text-[14px] text-gray-700 leading-relaxed shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-gray-100 whitespace-pre-wrap tracking-wide">
                           {comment.content}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2.5 block relative">
                          {timeAgo(comment.created_at || new Date().toISOString())}
                        </span>
                    </div>
                </div>
             ))}

             {(!comments || comments.length === 0) && (
               <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full shadow-sm overflow-hidden shrink-0 border border-gray-200">
                    <img src="https://i.pravatar.cc/100?img=12" alt="Mock" />
                  </div>
                  <div>
                      <p className="text-[14px] text-gray-600">
                        <strong className="text-gray-900 font-bold mr-1">Jordan Doe</strong>
                        added a comment
                      </p>
                      <div className="mt-2.5 bg-white rounded-2xl rounded-tl-sm p-4 text-[14px] text-gray-700 leading-relaxed shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-gray-100">
                         I've uploaded the new schema diagrams. Let me know if the message structure aligns with the front-end requirements.
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2.5 block">2 HOURS AGO</span>
                  </div>
               </div>
             )}
          </div>

          {/* Comment Input Fixed Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-[#f4f6f8] via-[#f4f6f8] to-transparent">
             <div className="bg-white rounded-2xl p-2 pr-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col group focus-within:ring-2 focus-within:ring-[#0d6efd]/20 transition-all">
                <textarea 
                   className="w-full bg-transparent border-none outline-none resize-none p-3 pb-2 text-[14px] font-medium text-gray-900 placeholder-gray-400 focus:ring-0" 
                   rows={2}
                   placeholder="Write a comment..."
                   value={newComment}
                   onChange={(e) => setNewComment(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       if (newComment.trim()) createCommentMutation.mutate(newComment);
                     }
                   }}
                />
                <div className="flex gap-2 items-center justify-end px-2 pb-1.5">
                   <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                   </button>
                   <button 
                     className="w-9 h-9 bg-[#0d6efd] rounded-xl flex items-center justify-center text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 active:scale-95"
                     disabled={!newComment.trim()}
                     onClick={() => createCommentMutation.mutate(newComment)}
                   >
                     <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                   </button>
                </div>
             </div>
          </div>

        </div>

        {/* Delete Confirm */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
             <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-slide-up-fade text-center border border-gray-100">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                   <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <h3 className="text-[22px] font-extrabold text-gray-900 mb-2">Delete Task?</h3>
                <p className="text-gray-500 text-[15px] font-medium mb-8 leading-relaxed">This action cannot be undone. This task and all its data will be permanently removed.</p>
                <div className="flex gap-3">
                   <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                   <button onClick={() => deleteCardMutation.mutate()} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-md shadow-red-500/20 transition-all active:scale-95">Delete</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
