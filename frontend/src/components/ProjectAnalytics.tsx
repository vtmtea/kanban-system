import { useState } from 'react';

export function ProjectAnalytics({ boardTitle }: { boardTitle?: string }) {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="flex-1 overflow-y-auto px-10 xl:px-16 py-10 pb-32 custom-scrollbar relative bg-[#fcfcfc]">
       <div className="max-w-[1240px] mx-auto">
          
          {/* Dashboard Header */}
          <div className="mb-10 animate-slide-up-fade">
             <div className="flex items-center justify-between mb-4">
                <div>
                   <div className="flex items-center gap-2 text-[12px] font-extrabold text-gray-500 uppercase tracking-widest mb-4">
                      <span className="hover:text-gray-800 cursor-pointer">Projects</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      <span className="hover:text-gray-800 cursor-pointer">{boardTitle || 'Project Alpha'}</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      <span className="text-gray-900">Analytics</span>
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
             <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow relative overflow-hidden group animate-slide-up-fade stagger-delay-1">
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
                   <div className="bg-[#0d6efd] h-full rounded-full w-[65%] group-hover:scale-x-105 origin-left transition-transform"></div>
                </div>
             </div>
             
             {/* Card 2 */}
             <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow relative overflow-hidden group animate-slide-up-fade stagger-delay-2">
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
                   <div className="bg-gray-700 h-full rounded-full w-[75%] group-hover:scale-x-105 origin-left transition-transform"></div>
                </div>
             </div>

             {/* Card 3 */}
             <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow relative overflow-hidden group animate-slide-up-fade stagger-delay-3">
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
                   <div className="bg-orange-500 h-full rounded-full w-[40%] group-hover:-translate-x-1 transition-transform"></div>
                   <div className="bg-blue-200 h-full rounded-full w-[30%] group-hover:translate-x-1 transition-transform"></div>
                </div>
             </div>

             {/* Card 4 */}
             <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow relative overflow-hidden group animate-slide-up-fade stagger-delay-4">
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
                   <div className="bg-green-500 h-full rounded-full w-[85%] group-hover:scale-x-105 origin-left transition-transform"></div>
                </div>
             </div>
          </div>

          {/* Middle Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 h-fit animate-slide-up-fade stagger-delay-5">
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
                     <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <path d="M 100,180 L 250,140 L 400,200 L 550,60" fill="none" stroke="#0d6efd" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                        <path d="M 550,60 L 700,50 L 850,90" fill="none" stroke="#bfdbfe" strokeWidth="3" strokeDasharray="6,6" vectorEffect="non-scaling-stroke" />
                        
                        <circle cx="100" cy="180" r="5" fill="#0d6efd" stroke="white" strokeWidth="2" className="hover:r-7 transition-all" />
                        <circle cx="250" cy="140" r="5" fill="#0d6efd" stroke="white" strokeWidth="2" className="hover:r-7 transition-all" />
                        <circle cx="400" cy="200" r="5" fill="#0d6efd" stroke="white" strokeWidth="2" className="hover:r-7 transition-all" />
                        <circle cx="550" cy="60" r="5" fill="#0d6efd" stroke="white" strokeWidth="2" className="hover:r-7 transition-all" />

                        <circle cx="700" cy="50" r="5" fill="#bfdbfe" stroke="white" strokeWidth="2" className="hover:r-7 transition-all" />
                        <circle cx="850" cy="90" r="5" fill="#bfdbfe" stroke="white" strokeWidth="2" className="hover:r-7 transition-all" />
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
                   <div className="w-5 h-5 rounded-full bg-gray-600 text-white flex justify-center items-center text-[10px] font-bold cursor-help hover:bg-gray-800 transition-colors">i</div>
                </div>
                
                <div className="space-y-6">
                   <div className="group cursor-pointer">
                      <div className="flex justify-between items-end mb-2">
                         <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">To Do</span>
                         <span className="text-[12px] font-bold text-gray-800">1.2d avg</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                         <div className="bg-blue-200 h-full rounded-full w-[25%] group-hover:bg-blue-300 transition-colors"></div>
                      </div>
                   </div>
                   
                   <div className="group cursor-pointer">
                      <div className="flex justify-between items-end mb-2">
                         <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">In Progress</span>
                         <span className="text-[12px] font-bold text-gray-800">2.8d avg</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                         <div className="bg-blue-300 h-full rounded-full w-[60%] group-hover:bg-blue-400 transition-colors"></div>
                      </div>
                   </div>
                   
                   <div className="bg-red-50/50 p-3 -mx-3 rounded-xl border border-red-100/50 group cursor-pointer hover:bg-red-50 transition-colors">
                      <div className="flex justify-between items-end mb-2 px-1">
                         <span className="text-[11px] font-extrabold text-red-600 uppercase tracking-widest flex items-center gap-1 group-hover:text-red-700 transition-colors">Code Review <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></span>
                         <span className="text-[12px] font-bold text-red-600">4.5d avg</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex mx-1 w-[auto]">
                         <div className="bg-red-500 h-full rounded-full w-[95%] group-hover:bg-red-600 transition-colors"></div>
                      </div>
                      <p className="text-[10px] text-red-500 font-bold mt-2 ml-1">Significant delay detected here over last 48h.</p>
                   </div>
                   
                   <div className="group cursor-pointer">
                      <div className="flex justify-between items-end mb-2">
                         <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest group-hover:text-gray-800 transition-colors">QA</span>
                         <span className="text-[12px] font-bold text-gray-800">0.9d avg</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                         <div className="bg-blue-200 h-full rounded-full w-[15%] group-hover:bg-blue-300 transition-colors"></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up-fade stagger-delay-6">
             {/* Throughput Bar Chart */}
             <div className="lg:col-span-2 bg-[#f4f6f8] rounded-[1.5rem] p-8 min-h-[300px] flex flex-col hover:bg-gray-100/80 transition-colors cursor-crosshair">
                <div className="mb-8">
                   <h3 className="text-lg font-extrabold text-gray-900 mb-1">Throughput Trend</h3>
                   <p className="text-[13px] text-gray-500 font-medium">Completed items per day over the last 14 days</p>
                </div>
                <div className="flex-1 w-full flex items-end gap-[1.5%] justify-between pb-6 relative pt-4">
                   {[0.3, 0.4, 0.2, 0.5, 0.6, 0.4, 0.8, 1, 0.7, 0.9, 0.6, 0.85, 1.05, 0.5].map((h, i) => (
                       <div key={i} className="w-full relative group h-full flex items-end">
                          <div className="w-full bg-[#0d6efd] rounded-t hover:bg-blue-700 transition-colors cursor-pointer" style={{ height: `${Math.min(h * 80, 100)}%`, backgroundColor: i >= 11 ? '#0d6efd' : '#8ab4f8' }}></div>
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
                   <div className="flex-1 bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0d6efd] flex items-center justify-center mb-6">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div className="text-2xl font-extrabold text-gray-900 tracking-tight">84%</div>
                      <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mt-1 mb-2">Flow Efficiency</div>
                      <div className="text-[10px] font-bold text-green-500">+5% from last sprint</div>
                   </div>
                   <div className="flex-1 bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center mb-6">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div className="text-2xl font-extrabold text-gray-900 tracking-tight">3.2</div>
                      <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mt-1 mb-2">WIP Age (Days)</div>
                      <div className="text-[10px] font-bold text-red-500">Slightly high</div>
                   </div>
                </div>

                <div className="flex-1 bg-[#0d6efd] rounded-[1.5rem] p-6 shadow-lg shadow-blue-500/20 text-white flex flex-col justify-between group hover:shadow-blue-500/40 transition-shadow">
                   <div>
                      <div className="flex items-center gap-2 mb-4">
                         <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                         <span className="text-[11px] font-extrabold tracking-widest uppercase">AI Observation</span>
                      </div>
                      <p className="text-[14px] font-medium leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity">Your team is finishing tasks faster, but code reviews are creating a queue. Consider dedicated review sessions on Wednesdays to balance flow.</p>
                   </div>
                   <button className="self-start mt-6 bg-white/10 hover:bg-white text-white hover:text-[#0d6efd] font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
                      Apply Strategy
                   </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
