import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Icons
export const DashboardIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
export const FolderIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
export const LayoutIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13h16M12 5v14" /></svg>;
export const ChartBarIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
export const UsersIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
export const CogIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
export const LogoutIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

export function Sidebar({ activePage }: { activePage: string }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { id: 'projects', label: 'Projects', path: '/projects', icon: <FolderIcon /> },
    { id: 'boards', label: 'Active Boards', path: '/boards', icon: <LayoutIcon /> },
    { id: 'analytics', label: 'Analytics', path: '/analytics', icon: <ChartBarIcon /> },
    { id: 'team', label: 'Team', path: '/team', icon: <UsersIcon /> },
    { id: 'settings', label: 'Settings', path: '/settings', icon: <CogIcon /> },
  ];

  const displayName = user?.nickname || user?.username || 'Alex Chen';
  const displayRole = user?.email || 'Team Lead';
  const avatarUrl = user?.avatar || 'https://i.pravatar.cc/150?img=11';

  return (
    <aside className="hidden h-screen w-[320px] shrink-0 flex-col border-r border-[#d9e3ef] bg-[#f3f7fc] md:flex">
      <div className="flex-1 px-6 pt-8">
        <div className="px-4 pb-12">
          <h2 className="text-[22px] font-extrabold leading-none tracking-tight text-[#111827]">Kinetic</h2>
          <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#64748b]">Workspace</p>
        </div>

        <nav className="flex flex-col gap-1.5">
          {navItems.map(item => {
            const isActive = activePage === item.id;
            const className = `flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-[15px] font-semibold transition-all ${
              isActive
                ? 'border border-white/90 bg-white text-[#0f4fe6] shadow-[0_10px_30px_rgba(15,79,230,0.08)]'
                : 'text-[#40526d] hover:bg-white/70 hover:text-[#111827]'
            }`;
            const iconClassName = isActive ? 'text-[#0f4fe6]' : 'text-[#5f718b]';

            if (!item.path) {
              return (
                <div key={item.id} className={`${className} cursor-default`}>
                  <span className={iconClassName}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              );
            }

            return (
              <Link key={item.id} to={item.path} className={className}>
                <span className={iconClassName}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-5 pb-7">
        <div className="border-t border-[#d5dfec] px-1 pt-7">
          <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
            <img src={avatarUrl} className="h-12 w-12 rounded-2xl border border-white object-cover shadow-sm" alt={displayName} />
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-[14px] font-extrabold text-[#111827]">{displayName}</h4>
              <p className="truncate text-[12px] font-medium text-[#6b7b90]">{displayRole}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 px-1">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-bold text-[#6b7b90] transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <LogoutIcon /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
