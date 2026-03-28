// Re-export types from generated OpenAPI types
import type { components, paths, operations } from './api';

// Export paths and operations for advanced usage
export type { paths, operations };

// Export schema types from components
export type User = components['schemas']['User'];
export type Board = components['schemas']['Board'];
export type List = components['schemas']['List'];
export type Card = components['schemas']['Card'];
export type Label = components['schemas']['Label'];
export type Comment = components['schemas']['Comment'];
export type BoardMember = components['schemas']['BoardMember'];

// Request types
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type LoginResponse = components['schemas']['LoginResponse'];
export type UpdateUserRequest = components['schemas']['UpdateUserRequest'];
export type CreateBoardRequest = components['schemas']['CreateBoardRequest'];
export type UpdateBoardRequest = components['schemas']['UpdateBoardRequest'];
export type CreateListRequest = components['schemas']['CreateListRequest'];
export type UpdateListRequest = components['schemas']['UpdateListRequest'];
export type CreateCardRequest = components['schemas']['CreateCardRequest'];
export type UpdateCardRequest = components['schemas']['UpdateCardRequest'];
export type MoveCardRequest = components['schemas']['MoveCardRequest'];
export type CreateCommentRequest = components['schemas']['CreateCommentRequest'];
export type CreateLabelRequest = components['schemas']['CreateLabelRequest'];

// Response types
export type ErrorResponse = components['schemas']['ErrorResponse'];
export type MessageResponse = components['schemas']['MessageResponse'];