import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardApi, projectApi, swimlaneApi, webhookApi, transitionRuleApi, labelApi, userApi, listApi } from '@/services/api';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { SelectField } from '@/components/SelectField';
import { useAuth } from '@/context/AuthContext';
import type {
  BoardMember,
  Swimlane,
  Webhook,
  ListTransitionRule,
  Label,
  List,
  User,
  ListAutoAssignment,
  CreateWebhookRequest,
} from '@/types';

interface BoardSettingsModalProps {
  boardId: number;
  onClose: () => void;
  onDeleted?: () => void;
  onLeftBoard?: () => void;
}

type ManageableMemberRole = 'admin' | 'member' | 'observer';
type WebhookEvent = CreateWebhookRequest['events'][number];
type WebhookDraft = { url: string; events: WebhookEvent[]; isActive: boolean; secret: string };

const memberRoleOptions = [
  { value: 'admin', label: 'Admin', description: 'Can manage members, settings, and board structure.' },
  { value: 'member', label: 'Member', description: 'Can work on cards and collaborate on the board.' },
  { value: 'observer', label: 'Observer', description: 'Can view board progress without making changes.' },
];

const webhookEventOptions: readonly WebhookEvent[] = [
  'card.created',
  'card.updated',
  'card.moved',
  'card.deleted',
  'card.completed',
  'card.assigned',
  'comment.created',
  'checklist.completed',
];

function normalizeEventSelection(events: readonly string[]) {
  return [...events].sort().join('|');
}

function toWebhookEvents(events: readonly string[]): WebhookEvent[] {
  return webhookEventOptions.filter((event) => events.includes(event));
}

function getUserDisplayName(user?: User | null) {
  return user?.nickname || user?.username || 'Unknown user';
}

function getUserInitial(user?: User | null) {
  return getUserDisplayName(user).charAt(0).toUpperCase();
}

export function BoardSettingsModal({ boardId, onClose, onDeleted, onLeftBoard }: BoardSettingsModalProps) {
  const [activeSection, setActiveSection] = useState<string>('general');
  const [ruleFromId, setRuleFromId] = useState('');
  const [ruleToId, setRuleToId] = useState('');
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteRole, setInviteRole] = useState<ManageableMemberRole>('member');
  const [boardForm, setBoardForm] = useState({
    title: '',
    description: '',
    color: '#0d6efd',
    is_public: false,
    project_id: 'none',
  });
  const [generalError, setGeneralError] = useState('');
  const [generalNotice, setGeneralNotice] = useState('');
  const [memberError, setMemberError] = useState('');
  const [memberNotice, setMemberNotice] = useState('');
  const [swimlaneError, setSwimlaneError] = useState('');
  const [swimlaneNotice, setSwimlaneNotice] = useState('');
  const [listError, setListError] = useState('');
  const [listNotice, setListNotice] = useState('');
  const [labelError, setLabelError] = useState('');
  const [labelNotice, setLabelNotice] = useState('');
  const [automationError, setAutomationError] = useState('');
  const [automationNotice, setAutomationNotice] = useState('');
  const [autoAssignmentDrafts, setAutoAssignmentDrafts] = useState<Record<number, string>>({});
  const [listDrafts, setListDrafts] = useState<Record<number, { title: string; wipLimit: string }>>({});
  const [swimlaneDrafts, setSwimlaneDrafts] = useState<Record<number, { name: string; color: string }>>({});
  const [labelDrafts, setLabelDrafts] = useState<Record<number, { name: string; color: string }>>({});
  const [webhookDrafts, setWebhookDrafts] = useState<Record<number, WebhookDraft>>({});
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Queries
  const { data: board } = useQuery({ queryKey: ['board', boardId], queryFn: () => boardApi.getOne(boardId) });
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: () => projectApi.getAll() });
  const { data: members } = useQuery({ queryKey: ['board', boardId, 'members'], queryFn: () => boardApi.getMembers(boardId) });
  const { data: swimlanes } = useQuery({ queryKey: ['board', boardId, 'swimlanes'], queryFn: () => swimlaneApi.getAll(boardId) });
  const { data: labels } = useQuery({ queryKey: ['labels', boardId], queryFn: () => labelApi.getAll(boardId) });
  const { data: webhooks } = useQuery({ queryKey: ['board', boardId, 'webhooks'], queryFn: () => webhookApi.getAll(boardId) });
  const { data: rules } = useQuery({ queryKey: ['board', boardId, 'transition-rules'], queryFn: () => transitionRuleApi.getAll(boardId) });
  const { data: inviteCandidatesData, isFetching: isSearchingUsers } = useQuery({
    queryKey: ['users', 'search', boardId, inviteQuery],
    queryFn: () =>
      userApi.search({
        q: inviteQuery.trim() || undefined,
        limit: 8,
        exclude_board_id: boardId,
    }),
    enabled: showInvitePanel,
  });
  const boardData = board?.data;
  const lists = boardData?.lists || [];
  const memberList = members?.data || [];
  const currentBoardMember = memberList.find((member) => member.user_id === user?.id);
  const isBoardOwner = !!user && boardData?.owner_id === user.id;
  const canManageMembers = isBoardOwner || ['owner', 'admin'].includes(currentBoardMember?.role || '');

  const autoAssignmentQueries = useQueries({
    queries: lists.map((list) => ({
      queryKey: ['list', list.id, 'auto-assignments'],
      queryFn: () => listApi.getAutoAssignments(list.id),
      enabled: !!list.id,
    })),
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (data: { userId: number; role: ManageableMemberRole }) =>
      boardApi.addMember(boardId, { user_id: data.userId, role: data.role }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setMemberError('');
      setMemberNotice(`${getUserDisplayName(response.data.user)} joined the board as ${response.data.role}.`);
      setInviteQuery('');
    },
    onError: (error: any) => {
      setMemberNotice('');
      setMemberError(error.response?.data?.error || 'Failed to add member');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (data: { userId: number; role: 'admin' | 'member' | 'observer' }) => boardApi.updateMemberRole(boardId, data.userId, { role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'members'] });
      setMemberError('');
      setMemberNotice('Member permissions updated.');
    },
    onError: (error: any) => {
      setMemberNotice('');
      setMemberError(error.response?.data?.error || 'Failed to update member role');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => boardApi.removeMember(boardId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setMemberError('');
      setMemberNotice('Member removed from the board.');
    },
    onError: (error: any) => {
      setMemberNotice('');
      setMemberError(error.response?.data?.error || 'Failed to remove member');
    },
  });

  const createSwimlaneMutation = useMutation({
    mutationFn: (name: string) => swimlaneApi.create(boardId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'swimlanes'] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setSwimlaneError('');
      setSwimlaneNotice('Swimlane created.');
    },
    onError: (error: any) => {
      setSwimlaneNotice('');
      setSwimlaneError(error.response?.data?.error || 'Failed to create swimlane');
    },
  });

  const updateSwimlaneMutation = useMutation({
    mutationFn: (data: { id: number; name: string; color: string }) =>
      swimlaneApi.update(data.id, {
        name: data.name.trim(),
        color: data.color,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'swimlanes'] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setSwimlaneError('');
      setSwimlaneNotice('Swimlane updated.');
      setSwimlaneDrafts((current) => ({
        ...current,
        [variables.id]: {
          name: variables.name.trim(),
          color: variables.color,
        },
      }));
    },
    onError: (error: any) => {
      setSwimlaneNotice('');
      setSwimlaneError(error.response?.data?.error || 'Failed to update swimlane');
    },
  });

  const deleteSwimlaneMutation = useMutation({
    mutationFn: (id: number) => swimlaneApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'swimlanes'] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setSwimlaneError('');
      setSwimlaneNotice('Swimlane removed.');
    },
    onError: (error: any) => {
      setSwimlaneNotice('');
      setSwimlaneError(error.response?.data?.error || 'Failed to delete swimlane');
    },
  });

  const updateListMutation = useMutation({
    mutationFn: (data: { listId: number; title: string; wipLimit: string }) => {
      const payload = {
        title: data.title.trim(),
        wip_limit: data.wipLimit.trim() === '' ? null : Number(data.wipLimit),
      };

      return listApi.update(data.listId, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'wip-status'] });
      setListError('');
      setListNotice('List settings updated.');
      setListDrafts((current) => ({
        ...current,
        [variables.listId]: {
          title: variables.title.trim(),
          wipLimit: variables.wipLimit.trim(),
        },
      }));
    },
    onError: (error: any) => {
      setListNotice('');
      setListError(error.response?.data?.error || 'Failed to update list');
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: (listId: number) => listApi.delete(listId),
    onSuccess: (response, listId) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'wip-status'] });
      queryClient.removeQueries({ queryKey: ['list', listId, 'auto-assignments'] });
      setListError('');
      setListNotice(response.data?.message || 'List deleted.');
    },
    onError: (error: any) => {
      setListNotice('');
      setListError(error.response?.data?.error || 'Failed to delete list');
    },
  });

  const createLabelMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => labelApi.create(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
      setLabelError('');
      setLabelNotice('Label created.');
    },
    onError: (error: any) => {
      setLabelNotice('');
      setLabelError(error.response?.data?.error || 'Failed to create label');
    },
  });

  const updateLabelMutation = useMutation({
    mutationFn: (data: { id: number; name: string; color: string }) =>
      labelApi.update(data.id, {
        name: data.name.trim(),
        color: data.color,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
      setLabelError('');
      setLabelNotice('Label updated.');
      setLabelDrafts((current) => ({
        ...current,
        [variables.id]: {
          name: variables.name.trim(),
          color: variables.color,
        },
      }));
    },
    onError: (error: any) => {
      setLabelNotice('');
      setLabelError(error.response?.data?.error || 'Failed to update label');
    },
  });

  const deleteLabelMutation = useMutation({
    mutationFn: (id: number) => labelApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
      setLabelError('');
      setLabelNotice('Label removed.');
    },
    onError: (error: any) => {
      setLabelNotice('');
      setLabelError(error.response?.data?.error || 'Failed to delete label');
    },
  });

  const createWebhookMutation = useMutation({
    mutationFn: (data: { url: string; events: WebhookEvent[]; secret?: string }) => webhookApi.create(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'webhooks'] });
      setAutomationError('');
      setAutomationNotice('Webhook added.');
    },
    onError: (error: any) => {
      setAutomationNotice('');
      setAutomationError(error.response?.data?.error || 'Failed to add webhook');
    },
  });

  const updateWebhookMutation = useMutation({
    mutationFn: (data: { id: number; url: string; events: WebhookEvent[]; isActive: boolean; secret: string }) => {
      const payload: {
        url: string;
        events: string[];
        is_active: boolean;
        secret?: string;
      } = {
        url: data.url.trim(),
        events: data.events,
        is_active: data.isActive,
      };

      if (data.secret.trim()) {
        payload.secret = data.secret.trim();
      }

      return webhookApi.update(data.id, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'webhooks'] });
      setAutomationError('');
      setAutomationNotice('Webhook updated.');
      setWebhookDrafts((current) => ({
        ...current,
        [variables.id]: {
          url: variables.url.trim(),
          events: variables.events,
          isActive: variables.isActive,
          secret: '',
        },
      }));
    },
    onError: (error: any) => {
      setAutomationNotice('');
      setAutomationError(error.response?.data?.error || 'Failed to update webhook');
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: number) => webhookApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'webhooks'] });
      setAutomationError('');
      setAutomationNotice('Webhook removed.');
    },
    onError: (error: any) => {
      setAutomationNotice('');
      setAutomationError(error.response?.data?.error || 'Failed to remove webhook');
    },
  });

  const setAutoAssignmentMutation = useMutation({
    mutationFn: (data: { listId: number; userId: number }) =>
      listApi.setAutoAssignment(data.listId, { user_id: data.userId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['list', variables.listId, 'auto-assignments'] });
      setAutomationError('');
      setAutomationNotice('Auto-assignment rule saved.');
      setAutoAssignmentDrafts((current) => {
        const next = { ...current };
        delete next[variables.listId];
        return next;
      });
    },
    onError: (error: any) => {
      setAutomationNotice('');
      setAutomationError(error.response?.data?.error || 'Failed to save auto-assignment rule');
    },
  });

  const deleteAutoAssignmentMutation = useMutation({
    mutationFn: (listId: number) => listApi.deleteAutoAssignment(listId),
    onSuccess: (_, listId) => {
      queryClient.invalidateQueries({ queryKey: ['list', listId, 'auto-assignments'] });
      setAutomationError('');
      setAutomationNotice('Auto-assignment rule removed.');
      setAutoAssignmentDrafts((current) => {
        const next = { ...current };
        delete next[listId];
        return next;
      });
    },
    onError: (error: any) => {
      setAutomationNotice('');
      setAutomationError(error.response?.data?.error || 'Failed to remove auto-assignment rule');
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: (id: number) => webhookApi.test(id),
    onSuccess: (response) => {
      setAutomationError('');
      setAutomationNotice(response.data.message || 'Webhook test delivered.');
    },
    onError: (error: any) => {
      setAutomationNotice('');
      setAutomationError(error.response?.data?.error || 'Failed to test webhook');
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: { from_list_id: number; to_list_id: number }) => transitionRuleApi.create(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'transition-rules'] });
      setAutomationError('');
      setAutomationNotice('Transition rule added.');
    },
    onError: (error: any) => {
      setAutomationNotice('');
      setAutomationError(error.response?.data?.error || 'Failed to add transition rule');
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => transitionRuleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'transition-rules'] });
      setAutomationError('');
      setAutomationNotice('Transition rule removed.');
    },
    onError: (error: any) => {
      setAutomationNotice('');
      setAutomationError(error.response?.data?.error || 'Failed to remove transition rule');
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: () =>
      boardApi.update(boardId, {
        title: boardForm.title.trim(),
        description: boardForm.description.trim() || '',
        color: boardForm.color,
        is_public: boardForm.is_public,
        project_id: boardForm.project_id === 'none' ? 0 : Number(boardForm.project_id),
      }),
    onSuccess: (response) => {
      const previousProjectId = board?.data.project_id;
      const nextProjectId = response.data.project_id;

      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      if (previousProjectId) {
        queryClient.invalidateQueries({ queryKey: ['project', previousProjectId] });
      }
      if (nextProjectId) {
        queryClient.invalidateQueries({ queryKey: ['project', nextProjectId] });
      }

      setGeneralError('');
      setGeneralNotice('Board settings saved.');
    },
    onError: (error: any) => {
      setGeneralNotice('');
      setGeneralError(error.response?.data?.error || 'Failed to save board settings');
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: () => boardApi.delete(boardId),
    onSuccess: () => {
      const projectId = board?.data.project_id;

      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }

      if (onDeleted) {
        onDeleted();
        return;
      }

      onClose();
    },
    onError: (error: any) => {
      setGeneralNotice('');
      setGeneralError(error.response?.data?.error || 'Failed to delete board');
    },
  });

  const leaveBoardMutation = useMutation({
    mutationFn: () => boardApi.leave(boardId),
    onSuccess: () => {
      const projectId = board?.data.project_id;

      queryClient.removeQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }

      if (onLeftBoard) {
        onLeftBoard();
        return;
      }

      onClose();
    },
    onError: (error: any) => {
      setMemberNotice('');
      setMemberError(error.response?.data?.error || 'Failed to leave board');
    },
  });

  const projectOptions = useMemo(
    () => [
      { value: 'none', label: 'Standalone Board', description: 'Keep this board outside of any project.' },
      ...((projects?.data || []).map((project) => ({
        value: String(project.id),
        label: project.title,
        description: project.description || 'Move this board into the selected project.',
      }))),
    ],
    [projects?.data]
  );

  const inviteCandidates = useMemo(() => {
    const existingMemberIds = new Set(memberList.map((member) => member.user_id));
    return (inviteCandidatesData?.data || []).filter((candidate) => !existingMemberIds.has(candidate.id));
  }, [inviteCandidatesData?.data, memberList]);

  const autoAssignmentOptions = useMemo(
    () => [
      {
        value: '',
        label: 'No Auto Assignee',
        description: 'Cards keep their current assignee when they enter this status.',
      },
      ...memberList.map((member) => ({
        value: String(member.user_id),
        label: getUserDisplayName(member.user),
        description: `Role: ${member.role}`,
      })),
    ],
    [memberList]
  );

  const autoAssignmentsByListId = useMemo(() => {
    const entries = lists.map((list, index) => {
      const assignment = autoAssignmentQueries[index]?.data?.data?.[0] || null;
      return [list.id, assignment] as const;
    });

    return Object.fromEntries(entries) as Record<number, ListAutoAssignment | null>;
  }, [lists, autoAssignmentQueries]);

  useEffect(() => {
    if (!boardData) return;

    setBoardForm({
      title: boardData.title || '',
      description: boardData.description || '',
      color: boardData.color || '#0d6efd',
      is_public: !!boardData.is_public,
      project_id: boardData.project_id ? String(boardData.project_id) : 'none',
    });
    setListDrafts(
      Object.fromEntries(
        (boardData.lists || []).map((list) => [
          list.id,
          {
            title: list.title || '',
            wipLimit: list.wip_limit == null ? '' : String(list.wip_limit),
          },
        ])
      )
    );
    setGeneralError('');
    setGeneralNotice('');
    setListError('');
    setListNotice('');
  }, [boardData]);

  useEffect(() => {
    setSwimlaneDrafts(
      Object.fromEntries(
        (swimlanes?.data || []).map((swimlane) => [
          swimlane.id,
          {
            name: swimlane.name || '',
            color: swimlane.color || '#0d6efd',
          },
        ])
      )
    );
    setSwimlaneError('');
    setSwimlaneNotice('');
  }, [swimlanes?.data]);

  useEffect(() => {
    setLabelDrafts(
      Object.fromEntries(
        (labels?.data || []).map((label) => [
          label.id,
          {
            name: label.name || '',
            color: label.color || '#0d6efd',
          },
        ])
      )
    );
    setLabelError('');
    setLabelNotice('');
  }, [labels?.data]);

  useEffect(() => {
    setWebhookDrafts(
      Object.fromEntries(
        (webhooks?.data || []).map((webhook) => [
          webhook.id,
          {
            url: webhook.url || '',
            events: toWebhookEvents(webhook.events || []),
            isActive: webhook.is_active,
            secret: '',
          },
        ])
      )
    );
  }, [webhooks?.data]);

  useEffect(() => {
    setShowInvitePanel(false);
    setInviteQuery('');
    setInviteRole('member');
    setMemberError('');
    setMemberNotice('');
    setSwimlaneError('');
    setSwimlaneNotice('');
    setListError('');
    setListNotice('');
    setLabelError('');
    setLabelNotice('');
    setAutomationError('');
    setAutomationNotice('');
    setAutoAssignmentDrafts({});
    setListDrafts({});
    setSwimlaneDrafts({});
    setLabelDrafts({});
    setWebhookDrafts({});
  }, [boardId]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const openInvitePanel = () => {
    if (!canManageMembers) return;
    setShowInvitePanel(true);
    scrollToSection('team');
  };

  // Static assets for mock visual design
  const defaultAva = "https://i.pravatar.cc/150?u=a04258114e29026702d";

  return (
    <div className="fixed inset-0 z-[150] bg-[#fbfcfd] flex flex-col font-sans animate-slide-up-fade">
      {/* Top Navbar */}
      <header className="h-[72px] bg-white flex items-center justify-between px-8 shrink-0 border-b border-gray-100 z-10 w-full">
        <div className="flex items-center gap-12 h-full">
          <div className="font-extrabold text-[17px] text-gray-900 tracking-tight">The Fluid Architect</div>
          <div className="flex items-end h-full mt-1.5">
            <a href="#" onClick={(e) => { e.preventDefault(); onClose(); }} className="text-gray-500 font-semibold pb-4 px-2 hover:text-gray-900 mr-6 transition-colors">Dashboard</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onClose(); }} className="text-gray-500 font-semibold pb-4 px-2 hover:text-gray-900 mr-6 transition-colors">Boards</a>
            <a href="#" className="text-gray-500 font-semibold pb-4 px-2 hover:text-gray-900 mr-6 transition-colors">Teams</a>
            <a href="#" className="text-[#0d6efd] font-bold pb-4 px-2 border-b-[3px] border-[#0d6efd]">Settings</a>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <button className="text-gray-400 hover:text-gray-600">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </button>
          <button className="text-gray-400 hover:text-gray-600">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden ml-1 border border-gray-100 cursor-pointer">
             <img src={defaultAva} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Settings Left Sidebar */}
        <aside className="w-[280px] bg-[#fbfcfd] flex flex-col justify-between shrink-0 border-r border-gray-100/60 pb-8 py-8">
          <div>
            <div className="px-8 flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-[#0d6efd] rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="font-extrabold text-[#0d6efd] leading-none text-[15px]">{boardData?.title || 'Project Alpha'}</h2>
                <p className="text-[10px] text-gray-400 font-extrabold tracking-widest mt-1.5 uppercase">Premium Tier</p>
              </div>
            </div>

            <nav className="space-y-1">
              <button className="w-full flex items-center gap-4 px-8 py-3 text-gray-500 hover:bg-gray-100/50 hover:text-gray-900 transition-colors text-[14px] font-bold">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                User Profile
              </button>
              <button className="w-full flex items-center gap-4 px-8 py-3 bg-blue-50/50 text-[#0d6efd] border-l-[3px] border-[#0d6efd] transition-colors text-[14px] font-bold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 8h5" /></svg>
                Workspace
              </button>
              <button className="w-full flex items-center gap-4 px-8 py-3 text-gray-500 hover:bg-gray-100/50 hover:text-gray-900 transition-colors text-[14px] font-bold border-l-[3px] border-transparent">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Team
              </button>
              <button className="w-full flex items-center gap-4 px-8 py-3 text-gray-500 hover:bg-gray-100/50 hover:text-gray-900 transition-colors text-[14px] font-bold border-l-[3px] border-transparent">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Notifications
              </button>
              <button onClick={() => setActiveSection('analytics')} className={`w-full flex items-center gap-4 px-8 py-3 text-gray-500 hover:bg-gray-100/50 hover:text-gray-900 transition-colors text-[14px] font-bold border-l-[3px] border-transparent ${activeSection === 'analytics' ? 'bg-blue-50/50 text-[#0d6efd] border-[#0d6efd]' : ''}`}>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Analytics
              </button>
            </nav>
          </div>

          <div className="px-8 mt-auto pt-8">
            <button
              type="button"
              onClick={openInvitePanel}
              disabled={!canManageMembers}
              className="mb-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d6efd] py-3 text-[13px] font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Invite Member
            </button>
            
            <a href="#" className="flex items-center gap-3 text-gray-500 hover:text-gray-900 text-sm font-bold mb-5 transition-colors">
               <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
               Logout
            </a>
            <a href="#" className="flex items-center gap-3 text-gray-500 hover:text-gray-900 text-sm font-bold transition-colors">
               <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Support
            </a>
          </div>
        </aside>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto px-12 lg:px-20 py-12 custom-scrollbar relative">
           
           <div className="max-w-[1000px] flex gap-12">
              
              {/* Inner Anchor Nav */}
              <div className="w-48 shrink-0 hidden lg:block sticky top-0 h-fit">
                 <h1 className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-none mb-4">Settings</h1>
                 <p className="text-gray-500 text-[13px] font-medium leading-relaxed mb-10">Manage your workspace preferences, labels, automations and team permissions.</p>

                 <div className="bg-white rounded-xl py-3 px-2 shadow-sm border border-gray-100">
                    <button onClick={() => scrollToSection('general')} className={`w-full flex items-center gap-3 px-4 py-2 text-[14px] font-bold rounded-lg transition-colors ${activeSection === 'general' ? 'bg-[#f4f6f8] text-[#0d6efd]' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" /></svg>
                        General
                    </button>
                    <button onClick={() => scrollToSection('team')} className={`w-full flex items-center gap-3 px-4 py-2 text-[14px] font-bold rounded-lg transition-colors ${activeSection === 'team' ? 'bg-[#f4f6f8] text-[#0d6efd]' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        Team
                    </button>
                    <button onClick={() => scrollToSection('lists')} className={`w-full flex items-center gap-3 px-4 py-2 mt-1 text-[14px] font-bold rounded-lg transition-colors ${activeSection === 'lists' ? 'bg-[#f4f6f8] text-[#0d6efd]' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h16" /></svg>
                        Lists
                    </button>
                    <button onClick={() => scrollToSection('swimlanes')} className={`w-full flex items-center gap-3 px-4 py-2 mt-1 text-[14px] font-bold rounded-lg transition-colors ${activeSection === 'swimlanes' ? 'bg-[#f4f6f8] text-[#0d6efd]' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
                        Swimlanes
                    </button>
                    <button onClick={() => scrollToSection('labels')} className={`w-full flex items-center gap-3 px-4 py-2 mt-1 text-[14px] font-bold rounded-lg transition-colors ${activeSection === 'labels' ? 'bg-[#f4f6f8] text-[#0d6efd]' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                        Labels
                    </button>
                    <button onClick={() => scrollToSection('automations')} className={`w-full flex items-center gap-3 px-4 py-2 mt-1 text-[14px] font-bold rounded-lg transition-colors ${activeSection === 'automations' ? 'bg-[#f4f6f8] text-[#0d6efd]' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Automations
                    </button>
                 </div>
              </div>

              {/* Cards Flow */}
              <div className="flex-1 space-y-8 pb-32">
                 
                 {activeSection === 'analytics' ? (
                   <div className="bg-white rounded-[1.5rem] p-8 lg:p-10 shadow-sm border border-gray-100">
                     <h3 className="text-xl font-extrabold text-gray-900 mb-6 tracking-tight">Analytics & Reports</h3>
                     <AnalyticsDashboard boardId={boardId} />
                   </div>
                 ) : (
                   <>
                     <div id="general" className="bg-white rounded-[1.5rem] p-8 lg:p-10 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between gap-6 mb-8">
                           <div>
                              <h3 className="text-xl font-extrabold text-gray-900 mb-1.5 tracking-tight">Board Basics</h3>
                              <p className="text-[13px] text-gray-500 font-medium">Update the board title, project placement, visibility, and identity color.</p>
                           </div>
                           <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] px-4 py-3 text-right">
                              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-400">Owner</div>
                              <div className="mt-1 text-[14px] font-bold text-gray-900">
                                 {boardData?.owner?.nickname || boardData?.owner?.username || 'Unknown'}
                              </div>
                           </div>
                        </div>

                        {generalError ? (
                          <div className="mb-5 rounded-xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#b42318]">
                            {generalError}
                          </div>
                        ) : null}

                        {generalNotice ? (
                          <div className="mb-5 rounded-xl border border-[#d4f0dd] bg-[#edf9f1] px-4 py-3 text-sm font-semibold text-[#027a48]">
                            {generalNotice}
                          </div>
                        ) : null}

                        <div className="grid gap-6 md:grid-cols-2">
                           <label className="block md:col-span-2">
                              <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Board Name</span>
                              <input
                                type="text"
                                value={boardForm.title}
                                onChange={(event) => setBoardForm((current) => ({ ...current, title: event.target.value }))}
                                className="h-14 w-full rounded-2xl border border-[#d9e3ef] bg-white px-5 text-[15px] font-semibold text-[#162231] outline-none transition focus:border-[#b7cbe0]"
                              />
                           </label>

                           <label className="block md:col-span-2">
                              <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Description</span>
                              <textarea
                                rows={4}
                                value={boardForm.description}
                                onChange={(event) => setBoardForm((current) => ({ ...current, description: event.target.value }))}
                                className="w-full rounded-[24px] border border-[#d9e3ef] bg-white px-5 py-4 text-[15px] font-medium leading-7 text-[#162231] outline-none transition focus:border-[#b7cbe0]"
                              />
                           </label>

                           <div className="block">
                              <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Linked Project</span>
                              <SelectField
                                size="lg"
                                value={boardForm.project_id}
                                onChange={(nextValue) => setBoardForm((current) => ({ ...current, project_id: nextValue }))}
                                options={projectOptions}
                              />
                           </div>

                           <div className="block">
                              <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Visibility</span>
                              <div className="flex items-center justify-between rounded-2xl border border-[#d9e3ef] bg-white px-5 py-4">
                                <div>
                                  <div className="text-[15px] font-semibold text-[#162231]">
                                    {boardForm.is_public ? 'Public board' : 'Private board'}
                                  </div>
                                  <div className="mt-1 text-[12px] font-medium text-[#6b7b90]">
                                    {boardForm.is_public ? 'Visible to anyone with workspace access.' : 'Visible only to board members.'}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setBoardForm((current) => ({ ...current, is_public: !current.is_public }))}
                                  className={`relative h-8 w-14 rounded-full transition ${boardForm.is_public ? 'bg-[#0f4fe6]' : 'bg-[#d7e1ec]'}`}
                                >
                                  <span
                                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${boardForm.is_public ? 'left-7' : 'left-1'}`}
                                  />
                                </button>
                              </div>
                           </div>

                           <div className="block">
                              <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Accent Color</span>
                              <div className="flex items-center gap-4 rounded-2xl border border-[#d9e3ef] bg-white px-5 py-4">
                                <input
                                  type="color"
                                  value={boardForm.color}
                                  onChange={(event) => setBoardForm((current) => ({ ...current, color: event.target.value }))}
                                  className="h-12 w-14 cursor-pointer rounded-xl border-0 bg-transparent p-0"
                                />
                                <div>
                                  <div className="text-[15px] font-semibold text-[#162231]">{boardForm.color}</div>
                                  <div className="mt-1 text-[12px] font-medium text-[#6b7b90]">Used across cards and board entry points.</div>
                                </div>
                              </div>
                           </div>

                           <div className="block">
                              <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Board ID</span>
                              <div className="flex h-[88px] items-center rounded-2xl border border-[#d9e3ef] bg-[#f8fafc] px-5">
                                <div>
                                  <div className="text-[15px] font-semibold text-[#162231]">#{boardId}</div>
                                  <div className="mt-1 text-[12px] font-medium text-[#6b7b90]">Reference this ID for automations and integrations.</div>
                                </div>
                              </div>
                           </div>
                        </div>

                        {isBoardOwner ? (
                          <div className="mt-8 rounded-[24px] border border-[#ffd7d7] bg-[#fff8f8] p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h4 className="text-[16px] font-extrabold text-[#b42318]">Danger Zone</h4>
                                <p className="mt-2 text-[13px] font-medium leading-6 text-[#7a3b3b]">
                                  Deleting the board will remove its lists, cards, and board-level setup from the workspace.
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={deleteBoardMutation.isPending}
                                onClick={() => {
                                  if (window.confirm(`Delete board "${boardData?.title || boardForm.title}"? This cannot be undone.`)) {
                                    deleteBoardMutation.mutate();
                                  }
                                }}
                                className="inline-flex items-center justify-center rounded-2xl bg-[#b42318] px-5 py-3 text-[14px] font-bold text-white transition hover:bg-[#9f1c12] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deleteBoardMutation.isPending ? 'Deleting...' : 'Delete Board'}
                              </button>
                            </div>
                          </div>
                        ) : null}
                     </div>

                     {/* Team Management */}
                     <div id="team" className="bg-white rounded-[1.5rem] p-8 lg:p-10 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                           <div>
                              <h3 className="text-xl font-extrabold text-gray-900 mb-1.5 tracking-tight">Team Management</h3>
                              <p className="text-[13px] text-gray-500 font-medium">Invite and manage roles for your workspace members.</p>
                           </div>
                           <button
                             type="button"
                             onClick={openInvitePanel}
                             disabled={!canManageMembers}
                             className="flex items-center gap-2 rounded-xl bg-[#0d6efd] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                           >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                             Invite Member
                           </button>
                        </div>

                        {!canManageMembers ? (
                          <div className="mb-6 rounded-2xl border border-gray-100 bg-[#f8fafc] px-5 py-4 text-sm font-medium text-gray-500">
                            Only board owners and admins can invite teammates or change member roles.
                          </div>
                        ) : null}

                        {memberError ? (
                          <div className="mb-5 rounded-xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#b42318]">
                            {memberError}
                          </div>
                        ) : null}

                        {memberNotice ? (
                          <div className="mb-5 rounded-xl border border-[#d4f0dd] bg-[#edf9f1] px-4 py-3 text-sm font-semibold text-[#027a48]">
                            {memberNotice}
                          </div>
                        ) : null}

                        {showInvitePanel && canManageMembers ? (
                          <div className="mb-8 rounded-[1.75rem] border border-[#dbe7fb] bg-[#f8fbff] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h4 className="text-[16px] font-extrabold text-gray-900">Add Existing User To Board</h4>
                                <p className="mt-1 text-[13px] font-medium text-gray-500">
                                  Search by username, nickname, or email. This adds the user directly to the board.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowInvitePanel(false);
                                  setInviteQuery('');
                                }}
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                              >
                                Close
                              </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                              <input
                                type="text"
                                value={inviteQuery}
                                onChange={(event) => {
                                  setInviteQuery(event.target.value);
                                  setMemberError('');
                                  setMemberNotice('');
                                }}
                                placeholder="Search teammates by name or email"
                                className="h-14 rounded-2xl border border-[#d9e3ef] bg-white px-5 text-[15px] font-semibold text-[#162231] outline-none transition placeholder:text-[#7b8ba2] focus:border-[#b7cbe0]"
                              />
                              <SelectField
                                size="lg"
                                value={inviteRole}
                                onChange={(value) => setInviteRole(value as ManageableMemberRole)}
                                options={memberRoleOptions}
                              />
                            </div>

                            <div className="mt-5 space-y-3">
                              {isSearchingUsers ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-6 text-center text-sm font-medium text-gray-400">
                                  Searching workspace users...
                                </div>
                              ) : inviteCandidates.length ? (
                                inviteCandidates.map((candidate) => (
                                  <div
                                    key={candidate.id}
                                    className="flex flex-col gap-4 rounded-2xl border border-white/80 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div className="flex items-center gap-4">
                                      {candidate.avatar ? (
                                        <img
                                          src={candidate.avatar}
                                          alt={getUserDisplayName(candidate)}
                                          className="h-11 w-11 rounded-xl object-cover shadow-sm"
                                        />
                                      ) : (
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-[13px] font-extrabold text-white shadow-sm">
                                          {getUserInitial(candidate)}
                                        </div>
                                      )}
                                      <div>
                                        <div className="font-extrabold text-gray-900 text-[14px]">{getUserDisplayName(candidate)}</div>
                                        <div className="text-[12px] text-gray-400 font-medium mt-0.5">
                                          {candidate.email || candidate.username}
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => addMemberMutation.mutate({ userId: candidate.id, role: inviteRole })}
                                      disabled={addMemberMutation.isPending}
                                      className="inline-flex items-center justify-center rounded-xl bg-[#0d6efd] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {addMemberMutation.isPending ? 'Adding...' : `Add as ${memberRoleOptions.find((option) => option.value === inviteRole)?.label}`}
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-6 text-center text-sm font-medium text-gray-400">
                                  {inviteQuery.trim()
                                    ? 'No matching users found outside this board.'
                                    : 'Start typing to search the workspace, or choose from the latest users shown here.'}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}
                        
                        <div className="space-y-4">
                           {members?.data?.map((member: BoardMember) => {
                             const name = getUserDisplayName(member.user);
                             return (
                               <div key={member.id} className="flex items-center justify-between group py-3 pr-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 -mx-4 px-4 rounded-xl transition-colors">
                                  <div className="flex items-center gap-4">
                                     {member.user?.avatar ? (
                                       <img
                                         src={member.user.avatar}
                                         alt={name}
                                         className="h-11 w-11 rounded-xl object-cover shadow-sm"
                                       />
                                     ) : (
                                       <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[13px] font-extrabold shadow-sm">
                                          {getUserInitial(member.user)}
                                       </div>
                                     )}
                                     <div>
                                        <div className="font-extrabold text-gray-900 text-[14px]">{name}</div>
                                        <div className="text-[12px] text-gray-400 font-medium mt-0.5">{member.user?.email || `User #${member.user_id}`}</div>
                                     </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                     {member.role === 'owner' ? (
                                       <span className="rounded-full bg-amber-50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-700">
                                         Owner
                                       </span>
                                     ) : (
                                       <SelectField
                                          size="pill"
                                          value={member.role}
                                          align="right"
                                          onChange={(nextValue) => {
                                            setMemberError('');
                                            setMemberNotice('');
                                            updateRoleMutation.mutate({ userId: member.user_id, role: nextValue as ManageableMemberRole });
                                          }}
                                          options={memberRoleOptions}
                                          disabled={!canManageMembers || updateRoleMutation.isPending}
                                       />
                                     )}
                                     
                                     {member.role !== 'owner' && canManageMembers && (
                                       <button
                                         type="button"
                                         disabled={removeMemberMutation.isPending}
                                         onClick={() => {
                                           setMemberError('');
                                           setMemberNotice('');
                                           removeMemberMutation.mutate(member.user_id);
                                         }}
                                         className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                       >
                                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                       </button>
                                     )}
                                  </div>
                               </div>
                             );
                           })}
                        </div>

                        {currentBoardMember && !isBoardOwner ? (
                          <div className="mt-8 rounded-[24px] border border-[#ffe1b3] bg-[#fff9ef] p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h4 className="text-[16px] font-extrabold text-[#b54708]">Leave Board</h4>
                                <p className="mt-2 text-[13px] font-medium leading-6 text-[#8f5b1a]">
                                  Leave this board if you no longer need access. An owner or admin can add you back later if needed.
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={leaveBoardMutation.isPending}
                                onClick={() => {
                                  if (window.confirm(`Leave board "${boardData?.title || boardForm.title}"? You will lose access immediately.`)) {
                                    leaveBoardMutation.mutate();
                                  }
                                }}
                                className="inline-flex items-center justify-center rounded-2xl bg-[#f79009] px-5 py-3 text-[14px] font-bold text-white transition hover:bg-[#dc6803] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {leaveBoardMutation.isPending ? 'Leaving...' : 'Leave Board'}
                              </button>
                            </div>
                          </div>
                        ) : null}
                     </div>

                     {/* Lists */}
                     <div id="lists" className="bg-white rounded-[1.5rem] p-8 lg:p-10 shadow-sm border border-gray-100">
                        <div className="mb-8">
                           <h3 className="text-xl font-extrabold text-gray-900 mb-1.5 tracking-tight">Lists & WIP Rules</h3>
                           <p className="text-[13px] text-gray-500 font-medium">Rename statuses, tune WIP limits, and remove obsolete lists without leaving the settings flow.</p>
                        </div>

                        {!canManageMembers ? (
                          <div className="mb-6 rounded-2xl border border-gray-100 bg-[#f8fafc] px-5 py-4 text-sm font-medium text-gray-500">
                            Only board owners and admins can edit list settings.
                          </div>
                        ) : null}

                        {listError ? (
                          <div className="mb-5 rounded-xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#b42318]">
                            {listError}
                          </div>
                        ) : null}

                        {listNotice ? (
                          <div className="mb-5 rounded-xl border border-[#d4f0dd] bg-[#edf9f1] px-4 py-3 text-sm font-semibold text-[#027a48]">
                            {listNotice}
                          </div>
                        ) : null}

                        <div className="space-y-4">
                           {lists.length === 0 ? (
                             <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f8fafc] px-5 py-6 text-sm font-medium text-gray-500">
                               No lists yet. Create your first list from the board view, then manage its settings here.
                             </div>
                           ) : (
                             lists.map((list: List) => {
                               const draft = listDrafts[list.id] || {
                                 title: list.title || '',
                                 wipLimit: list.wip_limit == null ? '' : String(list.wip_limit),
                               };
                               const trimmedTitle = draft.title.trim();
                               const normalizedWipLimit = draft.wipLimit.trim();
                               const currentWipLimit = list.wip_limit == null ? '' : String(list.wip_limit);
                               const hasChanges = trimmedTitle !== list.title || normalizedWipLimit !== currentWipLimit;
                               const invalidWipLimit =
                                 normalizedWipLimit !== '' &&
                                 (!Number.isInteger(Number(normalizedWipLimit)) || Number(normalizedWipLimit) < 1);
                               const isSavingList =
                                 updateListMutation.isPending &&
                                 updateListMutation.variables?.listId === list.id;
                               const isDeletingList =
                                 deleteListMutation.isPending &&
                                 deleteListMutation.variables === list.id;

                               return (
                                 <div key={list.id} className="rounded-2xl border border-gray-100 bg-[#fbfdff] p-5 shadow-sm">
                                   <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-end">
                                     <label className="block">
                                       <span className="mb-3 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">List Name</span>
                                       <input
                                         type="text"
                                         value={draft.title}
                                         disabled={!canManageMembers || isSavingList || isDeletingList}
                                         onChange={(event) =>
                                           setListDrafts((current) => ({
                                             ...current,
                                             [list.id]: {
                                               ...draft,
                                               title: event.target.value,
                                             },
                                           }))
                                         }
                                         className="h-12 w-full rounded-2xl border border-[#d9e3ef] bg-white px-4 text-[14px] font-semibold text-[#162231] outline-none transition focus:border-[#b7cbe0] disabled:cursor-not-allowed disabled:opacity-60"
                                       />
                                     </label>

                                     <label className="block">
                                       <span className="mb-3 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">WIP Limit</span>
                                       <input
                                         type="number"
                                         min={1}
                                         placeholder="No limit"
                                         value={draft.wipLimit}
                                         disabled={!canManageMembers || isSavingList || isDeletingList}
                                         onChange={(event) =>
                                           setListDrafts((current) => ({
                                             ...current,
                                             [list.id]: {
                                               ...draft,
                                               wipLimit: event.target.value,
                                             },
                                           }))
                                         }
                                         className="h-12 w-full rounded-2xl border border-[#d9e3ef] bg-white px-4 text-[14px] font-semibold text-[#162231] outline-none transition focus:border-[#b7cbe0] disabled:cursor-not-allowed disabled:opacity-60"
                                       />
                                     </label>

                                     <div className="flex items-center gap-3">
                                       <button
                                         type="button"
                                         disabled={!canManageMembers || !hasChanges || invalidWipLimit || !trimmedTitle || isSavingList || isDeletingList}
                                         onClick={() => {
                                           if (!trimmedTitle) {
                                             setListNotice('');
                                             setListError('List name is required.');
                                             return;
                                           }
                                           if (invalidWipLimit) {
                                             setListNotice('');
                                             setListError('WIP limit must be a whole number greater than 0.');
                                             return;
                                           }

                                           updateListMutation.mutate({
                                             listId: list.id,
                                             title: draft.title,
                                             wipLimit: draft.wipLimit,
                                           });
                                         }}
                                         className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                       >
                                         {isSavingList ? 'Saving...' : 'Save'}
                                       </button>
                                       <button
                                         type="button"
                                         disabled={!canManageMembers || isSavingList || isDeletingList}
                                         onClick={() => {
                                           if (window.confirm(`Delete list "${list.title}"? Cards inside this list will be removed as well.`)) {
                                             deleteListMutation.mutate(list.id);
                                           }
                                         }}
                                         className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                       >
                                         {isDeletingList ? 'Deleting...' : 'Delete'}
                                       </button>
                                     </div>
                                   </div>

                                   <div className="mt-3 text-[12px] font-medium text-[#6b7b90]">
                                      {list.wip_limit == null
                                        ? 'This list currently has no WIP limit.'
                                        : `Current WIP limit: ${list.wip_limit} active cards.`}
                                   </div>
                                 </div>
                               );
                             })
                           )}
                        </div>
                     </div>

                     {/* Swimlanes */}
                     <div id="swimlanes" className="bg-white rounded-[1.5rem] p-8 lg:p-10 shadow-sm border border-gray-100">
                        <div className="mb-8">
                           <h3 className="text-xl font-extrabold text-gray-900 mb-1.5 tracking-tight">Swimlanes Setup</h3>
                           <p className="text-[13px] text-gray-500 font-medium">Create horizontal swimlanes to group cards on your board.</p>
                        </div>

                        {swimlaneError ? (
                          <div className="mb-5 rounded-xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#b42318]">
                            {swimlaneError}
                          </div>
                        ) : null}

                        {swimlaneNotice ? (
                          <div className="mb-5 rounded-xl border border-[#d4f0dd] bg-[#edf9f1] px-4 py-3 text-sm font-semibold text-[#027a48]">
                            {swimlaneNotice}
                          </div>
                        ) : null}
                        
                        <div className="flex items-center gap-3 mb-8 bg-[#f8fafc] p-3 rounded-2xl border border-gray-100/50 focus-within:border-[#0d6efd]/30 transition-colors">
                           <input
                              type="text"
                              placeholder="New Swimlane Name..."
                              className="bg-transparent border-none outline-none flex-1 font-bold text-[14px] text-gray-900 placeholder-gray-400 focus:ring-0 px-2"
                              onKeyDown={(e) => {
                                 if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    createSwimlaneMutation.mutate(e.currentTarget.value.trim());
                                    e.currentTarget.value = '';
                                 }
                              }}
                           />
                           <button
                              onClick={() => {
                                 const input = document.querySelector('input[placeholder="New Swimlane Name..."]') as HTMLInputElement;
                                 if (input?.value.trim()) {
                                    createSwimlaneMutation.mutate(input.value.trim());
                                    input.value = '';
                                 }
                              }}
                              className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-black transition-all"
                           >
                              Add
                           </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                           {swimlanes?.data?.map((swimlane: Swimlane) => {
                              const draft = swimlaneDrafts[swimlane.id] || {
                                name: swimlane.name || '',
                                color: swimlane.color || '#0d6efd',
                              };
                              const hasChanges =
                                draft.name.trim() !== swimlane.name ||
                                draft.color !== (swimlane.color || '#0d6efd');
                              const isSaving =
                                updateSwimlaneMutation.isPending &&
                                updateSwimlaneMutation.variables?.id === swimlane.id;
                              const isDeleting =
                                deleteSwimlaneMutation.isPending &&
                                deleteSwimlaneMutation.variables === swimlane.id;

                              return (
                                <div key={swimlane.id} className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_120px_auto] lg:items-end">
                                  <label className="block">
                                    <span className="mb-3 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Swimlane Name</span>
                                    <input
                                      type="text"
                                      value={draft.name}
                                      disabled={!canManageMembers || isSaving || isDeleting}
                                      onChange={(event) =>
                                        setSwimlaneDrafts((current) => ({
                                          ...current,
                                          [swimlane.id]: {
                                            ...draft,
                                            name: event.target.value,
                                          },
                                        }))
                                      }
                                      className="h-12 w-full rounded-2xl border border-[#d9e3ef] bg-white px-4 text-[14px] font-semibold text-[#162231] outline-none transition focus:border-[#b7cbe0] disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                  </label>

                                  <label className="block">
                                    <span className="mb-3 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Color</span>
                                    <input
                                      type="color"
                                      value={draft.color}
                                      disabled={!canManageMembers || isSaving || isDeleting}
                                      onChange={(event) =>
                                        setSwimlaneDrafts((current) => ({
                                          ...current,
                                          [swimlane.id]: {
                                            ...draft,
                                            color: event.target.value,
                                          },
                                        }))
                                      }
                                      className="h-12 w-full cursor-pointer rounded-2xl border border-[#d9e3ef] bg-white p-2 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                  </label>

                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      disabled={!canManageMembers || !draft.name.trim() || !hasChanges || isSaving || isDeleting}
                                      onClick={() => updateSwimlaneMutation.mutate({ id: swimlane.id, name: draft.name, color: draft.color })}
                                      className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={!canManageMembers || isSaving || isDeleting}
                                      onClick={() => deleteSwimlaneMutation.mutate(swimlane.id)}
                                      className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                  </div>
                                </div>
                              );
                           })}
                        </div>
                     </div>

                     {/* Labels */}
                     <div id="labels" className="bg-white rounded-[1.5rem] p-8 lg:p-10 shadow-sm border border-gray-100">
                        <div className="mb-8">
                           <h3 className="text-xl font-extrabold text-gray-900 mb-1.5 tracking-tight">Labels</h3>
                           <p className="text-[13px] text-gray-500 font-medium">Create customized tags to categorize your cards easily.</p>
                        </div>

                        {labelError ? (
                          <div className="mb-5 rounded-xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#b42318]">
                            {labelError}
                          </div>
                        ) : null}

                        {labelNotice ? (
                          <div className="mb-5 rounded-xl border border-[#d4f0dd] bg-[#edf9f1] px-4 py-3 text-sm font-semibold text-[#027a48]">
                            {labelNotice}
                          </div>
                        ) : null}
                        
                        <div className="flex items-center gap-3 mb-8 bg-[#f8fafc] p-3 rounded-2xl border border-gray-100/50 focus-within:border-[#0d6efd]/30 transition-colors">
                           <input type="color" defaultValue="#0d6efd" className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0" id="label-color" />
                           <input
                              type="text"
                              placeholder="Label Name"
                              id="label-name"
                              className="bg-transparent border-none outline-none flex-1 font-bold text-[14px] text-gray-900 placeholder-gray-400 focus:ring-0 px-2"
                              onKeyDown={(e) => {
                                 const colorInput = document.getElementById('label-color') as HTMLInputElement;
                                 if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    createLabelMutation.mutate({ name: e.currentTarget.value.trim(), color: colorInput.value || '#0d6efd' });
                                    e.currentTarget.value = '';
                                 }
                              }}
                           />
                           <button
                              onClick={() => {
                                 const nameInput = document.getElementById('label-name') as HTMLInputElement;
                                 const colorInput = document.getElementById('label-color') as HTMLInputElement;
                                 if (nameInput?.value.trim()) {
                                    createLabelMutation.mutate({ name: nameInput.value.trim(), color: colorInput?.value || '#0d6efd' });
                                    nameInput.value = '';
                                 }
                              }}
                              className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-black transition-all"
                           >
                              Create
                           </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                           {labels?.data?.map((label: Label) => {
                              const draft = labelDrafts[label.id] || {
                                name: label.name || '',
                                color: label.color || '#0d6efd',
                              };
                              const hasChanges = draft.name.trim() !== label.name || draft.color !== label.color;
                              const isSaving =
                                updateLabelMutation.isPending &&
                                updateLabelMutation.variables?.id === label.id;
                              const isDeleting =
                                deleteLabelMutation.isPending &&
                                deleteLabelMutation.variables === label.id;

                              return (
                                <div key={label.id} className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:grid-cols-[120px_minmax(0,1fr)_auto] lg:items-end">
                                  <label className="block">
                                    <span className="mb-3 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Color</span>
                                    <input
                                      type="color"
                                      value={draft.color}
                                      disabled={!canManageMembers || isSaving || isDeleting}
                                      onChange={(event) =>
                                        setLabelDrafts((current) => ({
                                          ...current,
                                          [label.id]: {
                                            ...draft,
                                            color: event.target.value,
                                          },
                                        }))
                                      }
                                      className="h-12 w-full cursor-pointer rounded-2xl border border-[#d9e3ef] bg-white p-2 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                  </label>

                                  <label className="block">
                                    <span className="mb-3 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Label Name</span>
                                    <input
                                      type="text"
                                      value={draft.name}
                                      disabled={!canManageMembers || isSaving || isDeleting}
                                      onChange={(event) =>
                                        setLabelDrafts((current) => ({
                                          ...current,
                                          [label.id]: {
                                            ...draft,
                                            name: event.target.value,
                                          },
                                        }))
                                      }
                                      className="h-12 w-full rounded-2xl border border-[#d9e3ef] bg-white px-4 text-[14px] font-semibold text-[#162231] outline-none transition focus:border-[#b7cbe0] disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                  </label>

                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      disabled={!canManageMembers || !draft.name.trim() || !hasChanges || isSaving || isDeleting}
                                      onClick={() => updateLabelMutation.mutate({ id: label.id, name: draft.name, color: draft.color })}
                                      className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={!canManageMembers || isSaving || isDeleting}
                                      onClick={() => deleteLabelMutation.mutate(label.id)}
                                      className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                  </div>
                                </div>
                              );
                           })}
                        </div>
                     </div>

                     {/* Automations */}
                     <div id="automations" className="bg-white rounded-[1.5rem] p-8 lg:p-10 shadow-sm border border-gray-100">
                        <div className="mb-10">
                           <h3 className="text-xl font-extrabold text-gray-900 mb-1.5 tracking-tight">Automations</h3>
                           <p className="text-[13px] text-gray-500 font-medium">Configure webhooks and list transition rules to automate logic.</p>
                        </div>

                        {automationError ? (
                           <div className="mb-5 rounded-xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#b42318]">
                              {automationError}
                           </div>
                        ) : null}

                        {automationNotice ? (
                           <div className="mb-5 rounded-xl border border-[#d4f0dd] bg-[#edf9f1] px-4 py-3 text-sm font-semibold text-[#027a48]">
                              {automationNotice}
                           </div>
                        ) : null}
                        
                        <div className="mb-10">
                           <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Auto Assignments</h4>

                           {!canManageMembers ? (
                              <div className="mb-5 rounded-xl border border-gray-100 bg-[#f8fafc] px-4 py-3 text-sm font-medium text-gray-500">
                                 Only board owners and admins can change auto-assignment rules. Current rules are shown here for visibility.
                              </div>
                           ) : null}

                           {lists.length === 0 ? (
                              <div className="mb-8 rounded-2xl border border-dashed border-gray-200 bg-[#f8fafc] px-5 py-4 text-sm font-medium text-gray-500">
                                 Create a few statuses first, then you can assign a default owner for cards entering each list.
                              </div>
                           ) : (
                              <div className="mb-10 space-y-3">
                                 {lists.map((list: List, index) => {
                                    const currentAssignment = autoAssignmentsByListId[list.id];
                                    const currentValue = currentAssignment?.user_id ? String(currentAssignment.user_id) : '';
                                    const selectedValue = autoAssignmentDrafts[list.id] ?? currentValue;
                                    const hasPendingChange = autoAssignmentDrafts[list.id] !== undefined && autoAssignmentDrafts[list.id] !== currentValue;
                                    const isFetchingAutoAssignment = autoAssignmentQueries[index]?.isLoading;
                                    const isSavingRule =
                                      setAutoAssignmentMutation.isPending &&
                                      setAutoAssignmentMutation.variables?.listId === list.id;
                                    const isDeletingRule =
                                      deleteAutoAssignmentMutation.isPending &&
                                      deleteAutoAssignmentMutation.variables === list.id;

                                    return (
                                       <div key={list.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                             <div className="min-w-0 lg:max-w-[260px]">
                                                <div className="text-[14px] font-extrabold text-gray-900">{list.title}</div>
                                                <div className="mt-1 text-[12px] font-medium text-gray-500">
                                                   {isFetchingAutoAssignment
                                                     ? 'Loading current rule...'
                                                     : currentAssignment?.user
                                                       ? `Cards entering this status will be assigned to ${getUserDisplayName(currentAssignment.user)}.`
                                                       : 'No automatic assignee configured for this status yet.'}
                                                </div>
                                             </div>

                                             <div className="flex flex-col gap-3 lg:w-[520px] lg:flex-row lg:items-center">
                                                <SelectField
                                                  size="md"
                                                  value={selectedValue}
                                                  disabled={!canManageMembers || isFetchingAutoAssignment || isSavingRule || isDeletingRule}
                                                  onChange={(value) =>
                                                    setAutoAssignmentDrafts((current) => ({
                                                      ...current,
                                                      [list.id]: value,
                                                    }))
                                                  }
                                                  options={autoAssignmentOptions}
                                                  placeholder="Choose default assignee..."
                                                />
                                                <button
                                                  type="button"
                                                  disabled={!canManageMembers || !hasPendingChange || isSavingRule || isDeletingRule}
                                                  onClick={() => {
                                                    if (!selectedValue) {
                                                      deleteAutoAssignmentMutation.mutate(list.id);
                                                      return;
                                                    }

                                                    setAutoAssignmentMutation.mutate({
                                                      listId: list.id,
                                                      userId: Number(selectedValue),
                                                    });
                                                  }}
                                                  className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                  {isSavingRule || isDeletingRule
                                                    ? 'Saving...'
                                                    : selectedValue
                                                      ? 'Save Rule'
                                                      : 'Clear Rule'}
                                                </button>
                                             </div>
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>
                           )}
                        </div>

                        <div className="mb-10">
                           <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Webhooks</h4>

                           <div className="bg-[#f8fafc] p-5 rounded-2xl border border-gray-100 space-y-4 mb-6">
                              <input type="url" id="webhook-url" placeholder="https://api.kineticcore.io/webhook" disabled={!canManageMembers || createWebhookMutation.isPending} className="w-full bg-white px-4 py-3 border border-gray-200 rounded-xl font-medium text-sm focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] outline-none transition-all placeholder-gray-400 disabled:cursor-not-allowed disabled:opacity-60" />
                              <input type="text" id="webhook-secret" placeholder="Optional signing secret" disabled={!canManageMembers || createWebhookMutation.isPending} className="w-full bg-white px-4 py-3 border border-gray-200 rounded-xl font-medium text-sm focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] outline-none transition-all placeholder-gray-400 disabled:cursor-not-allowed disabled:opacity-60" />
                              <div className="flex flex-wrap gap-2 text-[12px] font-bold text-gray-600">
                                 {webhookEventOptions.map((event) => (
                                    <label key={event} className="flex items-center gap-2 bg-white px-3 py-1.5 border border-gray-200 rounded-lg cursor-pointer hover:border-[#0d6efd] transition-colors">
                                       <input type="checkbox" value={event} disabled={!canManageMembers || createWebhookMutation.isPending} className="webhook-event rounded border-gray-300 text-[#0d6efd] focus:ring-[#0d6efd] disabled:cursor-not-allowed" />
                                       {event}
                                    </label>
                                 ))}
                              </div>
                              <button disabled={!canManageMembers || createWebhookMutation.isPending} onClick={() => {
                                 const urlInput = document.getElementById('webhook-url') as HTMLInputElement;
                                 const secretInput = document.getElementById('webhook-secret') as HTMLInputElement;
                                 const checkboxes = document.querySelectorAll('.webhook-event:checked') as NodeListOf<HTMLInputElement>;
                                 const events = toWebhookEvents(Array.from(checkboxes).map((cb) => cb.value));
                                 if (!urlInput?.value.trim()) {
                                    setAutomationNotice('');
                                    setAutomationError('Webhook URL is required.');
                                    return;
                                 }
                                 if (events.length === 0) {
                                    setAutomationNotice('');
                                    setAutomationError('Select at least one webhook event.');
                                    return;
                                 }

                                 createWebhookMutation.mutate({
                                   url: urlInput.value.trim(),
                                   events,
                                   secret: secretInput?.value.trim() || undefined,
                                 });
                                 urlInput.value = '';
                                 if (secretInput) {
                                   secretInput.value = '';
                                 }
                                 checkboxes.forEach((cb) => (cb.checked = false));
                              }} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-black transition-colors w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60">
                                 {createWebhookMutation.isPending ? 'Adding...' : 'Add Webhook'}
                              </button>
                           </div>

                           <div className="space-y-3">
                              {webhooks?.data?.map((webhook: Webhook) => {
                                 const draft = webhookDrafts[webhook.id] || {
                                   url: webhook.url || '',
                                   events: toWebhookEvents(webhook.events || []),
                                   isActive: webhook.is_active,
                                   secret: '',
                                 };
                                 const hasChanges =
                                   draft.url.trim() !== webhook.url ||
                                   draft.isActive !== webhook.is_active ||
                                   normalizeEventSelection(draft.events) !== normalizeEventSelection(webhook.events) ||
                                   draft.secret.trim() !== '';
                                 const isSaving =
                                   updateWebhookMutation.isPending &&
                                   updateWebhookMutation.variables?.id === webhook.id;
                                 const isDeleting =
                                   deleteWebhookMutation.isPending &&
                                   deleteWebhookMutation.variables === webhook.id;
                                 const isTesting =
                                   testWebhookMutation.isPending &&
                                   testWebhookMutation.variables === webhook.id;

                                 return (
                                   <div key={webhook.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                     <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px]">
                                       <label className="block lg:col-span-2">
                                         <span className="mb-3 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Webhook URL</span>
                                         <input
                                           type="url"
                                           value={draft.url}
                                           disabled={!canManageMembers || isSaving || isDeleting || isTesting}
                                           onChange={(event) =>
                                             setWebhookDrafts((current) => ({
                                               ...current,
                                               [webhook.id]: {
                                                 ...draft,
                                                 url: event.target.value,
                                               },
                                             }))
                                           }
                                           className="h-12 w-full rounded-2xl border border-[#d9e3ef] bg-white px-4 text-[14px] font-semibold text-[#162231] outline-none transition focus:border-[#b7cbe0] disabled:cursor-not-allowed disabled:opacity-60"
                                         />
                                       </label>

                                       <label className="block lg:col-span-2">
                                         <span className="mb-3 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Events</span>
                                         <div className="flex flex-wrap gap-2 text-[12px] font-bold text-gray-600">
                                            {webhookEventOptions.map((event) => (
                                               <label key={`${webhook.id}-${event}`} className="flex items-center gap-2 bg-[#f8fafc] px-3 py-1.5 border border-gray-200 rounded-lg cursor-pointer hover:border-[#0d6efd] transition-colors">
                                                  <input
                                                    type="checkbox"
                                                    checked={draft.events.includes(event)}
                                                    disabled={!canManageMembers || isSaving || isDeleting || isTesting}
                                                    onChange={(changeEvent) =>
                                                      setWebhookDrafts((current) => ({
                                                        ...current,
                                                        [webhook.id]: {
                                                          ...draft,
                                                          events: changeEvent.target.checked
                                                            ? [...draft.events, event]
                                                            : draft.events.filter((selectedEvent) => selectedEvent !== event),
                                                        },
                                                      }))
                                                    }
                                                    className="rounded border-gray-300 text-[#0d6efd] focus:ring-[#0d6efd]"
                                                  />
                                                  {event}
                                               </label>
                                            ))}
                                         </div>
                                       </label>

                                       <label className="block">
                                         <span className="mb-3 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Rotate Secret</span>
                                         <input
                                           type="text"
                                           value={draft.secret}
                                           placeholder="Leave blank to keep current secret"
                                           disabled={!canManageMembers || isSaving || isDeleting || isTesting}
                                           onChange={(event) =>
                                             setWebhookDrafts((current) => ({
                                               ...current,
                                               [webhook.id]: {
                                                 ...draft,
                                                 secret: event.target.value,
                                               },
                                             }))
                                           }
                                           className="h-12 w-full rounded-2xl border border-[#d9e3ef] bg-white px-4 text-[14px] font-semibold text-[#162231] outline-none transition focus:border-[#b7cbe0] disabled:cursor-not-allowed disabled:opacity-60"
                                         />
                                       </label>

                                       <div className="flex items-center justify-between rounded-2xl border border-[#d9e3ef] bg-white px-4 py-3">
                                         <div>
                                           <div className="text-[13px] font-bold text-[#162231]">{draft.isActive ? 'Active' : 'Paused'}</div>
                                           <div className="mt-1 text-[11px] font-medium text-[#6b7b90]">
                                             {draft.isActive ? 'Deliver matching events automatically.' : 'Keep configuration without sending events.'}
                                           </div>
                                         </div>
                                         <button
                                           type="button"
                                           disabled={!canManageMembers || isSaving || isDeleting || isTesting}
                                           onClick={() =>
                                             setWebhookDrafts((current) => ({
                                               ...current,
                                               [webhook.id]: {
                                                 ...draft,
                                                 isActive: !draft.isActive,
                                               },
                                             }))
                                           }
                                           className={`relative h-8 w-14 rounded-full transition ${draft.isActive ? 'bg-[#0f4fe6]' : 'bg-[#d7e1ec]'}`}
                                         >
                                           <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${draft.isActive ? 'left-7' : 'left-1'}`} />
                                         </button>
                                       </div>
                                     </div>

                                     <div className="mt-4 flex flex-wrap items-center gap-3">
                                       <button
                                         type="button"
                                         disabled={!canManageMembers || !draft.url.trim() || draft.events.length === 0 || !hasChanges || isSaving || isDeleting || isTesting}
                                         onClick={() =>
                                           updateWebhookMutation.mutate({
                                             id: webhook.id,
                                             url: draft.url,
                                             events: draft.events,
                                             isActive: draft.isActive,
                                             secret: draft.secret,
                                           })
                                         }
                                         className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                       >
                                         {isSaving ? 'Saving...' : 'Save'}
                                       </button>
                                       <button
                                         type="button"
                                         disabled={!canManageMembers || testWebhookMutation.isPending}
                                         onClick={() => testWebhookMutation.mutate(webhook.id)}
                                         className="px-4 py-2.5 rounded-xl bg-[#eef4ff] text-[#0d6efd] text-sm font-bold hover:bg-[#dce8ff] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                       >
                                         {isTesting ? 'Testing...' : 'Test'}
                                       </button>
                                       <button
                                         type="button"
                                         disabled={!canManageMembers || deleteWebhookMutation.isPending}
                                         onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                                         className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                       >
                                         {isDeleting ? 'Deleting...' : 'Remove'}
                                       </button>
                                     </div>
                                   </div>
                                 );
                              })}
                           </div>
                        </div>

                        <div>
                           <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Transition Rules</h4>
                           <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 bg-[#f8fafc] p-4 rounded-2xl border border-gray-100">
                              <SelectField
                                size="md"
                                value={ruleFromId}
                                placeholder="Status From..."
                                onChange={setRuleFromId}
                                options={[
                                  { value: '', label: 'Status From...' },
                                  ...lists.map((list: List) => ({ value: String(list.id), label: list.title })),
                                ]}
                              />
                              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                              <SelectField
                                size="md"
                                value={ruleToId}
                                placeholder="Status To..."
                                onChange={setRuleToId}
                                options={[
                                  { value: '', label: 'Status To...' },
                                  ...lists.map((list: List) => ({ value: String(list.id), label: list.title })),
                                ]}
                              />
                              <button onClick={() => {
                                 if (!ruleFromId || !ruleToId) {
                                   setAutomationNotice('');
                                   setAutomationError('Choose both source and target statuses.');
                                   return;
                                 }

                                 if (ruleFromId === ruleToId) {
                                   setAutomationNotice('');
                                   setAutomationError('Source and target statuses must be different.');
                                   return;
                                 }

                                 createRuleMutation.mutate({ from_list_id: Number(ruleFromId), to_list_id: Number(ruleToId) });
                                 setRuleFromId('');
                                 setRuleToId('');
                              }} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold w-full sm:w-auto hover:bg-black transition-colors shrink-0">
                                 {createRuleMutation.isPending ? 'Adding...' : 'Add Rule'}
                              </button>
                           </div>
                           
                           <div className="space-y-3">
                              {rules?.data?.map((rule: ListTransitionRule) => (
                                 <div key={rule.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl group">
                                    <div className="flex items-center gap-3">
                                       <span className="font-extrabold text-gray-800 px-3 py-1 bg-gray-100 rounded-lg text-sm">{rule.from_list?.title}</span>
                                       <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                       <span className="font-extrabold text-gray-800 px-3 py-1 bg-gray-100 rounded-lg text-sm">{rule.to_list?.title}</span>
                                    </div>
                                    <button onClick={() => deleteRuleMutation.mutate(rule.id)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                 </div>
                              ))}
                           </div>
                        </div>

                     </div>
                   </>
                 )}
              </div>
           </div>

           {/* Fixed Bottom Save Bar */}
           <div className="fixed bottom-0 right-0 left-[280px] p-6 bg-gradient-to-t from-white via-white to-transparent pt-12 flex justify-end gap-3 z-20 pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-4 bg-white px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100">
                 <button onClick={onClose} className="text-[13px] font-bold text-gray-600 hover:text-gray-900 mr-2">Discard Changes</button>
                 <button
                   onClick={() => {
                     if (activeSection === 'general') {
                       if (!boardForm.title.trim()) {
                         setGeneralNotice('');
                         setGeneralError('Board name is required');
                         return;
                       }
                       updateBoardMutation.mutate();
                       return;
                     }

                     onClose();
                   }}
                   disabled={!boardData || updateBoardMutation.isPending}
                   className="px-6 py-2.5 bg-[#0d6efd] text-white rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all text-sm disabled:cursor-not-allowed disabled:opacity-60"
                 >
                   {activeSection === 'general'
                     ? (updateBoardMutation.isPending ? 'Saving...' : 'Save Board')
                     : 'Done'}
                 </button>
              </div>
           </div>
        </main>
      </div>
    </div>
  );
}
