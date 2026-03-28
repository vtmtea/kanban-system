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
export type Swimlane = components['schemas']['Swimlane'];
export type ChecklistItem = components['schemas']['ChecklistItem'];
export type Attachment = components['schemas']['Attachment'];
export type Activity = components['schemas']['Activity'];
export type ActivityListResponse = components['schemas']['ActivityListResponse'];
export type ListWipStatus = components['schemas']['ListWipStatus'];
export type ListAutoAssignment = components['schemas']['ListAutoAssignment'];
export type ListTransitionRule = components['schemas']['ListTransitionRule'];
export type Webhook = components['schemas']['Webhook'];
export type CFDResponse = components['schemas']['CFDResponse'];
export type CFDDataPoint = components['schemas']['CFDDataPoint'];
export type CycleTimeResponse = components['schemas']['CycleTimeResponse'];
export type ThroughputResponse = components['schemas']['ThroughputResponse'];

// Request types
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type LoginResponse = components['schemas']['LoginResponse'];
export type UpdateUserRequest = components['schemas']['UpdateUserRequest'];
export type CreateBoardRequest = components['schemas']['CreateBoardRequest'];
export type UpdateBoardRequest = components['schemas']['UpdateBoardRequest'];
export type CreateSwimlaneRequest = components['schemas']['CreateSwimlaneRequest'];
export type UpdateSwimlaneRequest = components['schemas']['UpdateSwimlaneRequest'];
export type CreateListRequest = components['schemas']['CreateListRequest'];
export type UpdateListRequest = components['schemas']['UpdateListRequest'];
export type CreateCardRequest = components['schemas']['CreateCardRequest'];
export type UpdateCardRequest = components['schemas']['UpdateCardRequest'];
export type MoveCardRequest = components['schemas']['MoveCardRequest'];
export type AssignCardRequest = components['schemas']['AssignCardRequest'];
export type CreateChecklistItemRequest = components['schemas']['CreateChecklistItemRequest'];
export type UpdateChecklistItemRequest = components['schemas']['UpdateChecklistItemRequest'];
export type CreateCommentRequest = components['schemas']['CreateCommentRequest'];
export type CreateLabelRequest = components['schemas']['CreateLabelRequest'];
export type UpdateLabelRequest = components['schemas']['UpdateLabelRequest'];
export type AddBoardMemberRequest = components['schemas']['AddBoardMemberRequest'];
export type UpdateMemberRoleRequest = components['schemas']['UpdateMemberRoleRequest'];
export type SetAutoAssignmentRequest = components['schemas']['SetAutoAssignmentRequest'];
export type CreateTransitionRuleRequest = components['schemas']['CreateTransitionRuleRequest'];
export type CreateWebhookRequest = components['schemas']['CreateWebhookRequest'];
export type UpdateWebhookRequest = components['schemas']['UpdateWebhookRequest'];

// Response types
export type ErrorResponse = components['schemas']['ErrorResponse'];
export type MessageResponse = components['schemas']['MessageResponse'];