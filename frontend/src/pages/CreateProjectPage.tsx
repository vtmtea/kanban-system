import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { SelectField } from '@/components/SelectField';
import { DatePickerField } from '@/components/DatePickerField';
import { projectApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const templates = [
  {
    id: 'launch',
    name: 'Product Launch',
    description: 'Milestones, campaign assets, approval flow, and launch checklist.',
    accent: 'bg-[#dfe7ff] text-[#0f4fe6]',
    color: '#0f4fe6',
  },
  {
    id: 'delivery',
    name: 'Client Delivery',
    description: 'Scope tracking, feedback loops, QA, and release handoff.',
    accent: 'bg-[#ffe7d2] text-[#b45309]',
    color: '#f97316',
  },
  {
    id: 'blank',
    name: 'Blank Workspace',
    description: 'Start from scratch and build lists, boards, and workflows your way.',
    accent: 'bg-[#dde7f0] text-[#4e5f74]',
    color: '#64748b',
  },
];

const collaborators = [
  { name: 'Sarah Chen', role: 'Design Lead', avatar: 'https://i.pravatar.cc/120?img=32' },
  { name: 'Marcus Thorne', role: 'Engineering', avatar: 'https://i.pravatar.cc/120?img=15' },
  { name: 'Elena Rodriguez', role: 'Product Owner', avatar: 'https://i.pravatar.cc/120?img=48' },
];

const deliveryChecklist = [
  'Create project scope and goals',
  'Add boards under this project',
  'Invite core team members',
  'Define target delivery timeline',
];

export function CreateProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [title, setTitle] = useState('Aurora Commerce Revamp');
  const [description, setDescription] = useState(
    'Cross-functional redesign of the commerce experience covering UX, engineering delivery, analytics instrumentation, and launch readiness.'
  );
  const [startDate, setStartDate] = useState('2026-04-03');
  const [targetDate, setTargetDate] = useState('2026-06-30');
  const [status, setStatus] = useState('planning');
  const [priority, setPriority] = useState('high');
  const [templateId, setTemplateId] = useState('launch');
  const [error, setError] = useState('');

  const selectedTemplate = templates.find((template) => template.id === templateId) || templates[0];
  const ownerName = user?.nickname || user?.username || 'Current User';
  const ownerEmail = user?.email || 'workspace@kinetic.io';

  const createProjectMutation = useMutation({
    mutationFn: () =>
      projectApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        color: selectedTemplate.color,
        start_date: startDate || undefined,
        target_date: targetDate || undefined,
        status,
        priority,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/projects/${response.data.id}`);
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || 'Failed to create project');
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Project name is required');
      return;
    }

    setError('');
    createProjectMutation.mutate();
  };

  return (
    <div className="flex h-screen bg-[#eef4fa] font-sans text-[#162231]">
      <Sidebar activePage="projects" />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7fbff]">
        <TopNav title="" searchPlaceholder="Search templates..." />

        <div className="flex-1 overflow-auto px-10 pb-10 pt-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="mb-4 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#6b7b90]">
                  <Link to="/projects" className="transition hover:text-[#0f4fe6]">Projects</Link>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-[#162231]">Create Project</span>
                </div>

                <h1 className="text-[38px] font-extrabold tracking-tight text-[#162231]">Create a New Project</h1>
                <p className="mt-2 max-w-2xl text-[17px] font-medium text-[#5b6b80]">
                  Create the parent project first, then add boards and workflows under it.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Link
                  to="/projects"
                  className="flex h-14 items-center gap-3 rounded-2xl border border-[#d9e3ef] bg-white px-6 text-[16px] font-semibold text-[#162231] shadow-[0_8px_24px_rgba(17,24,39,0.05)]"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleSubmit}
                  disabled={createProjectMutation.isPending}
                  className="flex h-14 items-center gap-3 rounded-2xl bg-[#0f4fe6] px-7 text-[16px] font-bold text-white shadow-[0_16px_32px_rgba(15,79,230,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 4v16m8-8H4" />
                  </svg>
                  {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>

            {error ? (
              <div className="mb-6 rounded-2xl border border-[#ffd7d7] bg-[#fff5f5] px-5 py-4 text-[14px] font-semibold text-[#b42318]">
                {error}
              </div>
            ) : null}

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-8">
                <section className="rounded-[34px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-[20px] font-extrabold text-[#162231]">Project Details</h2>
                      <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">Core project information saved to the API.</p>
                    </div>
                    <span className="rounded-full bg-[#dfe7ff] px-3 py-1 text-[12px] font-extrabold text-[#0f4fe6]">STEP 1</span>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Project Name</span>
                      <input
                        type="text"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className="h-14 w-full rounded-2xl border border-[#d9e3ef] bg-white px-5 text-[15px] font-semibold text-[#162231] outline-none transition focus:border-[#b7cbe0]"
                      />
                    </label>

                    <div className="block">
                      <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Project Owner</span>
                      <div className="flex h-14 items-center justify-between rounded-2xl border border-[#d9e3ef] bg-white px-5 shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
                        <div>
                          <div className="text-[15px] font-semibold text-[#162231]">{ownerName}</div>
                          <div className="text-[12px] font-medium text-[#6b7b90]">{ownerEmail}</div>
                        </div>
                        <span className="rounded-full bg-[#eef4fa] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#4e5f74]">Owner</span>
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Start Date</span>
                      <DatePickerField value={startDate} onChange={setStartDate} size="lg" />
                    </label>

                    <label className="block">
                      <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Target Delivery</span>
                      <DatePickerField value={targetDate} onChange={setTargetDate} size="lg" />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Description</span>
                      <textarea
                        rows={5}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        className="w-full rounded-[28px] border border-[#d9e3ef] bg-white px-5 py-4 text-[15px] font-medium leading-7 text-[#162231] outline-none transition focus:border-[#b7cbe0]"
                      />
                    </label>
                  </div>
                </section>

                <section className="rounded-[34px] bg-white p-8 shadow-[0_16px_34px_rgba(16,24,40,0.06)]">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-[20px] font-extrabold text-[#162231]">Choose a Template</h2>
                      <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">Templates currently affect the initial project color and visual mood.</p>
                    </div>
                    <span className="rounded-full bg-[#eef4fa] px-3 py-1 text-[12px] font-extrabold text-[#4e5f74]">STEP 2</span>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-3">
                    {templates.map((template) => {
                      const isSelected = template.id === templateId;
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setTemplateId(template.id)}
                          className={`rounded-[28px] border p-6 text-left transition ${
                            isSelected
                              ? 'border-[#bed0ef] bg-[#eef4fa] shadow-[0_10px_22px_rgba(15,79,230,0.08)]'
                              : 'border-[#e3eaf2] bg-[#fbfdff] hover:border-[#cbd8e6] hover:bg-white'
                          }`}
                        >
                          <div className={`inline-flex rounded-xl px-3 py-1.5 text-[12px] font-extrabold ${template.accent}`}>
                            TEMPLATE
                          </div>
                          <h3 className="mt-5 text-[20px] font-extrabold text-[#162231]">{template.name}</h3>
                          <p className="mt-3 text-[14px] font-medium leading-7 text-[#5b6b80]">{template.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-[34px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-[20px] font-extrabold text-[#162231]">Planning Metadata</h2>
                      <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">These fields are stored on the project and drive list/detail views.</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[12px] font-extrabold text-[#4e5f74]">STEP 3</span>
                  </div>

                  <div className="mb-8 grid gap-4 md:grid-cols-3">
                    {collaborators.map((member) => (
                      <div key={member.name} className="rounded-[26px] bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-4">
                          <img src={member.avatar} alt={member.name} className="h-14 w-14 rounded-2xl object-cover" />
                          <div>
                            <h3 className="text-[17px] font-extrabold text-[#162231]">{member.name}</h3>
                            <p className="mt-1 text-[13px] font-medium text-[#5b6b80]">{member.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Project Status</span>
                      <SelectField
                        size="lg"
                        value={status}
                        onChange={setStatus}
                        options={[
                          { value: 'planning', label: 'Planning' },
                          { value: 'active', label: 'Active' },
                          { value: 'on-hold', label: 'On Hold' },
                          { value: 'completed', label: 'Completed' },
                        ]}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Priority</span>
                      <SelectField
                        size="lg"
                        value={priority}
                        onChange={setPriority}
                        options={[
                          { value: 'low', label: 'Low' },
                          { value: 'medium', label: 'Medium' },
                          { value: 'high', label: 'High' },
                          { value: 'urgent', label: 'Urgent' },
                        ]}
                      />
                    </label>
                  </div>
                </section>
              </div>

              <aside className="space-y-8">
                <section className="rounded-[34px] bg-white p-8 shadow-[0_16px_34px_rgba(16,24,40,0.06)]">
                  <h2 className="text-[20px] font-extrabold text-[#162231]">Project Brief</h2>
                  <p className="mt-3 text-[14px] font-medium leading-7 text-[#5b6b80]">
                    The project is the parent container. Boards will be added under it after creation.
                  </p>

                  <div className="mt-8 space-y-5">
                    <div className="rounded-[24px] bg-[#eef4fa] p-5">
                      <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">Selected Template</p>
                      <p className="mt-3 text-[28px] font-extrabold tracking-tight text-[#162231]">{selectedTemplate.name}</p>
                    </div>

                    <div className="rounded-[24px] bg-[#fff5ec] p-5">
                      <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#b45309]">Timeline</p>
                      <p className="mt-3 text-[20px] font-extrabold tracking-tight text-[#162231]">
                        {startDate || 'Not set'} to {targetDate || 'Not set'}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[34px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-[20px] font-extrabold text-[#162231]">Launch Checklist</h2>
                    <span className="rounded-full bg-white px-3 py-1 text-[12px] font-extrabold text-[#4e5f74]">4 ITEMS</span>
                  </div>

                  <div className="space-y-4">
                    {deliveryChecklist.map((item) => (
                      <div key={item} className="flex items-start gap-4 rounded-[24px] bg-white px-5 py-4 shadow-sm">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#dfe7ff] text-[#0f4fe6]">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <p className="text-[14px] font-semibold leading-6 text-[#223042]">{item}</p>
                      </div>
                    ))}
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
