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
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '#', icon: <DashboardIcon /> },
    { id: 'projects', label: 'Projects', path: '/', icon: <FolderIcon /> },
    { id: 'boards', label: 'Active Boards', path: '/boards', icon: <LayoutIcon /> },
    { id: 'analytics', label: 'Analytics', path: '/analytics', icon: <ChartBarIcon /> },
    { id: 'team', label: 'Team', path: '#', icon: <UsersIcon /> },
    { id: 'settings', label: 'Settings', path: '/settings', icon: <CogIcon /> },
  ];

  return (
    <aside className="w-[260px] bg-[#f8fafc] flex flex-col justify-between hidden md:flex shrink-0 h-screen border-r border-[#e2e8f0]/40">
      <div>
        <div className="p-8 pb-6 mb-2">
          <h2 className="font-extrabold text-[#111827] leading-none text-[22px] tracking-tight">Kinetic</h2>
          <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1 uppercase leading-none">Workspace</p>
        </div>

        <nav className="px-5 space-y-1.5 mt-2 flex flex-col">
          {navItems.map(item => {
             const isActive = activePage === item.id;
             return (
               <Link 
                 key={item.id} 
                 to={item.path} 
                 className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${isActive ? 'bg-white text-[#0d6efd] shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100/50' : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-900'}`}
               >
                 <span className={`flex items-center justify-center ${isActive ? 'text-[#0d6efd]' : 'text-gray-400'}`}>
                   {item.icon}
                 </span>
                 {item.label}
               </Link>
             );
          })}
        </nav>
      </div>

      <div>
        <div className="px-5 mb-4 border-t border-gray-200/50 pt-4 pb-2 mx-5">
           <div className="flex items-center gap-3">
             <img src="https://i.pravatar.cc/150?img=11" className="w-[38px] h-[38px] rounded-full bg-gray-200 shadow-sm" alt="User" />
             <div className="flex-1 overflow-hidden">
               <h4 className="text-[13px] font-extrabold text-gray-900 truncate">Alex Chen</h4>
               <p className="text-[11px] font-semibold text-gray-400 truncate">Team Lead</p>
             </div>
           </div>
        </div>
        <div className="px-5 pb-6">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl text-[13px] font-bold transition-colors">
            <LogoutIcon /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
