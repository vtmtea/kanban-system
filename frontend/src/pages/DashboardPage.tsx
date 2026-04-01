import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { boardApi, projectApi, resolveAssetUrl } from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { useAuth } from '@/context/AuthContext';
import type { Activity, Board, Card, Project } from '@/types';

type ActivityWithBoard = Activity & {
  boardTitle: string;
};

type BoardCardSummary = Card & {
  boardId: number;
  boardTitle: string;
  boardColor?: string | null;
  projectId?: number | null;
  projectTitle: string;
};

function formatRelativeTime(value?: string | null) {
  if (!value) return 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const absMinutes = Math.abs(diffMinutes);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absMinutes < 60) return rtf.format(Math.round(diffMinutes), 'minute');

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, 'day');
}

function formatShortDate(value?: string | null) {
  if (!value) return 'No due date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No due date';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function isOverdue(value?: string | null) {
  if (!value) return false;

  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return false;

  return dueDate.getTime() < Date.now();
}

function isDueSoon(value?: string | null) {
  if (!value) return false;

  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return false;

  const now = Date.now();
  const nextWeek = now + 7 * 24 * 60 * 60 * 1000;

  return dueDate.getTime() >= now && dueDate.getTime() <= nextWeek;
}

function getUserDisplayName(activity: ActivityWithBoard) {
  return activity.user?.nickname || activity.user?.username || 'A teammate';
}

function getBoardInitial(board: Board) {
  return board.title.charAt(0).toUpperCase();
}

async function loadDashboardData() {
  const [projectsResponse, boardsResponse] = await Promise.all([
    projectApi.getAll(),
    boardApi.getAll(),
  ]);

  const projects = projectsResponse.data;
  const lightweightBoards = boardsResponse.data;

  const detailResults = await Promise.allSettled(
    lightweightBoards.map((board) => boardApi.getOne(board.id))
  );
  const boards = detailResults.flatMap((result) => (
    result.status === 'fulfilled' ? [result.value.data] : []
  ));

  const recentBoards = lightweightBoards.slice(0, 6);
  const activityResults = await Promise.allSettled(
    recentBoards.map((board) => boardApi.getActivities(board.id, { page: 1, limit: 4 }))
  );

  const activities = activityResults.flatMap((result, index) => (
    result.status === 'fulfilled'
      ? result.value.data.data.map((activity) => ({
          ...activity,
          boardTitle: recentBoards[index]?.title || 'Board',
        }))
      : []
  ));

  return {
    projects,
    boards,
    activities,
  };
}

export function DashboardPage() {
  const { user } = useAuth();
  const displayName = user?.nickname || user?.username || 'there';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: loadDashboardData,
  });

  const projects = data?.projects || [];
  const boards = data?.boards || [];
  const projectLookup = new Map<number, Project>(projects.map((project) => [project.id, project]));

  const allCards: BoardCardSummary[] = boards.flatMap((board) => {
    const projectTitle = board.project_id ? projectLookup.get(board.project_id)?.title || `Project #${board.project_id}` : 'Standalone Board';
    return (board.lists || []).flatMap((list) =>
      (list.cards || []).map((card) => ({
        ...card,
        boardId: board.id,
        boardTitle: board.title,
        boardColor: board.color,
        projectId: board.project_id,
        projectTitle,
      }))
    );
  });

  const completedCards = allCards.filter((card) => !!card.completed_at).length;
  const openCards = allCards.length - completedCards;
  const dueSoonCards = allCards.filter((card) => !card.completed_at && isDueSoon(card.due_date));
  const overdueCards = allCards
    .filter((card) => !card.completed_at && isOverdue(card.due_date))
    .sort((left, right) => new Date(left.due_date || '').getTime() - new Date(right.due_date || '').getTime());
  const focusCards = [...overdueCards, ...dueSoonCards].slice(0, 3);
  const upcomingDeadlines = allCards
    .filter((card) => !card.completed_at && card.due_date && !isOverdue(card.due_date))
    .sort((left, right) => new Date(left.due_date || '').getTime() - new Date(right.due_date || '').getTime())
    .slice(0, 4);
  const collaboratorCount = new Set(
    boards.flatMap((board) => (board.members || []).map((member) => member.user_id))
  ).size;
  const recentActivities = [...(data?.activities || [])]
    .sort((left, right) => new Date(right.created_at || '').getTime() - new Date(left.created_at || '').getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#eef4fa] font-sans text-[#162231]">
        <Sidebar activePage="dashboard" />
        <main className="flex min-w-0 flex-1 items-center justify-center bg-[#f7fbff]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-4 border-[#0f4fe6] border-t-transparent animate-spin"></div>
            <div className="text-sm font-semibold tracking-wider text-[#5b6b80] animate-pulse">LOADING DASHBOARD...</div>
          </div>
        </main>
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="flex h-screen bg-[#eef4fa] font-sans text-[#162231]">
        <Sidebar activePage="dashboard" />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7fbff]">
          <TopNav title="" searchPlaceholder="Search workspace..." />
          <div className="flex-1 overflow-auto px-10 pb-10 pt-8">
            <div className="mx-auto flex max-w-[900px] flex-col items-center justify-center rounded-[2.25rem] border border-dashed border-[#d7e3ef] bg-white px-10 py-24 text-center shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[#d9e6fb] text-[#0f4fe6]">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
                </svg>
              </div>
              <h1 className="text-[38px] font-extrabold tracking-tight text-[#162231]">Your workspace is ready for its first board</h1>
              <p className="mt-3 max-w-2xl text-[16px] leading-8 text-[#5b6b80]">
                Create a project or open the boards hub to start tracking tasks, collecting activity history, and generating analytics.
              </p>
              <div className="mt-8 flex gap-4">
                <Link to="/projects/new" className="rounded-2xl bg-[#0f4fe6] px-7 py-3 text-sm font-bold text-white shadow-[0_16px_32px_rgba(15,79,230,0.24)]">
                  New Project
                </Link>
                <Link to="/boards" className="rounded-2xl border border-[#d9e3ef] bg-white px-7 py-3 text-sm font-bold text-[#162231]">
                  Browse Boards
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
      <Sidebar activePage="dashboard" />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7fbff]">
        <TopNav title="" searchPlaceholder="Search workspace..." />

        <div className="flex-1 overflow-auto px-10 pb-10 pt-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-[38px] font-extrabold tracking-tight text-[#162231]">Welcome back, {displayName}</h1>
                <p className="mt-2 text-[17px] font-medium text-[#5b6b80]">
                  {overdueCards.length > 0
                    ? `${overdueCards.length} overdue tasks need attention across your boards.`
                    : `${dueSoonCards.length} tasks are due within the next 7 days.`}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Link
                  to="/boards"
                  className="flex h-14 items-center gap-3 rounded-2xl border border-[#d9e3ef] bg-white px-6 text-[16px] font-semibold text-[#162231] shadow-[0_8px_24px_rgba(17,24,39,0.05)]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 7h16M4 12h16M4 17h10" />
                  </svg>
                  Open Boards
                </Link>
                <Link
                  to="/projects/new"
                  className="flex h-14 items-center gap-3 rounded-2xl bg-[#0f4fe6] px-7 text-[16px] font-bold text-white shadow-[0_16px_32px_rgba(15,79,230,0.28)]"
                >
                  <span className="text-[26px] leading-none">+</span>
                  New Project
                </Link>
              </div>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0">
                <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { title: 'Projects', value: projects.length, badge: 'Workspace', badgeClass: 'bg-[#dfe7ff] text-[#0f4fe6]', iconClass: 'bg-[#d9e6fb] text-[#0f4fe6]' },
                    { title: 'Boards', value: boards.length, badge: 'Active', badgeClass: 'bg-[#eef4fa] text-[#4c6078]', iconClass: 'bg-[#dfe5ea] text-[#5f718b]' },
                    { title: 'Open Tasks', value: openCards, badge: `${dueSoonCards.length} Due Soon`, badgeClass: 'bg-[#fff2e2] text-[#a65612]', iconClass: 'bg-[#ece5de] text-[#a65612]' },
                    { title: 'Completed Tasks', value: completedCards, badge: `${collaboratorCount} Collaborators`, badgeClass: 'bg-[#e3f8ec] text-[#137a4b]', iconClass: 'bg-[#d9f2e4] text-[#137a4b]' },
                  ].map((item) => (
                    <section key={item.title} className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <div className="mb-7 flex items-start justify-between">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-3xl ${item.iconClass}`}>
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 12h14M12 5v14" />
                          </svg>
                        </div>
                        <span className={`rounded-xl px-3 py-1.5 text-[13px] font-bold ${item.badgeClass}`}>{item.badge}</span>
                      </div>
                      <p className="text-[18px] font-medium text-[#4d5d72]">{item.title}</p>
                      <p className="mt-2 text-[46px] font-extrabold leading-none tracking-tight text-[#162231]">{item.value}</p>
                    </section>
                  ))}
                </div>

                <section className="mb-8">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-[20px] font-extrabold text-[#162231]">Active Boards</h2>
                    <Link to="/boards" className="text-[14px] font-bold text-[#0f4fe6] hover:underline">View all boards</Link>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    {boards.slice(0, 4).map((board) => {
                      const boardCards = (board.lists || []).flatMap((list) => list.cards || []);
                      const boardCompleted = boardCards.filter((card) => !!card.completed_at).length;
                      const progress = boardCards.length > 0 ? Math.round((boardCompleted / boardCards.length) * 100) : 0;
                      const members = board.members || [];

                      return (
                        <Link
                          key={board.id}
                          to={`/boards/${board.id}`}
                          className="rounded-[30px] bg-white p-8 shadow-[0_16px_34px_rgba(16,24,40,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(16,24,40,0.09)]"
                        >
                          <div className="mb-7 flex items-start justify-between">
                            <div className="flex items-center gap-5">
                              <div
                                className="flex h-[72px] w-[72px] items-center justify-center rounded-[24px] text-[28px] font-extrabold text-white shadow-sm"
                                style={{ backgroundColor: board.color || '#0f4fe6' }}
                              >
                                {getBoardInitial(board)}
                              </div>
                              <div>
                                <h3 className="text-[20px] font-extrabold text-[#162231]">{board.title}</h3>
                                <p className="mt-1 text-[14px] font-medium text-[#5b6b80]">
                                  {board.project_id ? projectLookup.get(board.project_id)?.title || `Project #${board.project_id}` : 'Standalone Board'}
                                </p>
                              </div>
                            </div>
                            <div className="rounded-xl bg-[#eef4fa] px-3 py-1.5 text-[12px] font-bold text-[#4c6078]">
                              {boardCards.length} cards
                            </div>
                          </div>

                          <div className="mb-8 flex items-center">
                            <div className="flex -space-x-2">
                              {members.slice(0, 3).map((member) => (
                                member.user?.avatar ? (
                                  <img
                                    key={member.id}
                                    src={resolveAssetUrl(member.user.avatar)}
                                    alt={member.user.nickname || member.user.username || 'Member'}
                                    className="h-9 w-9 rounded-full border-2 border-white object-cover"
                                  />
                                ) : (
                                  <div
                                    key={member.id}
                                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#dce6f1] text-[12px] font-bold text-[#4c6078]"
                                  >
                                    {(member.user?.nickname || member.user?.username || '?').slice(0, 1).toUpperCase()}
                                  </div>
                                )
                              ))}
                              {members.length > 3 ? (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#dce6f1] text-[12px] font-bold text-[#4c6078]">
                                  +{members.length - 3}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="mb-2 flex items-center justify-between text-[14px] font-semibold text-[#4d5d72]">
                            <span>Completion</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#e8eef5]">
                            <div className="h-2 rounded-full" style={{ width: `${progress}%`, backgroundColor: board.color || '#0f4fe6' }}></div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-[34px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-[20px] font-extrabold text-[#162231]">Recent Activity</h2>
                    <Link to="/boards" className="text-[13px] font-bold text-[#0f4fe6] hover:underline">
                      Open activity feeds
                    </Link>
                  </div>

                  {recentActivities.length === 0 ? (
                    <div className="rounded-[26px] bg-white p-8 text-center text-[15px] font-medium text-[#5b6b80] shadow-sm">
                      Activity will appear here as your team creates cards, comments, and moves work across boards.
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {recentActivities.map((activity, index) => (
                        <div key={`${activity.id}-${index}`} className="flex gap-5">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d9e6fb] text-[#0f4fe6]">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 8v8m-4-4h8" />
                            </svg>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[16px] leading-7 text-[#223042]">
                              <span className="font-extrabold">{getUserDisplayName(activity)}</span>{' '}
                              <span className="font-medium text-[#4d5d72]">{activity.content}</span>{' '}
                              <span className="rounded-xl bg-[#dfe7ff] px-3 py-1 text-[13px] font-bold text-[#4b5f85]">
                                {activity.boardTitle}
                              </span>
                            </p>
                            <p className="mt-4 text-[12px] font-extrabold tracking-[0.2em] text-[#687a92]">
                              {formatRelativeTime(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <aside className="space-y-8">
                <section className="rounded-[34px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-[20px] font-extrabold text-[#162231]">Priority Focus</h2>
                    <span className="rounded-full bg-[#ff7d1f] px-3 py-1 text-[12px] font-extrabold text-[#321300]">
                      {overdueCards.length > 0 ? 'URGENT' : 'UP NEXT'}
                    </span>
                  </div>

                  <div className="space-y-5">
                    {focusCards.length === 0 ? (
                      <div className="rounded-[26px] bg-white p-6 text-sm font-medium leading-7 text-[#5b6b80] shadow-sm">
                        No urgent cards right now. Your workspace is caught up for the moment.
                      </div>
                    ) : (
                      focusCards.map((card) => (
                        <Link key={card.id} to={`/boards/${card.boardId}`} className="block rounded-[26px] bg-white p-6 shadow-sm transition hover:-translate-y-0.5">
                          <div className="mb-3 flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-[16px] font-extrabold text-[#162231]">{card.title}</h3>
                              <p className="mt-1 text-[13px] font-medium text-[#5b6b80]">
                                {card.projectTitle} • {card.boardTitle}
                              </p>
                            </div>
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
                              style={{ backgroundColor: isOverdue(card.due_date) ? '#b45309' : card.boardColor || '#0f4fe6' }}
                            >
                              !
                            </div>
                          </div>
                          <div className="inline-flex rounded-full bg-[#eef4fa] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#4c6078]">
                            {isOverdue(card.due_date) ? `Overdue • ${formatShortDate(card.due_date)}` : `Due • ${formatShortDate(card.due_date)}`}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-[34px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-[20px] font-extrabold text-[#162231]">Upcoming Deadlines</h2>
                    <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#687a92]">
                      {upcomingDeadlines.length} cards
                    </span>
                  </div>

                  <div className="space-y-4">
                    {upcomingDeadlines.length === 0 ? (
                      <div className="rounded-[26px] bg-white p-6 text-sm font-medium leading-7 text-[#5b6b80] shadow-sm">
                        No upcoming deadlines were found in the next window of open work.
                      </div>
                    ) : (
                      upcomingDeadlines.map((card) => (
                        <Link key={card.id} to={`/boards/${card.boardId}`} className="flex items-center gap-4 rounded-[24px] bg-white p-4 shadow-sm transition hover:-translate-y-0.5">
                          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[18px] bg-[#d9e6fb] text-[#0f4fe6]">
                            <span className="text-[11px] font-bold uppercase tracking-[0.16em]">Due</span>
                            <span className="text-[18px] font-extrabold leading-none">{formatShortDate(card.due_date).split(' ')[1] || '--'}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-[15px] font-extrabold text-[#162231]">{card.title}</div>
                            <div className="mt-1 text-[13px] font-medium text-[#5b6b80]">
                              {card.boardTitle} • {formatShortDate(card.due_date)}
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
