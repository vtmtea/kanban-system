import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { SelectField } from '@/components/SelectField';
import { useAuth } from '@/context/AuthContext';
import { authApi, resolveAssetUrl } from '@/services/api';

const workspaceSettingsStorageKey = 'settings.workspace';
const notificationSettingsStorageKey = 'settings.notifications';

const timezoneOptions = [
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai', description: 'Use your local timezone for dates and due reminders.' },
  { value: 'UTC', label: 'UTC', description: 'Keep timestamps normalized for distributed collaboration.' },
  { value: 'America/New_York', label: 'America/New_York', description: 'Useful when your team primarily works in EST/EDT.' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin', description: 'Helpful when collaborating across CET/CEST schedules.' },
];

const weekStartOptions = [
  { value: 'monday', label: 'Monday', description: 'Align planning around a Monday-first work week.' },
  { value: 'sunday', label: 'Sunday', description: 'Use a Sunday-first calendar layout.' },
];

const densityOptions = [
  { value: 'comfortable', label: 'Comfortable', description: 'More whitespace for relaxed scanning.' },
  { value: 'compact', label: 'Compact', description: 'Fit more information on screen at once.' },
];

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
  if (!value) return 'Unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
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
      setProfileNotice('Profile details updated.');
    },
    onError: (error: any) => {
      setProfileNotice('');
      setProfileError(error.response?.data?.error || 'Failed to update profile');
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
            <div className="text-sm font-semibold tracking-wider text-gray-500">LOADING SETTINGS...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-gray-800">
      <Sidebar activePage="settings" />

      <main className="flex flex-1 flex-col bg-white">
        <TopNav title="Settings" searchPlaceholder="Search settings..." />

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
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">Joined</div>
                  <div className="mt-2 text-[14px] font-bold text-[#162231]">{formatDateLabel(user.created_at)}</div>
                </div>
              </div>
            </div>

            <nav className="space-y-2">
              {[
                ['profile', 'Profile'],
                ['workspace', 'Workspace'],
                ['notifications', 'Notifications'],
                ['team', 'Administration'],
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
                <h2 className="text-[32px] font-extrabold tracking-tight text-[#162231]">Personal Settings</h2>
                <p className="mt-2 max-w-2xl text-[15px] font-medium leading-7 text-[#5b6b80]">
                  Update your profile, keep your browser preferences in sync, and jump to the right place for board administration.
                </p>
              </div>

              <section id="profile" className="scroll-mt-10 rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
                <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-[22px] font-extrabold text-[#162231]">Profile</h3>
                    <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">
                      Change how you appear across boards, comments, assignments, and activity feeds.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!hasProfileChanges || !profileForm.nickname.trim() || profileMutation.isPending}
                    onClick={() => profileMutation.mutate()}
                    className="rounded-2xl bg-[#0f4fe6] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(15,79,230,0.22)] transition hover:bg-[#0c43c2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {profileMutation.isPending ? 'Saving...' : 'Save Profile'}
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
                      Live Preview
                    </div>
                    <div className="mt-2 text-[18px] font-extrabold text-[#162231]">
                      {profileForm.nickname.trim() || user.username}
                    </div>
                    <div className="mt-1 text-[13px] font-medium text-[#5b6b80]">{user.email}</div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className="mb-3 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">Display name</span>
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
                      <span className="mb-3 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">Avatar URL</span>
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
                      <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">Username</div>
                      <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] px-4 py-3 text-[15px] font-bold text-[#162231]">
                        @{user.username}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">Email</div>
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
                    <h3 className="text-[22px] font-extrabold text-[#162231]">Workspace Preferences</h3>
                    <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">
                      These preferences are stored in this browser so your board experience feels consistent on this device.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!hasWorkspaceChanges}
                    onClick={() => {
                      localStorage.setItem(workspaceSettingsStorageKey, JSON.stringify(workspaceSettings));
                      setWorkspaceSnapshot(workspaceSettings);
                      setWorkspaceNotice('Workspace preferences saved on this device.');
                    }}
                    className="rounded-2xl border border-[#d9e3ef] bg-white px-5 py-3 text-sm font-bold text-[#162231] shadow-sm transition hover:border-[#bfd0e2] hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Save Preferences
                  </button>
                </div>

                {workspaceNotice ? (
                  <div className="mb-5 rounded-2xl border border-[#d4f0dd] bg-[#edf9f1] px-4 py-3 text-sm font-semibold text-[#027a48]">
                    {workspaceNotice}
                  </div>
                ) : null}

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">Timezone</div>
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
                    <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">Week starts on</div>
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
                    <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">Content density</div>
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
                        <div className="text-[15px] font-bold text-[#162231]">Compact cards</div>
                        <div className="mt-1 text-[13px] font-medium text-[#5b6b80]">Reduce vertical spacing in board lanes.</div>
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
                        <div className="text-[15px] font-bold text-[#162231]">Sticky board filters</div>
                        <div className="mt-1 text-[13px] font-medium text-[#5b6b80]">Keep your last board filters remembered locally.</div>
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
                    <h3 className="text-[22px] font-extrabold text-[#162231]">Notifications</h3>
                    <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">
                      Tune reminder defaults for this browser so you can stay focused without losing important updates.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!hasNotificationChanges}
                    onClick={() => {
                      localStorage.setItem(notificationSettingsStorageKey, JSON.stringify(notificationSettings));
                      setNotificationSnapshot(notificationSettings);
                      setNotificationNotice('Notification preferences saved on this device.');
                    }}
                    className="rounded-2xl border border-[#d9e3ef] bg-white px-5 py-3 text-sm font-bold text-[#162231] shadow-sm transition hover:border-[#bfd0e2] hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Save Notifications
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
                      title: 'Email when a card is assigned to me',
                      description: 'Useful when teammates hand work over and you are not already looking at the board.',
                    },
                    {
                      key: 'dueSoonDesktop',
                      title: 'Desktop reminder for cards due soon',
                      description: 'Surface upcoming due dates before they turn urgent.',
                    },
                    {
                      key: 'commentMentionEmail',
                      title: 'Email when I am mentioned in a comment',
                      description: 'Catch feedback and unblock conversations faster.',
                    },
                    {
                      key: 'weeklyDigest',
                      title: 'Weekly delivery digest',
                      description: 'Summarize your board momentum once per week on this device.',
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
                  <h3 className="text-[22px] font-extrabold text-[#162231]">Administration</h3>
                  <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">
                    Workspace-wide team management is still evolving. Today, the most important admin actions live directly inside each board.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Link
                    to="/boards"
                    className="rounded-[24px] border border-[#d9e3ef] bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fa_100%)] p-5 shadow-sm transition hover:-translate-y-0.5"
                  >
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6b7b90]">Boards</div>
                    <div className="mt-3 text-[18px] font-extrabold text-[#162231]">Open Board Settings</div>
                    <div className="mt-2 text-[13px] font-medium leading-6 text-[#5b6b80]">
                      Manage members, lists, swimlanes, labels, webhooks, and automation rules where the work happens.
                    </div>
                  </Link>

                  <Link
                    to="/projects"
                    className="rounded-[24px] border border-[#d9e3ef] bg-[linear-gradient(180deg,#fffdf8_0%,#f7f2e8_100%)] p-5 shadow-sm transition hover:-translate-y-0.5"
                  >
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#7d6642]">Projects</div>
                    <div className="mt-3 text-[18px] font-extrabold text-[#162231]">Review Project Health</div>
                    <div className="mt-2 text-[13px] font-medium leading-6 text-[#5b6b80]">
                      Track scope, schedule, and status changes across delivery workstreams.
                    </div>
                  </Link>

                  <Link
                    to="/analytics"
                    className="rounded-[24px] border border-[#d9e3ef] bg-[linear-gradient(180deg,#f8fffb_0%,#edf7f1_100%)] p-5 shadow-sm transition hover:-translate-y-0.5"
                  >
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#2e6d57]">Analytics</div>
                    <div className="mt-3 text-[18px] font-extrabold text-[#162231]">Inspect Flow Metrics</div>
                    <div className="mt-2 text-[13px] font-medium leading-6 text-[#5b6b80]">
                      Use cycle time, throughput, and CFD trends to spot blockers and rebalance the system.
                    </div>
                  </Link>
                </div>

                <div className="mt-6 rounded-[24px] border border-dashed border-[#d9e3ef] bg-[#f8fbff] px-5 py-4 text-[14px] font-medium leading-7 text-[#5b6b80]">
                  Need to adjust board permissions right now? Open a board, click <span className="font-extrabold text-[#162231]">Settings</span>, then use the members and automations sections there.
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
