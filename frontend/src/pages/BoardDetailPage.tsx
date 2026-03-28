import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardApi, listApi, cardApi, swimlaneApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { CardDetailModal } from '@/components/CardDetailModal';
import { BoardSettingsModal } from '@/components/BoardSettingsModal';
import { ActivitySidebar } from '@/components/ActivitySidebar';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { List, Card, Swimlane } from '@/types';

export function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const boardId = Number(id);

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardApi.getOne(boardId),
  });

  const { data: wipStatus } = useQuery({
    queryKey: ['board', boardId, 'wip-status'],
    queryFn: () => boardApi.getWipStatus(boardId),
    enabled: !!board?.data,
  });

  // WebSocket 实时同步
  useWebSocket({
    boardId,
    enabled: !isLoading && !!board?.data,
  });

  const [newListTitle, setNewListTitle] = useState('');
  const [showAddList, setShowAddList] = useState(false);
  const [newCardTitles, setNewCardTitles] = useState<Record<number, string>>({});
  const [showAddCard, setShowAddCard] = useState<Record<number, boolean>>({});
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [draggedCard, setDraggedCard] = useState<{ cardId: number; listId: number } | null>(null);
  const [dragOverListId, setDragOverListId] = useState<number | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // 泳道和侧边栏状态
  const [showSwimlanes, setShowSwimlanes] = useState(false);
  const [selectedSwimlaneId, setSelectedSwimlaneId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  // 创建列表
  const createListMutation = useMutation({
    mutationFn: (title: string) => listApi.create(boardId, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setNewListTitle('');
      setShowAddList(false);
    },
  });

  // 创建卡片
  const createCardMutation = useMutation({
    mutationFn: ({ listId, title, swimlaneId }: { listId: number; title: string; swimlaneId?: number }) =>
      cardApi.create(listId, { title, swimlane_id: swimlaneId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setNewCardTitles({});
      setShowAddCard({});
    },
  });

  // 移动卡片
  const moveCardMutation = useMutation({
    mutationFn: ({ cardId, listId, position }: { cardId: number; listId: number; position?: number }) =>
      cardApi.move(cardId, { list_id: listId, position }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // 创建泳道（在设置模态框中创建）
  const createSwimlaneMutation = useMutation({
    mutationFn: (name: string) => swimlaneApi.create(boardId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // 避免未使用警告
  void createSwimlaneMutation;

  const handleAddList = () => {
    if (newListTitle.trim()) {
      createListMutation.mutate(newListTitle.trim());
    }
  };

  const handleAddCard = (listId: number, swimlaneId?: number) => {
    const title = newCardTitles[listId];
    if (title?.trim()) {
      createCardMutation.mutate({ listId, title: title.trim(), swimlaneId });
    }
  };

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, cardId: number, listId: number) => {
    setDraggedCard({ cardId, listId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId.toString());
  };

  // 拖拽进入列表
  const handleDragOver = (e: React.DragEvent, listId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverListId(listId);
  };

  // 拖拽离开列表
  const handleDragLeave = () => {
    setDragOverListId(null);
  };

  // 放下卡片
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

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedCard(null);
    setDragOverListId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!board?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">看板不存在</div>
      </div>
    );
  }

  const boardData = board.data;
  const swimlanes = boardData.swimlanes || [];
  const lists = boardData.lists || [];

  // 获取泳道下的卡片
  const getCardsBySwimlane = (list: List, swimlaneId: number | null) => {
    return list.cards?.filter((card: Card) =>
      swimlaneId === null ? !card.swimlane_id : card.swimlane_id === swimlaneId
    ) || [];
  };

  // 获取列表的WIP状态
  const getListWipStatus = (listId: number) => {
    return wipStatus?.data?.find((s) => s.list_id === listId);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header
        className="p-4 shadow"
        style={{ backgroundColor: boardData.color || '#3b82f6' }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-white hover:bg-black/10 px-3 py-1 rounded"
            >
              ← 返回
            </button>
            <h1 className="text-xl font-bold text-white">{boardData.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* 泳道切换 */}
            {swimlanes.length > 0 && (
              <button
                onClick={() => setShowSwimlanes(!showSwimlanes)}
                className={`text-white px-3 py-1 rounded text-sm ${
                  showSwimlanes ? 'bg-white/30' : 'hover:bg-black/10'
                }`}
              >
                泳道视图
              </button>
            )}
            {/* 活动日志 */}
            <button
              onClick={() => setShowActivity(!showActivity)}
              className={`text-white px-3 py-1 rounded text-sm ${
                showActivity ? 'bg-white/30' : 'hover:bg-black/10'
              }`}
            >
              活动日志
            </button>
            {/* 设置 */}
            <button
              onClick={() => setShowSettings(true)}
              className="text-white hover:bg-black/10 px-3 py-1 rounded text-sm"
            >
              设置
            </button>
            <div className="text-white">
              {user?.nickname || user?.username}
            </div>
          </div>
        </div>
      </header>

      {/* 泳道选择器 */}
      {showSwimlanes && swimlanes.length > 0 && (
        <div className="bg-white border-b px-4 py-2 flex items-center gap-2">
          <span className="text-sm text-gray-500">选择泳道:</span>
          <button
            onClick={() => setSelectedSwimlaneId(null)}
            className={`px-3 py-1 rounded text-sm ${
              selectedSwimlaneId === null
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {swimlanes.map((swimlane: Swimlane) => (
            <button
              key={swimlane.id}
              onClick={() => setSelectedSwimlaneId(swimlane.id)}
              className={`px-3 py-1 rounded text-sm ${
                selectedSwimlaneId === swimlane.id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={swimlane.color ? { borderColor: swimlane.color } : {}}
            >
              {swimlane.name}
            </button>
          ))}
        </div>
      )}

      {/* Board Content */}
      <div className="board-container">
        {lists.map((list: List) => {
          const wipInfo = getListWipStatus(list.id);
          const isWipOverLimit = wipInfo?.is_over_limit;
          const cardsToShow = showSwimlanes
            ? getCardsBySwimlane(list, selectedSwimlaneId)
            : list.cards;

          return (
            <div
              key={list.id}
              ref={dropRef}
              className={`list-container transition-all duration-200 ${
                dragOverListId === list.id ? 'ring-2 ring-indigo-400 ring-offset-2' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, list.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, list.id)}
            >
              <div className="list-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{list.title}</span>
                  {/* WIP 限制显示 */}
                  {list.wip_limit && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        isWipOverLimit
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      title={`当前: ${cardsToShow?.length || 0}, 限制: ${list.wip_limit}`}
                    >
                      {cardsToShow?.length || 0}/{list.wip_limit}
                    </span>
                  )}
                </div>
                <button className="text-gray-500 hover:text-gray-700">...</button>
              </div>

              {/* 泳道分组显示 */}
              {showSwimlanes && selectedSwimlaneId === null ? (
                // 按泳道分组显示所有卡片
                <div className="list-cards">
                  {swimlanes.map((swimlane: Swimlane) => {
                    const swimlaneCards = getCardsBySwimlane(list, swimlane.id);
                    if (swimlaneCards.length === 0) return null;

                    return (
                      <div key={swimlane.id} className="mb-2">
                        <div
                          className="text-xs text-gray-500 px-2 py-1 rounded mb-1"
                          style={{ backgroundColor: swimlane.color || '#e5e7eb' }}
                        >
                          {swimlane.name}
                        </div>
                        {swimlaneCards.map((card: Card) => (
                          <div
                            key={card.id}
                            className={`card-item cursor-grab active:cursor-grabbing ${
                              draggedCard?.cardId === card.id ? 'opacity-50 rotate-2' : ''
                            }`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, card.id, list.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedCardId(card.id)}
                          >
                            {card.labels && card.labels.length > 0 && (
                              <div className="card-labels">
                                {card.labels.map((label) => (
                                  <span
                                    key={label.id}
                                    className="label-tag"
                                    style={{ backgroundColor: label.color }}
                                    title={label.name}
                                  />
                                ))}
                              </div>
                            )}
                            <span>{card.title}</span>
                            {/* Checklist 进度 */}
                            {card.checklist_progress && card.checklist_progress.total && card.checklist_progress.total > 0 && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                {card.checklist_progress.completed ?? 0}/{card.checklist_progress.total ?? 0}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {/* 无泳道的卡片 */}
                  {getCardsBySwimlane(list, null).length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-400 px-2 py-1 mb-1">未分类</div>
                      {getCardsBySwimlane(list, null).map((card: Card) => (
                        <div
                          key={card.id}
                          className={`card-item cursor-grab active:cursor-grabbing ${
                            draggedCard?.cardId === card.id ? 'opacity-50 rotate-2' : ''
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, card.id, list.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedCardId(card.id)}
                        >
                          {card.labels && card.labels.length > 0 && (
                            <div className="card-labels">
                              {card.labels.map((label) => (
                                <span
                                  key={label.id}
                                  className="label-tag"
                                  style={{ backgroundColor: label.color }}
                                  title={label.name}
                                />
                              ))}
                            </div>
                          )}
                          <span>{card.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // 普通列表显示
                <div className="list-cards">
                  {cardsToShow?.map((card: Card) => (
                    <div
                      key={card.id}
                      className={`card-item cursor-grab active:cursor-grabbing ${
                        draggedCard?.cardId === card.id ? 'opacity-50 rotate-2' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id, list.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedCardId(card.id)}
                    >
                      {card.labels && card.labels.length > 0 && (
                        <div className="card-labels">
                          {card.labels.map((label) => (
                            <span
                              key={label.id}
                              className="label-tag"
                              style={{ backgroundColor: label.color }}
                              title={label.name}
                            />
                          ))}
                        </div>
                      )}
                      <span>{card.title}</span>
                      {/* Checklist 进度 */}
                      {card.checklist_progress && card.checklist_progress.total && card.checklist_progress.total > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {card.checklist_progress.completed ?? 0}/{card.checklist_progress.total ?? 0}
                        </div>
                      )}
                      {/* 指派人员 */}
                      {card.assignee && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <div
                            className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs"
                          >
                            {(card.assignee.nickname || card.assignee.username || '?')[0].toUpperCase()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {showAddCard[list.id] ? (
                    <div className="bg-white rounded p-2 mt-2">
                      <textarea
                        className="w-full p-2 border rounded resize-none"
                        placeholder="输入卡片标题..."
                        value={newCardTitles[list.id] || ''}
                        onChange={(e) =>
                          setNewCardTitles({ ...newCardTitles, [list.id]: e.target.value })
                        }
                        rows={2}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          className="bg-primary-500 text-white px-3 py-1 rounded text-sm hover:bg-primary-600"
                          onClick={() => handleAddCard(list.id, selectedSwimlaneId || undefined)}
                          disabled={isWipOverLimit}
                        >
                          添加
                        </button>
                        <button
                          className="text-gray-500 hover:text-gray-700 px-2 py-1 text-sm"
                          onClick={() => setShowAddCard({ ...showAddCard, [list.id]: false })}
                        >
                          取消
                        </button>
                      </div>
                      {isWipOverLimit && (
                        <div className="text-xs text-red-500 mt-1">已超过WIP限制</div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="add-card-button"
                      onClick={() => setShowAddCard({ ...showAddCard, [list.id]: true })}
                    >
                      + 添加卡片
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add List */}
        {showAddList ? (
          <div className="list-container">
            <input
              type="text"
              className="w-full p-2 border rounded mb-2"
              placeholder="输入列表标题..."
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                className="bg-primary-500 text-white px-3 py-1 rounded text-sm hover:bg-primary-600"
                onClick={handleAddList}
              >
                添加列表
              </button>
              <button
                className="text-gray-500 hover:text-gray-700 px-2 py-1 text-sm"
                onClick={() => setShowAddList(false)}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div
            className="min-w-[280px] bg-gray-200/50 rounded-lg p-2 cursor-pointer hover:bg-gray-200"
            onClick={() => setShowAddList(true)}
          >
            <span className="text-gray-600">+ 添加列表</span>
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      {selectedCardId && (
        <CardDetailModal
          cardId={selectedCardId}
          boardId={boardId}
          onClose={() => setSelectedCardId(null)}
        />
      )}

      {/* Board Settings Modal */}
      {showSettings && (
        <BoardSettingsModal
          boardId={boardId}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Activity Sidebar */}
      {showActivity && (
        <ActivitySidebar
          boardId={boardId}
          onClose={() => setShowActivity(false)}
        />
      )}
    </div>
  );
}