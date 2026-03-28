import { useState } from 'react';
import { Link } from 'react-router-dom';

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');

  // SVG Icons for Sidebar
  const FolderIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
  const LayoutIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13h16M12 5v14" /></svg>;
  const ChartBarIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002-2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
  const CogIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-gray-800 animate-slide-up-fade">
      {/* Global Sidebar layout matching Settings and Dashboard */}
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
              <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1 uppercase">High Performance Team</p>
            </div>
          </div>

          <nav className="px-4 space-y-1 mt-2">
            <Link to="/" className="flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
              <FolderIcon /> Projects
            </Link>
            <Link to="/boards" className="flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
              <LayoutIcon /> Boards
            </Link>
            {/* Active state for Analytics */}
            <Link to="/analytics" className="flex items-center gap-3 px-3 py-2.5 bg-white text-[#0d6efd] rounded-lg shadow-sm text-sm font-semibold border border-gray-100">
              <ChartBarIcon /> Analytics
            </Link>
            <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors mt-6">
              <CogIcon /> Settings
            </Link>
          </nav>
        </div>
        
        <div className="p-4 mb-4">
          <button className="w-full flex items-center justify-center gap-2 bg-[#0d6efd] hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            New Project
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-[#fcfcfc]">
        {/* Top Navbar */}
        <header className="h-[72px] flex items-center justify-between px-10 border-b border-gray-100 bg-white shrink-0 z-10 w-full">
           <div className="flex-1 max-w-lg relative">
              <svg className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search analytics..." className="w-full bg-[#f4f6f8] border-none rounded-xl py-2.5 pl-11 pr-4 text-sm font-semibold text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#0d6efd]/30 outline-none transition-shadow" />
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex gap-4 border-r border-gray-200 pr-6 mr-2 h-8 items-center">
                 <a href="#" className="flex items-center gap-2 text-[#0d6efd] font-bold text-[14px] px-2">
                    <ChartBarIcon /> Analytics
                 </a>
                 <a href="#" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold text-[14px] px-2 transition-colors">
                    <LayoutIcon /> Boards
                 </a>
              </div>
              <button className="text-gray-400 hover:text-gray-600 relative">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                 <div className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white absolute -top-1 -right-1"></div>
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 overflow-hidden flex items-center justify-center text-white font-bold text-sm shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                 <img src="https://i.pravatar.cc/150?img=50" className="w-full h-full object-cover" alt="Profile" />
              </div>
           </div>
        </header>

        {/* Dash Content Area */}
        <div className="flex-1 overflow-y-auto px-10 xl:px-16 py-10 pb-32 custom-scrollbar relative">
           <div className="max-w-[1240px] mx-auto">
              
              {/* Dashboard Header */}
              <div className="mb-10">
                 <div className="flex items-center justify-between mb-4">
                    <div>
                       <div className="flex items-center gap-2 text-[12px] font-extrabold text-gray-500 uppercase tracking-widest mb-4">
                          <span>Workspace</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                          <span className="text-gray-900">Productivity Analytics</span>
                       </div>
                       <h1 className="text-[34px] font-extrabold text-gray-900 tracking-tight leading-none mb-3">Team Performance Dashboard</h1>
                       <p className="text-[14px] text-gray-500 font-medium max-w-2xl leading-relaxed">Visualizing velocity, throughput, and workflow bottlenecks for the Engineering Pod A during Q3 Sprint 12.</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <div className="bg-[#f4f6f8] rounded-lg p-1 flex">
                          {['7D', '30D', 'ALL'].map((tab) => (
                            <button
                               key={tab}
                               onClick={() => setTimeRange(tab.toLowerCase())}
                               className={`px-4 py-1.5 rounded-md text-[11px] font-extrabold tracking-widest transition-all ${timeRange === tab.toLowerCase() ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                               {tab}
                            </button>
                          ))}
                       </div>
                       <button className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 shadow-sm text-gray-800 font-bold px-4 py-2 rounded-xl text-sm transition-all active:scale-95">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          Export Report
                       </button>
                    </div>
                 </div>
              </div>

              {/* KPI Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                 {/* Card 1 */}
                 <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0d6efd] flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                       <div className="bg-green-100 text-green-700 text-[10px] font-extrabold px-2 py-1 rounded-md tracking-widest">-12% vs last wk</div>
                    </div>
                    <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Cycle Time</h4>
                    <div className="flex items-baseline gap-1.5">
                       <span className="text-3xl font-extrabold tracking-tight text-gray-900">3.4</span>
                       <span className="text-sm font-bold text-gray-400">days</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1 rounded-full mt-6 overflow-hidden">
                       <div className="bg-[#0d6efd] h-full rounded-full w-[65%]"></div>
                    </div>
                 </div>
                 
                 {/* Card 2 */}
                 <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                       </div>
                       <div className="bg-red-100 text-red-600 text-[10px] font-extrabold px-2 py-1 rounded-md tracking-widest">+4% vs last wk</div>
                    </div>
                    <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Lead Time</h4>
                    <div className="flex items-baseline gap-1.5">
                       <span className="text-3xl font-extrabold tracking-tight text-gray-900">5.8</span>
                       <span className="text-sm font-bold text-gray-400">days</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1 rounded-full mt-6 overflow-hidden">
                       <div className="bg-gray-700 h-full rounded-full w-[75%]"></div>
                    </div>
                 </div>

                 {/* Card 3 */}
                 <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                       </div>
                       <div className="bg-gray-100 text-gray-600 text-[10px] font-extrabold px-2 py-1 rounded-md tracking-widest uppercase">Optimal</div>
                    </div>
                    <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Active Tasks</h4>
                    <div className="flex items-baseline gap-1.5">
                       <span className="text-3xl font-extrabold tracking-tight text-gray-900">24</span>
                       <span className="text-sm font-bold text-gray-400">tickets</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1 rounded-full mt-6 overflow-hidden flex">
                       <div className="bg-orange-500 h-full rounded-full w-[40%]"></div>
                       <div className="bg-blue-200 h-full rounded-full w-[30%]"></div>
                    </div>
                 </div>

                 {/* Card 4 */}
                 <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                       </div>
                       <div className="bg-green-100 text-green-700 text-[10px] font-extrabold px-2 py-1 rounded-md tracking-widest">+18% vs avg</div>
                    </div>
                    <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Throughput</h4>
                    <div className="flex items-baseline gap-1.5">
                       <span className="text-3xl font-extrabold tracking-tight text-gray-900">14.2</span>
                       <span className="text-sm font-bold text-gray-400">items/wk</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1 rounded-full mt-6 overflow-hidden">
                       <div className="bg-green-500 h-full rounded-full w-[85%]"></div>
                    </div>
                 </div>
              </div>

              {/* Middle Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 h-fit">
                 {/* Team Velocity Chart Mock */}
                 <div className="lg:col-span-2 bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100/50 flex flex-col min-h-[360px]">
                    <div className="flex justify-between items-start mb-10">
                       <div>
                          <h3 className="text-lg font-extrabold text-gray-900 mb-1">Team Velocity</h3>
                          <p className="text-[13px] text-gray-500 font-medium">Story points completed per sprint</p>
                       </div>
                       <div className="flex gap-4">
                          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#0d6efd]"></div><span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">ACTUAL</span></div>
                          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-100"></div><span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">PROJECTED</span></div>
                       </div>
                    </div>
                    {/* Fake Chart CSS illustration matching the design */}
                    <div className="flex-1 w-full relative flex flex-end justify-between items-end pb-8">
                       {/* Grid lines */}
                       <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none">
                          <div className="border-b border-gray-100 w-full col-span-full"></div>
                          <div className="border-b border-gray-100 w-full col-span-full"></div>
                          <div className="border-b border-gray-100 w-full col-span-full"></div>
                          <div className="border-b border-gray-100 w-full col-span-full"></div>
                       </div>
                       
                       {/* Line Chart dots and connects mock */}
                       <div className="absolute inset-0 pb-8 flex items-end">
                         {/* Using SVGs for simple line */}
                         <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            <path d="M 100,180 L 250,140 L 400,200 L 550,60" fill="none" stroke="#0d6efd" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                            <path d="M 550,60 L 700,50 L 850,90" fill="none" stroke="#bfdbfe" strokeWidth="3" strokeDasharray="6,6" vectorEffect="non-scaling-stroke" />
                            
                            <circle cx="100" cy="180" r="5" fill="#0d6efd" stroke="white" strokeWidth="2" />
                            <circle cx="250" cy="140" r="5" fill="#0d6efd" stroke="white" strokeWidth="2" />
                            <circle cx="400" cy="200" r="5" fill="#0d6efd" stroke="white" strokeWidth="2" />
                            <circle cx="550" cy="60" r="5" fill="#0d6efd" stroke="white" strokeWidth="2" />

                            <circle cx="700" cy="50" r="5" fill="#bfdbfe" stroke="white" strokeWidth="2" />
                            <circle cx="850" cy="90" r="5" fill="#bfdbfe" stroke="white" strokeWidth="2" />
                         </svg>
                       </div>

                       {/* X Axis labels */}
                       <div className="w-full absolute bottom-0 flex justify-between px-[5%] text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                          <span>S10</span>
                          <span>S11</span>
                          <span className="text-gray-800">S12 (Now)</span>
                          <span>S13</span>
                          <span>S14</span>
                          <span>S15</span>
                       </div>
                    </div>
                 </div>

                 {/* Bottleneck Map */}
                 <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100/50 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Bottleneck Map</h3>
                       <div className="w-5 h-5 rounded-full bg-gray-600 text-white flex justify-center items-center text-[10px] font-bold cursor-help">i</div>
                    </div>
                    
                    <div className="space-y-6">
                       <div>
                          <div className="flex justify-between items-end mb-2">
                             <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">To Do</span>
                             <span className="text-[12px] font-bold text-gray-800">1.2d avg</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                             <div className="bg-blue-200 h-full rounded-full w-[25%]"></div>
                          </div>
                       </div>
                       
                       <div>
                          <div className="flex justify-between items-end mb-2">
                             <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">In Progress</span>
                             <span className="text-[12px] font-bold text-gray-800">2.8d avg</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                             <div className="bg-blue-300 h-full rounded-full w-[60%]"></div>
                          </div>
                       </div>
                       
                       <div className="bg-red-50/50 p-3 -mx-3 rounded-xl border border-red-100/50">
                          <div className="flex justify-between items-end mb-2 px-1">
                             <span className="text-[11px] font-extrabold text-red-600 uppercase tracking-widest flex items-center gap-1">Code Review <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></span>
                             <span className="text-[12px] font-bold text-red-600">4.5d avg</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex mx-1 w-[auto]">
                             <div className="bg-red-500 h-full rounded-full w-[95%]"></div>
                          </div>
                          <p className="text-[10px] text-red-500 font-bold mt-2 ml-1">Significant delay detected here over last 48h.</p>
                       </div>
                       
                       <div>
                          <div className="flex justify-between items-end mb-2">
                             <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">QA</span>
                             <span className="text-[12px] font-bold text-gray-800">0.9d avg</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                             <div className="bg-blue-200 h-full rounded-full w-[15%]"></div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Throughput Bar Chart */}
                 <div className="lg:col-span-2 bg-[#f4f6f8] rounded-[1.5rem] p-8 min-h-[300px] flex flex-col">
                    <div className="mb-8">
                       <h3 className="text-lg font-extrabold text-gray-900 mb-1">Throughput Trend</h3>
                       <p className="text-[13px] text-gray-500 font-medium">Completed items per day over the last 14 days</p>
                    </div>
                    {/* Bar Chart Mocking */}
                    <div className="flex-1 w-full flex items-end gap-[1%] justify-between pb-6 relative pt-4">
                       {[0.3, 0.4, 0.2, 0.5, 0.6, 0.4, 0.8, 1, 0.7, 0.9, 0.6, 0.85, 1.05, 0.7].map((h, i) => (
                           <div key={i} className="w-full relative group h-full flex items-end">
                              <div className="w-full bg-[#0d6efd] rounded-t-sm hover:opacity-80 transition-opacity" style={{ height: `${Math.min(h * 80, 100)}%`, backgroundColor: i >= 11 ? '#0d6efd' : '#8ab4f8' }}></div>
                           </div>
                       ))}
                       <div className="absolute w-full bottom-0 flex justify-between text-[9px] font-extrabold text-gray-400 tracking-widest uppercase">
                          <span>Day 1</span>
                          <span>Day 7</span>
                          <span>Today</span>
                       </div>
                    </div>
                 </div>

                 {/* Insights Column */}
                 <div className="flex flex-col gap-6">
                    <div className="flex gap-6">
                       <div className="flex-1 bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100/50">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0d6efd] flex items-center justify-center mb-6">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div className="text-2xl font-extrabold text-gray-900 tracking-tight">84%</div>
                          <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mt-1 mb-2">Flow Efficiency</div>
                          <div className="text-[10px] font-bold text-green-500">+5% from last sprint</div>
                       </div>
                       <div className="flex-1 bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100/50">
                          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center mb-6">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div className="text-2xl font-extrabold text-gray-900 tracking-tight">3.2</div>
                          <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mt-1 mb-2">WIP Age (Days)</div>
                          <div className="text-[10px] font-bold text-red-500">Slightly high</div>
                       </div>
                    </div>

                    <div className="flex-1 bg-[#0d6efd] rounded-[1.5rem] p-6 shadow-lg shadow-blue-500/20 text-white flex flex-col justify-between">
                       <div>
                          <div className="flex items-center gap-2 mb-4">
                             <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                             <span className="text-[11px] font-extrabold tracking-widest uppercase">AI Observation</span>
                          </div>
                          <p className="text-[14px] font-medium leading-relaxed opacity-90">Your team is finishing tasks faster, but code reviews are creating a queue. Consider dedicated review sessions on Wednesdays to balance flow.</p>
                       </div>
                       <button className="self-start mt-6 bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
                          Apply Strategy
                       </button>
                    </div>
                 </div>
              </div>

           </div>
        </div>

      </main>
    </div>
  );
}
