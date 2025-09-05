export interface CreateAssignmentRequest {
  teacherId: string;
  problemSetId: string;
  title: string;
  description?: string;
  dueDate: string; // ISO string
  timezone?: string;
  maxAttempts?: number;
  classIds?: string[];
  studentIds?: string[];
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  dueDate?: string; // ISO string
  timezone?: string;
  maxAttempts?: number;
}

export interface AssignToClassRequest {
  classIds: string[];
}

export interface AssignToStudentRequest {
  studentIds: string[];
}

export interface ExtendDueDateRequest {
  extensionDays: number;
  reason?: string;
  targetType: 'all' | 'class' | 'student';
  targetIds?: string[];
}

export interface ChangeDueDateRequest {
  newDueDate: string; // ISO string
  reason?: string;
}

export interface RevokeAssignmentRequest {
  targetType: 'class' | 'student';
  targetIds: string[];
  reason?: string;
}

export interface AssignmentResponse {
  id: string;
  teacherId: string;
  problemSetId: string;
  title: string;
  description?: string;
  dueDate: string; // ISO string
  maxAttempts?: number;
  status: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  dueDateStatus: {
    isOverdue: boolean;
    isDueSoon: boolean;
    hoursUntilDue: number;
    daysUntilDue: number;
    statusMessage: string;
  };
  targets: {
    totalCount: number;
    activeCount: number;
    assignedClasses: string[];
    assignedStudents: string[];
  };
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canActivate: boolean;
    canAssign: boolean;
  };
}

export interface AssignmentListResponse {
  assignments: AssignmentSummary[];
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  summary?: {
    totalCount: number;
    activeCount: number;
    overdueCount: number;
    dueSoonCount: number;
  };
}

export interface AssignmentSummary {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO string
  maxAttempts?: number;
  status: string;
  problemSetId: string;
  teacherId: string;
  dueDateStatus: {
    isOverdue: boolean;
    isDueSoon: boolean;
    hoursUntilDue: number;
    daysUntilDue: number;
  };
}

export interface StudentAssignmentResponse {
  studentId: string;
  assignments: StudentAssignmentSummary[];
  summary: {
    totalCount: number;
    activeCount: number;
    overdueCount: number;
    dueSoonCount: number;
  };
}

export interface StudentAssignmentSummary extends AssignmentSummary {
  accessibility: {
    isAccessible: boolean;
    canSubmit: boolean;
  };
}

export interface TeacherAssignmentResponse {
  teacherId: string;
  assignments: TeacherAssignmentSummary[];
  summary: {
    totalCount: number;
    activeCount: number;
    draftCount: number;
    overdueCount: number;
    dueSoonCount: number;
  };
}

export interface TeacherAssignmentSummary extends AssignmentSummary {
  targetInfo: {
    totalTargets: number;
    activeTargets: number;
    hasClassTargets: boolean;
    hasStudentTargets: boolean;
  };
}

export interface ClassAssignmentResponse {
  classId: string;
  assignments: ClassAssignmentSummary[];
  summary: {
    totalCount: number;
    activeCount: number;
    overdueCount: number;
    dueSoonCount: number;
  };
}

export interface ClassAssignmentSummary extends AssignmentSummary {
  accessibility: {
    isAccessible: boolean;
    canSubmit: boolean;
  };
}

export interface OverdueAssignmentResponse {
  assignments: OverdueAssignmentSummary[];
  summary: {
    totalCount: number;
    processedCount: number;
    notificationsSent: number;
  };
}

export interface OverdueAssignmentSummary extends AssignmentSummary {
  overdueInfo: {
    daysPastDue: number;
    hasBeenNotified: boolean;
    lastNotificationDate?: string;
  };
}

export interface DueSoonAssignmentResponse {
  assignments: DueSoonAssignmentSummary[];
  summary: {
    totalCount: number;
    next24Hours: number;
    next7Days: number;
  };
}

export interface DueSoonAssignmentSummary extends AssignmentSummary {
  dueSoonInfo: {
    hoursUntilDue: number;
    daysUntilDue: number;
    priorityLevel: 'high' | 'medium' | 'low';
  };
}

export interface ProcessOverdueAssignmentsResponse {
  processedCount: number;
  notificationsSent: number;
  errors: string[];
  processedAssignments: ProcessedAssignmentSummary[];
}

export interface ProcessedAssignmentSummary {
  id: string;
  title: string;
  teacherId: string;
  daysPastDue: number;
  notificationSent: boolean;
  action: 'notified' | 'escalated' | 'closed' | 'error';
  message?: string;
}

export interface AssignmentStatsResponse {
  totalAssignments: number;
  activeAssignments: number;
  overdueAssignments: number;
  dueSoonAssignments: number;
  completedAssignments: number;
  avgSubmissionRate: number;
  topPerformingAssignments: AssignmentPerformance[];
  problematicAssignments: AssignmentPerformance[];
}

export interface AssignmentPerformance {
  id: string;
  title: string;
  submissionRate: number;
  avgScore: number;
  totalTargets: number;
  submittedCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}