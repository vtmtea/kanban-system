import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { boardApi } from '@/services/api';
import type { Board } from '@/types';

export function BoardListPage() {
  const { user, logout } = useAuth();
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
      <header className="bg-primary-600 text-white p-4 shadow">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">看板工作流系统</h1>
          <div className="flex items-center gap-4">
            <span>{user?.nickname || user?.username}</span>
            <button
              onClick={logout}
              className="bg-primary-700 px-3 py-1 rounded hover:bg-primary-800"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">我的看板</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards?.data?.map((board: Board) => (
            <Link
              key={board.id}
              to={`/boards/${board.id}`}
              className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div
                className="h-2 rounded-t mb-3"
                style={{ backgroundColor: board.color || '#3b82f6' }}
              />
              <h3 className="font-bold text-lg">{board.title}</h3>
              {board.description && (
                <p className="text-gray-600 text-sm mt-1">{board.description}</p>
              )}
            </Link>
          ))}

          {/* Create new board placeholder */}
          <div
            className="bg-gray-200 p-4 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-300"
            onClick={() => {
              // TODO: Open create board modal
              alert('创建看板功能待实现');
            }}
          >
            <span className="text-gray-600">+ 创建新看板</span>
          </div>
        </div>
      </main>
    </div>
  );
}