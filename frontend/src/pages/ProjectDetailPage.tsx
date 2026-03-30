import { Link } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';

export function ProjectDetailPage() {
  // Sidebar Icons
          
  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-gray-800">
      {/* Sidebar copied from BoardListPage */}
      <Sidebar activePage="projects" />

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#fdfdfd] md:rounded-tl-[2.5rem] md:rounded-bl-[2.5rem] border-y border-l border-gray-100/80 shadow-[-8px_0_32px_rgba(0,0,0,0.02)] isolate">
        
        {/* Top Navbar */}
        <TopNav title="Project Details" />

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto w-full pb-32 xl:flex xl:justify-center bg-[#fdfdfd] relative custom-scrollbar">
           
           {/* Abstract minimal background elements for SaaS feel */}
           <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-gradient-to-br from-blue-50/50 to-transparent blur-3xl rounded-full pointer-events-none -z-10"></div>
           
           <div className="w-full max-w-[1240px] p-8 md:p-12 animate-slide-up-fade stagger-delay-1">
              
              {/* Project Title Header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
                 <div>
                    <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#0d6efd] uppercase tracking-widest mb-4">
                       <span className="text-gray-500 hover:text-gray-800 cursor-pointer transition-colors">Projects</span>
                       <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                       <span>Current Sprint</span>
                    </div>
                    <h1 className="text-[36px] font-extrabold text-gray-900 tracking-tight leading-none mb-4">Q4 Brand Evolution</h1>
                    <p className="text-[14px] text-gray-500 font-medium max-w-2xl leading-relaxed">Comprehensive visual identity refresh and multi-channel marketing rollout for the upcoming fiscal year.</p>
                 </div>
                 
                 <div className="flex items-center gap-3 shrink-0">
                    <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm focus:outline-none">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                       Share
                    </button>
                    <button className="flex items-center gap-2 bg-[#0d6efd] hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                       New Board
                    </button>
                 </div>
              </div>

              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 animate-slide-up-fade stagger-delay-2">
                 
                 {/* Overall Completion Card */}
                 <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute right-0 top-12 opacity-10 group-hover:opacity-20 transition-opacity">
                      <svg width="200" height="100" viewBox="0 0 200 100" fill="none">
                         <path d="M0 80 L 50 20 L 100 60 L 180 10 M 180 10 L 195 25 M 180 10 L 165 10" stroke="#000" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex justify-between items-start mb-6">
                       <h3 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Overall Completion</h3>
                       <div className="text-right">
                          <h3 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Time Remaining</h3>
                       </div>
                    </div>
                    <div className="flex justify-between items-end mb-8 relative z-10">
                       <div className="flex items-baseline gap-3">
                          <span className="text-[48px] font-extrabold text-gray-900 leading-none tracking-tighter">84%</span>
                          <span className="text-[12px] font-bold text-[#0d6efd] flex items-center gap-1">
                             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                             +12% this week
                          </span>
                       </div>
                       <div className="flex items-baseline gap-1.5 pb-1">
                          <span className="text-[32px] font-extrabold text-[#d97706] leading-none tracking-tight">12</span>
                          <span className="text-[12px] font-extrabold text-gray-500 uppercase tracking-widest">Days Left</span>
                       </div>
                    </div>
                    
                    <div className="w-full bg-[#f1f5f9] h-3 rounded-full overflow-hidden relative mb-3">
                       <div className="bg-[#0d6efd] h-full rounded-full transition-all duration-1000 ease-out" style={{ width: '84%' }}></div>
                    </div>
                    
                    <div className="flex justify-between text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                       <span>Kickoff (Oct 1)</span>
                       <span>Launch (Dec 22)</span>
                    </div>
                 </div>

                 {/* Budget Utilization Card */}
                 <div className="bg-[#f8fafc] rounded-[1.5rem] p-8 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
                    <h3 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-6">Budget Utilization</h3>
                    <div className="flex justify-between items-end mb-8">
                       <div className="flex items-baseline gap-2">
                          <span className="text-[44px] font-extrabold text-gray-900 leading-none tracking-tighter">$42,500</span>
                       </div>
                       <div className="pb-2">
                          <span className="text-[12px] font-extrabold text-gray-500 uppercase tracking-widest">of $50k total</span>
                       </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-8 relative">
                       <div className="bg-gray-800 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: '85%' }}></div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-4 shadow-sm">
                       <div className="mt-0.5 text-[#d97706]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                       </div>
                       <p className="text-[12px] leading-relaxed font-medium text-gray-600">
                          Marketing spend is tracking <span className="font-bold text-[#d97706]">12% above</span> initial estimates for Q4.
                       </p>
                    </div>
                 </div>

              </div>

              {/* Main Two-Column Layout */}
              <div className="flex flex-col lg:flex-row gap-8 mb-12 animate-slide-up-fade stagger-delay-3">
                 
                 {/* Left Column: Team */}
                 <div className="lg:w-72 shrink-0">
                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 h-full max-h-[460px]">
                       <div className="flex justify-between items-end mb-8">
                          <h3 className="text-[16px] font-extrabold text-gray-900 tracking-tight">Core Team</h3>
                          <a href="#" className="text-[12px] font-extrabold text-[#0d6efd] hover:text-blue-700 transition-colors">Manage</a>
                       </div>
                       
                       <div className="space-y-6 mb-8">
                          <div className="flex items-center justify-between group cursor-pointer">
                             <div className="flex items-center gap-3">
                                <img src="https://i.pravatar.cc/150?img=11" className="w-10 h-10 rounded-full border border-gray-100 object-cover" alt="Alex"/>
                                <div>
                                   <h4 className="text-[14px] font-bold text-gray-900 group-hover:text-[#0d6efd] transition-colors leading-tight">Alex Morgan</h4>
                                   <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-0.5">Project Lead</p>
                                </div>
                             </div>
                             <div className="w-2 h-2 rounded-full bg-green-500 ring-4 ring-green-50"></div>
                          </div>
                          
                          <div className="flex items-center justify-between group cursor-pointer">
                             <div className="flex items-center gap-3">
                                <img src="https://i.pravatar.cc/150?img=53" className="w-10 h-10 rounded-full border border-gray-100 object-cover" alt="James"/>
                                <div>
                                   <h4 className="text-[14px] font-bold text-gray-900 group-hover:text-[#0d6efd] transition-colors leading-tight">James Dalton</h4>
                                   <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-0.5">Visual Design</p>
                                </div>
                             </div>
                             <div className="w-2 h-2 rounded-full bg-green-500 ring-4 ring-green-50"></div>
                          </div>

                          <div className="flex items-center justify-between group cursor-pointer">
                             <div className="flex items-center gap-3">
                                <img src="https://i.pravatar.cc/150?img=9" className="w-10 h-10 rounded-full border border-gray-100 object-cover" alt="Sarah"/>
                                <div>
                                   <h4 className="text-[14px] font-bold text-gray-900 group-hover:text-[#0d6efd] transition-colors leading-tight">Sarah K.</h4>
                                   <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-0.5">Marketing</p>
                                </div>
                             </div>
                             <div className="w-2 h-2 rounded-full bg-gray-300 ring-4 ring-gray-100"></div>
                          </div>
                       </div>
                       
                       <button className="w-full border-2 border-dashed border-gray-300 hover:border-[#0d6efd] hover:bg-blue-50/50 text-gray-500 hover:text-[#0d6efd] font-extrabold text-[11px] uppercase tracking-widest py-3 rounded-xl transition-all">
                          + Invite Member
                       </button>
                    </div>
                 </div>

                 {/* Right Area: Boards Grid */}
                 <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       
                       {/* Board Card 1 */}
                       <Link to="/boards/1" className="bg-white rounded-[1.5rem] p-7 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group flex flex-col min-h-[220px]">
                          <div className="flex justify-between items-start mb-6">
                             <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-[#0d6efd] group-hover:scale-110 group-hover:bg-[#0d6efd] group-hover:text-white transition-all duration-300">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                             </div>
                             <span className="bg-[#f0f5ff] text-[#0d6efd] text-[10px] font-extrabold px-2.5 py-1 rounded uppercase tracking-widest">8 Tasks</span>
                          </div>
                          <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-tight">Visual Design</h3>
                          <p className="text-[13px] text-gray-500 leading-relaxed max-w-[90%] mb-6 flex-1">Logo variants, color palette, and typography guide.</p>
                          <div className="flex -space-x-2 mt-auto">
                             <img src="https://i.pravatar.cc/150?img=53" className="w-7 h-7 rounded-full border-2 border-white" alt="Avatar"/>
                             <img src="https://i.pravatar.cc/150?img=11" className="w-7 h-7 rounded-full border-2 border-white" alt="Avatar"/>
                             <div className="w-7 h-7 rounded-full border-2 border-white bg-[#0d6efd] text-white flex items-center justify-center text-[9px] font-bold">+2</div>
                          </div>
                       </Link>

                       {/* Board Card 2 */}
                       <Link to="/boards/2" className="bg-white rounded-[1.5rem] p-7 shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-200 hover:-translate-y-1 transition-all duration-300 group flex flex-col min-h-[220px]">
                          <div className="flex justify-between items-start mb-6">
                             <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-[#ea580c] group-hover:scale-110 group-hover:bg-[#ea580c] group-hover:text-white transition-all duration-300">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                             </div>
                             <span className="bg-gray-100 text-gray-600 text-[10px] font-extrabold px-2.5 py-1 rounded uppercase tracking-widest">14 Tasks</span>
                          </div>
                          <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-tight">Marketing Strategy</h3>
                          <p className="text-[13px] text-gray-500 leading-relaxed max-w-[90%] mb-6 flex-1">Social media rollout and influencer partnerships.</p>
                          <div className="flex -space-x-2 mt-auto">
                             <img src="https://i.pravatar.cc/150?img=9" className="w-7 h-7 rounded-full border-2 border-white" alt="Avatar"/>
                             <img src="https://i.pravatar.cc/150?img=11" className="w-7 h-7 rounded-full border-2 border-white" alt="Avatar"/>
                          </div>
                       </Link>

                       {/* Board Card 3 */}
                       <Link to="/boards/3" className="bg-white rounded-[1.5rem] p-7 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group flex flex-col min-h-[220px]">
                          <div className="flex justify-between items-start mb-6">
                             <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:scale-110 group-hover:bg-slate-800 group-hover:text-white transition-all duration-300">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                             </div>
                             <span className="bg-blue-50 text-[#0d6efd] text-[10px] font-extrabold px-2.5 py-1 rounded uppercase tracking-widest">3 Tasks</span>
                          </div>
                          <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-tight">Assets & Press</h3>
                          <p className="text-[13px] text-gray-500 leading-relaxed max-w-[90%] mb-6 flex-1">Press release kits and high-res asset library.</p>
                          <div className="flex -space-x-2 mt-auto">
                             <img src="https://i.pravatar.cc/150?img=53" className="w-7 h-7 rounded-full border-2 border-white" alt="Avatar"/>
                          </div>
                       </Link>

                       {/* Add New Board Card */}
                       <div className="bg-[#fcfdfd] rounded-[1.5rem] p-7 border-2 border-dashed border-gray-200 hover:border-[#0d6efd] hover:bg-blue-50/30 flex flex-col items-center justify-center min-h-[220px] transition-all duration-300 cursor-pointer group">
                          <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 group-hover:bg-[#0d6efd] group-hover:text-white flex items-center justify-center mb-4 transition-colors">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          </div>
                          <h3 className="text-[14px] font-bold text-gray-500 group-hover:text-[#0d6efd] transition-colors">Add New Board</h3>
                       </div>

                    </div>
                 </div>
              </div>

              {/* Bottom Project Activity Log */}
              <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-8 mb-12 animate-slide-up-fade stagger-delay-4 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-white via-white to-transparent z-10 pointer-events-none"></div>
                 <div className="flex justify-between items-center mb-8 relative z-20">
                    <h3 className="text-[16px] font-extrabold text-gray-900 tracking-tight">Project Activity</h3>
                    <a href="#" className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#0d6efd] uppercase tracking-widest hover:text-blue-700 transition-colors">
                       View Full Log 
                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                 </div>
                 
                 <div className="space-y-6 relative z-10">
                    {/* Activity Item 1 */}
                    <div className="flex gap-4 group">
                       <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0d6efd] shrink-0 mt-0.5 group-hover:bg-[#0d6efd] group-hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                       </div>
                       <div>
                          <p className="text-[14px] text-gray-800 font-medium">
                             <span className="font-bold text-gray-900">James Dalton</span> completed <span className="font-bold text-gray-900 cursor-pointer hover:text-[#0d6efd]">Color Palette Finalization</span>
                          </p>
                          <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-1">
                             Visual Design • 2 Hours Ago
                          </div>
                       </div>
                    </div>

                    {/* Activity Item 2 */}
                    <div className="flex gap-4 group">
                       <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-[#ea580c] shrink-0 mt-0.5 group-hover:bg-[#ea580c] group-hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                       </div>
                       <div>
                          <p className="text-[14px] text-gray-800 font-medium">
                             <span className="font-bold text-gray-900">Alex Morgan</span> commented on <span className="font-bold text-gray-900 cursor-pointer hover:text-[#0d6efd]">Social Media Rollout</span>
                          </p>
                          <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-1">
                             Marketing Strategy • 5 Hours Ago
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

           </div>
        </div>

        {/* Floating Action Button (Lightning) */}
        <button className="absolute bottom-8 right-8 w-14 h-14 bg-[#0d6efd] text-white rounded-2xl flex items-center justify-center shadow-lg hover:shadow-blue-500/50 hover:scale-110 hover:-translate-y-1 transition-all duration-300 z-50 animate-[pulse_3s_infinite]">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
        </button>

      </main>
    </div>
  );
}
