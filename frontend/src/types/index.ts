export interface User {
  id: number;
  username: string;
  email: string;
  nickname: string;
  avatar: string;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: number;
  title: string;
  description: string;
  owner_id: number;
  owner?: User;
  color: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  lists?: List[];
  members?: BoardMember[];
}

export interface List {
  id: number;
  board_id: number;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
  cards?: Card[];
}

export interface Card {
  id: number;
  list_id: number;
  title: string;
  description: string;
  position: number;
  due_date?: string;
  cover: string;
  created_at: string;
  updated_at: string;
  labels?: Label[];
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface Label {
  id: number;
  board_id: number;
  name: string;
  color: string;
}

export interface Comment {
  id: number;
  card_id: number;
  user_id: number;
  user?: User;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: number;
  card_id: number;
  file_name: string;
  file_url: string;
  file_size: number;
  created_at: string;
}

export interface BoardMember {
  id: number;
  board_id: number;
  user_id: number;
  user?: User;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

// API请求类型
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateBoardRequest {
  title: string;
  description?: string;
  color?: string;
  is_public?: boolean;
}

export interface UpdateBoardRequest {
  title?: string;
  description?: string;
  color?: string;
  is_public?: boolean;
}

export interface CreateListRequest {
  title: string;
}

export interface UpdateListRequest {
  title?: string;
  position?: number;
}

export interface CreateCardRequest {
  title: string;
  description?: string;
  due_date?: string;
  cover?: string;
}

export interface UpdateCardRequest {
  title?: string;
  description?: string;
  position?: number;
  list_id?: number;
  due_date?: string;
  cover?: string;
}

export interface MoveCardRequest {
  list_id: number;
  position?: number;
}

export interface CreateCommentRequest {
  content: string;
}

export interface CreateLabelRequest {
  name: string;
  color: string;
}