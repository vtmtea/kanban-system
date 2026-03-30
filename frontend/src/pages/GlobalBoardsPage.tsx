import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function GlobalBoardsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Sidebar Icons
          
  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-gray-800">
      {/* Sidebar */}
      <Sidebar activePage="boards" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#fdfdfd] md:rounded-tl-[2.5rem] md:rounded-bl-[2.5rem] border-y border-l border-gray-100/80 shadow-[-8px_0_32px_rgba(0,0,0,0.02)] isolate">
        
        {/* Top Navbar */}
        <TopNav title="Active Boards" />

        {/* Board List Content */}
        <div className="flex-1 overflow-y-auto w-full pb-32 xl:flex xl:justify-center bg-[#fdfdfd] custom-scrollbar">
           <div className="w-full max-w-[1240px] px-8 py-10 md:px-12 animate-slide-up-fade stagger-delay-1 relative relative">
              
              {/* Header */}
              <div className="flex justify-between items-end mb-10">
                 <div>
                    <h4 className="text-[11px] font-extrabold text-[#0d6efd] uppercase tracking-widest mb-2">Workspace Hub</h4>
                    <h1 className="text-[34px] font-extrabold text-gray-900 tracking-tight leading-none">Active Boards</h1>
                 </div>
                 <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-gray-100/80 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                       Filter
                    </button>
                    <button className="flex items-center gap-2 bg-[#0d6efd] hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-md">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                       Create New Board
                    </button>
                 </div>
              </div>

              {/* Grid Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up-fade stagger-delay-2">
                 
                 {/* Card 1: Mobile App Redesign */}
                 <Link to="/boards/1" className="bg-white rounded-[1.5rem] p-7 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between min-h-[260px]">
                    <div>
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-[#0d6efd] group-hover:scale-110 group-hover:bg-[#0d6efd] group-hover:text-white transition-all duration-300">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          </div>
                          <button className="text-gray-400 hover:text-gray-800 transition-colors pointer-events-auto">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                          </button>
                       </div>
                       <h3 className="text-[18px] font-bold text-gray-900 mb-2 leading-tight">Mobile App Redesign</h3>
                       <p className="text-[13px] text-gray-500 leading-relaxed mb-6">Revamping the core UX/UI for the flagship iOS and Android applications.</p>
                       <div className="mb-6">
                          <div className="flex justify-between items-end mb-2">
                             <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Velocity</span>
                             <span className="text-[11px] font-bold text-[#0d6efd] uppercase tracking-wider">68% Complete</span>
                          </div>
                          <div className="w-full bg-[#f0f5ff] h-2 rounded-full overflow-hidden">
                             <div className="bg-[#0d6efd] h-full rounded-full group-hover:opacity-80" style={{ width: '68%' }}></div>
                          </div>
                       </div>
                    </div>
                    <div className="flex justify-between items-center">
                       <div className="flex -space-x-2">
                          <img src="https://i.pravatar.cc/150?img=11" className="w-7 h-7 rounded-full border-2 border-white" alt="v1"/>
                          <img src="https://i.pravatar.cc/150?img=53" className="w-7 h-7 rounded-full border-2 border-white" alt="v2"/>
                          <img src="https://i.pravatar.cc/150?img=9" className="w-7 h-7 rounded-full border-2 border-white" alt="v3"/>
                          <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-600">+4</div>
                       </div>
                       <div className="bg-[#e0e7ff] text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          12 Tasks Active
                       </div>
                    </div>
                 </Link>

                 {/* Card 2: Q4 Marketing Campaign */}
                 <Link to="/boards/2" className="bg-white rounded-[1.5rem] p-7 shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-200 hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between min-h-[260px]">
                    <div>
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-[#ea580c] group-hover:scale-110 group-hover:bg-[#ea580c] group-hover:text-white transition-all duration-300">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                          </div>
                          <button className="text-gray-400 hover:text-gray-800 transition-colors pointer-events-auto">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                          </button>
                       </div>
                       <h3 className="text-[18px] font-bold text-gray-900 mb-2 leading-tight">Q4 Marketing Campaign</h3>
                       <p className="text-[13px] text-gray-500 leading-relaxed mb-6">Integrated product launch strategy across social, email, and paid media...</p>
                       <div className="mb-6">
                          <div className="flex justify-between items-end mb-2">
                             <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Active Spend</span>
                             <span className="text-[11px] font-bold text-[#ea580c] uppercase tracking-wider">Urgent Priority</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                             <div className="bg-[#cc4b02] h-full rounded-full group-hover:opacity-80" style={{ width: '82%' }}></div>
                          </div>
                       </div>
                    </div>
                    <div className="flex justify-between items-center">
                       <div className="flex -space-x-2">
                          <img src="https://i.pravatar.cc/150?img=12" className="w-7 h-7 rounded-full border-2 border-white" alt="v1"/>
                          <img src="https://i.pravatar.cc/150?img=4" className="w-7 h-7 rounded-full border-2 border-white" alt="v2"/>
                          <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-600">+2</div>
                       </div>
                       <div className="bg-[#ea580c] text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-md">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          4 Critical
                       </div>
                    </div>
                 </Link>

                 {/* Card 3: API Infrastructure */}
                 <Link to="/boards/3" className="bg-white rounded-[1.5rem] p-7 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-300 hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between min-h-[260px]">
                    <div>
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:scale-110 group-hover:bg-slate-800 group-hover:text-white transition-all duration-300">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                          </div>
                          <button className="text-gray-400 hover:text-gray-800 transition-colors pointer-events-auto">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                          </button>
                       </div>
                       <h3 className="text-[18px] font-bold text-gray-900 mb-2 leading-tight">API Infrastructure</h3>
                       <p className="text-[13px] text-gray-500 leading-relaxed mb-6">Migrating legacy endpoints to a modern GraphQL architecture with...</p>
                       <div className="mb-6">
                          <div className="flex justify-between items-end mb-2">
                             <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Backend Load</span>
                             <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">On Track</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                             <div className="bg-slate-600 h-full rounded-full group-hover:opacity-80" style={{ width: '35%' }}></div>
                          </div>
                       </div>
                    </div>
                    <div className="flex justify-between items-center">
                       <div className="flex -space-x-2">
                          <img src="https://i.pravatar.cc/150?img=53" className="w-7 h-7 rounded-full border-2 border-white" alt="v1"/>
                          <img src="https://i.pravatar.cc/150?img=11" className="w-7 h-7 rounded-full border-2 border-white" alt="v2"/>
                       </div>
                       <div className="bg-[#f0f5ff] text-[#0d6efd] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                          8 Tasks
                       </div>
                    </div>
                 </Link>

                 {/* Card 4: Design System Documentation (Wide 2-col span) */}
                 <Link to="/boards/4" className="md:col-span-2 bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-green-200 hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-300 shrink-0">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                          </div>
                          <div>
                             <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-none">Enterprise Tier</span>
                             <h3 className="text-[22px] font-bold text-gray-900 mt-0.5 leading-tight">Design System Documentation</h3>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-end">
                       <div className="flex-1">
                          <p className="text-[14px] text-gray-500 leading-relaxed mb-8 max-w-[90%]">Centralizing all typography, color, and component guidelines for the global engineering team.</p>
                          <div className="flex gap-4">
                             <div className="bg-[#f8fafc] px-6 py-4 rounded-xl flex-1 border border-gray-100 group-hover:border-blue-100 transition-colors">
                                <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Weekly Velocity</div>
                                <div className="text-[20px] font-bold text-[#0d6efd] flex items-center gap-2">
                                   +24% <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                </div>
                             </div>
                             <div className="bg-[#f8fafc] px-6 py-4 rounded-xl flex-1 border border-gray-100 group-hover:border-green-100 transition-colors">
                                <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Review Cycle</div>
                                <div className="text-[20px] font-bold text-gray-900 flex items-center gap-2">
                                   1.2d <span className="text-[10px] font-bold text-green-500 uppercase">Excellent</span>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       <div className="w-full md:w-64 bg-[#eef2f6] rounded-2xl p-6 h-[140px] flex flex-col relative items-center justify-center group-hover:bg-[#e6eef5] transition-colors overflow-hidden">
                          <div className="absolute top-4 flex flex-col items-center">
                             <svg className="w-6 h-6 text-gray-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                             <div className="text-[10px] font-extrabold text-gray-700 uppercase tracking-widest text-center">Active Sparkline</div>
                          </div>
                          
                          <div className="absolute bottom-0 w-full flex items-end justify-center gap-1.5 px-4 h-12">
                             {[30, 45, 60, 100, 80, 50, 35].map((h, i) => (
                                <div key={i} className={`w-full rounded-t-sm transition-all duration-500 ${h === 100 ? 'bg-[#0d6efd]' : 'bg-[#a5c8ff]'}`} style={{ height: `${h}%` }}></div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </Link>

                 {/* Card 5: Start New Project */}
                 <div className="bg-[#fcfcfd] rounded-[1.5rem] border-2 border-dashed border-gray-200 hover:border-[#0d6efd] hover:bg-blue-50/20 p-8 flex flex-col items-center justify-center min-h-[260px] cursor-pointer group transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#0d6efd] group-hover:text-white transition-all shadow-sm">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <h3 className="text-[16px] font-bold text-gray-900 mb-2">Start New Project</h3>
                    <p className="text-[12px] text-gray-400 font-medium text-center">Clone from templates or start blank</p>
                 </div>

              </div>

           </div>
        </div>

        {/* Floating Action Button (Lightning Quick Action) */}
        <button className="absolute bottom-8 right-8 bg-[#0d6efd] text-white px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-blue-500/50 hover:bg-blue-700 transition-all duration-300 z-50">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
            <span className="font-bold text-sm">Quick Action</span>
        </button>

      </main>
    </div>
  );
}
