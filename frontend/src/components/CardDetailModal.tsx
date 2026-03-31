import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatePickerField } from '@/components/DatePickerField';
import { MarkdownEditor, MarkdownRenderer } from '@/components/MarkdownEditor';
import { SelectField } from '@/components/SelectField';
import { useAuth } from '@/context/AuthContext';
import { boardApi, cardApi, commentApi, labelApi, listApi } from '@/services/api';
import type {
  Attachment,
  Activity,
  BoardMember,
  Card,
  ChecklistItem,
  Comment,
  Label,
  List,
  UpdateCardRequest,
  User,
} from '@/types';

interface CardDetailModalProps {
  cardId: number;
  boardId: number;
  onClose: () => void;
  onDelete?: () => void;
}

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

function getUserDisplayName(user?: User | null) {
  return user?.nickname || user?.username || 'Unknown user';
}

function getUserInitial(user?: User | null) {
  return getUserDisplayName(user).charAt(0).toUpperCase();
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function toApiDateValue(value: string) {
  return value ? `${value}T00:00:00Z` : null;
}

function formatDisplayDate(value?: string | null) {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No due date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatFileSize(bytes?: number) {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageAttachment(attachment: Attachment) {
  if (attachment.mime_type?.startsWith('image/')) return true;
  return /\.(avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(attachment.file_url);
}

function timeAgo(value?: string) {
  if (!value) return 'JUST NOW';

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'JUST NOW';

  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));

  if (minutes < 1) return 'JUST NOW';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'MIN' : 'MINS'} AGO`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'HOUR' : 'HOURS'} AGO`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'DAY' : 'DAYS'} AGO`;

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp)).toUpperCase();
}

function getActivityLabel(activity: Activity) {
  const actor = getUserDisplayName(activity.user);
  const entityLabel = activity.entity_type.replace(/_/g, ' ');

  switch (activity.action) {
    case 'created':
      return `${actor} created ${entityLabel}`;
    case 'updated':
      return `${actor} updated ${entityLabel}`;
    case 'deleted':
      return `${actor} deleted ${entityLabel}`;
    case 'completed':
      return `${actor} completed this task`;
    case 'reopened':
      return `${actor} reopened this task`;
    case 'assigned':
      return `${actor} changed the assignee`;
    case 'added_label':
      return `${actor} updated labels on this task`;
    case 'removed_label':
      return `${actor} updated labels on this task`;
    case 'moved':
      return `${actor} moved this task`;
    case 'uploaded':
      return `${actor} uploaded an attachment`;
    default:
      return `${actor} ${activity.action} ${entityLabel}`;
  }
}

function getActivityTone(action: string) {
  switch (action) {
    case 'created':
      return 'bg-green-100 text-green-600';
    case 'updated':
      return 'bg-blue-100 text-blue-600';
    case 'deleted':
      return 'bg-red-100 text-red-600';
    case 'completed':
      return 'bg-emerald-100 text-emerald-600';
    case 'reopened':
      return 'bg-amber-100 text-amber-600';
    case 'assigned':
      return 'bg-indigo-100 text-indigo-600';
    case 'added_label':
      return 'bg-fuchsia-100 text-fuchsia-600';
    case 'removed_label':
      return 'bg-pink-100 text-pink-600';
    case 'uploaded':
      return 'bg-sky-100 text-sky-600';
    case 'moved':
      return 'bg-purple-100 text-purple-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function CardDetailModal({ cardId, boardId, onClose, onDelete }: CardDetailModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newComment, setNewComment] = useState('');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'comments' | 'activity'>('comments');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#0d6efd');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [coverUrlInput, setCoverUrlInput] = useState('');

  const invalidateCardContext = () => {
    void queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    void queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    void queryClient.invalidateQueries({ queryKey: ['card', cardId, 'activities'] });
  };

  const { data: cardData, isLoading: isLoadingCard } = useQuery({
    queryKey: ['card', cardId],
    queryFn: () => cardApi.getOne(cardId),
  });
  const { data: commentsData } = useQuery({
    queryKey: ['comments', cardId],
    queryFn: () => commentApi.getAll(cardId),
  });
  const { data: activitiesData, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['card', cardId, 'activities'],
    queryFn: () => cardApi.getActivities(cardId),
  });
  const { data: labelsData } = useQuery({
    queryKey: ['labels', boardId],
    queryFn: () => labelApi.getAll(boardId),
  });
  const { data: listsData } = useQuery({
    queryKey: ['board', boardId, 'lists'],
    queryFn: () => listApi.getAll(boardId),
  });
  const { data: checklistData } = useQuery({
    queryKey: ['checklist', cardId],
    queryFn: () => cardApi.getChecklist(cardId),
  });
  const { data: attachmentsData } = useQuery({
    queryKey: ['attachments', cardId],
    queryFn: () => cardApi.getAttachments(cardId),
  });
  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['board', boardId, 'members'],
    queryFn: () => boardApi.getMembers(boardId),
  });

  const updateCardMutation = useMutation({
    mutationFn: (data: UpdateCardRequest) => cardApi.update(cardId, data),
    onSuccess: () => {
      invalidateCardContext();
      setIsEditingTitle(false);
      setIsEditingDesc(false);
    },
  });

  const assignCardMutation = useMutation({
    mutationFn: (assigneeId: number | null) => cardApi.assign(cardId, { assignee_id: assigneeId }),
    onSuccess: invalidateCardContext,
  });

  const completeCardMutation = useMutation({
    mutationFn: () => cardApi.complete(cardId),
    onSuccess: invalidateCardContext,
  });

  const reopenCardMutation = useMutation({
    mutationFn: () => cardApi.reopen(cardId),
    onSuccess: invalidateCardContext,
  });

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => commentApi.create(cardId, { content }),
    onSuccess: () => {
      invalidateCardContext();
      void queryClient.invalidateQueries({ queryKey: ['comments', cardId] });
      setNewComment('');
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => commentApi.update(id, { content }),
    onSuccess: () => {
      invalidateCardContext();
      void queryClient.invalidateQueries({ queryKey: ['comments', cardId] });
      setEditingCommentId(null);
      setEditingCommentContent('');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => commentApi.delete(commentId),
    onSuccess: () => {
      invalidateCardContext();
      void queryClient.invalidateQueries({ queryKey: ['comments', cardId] });
      setEditingCommentId(null);
      setEditingCommentContent('');
    },
  });

  const addChecklistItemMutation = useMutation({
    mutationFn: (content: string) => cardApi.addChecklistItem(cardId, { content }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checklist', cardId] });
      invalidateCardContext();
      setNewChecklistItem('');
      setShowAddSubtask(false);
    },
  });

  const updateChecklistItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { completed?: boolean; content?: string } }) =>
      cardApi.updateChecklistItem(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checklist', cardId] });
      invalidateCardContext();
    },
  });

  const deleteChecklistItemMutation = useMutation({
    mutationFn: (itemId: number) => cardApi.deleteChecklistItem(itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checklist', cardId] });
      invalidateCardContext();
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => cardApi.uploadAttachment(cardId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attachments', cardId] });
      invalidateCardContext();
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: number) => cardApi.deleteAttachment(attachmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attachments', cardId] });
      invalidateCardContext();
    },
  });

  const moveCardMutation = useMutation({
    mutationFn: (listId: number) => cardApi.move(cardId, { list_id: listId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['board', boardId, 'lists'] });
      invalidateCardContext();
    },
  });

  const addLabelMutation = useMutation({
    mutationFn: (labelId: number) => cardApi.addLabel(cardId, labelId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
      invalidateCardContext();
    },
  });

  const removeLabelMutation = useMutation({
    mutationFn: (labelId: number) => cardApi.removeLabel(cardId, labelId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
      invalidateCardContext();
    },
  });

  const createLabelMutation = useMutation({
    mutationFn: (payload: { name: string; color: string }) => labelApi.create(boardId, payload),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
      invalidateCardContext();
      setNewLabelName('');
      addLabelMutation.mutate(response.data.id);
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: () => cardApi.delete(cardId),
    onSuccess: () => {
      invalidateCardContext();
      onDelete?.();
      onClose();
    },
  });

  const updateCoverMutation = useMutation({
    mutationFn: (cover: string) => cardApi.update(cardId, { cover }),
    onSuccess: (_, cover) => {
      invalidateCardContext();
      setIsEditingCover(false);
      setCoverUrlInput(cover);
    },
  });

  const card = cardData?.data as Card | undefined;
  const comments = commentsData?.data as Comment[] | undefined;
  const activities = activitiesData?.data as Activity[] | undefined;
  const availableLabels = labelsData?.data as Label[] | undefined;
  const availableLists = listsData?.data as List[] | undefined;
  const checklistItems = checklistData?.data as ChecklistItem[] | undefined;
  const attachments = attachmentsData?.data as Attachment[] | undefined;
  const members = membersData?.data as BoardMember[] | undefined;

  useEffect(() => {
    if (card?.title && !isEditingTitle) {
      setTitle(card.title);
    }
  }, [card?.title, isEditingTitle]);

  useEffect(() => {
    setActiveSidebarTab('comments');
    setEditingCommentId(null);
    setEditingCommentContent('');
    setNewComment('');
    setNewLabelName('');
    setIsEditingCover(false);
    setCoverUrlInput('');
  }, [cardId]);

  useEffect(() => {
    if (!isEditingCover) {
      setCoverUrlInput(card?.cover || '');
    }
  }, [card?.cover, isEditingCover]);

  const assigneeOptions = useMemo(() => {
    const options = [
      {
        value: 'none',
        label: 'Unassigned',
        description: 'Leave this task without an owner.',
      },
    ];
    const seen = new Set(['none']);

    members?.forEach((member) => {
      if (!member.user) return;
      const value = String(member.user_id);
      if (seen.has(value)) return;
      seen.add(value);
      options.push({
        value,
        label: getUserDisplayName(member.user),
        description: `${member.role.charAt(0).toUpperCase()}${member.role.slice(1)} on this board`,
      });
    });

    return options;
  }, [members]);

  const listOptions = useMemo(
    () =>
      (availableLists || []).map((list) => ({
        value: String(list.id),
        label: list.title,
        description: `${list.cards?.length || 0} tasks in this list`,
      })),
    [availableLists]
  );

  const imageAttachments = useMemo(() => (attachments || []).filter(isImageAttachment), [attachments]);

  if (isLoadingCard) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0d6efd] border-t-transparent" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="rounded-[2rem] bg-white px-8 py-7 text-center shadow-2xl">
          <h2 className="text-xl font-extrabold text-gray-900">Task unavailable</h2>
          <p className="mt-2 text-sm font-medium text-gray-500">This task could not be loaded.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 rounded-xl bg-[#0d6efd] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const dueDateValue = toDateInputValue(card.due_date);
  const completedCount = checklistItems?.filter((item) => item.completed).length || 0;
  const totalCount = checklistItems?.length || 0;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const isCompleted = !!card.completed_at;
  const assigneeValue = card.assignee_id ? String(card.assignee_id) : 'none';
  const currentList = availableLists?.find((list) => list.id === card.list_id);
  const listValue = currentList ? String(currentList.id) : '';
  const currentLabels = card.labels || [];
  const currentLabelIds = new Set(currentLabels.map((label) => label.id));

  const handleSaveTitle = () => {
    if (!title.trim()) {
      setTitle(card.title);
      setIsEditingTitle(false);
      return;
    }

    if (title.trim() === card.title) {
      setIsEditingTitle(false);
      return;
    }

    updateCardMutation.mutate({ title: title.trim() });
  };

  const handleSaveDescription = () => {
    updateCardMutation.mutate({ description: description.trim() });
  };

  const handleDueDateChange = (nextValue: string) => {
    if (nextValue === dueDateValue) return;
    updateCardMutation.mutate({ due_date: toApiDateValue(nextValue) });
  };

  const handleClearDueDate = () => {
    if (!card.due_date) return;
    updateCardMutation.mutate({ due_date: null });
  };

  const handleChecklistSubmit = () => {
    const content = newChecklistItem.trim();
    if (!content) return;
    addChecklistItemMutation.mutate(content);
  };

  const handleCommentSubmit = () => {
    const content = newComment.trim();
    if (!content) return;
    createCommentMutation.mutate(content);
  };

  const handleStartEditingComment = (comment: Comment) => {
    setActiveSidebarTab('comments');
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const handleSaveEditedComment = (commentId: number) => {
    const content = editingCommentContent.trim();
    if (!content) return;
    updateCommentMutation.mutate({ id: commentId, content });
  };

  const handleMoveCard = (nextListId: string) => {
    const listId = Number(nextListId);
    if (!listId || listId === card.list_id) return;
    moveCardMutation.mutate(listId);
  };

  const handleCreateLabel = () => {
    const name = newLabelName.trim();
    if (!name) return;
    createLabelMutation.mutate({ name, color: newLabelColor });
  };

  const handleSaveCover = () => {
    const nextCover = coverUrlInput.trim();
    const currentCover = card.cover?.trim() || '';

    if (nextCover === currentCover) {
      setIsEditingCover(false);
      return;
    }

    updateCoverMutation.mutate(nextCover);
  };

  const handleSelectCover = (cover: string) => {
    if (cover === card.cover) return;
    updateCoverMutation.mutate(cover);
  };

  const handleClearCover = () => {
    if (!card.cover) {
      setIsEditingCover(false);
      setCoverUrlInput('');
      return;
    }

    updateCoverMutation.mutate('');
  };

  const handleDeleteAttachment = (attachment: Attachment) => {
    const deleteAttachment = () => deleteAttachmentMutation.mutate(attachment.id);

    if (attachment.file_url !== card.cover) {
      deleteAttachment();
      return;
    }

    updateCoverMutation.mutate('', {
      onSuccess: () => {
        deleteAttachment();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative flex h-full max-h-[90vh] w-full max-w-[1240px] animate-slide-up-fade overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex h-full flex-1 flex-col overflow-y-auto bg-white custom-scrollbar">
          <div className="mx-auto w-full max-w-4xl p-10 pb-20 lg:p-14">
            {card.cover ? (
              <div className="mb-8 overflow-hidden rounded-[2rem] border border-gray-100 bg-gray-100 shadow-sm">
                <div className="relative h-[220px] w-full">
                  <img src={card.cover} alt={`${card.title} cover`} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/25 via-transparent to-transparent" />
                </div>
              </div>
            ) : null}

            <div className="mb-8 flex cursor-default items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-500">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <span className="transition-colors hover:text-gray-800">Board Task</span>
              <svg className="mx-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-900">KW-{card.id}</span>
            </div>

            <div className="mb-10 group relative">
              {isEditingTitle ? (
                <textarea
                  className="w-full resize-none rounded-2xl border-none bg-blue-50/50 p-4 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 caret-[#0d6efd] outline-none focus:ring-0"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSaveTitle();
                    }
                  }}
                  autoFocus
                  rows={2}
                />
              ) : (
                <h1
                  className="mx-[-1rem] cursor-pointer rounded-2xl border-2 border-transparent px-4 py-2 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 transition-colors hover:border-gray-100 hover:bg-gray-50"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {card.title}
                </h1>
              )}

              <div className="mt-5 flex flex-wrap gap-3 px-4">
                {isCompleted ? (
                  <>
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Completed
                    </span>
                    <button
                      type="button"
                      onClick={() => reopenCardMutation.mutate()}
                      disabled={reopenCardMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M4.582 9H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2M19.418 15H15" />
                      </svg>
                      Reopen Task
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => completeCardMutation.mutate()}
                    disabled={completeCardMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0d6efd] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Complete Task
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-red-600 transition hover:bg-red-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Task
                </button>
              </div>
            </div>

            <div className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="min-h-[168px] rounded-[1.25rem] border border-gray-100/50 bg-[#f4f6f8] p-5 transition-all hover:border-gray-200 hover:shadow-sm">
                <span className="mb-3 block text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Assignee</span>
                <div className="mb-4 flex items-center gap-3">
                  {card.assignee ? (
                    <>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-sm">
                        {getUserInitial(card.assignee)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold text-gray-900">{getUserDisplayName(card.assignee)}</div>
                        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-400">Current owner</div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white/60 px-3 py-2 text-sm font-bold text-gray-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Unassigned
                    </div>
                  )}
                </div>

                <SelectField
                  options={assigneeOptions}
                  value={assigneeValue}
                  onChange={(value) => assignCardMutation.mutate(value === 'none' ? null : Number(value))}
                  placeholder={isLoadingMembers ? 'Loading members...' : 'Assign teammate'}
                  size="sm"
                  disabled={assignCardMutation.isPending || isLoadingMembers}
                  className="!min-h-[44px] rounded-xl text-[13px]"
                />
              </div>

              <div className="min-h-[168px] rounded-[1.25rem] border border-gray-100/50 bg-[#f4f6f8] p-5 transition-all hover:border-gray-200 hover:shadow-sm">
                <span className="mb-3 block text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Due Date</span>
                <div className="mb-4 flex items-center gap-2.5 text-[15px] font-bold text-[#0d6efd]">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDisplayDate(card.due_date)}</span>
                </div>

                <div className="space-y-3">
                  <DatePickerField
                    value={dueDateValue}
                    onChange={handleDueDateChange}
                    placeholder="Set due date"
                    size="sm"
                    className="!min-h-[44px] rounded-xl text-[13px]"
                  />
                  {card.due_date ? (
                    <button
                      type="button"
                      onClick={handleClearDueDate}
                      className="text-[12px] font-bold text-gray-500 transition hover:text-red-500"
                    >
                      Clear due date
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="min-h-[168px] rounded-[1.25rem] border border-gray-100/50 bg-[#f4f6f8] p-5 transition-all hover:border-gray-200 hover:shadow-sm">
                <span className="mb-3 block text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Status</span>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-bold text-[15px] text-gray-900">
                    <div className={`h-3 w-3 shrink-0 rounded-full ring-4 ${isCompleted ? 'bg-emerald-500 ring-emerald-100' : 'bg-[#0d6efd] ring-blue-100'}`} />
                    {isCompleted ? 'Completed' : currentList?.title || 'In Progress'}
                  </div>
                  {isCompleted ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                      Done
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0d6efd]">
                      Active
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium leading-relaxed text-gray-500">
                    {isCompleted
                      ? `Completed ${formatDisplayDate(card.completed_at)}.`
                      : `Currently in ${currentList?.title || 'this workflow stage'}.`}
                  </p>
                  <SelectField
                    options={listOptions}
                    value={listValue}
                    onChange={handleMoveCard}
                    placeholder="Move to list"
                    size="sm"
                    disabled={moveCardMutation.isPending || listOptions.length === 0}
                    className="!min-h-[44px] rounded-xl text-[13px]"
                  />
                  {!isCompleted ? (
                    <button
                      type="button"
                      onClick={() => completeCardMutation.mutate()}
                      disabled={completeCardMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0d6efd] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Mark complete
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => reopenCardMutation.mutate()}
                      disabled={reopenCardMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M4.582 9H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2M19.418 15H15" />
                      </svg>
                      Reopen task
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-14">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-[22px] font-extrabold leading-none tracking-tight text-gray-900">Cover</h2>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-400">
                  {card.cover ? 'Shown on board cards' : 'No cover selected'}
                </span>
              </div>

              <div className="grid gap-5 rounded-[1.5rem] border border-gray-100 bg-[#f8fafc] p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-sm">
                  {card.cover ? (
                    <div className="relative h-[240px] w-full">
                      <img src={card.cover} alt={`${card.title} cover preview`} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                    </div>
                  ) : (
                    <div className="flex h-[240px] flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,_rgba(13,110,253,0.12),_transparent_55%),linear-gradient(135deg,_#ffffff,_#f4f6f8)] px-8 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0d6efd]/10 text-[#0d6efd]">
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.293-4.293a1 1 0 011.414 0L13 15l3.293-3.293a1 1 0 011.414 0L20 14m-2-10H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2zm-8 4h.01" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-700">Add an image to make this task stand out</div>
                        <div className="mt-2 text-sm text-gray-500">Use a remote image URL or pick one of the uploaded images below.</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4 rounded-[1.25rem] border border-[#dbe7fb] bg-white p-5">
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Source</span>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      Paste an image URL, or use the quick actions in the attachments area to turn any uploaded image into the task cover.
                    </p>
                  </div>

                  {card.cover ? (
                    <div className="rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-gray-700">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-400">Current cover URL</div>
                      <div className="mt-2 truncate">{card.cover}</div>
                    </div>
                  ) : null}

                  {isEditingCover ? (
                    <div className="space-y-3">
                      <input
                        type="url"
                        value={coverUrlInput}
                        onChange={(event) => setCoverUrlInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            handleSaveCover();
                          }
                        }}
                        placeholder="https://example.com/cover.jpg"
                        className="w-full rounded-xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-[#0d6efd]"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleSaveCover}
                          disabled={updateCoverMutation.isPending}
                          className="rounded-xl bg-[#0d6efd] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Save cover
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingCover(false);
                            setCoverUrlInput(card.cover || '');
                          }}
                          className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingCover(true)}
                        className="rounded-xl bg-[#0d6efd] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                      >
                        {card.cover ? 'Change URL' : 'Add from URL'}
                      </button>
                      {card.cover ? (
                        <button
                          type="button"
                          onClick={handleClearCover}
                          disabled={updateCoverMutation.isPending}
                          className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Clear cover
                        </button>
                      ) : null}
                    </div>
                  )}

                  <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fafbfc] px-4 py-3 text-sm leading-relaxed text-gray-500">
                    {imageAttachments.length
                      ? `${imageAttachments.length} image attachment${imageAttachments.length === 1 ? '' : 's'} available for quick cover selection.`
                      : 'Upload an image attachment below to make cover selection even faster.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-14">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-[22px] font-extrabold leading-none tracking-tight text-gray-900">Labels</h2>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-400">
                  {currentLabels.length} selected
                </span>
              </div>

              <div className="rounded-[1.5rem] border border-gray-100 bg-[#f8fafc] p-5">
                <div className="mb-5 flex flex-wrap gap-2">
                  {currentLabels.length ? (
                    currentLabels.map((label) => (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => removeLabelMutation.mutate(label.id)}
                        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white shadow-sm transition hover:opacity-90"
                        style={{ backgroundColor: label.color }}
                      >
                        <span>{label.name}</span>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-400">
                      No labels on this task yet.
                    </div>
                  )}
                </div>

                {availableLabels?.length ? (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {availableLabels.map((label) => {
                      const isSelected = currentLabelIds.has(label.id);
                      return (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => (isSelected ? removeLabelMutation.mutate(label.id) : addLabelMutation.mutate(label.id))}
                          className={`rounded-full border px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] transition ${
                            isSelected ? 'border-transparent text-white shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                          style={isSelected ? { backgroundColor: label.color } : undefined}
                        >
                          {isSelected ? `Selected · ${label.name}` : label.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mb-6 text-sm font-medium text-gray-400">No board labels yet. Create the first one below.</div>
                )}

                <div className="flex flex-col gap-3 rounded-[1.25rem] border border-[#dbe7fb] bg-white p-4 md:flex-row md:items-center">
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(event) => setNewLabelName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleCreateLabel();
                      }
                    }}
                    placeholder="Create and attach a new label"
                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-[#0d6efd]"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={newLabelColor}
                      onChange={(event) => setNewLabelColor(event.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-xl border border-gray-200 bg-white p-1"
                    />
                    <button
                      type="button"
                      onClick={handleCreateLabel}
                      disabled={!newLabelName.trim()}
                      className="rounded-xl bg-[#0d6efd] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add label
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-14">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[22px] font-extrabold leading-none tracking-tight text-gray-900">Description</h2>
                {!isEditingDesc ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDescription(card.description || '');
                      setIsEditingDesc(true);
                    }}
                    className="rounded-lg px-4 py-1.5 text-sm font-bold text-[#0d6efd] transition-colors hover:bg-blue-50"
                  >
                    Edit
                  </button>
                ) : null}
              </div>

              {isEditingDesc ? (
                <div className="rounded-2xl border-2 border-[#0d6efd]/20 bg-[#f8fafc] p-4 transition-colors focus-within:border-[#0d6efd]/50">
                  <MarkdownEditor value={description} onChange={setDescription} placeholder="Write description..." />
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-xl px-5 py-2 text-sm font-bold text-gray-600 transition-colors hover:bg-white"
                      onClick={() => setIsEditingDesc(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-[#0d6efd] px-6 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
                      onClick={handleSaveDescription}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="custom-prose bg-transparent text-[16px] leading-relaxed text-gray-600" onClick={() => !card.description && setIsEditingDesc(true)}>
                  {card.description ? (
                    <MarkdownRenderer content={card.description} />
                  ) : (
                    <div className="cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center transition-colors hover:border-gray-300 hover:bg-gray-50">
                      <span className="font-bold text-gray-400">Add a description...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-14">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <h2 className="text-[22px] font-extrabold leading-none tracking-tight text-gray-900">Subtasks</h2>
                <div className="flex items-center gap-3 rounded-xl bg-[#f8fafc] px-4 py-2">
                  <span className="whitespace-nowrap text-[11px] font-extrabold uppercase tracking-wide text-gray-600">{percent}% Complete</span>
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-[#0d6efd] transition-all duration-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {checklistItems?.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-4 rounded-xl border border-transparent bg-[#f4f6f8] p-4 transition-all hover:border-gray-200 hover:bg-gray-100"
                  >
                    <button
                      type="button"
                      onClick={() => updateChecklistItemMutation.mutate({ id: item.id, data: { completed: !item.completed } })}
                      className="shrink-0 transition-transform active:scale-90"
                    >
                      {item.completed ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0d6efd] text-white shadow-sm ring-4 ring-blue-100">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-400 text-transparent hover:border-gray-500">
                          <div className="h-6 w-6 rounded-full bg-black opacity-0 transition-opacity hover:opacity-10" />
                        </div>
                      )}
                    </button>
                    <span className={`flex-1 text-[15px] font-bold transition-all ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {item.content}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteChecklistItemMutation.mutate(item.id)}
                      className="p-2 text-gray-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {showAddSubtask ? (
                  <div className="flex items-center gap-3 rounded-xl border-2 border-[#0d6efd]/40 bg-[#f8fafc] p-2 pl-4 shadow-inner transition-colors focus-within:border-[#0d6efd]">
                    <div className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-300" />
                    <input
                      type="text"
                      placeholder="What needs to be done?"
                      className="flex-1 bg-transparent p-2 py-2.5 text-[15px] font-bold text-gray-800 placeholder-gray-400 outline-none focus:ring-0"
                      value={newChecklistItem}
                      onChange={(event) => setNewChecklistItem(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          handleChecklistSubmit();
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-1 rounded-lg border border-gray-100 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setShowAddSubtask(false)}
                        className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-gray-100"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={handleChecklistSubmit}
                        disabled={!newChecklistItem.trim()}
                        className="h-8 rounded bg-[#0d6efd] px-4 text-sm font-bold text-white shadow-sm disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddSubtask(true)}
                    className="group mt-2 flex w-full items-center justify-start gap-4 rounded-xl border-2 border-dashed border-gray-200 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex h-6 w-6 items-center justify-center text-gray-400 transition group-hover:text-gray-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-[15px] font-bold tracking-wide text-gray-500 transition group-hover:text-gray-700">Add Subtask</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-[22px] font-extrabold leading-none tracking-tight text-gray-900">Attachments</h2>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-[#dbe7fb] bg-[#eef4ff] px-4 py-2 text-sm font-bold text-[#0d6efd] transition hover:bg-[#e4eeff]"
                >
                  Upload file
                </button>
              </div>

              <div className="flex flex-wrap gap-4">
                {attachments?.map((attachment) => {
                  const isImage = isImageAttachment(attachment);
                  const isCurrentCover = attachment.file_url === card.cover;

                  return (
                    <div
                      key={attachment.id}
                      className="group relative h-[120px] w-[200px] overflow-hidden rounded-[1.25rem] border border-gray-200 bg-[#f4f6f8] shadow-sm transition-colors hover:bg-gray-100"
                    >
                      <a
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-full w-full flex-col items-center justify-center p-4"
                      >
                        {isImage ? (
                          <>
                            <img
                              src={attachment.file_url}
                              alt={attachment.file_name}
                              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/35" />
                            <div className="relative z-10 mt-auto w-full rounded-2xl bg-white/90 p-3 backdrop-blur-sm">
                              <div className="truncate text-[11px] font-extrabold tracking-wide text-gray-900">
                                {attachment.file_name}
                              </div>
                              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                                {formatFileSize(attachment.file_size)}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <svg className="mb-3 h-8 w-8 text-gray-500 transition group-hover:text-[#0d6efd]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <span className="w-full truncate text-center text-[11px] font-extrabold tracking-wide text-gray-800">
                              {attachment.file_name}
                            </span>
                            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                              {formatFileSize(attachment.file_size)}
                            </span>
                          </>
                        )}
                      </a>

                      {isImage ? (
                        <button
                          type="button"
                          onClick={() => handleSelectCover(attachment.file_url)}
                          disabled={isCurrentCover || updateCoverMutation.isPending}
                          className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] shadow-sm transition ${
                            isCurrentCover
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white/90 text-[#0d6efd] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60'
                          }`}
                        >
                          {isCurrentCover ? 'Cover image' : 'Use as cover'}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(attachment)}
                        disabled={deleteAttachmentMutation.isPending || updateCoverMutation.isPending}
                        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-gray-500 shadow-sm opacity-0 transition hover:text-red-500 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-100 disabled:text-gray-300"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      uploadAttachmentMutation.mutate(file);
                    }
                    event.target.value = '';
                  }}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex h-[120px] w-[200px] flex-col items-center justify-center rounded-[1.25rem] border-2 border-dashed border-gray-200 bg-white transition-all hover:border-[#0d6efd] hover:bg-blue-50/30"
                >
                  <svg className="mb-3 h-6 w-6 text-gray-400 transition-colors group-hover:text-[#0d6efd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 transition-colors group-hover:text-[#0d6efd]">
                    Upload
                  </span>
                </button>

                {attachments?.length ? null : (
                  <div className="flex h-[120px] w-[200px] items-center justify-center rounded-[1.25rem] border border-dashed border-gray-200 bg-[#fafbfc] px-6 text-center text-sm font-medium leading-relaxed text-gray-400">
                    No attachments yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex w-full shrink-0 flex-col border-l border-gray-100 bg-[#f4f6f8] md:w-[420px]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-500 shadow-sm transition-all hover:bg-red-50 hover:text-red-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="px-8 pb-6 pt-10">
            <div className="mb-4 flex items-center gap-3">
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 4h5m-8 6h14a2 2 0 002-2V6a2 2 0 00-2-2H7l-4 4v10a2 2 0 002 2z" />
              </svg>
              <h2 className="text-[13px] font-extrabold uppercase tracking-widest text-gray-600">Task Feed</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/70 p-1 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.9)]">
              <button
                type="button"
                onClick={() => setActiveSidebarTab('comments')}
                className={`rounded-[14px] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] transition ${
                  activeSidebarTab === 'comments'
                    ? 'bg-white text-[#0d6efd] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Comments
              </button>
              <button
                type="button"
                onClick={() => setActiveSidebarTab('activity')}
                className={`rounded-[14px] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] transition ${
                  activeSidebarTab === 'activity'
                    ? 'bg-white text-[#0d6efd] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Activity
              </button>
            </div>
          </div>

          <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto px-8 pb-32">
            {activeSidebarTab === 'comments' ? (
              <>
                {comments?.map((comment) => {
                  const isCommentOwner = user?.id === comment.user_id;
                  const isEditing = editingCommentId === comment.id;

                  return (
                    <div key={comment.id} className="group flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-500 text-[12px] font-bold text-white shadow-sm">
                        {getUserInitial(comment.user)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[14px] text-gray-600">
                            <strong className="mr-1 font-bold text-gray-900">{getUserDisplayName(comment.user)}</strong>
                            {isEditing ? 'is editing a comment' : 'added a comment'}
                          </p>
                          {isCommentOwner ? (
                            <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleStartEditingComment(comment)}
                                className="rounded-full p-1.5 text-gray-400 transition hover:bg-white hover:text-[#0d6efd]"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteCommentMutation.mutate(comment.id)}
                                className="rounded-full p-1.5 text-gray-400 transition hover:bg-white hover:text-red-500"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : null}
                        </div>
                        {isEditing ? (
                          <div className="mt-2.5 rounded-2xl rounded-tl-sm border border-[#cfe0ff] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                            <textarea
                              className="w-full resize-none border-none bg-transparent text-[14px] leading-relaxed tracking-wide text-gray-700 outline-none focus:ring-0"
                              rows={4}
                              value={editingCommentContent}
                              onChange={(event) => setEditingCommentContent(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                                  event.preventDefault();
                                  handleSaveEditedComment(comment.id);
                                }
                              }}
                            />
                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingCommentContent('');
                                }}
                                className="rounded-xl px-3 py-2 text-xs font-bold text-gray-500 transition hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditedComment(comment.id)}
                                disabled={!editingCommentContent.trim()}
                                className="rounded-xl bg-[#0d6efd] px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2.5 whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-gray-100 bg-white p-4 text-[14px] leading-relaxed tracking-wide text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                            {comment.content}
                          </div>
                        )}
                        <span className="relative mt-2.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {timeAgo(comment.updated_at || comment.created_at || new Date().toISOString())}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {(!comments || comments.length === 0) && (
                  <div className="rounded-[1.5rem] border border-dashed border-gray-200 bg-white/60 p-6 text-center">
                    <div className="text-sm font-bold text-gray-600">No comments yet</div>
                    <div className="mt-2 text-[13px] font-medium leading-relaxed text-gray-400">
                      Use this space to capture decisions, updates, and handoff notes for the task.
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {isLoadingActivities ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0d6efd] border-t-transparent" />
                  </div>
                ) : activities?.length ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getActivityTone(activity.action)}`}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          {activity.action === 'created' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          ) : activity.action === 'updated' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          ) : activity.action === 'deleted' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          ) : activity.action === 'completed' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          ) : activity.action === 'reopened' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M4.582 9H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2M19.418 15H15" />
                          ) : activity.action === 'assigned' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5V4H2v16h5m10 0v-2a4 4 0 00-8 0v2m8 0H9m4-10a4 4 0 110-8 4 4 0 010 8z" />
                          ) : activity.action === 'added_label' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h6l7 7-9 9-7-7V6a3 3 0 013-3z" />
                          ) : activity.action === 'removed_label' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h6l7 7-9 9-7-7V6a3 3 0 013-3zM9 9l6 6" />
                          ) : activity.action === 'uploaded' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          ) : activity.action === 'moved' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] text-gray-700">
                          <strong className="font-bold text-gray-900">{getActivityLabel(activity)}</strong>
                        </p>
                        {activity.content ? (
                          <div className="mt-2 rounded-2xl rounded-tl-sm border border-gray-100 bg-white p-4 text-[13px] leading-relaxed text-gray-600 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                            {activity.content}
                          </div>
                        ) : null}
                        <span className="mt-2.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {timeAgo(activity.created_at || new Date().toISOString())}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-gray-200 bg-white/60 p-6 text-center">
                    <div className="text-sm font-bold text-gray-600">No activity yet</div>
                    <div className="mt-2 text-[13px] font-medium leading-relaxed text-gray-400">
                      Task updates like completion, assignment, checklist changes, and attachments will appear here.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {activeSidebarTab === 'comments' ? (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#f4f6f8] via-[#f4f6f8] to-transparent p-6 pt-12">
              <div className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-2 pr-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all focus-within:ring-2 focus-within:ring-[#0d6efd]/20">
                <textarea
                  className="w-full resize-none border-none bg-transparent p-3 pb-2 text-[14px] font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0"
                  rows={2}
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleCommentSubmit();
                    }
                  }}
                />
                <div className="flex items-center justify-end gap-2 px-2 pb-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0d6efd] text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                    disabled={!newComment.trim()}
                    onClick={handleCommentSubmit}
                  >
                    <svg className="ml-0.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm animate-slide-up-fade rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-2xl">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="mb-2 text-[22px] font-extrabold text-gray-900">Delete Task?</h3>
              <p className="mb-8 text-[15px] font-medium leading-relaxed text-gray-500">
                This action cannot be undone. This task and all its data will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteCardMutation.mutate()}
                  className="flex-1 rounded-xl bg-red-500 py-3 font-bold text-white shadow-md shadow-red-500/20 transition-all hover:bg-red-600 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
