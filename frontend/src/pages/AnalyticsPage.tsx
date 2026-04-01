import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { boardApi } from '@/services/api';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { useI18n } from '@/context/I18nContext';

function isDueSoon(value?: string | null) {
  if (!value) return false;

  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return false;

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  return dueDate >= now && dueDate <= nextWeek;
}

export function AnalyticsPage() {
  const { t } = useI18n();
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);

  const { data: boardsResponse, isLoading: boardsLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: () => boardApi.getAll(),
  });

  const boards = boardsResponse?.data || [];

  useEffect(() => {
    if (!selectedBoardId && boards.length > 0) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId]);

  const { data: boardResponse, isLoading: boardLoading } = useQuery({
    queryKey: ['board', selectedBoardId, 'analytics-page'],
    queryFn: () => boardApi.getOne(selectedBoardId!),
    enabled: !!selectedBoardId,
  });

  const board = boardResponse?.data;
  const lists = board?.lists || [];
  const cards = lists.flatMap((list) => list.cards || []);
  const completedCards = cards.filter((card) => !!card.completed_at).length;
  const activeCards = cards.length - completedCards;
  const dueSoonCards = cards.filter((card) => !card.completed_at && isDueSoon(card.due_date)).length;
  const completionRate = cards.length > 0 ? Math.round((completedCards / cards.length) * 100) : 0;

  if (boardsLoading) {
    return (
      <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-gray-800">
        <Sidebar activePage="analytics" />
        <main className="flex-1 flex items-center justify-center bg-[#fcfcfc]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-[#0d6efd] border-t-transparent animate-spin"></div>
            <div className="text-gray-500 font-semibold tracking-wider text-sm animate-pulse">{t('analytics.loading').toUpperCase()}</div>
          </div>
        </main>
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-gray-800">
        <Sidebar activePage="analytics" />
        <main className="flex-1 flex flex-col bg-[#fcfcfc]">
          <TopNav title={t('analytics.title')} />
          <div className="flex-1 px-10 py-10">
            <div className="mx-auto flex max-w-[860px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-gray-200 bg-white px-10 py-20 text-center shadow-sm">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#0d6efd]">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 13v5m4-8v8m4-12v12M4 20h16" />
                </svg>
              </div>
              <h1 className="text-[30px] font-extrabold tracking-tight text-gray-900">{t('analytics.noBoardsTitle')}</h1>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-gray-500">
                {t('analytics.noBoardsDesc')}
              </p>
              <div className="mt-8 flex gap-4">
                <Link
                  to="/projects/new"
                  className="rounded-2xl bg-[#0d6efd] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(13,110,253,0.22)]"
                >
                  {t('analytics.createProject')}
                </Link>
                <Link
                  to="/boards"
                  className="rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700"
                >
                  {t('analytics.browseBoards')}
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-gray-800">
      <Sidebar activePage="analytics" />

      <main className="flex-1 flex flex-col relative bg-[#fcfcfc]">
        <TopNav title={t('analytics.teamTitle')} />

        <div className="flex-1 overflow-y-auto px-10 xl:px-16 py-10 pb-24 custom-scrollbar relative">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="mb-4 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-gray-500">
                  <span>{t('analytics.workspace')}</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-gray-900">{t('analytics.boardAnalytics')}</span>
                </div>
                <h1 className="text-[34px] font-extrabold tracking-tight leading-none text-gray-900">
                  {board?.title || t('analytics.selectBoard')}
                </h1>
                <p className="mt-3 max-w-2xl text-[14px] font-medium leading-relaxed text-gray-500">
                  Track live workflow health with cycle time, lead time, throughput, and cumulative flow based on your real board data.
                </p>
              </div>

              <div className="w-full max-w-[340px] rounded-[1.5rem] border border-gray-200 bg-white p-4 shadow-sm">
                <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-400">
                  {t('analytics.board')}
                </label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-[#0d6efd]"
                  value={selectedBoardId ?? ''}
                  onChange={(event) => setSelectedBoardId(Number(event.target.value))}
                >
                  {boards.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {boardLoading || !board ? (
              <div className="rounded-[2rem] border border-gray-100 bg-white px-8 py-24 text-center text-gray-500 shadow-sm">
                {t('analytics.boardLoading')}
              </div>
            ) : (
              <>
                <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-400">{t('analytics.completion')}</p>
                    <p className="mt-3 text-[34px] font-extrabold tracking-tight text-gray-900">{completionRate}%</p>
                    <p className="mt-2 text-sm font-medium text-gray-500">{t('analytics.cardsCompleted', { done: completedCards, total: cards.length })}</p>
                  </div>
                  <div className="rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-400">{t('analytics.activeCards')}</p>
                    <p className="mt-3 text-[34px] font-extrabold tracking-tight text-gray-900">{activeCards}</p>
                    <p className="mt-2 text-sm font-medium text-gray-500">{t('analytics.activeCardsDesc', { lists: lists.length })}</p>
                  </div>
                  <div className="rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-400">{t('analytics.dueSoon')}</p>
                    <p className="mt-3 text-[34px] font-extrabold tracking-tight text-gray-900">{dueSoonCards}</p>
                    <p className="mt-2 text-sm font-medium text-gray-500">{t('analytics.dueSoonDesc')}</p>
                  </div>
                  <div className="rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-400">{t('analytics.boardShape')}</p>
                    <p className="mt-3 text-[34px] font-extrabold tracking-tight text-gray-900">
                      {lists.length}/{board.swimlanes?.length || 0}
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-500">{t('analytics.boardShapeDesc')}</p>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
                  <AnalyticsDashboard boardId={board.id} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
