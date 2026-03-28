import { useState } from 'react';
import { Link } from 'react-router-dom';

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');

  // Svg icons for Global Sidebar
  const FolderIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
  const LayoutIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13h16M12 5v14" /></svg>;
  const ChartBarIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
  const CogIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-gray-800 animate-slide-up-fade">
      {/* Global Sidebar */}
      <aside className="w-64 bg-[#f8fafc] flex flex-col justify-between hidden md:flex border-r border-gray-100 z-20 shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0d6efd] rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900 leading-none text-lg">Workspace</h2>
              <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">HIGH PERFORMANCE TEAM</p>
            </div>
          </div>

          {/* Global Navigation */}
          <nav className="px-4 space-y-1 mt-2">
            <Link to="/" className="flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
              <FolderIcon /> Projects
            </Link>
            <Link to="/boards" className="flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
              <LayoutIcon /> Boards
            </Link>
            <Link to="/analytics" className="flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
              <ChartBarIcon /> Analytics
            </Link>
            <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 bg-white text-[#0d6efd] rounded-lg shadow-sm text-sm font-semibold border border-gray-100 mt-6">
              <CogIcon /> Settings
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative bg-white">
        
        {/* Top Navbar */}
        <header className="h-[72px] flex items-center justify-between px-10 border-b border-gray-100 bg-white shrink-0">
           <div className="flex items-end h-full pt-4">
             <span className="text-gray-900 font-bold text-xl pb-4">Global Settings</span>
           </div>
           
           <div className="flex items-center gap-4">
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </button>
              <div className="w-8 h-8 rounded-full bg-indigo-500 ml-2 overflow-hidden flex items-center justify-center text-white font-bold text-sm shadow-sm cursor-pointer">
                 A
              </div>
           </div>
        </header>

        {/* Global Settings Split Pane Wrapper */}
        <div className="flex flex-1 overflow-hidden bg-[#fbfcfd]">
           
           {/* Secondary Settings Sidebar */}
           <aside className="w-64 border-r border-gray-100 bg-white shrink-0 p-8 flex flex-col">
              
              <nav className="space-y-1">
                 <button onClick={() => scrollToSection('profile')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-[14px] font-bold ${activeSection === 'profile' ? 'bg-blue-50 text-[#0d6efd]' : 'text-gray-500 hover:bg-gray-50'}`}>
                   <svg className="w-5 h-5 opacity-70" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                   Profile
                 </button>
                 <button onClick={() => scrollToSection('workspace')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-[14px] font-bold ${activeSection === 'workspace' ? 'bg-blue-50 text-[#0d6efd]' : 'text-gray-500 hover:bg-gray-50'}`}>
                   <svg className="w-5 h-5 opacity-70" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                   Workspace
                 </button>
                 <button onClick={() => scrollToSection('notifications')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-[14px] font-bold ${activeSection === 'notifications' ? 'bg-blue-50 text-[#0d6efd]' : 'text-gray-500 hover:bg-gray-50'}`}>
                   <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                   Notifications
                 </button>
                 <button onClick={() => scrollToSection('team')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-[14px] font-bold ${activeSection === 'team' ? 'bg-blue-50 text-[#0d6efd]' : 'text-gray-500 hover:bg-gray-50'}`}>
                   <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                   Team
                 </button>
              </nav>

           </aside>

           {/* Content Scrolling Area */}
           <div className="flex-1 overflow-y-auto w-full relative custom-scrollbar">
              <div className="max-w-[800px] p-12 lg:p-14 space-y-10 pb-40">
                 
                 <div className="mb-2">
                   <h2 className="text-[28px] font-extrabold text-gray-900 tracking-tight mb-2">Settings</h2>
                   <p className="text-[14px] text-gray-500 font-medium">Manage your workspace preferences, profile, and team permissions.</p>
                 </div>

                 {/* Profile Block */}
                 <section id="profile" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm scroll-mt-10">
                    <div className="flex items-center gap-6 mb-8">
                       <div className="w-20 h-20 rounded-2xl shadow-sm border border-gray-100 overflow-hidden bg-gray-100 shrink-0">
                          <img src="https://i.pravatar.cc/150?img=47" alt="Avatar" className="w-full h-full object-cover" />
                       </div>
                       <div>
                          <h3 className="text-lg font-extrabold text-gray-900 mb-1">Personal Information</h3>
                          <p className="text-[13px] text-gray-500 font-medium">Update your photo and personal details.</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                          <input type="text" defaultValue="Julianna Silva" className="w-full bg-[#ecf0f3]/50 px-4 py-3 rounded-xl border border-transparent focus:border-[#0d6efd] focus:bg-white outline-none font-bold text-[14px] text-gray-800 transition-colors" />
                       </div>
                       <div>
                          <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                          <input type="email" defaultValue="julianna@kineticcore.io" disabled className="w-full bg-[#ecf0f3]/50 opacity-80 cursor-not-allowed px-4 py-3 rounded-xl border border-transparent font-bold text-[14px] text-gray-800 transition-colors" />
                       </div>
                       <div>
                          <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Job Title</label>
                          <input type="text" defaultValue="Principal Product Architect" className="w-full bg-[#ecf0f3]/50 px-4 py-3 rounded-xl border border-transparent focus:border-[#0d6efd] focus:bg-white outline-none font-bold text-[14px] text-gray-800 transition-colors" />
                       </div>
                       <div>
                          <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Timezone</label>
                          <select className="w-full bg-[#ecf0f3]/50 px-4 py-3 rounded-xl border border-transparent focus:border-[#0d6efd] focus:bg-white outline-none font-bold text-[14px] text-gray-800 transition-colors cursor-pointer appearance-none">
                             <option>GMT -05:00 Eastern Time</option>
                             <option>GMT +01:00 Central European</option>
                          </select>
                       </div>
                    </div>
                 </section>

                 {/* Workspace Settings Block */}
                 <section id="workspace" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm scroll-mt-10">
                    <div className="mb-8">
                       <h3 className="text-lg font-extrabold text-gray-900 mb-1">Workspace Settings</h3>
                       <p className="text-[13px] text-gray-500 font-medium">Configure your shared environment settings.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 mb-8">
                       <div>
                          <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Workspace Name</label>
                          <input type="text" defaultValue="Kinetic Core" className="w-full bg-[#ecf0f3]/50 px-4 py-3 rounded-xl border border-transparent focus:border-[#0d6efd] focus:bg-white outline-none font-bold text-[14px] text-gray-800 transition-colors" />
                       </div>
                       <div>
                          <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Workspace URL</label>
                          <div className="flex bg-[#ecf0f3]/50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0d6efd]/30 transition-shadow">
                             <span className="px-4 py-3 text-[14px] font-bold text-gray-400 border-r border-[#ecf0f3]">kinetic.io/</span>
                             <input type="text" defaultValue="core-alpha" className="w-full bg-transparent px-4 py-3 border-transparent outline-none font-bold text-[14px] text-gray-800" />
                          </div>
                       </div>
                    </div>

                    <div className="bg-[#fbfcfd] border border-gray-100 p-5 rounded-xl flex items-center justify-between mb-8 cursor-pointer hover:bg-gray-50 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 text-blue-500 flex items-center justify-center rounded-lg">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div>
                             <h4 className="font-bold text-[14px] text-gray-900">Public Workspace</h4>
                             <p className="text-[12px] text-gray-500 font-medium mt-0.5">Allow anyone with the link to request access.</p>
                          </div>
                       </div>
                       {/* Toggle Switch */}
                       <div className="w-11 h-6 bg-[#0d6efd] rounded-full relative cursor-pointer shadow-inner shrink-0">
                          <div className="w-4 h-4 rounded-full bg-white absolute right-1 top-1 shadow-sm"></div>
                       </div>
                    </div>

                    <div>
                       <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Workspace Logo</label>
                       <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-[#ecf0f3]/50 border border-gray-200 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400">
                             <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                          <button className="px-4 py-2 border border-gray-200 text-gray-700 font-bold text-sm bg-white hover:bg-gray-50 rounded-lg shadow-sm">Replace Logo</button>
                       </div>
                    </div>
                 </section>

                 {/* Notifications Block */}
                 <section id="notifications" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm scroll-mt-10">
                    <div className="mb-8">
                       <h3 className="text-lg font-extrabold text-gray-900 mb-1">Notification Preferences</h3>
                       <p className="text-[13px] text-gray-500 font-medium">Decide how and when you want to be notified.</p>
                    </div>

                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-gray-100">
                             <th className="pb-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest w-[50%]">Event</th>
                             <th className="pb-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Email</th>
                             <th className="pb-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Desktop</th>
                             <th className="pb-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Slack</th>
                          </tr>
                       </thead>
                       <tbody className="text-[14px] font-bold text-gray-800">
                          <tr className="border-b border-gray-50">
                             <td className="py-5">New Task Created</td>
                             <td className="text-center py-5"><input type="checkbox" defaultChecked className="w-4 h-4 text-[#0d6efd] rounded cursor-pointer" /></td>
                             <td className="text-center py-5"><input type="checkbox" defaultChecked className="w-4 h-4 text-[#0d6efd] rounded cursor-pointer" /></td>
                             <td className="text-center py-5"><input type="checkbox" className="w-4 h-4 text-[#0d6efd] rounded cursor-pointer" /></td>
                          </tr>
                          <tr className="border-b border-gray-50">
                             <td className="py-5">Task Completed</td>
                             <td className="text-center py-5"><input type="checkbox" defaultChecked className="w-4 h-4 text-[#0d6efd] rounded cursor-pointer" /></td>
                             <td className="text-center py-5"><input type="checkbox" className="w-4 h-4 text-[#0d6efd] rounded cursor-pointer" /></td>
                             <td className="text-center py-5"><input type="checkbox" defaultChecked className="w-4 h-4 text-[#0d6efd] rounded cursor-pointer" /></td>
                          </tr>
                          <tr>
                             <td className="py-5">Mentioned in Comment</td>
                             <td className="text-center py-5"><input type="checkbox" defaultChecked className="w-4 h-4 text-[#0d6efd] rounded cursor-pointer" /></td>
                             <td className="text-center py-5"><input type="checkbox" defaultChecked className="w-4 h-4 text-[#0d6efd] rounded cursor-pointer" /></td>
                             <td className="text-center py-5"><input type="checkbox" defaultChecked className="w-4 h-4 text-[#0d6efd] rounded cursor-pointer" /></td>
                          </tr>
                       </tbody>
                    </table>
                 </section>

                 {/* Team Management Block */}
                 <section id="team" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm scroll-mt-10">
                    <div className="flex items-center justify-between mb-8">
                       <div>
                          <h3 className="text-lg font-extrabold text-gray-900 mb-1">Team Management</h3>
                          <p className="text-[13px] text-gray-500 font-medium">Invite and manage roles for your workspace members.</p>
                       </div>
                       <button className="px-5 py-2.5 bg-[#0d6efd] text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2">
                         <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7h-1v-1h1V5h1v1h1v1h-1v1h-1V7z" /></svg>
                         Invite Member
                       </button>
                    </div>

                    <div className="space-y-2">
                       {/* Mock Users mimicking the design exactly */}
                       <div className="flex items-center justify-between p-4 bg-[#fbfcfd] border border-gray-100 rounded-xl">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0d6efd] flex items-center justify-center font-bold text-sm">JS</div>
                             <div>
                                <div className="font-extrabold text-[14px] text-gray-900">Julianna Silva <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded ml-1 uppercase">You</span></div>
                                <div className="text-[12px] font-medium text-gray-400">julianna@kineticcore.io</div>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase">Admin</span>
                             <button className="text-gray-400 hover:text-gray-900"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
                          </div>
                       </div>

                       <div className="flex items-center justify-between p-4 border border-transparent hover:bg-gray-50 rounded-xl transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden"><img src="https://i.pravatar.cc/150?img=11" alt="ava" className="w-full h-full object-cover"/></div>
                             <div>
                                <div className="font-extrabold text-[14px] text-gray-900">Alex Mason</div>
                                <div className="text-[12px] font-medium text-gray-400">alex.m@kineticcore.io</div>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase">Member</span>
                             <button className="text-gray-400 hover:text-gray-900"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
                          </div>
                       </div>

                       <div className="flex items-center justify-between p-4 border border-transparent hover:bg-gray-50 rounded-xl transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden"><img src="https://i.pravatar.cc/150?img=33" alt="ava" className="w-full h-full object-cover"/></div>
                             <div>
                                <div className="font-extrabold text-[14px] text-gray-900">Lia Wong</div>
                                <div className="text-[12px] font-medium text-gray-400">lia@kineticcore.io</div>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase">Viewer</span>
                             <button className="text-gray-400 hover:text-gray-900"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
                          </div>
                       </div>
                    </div>
                 </section>

              </div>

              {/* Fixed Bottom Save Bar */}
              <div className="fixed bottom-0 right-0 left-64 lg:left-[512px] p-6 bg-gradient-to-t from-[#fbfcfd] via-[#fbfcfd] to-transparent pt-12 flex justify-end gap-3 z-30 pointer-events-none">
                 <div className="pointer-events-auto flex items-center gap-4 px-6 py-4">
                    <button className="text-[13px] font-bold text-gray-600 hover:text-gray-900 mr-2">Discard Changes</button>
                    <button className="px-6 py-2.5 bg-[#0d6efd] text-white rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all text-sm">Save Preferences</button>
                 </div>
              </div>
           </div>

        </div>
      </main>
    </div>
  );
}
