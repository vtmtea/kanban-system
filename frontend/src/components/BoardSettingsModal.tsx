import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardApi, swimlaneApi, webhookApi, transitionRuleApi, labelApi } from '@/services/api';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import type { BoardMember, Swimlane, Webhook, ListTransitionRule, Label, List } from '@/types';

interface BoardSettingsModalProps {
  boardId: number;
  onClose: () => void;
}

type TabType = 'members' | 'swimlanes' | 'labels' | 'webhooks' | 'rules' | 'analytics';

export function BoardSettingsModal({ boardId, onClose }: BoardSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const queryClient = useQueryClient();

  // 获取看板详情
  const { data: board } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardApi.getOne(boardId),
  });

  // 获取成员
  const { data: members } = useQuery({
    queryKey: ['board', boardId, 'members'],
    queryFn: () => boardApi.getMembers(boardId),
  });

  // 获取泳道
  const { data: swimlanes } = useQuery({
    queryKey: ['board', boardId, 'swimlanes'],
    queryFn: () => swimlaneApi.getAll(boardId),
  });

  // 获取标签
  const { data: labels } = useQuery({
    queryKey: ['labels', boardId],
    queryFn: () => labelApi.getAll(boardId),
  });

  // 获取 Webhooks
  const { data: webhooks } = useQuery({
    queryKey: ['board', boardId, 'webhooks'],
    queryFn: () => webhookApi.getAll(boardId),
  });

  // 获取状态转移规则
  const { data: rules } = useQuery({
    queryKey: ['board', boardId, 'transition-rules'],
    queryFn: () => transitionRuleApi.getAll(boardId),
  });

  // 添加成员（未来功能）
  const addMemberMutation = useMutation({
    mutationFn: (data: { user_id: number; role: 'admin' | 'member' | 'observer' }) =>
      boardApi.addMember(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'members'] });
    },
  });

  // 避免未使用警告
  void addMemberMutation;

  // 更新成员角色
  const updateRoleMutation = useMutation({
    mutationFn: (data: { userId: number; role: 'admin' | 'member' | 'observer' }) =>
      boardApi.updateMemberRole(boardId, data.userId, { role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'members'] });
    },
  });

  // 移除成员
  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => boardApi.removeMember(boardId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'members'] });
    },
  });

  // 创建泳道
  const createSwimlaneMutation = useMutation({
    mutationFn: (name: string) => swimlaneApi.create(boardId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'swimlanes'] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // 删除泳道
  const deleteSwimlaneMutation = useMutation({
    mutationFn: (id: number) => swimlaneApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'swimlanes'] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // 创建标签
  const createLabelMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => labelApi.create(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
    },
  });

  // 删除标签
  const deleteLabelMutation = useMutation({
    mutationFn: (id: number) => labelApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
    },
  });

  // 创建 Webhook
  const createWebhookMutation = useMutation({
    mutationFn: (data: { url: string; events: ('card.created' | 'card.updated' | 'card.moved' | 'card.deleted' | 'card.completed' | 'card.assigned' | 'comment.created' | 'checklist.completed')[]; secret?: string }) =>
      webhookApi.create(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'webhooks'] });
    },
  });

  // 删除 Webhook
  const deleteWebhookMutation = useMutation({
    mutationFn: (id: number) => webhookApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'webhooks'] });
    },
  });

  // 创建状态转移规则
  const createRuleMutation = useMutation({
    mutationFn: (data: { from_list_id: number; to_list_id: number }) =>
      transitionRuleApi.create(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'transition-rules'] });
    },
  });

  // 删除状态转移规则
  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => transitionRuleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId, 'transition-rules'] });
    },
  });

  const boardData = board?.data;
  const lists = boardData?.lists || [];

  const tabs = [
    { key: 'members', label: '成员管理' },
    { key: 'swimlanes', label: '泳道' },
    { key: 'labels', label: '标签' },
    { key: 'webhooks', label: 'Webhook' },
    { key: 'rules', label: '转移规则' },
    { key: 'analytics', label: '数据分析' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">看板设置</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-1 ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Members Tab */}
          {activeTab === 'members' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">成员列表</h3>
                <div className="space-y-2">
                  {members?.data?.map((member: BoardMember) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold">
                          {(member.user?.nickname || member.user?.username || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{member.user?.nickname || member.user?.username}</div>
                          <div className="text-sm text-gray-500">{member.role}</div>
                        </div>
                      </div>
                      {member.role !== 'owner' && (
                        <div className="flex items-center gap-2">
                          <select
                            value={member.role}
                            onChange={(e) => updateRoleMutation.mutate({
                              userId: member.user_id,
                              role: e.target.value as 'admin' | 'member' | 'observer',
                            })}
                            className="px-2 py-1 border rounded text-sm"
                          >
                            <option value="admin">管理员</option>
                            <option value="member">成员</option>
                            <option value="observer">观察者</option>
                          </select>
                          <button
                            onClick={() => removeMemberMutation.mutate(member.user_id)}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            移除
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                添加成员功能需要用户搜索，暂未实现
              </div>
            </div>
          )}

          {/* Swimlanes Tab */}
          {activeTab === 'swimlanes' && (
            <div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="新泳道名称"
                    className="px-3 py-2 border rounded flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        createSwimlaneMutation.mutate(e.currentTarget.value.trim());
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="新泳道名称"]') as HTMLInputElement;
                      if (input?.value.trim()) {
                        createSwimlaneMutation.mutate(input.value.trim());
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                  >
                    添加
                  </button>
                </div>
                <div className="space-y-2">
                  {swimlanes?.data?.map((swimlane: Swimlane) => (
                    <div key={swimlane.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {swimlane.color && (
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: swimlane.color }} />
                        )}
                        <span className="font-medium">{swimlane.name}</span>
                      </div>
                      <button
                        onClick={() => deleteSwimlaneMutation.mutate(swimlane.id)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Labels Tab */}
          {activeTab === 'labels' && (
            <div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="标签名称"
                    className="px-3 py-2 border rounded"
                    id="label-name"
                  />
                  <input
                    type="color"
                    defaultValue="#3b82f6"
                    className="w-10 h-10 rounded border"
                    id="label-color"
                  />
                  <button
                    onClick={() => {
                      const nameInput = document.getElementById('label-name') as HTMLInputElement;
                      const colorInput = document.getElementById('label-color') as HTMLInputElement;
                      if (nameInput?.value.trim()) {
                        createLabelMutation.mutate({
                          name: nameInput.value.trim(),
                          color: colorInput?.value || '#3b82f6',
                        });
                        nameInput.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                  >
                    添加标签
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {labels?.data?.map((label: Label) => (
                    <div
                      key={label.id}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                      <button
                        onClick={() => deleteLabelMutation.mutate(label.id)}
                        className="ml-1 hover:bg-white/20 rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Webhooks Tab */}
          {activeTab === 'webhooks' && (
            <div>
              <div className="mb-4">
                <div className="space-y-2 mb-4 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="url"
                    placeholder="Webhook URL"
                    className="w-full px-3 py-2 border rounded"
                    id="webhook-url"
                  />
                  <div className="flex flex-wrap gap-2">
                    {['card.created', 'card.updated', 'card.moved', 'card.deleted', 'card.completed'].map((event) => (
                      <label key={event} className="flex items-center gap-1 text-sm">
                        <input type="checkbox" value={event} className="webhook-event" />
                        {event}
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const urlInput = document.getElementById('webhook-url') as HTMLInputElement;
                      const checkboxes = document.querySelectorAll('.webhook-event:checked') as NodeListOf<HTMLInputElement>;
                      const events = Array.from(checkboxes).map((cb) => cb.value as 'card.created' | 'card.updated' | 'card.moved' | 'card.deleted' | 'card.completed' | 'card.assigned' | 'comment.created' | 'checklist.completed');
                      if (urlInput?.value.trim() && events.length > 0) {
                        createWebhookMutation.mutate({
                          url: urlInput.value.trim(),
                          events,
                        });
                        urlInput.value = '';
                        checkboxes.forEach((cb) => (cb.checked = false));
                      }
                    }}
                    className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                  >
                    创建 Webhook
                  </button>
                </div>
                <div className="space-y-2">
                  {webhooks?.data?.map((webhook: Webhook) => (
                    <div key={webhook.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm truncate max-w-[300px]">{webhook.url}</div>
                        <div className="text-xs text-gray-500">{webhook.events.join(', ')}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${webhook.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                          {webhook.is_active ? '活跃' : '禁用'}
                        </span>
                        <button
                          onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transition Rules Tab */}
          {activeTab === 'rules' && (
            <div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-4 p-4 bg-gray-50 rounded-lg">
                  <select id="rule-from" className="px-3 py-2 border rounded">
                    <option value="">从...</option>
                    {lists.map((list: List) => (
                      <option key={list.id} value={list.id}>{list.title}</option>
                    ))}
                  </select>
                  <span>→</span>
                  <select id="rule-to" className="px-3 py-2 border rounded">
                    <option value="">到...</option>
                    {lists.map((list: List) => (
                      <option key={list.id} value={list.id}>{list.title}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const fromSelect = document.getElementById('rule-from') as HTMLSelectElement;
                      const toSelect = document.getElementById('rule-to') as HTMLSelectElement;
                      if (fromSelect?.value && toSelect?.value && fromSelect.value !== toSelect.value) {
                        createRuleMutation.mutate({
                          from_list_id: Number(fromSelect.value),
                          to_list_id: Number(toSelect.value),
                        });
                      }
                    }}
                    className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                  >
                    添加规则
                  </button>
                </div>
                <div className="space-y-2">
                  {rules?.data?.map((rule: ListTransitionRule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium">{rule.from_list?.title}</span>
                        <span className="text-gray-400 mx-2">→</span>
                        <span className="font-medium">{rule.to_list?.title}</span>
                      </div>
                      <button
                        onClick={() => deleteRuleMutation.mutate(rule.id)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard boardId={boardId} />
          )}
        </div>
      </div>
    </div>
  );
}