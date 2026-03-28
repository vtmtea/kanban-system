import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { boardApi } from '@/services/api';
import type { Activity } from '@/types';

interface ActivitySidebarProps {
  boardId: number;
  onClose: () => void;
}

export function ActivitySidebar({ boardId, onClose }: ActivitySidebarProps) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<{ entity_type?: string; action?: string }>({});

  const { data: activities, isLoading } = useQuery({
    queryKey: ['board', boardId, 'activities', page, filter],
    queryFn: () => boardApi.getActivities(boardId, { page, limit: 20, ...filter }),
  });

  const activityList = activities?.data?.data || [];
  const total = activities?.data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const getActionText = (activity: Activity) => {
    const userName = activity.user?.nickname || activity.user?.username || '用户';
    switch (activity.action) {
      case 'created':
        return `${userName} 创建了${activity.entity_type === 'card' ? '卡片' : activity.entity_type}`;
      case 'updated':
        return `${userName} 更新了${activity.entity_type === 'card' ? '卡片' : activity.entity_type}`;
      case 'moved':
        return `${userName} 移动了卡片`;
      case 'deleted':
        return `${userName} 删除了${activity.entity_type === 'card' ? '卡片' : activity.entity_type}`;
      case 'completed':
        return `${userName} 完成了卡片`;
      case 'assigned':
        return `${userName} 指派了卡片`;
      default:
        return `${userName} ${activity.action} ${activity.entity_type}`;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'updated':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        );
      case 'moved':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      case 'deleted':
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        );
      case 'completed':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-bold text-gray-800">活动日志</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b flex gap-2">
        <select
          value={filter.entity_type || ''}
          onChange={(e) => setFilter({ ...filter, entity_type: e.target.value || undefined })}
          className="px-2 py-1 border rounded text-sm"
        >
          <option value="">全部类型</option>
          <option value="card">卡片</option>
          <option value="list">列表</option>
          <option value="board">看板</option>
        </select>
        <select
          value={filter.action || ''}
          onChange={(e) => setFilter({ ...filter, action: e.target.value || undefined })}
          className="px-2 py-1 border rounded text-sm"
        >
          <option value="">全部操作</option>
          <option value="created">创建</option>
          <option value="updated">更新</option>
          <option value="moved">移动</option>
          <option value="deleted">删除</option>
          <option value="completed">完成</option>
        </select>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center text-gray-500 py-4">加载中...</div>
        ) : activityList.length === 0 ? (
          <div className="text-center text-gray-500 py-4">暂无活动记录</div>
        ) : (
          <div className="space-y-4">
            {activityList.map((activity: Activity) => (
              <div key={activity.id} className="flex gap-3">
                {getActionIcon(activity.action)}
                <div className="flex-1">
                  <div className="text-sm text-gray-800">{getActionText(activity)}</div>
                  {activity.content && (
                    <div className="text-xs text-gray-500 mt-1">{activity.content}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {activity.created_at && formatTime(activity.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}