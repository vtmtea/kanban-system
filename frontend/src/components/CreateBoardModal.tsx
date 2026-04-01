import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SelectField } from '@/components/SelectField';
import { useI18n } from '@/context/I18nContext';
import { boardApi, projectApi } from '@/services/api';
import type { CreateBoardRequest } from '@/types';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: number;
  onCreated?: (boardId: number) => void;
}

export function CreateBoardModal({ isOpen, onClose, projectId, onCreated }: CreateBoardModalProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const hasFixedProject = projectId !== undefined;
  const [form, setForm] = useState<CreateBoardRequest>({
    project_id: projectId,
    title: '',
    description: '',
    color: '#3B82F6',
    is_public: false,
  });
  const [error, setError] = useState('');

  const { data: projectsResponse } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getAll(),
    enabled: isOpen && !hasFixedProject,
  });

  const projectOptions = useMemo(() => {
    const options = [
      {
        label: t('createBoard.standalone'),
        value: 'none',
        description: t('createBoard.standaloneDesc'),
      },
    ];

    for (const project of projectsResponse?.data || []) {
      options.push({
        label: project.title,
        value: String(project.id),
        description: project.description || t('createBoard.attachProject'),
      });
    }

    return options;
  }, [projectsResponse?.data, t]);

  const colors = useMemo(
    () => [
      { name: t('createBoard.color.blue'), value: '#3B82F6' },
      { name: t('createBoard.color.purple'), value: '#8B5CF6' },
      { name: t('createBoard.color.pink'), value: '#EC4899' },
      { name: t('createBoard.color.red'), value: '#EF4444' },
      { name: t('createBoard.color.orange'), value: '#F97316' },
      { name: t('createBoard.color.yellow'), value: '#EAB308' },
      { name: t('createBoard.color.green'), value: '#22C55E' },
      { name: t('createBoard.color.cyan'), value: '#06B6D4' },
    ],
    [t]
  );

  useEffect(() => {
    setForm((current) => ({
      ...current,
      project_id: projectId,
    }));
  }, [projectId]);

  const createMutation = useMutation({
    mutationFn: (data: CreateBoardRequest) => boardApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
      onCreated?.(response.data.id);
      handleClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || t('createBoard.errorFailed'));
    },
  });

  const handleClose = () => {
    setForm({ project_id: projectId, title: '', description: '', color: '#3B82F6', is_public: false });
    setError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError(t('createBoard.errorTitleRequired'));
      return;
    }

    createMutation.mutate({
      ...form,
      project_id: hasFixedProject ? projectId : form.project_id,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div
          className="h-20"
          style={{ backgroundColor: form.color }}
        >
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 pt-8">
          <div className="-mt-14 mb-6">
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
              placeholder={t('createBoard.titlePlaceholder')}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
            />
          </div>

          <div className="mb-5">
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder={t('createBoard.descPlaceholder')}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Color Picker */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('createBoard.color')}</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-all ${
                    form.color === color.value
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setForm({ ...form, color: color.value })}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {hasFixedProject ? (
            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              {t('createBoard.attachedCurrentProject')}
            </div>
          ) : (
            <div className="mb-5">
              <label className="mb-3 block text-sm font-medium text-gray-700">{t('createBoard.project')}</label>
              <SelectField
                options={projectOptions}
                value={form.project_id ? String(form.project_id) : 'none'}
                onChange={(nextValue) =>
                  setForm((current) => ({
                    ...current,
                    project_id: nextValue === 'none' ? undefined : Number(nextValue),
                  }))
                }
                placeholder={t('createBoard.projectPlaceholder')}
                size="lg"
              />
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t('createBoard.cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 py-2.5 px-4 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? t('createBoard.submitting') : t('createBoard.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
