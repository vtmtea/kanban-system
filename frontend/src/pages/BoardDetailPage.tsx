import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardApi, listApi, cardApi } from '@/services/api';
import { CardDetailModal } from '@/components/CardDetailModal';
import { BoardSettingsModal } from '@/components/BoardSettingsModal';
import { ActivitySidebar } from '@/components/ActivitySidebar';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { List, Card } from '@/types';

export function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const boardId = Number(id);

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardApi.getOne(boardId),
  });

  useQuery({
    queryKey: ['board', boardId, 'wip-status'],
    queryFn: () => boardApi.getWipStatus(boardId),
    enabled: !!board?.data,
  });

  useWebSocket({
    boardId,
    enabled: !isLoading && !!board?.data,
  });

  // Local state
  const [newListTitle, setNewListTitle] = useState('');
  const [showAddList, setShowAddList] = useState(false);
  const [newCardTitles, setNewCardTitles] = useState<Record<number, string>>({});
  const [showAddCard, setShowAddCard] = useState<Record<number, boolean>>({});
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [draggedCard, setDraggedCard] = useState<{ cardId: number; listId: number } | null>(null);
  const [dragOverListId, setDragOverListId] = useState<number | null>(null);
  
  const [showActivity, setShowActivity] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const createListMutation = useMutation({
    mutationFn: (title: string) => listApi.create(boardId, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setNewListTitle('');
      setShowAddList(false);
    },
  });

  const createCardMutation = useMutation({
    mutationFn: ({ listId, title, swimlaneId }: { listId: number; title: string; swimlaneId?: number }) =>
      cardApi.create(listId, { title, swimlane_id: swimlaneId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setNewCardTitles({});
      setShowAddCard({});
    },
  });

  const moveCardMutation = useMutation({
    mutationFn: ({ cardId, listId, position }: { cardId: number; listId: number; position?: number }) =>
      cardApi.move(cardId, { list_id: listId, position }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  const handleAddList = () => {
    if (newListTitle.trim()) {
      createListMutation.mutate(newListTitle.trim());
    }
  };

  const handleAddCard = (listId: number) => {
    const title = newCardTitles[listId];
    if (title?.trim()) {
      createCardMutation.mutate({ listId, title: title.trim() });
    }
  };

  const handleDragStart = (e: React.DragEvent, cardId: number, listId: number) => {
    setDraggedCard({ cardId, listId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId.toString());
  };

  const handleDragOver = (e: React.DragEvent, listId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverListId(listId);
  };

  const handleDragLeave = () => {
    setDragOverListId(null);
  };

  const handleDrop = (e: React.DragEvent, targetListId: number) => {
    e.preventDefault();
    setDragOverListId(null);

    if (draggedCard && draggedCard.listId !== targetListId) {
      moveCardMutation.mutate({
        cardId: draggedCard.cardId,
        listId: targetListId,
      });
    }
    setDraggedCard(null);
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    setDragOverListId(null);
  };

  // SVGs
            
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-[#0d6efd] border-t-transparent animate-spin"></div>
          <div className="text-gray-500 font-semibold tracking-wider text-sm animate-pulse">LOADING WORKSPACE...</div>
        </div>
      </div>
    );
  }

  if (!board?.data) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-red-500">
        Board Not Found
      </div>
    );
  }

  const boardData = board.data;
  const lists = boardData.lists || [];

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-gray-800">
      {/* Sidebar copied from Dashboard */}
      <Sidebar activePage="boards" />

      {/* Main Board Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#fdfdfd] md:rounded-tl-[2rem] border-t border-l border-gray-100/50 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Top Navbar */}
        <TopNav title="Board Details" />

        <div className="flex-1 overflow-x-auto overflow-y-hidden flex flex-col p-8 pt-4 pb-0 bg-white">
          
          {/* Board Header Title & Actions */}
          <div className="flex justify-between items-end mb-8 shrink-0 animate-slide-up-fade">
            <div>
              <div className="flex items-center gap-2 text-[13px] text-gray-500 font-semibold mb-2">
                <span className="hover:text-gray-800 cursor-pointer">Projects</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                <span className="text-gray-800">Kinetic Core V2</span>
              </div>
              <h1 className="text-[28px] font-extrabold text-gray-900 leading-tight tracking-tight">{boardData.title}</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Avatars */}
              <div className="flex -space-x-2 mr-2">
                  <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/100?img=1" alt="Avatar"/>
                  <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/100?img=4" alt="Avatar"/>
                  <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/100?img=5" alt="Avatar"/>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[11px] font-extrabold text-gray-600">+12</div>
              </div>
              <button className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors text-gray-700 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filters
              </button>
              <button className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors text-gray-700 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Due Date
              </button>
              <button onClick={() => setShowAddList(true)} className="px-5 py-2 bg-[#0d6efd] text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm active:scale-95">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Add Column
              </button>
            </div>
          </div>

          {/* Lists Mapping */}
          <div className="flex-1 flex gap-5 overflow-x-auto pb-4 items-start custom-scrollbar h-full">
            {lists.map((list: List, index: number) => {
              const animationDelayClass = `stagger-delay-${Math.min(index + 1, 5)}`;
              
              // Mock Progress for design implementation (based on image features)
              const hasProgress = index === 0 || index === 2;

              return (
                <div
                  key={list.id}
                  className={`bg-[#f4f6f8] rounded-2xl p-4 min-w-[320px] max-w-[320px] flex flex-col max-h-full border transition-all duration-300 animate-slide-up-fade ${animationDelayClass} relative ${
                    dragOverListId === list.id ? 'border-[#0d6efd] shadow-[0_0_0_2px_rgba(13,110,253,0.2)]' : 'border-transparent'
                  }`}
                  onDragOver={(e) => handleDragOver(e, list.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, list.id)}
                >
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-extrabold text-gray-900 text-[16px]">{list.title}</h3>
                      <span className="bg-gray-200/80 text-gray-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                        {list.cards?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Cards inside List */}
                  <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                    {list.cards?.map((card: Card, cIdx: number) => {
                       const isDone = list.title.toLowerCase() === 'done';

                       return (
                        <div
                          key={card.id}
                          className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 cursor-grab active:cursor-grabbing group ${
                            draggedCard?.cardId === card.id ? 'opacity-40 rotate-3 scale-105 shadow-2xl z-50' : ''
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, card.id, list.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedCardId(card.id)}
                        >
                          <div className="flex flex-wrap gap-2 mb-3">
                            {/* Dummy styled pills mapping matching the design exactly */}
                            {card.labels && card.labels.length > 0 ? card.labels.map(l => (
                              <span key={l.id} className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider text-white" style={{backgroundColor: l.color}}>
                                {l.name}
                              </span>
                            )) : (
                              <>
                                <span className={`text-[9px] font-extrabold px-2 py-1 rounded uppercase tracking-widest ${isDone ? 'bg-gray-100 text-gray-500' : 'bg-indigo-50 text-indigo-600'}`}>
                                  Feature
                                </span>
                                {!isDone && index === 0 && <span className="text-[9px] font-extrabold px-2 py-1 rounded uppercase tracking-widest bg-orange-500 text-white">High Priority</span>}
                              </>
                            )}
                          </div>
                          
                          <h4 className={`font-bold text-gray-900 text-[15px] leading-snug mb-2 group-hover:text-[#0d6efd] transition-colors ${isDone ? 'line-through text-gray-400' : ''}`}>
                            {card.title}
                          </h4>
                          
                          {card.description && (
                            <p className="text-gray-500 text-[13px] leading-relaxed mb-4 line-clamp-2">{card.description}</p>
                          )}

                          {hasProgress && !isDone && (
                             <div className="mb-4 mt-4">
                               <div className="w-full bg-gray-100 rounded-full h-1.5">
                                 <div className="bg-[#0d6efd] h-1.5 rounded-full" style={{ width: cIdx === 0 ? '40%' : '90%' }}></div>
                               </div>
                             </div>
                          )}

                          <div className="flex items-center justify-between mt-4">
                             <div className="flex gap-3 text-xs font-bold">
                               {isDone ? (
                                  <span className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                    Completed
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                  </span>
                               ) : index === 1 ? (
                                 <span className="text-red-600 flex items-center gap-1.5 text-[10px] tracking-widest uppercase">
                                   <div className="w-3.5 h-3.5 rounded-full bg-red-100 flex items-center justify-center"><div className="w-1 h-1 bg-red-600 rounded-full"></div></div>
                                   ASAP
                                 </span>
                               ) : (
                                 <span className="text-gray-500 flex items-center gap-1.5">
                                   <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                   Oct 24
                                 </span>
                               )}
                             </div>

                             {!isDone && (
                               <div className="flex -space-x-1.5">
                                 <img className="w-5 h-5 rounded-full border border-white" src="https://i.pravatar.cc/100?img=11" alt="Avatar"/>
                                 {cIdx === 0 && <img className="w-5 h-5 rounded-full border border-white" src="https://i.pravatar.cc/100?img=12" alt="Avatar"/>}
                               </div>
                             )}
                          </div>
                        </div>
                       );
                    })}

                    {showAddCard[list.id] && (
                      <div className="bg-white rounded-xl p-3 shadow-md border border-[#0d6efd] animate-slide-up-fade">
                        <textarea
                          className="w-full text-sm font-semibold text-gray-900 border-none outline-none resize-none placeholder-gray-400 focus:ring-0 p-0"
                          placeholder="What needs to be done?"
                          value={newCardTitles[list.id] || ''}
                          onChange={(e) => setNewCardTitles({ ...newCardTitles, [list.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddCard(list.id);
                            }
                          }}
                          autoFocus
                          rows={2}
                        />
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                          <button
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
                            onClick={() => setShowAddCard({ ...showAddCard, [list.id]: false })}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          <button
                            className="bg-[#0d6efd] text-white px-4 py-1.5 rounded-lg text-xs font-bold"
                            onClick={() => handleAddCard(list.id)}
                            disabled={!(newCardTitles[list.id]?.trim())}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!showAddCard[list.id] && (
                    <button
                      className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 rounded-xl transition-colors shrink-0"
                      onClick={() => setShowAddCard({ ...showAddCard, [list.id]: true })}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                      New Task
                    </button>
                  )}
                </div>
              );
            })}

            {/* Create Column Add Placeholder */}
            {showAddList ? (
              <div className="min-w-[320px] max-w-[320px] bg-white rounded-2xl p-4 shadow-lg border border-gray-200 animate-slide-up-fade h-32">
                <input
                  type="text"
                  className="w-full text-sm font-semibold text-gray-900 border-2 border-[#0d6efd] rounded-lg outline-none px-3 py-2 mb-3 bg-blue-50/30"
                  placeholder="Column Name"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddList();
                  }}
                  autoFocus
                />
                <div className="flex justify-between items-center">
                  <button className="text-gray-400 hover:text-gray-600 p-2" onClick={() => setShowAddList(false)}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <button className="bg-[#0d6efd] text-white px-4 py-1.5 rounded-lg text-sm font-bold" onClick={handleAddList}>
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="min-w-[320px] max-w-[320px] h-[500px] bg-transparent border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all duration-300 text-gray-400 hover:text-blue-600 group shrink-0"
                onClick={() => setShowAddList(true)}
              >
                  <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <span className="font-bold text-[15px] text-gray-500 group-hover:text-blue-600">Create Column</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {selectedCardId && (
        <CardDetailModal
          cardId={selectedCardId}
          boardId={boardId}
          onClose={() => setSelectedCardId(null)}
        />
      )}
      {showSettings && (
        <BoardSettingsModal
          boardId={boardId}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showActivity && (
        <ActivitySidebar
          boardId={boardId}
          onClose={() => setShowActivity(false)}
        />
      )}
    </div>
  );
}
