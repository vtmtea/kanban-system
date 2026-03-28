import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardApi, listApi, cardApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { CardDetailModal } from '@/components/CardDetailModal';
import type { List, Card } from '@/types';

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

  const [newListTitle, setNewListTitle] = useState('');
  const [showAddList, setShowAddList] = useState(false);
  const [newCardTitles, setNewCardTitles] = useState<Record<number, string>>({});
  const [showAddCard, setShowAddCard] = useState<Record<number, boolean>>({});
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [draggedCard, setDraggedCard] = useState<{ cardId: number; listId: number } | null>(null);
  const [dragOverListId, setDragOverListId] = useState<number | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

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
    mutationFn: ({ listId, title }: { listId: number; title: string }) =>
      cardApi.create(listId, { title }),
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
          <div className="text-white">
            {user?.nickname || user?.username}
          </div>
        </div>
      </header>

      {/* Board Content */}
      <div className="board-container">
        {boardData.lists?.map((list: List) => (
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
            <div className="list-header">
              <span>{list.title}</span>
              <button className="text-gray-500 hover:text-gray-700">...</button>
            </div>

            <div className="list-cards">
              {list.cards?.map((card: Card) => (
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
                      onClick={() => handleAddCard(list.id)}
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
          </div>
        ))}

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
    </div>
  );
}