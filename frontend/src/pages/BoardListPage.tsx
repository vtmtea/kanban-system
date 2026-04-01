import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { useI18n } from '@/context/I18nContext';
import { projectApi } from '@/services/api';
import type { Project } from '@/types';

const priorityClasses: Record<string, string> = {
  urgent: 'bg-[#ffe1e1] text-[#b42318]',
  high: 'bg-[#fff0dd] text-[#b45309]',
  medium: 'bg-[#e4ecff] text-[#0f4fe6]',
  low: 'bg-[#e8f5ec] text-[#027a48]',
};

const statusClasses: Record<string, string> = {
  planning: 'bg-[#eef4fa] text-[#4e5f74]',
  active: 'bg-[#dfe7ff] text-[#0f4fe6]',
  'on-hold': 'bg-[#fff0dd] text-[#b45309]',
  completed: 'bg-[#e8f5ec] text-[#027a48]',
};

export function BoardListPage() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [pageNotice, setPageNotice] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getAll(),
  });

  const projects = data?.data || [];

  useEffect(() => {
    const routeNotice =
      location.state &&
      typeof location.state === 'object' &&
      'notice' in location.state &&
      typeof location.state.notice === 'string'
        ? location.state.notice
        : '';

    if (!routeNotice) return;

    setPageNotice(routeNotice);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  return (
    <div className="flex h-screen bg-[#eef4fa] font-sans text-[#162231]">
      <Sidebar activePage="projects" />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7fbff]">
        <TopNav title="" searchPlaceholder={t('boardList.searchPlaceholder')} />
        <div className="flex-1 overflow-auto px-10 pb-10 pt-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-[38px] font-extrabold tracking-tight text-[#162231]">{t('boardList.title')}</h1>
                <p className="mt-2 text-[17px] font-medium text-[#5b6b80]">
                  {t('boardList.desc')}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button className="flex h-14 items-center gap-3 rounded-2xl border border-[#d9e3ef] bg-white px-6 text-[16px] font-semibold text-[#162231] shadow-[0_8px_24px_rgba(17,24,39,0.05)]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5h18M6 12h12M10 19h4" />
                  </svg>
                  {t('boardList.allProjects')}
                </button>
                <Link to="/projects/new" className="flex h-14 items-center gap-3 rounded-2xl bg-[#0f4fe6] px-7 text-[16px] font-bold text-white shadow-[0_16px_32px_rgba(15,79,230,0.24)]">
                  <span className="text-[26px] leading-none">+</span>
                  {t('boardList.newProject')}
                </Link>
              </div>
            </div>

            {pageNotice ? (
              <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[#d4f0dd] bg-[#edf9f1] px-5 py-4 text-[14px] font-semibold text-[#027a48]">
                <span>{pageNotice}</span>
                <button
                  type="button"
                  onClick={() => setPageNotice('')}
                  className="text-[13px] font-extrabold text-[#027a48] transition hover:opacity-70"
                >
                  {t('common.dismiss')}
                </button>
              </div>
            ) : null}

            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-[260px] rounded-[30px] bg-[#eef4fa] animate-pulse" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-[34px] border-2 border-dashed border-[#cfdae7] bg-white/70 px-10 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4fa] text-[#0f4fe6]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="mt-6 text-[24px] font-extrabold text-[#162231]">{t('boardList.noProjectsTitle')}</h2>
                <p className="mx-auto mt-3 max-w-[520px] text-[15px] font-medium leading-7 text-[#5b6b80]">
                  {t('boardList.noProjectsDesc')}
                </p>
                <Link to="/projects/new" className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-[#0f4fe6] px-7 py-4 text-[16px] font-bold text-white shadow-[0_16px_32px_rgba(15,79,230,0.24)]">
                  {t('boardList.createProject')}
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8 grid gap-6 md:grid-cols-3">
                  <section className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">{t('boardList.totalProjects')}</p>
                    <p className="mt-4 text-[52px] font-extrabold leading-none tracking-tight text-[#162231]">{projects.length}</p>
                  </section>
                  <section className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">{t('boardList.activeNow')}</p>
                    <p className="mt-4 text-[52px] font-extrabold leading-none tracking-tight text-[#162231]">
                      {projects.filter((project) => project.status === 'active').length}
                    </p>
                  </section>
                  <section className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">{t('boardList.boardsLinked')}</p>
                    <p className="mt-4 text-[52px] font-extrabold leading-none tracking-tight text-[#162231]">
                      {projects.reduce((sum, project) => sum + (project.boards?.length || 0), 0)}
                    </p>
                  </section>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project: Project) => {
                    const priorityClass = priorityClasses[project.priority || 'medium'] || priorityClasses.medium;
                    const statusClass = statusClasses[project.status || 'planning'] || statusClasses.planning;
                    const boardCount = project.boards?.length || 0;
                    const accentColor = project.color || '#0f4fe6';

                    return (
                      <Link
                        key={project.id}
                        to={`/projects/${project.id}`}
                        className="rounded-[30px] bg-white p-8 shadow-[0_16px_34px_rgba(16,24,40,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(16,24,40,0.09)]"
                      >
                        <div className="mb-7 flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div
                              className="flex h-[64px] w-[64px] items-center justify-center rounded-[24px] text-[22px] font-extrabold text-white shadow-sm"
                              style={{ backgroundColor: accentColor }}
                            >
                              {project.title.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-[20px] font-extrabold text-[#162231]">{project.title}</h3>
                              <p className="mt-1 text-[14px] font-medium text-[#5b6b80]">{project.owner?.nickname || project.owner?.username || t('boardList.ownerFallback')}</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-right">
                            <span className={`inline-flex rounded-xl px-3 py-1.5 text-[12px] font-bold ${priorityClass}`}>
                              {t(`boardList.priority.${project.priority || 'medium'}`)}
                            </span>
                            <div className={`rounded-xl px-3 py-1.5 text-[12px] font-bold ${statusClass}`}>
                              {t(`boardList.status.${project.status || 'planning'}`)}
                            </div>
                          </div>
                        </div>

                        <p className="mb-8 min-h-[72px] text-[14px] font-medium leading-7 text-[#5b6b80]">
                          {project.description || t('boardList.noDescription')}
                        </p>

                        <div className="mb-6 grid grid-cols-2 gap-4">
                          <div className="rounded-[22px] bg-[#eef4fa] px-5 py-4">
                            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#4e5f74]">{t('boardList.boards')}</div>
                            <div className="mt-3 text-[28px] font-extrabold text-[#162231]">{boardCount}</div>
                          </div>
                          <div className="rounded-[22px] bg-[#eef4fa] px-5 py-4">
                            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#4e5f74]">{t('boardList.target')}</div>
                            <div className="mt-3 text-[16px] font-extrabold text-[#162231]">{project.target_date || t('common.notSet')}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[13px] font-semibold text-[#5b6b80]">
                          <span>{t('boardList.startDate', { date: project.start_date || t('common.tbd') })}</span>
                          <span>{t('boardList.openProject')}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
