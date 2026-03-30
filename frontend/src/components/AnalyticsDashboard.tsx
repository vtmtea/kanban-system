import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { boardApi } from '@/services/api';
import { DatePickerField } from '@/components/DatePickerField';
import type { CFDDataPoint, CFDResponse, CycleTimeResponse, ThroughputResponse } from '@/types';

interface AnalyticsDashboardProps {
  boardId: number;
}

export function AnalyticsDashboard({ boardId }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  const { data: cfdResponse, isLoading: cfdLoading } = useQuery({
    queryKey: ['board', boardId, 'analytics', 'cfd', dateRange],
    queryFn: async () => {
      const res = await boardApi.getCFD(boardId, dateRange);
      return res.data as CFDResponse;
    },
  });

  const { data: cycleTimeResponse, isLoading: cycleTimeLoading } = useQuery({
    queryKey: ['board', boardId, 'analytics', 'cycle-time', dateRange],
    queryFn: async () => {
      const res = await boardApi.getCycleTime(boardId, dateRange);
      return res.data as CycleTimeResponse;
    },
  });

  const { data: throughputResponse, isLoading: throughputLoading } = useQuery({
    queryKey: ['board', boardId, 'analytics', 'throughput', dateRange],
    queryFn: async () => {
      const res = await boardApi.getThroughput(boardId, dateRange);
      return res.data as ThroughputResponse;
    },
  });

  const cfd = cfdResponse;
  const cycleTime = cycleTimeResponse;
  const throughput = throughputResponse;

  // 计算 CFD 图表的高度
  const getMaxCount = () => {
    if (!cfd?.data || cfd.data.length === 0) return 100;
    let max = 0;
    cfd.data.forEach((point: CFDDataPoint) => {
      Object.values(point.list_counts).forEach((count) => {
        if (count > max) max = count;
      });
    });
    return max + 10;
  };

  const maxCount = getMaxCount();

  // 生成 CFD 图表路径
  const generateCFDPath = (listId: string, color: string) => {
    if (!cfd?.data || cfd.data.length === 0) return null;

    const width = 700;
    const height = 200;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = cfd.data.map((point: CFDDataPoint, index: number) => {
      const x = padding + (index / (cfd.data.length - 1 || 1)) * chartWidth;
      const count = point.list_counts[listId] || 0;
      const y = height - padding - (count / maxCount) * chartHeight;
      return `${x},${y}`;
    });

    return (
      <polyline
        key={listId}
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Date Range */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">开始日期:</label>
          <DatePickerField
            value={dateRange.start_date}
            onChange={(nextValue) => setDateRange({ ...dateRange, start_date: nextValue })}
            size="sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">结束日期:</label>
          <DatePickerField
            value={dateRange.end_date}
            onChange={(nextValue) => setDateRange({ ...dateRange, end_date: nextValue })}
            size="sm"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
          <div className="text-sm opacity-80">已完成卡片</div>
          <div className="text-3xl font-bold mt-1">{throughput?.total_completed || 0}</div>
          <div className="text-sm opacity-80 mt-1">日均: {throughput?.daily_average?.toFixed(1) || 0}</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-lg text-white">
          <div className="text-sm opacity-80">平均周期时间</div>
          <div className="text-3xl font-bold mt-1">
            {cycleTime?.average_cycle_time ? (cycleTime.average_cycle_time / 24).toFixed(1) : 0}
          </div>
          <div className="text-sm opacity-80 mt-1">天</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white">
          <div className="text-sm opacity-80">平均前置时间</div>
          <div className="text-3xl font-bold mt-1">
            {cycleTime?.average_lead_time ? (cycleTime.average_lead_time / 24).toFixed(1) : 0}
          </div>
          <div className="text-sm opacity-80 mt-1">天</div>
        </div>
      </div>

      {/* CFD Chart */}
      <div className="p-4 bg-white border rounded-lg">
        <h3 className="text-lg font-medium mb-4">累积流图 (CFD)</h3>
        {cfdLoading ? (
          <div className="h-64 flex items-center justify-center text-gray-500">加载中...</div>
        ) : !cfd?.data || cfd.data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">暂无数据</div>
        ) : (
          <div className="relative">
            <svg width="100%" viewBox="0 0 700 250" className="overflow-visible">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((percent) => {
                const y = 20 + (percent / 100) * 200;
                return (
                  <line key={percent} x1="20" y1={y} x2="680" y2={y} stroke="#e5e7eb" strokeWidth={1} />
                );
              })}
              {/* Lines for each list */}
              {cfd.lists?.map((list) =>
                generateCFDPath(String(list.id), list.color || '#3b82f6')
              )}
            </svg>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4">
              {cfd.lists?.map((list) => (
                <div key={list.id} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: list.color || '#3b82f6' }} />
                  <span className="text-sm text-gray-600">{list.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cycle Time Details */}
      <div className="p-4 bg-white border rounded-lg">
        <h3 className="text-lg font-medium mb-4">周期时间分布</h3>
        {cycleTimeLoading ? (
          <div className="h-48 flex items-center justify-center text-gray-500">加载中...</div>
        ) : !cycleTime?.cards || cycleTime.cards.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-500">暂无数据</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cycleTime.cards.slice(0, 10).map((card, index) => (
              <div key={card.card_id || index} className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium">{card.card_title}</span>
                <div className="text-sm text-gray-500">
                  周期: {((card.cycle_time || 0) / 24).toFixed(1)}天 | 前置: {((card.lead_time || 0) / 24).toFixed(1)}天
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Throughput Chart */}
      <div className="p-4 bg-white border rounded-lg">
        <h3 className="text-lg font-medium mb-4">吞吐率 (每周完成)</h3>
        {throughputLoading ? (
          <div className="h-48 flex items-center justify-center text-gray-500">加载中...</div>
        ) : !throughput?.weekly_data || throughput.weekly_data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-500">暂无数据</div>
        ) : (
          <div className="space-y-2">
            {throughput.weekly_data.map((week, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="text-xs text-gray-500 w-24">
                  {week.week_start}
                </div>
                <div className="flex-1 bg-gray-100 rounded h-6">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded flex items-center justify-end pr-2 text-white text-xs"
                    style={{ width: `${Math.min(100, (week.count || 0) / 10 * 100)}%` }}
                  >
                    {week.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
