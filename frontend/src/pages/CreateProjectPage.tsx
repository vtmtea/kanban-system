import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { SelectField } from '@/components/SelectField';
import { DatePickerField } from '@/components/DatePickerField';
import { projectApi, resolveAssetUrl } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

export function CreateProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState('planning');
  const [priority, setPriority] = useState('high');
  const [templateId, setTemplateId] = useState('launch');
  const [error, setError] = useState('');
  const templates = useMemo(
    () => [
      {
        id: 'launch',
        name: t('createProject.template.launch'),
        description: t('createProject.template.launchDesc'),
        accent: 'bg-[#dfe7ff] text-[#0f4fe6]',
        color: '#0f4fe6',
      },
      {
        id: 'delivery',
        name: t('createProject.template.delivery'),
        description: t('createProject.template.deliveryDesc'),
        accent: 'bg-[#ffe7d2] text-[#b45309]',
        color: '#f97316',
      },
      {
        id: 'blank',
        name: t('createProject.template.blank'),
        description: t('createProject.template.blankDesc'),
        accent: 'bg-[#dde7f0] text-[#4e5f74]',
        color: '#64748b',
      },
    ],
    [t]
  );

  const selectedTemplate = templates.find((template) => template.id === templateId) || templates[0];
  const ownerName = user?.nickname || user?.username || t('common.owner');
  const ownerEmail = user?.email || 'workspace@kinetic.io';
  const ownerAvatar = resolveAssetUrl(user?.avatar) || `https://i.pravatar.cc/160?u=${user?.id || 'owner'}`;
  const setupChecklist = useMemo(
    () => [
      { label: t('createProject.check.name'), completed: !!title.trim() },
      { label: t('createProject.check.description'), completed: !!description.trim() },
      { label: t('createProject.check.window'), completed: !!startDate && !!targetDate },
      { label: t('createProject.check.meta'), completed: !!status && !!priority },
      { label: t('createProject.check.template'), completed: !!templateId },
    ],
    [description, priority, startDate, status, targetDate, templateId, title, t]
  );
  const completedChecklistCount = setupChecklist.filter((item) => item.completed).length;
  const statusLabel = t(`boardList.status.${status}`);
  const priorityLabel = t(`boardList.priority.${priority}`);

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
      setError(mutationError.response?.data?.error || t('createProject.errorFailed'));
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      setError(t('createProject.errorNameRequired'));
      return;
    }

    setError('');
    createProjectMutation.mutate();
  };

  return (
    <div className="flex h-screen bg-[#eef4fa] font-sans text-[#162231]">
      <Sidebar activePage="projects" />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7fbff]">
        <TopNav title="" searchPlaceholder={t('createProject.searchPlaceholder')} />

        <div className="flex-1 overflow-auto px-10 pb-10 pt-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="mb-4 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#6b7b90]">
                  <Link to="/projects" className="transition hover:text-[#0f4fe6]">{t('createProject.breadcrumbProjects')}</Link>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-[#162231]">{t('createProject.breadcrumbCreate')}</span>
                </div>

                <h1 className="text-[38px] font-extrabold tracking-tight text-[#162231]">{t('createProject.title')}</h1>
                <p className="mt-2 max-w-2xl text-[17px] font-medium text-[#5b6b80]">
                  {t('createProject.desc')}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Link
                  to="/projects"
                  className="flex h-14 items-center gap-3 rounded-2xl border border-[#d9e3ef] bg-white px-6 text-[16px] font-semibold text-[#162231] shadow-[0_8px_24px_rgba(17,24,39,0.05)]"
                >
                  {t('createProject.cancel')}
                </Link>
                <button
                  onClick={handleSubmit}
                  disabled={createProjectMutation.isPending}
                  className="flex h-14 items-center gap-3 rounded-2xl bg-[#0f4fe6] px-7 text-[16px] font-bold text-white shadow-[0_16px_32px_rgba(15,79,230,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 4v16m8-8H4" />
                  </svg>
                  {createProjectMutation.isPending ? t('createProject.creating') : t('createProject.create')}
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
                      <h2 className="text-[20px] font-extrabold text-[#162231]">{t('createProject.detailsTitle')}</h2>
                      <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">{t('createProject.detailsDesc')}</p>
                    </div>
                    <span className="rounded-full bg-[#dfe7ff] px-3 py-1 text-[12px] font-extrabold text-[#0f4fe6]">{t('createProject.step1')}</span>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">{t('createProject.projectName')}</span>
                      <input
                        type="text"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className="h-14 w-full rounded-2xl border border-[#d9e3ef] bg-white px-5 text-[15px] font-semibold text-[#162231] outline-none transition focus:border-[#b7cbe0]"
                      />
                    </label>

                    <div className="block">
                      <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">{t('createProject.projectOwner')}</span>
                      <div className="flex h-14 items-center justify-between rounded-2xl border border-[#d9e3ef] bg-white px-5 shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
                        <div>
                          <div className="text-[15px] font-semibold text-[#162231]">{ownerName}</div>
                          <div className="text-[12px] font-medium text-[#6b7b90]">{ownerEmail}</div>
                        </div>
                        <span className="rounded-full bg-[#eef4fa] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#4e5f74]">{t('common.owner')}</span>
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">{t('createProject.startDate')}</span>
                      <DatePickerField value={startDate} onChange={setStartDate} size="lg" />
                    </label>

                    <label className="block">
                      <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">{t('createProject.targetDelivery')}</span>
                      <DatePickerField value={targetDate} onChange={setTargetDate} size="lg" />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">{t('createProject.description')}</span>
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
                      <h2 className="text-[20px] font-extrabold text-[#162231]">{t('createProject.templateTitle')}</h2>
                      <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">{t('createProject.templateDesc')}</p>
                    </div>
                    <span className="rounded-full bg-[#eef4fa] px-3 py-1 text-[12px] font-extrabold text-[#4e5f74]">{t('createProject.step2')}</span>
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
                            {t('createProject.template')}
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
                      <h2 className="text-[20px] font-extrabold text-[#162231]">{t('createProject.metadataTitle')}</h2>
                      <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">{t('createProject.metadataDesc')}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[12px] font-extrabold text-[#4e5f74]">{t('createProject.step3')}</span>
                  </div>

                  <div className="mb-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[26px] bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-4">
                        <img src={ownerAvatar} alt={ownerName} className="h-14 w-14 rounded-2xl object-cover" />
                        <div>
                          <h3 className="text-[17px] font-extrabold text-[#162231]">{ownerName}</h3>
                          <p className="mt-1 text-[13px] font-medium text-[#5b6b80]">{t('createProject.projectOwnerLabel')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[26px] bg-white p-5 shadow-sm">
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#4e5f74]">{t('createProject.status')}</div>
                      <div className="mt-4 text-[22px] font-extrabold capitalize tracking-tight text-[#162231]">{statusLabel}</div>
                      <div className="mt-2 text-[13px] font-medium text-[#5b6b80]">{t('createProject.statusDesc')}</div>
                    </div>

                    <div className="rounded-[26px] bg-white p-5 shadow-sm">
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#4e5f74]">{t('createProject.priority')}</div>
                      <div className="mt-4 text-[22px] font-extrabold capitalize tracking-tight text-[#162231]">{priorityLabel}</div>
                      <div className="mt-2 text-[13px] font-medium text-[#5b6b80]">{t('createProject.priorityDesc')}</div>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">{t('createProject.projectStatus')}</span>
                      <SelectField
                        size="lg"
                        value={status}
                        onChange={setStatus}
                        options={[
                          { value: 'planning', label: t('boardList.status.planning') },
                          { value: 'active', label: t('boardList.status.active') },
                          { value: 'on-hold', label: t('boardList.status.on-hold') },
                          { value: 'completed', label: t('boardList.status.completed') },
                        ]}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-3 block text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">{t('createProject.priority')}</span>
                      <SelectField
                        size="lg"
                        value={priority}
                        onChange={setPriority}
                        options={[
                          { value: 'low', label: t('boardList.priority.low') },
                          { value: 'medium', label: t('boardList.priority.medium') },
                          { value: 'high', label: t('boardList.priority.high') },
                          { value: 'urgent', label: t('boardList.priority.urgent') },
                        ]}
                      />
                    </label>
                  </div>
                </section>
              </div>

              <aside className="space-y-8">
                <section className="rounded-[34px] bg-white p-8 shadow-[0_16px_34px_rgba(16,24,40,0.06)]">
                  <h2 className="text-[20px] font-extrabold text-[#162231]">{t('createProject.briefTitle')}</h2>
                  <p className="mt-3 text-[14px] font-medium leading-7 text-[#5b6b80]">
                    {t('createProject.briefDesc')}
                  </p>

                  <div className="mt-8 space-y-5">
                    <div className="rounded-[24px] bg-[#eef4fa] p-5">
                      <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#4e5f74]">{t('createProject.selectedTemplate')}</p>
                      <p className="mt-3 text-[28px] font-extrabold tracking-tight text-[#162231]">{selectedTemplate.name}</p>
                    </div>

                    <div className="rounded-[24px] bg-[#fff5ec] p-5">
                      <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#b45309]">{t('createProject.timeline')}</p>
                      <p className="mt-3 text-[20px] font-extrabold tracking-tight text-[#162231]">
                        {(startDate || t('common.notSet'))} {t('createProject.to')} {(targetDate || t('common.notSet'))}
                      </p>
                    </div>

                    <div className="rounded-[24px] bg-[#eef8f2] p-5">
                      <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#027a48]">{t('createProject.setupChecklist')}</p>
                      <p className="mt-3 text-[28px] font-extrabold tracking-tight text-[#162231]">
                        {completedChecklistCount}/{setupChecklist.length}
                      </p>
                      <p className="mt-2 text-[13px] font-medium leading-6 text-[#4b6353]">
                        {t('createProject.checklistProgress', { done: completedChecklistCount, total: setupChecklist.length })}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[34px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-[20px] font-extrabold text-[#162231]">{t('createProject.setupChecklist')}</h2>
                    <span className="rounded-full bg-white px-3 py-1 text-[12px] font-extrabold text-[#4e5f74]">
                      {t('createProject.checklistProgress', { done: completedChecklistCount, total: setupChecklist.length })}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {setupChecklist.map((item) => (
                      <div key={item.label} className="flex items-start gap-4 rounded-[24px] bg-white px-5 py-4 shadow-sm">
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.completed ? 'bg-[#dfe7ff] text-[#0f4fe6]' : 'bg-[#eef4fa] text-[#7b8da6]'}`}>
                          {item.completed ? (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="h-2.5 w-2.5 rounded-full bg-current" />
                          )}
                        </span>
                        <div>
                          <p className="text-[14px] font-semibold leading-6 text-[#223042]">{item.label}</p>
                          <p className="mt-1 text-[12px] font-medium text-[#6b7b90]">
                            {item.completed ? t('createProject.ready') : t('createProject.missing')}
                          </p>
                        </div>
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
