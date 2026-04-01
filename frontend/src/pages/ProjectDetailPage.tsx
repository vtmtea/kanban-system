import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { projectApi } from '@/services/api';
import { CreateBoardModal } from '@/components/CreateBoardModal';
import { SelectField } from '@/components/SelectField';
import { DatePickerField } from '@/components/DatePickerField';
import { useAuth } from '@/context/AuthContext';

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

const projectStatusOptions = [
  { value: 'planning', label: 'Planning', description: 'Early shaping and scope definition.' },
  { value: 'active', label: 'Active', description: 'Delivery work is in motion.' },
  { value: 'on-hold', label: 'On Hold', description: 'Work is paused pending a decision or dependency.' },
  { value: 'completed', label: 'Completed', description: 'The project has reached its intended outcome.' },
];

const projectPriorityOptions = [
  { value: 'low', label: 'Low', description: 'Nice-to-have effort with flexible timing.' },
  { value: 'medium', label: 'Medium', description: 'Important work with standard urgency.' },
  { value: 'high', label: 'High', description: 'Important work that needs active attention.' },
  { value: 'urgent', label: 'Urgent', description: 'Critical work that needs immediate focus.' },
];

export function ProjectDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [projectNotice, setProjectNotice] = useState('');
  const [projectError, setProjectError] = useState('');
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    color: '#0f4fe6',
    start_date: '',
    target_date: '',
    status: 'planning',
    priority: 'medium',
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getOne(projectId),
    enabled: Number.isFinite(projectId),
  });

  const project = data?.data;
  const boards = project?.boards || [];
  const priorityClass = priorityClasses[project?.priority || 'medium'] || priorityClasses.medium;
  const statusClass = statusClasses[project?.status || 'planning'] || statusClasses.planning;
  const isOwner = !!user && project?.owner_id === user.id;
  const hasProjectChanges =
    !!project &&
    (
      projectForm.title.trim() !== project.title ||
      projectForm.description.trim() !== (project.description || '') ||
      projectForm.color !== (project.color || '#0f4fe6') ||
      projectForm.start_date !== (project.start_date || '') ||
      projectForm.target_date !== (project.target_date || '') ||
      projectForm.status !== (project.status || 'planning') ||
      projectForm.priority !== (project.priority || 'medium')
    );

  useEffect(() => {
    if (!project) return;

    setProjectForm({
      title: project.title,
      description: project.description || '',
      color: project.color || '#0f4fe6',
      start_date: project.start_date || '',
      target_date: project.target_date || '',
      status: project.status || 'planning',
      priority: project.priority || 'medium',
    });
  }, [project]);

  const updateProjectMutation = useMutation({
    mutationFn: () =>
      projectApi.update(projectId, {
        title: projectForm.title.trim(),
        description: projectForm.description.trim() || undefined,
        color: projectForm.color,
        start_date: projectForm.start_date || undefined,
        target_date: projectForm.target_date || undefined,
        status: projectForm.status,
        priority: projectForm.priority,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setProjectError('');
      setProjectNotice('Project details updated.');
      setIsEditing(false);
      setProjectForm({
        title: response.data.title,
        description: response.data.description || '',
        color: response.data.color || '#0f4fe6',
        start_date: response.data.start_date || '',
        target_date: response.data.target_date || '',
        status: response.data.status || 'planning',
        priority: response.data.priority || 'medium',
      });
    },
    onError: (error: any) => {
      setProjectNotice('');
      setProjectError(error.response?.data?.error || 'Failed to update project');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectApi.delete(projectId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects', {
        state: {
          notice: response.data?.message || 'Project deleted.',
        },
      });
    },
    onError: (error: any) => {
      setProjectNotice('');
      setProjectError(error.response?.data?.error || 'Failed to delete project');
    },
  });

  return (
    <div className="flex h-screen bg-[#eef4fa] font-sans text-[#162231]">
      <Sidebar activePage="projects" />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7fbff]">
        <TopNav title="" searchPlaceholder="Search boards..." />

        <div className="flex-1 overflow-auto px-10 pb-10 pt-8">
          <div className="mx-auto max-w-[1240px]">
            {isLoading ? (
              <div className="space-y-8">
                <div className="h-40 rounded-[34px] bg-[#eef4fa] animate-pulse" />
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="h-60 rounded-[30px] bg-[#eef4fa] animate-pulse" />
                  <div className="h-60 rounded-[30px] bg-[#eef4fa] animate-pulse" />
                </div>
              </div>
            ) : isError || !project ? (
              <div className="rounded-[34px] border border-[#d9e3ef] bg-white px-10 py-16 text-center">
                <h1 className="text-[28px] font-extrabold text-[#162231]">Project not found</h1>
                <p className="mt-3 text-[15px] font-medium text-[#5b6b80]">This project may have been removed or you may not have access.</p>
                <Link to="/projects" className="mt-8 inline-flex rounded-2xl bg-[#0f4fe6] px-6 py-3 text-[15px] font-bold text-white">
                  Back to Projects
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-10 rounded-[34px] bg-white p-8 shadow-[0_16px_34px_rgba(16,24,40,0.06)]">
                  <div className="mb-5 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#6b7b90]">
                    <Link to="/projects" className="transition hover:text-[#0f4fe6]">Projects</Link>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-[#162231]">{project.title}</span>
                  </div>

                  <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="mb-5 flex items-center gap-4">
                        <div
                          className="flex h-[72px] w-[72px] items-center justify-center rounded-[26px] text-[28px] font-extrabold text-white shadow-sm"
                          style={{ backgroundColor: project.color || '#0f4fe6' }}
                        >
                          {project.title.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <h1 className="text-[38px] font-extrabold tracking-tight text-[#162231]">{project.title}</h1>
                          <p className="mt-2 text-[16px] font-medium text-[#5b6b80]">
                            Owner: {project.owner?.nickname || project.owner?.username || 'Unknown'}
                          </p>
                        </div>
                      </div>

                      <p className="max-w-3xl text-[15px] font-medium leading-8 text-[#5b6b80]">
                        {project.description || 'No description has been added to this project yet.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isOwner ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditing && project) {
                              setProjectForm({
                                title: project.title,
                                description: project.description || '',
                                color: project.color || '#0f4fe6',
                                start_date: project.start_date || '',
                                target_date: project.target_date || '',
                                status: project.status || 'planning',
                                priority: project.priority || 'medium',
                              });
                              setProjectError('');
                              setProjectNotice('');
                            }
                            setIsEditing((current) => !current);
                          }}
                          className="rounded-2xl border border-[#d9e3ef] bg-white px-5 py-3 text-[14px] font-extrabold text-[#162231] shadow-sm transition hover:bg-[#f8fbff]"
                        >
                          {isEditing ? 'Cancel Editing' : 'Edit Project'}
                        </button>
                      ) : null}

                      <button
                        onClick={() => setShowCreateBoardModal(true)}
                        className="rounded-2xl bg-[#0f4fe6] px-5 py-3 text-[14px] font-extrabold text-white shadow-[0_16px_32px_rgba(15,79,230,0.2)] transition hover:bg-[#0b43c1]"
                      >
                        New Board
                      </button>
                      <span className={`rounded-2xl px-4 py-3 text-[13px] font-extrabold ${priorityClass}`}>
                        {(project.priority || 'medium').toUpperCase()}
                      </span>
                      <span className={`rounded-2xl px-4 py-3 text-[13px] font-extrabold ${statusClass}`}>
                        {(project.status || 'planning').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {projectError ? (
                  <div className="mb-6 rounded-2xl border border-[#ffd7d7] bg-[#fff5f5] px-5 py-4 text-[14px] font-semibold text-[#b42318]">
                    {projectError}
                  </div>
                ) : null}

                {projectNotice ? (
                  <div className="mb-6 rounded-2xl border border-[#d4f0dd] bg-[#edf9f1] px-5 py-4 text-[14px] font-semibold text-[#027a48]">
                    {projectNotice}
                  </div>
                ) : null}

                {isOwner && isEditing ? (
                  <section className="mb-8 rounded-[34px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                    <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <h2 className="text-[22px] font-extrabold text-[#162231]">Project Settings</h2>
                        <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">
                          Update the project brief, priority, and timeline without leaving the detail page.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={deleteProjectMutation.isPending}
                          onClick={() => {
                            const confirmed = window.confirm(
                              `Delete "${project.title}"? Linked boards will remain available as standalone boards.`
                            );
                            if (!confirmed) return;
                            deleteProjectMutation.mutate();
                          }}
                          className="rounded-2xl bg-[#fff1f1] px-5 py-3 text-[14px] font-extrabold text-[#b42318] transition hover:bg-[#ffe5e5] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete Project'}
                        </button>

                        <button
                          type="button"
                          disabled={!hasProjectChanges || !projectForm.title.trim() || updateProjectMutation.isPending}
                          onClick={() => updateProjectMutation.mutate()}
                          className="rounded-2xl bg-[#0f4fe6] px-5 py-3 text-[14px] font-extrabold text-white shadow-[0_16px_32px_rgba(15,79,230,0.2)] transition hover:bg-[#0b43c1] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updateProjectMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Project Name</span>
                        <input
                          type="text"
                          value={projectForm.title}
                          onChange={(event) => {
                            setProjectError('');
                            setProjectNotice('');
                            setProjectForm((current) => ({ ...current, title: event.target.value }));
                          }}
                          className="h-14 w-full rounded-2xl border border-[#d9e3ef] bg-white px-5 text-[15px] font-semibold text-[#162231] outline-none transition focus:border-[#b7cbe0]"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Accent Color</span>
                        <div className="flex h-14 items-center gap-3 rounded-2xl border border-[#d9e3ef] bg-white px-4">
                          <input
                            type="color"
                            value={projectForm.color}
                            onChange={(event) => {
                              setProjectError('');
                              setProjectNotice('');
                              setProjectForm((current) => ({ ...current, color: event.target.value }));
                            }}
                            className="h-9 w-9 cursor-pointer rounded-xl border-0 bg-transparent p-0"
                          />
                          <span className="text-[14px] font-bold text-[#4e5f74]">{projectForm.color}</span>
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Start Date</span>
                        <DatePickerField value={projectForm.start_date} onChange={(value) => {
                          setProjectError('');
                          setProjectNotice('');
                          setProjectForm((current) => ({ ...current, start_date: value }));
                        }} size="lg" />
                      </label>

                      <label className="block">
                        <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Target Date</span>
                        <DatePickerField value={projectForm.target_date} onChange={(value) => {
                          setProjectError('');
                          setProjectNotice('');
                          setProjectForm((current) => ({ ...current, target_date: value }));
                        }} size="lg" />
                      </label>

                      <label className="block">
                        <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Status</span>
                        <SelectField
                          size="lg"
                          value={projectForm.status}
                          onChange={(value) => {
                            setProjectError('');
                            setProjectNotice('');
                            setProjectForm((current) => ({ ...current, status: value }));
                          }}
                          options={projectStatusOptions}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Priority</span>
                        <SelectField
                          size="lg"
                          value={projectForm.priority}
                          onChange={(value) => {
                            setProjectError('');
                            setProjectNotice('');
                            setProjectForm((current) => ({ ...current, priority: value }));
                          }}
                          options={projectPriorityOptions}
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Description</span>
                        <textarea
                          rows={5}
                          value={projectForm.description}
                          onChange={(event) => {
                            setProjectError('');
                            setProjectNotice('');
                            setProjectForm((current) => ({ ...current, description: event.target.value }));
                          }}
                          className="w-full rounded-[28px] border border-[#d9e3ef] bg-white px-5 py-4 text-[15px] font-medium leading-7 text-[#162231] outline-none transition focus:border-[#b7cbe0]"
                        />
                      </label>
                    </div>
                  </section>
                ) : null}

                <div className="mb-8 grid gap-6 md:grid-cols-3">
                  <section className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">START DATE</p>
                    <p className="mt-4 text-[28px] font-extrabold leading-tight text-[#162231]">{project.start_date || 'Not set'}</p>
                  </section>
                  <section className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">TARGET DATE</p>
                    <p className="mt-4 text-[28px] font-extrabold leading-tight text-[#162231]">{project.target_date || 'Not set'}</p>
                  </section>
                  <section className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">BOARDS</p>
                    <p className="mt-4 text-[48px] font-extrabold leading-none tracking-tight text-[#162231]">{boards.length}</p>
                  </section>
                </div>

                <section className="rounded-[34px] bg-white p-8 shadow-[0_16px_34px_rgba(16,24,40,0.06)]">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-[22px] font-extrabold text-[#162231]">Boards Under This Project</h2>
                      <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">Boards are the delivery spaces that belong to this project.</p>
                    </div>
                    <Link to="/boards" className="text-[14px] font-bold text-[#0f4fe6] hover:underline">View all boards</Link>
                  </div>

                  {boards.length === 0 ? (
                    <div className="rounded-[28px] border-2 border-dashed border-[#cfdae7] bg-[#f8fbff] px-8 py-14 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4fa] text-[#0f4fe6]">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <h3 className="mt-5 text-[20px] font-extrabold text-[#162231]">No boards yet</h3>
                      <p className="mt-3 text-[14px] font-medium leading-7 text-[#5b6b80]">
                        This project exists in the API now. The next step is to create boards under it.
                      </p>
                      <button
                        onClick={() => setShowCreateBoardModal(true)}
                        className="mt-8 inline-flex rounded-2xl bg-[#0f4fe6] px-6 py-3 text-[15px] font-bold text-white shadow-[0_16px_32px_rgba(15,79,230,0.2)] transition hover:bg-[#0b43c1]"
                      >
                        Create Board
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {boards.map((board) => (
                        <Link
                          key={board.id}
                          to={`/boards/${board.id}`}
                          className="rounded-[28px] border border-[#e3eaf2] bg-[#fbfdff] p-6 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_36px_rgba(16,24,40,0.08)]"
                        >
                          <div className="mb-6 flex items-start justify-between">
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-extrabold text-white"
                              style={{ backgroundColor: board.color || '#0f4fe6' }}
                            >
                              {board.title.slice(0, 1).toUpperCase()}
                            </div>
                            <span className="rounded-xl bg-[#eef4fa] px-3 py-1.5 text-[12px] font-bold text-[#4e5f74]">
                              {board.lists?.length || 0} Lists
                            </span>
                          </div>
                          <h3 className="text-[19px] font-extrabold text-[#162231]">{board.title}</h3>
                          <p className="mt-3 text-[14px] font-medium leading-7 text-[#5b6b80]">
                            {board.description || 'No board description yet.'}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </main>

      <CreateBoardModal
        isOpen={showCreateBoardModal}
        onClose={() => setShowCreateBoardModal(false)}
        projectId={project?.id}
        onCreated={(boardId) => navigate(`/boards/${boardId}`)}
      />
    </div>
  );
}
