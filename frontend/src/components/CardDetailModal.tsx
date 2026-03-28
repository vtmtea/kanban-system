import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardApi, commentApi, labelApi, boardApi } from '@/services/api';
import { MarkdownEditor, MarkdownRenderer } from '@/components/MarkdownEditor';
import type { Card, Comment, Label, ChecklistItem, Attachment, User } from '@/types';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 获取 Checklist
  const { data: checklistData } = useQuery({
    queryKey: ['checklist', cardId],
    queryFn: () => cardApi.getChecklist(cardId),
  });

  // 获取附件
  const { data: attachmentsData } = useQuery({
    queryKey: ['attachments', cardId],
    queryFn: () => cardApi.getAttachments(cardId),
  });

  // 获取成员列表（用于指派）
  const { data: membersData } = useQuery({
    queryKey: ['board', boardId, 'members'],
    queryFn: () => boardApi.getMembers(boardId),
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

  // 指派卡片
  const assignCardMutation = useMutation({
    mutationFn: (assigneeId: number | null) => cardApi.assign(cardId, { assignee_id: assigneeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // 完成卡片
  const completeCardMutation = useMutation({
    mutationFn: () => cardApi.complete(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
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

  // Checklist mutations
  const addChecklistItemMutation = useMutation({
    mutationFn: (content: string) => cardApi.addChecklistItem(cardId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', cardId] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      setNewChecklistItem('');
    },
  });

  const updateChecklistItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { completed?: boolean; content?: string } }) =>
      cardApi.updateChecklistItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', cardId] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    },
  });

  const deleteChecklistItemMutation = useMutation({
    mutationFn: (id: number) => cardApi.deleteChecklistItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', cardId] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    },
  });

  // Attachment mutations
  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => cardApi.uploadAttachment(cardId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', cardId] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (id: number) => cardApi.deleteAttachment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', cardId] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    },
  });

  const card = cardData?.data as Card | undefined;
  const comments = commentsData?.data as Comment[] | undefined;
  const allLabels = labelsData?.data as Label[] | undefined;
  const checklistItems = checklistData?.data as ChecklistItem[] | undefined;
  const attachments = attachmentsData?.data as Attachment[] | undefined;
  const members = membersData?.data as { user_id: number; user?: User; role: string }[] | undefined;

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAttachmentMutation.mutate(file);
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const cardLabels = card.labels || [];
  const availableLabels = allLabels?.filter(
    (l) => !cardLabels.find((cl) => cl.id === l.id)
  ) || [];

  const completedCount = checklistItems?.filter((item) => item.completed).length || 0;
  const totalCount = checklistItems?.length || 0;

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

          {/* Delete & Complete buttons */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-8 h-8 bg-white/20 hover:bg-red-500/80 rounded-full flex items-center justify-center text-white transition-colors"
              title="删除卡片"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            {!card.completed_at && (
              <button
                onClick={() => completeCardMutation.mutate()}
                className="w-8 h-8 bg-white/20 hover:bg-green-500/80 rounded-full flex items-center justify-center text-white transition-colors"
                title="完成卡片"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Completed badge */}
          {card.completed_at && (
            <div className="mb-4 px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              已完成
            </div>
          )}

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

          {/* Assignee */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">指派给</h3>
            <div className="flex items-center gap-2">
              {card.assignee ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                    {(card.assignee.nickname || card.assignee.username || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-sm">{card.assignee.nickname || card.assignee.username}</span>
                  <button
                    onClick={() => assignCardMutation.mutate(null)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="relative group">
                  <button className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium">
                    + 指派成员
                  </button>
                  <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10 min-w-[150px]">
                    {members?.map((member) => (
                      <button
                        key={member.user_id}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => assignCardMutation.mutate(member.user_id)}
                      >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs">
                          {(member.user?.nickname || member.user?.username || '?')[0].toUpperCase()}
                        </div>
                        {member.user?.nickname || member.user?.username}
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
                <MarkdownEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="支持 Markdown 格式..."
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
                {card.description ? (
                  <MarkdownRenderer content={card.description} />
                ) : (
                  <span className="text-gray-400">点击添加描述...</span>
                )}
              </div>
            )}
          </div>

          {/* Checklist */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              检查清单
              {totalCount > 0 && (
                <span className="ml-2 text-xs text-gray-400">
                  ({completedCount}/{totalCount})
                </span>
              )}
            </h3>

            {/* Progress bar */}
            {totalCount > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            )}

            {/* Checklist items */}
            <div className="space-y-2 mb-3">
              {checklistItems?.map((item) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(e) => updateChecklistItemMutation.mutate({
                      id: item.id,
                      data: { completed: e.target.checked },
                    })}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-400' : ''}`}>
                    {item.content}
                  </span>
                  <button
                    onClick={() => deleteChecklistItemMutation.mutate(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add checklist item */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="添加检查项..."
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newChecklistItem.trim()) {
                    addChecklistItemMutation.mutate(newChecklistItem.trim());
                  }
                }}
                className="flex-1 px-3 py-1 border rounded text-sm"
              />
              <button
                onClick={() => {
                  if (newChecklistItem.trim()) {
                    addChecklistItemMutation.mutate(newChecklistItem.trim());
                  }
                }}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                添加
              </button>
            </div>
          </div>

          {/* Attachments */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">附件</h3>

            {/* Upload button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 text-sm w-full mb-3"
            >
              + 添加附件
            </button>

            {/* Attachment list */}
            <div className="space-y-2">
              {attachments?.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded group">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <a
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline truncate"
                    >
                      {attachment.file_name}
                    </a>
                    {attachment.file_size && (
                      <span className="text-xs text-gray-400">
                        ({formatFileSize(attachment.file_size)})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
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