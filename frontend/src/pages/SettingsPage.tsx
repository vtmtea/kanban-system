import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { LanguageToggle } from '@/components/LanguageToggle';
import { SelectField } from '@/components/SelectField';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { authApi, resolveAssetUrl } from '@/services/api';

const workspaceSettingsStorageKey = 'settings.workspace';
const notificationSettingsStorageKey = 'settings.notifications';

const defaultWorkspaceSettings = {
  timezone:
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      : 'UTC',
  weekStartsOn: 'monday',
  density: 'comfortable',
  compactCards: false,
  stickBoardFilters: true,
};

const defaultNotificationSettings = {
  cardAssignedEmail: true,
  dueSoonDesktop: true,
  commentMentionEmail: true,
  weeklyDigest: false,
};

function formatDateLabel(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
        checked ? 'bg-[#0f4fe6]' : 'bg-[#d9e3ec]'
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span
        className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function SettingsPage() {
  const { user, token, login, loading } = useAuth();
  const { t, formatDate } = useI18n();
  const [activeSection, setActiveSection] = useState('profile');
  const [profileForm, setProfileForm] = useState({ nickname: '', avatar: '' });
  const [profileSnapshot, setProfileSnapshot] = useState({ nickname: '', avatar: '' });
  const [workspaceSettings, setWorkspaceSettings] = useState(defaultWorkspaceSettings);
  const [workspaceSnapshot, setWorkspaceSnapshot] = useState(defaultWorkspaceSettings);
  const [notificationSettings, setNotificationSettings] = useState(defaultNotificationSettings);
  const [notificationSnapshot, setNotificationSnapshot] = useState(defaultNotificationSettings);
  const [profileNotice, setProfileNotice] = useState('');
  const [profileError, setProfileError] = useState('');
  const [workspaceNotice, setWorkspaceNotice] = useState('');
  const [notificationNotice, setNotificationNotice] = useState('');
  const timezoneOptions = useMemo(
    () => [
      { value: 'Asia/Shanghai', label: 'Asia/Shanghai', description: t('settings.timezone.local') },
      { value: 'UTC', label: 'UTC', description: t('settings.timezone.utc') },
      { value: 'America/New_York', label: 'America/New_York', description: t('settings.timezone.ny') },
      { value: 'Europe/Berlin', label: 'Europe/Berlin', description: t('settings.timezone.berlin') },
    ],
    [t]
  );
  const weekStartOptions = useMemo(
    () => [
      { value: 'monday', label: t('settings.weekStart.monday'), description: t('settings.weekStart.mondayDesc') },
      { value: 'sunday', label: t('settings.weekStart.sunday'), description: t('settings.weekStart.sundayDesc') },
    ],
    [t]
  );
  const densityOptions = useMemo(
    () => [
      { value: 'comfortable', label: t('settings.density.comfortable'), description: t('settings.density.comfortableDesc') },
      { value: 'compact', label: t('settings.density.compact'), description: t('settings.density.compactDesc') },
    ],
    [t]
  );

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!user) return;

    const nextProfile = {
      nickname: user.nickname || user.username || '',
      avatar: user.avatar || '',
    };
    setProfileForm(nextProfile);
    setProfileSnapshot(nextProfile);
  }, [user]);

  useEffect(() => {
    try {
      const storedWorkspace = localStorage.getItem(workspaceSettingsStorageKey);
      const storedNotifications = localStorage.getItem(notificationSettingsStorageKey);

      if (storedWorkspace) {
        const parsed = JSON.parse(storedWorkspace);
        const nextWorkspace = {
          ...defaultWorkspaceSettings,
          ...parsed,
        };
        setWorkspaceSettings(nextWorkspace);
        setWorkspaceSnapshot(nextWorkspace);
      }

      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        const nextNotifications = {
          ...defaultNotificationSettings,
          ...parsed,
        };
        setNotificationSettings(nextNotifications);
        setNotificationSnapshot(nextNotifications);
      }
    } catch {
      setWorkspaceSettings(defaultWorkspaceSettings);
      setWorkspaceSnapshot(defaultWorkspaceSettings);
      setNotificationSettings(defaultNotificationSettings);
      setNotificationSnapshot(defaultNotificationSettings);
    }
  }, []);

  const profileMutation = useMutation({
    mutationFn: () =>
      authApi.updateUser({
        nickname: profileForm.nickname.trim(),
        avatar: profileForm.avatar.trim(),
      }),
    onSuccess: (response) => {
      if (token) {
        login(token, response.data);
      }
      const nextProfile = {
        nickname: response.data.nickname || response.data.username || '',
        avatar: response.data.avatar || '',
      };
      setProfileForm(nextProfile);
      setProfileSnapshot(nextProfile);
      setProfileError('');
      setProfileNotice(t('settings.profileUpdated'));
    },
    onError: (error: any) => {
      setProfileNotice('');
      setProfileError(error.response?.data?.error || t('settings.profileUpdateFailed'));
    },
  });

  const avatarPreview =
    resolveAssetUrl(profileForm.avatar.trim() || user?.avatar) || 'https://i.pravatar.cc/160?img=47';

  const hasProfileChanges = useMemo(
    () =>
      profileForm.nickname.trim() !== profileSnapshot.nickname.trim() ||
      profileForm.avatar.trim() !== profileSnapshot.avatar.trim(),
    [profileForm, profileSnapshot]
  );

  const hasWorkspaceChanges = useMemo(
    () => JSON.stringify(workspaceSettings) !== JSON.stringify(workspaceSnapshot),
    [workspaceSettings, workspaceSnapshot]
  );

  const hasNotificationChanges = useMemo(
    () => JSON.stringify(notificationSettings) !== JSON.stringify(notificationSnapshot),
    [notificationSettings, notificationSnapshot]
  );

  if (loading || !user) {
    return (
      <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-gray-800">
        <Sidebar activePage="settings" />
        <main className="flex-1 flex items-center justify-center bg-[#fbfcfd]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0d6efd] border-t-transparent" />
            <div className="text-sm font-semibold tracking-wider text-gray-500">{t('settings.loading').toUpperCase()}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-gray-800">
      <Sidebar activePage="settings" />

      <main className="flex flex-1 flex-col bg-white">
        <TopNav title={t('settings.title')} searchPlaceholder={t('settings.searchPlaceholder')} />

        <div className="flex flex-1 overflow-hidden bg-[#fbfcfd]">
          <aside className="hidden w-72 shrink-0 border-r border-gray-100 bg-white p-8 lg:flex lg:flex-col">
            <div className="mb-8 rounded-[28px] border border-[#d9e3ef] bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fa_100%)] p-6 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-4">
                <img
                  src={avatarPreview}
                  alt={profileForm.nickname || user.username}
                  className="h-16 w-16 rounded-[22px] border border-white object-cover shadow-sm"
                />
                <div className="min-w-0">
                  <div className="truncate text-[18px] font-extrabold text-[#162231]">
                    {profileForm.nickname.trim() || user.username}
                  </div>
                  <div className="mt-1 truncate text-[13px] font-medium text-[#5b6b80]">{user.email}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">Username</div>
                  <div className="mt-2 text-[14px] font-bold text-[#162231]">@{user.username}</div>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">{t('settings.joined')}</div>
                  <div className="mt-2 text-[14px] font-bold text-[#162231]">
                    {formatDateLabel(user.created_at)
                      ? formatDate(user.created_at || '', { year: 'numeric', month: 'short', day: 'numeric' })
                      : t('common.unavailable')}
                  </div>
                </div>
              </div>
            </div>

            <nav className="space-y-2">
              {[
                ['profile', t('settings.profile')],
                ['workspace', t('settings.workspace')],
                ['notifications', t('settings.notifications')],
                ['team', t('settings.admin')],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[14px] font-bold transition ${
                    activeSection === id
                      ? 'bg-[#eef4ff] text-[#0f4fe6]'
                      : 'text-[#5b6b80] hover:bg-[#f4f7fb] hover:text-[#162231]'
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm">
                    {label.slice(0, 1)}
                  </span>
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 lg:px-12">
            <div className="mx-auto max-w-[920px] space-y-8 pb-20">
              <div>
                <h2 className="text-[32px] font-extrabold tracking-tight text-[#162231]">{t('settings.heading')}</h2>
                <p className="mt-2 max-w-2xl text-[15px] font-medium leading-7 text-[#5b6b80]">
                  {t('settings.headingDesc')}
                </p>
              </div>

              <section id="profile" className="scroll-mt-10 rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
                <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-[22px] font-extrabold text-[#162231]">{t('settings.profileTitle')}</h3>
                    <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">
                      {t('settings.profileDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!hasProfileChanges || !profileForm.nickname.trim() || profileMutation.isPending}
                    onClick={() => profileMutation.mutate()}
                    className="rounded-2xl bg-[#0f4fe6] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(15,79,230,0.22)] transition hover:bg-[#0c43c2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {profileMutation.isPending ? t('settings.savingProfile') : t('settings.saveProfile')}
                  </button>
                </div>

                {profileError ? (
                  <div className="mb-5 rounded-2xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#b42318]">
                    {profileError}
                  </div>
                ) : null}

                {profileNotice ? (
                  <div className="mb-5 rounded-2xl border border-[#d4f0dd] bg-[#edf9f1] px-4 py-3 text-sm font-semibold text-[#027a48]">
                    {profileNotice}
                  </div>
                ) : null}

                <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="rounded-[28px] border border-[#d9e3ef] bg-[linear-gradient(180deg,#f9fbff_0%,#eff4fa_100%)] p-5">
                    <img
                      src={avatarPreview}
                      alt={profileForm.nickname || user.username}
                      className="h-44 w-full rounded-[24px] object-cover shadow-sm"
                    />
                    <div className="mt-5 text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#6b7b90]">
                      {t('settings.livePreview')}
                    </div>
                    <div className="mt-2 text-[18px] font-extrabold text-[#162231]">
                      {profileForm.nickname.trim() || user.username}
                    </div>
                    <div className="mt-1 text-[13px] font-medium text-[#5b6b80]">{user.email}</div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className="mb-3 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">{t('settings.displayName')}</span>
                      <input
                        type="text"
                        value={profileForm.nickname}
                        onChange={(event) => {
                          setProfileNotice('');
                          setProfileError('');
                          setProfileForm((current) => ({ ...current, nickname: event.target.value }));
                        }}
                        className="h-[52px] w-full rounded-2xl border border-[#d9e3ef] bg-[#f8fbff] px-4 py-3 text-[15px] font-semibold text-[#162231] outline-none transition focus:border-[#0f4fe6] focus:bg-white"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-3 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">{t('settings.avatarUrl')}</span>
                      <input
                        type="url"
                        value={profileForm.avatar}
                        onChange={(event) => {
                          setProfileNotice('');
                          setProfileError('');
                          setProfileForm((current) => ({ ...current, avatar: event.target.value }));
                        }}
                        placeholder="https://example.com/avatar.png"
                        className="h-[52px] w-full rounded-2xl border border-[#d9e3ef] bg-[#f8fbff] px-4 py-3 text-[15px] font-semibold text-[#162231] outline-none transition focus:border-[#0f4fe6] focus:bg-white"
                      />
                    </label>

                    <div>
                      <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">{t('settings.username')}</div>
                      <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] px-4 py-3 text-[15px] font-bold text-[#162231]">
                        @{user.username}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">{t('settings.email')}</div>
                      <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] px-4 py-3 text-[15px] font-bold text-[#162231]">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section id="workspace" className="scroll-mt-10 rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
                <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-[22px] font-extrabold text-[#162231]">{t('settings.workspaceTitle')}</h3>
                    <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">
                      {t('settings.workspaceDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!hasWorkspaceChanges}
                    onClick={() => {
                      localStorage.setItem(workspaceSettingsStorageKey, JSON.stringify(workspaceSettings));
                      setWorkspaceSnapshot(workspaceSettings);
                      setWorkspaceNotice(t('settings.workspaceSaved'));
                    }}
                    className="rounded-2xl border border-[#d9e3ef] bg-white px-5 py-3 text-sm font-bold text-[#162231] shadow-sm transition hover:border-[#bfd0e2] hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t('settings.savePreferences')}
                  </button>
                </div>

                {workspaceNotice ? (
                  <div className="mb-5 rounded-2xl border border-[#d4f0dd] bg-[#edf9f1] px-4 py-3 text-sm font-semibold text-[#027a48]">
                    {workspaceNotice}
                  </div>
                ) : null}

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="md:col-span-2 rounded-[24px] border border-[#d9e3ef] bg-[#f8fbff] px-5 py-4">
                    <div className="mb-2 text-[15px] font-bold text-[#162231]">{t('settings.languageTitle')}</div>
                    <div className="mb-4 text-[13px] font-medium text-[#5b6b80]">{t('settings.languageDesc')}</div>
                    <LanguageToggle />
                  </div>

                  <div>
                    <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">{t('settings.timezone')}</div>
                    <SelectField
                      size="lg"
                      value={workspaceSettings.timezone}
                      onChange={(value) => {
                        setWorkspaceNotice('');
                        setWorkspaceSettings((current) => ({ ...current, timezone: value }));
                      }}
                      options={timezoneOptions}
                    />
                  </div>

                  <div>
                    <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">{t('settings.weekStartsOn')}</div>
                    <SelectField
                      size="lg"
                      value={workspaceSettings.weekStartsOn}
                      onChange={(value) => {
                        setWorkspaceNotice('');
                        setWorkspaceSettings((current) => ({ ...current, weekStartsOn: value }));
                      }}
                      options={weekStartOptions}
                    />
                  </div>

                  <div>
                    <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">{t('settings.contentDensity')}</div>
                    <SelectField
                      size="lg"
                      value={workspaceSettings.density}
                      onChange={(value) => {
                        setWorkspaceNotice('');
                        setWorkspaceSettings((current) => ({ ...current, density: value }));
                      }}
                      options={densityOptions}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-[24px] border border-[#d9e3ef] bg-[#f8fbff] px-5 py-4">
                      <div>
                        <div className="text-[15px] font-bold text-[#162231]">{t('settings.compactCards')}</div>
                        <div className="mt-1 text-[13px] font-medium text-[#5b6b80]">{t('settings.compactCardsDesc')}</div>
                      </div>
                      <Toggle
                        checked={workspaceSettings.compactCards}
                        onChange={(next) => {
                          setWorkspaceNotice('');
                          setWorkspaceSettings((current) => ({ ...current, compactCards: next }));
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-[24px] border border-[#d9e3ef] bg-[#f8fbff] px-5 py-4">
                      <div>
                        <div className="text-[15px] font-bold text-[#162231]">{t('settings.stickyFilters')}</div>
                        <div className="mt-1 text-[13px] font-medium text-[#5b6b80]">{t('settings.stickyFiltersDesc')}</div>
                      </div>
                      <Toggle
                        checked={workspaceSettings.stickBoardFilters}
                        onChange={(next) => {
                          setWorkspaceNotice('');
                          setWorkspaceSettings((current) => ({ ...current, stickBoardFilters: next }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section id="notifications" className="scroll-mt-10 rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
                <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-[22px] font-extrabold text-[#162231]">{t('settings.notificationsTitle')}</h3>
                    <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">
                      {t('settings.notificationsDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!hasNotificationChanges}
                    onClick={() => {
                      localStorage.setItem(notificationSettingsStorageKey, JSON.stringify(notificationSettings));
                      setNotificationSnapshot(notificationSettings);
                      setNotificationNotice(t('settings.notificationsSaved'));
                    }}
                    className="rounded-2xl border border-[#d9e3ef] bg-white px-5 py-3 text-sm font-bold text-[#162231] shadow-sm transition hover:border-[#bfd0e2] hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t('settings.saveNotifications')}
                  </button>
                </div>

                {notificationNotice ? (
                  <div className="mb-5 rounded-2xl border border-[#d4f0dd] bg-[#edf9f1] px-4 py-3 text-sm font-semibold text-[#027a48]">
                    {notificationNotice}
                  </div>
                ) : null}

                <div className="space-y-4">
                  {[
                    {
                      key: 'cardAssignedEmail',
                      title: t('settings.cardAssignedEmail'),
                      description: t('settings.cardAssignedEmailDesc'),
                    },
                    {
                      key: 'dueSoonDesktop',
                      title: t('settings.dueSoonDesktop'),
                      description: t('settings.dueSoonDesktopDesc'),
                    },
                    {
                      key: 'commentMentionEmail',
                      title: t('settings.commentMentionEmail'),
                      description: t('settings.commentMentionEmailDesc'),
                    },
                    {
                      key: 'weeklyDigest',
                      title: t('settings.weeklyDigest'),
                      description: t('settings.weeklyDigestDesc'),
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-[24px] border border-[#d9e3ef] bg-[#f8fbff] px-5 py-4"
                    >
                      <div className="pr-4">
                        <div className="text-[15px] font-bold text-[#162231]">{item.title}</div>
                        <div className="mt-1 text-[13px] font-medium text-[#5b6b80]">{item.description}</div>
                      </div>
                      <Toggle
                        checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                        onChange={(next) => {
                          setNotificationNotice('');
                          setNotificationSettings((current) => ({
                            ...current,
                            [item.key]: next,
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section id="team" className="scroll-mt-10 rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
                <div className="mb-8">
                  <h3 className="text-[22px] font-extrabold text-[#162231]">{t('settings.adminTitle')}</h3>
                  <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">
                    {t('settings.adminDesc')}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Link
                    to="/boards"
                    className="rounded-[24px] border border-[#d9e3ef] bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fa_100%)] p-5 shadow-sm transition hover:-translate-y-0.5"
                  >
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">{t('settings.boards')}</div>
                    <div className="mt-3 text-[18px] font-extrabold text-[#162231]">{t('settings.openBoardSettings')}</div>
                    <div className="mt-2 text-[13px] font-medium leading-6 text-[#5b6b80]">
                      {t('settings.openBoardSettingsDesc')}
                    </div>
                  </Link>

                  <Link
                    to="/projects"
                    className="rounded-[24px] border border-[#d9e3ef] bg-[linear-gradient(180deg,#fffdf8_0%,#f7f2e8_100%)] p-5 shadow-sm transition hover:-translate-y-0.5"
                  >
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#7d6642]">{t('settings.projects')}</div>
                    <div className="mt-3 text-[18px] font-extrabold text-[#162231]">{t('settings.reviewProjectHealth')}</div>
                    <div className="mt-2 text-[13px] font-medium leading-6 text-[#5b6b80]">
                      {t('settings.reviewProjectHealthDesc')}
                    </div>
                  </Link>

                  <Link
                    to="/analytics"
                    className="rounded-[24px] border border-[#d9e3ef] bg-[linear-gradient(180deg,#f8fffb_0%,#edf7f1_100%)] p-5 shadow-sm transition hover:-translate-y-0.5"
                  >
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#2e6d57]">{t('settings.analytics')}</div>
                    <div className="mt-3 text-[18px] font-extrabold text-[#162231]">{t('settings.inspectFlowMetrics')}</div>
                    <div className="mt-2 text-[13px] font-medium leading-6 text-[#5b6b80]">
                      {t('settings.inspectFlowMetricsDesc')}
                    </div>
                  </Link>
                </div>

                <div className="mt-6 rounded-[24px] border border-dashed border-[#d9e3ef] bg-[#f8fbff] px-5 py-4 text-[14px] font-medium leading-7 text-[#5b6b80]">
                  {t('settings.permissionsHelp')}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
