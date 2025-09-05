import { httpClient } from './httpClient';

// ===== Types =====

// Assignment Core Types
export interface Assignment {
  id: string;
  teacherId: string;
  problemSetId: string;
  title: string;
  description?: string;
  dueDate: string; // ISO string
  timezone?: string;
  maxAttempts?: number;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  dueDateStatus: {
    isOverdue: boolean;
    isDueSoon: boolean;
    hoursUntilDue: number;
    daysUntilDue: number;
    statusMessage: string;
  };
  targets?: {
    totalCount: number;
    activeCount: number;
    assignedClasses: string[];
    assignedStudents: string[];
  };
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
    canActivate: boolean;
    canAssign: boolean;
  };
}

// Request/Response Types
export interface CreateAssignmentRequest {
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
  targetIds: string[]; // class IDs or student IDs
  extensionHours: number;
  reason?: string;
}

export interface ChangeDueDateRequest {
  newDueDate: string; // ISO string
  timezone?: string;
  reason?: string;
}

// Teacher Assignment Summary
export interface TeacherAssignmentSummary {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  maxAttempts?: number;
  status: string;
  problemSetId: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  dueDateStatus: {
    isOverdue: boolean;
    isDueSoon: boolean;
    hoursUntilDue: number;
    daysUntilDue: number;
    statusMessage: string;
  };
  targetInfo: {
    totalTargets: number;
    activeTargets: number;
    assignedClasses: string[];
    assignedStudents: string[];
    hasActiveAssignments: boolean;
  };
  permissions: {
    canActivate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canAssign: boolean;
  };
}

export interface GetTeacherAssignmentsResponse {
  teacherId: string;
  assignments: TeacherAssignmentSummary[];
  summary: {
    totalCount: number;
    draftCount: number;
    activeCount: number;
    closedCount: number;
    archivedCount: number;
    overdueCount: number;
    dueSoonCount: number;
  };
}

// Student Assignment Types
export interface StudentAssignmentSummary {
  id: string;
  assignmentId: string;
  studentId: string;
  classId?: string;
  assignedAt: string;
  extendedDueDate?: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'REVOKED';
  completedAt?: string;
  assignmentInfo: {
    title: string;
    description?: string;
    dueDate: string;
    maxAttempts?: number;
    problemSetId: string;
    teacherId: string;
  };
  dueDateStatus: {
    isOverdue: boolean;
    isDueSoon: boolean;
    hoursUntilDue: number;
    daysUntilDue: number;
    statusMessage: string;
  };
  progress?: {
    attemptCount: number;
    lastAttemptAt?: string;
    progressPercentage: number;
    problemsSolved: number;
    totalProblems: number;
  };
}

export interface GetStudentAssignmentsResponse {
  studentId: string;
  assignments: StudentAssignmentSummary[];
  summary: {
    totalCount: number;
    assignedCount: number;
    inProgressCount: number;
    completedCount: number;
    overdueCount: number;
    dueSoonCount: number;
  };
}

// Query Parameters
export interface GetTeacherAssignmentsParams {
  status?: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED' | 'ALL';
  includeArchived?: boolean;
  sortBy?: 'dueDate' | 'createdAt' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface GetStudentAssignmentsParams {
  status?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'ALL';
  classId?: string;
  sortBy?: 'dueDate' | 'assignedAt' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// ===== API Service Class =====

export class AssignmentApiService {
  private baseUrl = '/assignments';

  // ===== Assignment CRUD Operations =====

  /**
   * 새 과제 생성
   */
  async createAssignment(data: CreateAssignmentRequest): Promise<Assignment> {
    return httpClient.post<Assignment>(this.baseUrl, data);
  }

  /**
   * 과제 상세 조회
   */
  async getAssignment(assignmentId: string): Promise<Assignment> {
    return httpClient.get<Assignment>(`${this.baseUrl}/${assignmentId}`);
  }

  /**
   * 과제 업데이트
   */
  async updateAssignment(
    assignmentId: string, 
    data: UpdateAssignmentRequest
  ): Promise<Assignment> {
    return httpClient.put<Assignment>(`${this.baseUrl}/${assignmentId}`, data);
  }

  /**
   * 과제 삭제
   */
  async deleteAssignment(assignmentId: string): Promise<void> {
    return httpClient.delete<void>(`${this.baseUrl}/${assignmentId}`);
  }

  // ===== Assignment Status Management =====

  /**
   * 과제 활성화 (DRAFT -> ACTIVE)
   */
  async activateAssignment(assignmentId: string): Promise<{ 
    assignmentId: string; 
    status: string; 
    activatedAt: string; 
  }> {
    return httpClient.patch<{ 
      assignmentId: string; 
      status: string; 
      activatedAt: string; 
    }>(`${this.baseUrl}/${assignmentId}/activate`);
  }

  /**
   * 과제 비활성화 (ACTIVE -> DRAFT)
   */
  async deactivateAssignment(assignmentId: string): Promise<{ 
    assignmentId: string; 
    status: string; 
    deactivatedAt: string; 
  }> {
    return httpClient.patch<{ 
      assignmentId: string; 
      status: string; 
      deactivatedAt: string; 
    }>(`${this.baseUrl}/${assignmentId}/deactivate`);
  }

  /**
   * 과제 마감 (ACTIVE -> CLOSED)
   */
  async closeAssignment(assignmentId: string): Promise<{ 
    assignmentId: string; 
    status: string; 
    closedAt: string; 
  }> {
    return httpClient.patch<{ 
      assignmentId: string; 
      status: string; 
      closedAt: string; 
    }>(`${this.baseUrl}/${assignmentId}/close`);
  }

  /**
   * 과제 보관 (CLOSED -> ARCHIVED)
   */
  async archiveAssignment(assignmentId: string): Promise<{ 
    assignmentId: string; 
    status: string; 
    archivedAt: string; 
  }> {
    return httpClient.patch<{ 
      assignmentId: string; 
      status: string; 
      archivedAt: string; 
    }>(`${this.baseUrl}/${assignmentId}/archive`);
  }

  // ===== Assignment Target Management =====

  /**
   * 클래스에 과제 배정
   */
  async assignToClass(
    assignmentId: string, 
    data: AssignToClassRequest
  ): Promise<{ targetCount: number; assignedClasses: string[]; }> {
    return httpClient.post<{ targetCount: number; assignedClasses: string[]; }>(
      `${this.baseUrl}/${assignmentId}/assign-class`, 
      data
    );
  }

  /**
   * 개별 학생에게 과제 배정
   */
  async assignToStudent(
    assignmentId: string, 
    data: AssignToStudentRequest
  ): Promise<{ targetCount: number; assignedStudents: string[]; }> {
    return httpClient.post<{ targetCount: number; assignedStudents: string[]; }>(
      `${this.baseUrl}/${assignmentId}/assign-student`, 
      data
    );
  }

  /**
   * 과제 배정 취소
   */
  async revokeAssignment(
    assignmentId: string, 
    data: { targetIds: string[] }
  ): Promise<{ revokedCount: number; remainingTargets: number; }> {
    return httpClient.post<{ revokedCount: number; remainingTargets: number; }>(
      `${this.baseUrl}/${assignmentId}/revoke`, 
      data
    );
  }

  // ===== Due Date Management =====

  /**
   * 마감일 연장 (특정 대상)
   */
  async extendDueDate(
    assignmentId: string, 
    data: ExtendDueDateRequest
  ): Promise<{ extendedCount: number; newDueDate: string; }> {
    return httpClient.post<{ extendedCount: number; newDueDate: string; }>(
      `${this.baseUrl}/${assignmentId}/extend-due-date`, 
      data
    );
  }

  /**
   * 마감일 변경 (전체)
   */
  async changeDueDate(
    assignmentId: string, 
    data: ChangeDueDateRequest
  ): Promise<{ assignmentId: string; newDueDate: string; updatedAt: string; }> {
    return httpClient.put<{ assignmentId: string; newDueDate: string; updatedAt: string; }>(
      `${this.baseUrl}/${assignmentId}/due-date`, 
      data
    );
  }

  // ===== Teacher Assignment Queries =====

  /**
   * 교사 과제 목록 조회
   */
  async getTeacherAssignments(
    params?: GetTeacherAssignmentsParams
  ): Promise<GetTeacherAssignmentsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.includeArchived !== undefined) {
      queryParams.append('includeArchived', params.includeArchived.toString());
    }
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = queryParams.toString() 
      ? `${this.baseUrl}/teacher?${queryParams.toString()}`
      : `${this.baseUrl}/teacher`;

    return httpClient.get<GetTeacherAssignmentsResponse>(url);
  }

  // ===== Student Assignment Queries =====

  /**
   * 학생 과제 목록 조회
   */
  async getStudentAssignments(
    studentId?: string, 
    params?: GetStudentAssignmentsParams
  ): Promise<GetStudentAssignmentsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.classId) queryParams.append('classId', params.classId);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = studentId 
      ? `${this.baseUrl}/student/${studentId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      : `${this.baseUrl}/student${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    return httpClient.get<GetStudentAssignmentsResponse>(url);
  }

  /**
   * 클래스 과제 목록 조회 (교사용)
   */
  async getClassAssignments(classId: string): Promise<{
    classId: string;
    assignments: Assignment[];
    summary: {
      totalCount: number;
      activeCount: number;
      draftCount: number;
      closedCount: number;
    };
  }> {
    return httpClient.get<{
      classId: string;
      assignments: Assignment[];
      summary: {
        totalCount: number;
        activeCount: number;
        draftCount: number;
        closedCount: number;
      };
    }>(`${this.baseUrl}/class/${classId}`);
  }

  // ===== Due Date Related Queries =====

  /**
   * 마감임박 과제 조회
   */
  async getDueSoonAssignments(hoursThreshold: number = 24): Promise<{
    assignments: Assignment[];
    summary: {
      totalCount: number;
      within24Hours: number;
      within48Hours: number;
      within7Days: number;
    };
  }> {
    return httpClient.get<{
      assignments: Assignment[];
      summary: {
        totalCount: number;
        within24Hours: number;
        within48Hours: number;
        within7Days: number;
      };
    }>(`${this.baseUrl}/due-soon?threshold=${hoursThreshold}`);
  }

  /**
   * 연체 과제 조회
   */
  async getOverdueAssignments(): Promise<{
    assignments: Assignment[];
    summary: {
      totalCount: number;
      overdue1Day: number;
      overdue3Days: number;
      overdue1Week: number;
    };
  }> {
    return httpClient.get<{
      assignments: Assignment[];
      summary: {
        totalCount: number;
        overdue1Day: number;
        overdue3Days: number;
        overdue1Week: number;
      };
    }>(`${this.baseUrl}/overdue`);
  }

  // ===== Batch Operations =====

  /**
   * 여러 과제 상태 일괄 변경
   */
  async batchUpdateStatus(
    assignmentIds: string[], 
    status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  ): Promise<{ updatedCount: number; failedIds: string[]; }> {
    return httpClient.post<{ updatedCount: number; failedIds: string[]; }>(
      `${this.baseUrl}/batch/status`, 
      { assignmentIds, status }
    );
  }

  /**
   * 여러 과제 삭제
   */
  async batchDeleteAssignments(
    assignmentIds: string[]
  ): Promise<{ deletedCount: number; failedIds: string[]; }> {
    return httpClient.post<{ deletedCount: number; failedIds: string[]; }>(
      `${this.baseUrl}/batch/delete`, 
      { assignmentIds }
    );
  }
}

// 싱글톤 인스턴스 Export
export const assignmentApi = new AssignmentApiService();
export default assignmentApi;