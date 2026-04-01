import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { SelectField } from '@/components/SelectField';
import { useAuth } from '@/context/AuthContext';
import { boardApi, userApi } from '@/services/api';
import type { BoardMember, User } from '@/types';

type ManageableRole = 'admin' | 'member' | 'observer';
type MemberScope = 'all' | 'selected';

interface WorkspaceMemberSummary {
  userId: number;
  user: User;
  boardIds: number[];
  boardTitles: string[];
  roles: BoardMember['role'][];
  activeCards: number;
  completedCards: number;
  overdueCards: number;
  isOnline: boolean;
}

const roleOptions = [
  { value: 'admin', label: 'Admin', description: 'Can manage board access and structure.' },
  { value: 'member', label: 'Member', description: 'Can collaborate on cards and comments.' },
  { value: 'observer', label: 'Observer', description: 'Can follow progress without editing.' },
];

const memberScopeOptions = [
  { value: 'all', label: 'All boards', description: 'See everyone across the accessible workspace.' },
  { value: 'selected', label: 'Selected board', description: 'Focus only on the currently selected board.' },
];

const roleBadgeClasses: Record<BoardMember['role'], string> = {
  owner: 'bg-[#e8f5ec] text-[#027a48]',
  admin: 'bg-[#dfe7ff] text-[#0f4fe6]',
  member: 'bg-[#eef4fa] text-[#4e5f74]',
  observer: 'bg-[#fff0dd] text-[#b45309]',
};

function getUserDisplayName(user?: User | null) {
  return user?.nickname || user?.username || 'Unknown user';
}

function getUserAvatar(user?: User | null) {
  return user?.avatar || `https://i.pravatar.cc/160?u=${user?.id || 'guest'}`;
}

function getRoleRank(role: BoardMember['role']) {
  return {
    owner: 0,
    admin: 1,
    member: 2,
    observer: 3,
  }[role];
}

function isOverdue(value?: string | null) {
  if (!value) return false;

  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return false;

  return dueDate < new Date();
}

function csvEscape(value: string | number) {
  const stringValue = String(value ?? '');
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function TeamPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [memberScope, setMemberScope] = useState<MemberScope>('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteRole, setInviteRole] = useState<ManageableRole>('member');
  const [roleDrafts, setRoleDrafts] = useState<Record<number, ManageableRole>>({});
  const [memberNotice, setMemberNotice] = useState('');
  const [memberError, setMemberError] = useState('');

  const { data: boardsResponse, isLoading: boardsLoading, isError: boardsError } = useQuery({
    queryKey: ['boards'],
    queryFn: () => boardApi.getAll(),
  });

  const boards = boardsResponse?.data || [];
  const boardTitleById = useMemo(
    () => new Map(boards.map((board) => [board.id, board.title])),
    [boards]
  );

  useEffect(() => {
    if (!selectedBoardId && boards.length > 0) {
      setSelectedBoardId(String(boards[0].id));
      return;
    }

    if (selectedBoardId && !boards.some((board) => String(board.id) === selectedBoardId)) {
      setSelectedBoardId(boards[0] ? String(boards[0].id) : '');
    }
  }, [boards, selectedBoardId]);

  const boardDetailQueries = useQueries({
    queries: boards.map((board) => ({
      queryKey: ['board', board.id, 'team-page'],
      queryFn: () => boardApi.getOne(board.id),
      enabled: !!board.id,
    })),
  });

  const memberQueries = useQueries({
    queries: boards.map((board) => ({
      queryKey: ['board', board.id, 'members'],
      queryFn: () => boardApi.getMembers(board.id),
      enabled: !!board.id,
    })),
  });

  const onlineQueries = useQueries({
    queries: boards.map((board) => ({
      queryKey: ['board', board.id, 'online-users'],
      queryFn: () => boardApi.getOnlineUsers(board.id),
      enabled: !!board.id,
    })),
  });

  const selectedBoardIdNumber = selectedBoardId ? Number(selectedBoardId) : null;
  const selectedBoardIndex = selectedBoardIdNumber
    ? boards.findIndex((board) => board.id === selectedBoardIdNumber)
    : -1;
  const selectedBoard = selectedBoardIndex >= 0 ? boards[selectedBoardIndex] : undefined;
  const selectedBoardMembers = selectedBoardIndex >= 0 ? memberQueries[selectedBoardIndex]?.data?.data || [] : [];
  const selectedBoardOnlineUsers = selectedBoardIndex >= 0 ? onlineQueries[selectedBoardIndex]?.data?.data.users || [] : [];
  const currentSelectedMembership = selectedBoardMembers.find((member) => member.user_id === user?.id);
  const canManageSelectedBoard =
    !!user &&
    !!selectedBoard &&
    (selectedBoard.owner_id === user.id || ['owner', 'admin'].includes(currentSelectedMembership?.role || ''));

  useEffect(() => {
    setRoleDrafts(
      Object.fromEntries(
        selectedBoardMembers
          .filter((member) => member.role !== 'owner')
          .map((member) => [member.user_id, member.role as ManageableRole])
      )
    );
  }, [selectedBoardMembers, selectedBoardId]);

  const { data: inviteCandidatesData, isFetching: isSearchingUsers } = useQuery({
    queryKey: ['users', 'team-page-search', selectedBoardIdNumber, inviteQuery],
    queryFn: () =>
      userApi.search({
        q: inviteQuery.trim() || undefined,
        limit: 8,
        exclude_board_id: selectedBoardIdNumber || undefined,
      }),
    enabled: !!selectedBoardIdNumber && canManageSelectedBoard,
  });

  const inviteCandidates = inviteCandidatesData?.data || [];

  const addMemberMutation = useMutation({
    mutationFn: (data: { boardId: number; userId: number; role: ManageableRole }) =>
      boardApi.addMember(data.boardId, { user_id: data.userId, role: data.role }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'team-page-search', variables.boardId] });
      setMemberError('');
      setMemberNotice(`${getUserDisplayName(response.data.user)} joined ${boardTitleById.get(variables.boardId) || 'the board'}.`);
      setInviteQuery('');
    },
    onError: (error: any) => {
      setMemberNotice('');
      setMemberError(error.response?.data?.error || 'Failed to add member');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (data: { boardId: number; userId: number; role: ManageableRole }) =>
      boardApi.updateMemberRole(data.boardId, data.userId, { role: data.role }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId, 'members'] });
      setMemberError('');
      setMemberNotice('Member permissions updated.');
    },
    onError: (error: any) => {
      setMemberNotice('');
      setMemberError(error.response?.data?.error || 'Failed to update member role');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (data: { boardId: number; userId: number }) => boardApi.removeMember(data.boardId, data.userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'team-page-search', variables.boardId] });
      setMemberError('');
      setMemberNotice('Member removed from the board.');
    },
    onError: (error: any) => {
      setMemberNotice('');
      setMemberError(error.response?.data?.error || 'Failed to remove member');
    },
  });

  const workspaceMembers = useMemo(() => {
    const workloadByUserId = new Map<number, { active: number; completed: number; overdue: number }>();

    boardDetailQueries.forEach((query) => {
      const board = query.data?.data;
      (board?.lists || []).forEach((list) => {
        (list.cards || []).forEach((card) => {
          if (!card.assignee_id) return;

          const current = workloadByUserId.get(card.assignee_id) || { active: 0, completed: 0, overdue: 0 };
          if (card.completed_at) {
            current.completed += 1;
          } else {
            current.active += 1;
            if (isOverdue(card.due_date)) {
              current.overdue += 1;
            }
          }
          workloadByUserId.set(card.assignee_id, current);
        });
      });
    });

    const onlineUserIds = new Set<number>();
    onlineQueries.forEach((query) => {
      (query.data?.data.users || []).forEach((userId) => onlineUserIds.add(userId));
    });

    const memberMap = new Map<number, WorkspaceMemberSummary>();

    memberQueries.forEach((query, index) => {
      const board = boards[index];
      if (!board) return;

      (query.data?.data || []).forEach((member) => {
        if (!member.user) return;

        const workload = workloadByUserId.get(member.user_id) || { active: 0, completed: 0, overdue: 0 };
        const existing = memberMap.get(member.user_id);

        if (existing) {
          if (!existing.boardIds.includes(board.id)) {
            existing.boardIds.push(board.id);
          }
          if (!existing.boardTitles.includes(board.title)) {
            existing.boardTitles.push(board.title);
          }
          if (!existing.roles.includes(member.role)) {
            existing.roles.push(member.role);
            existing.roles.sort((left, right) => getRoleRank(left) - getRoleRank(right));
          }
          existing.activeCards = workload.active;
          existing.completedCards = workload.completed;
          existing.overdueCards = workload.overdue;
          existing.isOnline = existing.isOnline || onlineUserIds.has(member.user_id);
          return;
        }

        memberMap.set(member.user_id, {
          userId: member.user_id,
          user: member.user,
          boardIds: [board.id],
          boardTitles: [board.title],
          roles: [member.role],
          activeCards: workload.active,
          completedCards: workload.completed,
          overdueCards: workload.overdue,
          isOnline: onlineUserIds.has(member.user_id),
        });
      });
    });

    return Array.from(memberMap.values()).sort((left, right) => {
      if (left.isOnline !== right.isOnline) {
        return left.isOnline ? -1 : 1;
      }
      if (left.activeCards !== right.activeCards) {
        return right.activeCards - left.activeCards;
      }
      return getUserDisplayName(left.user).localeCompare(getUserDisplayName(right.user));
    });
  }, [boardDetailQueries, boards, memberQueries, onlineQueries]);

  const filteredWorkspaceMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();

    return workspaceMembers.filter((member) => {
      const matchesScope =
        memberScope === 'all' || !selectedBoardIdNumber || member.boardIds.includes(selectedBoardIdNumber);
      const matchesQuery =
        query === '' ||
        getUserDisplayName(member.user).toLowerCase().includes(query) ||
        member.user.email.toLowerCase().includes(query) ||
        member.boardTitles.some((title) => title.toLowerCase().includes(query));

      return matchesScope && matchesQuery;
    });
  }, [memberScope, memberSearch, selectedBoardIdNumber, workspaceMembers]);

  const selectedBoardMembersSorted = useMemo(
    () =>
      [...selectedBoardMembers].sort((left, right) => {
        if (left.role !== right.role) {
          return getRoleRank(left.role) - getRoleRank(right.role);
        }
        return getUserDisplayName(left.user).localeCompare(getUserDisplayName(right.user));
      }),
    [selectedBoardMembers]
  );

  const totalMembers = filteredWorkspaceMembers.length;
  const onlineMembers = filteredWorkspaceMembers.filter((member) => member.isOnline);
  const averageWorkload = totalMembers > 0
    ? (filteredWorkspaceMembers.reduce((sum, member) => sum + member.activeCards, 0) / totalMembers).toFixed(1)
    : '0.0';
  const adminCoverage = filteredWorkspaceMembers.filter((member) => member.roles.some((role) => role === 'owner' || role === 'admin')).length;
  const maxActiveCards = Math.max(1, ...filteredWorkspaceMembers.map((member) => member.activeCards));

  const isPageLoading =
    boardsLoading ||
    boardDetailQueries.some((query) => query.isLoading) ||
    memberQueries.some((query) => query.isLoading) ||
    onlineQueries.some((query) => query.isLoading);

  const handleExportCsv = () => {
    const rows = [
      ['Name', 'Email', 'Boards', 'Roles', 'Online', 'Active Cards', 'Completed Cards', 'Overdue Cards'],
      ...filteredWorkspaceMembers.map((member) => [
        getUserDisplayName(member.user),
        member.user.email,
        member.boardTitles.join(' | '),
        member.roles.join(' | '),
        member.isOnline ? 'Online' : 'Offline',
        member.activeCards,
        member.completedCards,
        member.overdueCards,
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => csvEscape(cell)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `team-overview-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (boardsError) {
    return (
      <div className="flex h-screen bg-[#eef4fa] font-sans text-[#162231]">
        <Sidebar activePage="team" />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7fbff]">
          <TopNav title="" searchPlaceholder="Search team members..." />
          <div className="flex flex-1 items-center justify-center px-10">
            <div className="max-w-[560px] rounded-[32px] border border-[#d9e3ef] bg-white px-8 py-12 text-center shadow-sm">
              <h1 className="text-[28px] font-extrabold text-[#162231]">Unable to load team data</h1>
              <p className="mt-3 text-[15px] font-medium leading-7 text-[#5b6b80]">
                The workspace roster depends on your available boards. Refresh and try again once the board APIs are reachable.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!boardsLoading && boards.length === 0) {
    return (
      <div className="flex h-screen bg-[#eef4fa] font-sans text-[#162231]">
        <Sidebar activePage="team" />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7fbff]">
          <TopNav title="" searchPlaceholder="Search team members..." />
          <div className="flex flex-1 items-center justify-center px-10">
            <div className="max-w-[720px] rounded-[34px] border border-dashed border-[#cfdae7] bg-white px-10 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4fa] text-[#0f4fe6]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="mt-6 text-[30px] font-extrabold text-[#162231]">No team workspace yet</h1>
              <p className="mt-3 text-[15px] font-medium leading-7 text-[#5b6b80]">
                Create a board first, then this page will aggregate members, online presence, and workload across the boards you can access.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  to="/boards"
                  className="rounded-2xl bg-[#0f4fe6] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_32px_rgba(15,79,230,0.24)]"
                >
                  Browse Boards
                </Link>
                <Link
                  to="/projects/new"
                  className="rounded-2xl border border-[#d9e3ef] bg-white px-6 py-3 text-sm font-bold text-[#162231]"
                >
                  Create Project
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#eef4fa] font-sans text-[#162231]">
      <Sidebar activePage="team" />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7fbff]">
        <TopNav title="" searchPlaceholder="Search team members..." />

        <div className="flex-1 overflow-auto px-10 pb-10 pt-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-[38px] font-extrabold tracking-tight text-[#162231]">Team Workspace</h1>
                <p className="mt-2 max-w-2xl text-[17px] font-medium text-[#5b6b80]">
                  Review collaboration health across your boards and manage board access from a single, real-time workspace.
                </p>
              </div>

              <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row md:items-center">
                <div className="w-full md:w-[260px]">
                  <SelectField
                    size="lg"
                    value={selectedBoardId}
                    onChange={(value) => setSelectedBoardId(value)}
                    options={boards.map((board) => ({
                      value: String(board.id),
                      label: board.title,
                      description: board.description || 'Board access management target',
                    }))}
                    placeholder="Choose a board"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-[#d9e3ef] bg-[#eaf1f8] px-7 text-[16px] font-semibold text-[#162231]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v10m0 0l-4-4m4 4l4-4M5 20h14" />
                  </svg>
                  Export CSV
                </button>

                {selectedBoard ? (
                  <Link
                    to={`/boards/${selectedBoard.id}`}
                    className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#0f4fe6] px-7 text-[16px] font-bold text-white shadow-[0_16px_32px_rgba(15,79,230,0.24)]"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M14 3h7m0 0v7m0-7L10 14" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 5h5M5 5v14h14v-5" />
                    </svg>
                    Open Board
                  </Link>
                ) : null}
              </div>
            </div>

            {memberError ? (
              <div className="mb-6 rounded-2xl border border-[#ffd7d7] bg-[#fff5f5] px-5 py-4 text-[14px] font-semibold text-[#b42318]">
                {memberError}
              </div>
            ) : null}

            {memberNotice ? (
              <div className="mb-6 rounded-2xl border border-[#d4f0dd] bg-[#edf9f1] px-5 py-4 text-[14px] font-semibold text-[#027a48]">
                {memberNotice}
              </div>
            ) : null}

            {isPageLoading ? (
              <div className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-[180px] rounded-[30px] bg-[#eef4fa] animate-pulse" />
                  ))}
                </div>
                <div className="h-[420px] rounded-[32px] bg-[#eef4fa] animate-pulse" />
                <div className="grid gap-8 xl:grid-cols-2">
                  <div className="h-[420px] rounded-[32px] bg-[#eef4fa] animate-pulse" />
                  <div className="h-[420px] rounded-[32px] bg-[#eef4fa] animate-pulse" />
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <section className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">TOTAL MEMBERS</p>
                    <p className="mt-4 text-[52px] font-extrabold leading-none tracking-tight text-[#162231]">{totalMembers}</p>
                    <div className="mt-5 text-[14px] font-bold text-[#0f4fe6]">
                      {memberScope === 'all' ? 'Across all accessible boards' : `Visible on ${selectedBoard?.title || 'the selected board'}`}
                    </div>
                  </section>

                  <section className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">ACTIVE NOW</p>
                    <p className="mt-4 text-[52px] font-extrabold leading-none tracking-tight text-[#162231]">{onlineMembers.length}</p>
                    <div className="mt-8 flex items-center">
                      <div className="flex -space-x-2">
                        {onlineMembers.slice(0, 3).map((member) => (
                          <img
                            key={member.userId}
                            src={getUserAvatar(member.user)}
                            alt={getUserDisplayName(member.user)}
                            className="h-10 w-10 rounded-full border-2 border-[#eef4fa] object-cover"
                          />
                        ))}
                        {onlineMembers.length > 3 ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#eef4fa] bg-[#d8e1ea] text-[12px] font-bold text-[#4e5f74]">
                            +{onlineMembers.length - 3}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">AVG. WORKLOAD</p>
                    <p className="mt-4 text-[52px] font-extrabold leading-none tracking-tight text-[#162231]">{averageWorkload}</p>
                    <div className="mt-8 h-2 rounded-full bg-[#e0e8f0]">
                      <div
                        className="h-2 rounded-full bg-[#ff6b18]"
                        style={{ width: `${Math.min(100, Number(averageWorkload) * 18)}%` }}
                      />
                    </div>
                    <div className="mt-5 text-[14px] font-bold text-[#b45309]">Open assigned cards per member</div>
                  </section>

                  <section className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">ADMINS & OWNERS</p>
                    <p className="mt-4 text-[52px] font-extrabold leading-none tracking-tight text-[#162231]">{adminCoverage}</p>
                    <div className="mt-5 text-[14px] font-bold text-[#4e5f74]">
                      Members who can manage at least one board
                    </div>
                  </section>
                </div>

                <section className="mb-8 overflow-hidden rounded-[32px] bg-[#eef4fa] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                  <div className="flex flex-col gap-4 border-b border-[#dce5ef] px-8 py-7 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <h2 className="text-[20px] font-extrabold text-[#162231]">Member Directory</h2>
                      <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">
                        Search, filter, and review how people are distributed across boards and active work.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <label className="relative block md:w-[280px]">
                        <svg className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa0ba]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={memberSearch}
                          onChange={(event) => setMemberSearch(event.target.value)}
                          placeholder="Search members, email, or board..."
                          className="h-12 w-full rounded-2xl border border-transparent bg-white pl-14 pr-4 text-[14px] font-medium text-[#314155] placeholder:text-[#74859c] outline-none transition focus:border-[#c9d7e6]"
                        />
                      </label>

                      <div className="w-full md:w-[220px]">
                        <SelectField
                          size="md"
                          value={memberScope}
                          onChange={(value) => setMemberScope(value as MemberScope)}
                          options={memberScopeOptions}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:grid lg:grid-cols-[1.7fr_1.2fr_0.8fr_1.2fr] px-8 py-5 text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">
                    <div>MEMBER</div>
                    <div>ACCESS</div>
                    <div>STATUS</div>
                    <div>WORKLOAD</div>
                  </div>

                  {filteredWorkspaceMembers.length === 0 ? (
                    <div className="px-8 py-14 text-center">
                      <div className="text-[20px] font-extrabold text-[#162231]">No matching members</div>
                      <div className="mt-3 text-[14px] font-medium leading-7 text-[#5b6b80]">
                        Try a different search term or switch the directory scope.
                      </div>
                    </div>
                  ) : (
                    filteredWorkspaceMembers.map((member) => (
                      <div
                        key={member.userId}
                        className="grid gap-5 border-t border-[#dce5ef] px-8 py-6 lg:grid-cols-[1.7fr_1.2fr_0.8fr_1.2fr] lg:items-center"
                      >
                        <div className="flex items-center gap-5">
                          <div className="relative">
                            <img src={getUserAvatar(member.user)} alt={getUserDisplayName(member.user)} className="h-14 w-14 rounded-2xl object-cover" />
                            <span
                              className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#eef4fa] ${
                                member.isOnline ? 'bg-[#03a63c]' : 'bg-[#c8d3de]'
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-[18px] font-extrabold text-[#162231]">{getUserDisplayName(member.user)}</h3>
                            <p className="mt-1 truncate text-[14px] font-medium text-[#5b6b80]">{member.user.email}</p>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            {member.roles.map((role) => (
                              <span
                                key={`${member.userId}-${role}`}
                                className={`rounded-xl px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] ${roleBadgeClasses[role]}`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                          <div className="mt-3 text-[13px] font-medium text-[#5b6b80]">
                            {member.boardTitles.slice(0, 2).join(' • ')}
                            {member.boardTitles.length > 2 ? ` +${member.boardTitles.length - 2} more` : ''}
                          </div>
                        </div>

                        <div className={`text-[16px] font-medium ${member.isOnline ? 'text-[#03a63c]' : 'text-[#39485b]'}`}>
                          {member.isOnline ? 'Online' : 'Offline'}
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="min-w-[92px] text-[16px] font-semibold text-[#162231]">
                            {member.activeCards} Open
                          </span>
                          <div className="h-2 flex-1 rounded-full bg-[#e0e8f0]">
                            <div
                              className="h-2 rounded-full bg-[#0f4fe6]"
                              style={{ width: `${(member.activeCards / maxActiveCards) * 100}%` }}
                            />
                          </div>
                          {member.overdueCards > 0 ? (
                            <span className="rounded-full bg-[#ffe1e1] px-2.5 py-1 text-[11px] font-extrabold text-[#b42318]">
                              {member.overdueCards} overdue
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </section>

                <div className="grid gap-8 xl:grid-cols-2">
                  <section className="rounded-[32px] bg-[#eef4fa] p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                    <div className="mb-8 flex flex-col gap-4">
                      <div>
                        <h2 className="text-[20px] font-extrabold text-[#162231]">Invite to Selected Board</h2>
                        <p className="mt-4 text-[16px] leading-8 text-[#5b6b80]">
                          {selectedBoard
                            ? `Add existing workspace users to ${selectedBoard.title} with the role you need.`
                            : 'Choose a board first to manage access.'}
                        </p>
                      </div>

                      {selectedBoard ? (
                        <div className="rounded-[24px] border border-[#d9e3ef] bg-white px-5 py-4 shadow-sm">
                          <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">Selected board</div>
                          <div className="mt-2 text-[18px] font-extrabold text-[#162231]">{selectedBoard.title}</div>
                          <div className="mt-2 text-[13px] font-medium text-[#5b6b80]">
                            {selectedBoardMembers.length} members • {selectedBoardOnlineUsers.length} online now
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {!canManageSelectedBoard ? (
                      <div className="rounded-[24px] border border-dashed border-[#d9e3ef] bg-white px-5 py-6 text-[14px] font-medium leading-7 text-[#5b6b80]">
                        You can review the workspace roster here, but only board owners and admins can add or update board members.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <label className="mb-3 block text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">ROLE</label>
                          <SelectField
                            size="lg"
                            value={inviteRole}
                            onChange={(value) => setInviteRole(value as ManageableRole)}
                            options={roleOptions}
                          />
                        </div>

                        <div>
                          <label className="mb-3 block text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">SEARCH USERS</label>
                          <input
                            type="text"
                            value={inviteQuery}
                            onChange={(event) => setInviteQuery(event.target.value)}
                            placeholder="Find by username, nickname, or email..."
                            className="h-14 w-full rounded-2xl border border-transparent bg-[#e0e9f2] px-5 text-[16px] text-[#3a4a5f] outline-none focus:border-[#bfd0e2]"
                          />
                        </div>

                        <div className="space-y-3">
                          {isSearchingUsers ? (
                            <div className="rounded-[24px] border border-[#d9e3ef] bg-white px-5 py-4 text-[14px] font-medium text-[#5b6b80]">
                              Searching workspace users...
                            </div>
                          ) : inviteCandidates.length === 0 ? (
                            <div className="rounded-[24px] border border-dashed border-[#d9e3ef] bg-white px-5 py-4 text-[14px] font-medium leading-7 text-[#5b6b80]">
                              No users found outside this board. Try a different search term or choose another board.
                            </div>
                          ) : (
                            inviteCandidates.map((candidate) => {
                              const isAdding =
                                addMemberMutation.isPending &&
                                addMemberMutation.variables?.boardId === selectedBoardIdNumber &&
                                addMemberMutation.variables?.userId === candidate.id;

                              return (
                                <div
                                  key={candidate.id}
                                  className="flex items-center justify-between gap-4 rounded-[24px] border border-[#d9e3ef] bg-white px-5 py-4 shadow-sm"
                                >
                                  <div className="flex min-w-0 items-center gap-4">
                                    <img
                                      src={getUserAvatar(candidate)}
                                      alt={getUserDisplayName(candidate)}
                                      className="h-12 w-12 rounded-2xl object-cover"
                                    />
                                    <div className="min-w-0">
                                      <div className="truncate text-[16px] font-extrabold text-[#162231]">{getUserDisplayName(candidate)}</div>
                                      <div className="truncate text-[13px] font-medium text-[#5b6b80]">{candidate.email}</div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={!selectedBoardIdNumber || isAdding}
                                    onClick={() => {
                                      if (!selectedBoardIdNumber) return;
                                      addMemberMutation.mutate({
                                        boardId: selectedBoardIdNumber,
                                        userId: candidate.id,
                                        role: inviteRole,
                                      });
                                    }}
                                    className="rounded-2xl bg-[#0f4fe6] px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(15,79,230,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isAdding ? 'Adding...' : 'Add'}
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="rounded-[32px] bg-[#eef4fa] p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                    <div className="mb-8">
                      <h2 className="text-[20px] font-extrabold text-[#162231]">Selected Board Members</h2>
                      <p className="mt-4 text-[16px] leading-8 text-[#5b6b80]">
                        Adjust roles for the selected board without leaving the workspace-level roster.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {selectedBoardMembersSorted.map((member) => {
                        const draftRole = roleDrafts[member.user_id] || 'member';
                        const hasRoleChange = member.role !== 'owner' && draftRole !== member.role;
                        const isUpdating =
                          updateRoleMutation.isPending &&
                          updateRoleMutation.variables?.boardId === selectedBoardIdNumber &&
                          updateRoleMutation.variables?.userId === member.user_id;
                        const isRemoving =
                          removeMemberMutation.isPending &&
                          removeMemberMutation.variables?.boardId === selectedBoardIdNumber &&
                          removeMemberMutation.variables?.userId === member.user_id;

                        return (
                          <div
                            key={member.user_id}
                            className="rounded-[24px] border border-[#d9e3ef] bg-white p-5 shadow-sm"
                          >
                            <div className="flex flex-col gap-5">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-4">
                                  <div className="relative">
                                    <img
                                      src={getUserAvatar(member.user)}
                                      alt={getUserDisplayName(member.user)}
                                      className="h-14 w-14 rounded-2xl object-cover"
                                    />
                                    <span
                                      className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                                        selectedBoardOnlineUsers.includes(member.user_id) ? 'bg-[#03a63c]' : 'bg-[#c8d3de]'
                                      }`}
                                    />
                                  </div>

                                  <div className="min-w-0">
                                    <div className="truncate text-[18px] font-extrabold text-[#162231]">
                                      {getUserDisplayName(member.user)}
                                    </div>
                                    <div className="truncate text-[13px] font-medium text-[#5b6b80]">
                                      {member.user?.email || 'No email available'}
                                    </div>
                                  </div>
                                </div>

                                <span className={`rounded-xl px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] ${roleBadgeClasses[member.role]}`}>
                                  {member.role}
                                </span>
                              </div>

                              {member.role === 'owner' ? (
                                <div className="rounded-[18px] border border-dashed border-[#d9e3ef] bg-[#f8fbff] px-4 py-3 text-[13px] font-medium text-[#5b6b80]">
                                  Board owners keep full access and cannot be demoted or removed from this view.
                                </div>
                              ) : (
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                  <div className="lg:min-w-[220px]">
                                    <SelectField
                                      size="md"
                                      value={draftRole}
                                      disabled={!canManageSelectedBoard || isUpdating || isRemoving}
                                      onChange={(value) =>
                                        setRoleDrafts((current) => ({
                                          ...current,
                                          [member.user_id]: value as ManageableRole,
                                        }))
                                      }
                                      options={roleOptions}
                                    />
                                  </div>

                                  <div className="flex flex-wrap gap-3">
                                    <button
                                      type="button"
                                      disabled={!canManageSelectedBoard || !hasRoleChange || isUpdating || isRemoving || !selectedBoardIdNumber}
                                      onClick={() => {
                                        if (!selectedBoardIdNumber) return;
                                        updateRoleMutation.mutate({
                                          boardId: selectedBoardIdNumber,
                                          userId: member.user_id,
                                          role: draftRole,
                                        });
                                      }}
                                      className="rounded-2xl bg-[#0f4fe6] px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(15,79,230,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {isUpdating ? 'Saving...' : 'Save Role'}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={!canManageSelectedBoard || isUpdating || isRemoving || !selectedBoardIdNumber}
                                      onClick={() => {
                                        if (!selectedBoardIdNumber) return;
                                        removeMemberMutation.mutate({
                                          boardId: selectedBoardIdNumber,
                                          userId: member.user_id,
                                        });
                                      }}
                                      className="rounded-2xl bg-[#fff1f1] px-4 py-2.5 text-sm font-bold text-[#b42318] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {isRemoving ? 'Removing...' : 'Remove'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
