import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardApi, commentApi, labelApi } from '@/services/api';
import type { Card, Comment, Label } from '@/types';

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

  // 获取卡片详情
  const { data: cardData } = useQuery({
    queryKey: ['card', cardId],
    queryFn: () => cardApi.getOne(cardId),
  });

  // 获取评论
  const { data: commentsData } = useQuery({
    queryKey: ['comments', cardId],
    queryFn: () => commentApi.getAll(cardId),
  });

  // 获取标签
  const { data: labelsData } = useQuery({
    queryKey: ['labels', boardId],
    queryFn: () => labelApi.getAll(boardId),
  });

  // 更新卡片
  const updateCardMutation = useMutation({
    mutationFn: (data: { title?: string; description?: string }) =>
      cardApi.update(cardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setIsEditingTitle(false);
      setIsEditingDesc(false);
    },
  });

  // 创建评论
  const createCommentMutation = useMutation({
    mutationFn: (content: string) => commentApi.create(cardId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', cardId] });
      setNewComment('');
    },
  });

  // 删除评论
  const deleteCommentMutation = useMutation({
    mutationFn: (id: number) => commentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', cardId] });
    },
  });

  // 添加标签到卡片
  const addLabelMutation = useMutation({
    mutationFn: (labelId: number) => cardApi.addLabel(cardId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    },
  });

  // 从卡片移除标签
  const removeLabelMutation = useMutation({
    mutationFn: (labelId: number) => cardApi.removeLabel(cardId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    },
  });

  // 删除卡片
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
  const allLabels = labelsData?.data as Label[] | undefined;

  if (!card) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  const handleSaveTitle = () => {
    if (title.trim() && title !== card.title) {
      updateCardMutation.mutate({ title: title.trim() });
    } else {
      setIsEditingTitle(false);
    }
  };

  const handleSaveDesc = () => {
    if (description !== card.description) {
      updateCardMutation.mutate({ description });
    }
    setIsEditingDesc(false);
  };

  const cardLabels = card.labels || [];
  const availableLabels = allLabels?.filter(
    (l) => !cardLabels.find((cl) => cl.id === l.id)
  ) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {isEditingTitle ? (
            <input
              type="text"
              className="w-full bg-white/20 text-white placeholder-white/60 text-xl font-bold px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              autoFocus
            />
          ) : (
            <h2
              className="text-xl font-bold text-white cursor-pointer hover:bg-white/10 px-3 py-2 rounded-lg -ml-3"
              onClick={() => {
                setTitle(card.title);
                setIsEditingTitle(true);
              }}
            >
              {card.title}
            </h2>
          )}

          {/* Delete button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="absolute top-4 left-4 w-8 h-8 bg-white/20 hover:bg-red-500/80 rounded-full flex items-center justify-center text-white transition-colors"
            title="删除卡片"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Labels */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">标签</h3>
            <div className="flex flex-wrap gap-2">
              {cardLabels.map((label) => (
                <span
                  key={label.id}
                  className="px-3 py-1 rounded-full text-white text-sm font-medium flex items-center gap-1 cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: label.color }}
                  onClick={() => removeLabelMutation.mutate(label.id)}
                  title="点击移除"
                >
                  {label.name}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              ))}

              {availableLabels.length > 0 && (
                <div className="relative group">
                  <button className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium">
                    + 添加标签
                  </button>
                  <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10 min-w-[120px]">
                    {availableLabels.map((label) => (
                      <button
                        key={label.id}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => addLabelMutation.mutate(label.id)}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">描述</h3>
            {isEditingDesc ? (
              <div>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="添加详细描述..."
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm"
                    onClick={handleSaveDesc}
                  >
                    保存
                  </button>
                  <button
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                    onClick={() => setIsEditingDesc(false)}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="px-4 py-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 min-h-[80px]"
                onClick={() => {
                  setDescription(card.description || '');
                  setIsEditingDesc(true);
                }}
              >
                {card.description || (
                  <span className="text-gray-400">点击添加描述...</span>
                )}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">评论</h3>

            {/* Add Comment */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="添加评论..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newComment.trim()) {
                    createCommentMutation.mutate(newComment.trim());
                  }
                }}
              />
              <button
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                disabled={!newComment.trim() || createCommentMutation.isPending}
                onClick={() => createCommentMutation.mutate(newComment.trim())}
              >
                发送
              </button>
            </div>

            {/* Comment List */}
            <div className="space-y-3">
              {comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <div
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  >
                    {(comment.user?.nickname || comment.user?.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">
                        {comment.user?.nickname || comment.user?.username}
                      </span>
                      <span className="text-xs text-gray-400">
                        {comment.created_at ? new Date(comment.created_at).toLocaleString('zh-CN') : ''}
                      </span>
                    </div>
                    <p className="text-gray-600">{comment.content}</p>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              {(!comments || comments.length === 0) && (
                <p className="text-gray-400 text-center py-4">暂无评论</p>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <div className="bg-white rounded-xl p-6 shadow-xl mx-4 max-w-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-2">删除卡片</h3>
              <p className="text-gray-600 mb-4">确定要删除这张卡片吗？此操作不可撤销。</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={() => deleteCardMutation.mutate()}
                  disabled={deleteCardMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {deleteCardMutation.isPending ? '删除中...' : '删除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}