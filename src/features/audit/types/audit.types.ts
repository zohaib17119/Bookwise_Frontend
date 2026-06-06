export interface AuditLog {
  id: string;
  createdAt?: string | null;
  module?: string | null;
  action?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  entityNumber?: string | null;
  actorUserId?: string | null;
  actorName?: string | null;
  description?: string | null;
  beforeSnapshot?: unknown;
  afterSnapshot?: unknown;
  requestId?: string | null;
  ipAddress?: string | null;
  requestMetadata?: unknown;
}

export interface ActivityEvent {
  id: string;
  createdAt?: string | null;
  actorName?: string | null;
  action?: string | null;
  title?: string | null;
  description?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}

export interface AuditLogListParams {
  search?: string;
  module?: string;
  action?: string;
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
