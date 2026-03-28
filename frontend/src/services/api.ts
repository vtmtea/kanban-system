import axios from 'axios';
import type {
  User,
  Board,
  List,
  Card,
  Comment,
  Label,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateUserRequest,
  CreateBoardRequest,
  UpdateBoardRequest,
  CreateListRequest,
  UpdateListRequest,
  CreateCardRequest,
  UpdateCardRequest,
  MoveCardRequest,
  CreateCommentRequest,
  CreateLabelRequest,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
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
};

// 列表相关
export const listApi = {
  getAll: (boardId: number) => api.get<List[]>(`/boards/${boardId}/lists`),
  create: (boardId: number, data: CreateListRequest) => api.post<List>(`/boards/${boardId}/lists`, data),
  update: (id: number, data: UpdateListRequest) => api.put<List>(`/lists/${id}`, data),
  delete: (id: number) => api.delete(`/lists/${id}`),
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
  delete: (id: number) => api.delete(`/labels/${id}`),
};

export default api;