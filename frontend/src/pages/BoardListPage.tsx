import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { boardApi } from '@/services/api';
import { CreateBoardModal } from '@/components/CreateBoardModal';
import type { Board } from '@/types';

export function BoardListPage() {
  const { user, logout } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: boards, isLoading, error } = useQuery({
    queryKey: ['boards'],
    queryFn: () => boardApi.getAll(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">加载失败</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">看板工作流系统</h1>
          <div className="flex items-center gap-4">
            <span>{user?.nickname || user?.username}</span>
            <button
              onClick={logout}
              className="bg-white/20 px-4 py-1.5 rounded-lg hover:bg-white/30 transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">我的看板</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards?.data?.map((board: Board) => (
            <Link
              key={board.id}
              to={`/boards/${board.id}`}
              className="group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              <div
                className="h-24 relative"
                style={{ backgroundColor: board.color || '#3B82F6' }}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {board.title}
                </h3>
                {board.description && (
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{board.description}</p>
                )}
              </div>
            </Link>
          ))}

          {/* Create new board card */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-white/50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center min-h-[160px] hover:border-indigo-400 hover:bg-white transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center mb-2 transition-colors">
              <svg className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-gray-500 group-hover:text-indigo-600 font-medium transition-colors">
              创建新看板
            </span>
          </button>
        </div>
      </main>

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}