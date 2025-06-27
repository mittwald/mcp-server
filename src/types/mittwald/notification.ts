// Notification API Types
export interface NotificationListArgs {
  status?: string;
  limit?: number;
  skip?: number;
  page?: number;
}

export interface NotificationUnreadCountsArgs {
  // No parameters for this endpoint
}

export interface NotificationMarkAllReadArgs {
  severities?: string[];
  referenceId?: string;
  referenceAggregate?: string;
  referenceDomain?: string;
}

export interface NotificationMarkReadArgs {
  notificationId: string;
}

// Supporting Types  
export interface NotificationUnreadCounts {
  total: number;
  success: number;
  info: number;
  warning: number;
  error: number;
}

export interface Notification {
  id: string;
  type: string;
  reference: {
    id: string;
    aggregate: string;
    domain: string;
    parents?: Array<{
      id: string;
      aggregate: string;
      domain: string;
    }>;
  };
  severity: "success" | "info" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

export type NotificationStatus = "read";

export interface NotificationResponse {
  notifications?: Notification[];
  unreadCounts?: NotificationUnreadCounts;
}