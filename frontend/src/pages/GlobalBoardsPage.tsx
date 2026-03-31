import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CreateBoardModal } from '@/components/CreateBoardModal';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { boardApi, projectApi } from '@/services/api';
import type { Board } from '@/types';

type BoardFilter = 'all' | 'linked' | 'standalone';

const filterLabels: Record<BoardFilter, string> = {
  all: 'All Boards',
  linked: 'Project Boards',
  standalone: 'Standalone',
};

function formatDateLabel(value?: string) {
  if (!value) return 'Recently updated';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function GlobalBoardsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<BoardFilter>('all');
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);

  const { data: boardsResponse, isLoading: boardsLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: () => boardApi.getAll(),
  });

  const { data: projectsResponse, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getAll(),
  });

  const boards = boardsResponse?.data || [];
  const projects = projectsResponse?.data || [];

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

  const filteredBoards = useMemo(() => {
    switch (activeFilter) {
      case 'linked':
        return boards.filter((board) => board.project_id);
      case 'standalone':
        return boards.filter((board) => !board.project_id);
      default:
        return boards;
    }
  }, [activeFilter, boards]);

  const stats = useMemo(
    () => ({
      total: boards.length,
      linked: boards.filter((board) => board.project_id).length,
      standalone: boards.filter((board) => !board.project_id).length,
    }),
    [boards]
  );

  return (
    <div className="flex h-screen bg-[#eef4fa] font-sans text-[#162231]">
      <Sidebar activePage="boards" />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7fbff]">
        <TopNav title="" searchPlaceholder="Search boards..." />

        <div className="flex-1 overflow-auto px-10 pb-10 pt-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-[38px] font-extrabold tracking-tight text-[#162231]">Boards</h1>
                <p className="mt-2 text-[17px] font-medium text-[#5b6b80]">
                  See every board across the workspace, including project-linked delivery boards and standalone spaces.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex rounded-2xl border border-[#d9e3ef] bg-white p-1 shadow-[0_8px_24px_rgba(17,24,39,0.05)]">
                  {(['all', 'linked', 'standalone'] as BoardFilter[]).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-[14px] px-4 py-3 text-[14px] font-bold transition ${
                        activeFilter === filter
                          ? 'bg-[#0f4fe6] text-white shadow-[0_10px_18px_rgba(15,79,230,0.24)]'
                          : 'text-[#5b6b80] hover:text-[#162231]'
                      }`}
                    >
                      {filterLabels[filter]}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateBoardModal(true)}
                  className="flex h-14 items-center gap-3 rounded-2xl bg-[#0f4fe6] px-7 text-[16px] font-bold text-white shadow-[0_16px_32px_rgba(15,79,230,0.24)]"
                >
                  <span className="text-[26px] leading-none">+</span>
                  New Board
                </button>
              </div>
            </div>

            <div className="mb-8 grid gap-6 md:grid-cols-3">
              <section className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">TOTAL BOARDS</p>
                <p className="mt-4 text-[52px] font-extrabold leading-none tracking-tight text-[#162231]">{stats.total}</p>
              </section>
              <section className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">LINKED TO PROJECTS</p>
                <p className="mt-4 text-[52px] font-extrabold leading-none tracking-tight text-[#162231]">{stats.linked}</p>
              </section>
              <section className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">STANDALONE BOARDS</p>
                <p className="mt-4 text-[52px] font-extrabold leading-none tracking-tight text-[#162231]">{stats.standalone}</p>
              </section>
            </div>

            {boardsLoading || projectsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[280px] rounded-[30px] bg-[#eef4fa] animate-pulse" />
                ))}
              </div>
            ) : filteredBoards.length === 0 ? (
              <div className="rounded-[34px] border-2 border-dashed border-[#cfdae7] bg-white/70 px-10 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4fa] text-[#0f4fe6]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="mt-6 text-[24px] font-extrabold text-[#162231]">No boards in this view</h2>
                <p className="mx-auto mt-3 max-w-[520px] text-[15px] font-medium leading-7 text-[#5b6b80]">
                  Create a new board, or switch filters to view project-linked and standalone boards separately.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateBoardModal(true)}
                  className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-[#0f4fe6] px-7 py-4 text-[16px] font-bold text-white shadow-[0_16px_32px_rgba(15,79,230,0.24)]"
                >
                  Create Board
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredBoards.map((board: Board) => {
                  const project = board.project_id ? projectMap.get(board.project_id) : undefined;
                  const listCount = board.lists?.length || 0;
                  const accentColor = board.color || '#0f4fe6';

                  return (
                    <Link
                      key={board.id}
                      to={`/boards/${board.id}`}
                      className="rounded-[30px] bg-white p-8 shadow-[0_16px_34px_rgba(16,24,40,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(16,24,40,0.09)]"
                    >
                      <div className="mb-7 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="flex h-[64px] w-[64px] items-center justify-center rounded-[24px] text-[22px] font-extrabold text-white shadow-sm"
                            style={{ backgroundColor: accentColor }}
                          >
                            {board.title.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#6b7b90]">
                              {project ? `Project: ${project.title}` : 'Standalone Board'}
                            </div>
                            <h3 className="mt-2 text-[20px] font-extrabold text-[#162231]">{board.title}</h3>
                          </div>
                        </div>
                        <span
                          className={`rounded-xl px-3 py-1.5 text-[12px] font-bold ${
                            board.is_public
                              ? 'bg-[#e8f5ec] text-[#027a48]'
                              : 'bg-[#eef4fa] text-[#4e5f74]'
                          }`}
                        >
                          {board.is_public ? 'PUBLIC' : 'PRIVATE'}
                        </span>
                      </div>

                      <p className="mb-8 min-h-[72px] text-[14px] font-medium leading-7 text-[#5b6b80]">
                        {board.description || 'No board description yet.'}
                      </p>

                      <div className="mb-6 grid grid-cols-2 gap-4">
                        <div className="rounded-[22px] bg-[#eef4fa] px-5 py-4">
                          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#4e5f74]">Lists</div>
                          <div className="mt-3 text-[28px] font-extrabold text-[#162231]">{listCount}</div>
                        </div>
                        <div className="rounded-[22px] bg-[#eef4fa] px-5 py-4">
                          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#4e5f74]">Owner</div>
                          <div className="mt-3 text-[16px] font-extrabold text-[#162231]">
                            {board.owner?.nickname || board.owner?.username || 'Unknown'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[13px] font-semibold text-[#5b6b80]">
                        <span>Updated {formatDateLabel(board.updated_at)}</span>
                        <span>Open Board</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {projects.length === 0 ? (
              <div className="mt-8 rounded-[30px] border border-[#d9e3ef] bg-white px-8 py-6 text-[14px] font-medium text-[#5b6b80] shadow-[0_12px_24px_rgba(16,24,40,0.04)]">
                No projects exist yet. You can still create standalone boards, or start by creating a
                {' '}
                <Link to="/projects/new" className="font-bold text-[#0f4fe6] hover:underline">
                  new project
                </Link>
                .
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <CreateBoardModal
        isOpen={showCreateBoardModal}
        onClose={() => setShowCreateBoardModal(false)}
        onCreated={(boardId) => navigate(`/boards/${boardId}`)}
      />
    </div>
  );
}
