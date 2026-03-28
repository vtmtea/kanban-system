import { useState } from 'react';
import { Link } from 'react-router-dom';

export function BoardListPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Svg icons
  const FolderIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
  const LayoutIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13h16M12 5v14" /></svg>;
  const ChartBarIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
  const CogIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  const BellIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
  const QuestionMarkIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-[#f8fafc] flex flex-col justify-between hidden md:flex">
        {/* Top Part */}
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

          {/* Navigation */}
          <nav className="px-4 space-y-1 mt-2">
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-white text-[#0d6efd] rounded-lg shadow-sm text-sm font-semibold border border-gray-100">
              <FolderIcon /> Projects
            </a>
            <Link to="/boards" className="flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
              <LayoutIcon /> Boards
            </Link>
            <Link to="/analytics" className="flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
              <ChartBarIcon /> Analytics
            </Link>
            <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors mt-6">
              <CogIcon /> Settings
            </Link>
          </nav>
        </div>

        {/* Bottom Part Action */}
        <div className="p-4 mb-4">
          <button className="w-full flex items-center justify-center gap-2 bg-[#0d6efd] hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            New Project
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-[72px] flex items-center justify-between px-8 z-10">
          <div className="flex items-end h-full pt-4">
            <a href="#" className="text-[#0d6efd] font-semibold pb-4 px-2 border-b-2 border-[#0d6efd] mr-8">Projects</a>
            <a href="#" className="text-gray-500 font-medium pb-4 px-2 hover:text-gray-700 mr-8">Boards</a>
            <Link to="/analytics" className="text-gray-500 font-medium pb-4 px-2 hover:text-gray-700">Analytics</Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-transparent transition-shadow"
              />
            </div>
            
            <button className="text-gray-400 hover:text-gray-600 ml-2">
              <BellIcon />
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <QuestionMarkIcon />
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-800 ml-2 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
               <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-auto bg-[#f8fafc] p-8 pt-4">
          <div className="max-w-6xl mx-auto">
            
            {/* Header Area */}
            <div className="flex justify-between items-end mb-8 animate-slide-up-fade">
              <div>
                <h1 className="text-[28px] font-bold text-gray-900 mb-1">Project Dashboard</h1>
                <p className="text-gray-500 text-sm">Manage and monitor your team's active work streams.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-1 flex shadow-sm">
                  <button className="px-3 py-1.5 bg-white text-[#0d6efd] text-sm font-semibold rounded-md shadow-sm border border-gray-100">Grid</button>
                  <button className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium rounded-md">List</button>
                </div>
                <button className="px-4 py-2 bg-[#e2e8f0] hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  Filters
                </button>
              </div>
            </div>

            {/* Grid Row 1 (Top Projects) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              
              {/* Card 1 */}
              <Link to="/projects/1" className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1.5 transition-all duration-300 ease-out group animate-slide-up-fade stagger-delay-1 cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">N</div>
                  <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded uppercase tracking-wider">High Priority</span>
                </div>
                <h3 className="font-bold text-gray-900 text-[17px] mb-2 leading-tight">Nebula Cloud Infrastructure</h3>
                <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed">Migration of legacy database clusters to modern serverless architecture with zero downtime requirements.</p>
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-900">65%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#0d6efd] h-1.5 rounded-full relative group-hover:opacity-80 transition-opacity" style={{ width: '65%' }}>
                      <div className="absolute inset-0 bg-white/20 w-full animate-[pulse_2s_ease-in-out_infinite] rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                    <div className="flex items-center"><svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> 12</div>
                    <div className="flex items-center text-red-500"><svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> 3</div>
                  </div>
                  <div className="flex -space-x-2">
                    <img className="w-6 h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=1" alt="Avatar"/>
                    <img className="w-6 h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=2" alt="Avatar"/>
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">+4</div>
                  </div>
                </div>
              </Link>

              {/* Card 2 */}
              <Link to="/projects/2" className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1.5 transition-all duration-300 ease-out group animate-slide-up-fade stagger-delay-2 cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">V</div>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">In Progress</span>
                </div>
                <h3 className="font-bold text-gray-900 text-[17px] mb-2 leading-tight">Vanguard UI Redesign</h3>
                <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed">Complete overhaul of the customer-facing dashboard focusing on accessibility and responsive mobile layouts.</p>
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-900">32%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#0d6efd] h-1.5 rounded-full group-hover:opacity-80 transition-opacity" style={{ width: '32%' }}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                    <div className="flex items-center"><svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> 48</div>
                    <div className="flex items-center"><svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> 0</div>
                  </div>
                  <div className="flex -space-x-2">
                    <img className="w-6 h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=3" alt="Avatar"/>
                    <img className="w-6 h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=4" alt="Avatar"/>
                  </div>
                </div>
              </Link>

              {/* Card 3 */}
              <Link to="/projects/3" className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-200 hover:-translate-y-1.5 transition-all duration-300 ease-out group animate-slide-up-fade stagger-delay-3 cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">S</div>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase tracking-wider">Review</span>
                </div>
                <h3 className="font-bold text-gray-900 text-[17px] mb-2 leading-tight">Solaris API Suite</h3>
                <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed">Internal API documentation and SDK generation for the Solaris third-party developer integration portal.</p>
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-900">94%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gray-700 h-1.5 rounded-full group-hover:opacity-80 transition-opacity" style={{ width: '94%' }}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                    <div className="flex items-center"><svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> 5</div>
                    <div className="flex items-center"><svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> 0</div>
                  </div>
                  <div className="flex -space-x-2">
                    <img className="w-6 h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=5" alt="Avatar"/>
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">+1</div>
                  </div>
                </div>
              </Link>

            </div>

            {/* Grid Row 2 (Featured Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              {/* Featured Promo Card (Takes 2 cols) */}
              <Link to="/projects/1" className="block md:col-span-2 relative bg-gray-900 rounded-2xl overflow-hidden shadow-lg group hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 animate-slide-up-fade stagger-delay-4 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent z-10"></div>
                {/* Abstract animated/colorful wavy background representation */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-700 via-indigo-800 to-gray-900 group-hover:scale-105 group-hover:rotate-1 transition-transform duration-700 ease-out"></div>
                <div className="relative z-20 p-8 h-full flex flex-col justify-center transform group-hover:translate-x-2 transition-transform duration-500">
                  <span className="self-start px-3 py-1 bg-white/10 text-white text-[10px] font-bold rounded uppercase tracking-widest mb-4 backdrop-blur-sm border border-white/10">Ongoing Campaign</span>
                  <h2 className="text-3xl font-bold text-white mb-3">Q4 Brand Evolution</h2>
                  <p className="text-gray-300 mb-8 max-w-lg leading-relaxed text-sm">Managing the global rollout of the new visual identity across 14 markets. Tracking creative assets, stakeholder approvals, and media buys.</p>
                  <div className="flex items-center gap-4 mt-auto">
                    <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-lg backdrop-blur-sm">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Live In</div>
                        <div className="text-white font-bold leading-none">12 Days</div>
                      </div>
                    </div>
                    <button className="bg-white hover:bg-gray-100 text-gray-900 px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm hover:scale-105 active:scale-95">
                      View Board
                    </button>
                  </div>
                </div>
              </Link>

              {/* Weekly Velocity Card (Takes 1 col) */}
              <Link to="/projects/1" className="block bg-[#0d6efd] rounded-2xl p-8 flex flex-col justify-between text-white shadow-lg relative overflow-hidden group hover:shadow-blue-500/40 hover:-translate-y-1.5 transition-all duration-300 animate-slide-up-fade stagger-delay-5 cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 ease-in-out"></div>
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <h3 className="font-bold text-[18px] mb-2">Weekly Velocity</h3>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-5xl font-extrabold tracking-tighter">84%</span>
                    <span className="text-blue-200 text-sm font-semibold mb-1">+12% vs last week</span>
                  </div>
                </div>
                <div className="mt-8">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-blue-100">Completed Tasks</span>
                    <span>142</span>
                  </div>
                  <div className="w-full bg-blue-700/50 rounded-full h-1">
                    <div className="bg-white h-1 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: '84%' }}></div>
                  </div>
                </div>
              </Link>

            </div>

            {/* Empty State / CTA Card */}
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-white/50 mb-8 hover:bg-white hover:border-blue-300 transition-all duration-300 animate-slide-up-fade stagger-delay-5 group">
              <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-50 group-hover:text-blue-500 rounded-full flex items-center justify-center text-gray-400 mb-4 transition-colors duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to start something new?</h3>
              <p className="text-gray-500 text-sm max-w-sm mb-6">Create a new workspace or import projects from Trello, Asana, or Jira to get started.</p>
              <div className="flex gap-3 mt-2">
                <button className="bg-[#0d6efd] hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:scale-105 hover:shadow-lg active:scale-95">
                  Create New Project
                </button>
                <button className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-bold transition-all border border-gray-200 hover:border-gray-300 hover:shadow-sm">
                  Import Data
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}