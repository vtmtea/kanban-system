import { Link } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { useAuth } from '@/context/AuthContext';

const stats = [
  {
    title: 'Completed Tasks',
    value: '1,284',
    badge: '+12%',
    badgeClass: 'bg-[#dfe7ff] text-[#0f4fe6]',
    iconClass: 'bg-[#d9e6fb] text-[#0f4fe6]',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Pending Review',
    value: '42',
    badge: 'Active',
    badgeClass: 'bg-[#ff9a2f] text-[#7a3400]',
    iconClass: 'bg-[#ece5de] text-[#a65612]',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Active Collaborators',
    value: '156',
    badge: '18 New',
    badgeClass: 'bg-[#dfe7f5] text-[#576d8e]',
    iconClass: 'bg-[#dfe5ea] text-[#5f718b]',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M17 20h5v-1a4 4 0 00-4-4h-1m-4 5H3v-1a4 4 0 014-4h6a4 4 0 014 4v1zM9 9a3 3 0 100-6 3 3 0 000 6zm9 3a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    ),
  },
];

const boards = [
  {
    name: 'Project Helios',
    subtitle: 'Design System Overhaul',
    progress: 72,
    color: '#0f4fe6',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=200&q=80',
    members: ['https://i.pravatar.cc/100?img=12', 'https://i.pravatar.cc/100?img=13', 'https://i.pravatar.cc/100?img=14'],
    extra: '+4',
  },
  {
    name: 'Urban Nest App',
    subtitle: 'Full-stack Development',
    progress: 24,
    color: '#b45309',
    image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=200&q=80',
    members: ['https://i.pravatar.cc/100?img=20', 'https://i.pravatar.cc/100?img=21'],
    extra: '+12',
  },
];

const priorities = [
  {
    title: 'Final Stakeholder Presentation',
    meta: 'Project Helios • Tomorrow, 10:00 AM',
    tags: ['Presentation', 'Strategy'],
    accent: 'bg-[#b45309]',
    icon: '!',
  },
  {
    title: 'Review Q3 Budget Allocation',
    meta: 'Finance Rail • Friday, 4:30 PM',
    tags: ['Finance'],
    accent: 'bg-[#0f4fe6]',
    icon: '!',
  },
];

const activities = [
  {
    name: 'Sarah Chen',
    action: 'updated the task',
    target: 'Mobile Nav Prototype',
    badge: 'In Review',
    time: '2 HOURS AGO',
    note: undefined,
  },
  {
    name: 'Marcus Thorne',
    action: 'commented on',
    target: 'API Integration Docs',
    badge: undefined,
    time: '5 HOURS AGO',
    note: '"The updated endpoints look solid, but we need to verify the OAuth flow again."',
  },
];

const deadlines = [
  { day: '12', title: 'Client Sign-off', subtitle: 'Web Redesign Board' },
  { day: '15', title: 'Asset Handoff', subtitle: 'Marketing Campaign' },
  { day: '19', title: 'Cloud Migration', subtitle: 'DevOps Infrastructure' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const displayName = user?.nickname || user?.username || 'Julian';

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
                <p className="mt-2 text-[17px] font-medium text-[#5b6b80]">You have 4 high-priority tasks requiring attention today.</p>
              </div>

              <div className="flex items-center gap-4">
                <button className="flex h-14 items-center gap-3 rounded-2xl border border-[#d9e3ef] bg-white px-6 text-[16px] font-semibold text-[#162231] shadow-[0_8px_24px_rgba(17,24,39,0.05)]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Overview
                </button>
                <Link to="/projects/new" className="flex h-14 items-center gap-3 rounded-2xl bg-[#0f4fe6] px-7 text-[16px] font-bold text-white shadow-[0_16px_32px_rgba(15,79,230,0.28)]">
                  <span className="text-[26px] leading-none">+</span>
                  New Project
                </Link>
              </div>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0">
                <div className="mb-8 grid gap-6 md:grid-cols-3">
                  {stats.map((item) => (
                    <section key={item.title} className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <div className="mb-7 flex items-start justify-between">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-3xl ${item.iconClass}`}>
                          {item.icon}
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
                    {boards.map((board) => (
                      <Link
                        key={board.name}
                        to="/boards/1"
                        className="rounded-[30px] bg-white p-8 shadow-[0_16px_34px_rgba(16,24,40,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(16,24,40,0.09)]"
                      >
                        <div className="mb-7 flex items-start justify-between">
                          <div className="flex items-center gap-5">
                            <img src={board.image} alt={board.name} className="h-[72px] w-[72px] rounded-[24px] object-cover shadow-sm" />
                            <div>
                              <h3 className="text-[20px] font-extrabold text-[#162231]">{board.name}</h3>
                              <p className="mt-1 text-[14px] font-medium text-[#5b6b80]">{board.subtitle}</p>
                            </div>
                          </div>
                          <button className="text-[#6b7b90]">
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="5" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="12" cy="19" r="2" />
                            </svg>
                          </button>
                        </div>

                        <div className="mb-8 flex items-center">
                          <div className="flex -space-x-2">
                            {board.members.map((member) => (
                              <img key={member} src={member} alt="" className="h-9 w-9 rounded-full border-2 border-white object-cover" />
                            ))}
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#dce6f1] text-[12px] font-bold text-[#4c6078]">
                              {board.extra}
                            </div>
                          </div>
                        </div>

                        <div className="mb-2 flex items-center justify-between text-[14px] font-semibold text-[#4d5d72]">
                          <span>Progress</span>
                          <span>{board.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#e8eef5]">
                          <div className="h-2 rounded-full" style={{ width: `${board.progress}%`, backgroundColor: board.color }}></div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="rounded-[34px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <h2 className="mb-8 text-[20px] font-extrabold text-[#162231]">Recent Activity</h2>

                  <div className="space-y-8">
                    {activities.map((activity, index) => (
                      <div key={activity.target} className="flex gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d9e6fb] text-[#0f4fe6]">
                          {index === 0 ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3zM5 19h14" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M8 10h8M8 14h5M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                            </svg>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[16px] text-[#223042]">
                            <span className="font-extrabold">{activity.name}</span> {activity.action}{' '}
                            <span className="font-bold text-[#0f4fe6]">"{activity.target}"</span>{' '}
                            {activity.badge ? (
                              <span className="rounded-xl bg-[#dfe7ff] px-3 py-1 text-[13px] font-bold text-[#4b5f85]">{activity.badge}</span>
                            ) : null}
                          </p>
                          {activity.note ? (
                            <div className="mt-4 rounded-2xl border-l-4 border-[#c9d9ff] bg-white px-5 py-4 text-[14px] italic leading-7 text-[#4f6077] shadow-sm">
                              {activity.note}
                            </div>
                          ) : null}
                          <p className="mt-4 text-[12px] font-extrabold tracking-[0.2em] text-[#687a92]">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="space-y-8">
                <section className="rounded-[34px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-[20px] font-extrabold text-[#162231]">Priority Focus</h2>
                    <span className="rounded-full bg-[#ff7d1f] px-3 py-1 text-[12px] font-extrabold text-[#321300]">URGENT</span>
                  </div>

                  <div className="space-y-5">
                    {priorities.map((item) => (
                      <div key={item.title} className="rounded-[26px] bg-white p-6 shadow-sm">
                        <div className="flex gap-4">
                          <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${item.accent}`}>{item.icon}</div>
                          <div>
                            <h3 className="text-[18px] font-extrabold leading-snug text-[#162231]">{item.title}</h3>
                            <p className="mt-2 text-[14px] font-medium text-[#5b6b80]">{item.meta}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {item.tags.map((tag) => (
                                <span key={tag} className="rounded-lg bg-[#e9eef3] px-3 py-1 text-[12px] font-semibold text-[#55677f]">{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="mt-6 h-14 w-full rounded-2xl border border-[#d1dce8] bg-[#f5f9fd] text-[16px] font-semibold text-[#314155]">
                    View all priorities
                  </button>
                </section>

                <section className="rounded-[34px] bg-transparent px-1">
                  <h2 className="mb-8 text-[20px] font-extrabold text-[#162231]">Upcoming Deadlines</h2>
                  <div className="space-y-7">
                    {deadlines.map((deadline) => (
                      <div key={deadline.title} className="flex items-center gap-5">
                        <div className="flex h-[70px] w-[70px] shrink-0 flex-col items-center justify-center rounded-[18px] bg-[#dfe7ef] text-[#4e5f74]">
                          <span className="text-[13px] font-medium uppercase tracking-wide">Oct</span>
                          <span className="text-[28px] font-extrabold leading-none">{deadline.day}</span>
                        </div>
                        <div>
                          <h3 className="text-[18px] font-extrabold text-[#162231]">{deadline.title}</h3>
                          <p className="mt-1 text-[14px] font-medium text-[#5b6b80]">{deadline.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[36px] bg-[#0f4fe6] p-8 text-white shadow-[0_24px_48px_rgba(15,79,230,0.24)]">
                  <h2 className="text-[22px] font-extrabold">Team Sync</h2>
                  <p className="mt-4 max-w-[240px] text-[16px] leading-8 text-[#dbe6ff]">
                    Jump into a quick collaborative board with your team.
                  </p>
                  <button className="mt-10 flex h-14 items-center gap-3 rounded-2xl bg-white px-6 text-[16px] font-bold text-[#0f4fe6]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M17 20h5v-1a4 4 0 00-4-4h-1m-4 5H3v-1a4 4 0 014-4h6a4 4 0 014 4v1zM9 9a3 3 0 100-6 3 3 0 000 6zm9 3a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                    Start Session
                  </button>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
