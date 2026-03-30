import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { SelectField } from '@/components/SelectField';

const teamStats = [
  {
    title: 'TOTAL MEMBERS',
    value: '24',
    footer: '+2 this month',
    footerClass: 'text-[#0f4fe6]',
    accent: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M3 17l6-6 4 4 7-7" />
      </svg>
    ),
  },
  {
    title: 'ACTIVE NOW',
    value: '18',
    footer: '',
    avatars: ['#cfdceb', '#9cafc9', '#617592'],
    extra: '+15',
  },
  {
    title: 'AVG. WORKLOAD',
    value: '6.4',
    footer: '',
    progress: 62,
    progressColor: '#ff6b18',
  },
  {
    title: 'PENDING INVITES',
    value: '3',
    footer: 'Expires in 24 hours',
    footerClass: 'text-[#4e5f74]',
  },
];

const members = [
  {
    name: 'Sarah Chen',
    email: 'sarah.c@kinetic.io',
    role: 'LEAD DESIGNER',
    status: 'Online',
    statusClass: 'text-[#03a63c]',
    workload: 8,
    progress: 78,
    progressColor: '#ff6b18',
    avatar: 'https://i.pravatar.cc/120?img=32',
    online: true,
  },
  {
    name: 'Marcus Thorne',
    email: 'm.thorne@kinetic.io',
    role: 'SENIOR DEV',
    status: 'Online',
    statusClass: 'text-[#03a63c]',
    workload: 4,
    progress: 40,
    progressColor: '#0f4fe6',
    avatar: 'https://i.pravatar.cc/120?img=15',
    online: true,
  },
  {
    name: 'Elena Rodriguez',
    email: 'elena.r@kinetic.io',
    role: 'PRODUCT OWNER',
    status: 'Offline',
    statusClass: 'text-[#39485b]',
    workload: 12,
    progress: 100,
    progressColor: '#b03f3f',
    avatar: 'https://i.pravatar.cc/120?img=48',
    online: false,
  },
];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-9 w-14 items-center rounded-full transition-colors ${
        checked ? 'bg-[#0f4fe6]' : 'bg-[#d9e3ec]'
      }`}
    >
      <span
        className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function TeamPage() {
  const [publicProfiles, setPublicProfiles] = useState(true);
  const [selfAssignment, setSelfAssignment] = useState(true);
  const [workloadCaps, setWorkloadCaps] = useState(false);

  return (
    <div className="flex h-screen bg-[#eef4fa] font-sans text-[#162231]">
      <Sidebar activePage="team" />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7fbff]">
        <TopNav title="" searchPlaceholder="Search team members..." />

        <div className="flex-1 overflow-auto px-10 pb-10 pt-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-[38px] font-extrabold tracking-tight text-[#162231]">Team Management</h1>
                <p className="mt-2 text-[17px] font-medium text-[#5b6b80]">
                  Manage roles, workloads, and collaboration permissions for Fluid Architect.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button className="flex h-14 items-center gap-3 rounded-2xl border border-[#d9e3ef] bg-[#eaf1f8] px-7 text-[16px] font-semibold text-[#162231]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v10m0 0l-4-4m4 4l4-4M5 20h14" />
                  </svg>
                  Export CSV
                </button>
                <button className="flex h-14 items-center gap-3 rounded-2xl bg-[#0f4fe6] px-7 text-[16px] font-bold text-white shadow-[0_16px_32px_rgba(15,79,230,0.24)]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M18 9v6m3-3h-6M5 19a4 4 0 010-8 5 5 0 019.584-1.25A4.5 4.5 0 1117.5 19H5z" />
                  </svg>
                  Invite Member
                </button>
              </div>
            </div>

            <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {teamStats.map((stat) => (
                <section key={stat.title} className="rounded-[30px] bg-[#eef4fa] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">{stat.title}</p>
                  <p className="mt-4 text-[52px] font-extrabold leading-none tracking-tight text-[#162231]">{stat.value}</p>

                  {'progress' in stat && stat.progress ? (
                    <div className="mt-8 h-2 rounded-full bg-[#e0e8f0]">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${stat.progress}%`, backgroundColor: stat.progressColor }}
                      ></div>
                    </div>
                  ) : null}

                  {'avatars' in stat && stat.avatars ? (
                    <div className="mt-8 flex items-center">
                      <div className="flex -space-x-2">
                        {stat.avatars.map((color) => (
                          <div
                            key={color}
                            className="h-10 w-10 rounded-full border-2 border-[#eef4fa]"
                            style={{ backgroundColor: color }}
                          ></div>
                        ))}
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#eef4fa] bg-[#d8e1ea] text-[12px] font-bold text-[#4e5f74]">
                          {stat.extra}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {stat.footer ? (
                    <div className={`mt-5 flex items-center gap-2 text-[14px] font-bold ${stat.footerClass || 'text-[#0f4fe6]'}`}>
                      {'accent' in stat && stat.accent ? stat.accent : null}
                      <span>{stat.footer}</span>
                    </div>
                  ) : null}
                </section>
              ))}
            </div>

            <section className="mb-8 overflow-hidden rounded-[32px] bg-[#eef4fa] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
              <div className="flex items-center justify-between border-b border-[#dce5ef] px-8 py-7">
                <h2 className="text-[20px] font-extrabold text-[#162231]">Active Team Members</h2>
                <button className="flex h-12 items-center gap-3 rounded-2xl bg-white px-5 text-[16px] font-semibold text-[#162231] shadow-sm">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5h18M6 12h12M10 19h4" />
                  </svg>
                  Filter
                </button>
              </div>

              <div className="grid grid-cols-[1.7fr_1.2fr_0.8fr_1.2fr] px-8 py-5 text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">
                <div>MEMBER</div>
                <div>ROLE</div>
                <div>STATUS</div>
                <div>WORKLOAD</div>
              </div>

              {members.map((member) => (
                <div
                  key={member.email}
                  className="grid grid-cols-[1.7fr_1.2fr_0.8fr_1.2fr] items-center border-t border-[#dce5ef] px-8 py-6"
                >
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <img src={member.avatar} alt={member.name} className="h-14 w-14 rounded-2xl object-cover" />
                      <span
                        className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#eef4fa] ${
                          member.online ? 'bg-[#03a63c]' : 'bg-[#c8d3de]'
                        }`}
                      ></span>
                    </div>
                    <div>
                      <h3 className="text-[18px] font-extrabold text-[#162231]">{member.name}</h3>
                      <p className="mt-1 text-[14px] font-medium text-[#5b6b80]">{member.email}</p>
                    </div>
                  </div>

                  <div>
                    <span className="rounded-xl bg-[#dfe7ef] px-4 py-2 text-[13px] font-bold tracking-[0.08em] text-[#3f526a]">
                      {member.role}
                    </span>
                  </div>

                  <div className={`text-[16px] font-medium ${member.statusClass}`}>{member.status}</div>

                  <div className="flex items-center gap-4">
                    <span className="min-w-[72px] text-[16px] font-semibold text-[#162231]">{member.workload} Tasks</span>
                    <div className="h-2 flex-1 rounded-full bg-[#e0e8f0]">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${member.progress}%`, backgroundColor: member.progressColor }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t border-[#dce5ef] px-8 py-6 text-center">
                <button className="text-[14px] font-bold text-[#0f4fe6] hover:underline">View all 24 members</button>
              </div>
            </section>

            <div className="grid gap-8 xl:grid-cols-2">
              <section className="rounded-[32px] bg-[#eef4fa] p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                <h2 className="text-[20px] font-extrabold text-[#162231]">Invite New Members</h2>
                <p className="mt-4 max-w-[540px] text-[16px] leading-8 text-[#5b6b80]">
                  Send an invitation to join your workspace. They will receive an email with onboarding instructions.
                </p>

                <div className="mt-8 space-y-7">
                  <div>
                    <label className="mb-3 block text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      defaultValue="colleague@company.com"
                      className="h-14 w-full rounded-2xl border border-transparent bg-[#e0e9f2] px-5 text-[16px] text-[#3a4a5f] outline-none focus:border-[#bfd0e2]"
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-3 block text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">ROLE</label>
                      <SelectField
                        size="lg"
                        defaultValue="viewer"
                        options={[
                          { value: 'viewer', label: 'Viewer' },
                          { value: 'member', label: 'Member' },
                          { value: 'admin', label: 'Admin' },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-[13px] font-extrabold tracking-[0.15em] text-[#4e5f74]">BOARD ACCESS</label>
                      <SelectField
                        size="lg"
                        defaultValue="all"
                        options={[
                          { value: 'all', label: 'All Boards' },
                          { value: 'selected', label: 'Selected Boards' },
                        ]}
                      />
                    </div>
                  </div>

                  <button className="flex h-16 w-full items-center justify-center rounded-2xl bg-[#0f4fe6] text-[18px] font-bold text-white shadow-[0_16px_32px_rgba(15,79,230,0.24)]">
                    Send Invitation
                  </button>
                </div>
              </section>

              <section className="rounded-[32px] bg-[#eef4fa] p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                <h2 className="text-[20px] font-extrabold text-[#162231]">Workspace Governance</h2>
                <p className="mt-4 max-w-[540px] text-[16px] leading-8 text-[#5b6b80]">
                  Control how your team interacts and the visibility of work within the workspace.
                </p>

                <div className="mt-10 space-y-8">
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <h3 className="text-[18px] font-extrabold text-[#162231]">Public Profiles</h3>
                      <p className="mt-1 text-[14px] font-medium text-[#5b6b80]">Allow members to see each other's full profiles</p>
                    </div>
                    <Toggle checked={publicProfiles} onChange={setPublicProfiles} />
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <h3 className="text-[18px] font-extrabold text-[#162231]">Self-Assignment</h3>
                      <p className="mt-1 text-[14px] font-medium text-[#5b6b80]">Enable team members to pick up unassigned tasks</p>
                    </div>
                    <Toggle checked={selfAssignment} onChange={setSelfAssignment} />
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <h3 className="text-[18px] font-extrabold text-[#162231]">Workload Caps</h3>
                      <p className="mt-1 text-[14px] font-medium text-[#5b6b80]">Restrict members from having more than 10 active tasks</p>
                    </div>
                    <Toggle checked={workloadCaps} onChange={setWorkloadCaps} />
                  </div>
                </div>

                <button className="mt-10 flex items-center gap-3 text-[16px] font-bold text-[#b03f3f]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                  </svg>
                  Deactivate Workspace
                </button>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
