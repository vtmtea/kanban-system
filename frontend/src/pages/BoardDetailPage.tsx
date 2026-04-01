import { Fragment, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardApi, listApi, cardApi, projectApi } from '@/services/api';
import { CardDetailModal } from '@/components/CardDetailModal';
import { BoardSettingsModal } from '@/components/BoardSettingsModal';
import { ActivitySidebar } from '@/components/ActivitySidebar';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { List, Card, Swimlane } from '@/types';

function formatShortDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function isPastDue(value?: string | null) {
  if (!value) return false;

  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return dueDate.getTime() < startOfToday.getTime();
}

function getAssigneeName(card: Card) {
  return card.assignee?.nickname || card.assignee?.username || 'Unassigned';
}

function getAssigneeInitial(card: Card) {
  return getAssigneeName(card).charAt(0).toUpperCase();
}

type DraggedCardState = {
  cardId: number;
  listId: number;
  sourceSectionKey: string;
  sourceVisibleIndex: number;
  sourcePosition: number;
  swimlaneId: number | null;
};

type DropIndicatorState = {
  listId: number;
  sectionKey: string;
  position: number;
};

type LaneSection = {
  key: string;
  swimlaneId: number | null | undefined;
  title: string;
  color: string;
  cards: Card[];
};

export function BoardDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const boardId = Number(id);

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardApi.getOne(boardId),
  });

  const linkedProjectId = board?.data?.project_id;
  const { data: boardProject } = useQuery({
    queryKey: ['project', linkedProjectId],
    queryFn: () => projectApi.getOne(linkedProjectId!),
    enabled: !!linkedProjectId,
  });

  useQuery({
    queryKey: ['board', boardId, 'wip-status'],
    queryFn: () => boardApi.getWipStatus(boardId),
    enabled: !!board?.data,
  });

  const { data: onlineUsers } = useQuery({
    queryKey: ['board', boardId, 'online-users'],
    queryFn: () => boardApi.getOnlineUsers(boardId),
    enabled: !!board?.data,
    refetchInterval: 15000,
  });

  useWebSocket({
    boardId,
    enabled: !isLoading && !!board?.data,
  });

  // Local state
  const [newListTitle, setNewListTitle] = useState('');
  const [showAddList, setShowAddList] = useState(false);
  const [newCardTitles, setNewCardTitles] = useState<Record<number, string>>({});
  const [newCardSwimlanes, setNewCardSwimlanes] = useState<Record<number, string>>({});
  const [showAddCard, setShowAddCard] = useState<Record<number, boolean>>({});
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [draggedCard, setDraggedCard] = useState<DraggedCardState | null>(null);
  const [dragOverListId, setDragOverListId] = useState<number | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicatorState | null>(null);
  
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
      setNewCardSwimlanes({});
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
      const swimlaneValue = newCardSwimlanes[listId];
      createCardMutation.mutate({
        listId,
        title: title.trim(),
        swimlaneId: swimlaneValue && swimlaneValue !== 'none' ? Number(swimlaneValue) : undefined,
      });
    }
  };

  const resetDragState = () => {
    setDraggedCard(null);
    setDragOverListId(null);
    setDropIndicator(null);
  };

  const updateDropIndicator = (targetListId: number, sectionKey: string, visualPosition: number) => {
    if (!draggedCard) return;

    setDragOverListId(targetListId);
    setDropIndicator({
      listId: targetListId,
      sectionKey,
      position: visualPosition,
    });
  };

  const resolveMovePosition = (targetList: List, section: LaneSection, visualPosition: number) => {
    if (!draggedCard) return 0;

    const baseTargetCards = (targetList.cards || []).filter((card) => card.id !== draggedCard.cardId);
    const targetSectionCards = section.cards.filter((card) => card.id !== draggedCard.cardId);
    const isSameSection = draggedCard.listId === targetList.id && draggedCard.sourceSectionKey === section.key;
    const normalizedPosition = isSameSection && visualPosition > draggedCard.sourceVisibleIndex
      ? visualPosition - 1
      : visualPosition;
    const clampedPosition = Math.max(0, Math.min(normalizedPosition, targetSectionCards.length));

    if (targetSectionCards.length === 0) {
      return baseTargetCards.length;
    }

    if (clampedPosition >= targetSectionCards.length) {
      const lastSectionCard = targetSectionCards[targetSectionCards.length - 1];
      const lastCardIndex = baseTargetCards.findIndex((card) => card.id === lastSectionCard.id);
      return lastCardIndex === -1 ? baseTargetCards.length : lastCardIndex + 1;
    }

    const referenceCard = targetSectionCards[clampedPosition];
    const referenceIndex = baseTargetCards.findIndex((card) => card.id === referenceCard.id);
    return referenceIndex === -1 ? baseTargetCards.length : referenceIndex;
  };

  const commitDrop = (targetList: List, section: LaneSection, visualPosition: number) => {
    if (!draggedCard) return;

    const position = resolveMovePosition(targetList, section, visualPosition);
    const isNoopMove = draggedCard.listId === targetList.id && position === draggedCard.sourcePosition;

    if (!isNoopMove) {
      moveCardMutation.mutate({
        cardId: draggedCard.cardId,
        listId: targetList.id,
        position,
      });
    }

    resetDragState();
  };

  const handleDragStart = (
    e: React.DragEvent,
    card: Card,
    listId: number,
    sectionKey: string,
    sourceVisibleIndex: number
  ) => {
    setDraggedCard({
      cardId: card.id,
      listId,
      sourceSectionKey: sectionKey,
      sourceVisibleIndex,
      sourcePosition: card.position,
      swimlaneId: card.swimlane_id ?? null,
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id.toString());
  };

  const handleSectionDragOver = (e: React.DragEvent, listId: number, section: LaneSection, visiblePosition: number) => {
    if (!draggedCard) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    updateDropIndicator(listId, section.key, visiblePosition);
  };

  const handleCardDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    listId: number,
    section: LaneSection,
    cardIndex: number
  ) => {
    if (!draggedCard) return;

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const bounds = e.currentTarget.getBoundingClientRect();
    const visualPosition = e.clientY < bounds.top + bounds.height / 2 ? cardIndex : cardIndex + 1;

    updateDropIndicator(listId, section.key, visualPosition);
  };

  const handleSectionDrop = (e: React.DragEvent, targetList: List, section: LaneSection, visiblePosition: number) => {
    e.preventDefault();
    commitDrop(targetList, section, visiblePosition);
  };

  const handleCardDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetList: List,
    section: LaneSection,
    cardIndex: number
  ) => {
    if (!draggedCard) return;

    e.preventDefault();
    e.stopPropagation();

    const bounds = e.currentTarget.getBoundingClientRect();
    const visualPosition = e.clientY < bounds.top + bounds.height / 2 ? cardIndex : cardIndex + 1;

    commitDrop(targetList, section, visualPosition);
  };

  const handleDragEnd = () => {
    resetDragState();
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
  const swimlanes = [...(boardData.swimlanes || [])].sort((left, right) => left.position - right.position);
  const hasSwimlanes = swimlanes.length > 0;
  const swimlaneLookup = new Map<number, Swimlane>(swimlanes.map((swimlane) => [swimlane.id, swimlane]));
  const boardSections: Array<Omit<LaneSection, 'cards'>> = hasSwimlanes
    ? [
        { key: 'unassigned', swimlaneId: null, title: 'No Swimlane', color: '#94a3b8' },
        ...swimlanes.map((swimlane) => ({
          key: `swimlane-${swimlane.id}`,
          swimlaneId: swimlane.id,
          title: swimlane.name,
          color: swimlane.color || '#0d6efd',
        })),
      ]
    : [{ key: 'all', swimlaneId: undefined, title: '', color: '#0d6efd' }];
  const memberPreview = boardData.members?.slice(0, 3) || [];
  const extraMemberCount = Math.max(0, (boardData.members?.length || 0) - memberPreview.length);
  const projectTitle = boardProject?.data?.title || (boardData.project_id ? `Project #${boardData.project_id}` : 'Standalone Board');
  const onlineUserIds = new Set(onlineUsers?.data.users || []);
  const onlineCount = onlineUsers?.data.online_count || 0;

  const getListSections = (list: List): LaneSection[] =>
    boardSections.map((section) => ({
      ...section,
      cards: section.swimlaneId === undefined
        ? list.cards || []
        : (list.cards || []).filter((card) => (card.swimlane_id ?? null) === section.swimlaneId),
    }));

  const canDropInSection = (section: LaneSection) => {
    if (!draggedCard) return true;
    if (!hasSwimlanes) return true;
    return draggedCard.swimlaneId === section.swimlaneId;
  };

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
                <Link to="/projects" className="hover:text-gray-800 transition-colors">Projects</Link>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                {boardData.project_id ? (
                  <Link to={`/projects/${boardData.project_id}`} className="text-gray-800 hover:text-[#0d6efd] transition-colors">
                    {projectTitle}
                  </Link>
                ) : (
                  <span className="text-gray-800">Standalone Board</span>
                )}
              </div>
              <h1 className="text-[28px] font-extrabold text-gray-900 leading-tight tracking-tight">{boardData.title}</h1>
              <div className="mt-3 flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.16em] text-gray-400">
                <span className={`rounded-full px-3 py-1 ${boardData.is_public ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {boardData.is_public ? 'Public' : 'Private'}
                </span>
                <span>{lists.length} Lists</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  {onlineCount} Online
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Avatars */}
              <div className="flex -space-x-2 mr-2">
                  {memberPreview.map((member) => (
                    <div key={member.id} className="relative">
                      {member.user?.avatar ? (
                        <img
                          className="w-8 h-8 rounded-full border-2 border-white object-cover"
                          src={member.user.avatar}
                          alt={member.user.nickname || member.user.username || 'Member'}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-[#0d6efd] flex items-center justify-center text-[11px] font-extrabold text-white">
                          {(member.user?.nickname || member.user?.username || '?').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      {onlineUserIds.has(member.user_id) ? (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                      ) : null}
                    </div>
                  ))}
                  {extraMemberCount > 0 ? (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[11px] font-extrabold text-gray-600">+{extraMemberCount}</div>
                  ) : null}
              </div>
              <button onClick={() => setShowActivity(true)} className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors text-gray-700 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Activity
              </button>
              <button onClick={() => setShowSettings(true)} className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors text-gray-700 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Settings
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
              const cards = list.cards || [];
              const listSections = getListSections(list);
              const isListActive = dragOverListId === list.id;

              return (
                <div
                  key={list.id}
                  className={`bg-[#f4f6f8] rounded-2xl p-4 min-w-[320px] max-w-[320px] flex flex-col max-h-full border transition-all duration-300 animate-slide-up-fade ${animationDelayClass} relative ${
                    isListActive ? 'border-[#0d6efd] shadow-[0_0_0_2px_rgba(13,110,253,0.2)]' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-extrabold text-gray-900 text-[16px]">{list.title}</h3>
                      <span className="bg-gray-200/80 text-gray-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                        {cards.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards inside List */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    <div className="space-y-4">
                      {listSections.map((section) => {
                        const sectionCanDrop = canDropInSection(section);
                        const isSectionActive = dropIndicator?.listId === list.id && dropIndicator.sectionKey === section.key;

                        return (
                          <div
                            key={section.key}
                            className={hasSwimlanes ? 'rounded-2xl border border-white/70 bg-white/50 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]' : ''}
                          >
                            {hasSwimlanes ? (
                              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: section.color }} />
                                  <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-500">
                                    {section.title}
                                  </span>
                                </div>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-gray-400">
                                  {section.cards.length}
                                </span>
                              </div>
                            ) : null}

                            <div className="space-y-3">
                              {section.cards.map((card: Card, cardIndex: number) => {
                                const swimlane = card.swimlane_id ? swimlaneLookup.get(card.swimlane_id) : null;
                                const isCompleted = !!card.completed_at;
                                const isDoneColumn = list.title.toLowerCase() === 'done';
                                const isDone = isCompleted || isDoneColumn;
                                const dueDateLabel = formatShortDate(card.due_date);
                                const overdue = !!card.due_date && !isCompleted && isPastDue(card.due_date);
                                const checklistCompleted = card.checklist_progress?.completed || 0;
                                const checklistTotal = card.checklist_progress?.total || 0;
                                const checklistPercent = checklistTotal > 0 ? Math.round((checklistCompleted / checklistTotal) * 100) : 0;
                                const commentCount = card.comments?.length || 0;
                                const attachmentCount = card.attachments?.length || 0;
                                const hasLabels = !!card.labels?.length;
                                const hasMeta = !!dueDateLabel || checklistTotal > 0 || commentCount > 0 || attachmentCount > 0;
                                const assigneeName = getAssigneeName(card);

                                return (
                                  <Fragment key={card.id}>
                                    {dropIndicator?.listId === list.id && dropIndicator.sectionKey === section.key && dropIndicator.position === cardIndex ? (
                                      <div className="pointer-events-none px-1">
                                        <div className="h-1.5 rounded-full bg-[#0d6efd] shadow-[0_0_0_4px_rgba(13,110,253,0.12)]" />
                                      </div>
                                    ) : null}

                                    <div
                                      className={`group cursor-grab overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-md active:cursor-grabbing ${
                                        draggedCard?.cardId === card.id ? 'opacity-40 rotate-3 scale-105 shadow-2xl z-50' : ''
                                      }`}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, card, list.id, section.key, cardIndex)}
                                      onDragOver={sectionCanDrop ? (e) => handleCardDragOver(e, list.id, section, cardIndex) : undefined}
                                      onDrop={sectionCanDrop ? (e) => handleCardDrop(e, list, section, cardIndex) : undefined}
                                      onDragEnd={handleDragEnd}
                                      onClick={() => setSelectedCardId(card.id)}
                                    >
                                      {card.cover ? (
                                        <div className="relative h-32 w-full overflow-hidden bg-gray-100">
                                          <img
                                            src={card.cover}
                                            alt={`${card.title} cover`}
                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                                        </div>
                                      ) : null}

                                      <div className="p-5">
                                        {(hasLabels || isDone || swimlane) && (
                                          <div className="mb-3 flex flex-wrap gap-2">
                                            {swimlane ? (
                                              <span
                                                className="rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase tracking-widest"
                                                style={{
                                                  borderColor: swimlane.color || '#0d6efd',
                                                  color: swimlane.color || '#0d6efd',
                                                }}
                                              >
                                                {swimlane.name}
                                              </span>
                                            ) : null}
                                            {isDone ? (
                                              <span className="rounded bg-emerald-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-widest text-emerald-700">
                                                {isCompleted ? 'Completed' : 'Done Column'}
                                              </span>
                                            ) : null}
                                            {card.labels?.map((label) => (
                                              <span
                                                key={label.id}
                                                className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                                                style={{ backgroundColor: label.color }}
                                              >
                                                {label.name}
                                              </span>
                                            ))}
                                          </div>
                                        )}

                                        <h4 className={`mb-2 text-[15px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-[#0d6efd] ${isDone ? 'line-through text-gray-400' : ''}`}>
                                          {card.title}
                                        </h4>

                                        {card.description && (
                                          <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-gray-500">{card.description}</p>
                                        )}

                                        {checklistTotal > 0 && (
                                          <div className="mb-4 mt-4">
                                            <div className="mb-2 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-400">
                                              <span>Subtasks</span>
                                              <span>{checklistCompleted}/{checklistTotal}</span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-gray-100">
                                              <div
                                                className={`h-1.5 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-[#0d6efd]'}`}
                                                style={{ width: `${checklistPercent}%` }}
                                              />
                                            </div>
                                          </div>
                                        )}

                                        <div className="mt-4 flex items-center justify-between">
                                          <div className="flex flex-wrap gap-2 text-xs font-bold">
                                            {dueDateLabel ? (
                                              <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-widest ${
                                                  overdue ? 'bg-red-50 text-red-600' : isDone ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-[#0d6efd]'
                                                }`}
                                              >
                                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm10 7H4v7a1 1 0 001 1h10a1 1 0 001-1V9z" clipRule="evenodd" />
                                                </svg>
                                                {dueDateLabel}
                                              </span>
                                            ) : null}
                                            {commentCount > 0 ? (
                                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] uppercase tracking-widest text-gray-500">
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 4h5m8 5l-4-4H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3z" />
                                                </svg>
                                                {commentCount}
                                              </span>
                                            ) : null}
                                            {attachmentCount > 0 ? (
                                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] uppercase tracking-widest text-gray-500">
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                                {attachmentCount}
                                              </span>
                                            ) : null}
                                            {!hasMeta ? (
                                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] uppercase tracking-widest text-gray-500">
                                                Task #{card.id}
                                              </span>
                                            ) : null}
                                          </div>

                                          {card.assignee ? (
                                            card.assignee.avatar ? (
                                              <img
                                                className="h-8 w-8 rounded-full border border-white object-cover shadow-sm"
                                                src={card.assignee.avatar}
                                                alt={assigneeName}
                                                title={assigneeName}
                                              />
                                            ) : (
                                              <div
                                                className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#0d6efd] text-[11px] font-extrabold text-white shadow-sm"
                                                title={assigneeName}
                                              >
                                                {getAssigneeInitial(card)}
                                              </div>
                                            )
                                          ) : (
                                            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-300">
                                              Unassigned
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </Fragment>
                                );
                              })}

                              {dropIndicator?.listId === list.id && dropIndicator.sectionKey === section.key && dropIndicator.position === section.cards.length ? (
                                <div className="pointer-events-none px-1">
                                  <div className="h-1.5 rounded-full bg-[#0d6efd] shadow-[0_0_0_4px_rgba(13,110,253,0.12)]" />
                                </div>
                              ) : null}

                              <div
                                className={`rounded-xl border-2 border-dashed transition-all ${
                                  section.cards.length === 0 ? 'min-h-[88px]' : 'h-6'
                                } ${
                                  sectionCanDrop && isSectionActive
                                    ? 'border-[#0d6efd]/40 bg-[#0d6efd]/5'
                                    : hasSwimlanes
                                      ? 'border-gray-200/70 bg-white/70'
                                      : 'border-transparent bg-transparent'
                                }`}
                                onDragOver={sectionCanDrop ? (e) => handleSectionDragOver(e, list.id, section, section.cards.length) : undefined}
                                onDrop={sectionCanDrop ? (e) => {
                                  e.stopPropagation();
                                  handleSectionDrop(e, list, section, section.cards.length);
                                } : undefined}
                              >
                                {section.cards.length === 0 ? (
                                  <div className={`flex h-full items-center justify-center px-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] ${
                                    sectionCanDrop ? 'text-gray-400' : 'text-gray-300'
                                  }`}>
                                    {sectionCanDrop
                                      ? hasSwimlanes
                                        ? `Drop in ${section.title}`
                                        : 'Drop a card here'
                                      : 'Cards stay in their swimlane'}
                                  </div>
                                ) : null}
                              </div>
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

                          {hasSwimlanes ? (
                            <div className="mt-3 border-t border-gray-100 pt-3">
                              <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-400">
                                Swimlane
                              </label>
                              <select
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none transition focus:border-[#0d6efd]"
                                value={newCardSwimlanes[list.id] || 'none'}
                                onChange={(e) => setNewCardSwimlanes({ ...newCardSwimlanes, [list.id]: e.target.value })}
                              >
                                <option value="none">No Swimlane</option>
                                {swimlanes.map((swimlane) => (
                                  <option key={swimlane.id} value={String(swimlane.id)}>
                                    {swimlane.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : null}

                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
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
          onDeleted={() => navigate('/boards')}
          onLeftBoard={() => {
            setShowSettings(false);
            navigate('/boards');
          }}
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
