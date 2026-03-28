import axios from 'axios';
import type {
  User,
  Board,
  List,
  Card,
  Comment,
  Label,
  Swimlane,
  ChecklistItem,
  Attachment,
  ActivityListResponse,
  BoardMember,
  ListWipStatus,
  ListAutoAssignment,
  ListTransitionRule,
  Webhook,
  CFDResponse,
  CycleTimeResponse,
  ThroughputResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateUserRequest,
  CreateBoardRequest,
  UpdateBoardRequest,
  CreateSwimlaneRequest,
  UpdateSwimlaneRequest,
  CreateListRequest,
  UpdateListRequest,
  CreateCardRequest,
  UpdateCardRequest,
  MoveCardRequest,
  AssignCardRequest,
  CreateChecklistItemRequest,
  UpdateChecklistItemRequest,
  CreateCommentRequest,
  CreateLabelRequest,
  UpdateLabelRequest,
  AddBoardMemberRequest,
  UpdateMemberRoleRequest,
  SetAutoAssignmentRequest,
  CreateTransitionRuleRequest,
  CreateWebhookRequest,
  UpdateWebhookRequest,
} from '@/types';

// 动态获取 API 基础路径
// 开发环境: /api (由 Vite 代理转发)
// 生产环境: 由环境变量 VITE_API_BASE_URL 配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器 - 添加JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关
export const authApi = {
  register: (data: RegisterRequest) => api.post<LoginResponse>('/auth/register', data),
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  getCurrentUser: () => api.get<User>('/user'),
  updateUser: (data: UpdateUserRequest) => api.put<User>('/user', data),
};

// 看板相关
export const boardApi = {
  getAll: () => api.get<Board[]>('/boards'),
  getOne: (id: number) => api.get<Board>(`/boards/${id}`),
  create: (data: CreateBoardRequest) => api.post<Board>('/boards', data),
  update: (id: number, data: UpdateBoardRequest) => api.put<Board>(`/boards/${id}`, data),
  delete: (id: number) => api.delete(`/boards/${id}`),
  getWipStatus: (id: number) => api.get<ListWipStatus[]>(`/boards/${id}/wip-status`),
  getMembers: (id: number) => api.get<BoardMember[]>(`/boards/${id}/members`),
  addMember: (id: number, data: AddBoardMemberRequest) => api.post<BoardMember>(`/boards/${id}/members`, data),
  updateMemberRole: (id: number, userId: number, data: UpdateMemberRoleRequest) =>
    api.put<BoardMember>(`/boards/${id}/members/${userId}`, data),
  removeMember: (id: number, userId: number) => api.delete(`/boards/${id}/members/${userId}`),
  getActivities: (id: number, params?: { page?: number; limit?: number; entity_type?: string; action?: string }) =>
    api.get<ActivityListResponse>(`/boards/${id}/activities`, { params }),
  getWebhooks: (id: number) => api.get<Webhook[]>(`/boards/${id}/webhooks`),
  createWebhook: (id: number, data: CreateWebhookRequest) => api.post<Webhook>(`/boards/${id}/webhooks`, data),
  getTransitionRules: (id: number) => api.get<ListTransitionRule[]>(`/boards/${id}/transition-rules`),
  createTransitionRule: (id: number, data: CreateTransitionRuleRequest) =>
    api.post<ListTransitionRule>(`/boards/${id}/transition-rules`, data),
  // Analytics
  getCFD: (id: number, params?: { start_date?: string; end_date?: string }) =>
    api.get<CFDResponse>(`/boards/${id}/analytics/cfd`, { params }),
  getCycleTime: (id: number, params?: { start_date?: string; end_date?: string }) =>
    api.get<CycleTimeResponse>(`/boards/${id}/analytics/cycle-time`, { params }),
  getThroughput: (id: number, params?: { start_date?: string; end_date?: string }) =>
    api.get<ThroughputResponse>(`/boards/${id}/analytics/throughput`, { params }),
};

// 泳道相关
export const swimlaneApi = {
  getAll: (boardId: number) => api.get<Swimlane[]>(`/boards/${boardId}/swimlanes`),
  create: (boardId: number, data: CreateSwimlaneRequest) => api.post<Swimlane>(`/boards/${boardId}/swimlanes`, data),
  update: (id: number, data: UpdateSwimlaneRequest) => api.put<Swimlane>(`/swimlanes/${id}`, data),
  delete: (id: number) => api.delete(`/swimlanes/${id}`),
};

// 列表相关
export const listApi = {
  getAll: (boardId: number) => api.get<List[]>(`/boards/${boardId}/lists`),
  create: (boardId: number, data: CreateListRequest) => api.post<List>(`/boards/${boardId}/lists`, data),
  update: (id: number, data: UpdateListRequest) => api.put<List>(`/lists/${id}`, data),
  delete: (id: number) => api.delete(`/lists/${id}`),
  getAutoAssignments: (id: number) => api.get<ListAutoAssignment[]>(`/lists/${id}/auto-assignments`),
  setAutoAssignment: (id: number, data: SetAutoAssignmentRequest) =>
    api.post<ListAutoAssignment>(`/lists/${id}/auto-assignments`, data),
  deleteAutoAssignment: (id: number) => api.delete(`/lists/${id}/auto-assignments`),
};

// 卡片相关
export const cardApi = {
  getOne: (id: number) => api.get<Card>(`/cards/${id}`),
  create: (listId: number, data: CreateCardRequest) => api.post<Card>(`/lists/${listId}/cards`, data),
  update: (id: number, data: UpdateCardRequest) => api.put<Card>(`/cards/${id}`, data),
  move: (id: number, data: MoveCardRequest) => api.put<Card>(`/cards/${id}/move`, data),
  delete: (id: number) => api.delete(`/cards/${id}`),
  addLabel: (cardId: number, labelId: number) => api.post(`/cards/${cardId}/labels/${labelId}`),
  removeLabel: (cardId: number, labelId: number) => api.delete(`/cards/${cardId}/labels/${labelId}`),
  complete: (id: number) => api.put<Card>(`/cards/${id}/complete`),
  assign: (id: number, data: AssignCardRequest) => api.put<Card>(`/cards/${id}/assign`, data),
  // Checklist
  getChecklist: (id: number) => api.get<ChecklistItem[]>(`/cards/${id}/checklist`),
  addChecklistItem: (id: number, data: CreateChecklistItemRequest) =>
    api.post<ChecklistItem>(`/cards/${id}/checklist`, data),
  updateChecklistItem: (id: number, data: UpdateChecklistItemRequest) =>
    api.put<ChecklistItem>(`/checklist/${id}`, data),
  deleteChecklistItem: (id: number) => api.delete(`/checklist/${id}`),
  // Attachments
  getAttachments: (id: number) => api.get<Attachment[]>(`/cards/${id}/attachments`),
  uploadAttachment: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Attachment>(`/cards/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAttachment: (id: number) => api.delete(`/attachments/${id}`),
};

// 评论相关
export const commentApi = {
  getAll: (cardId: number) => api.get<Comment[]>(`/cards/${cardId}/comments`),
  create: (cardId: number, data: CreateCommentRequest) => api.post<Comment>(`/cards/${cardId}/comments`, data),
  delete: (id: number) => api.delete(`/comments/${id}`),
};

// 标签相关
export const labelApi = {
  getAll: (boardId: number) => api.get<Label[]>(`/boards/${boardId}/labels`),
  create: (boardId: number, data: CreateLabelRequest) => api.post<Label>(`/boards/${boardId}/labels`, data),
  update: (id: number, data: UpdateLabelRequest) => api.put<Label>(`/labels/${id}`, data),
  delete: (id: number) => api.delete(`/labels/${id}`),
};

// Webhook相关
export const webhookApi = {
  getAll: (boardId: number) => api.get<Webhook[]>(`/boards/${boardId}/webhooks`),
  create: (boardId: number, data: CreateWebhookRequest) => api.post<Webhook>(`/boards/${boardId}/webhooks`, data),
  update: (id: number, data: UpdateWebhookRequest) => api.put<Webhook>(`/webhooks/${id}`, data),
  delete: (id: number) => api.delete(`/webhooks/${id}`),
};

// 状态转移规则相关
export const transitionRuleApi = {
  getAll: (boardId: number) => api.get<ListTransitionRule[]>(`/boards/${boardId}/transition-rules`),
  create: (boardId: number, data: CreateTransitionRuleRequest) =>
    api.post<ListTransitionRule>(`/boards/${boardId}/transition-rules`, data),
  delete: (id: number) => api.delete(`/transition-rules/${id}`),
};

export default api;