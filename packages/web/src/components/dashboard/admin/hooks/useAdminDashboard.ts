import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminDashboardData } from '../types';

// TODO: 실제 GetAdminDashboardUseCase와 연동
// 현재는 Mock 데이터 사용
const mockAdminDashboardData: AdminDashboardData = {
  profile: {
    id: 'admin-1',
    name: '관리자',
    displayName: '시스템 관리자',
    role: 'admin',
    avatarUrl: undefined
  },
  systemStatistics: {
    totalUsers: 1247,
    totalStudents: 1089,
    totalTeachers: 158,
    totalClasses: 89,
    activeClasses: 76,
    totalProblems: 15420,
    totalProblemSets: 342,
    systemUptime: 720.5, // 30일
    dailyActiveUsers: 892
  },
  classOverviews: [
    {
      id: 'class-1',
      name: '중학교 1학년 3반',
      teacherId: 'teacher-1',
      teacherName: '김선생',
      totalStudents: 28,
      activeStudents: 26,
      averagePerformance: 84.5,
      averageStudyTime: 45,
      lastActivity: '2025-09-02T10:30:00Z',
      status: 'active',
      createdAt: '2025-08-15T09:00:00Z'
    },
    {
      id: 'class-2',
      name: '중학교 2학년 1반',
      teacherId: 'teacher-2',
      teacherName: '이선생',
      totalStudents: 30,
      activeStudents: 28,
      averagePerformance: 78.2,
      averageStudyTime: 52,
      lastActivity: '2025-09-02T11:15:00Z',
      status: 'active',
      createdAt: '2025-08-10T10:00:00Z'
    },
    {
      id: 'class-3',
      name: '중학교 3학년 2반',
      teacherId: 'teacher-3',
      teacherName: '박선생',
      totalStudents: 25,
      activeStudents: 18,
      averagePerformance: 65.8,
      averageStudyTime: 32,
      lastActivity: '2025-09-01T16:20:00Z',
      status: 'inactive',
      createdAt: '2025-08-05T14:00:00Z'
    }
  ],
  teacherOverviews: [
    {
      id: 'teacher-1',
      name: '김선생',
      email: 'kim.teacher@school.edu',
      classCount: 2,
      totalStudents: 56,
      averageClassPerformance: 82.1,
      lastLogin: '2025-09-02T09:30:00Z',
      status: 'active',
      registrationDate: '2025-08-10T00:00:00Z',
      problemSetsCreated: 15
    },
    {
      id: 'teacher-2',
      name: '이선생',
      email: 'lee.teacher@school.edu',
      classCount: 3,
      totalStudents: 85,
      averageClassPerformance: 76.8,
      lastLogin: '2025-09-02T08:45:00Z',
      status: 'active',
      registrationDate: '2025-08-05T00:00:00Z',
      problemSetsCreated: 23
    },
    {
      id: 'teacher-pending',
      name: '신규선생',
      email: 'new.teacher@school.edu',
      classCount: 0,
      totalStudents: 0,
      averageClassPerformance: 0,
      lastLogin: '2025-09-01T15:00:00Z',
      status: 'pending_approval',
      registrationDate: '2025-09-01T00:00:00Z',
      problemSetsCreated: 0
    }
  ],
  systemAlerts: [
    {
      id: 'alert-1',
      type: 'performance_issue',
      severity: 'medium',
      title: '캐시 히트율 저하',
      description: '최근 1시간 동안 캐시 히트율이 70% 아래로 떨어졌습니다.',
      timestamp: '2025-09-02T10:45:00Z',
      resolved: false,
      affectedComponents: ['cache-service', 'dashboard-service']
    },
    {
      id: 'alert-2',
      type: 'high_traffic',
      severity: 'low',
      title: '특정 반 대량 접속 감지',
      description: '중학교 1학년 3반에서 동시 접속자 수가 평소의 3배로 증가했습니다.',
      timestamp: '2025-09-02T09:20:00Z',
      resolved: true,
      relatedClassId: 'class-1'
    },
    {
      id: 'alert-3',
      type: 'batch_failure',
      severity: 'high',
      title: 'SRS 배치 작업 실패',
      description: '오늘 새벽 SRS 복습 일정 갱신 작업이 실패했습니다.',
      timestamp: '2025-09-02T03:00:00Z',
      resolved: false,
      affectedComponents: ['srs-service', 'batch-processor']
    }
  ],
  contentQualityMetrics: {
    pendingProblems: 23,
    approvedProblems: 15397,
    rejectedProblems: 156,
    popularProblemSets: [
      {
        id: 'ps-popular-1',
        title: '중학교 수학 기초',
        usageCount: 89,
        averageRating: 4.6
      },
      {
        id: 'ps-popular-2', 
        title: '영어 필수 단어 300',
        usageCount: 76,
        averageRating: 4.4
      }
    ],
    underusedProblemSets: [
      {
        id: 'ps-unused-1',
        title: '고급 물리 실험',
        usageCount: 2,
        createdBy: '박선생'
      }
    ]
  },
  systemMetrics: {
    period: 'day',
    userActivityData: [
      { timestamp: '2025-09-01T00:00:00Z', activeUsers: 245, activeClasses: 42, newRegistrations: 12, loginCount: 567 },
      { timestamp: '2025-09-01T06:00:00Z', activeUsers: 189, activeClasses: 38, newRegistrations: 3, loginCount: 234 },
      { timestamp: '2025-09-01T12:00:00Z', activeUsers: 892, activeClasses: 76, newRegistrations: 8, loginCount: 1245 },
      { timestamp: '2025-09-01T18:00:00Z', activeUsers: 634, activeClasses: 58, newRegistrations: 15, loginCount: 891 }
    ],
    performanceData: [
      { timestamp: '2025-09-01T00:00:00Z', responseTime: 245, errorRate: 0.2, cacheHitRate: 85.2, throughput: 120 },
      { timestamp: '2025-09-01T06:00:00Z', responseTime: 189, errorRate: 0.1, cacheHitRate: 88.7, throughput: 95 },
      { timestamp: '2025-09-01T12:00:00Z', responseTime: 298, errorRate: 0.3, cacheHitRate: 82.1, throughput: 280 },
      { timestamp: '2025-09-01T18:00:00Z', responseTime: 267, errorRate: 0.2, cacheHitRate: 84.5, throughput: 220 }
    ],
    learningActivityData: [
      { timestamp: '2025-09-01T00:00:00Z', problemsSolved: 1245, studyTimeMinutes: 15680, srsReviewsCompleted: 567, newProblemSetsCreated: 3 },
      { timestamp: '2025-09-01T06:00:00Z', problemsSolved: 892, studyTimeMinutes: 11240, srsReviewsCompleted: 423, newProblemSetsCreated: 1 },
      { timestamp: '2025-09-01T12:00:00Z', problemsSolved: 2156, studyTimeMinutes: 28900, srsReviewsCompleted: 891, newProblemSetsCreated: 7 },
      { timestamp: '2025-09-01T18:00:00Z', problemsSolved: 1634, studyTimeMinutes: 21450, srsReviewsCompleted: 672, newProblemSetsCreated: 4 }
    ],
    classPerformanceData: [
      { timestamp: '2025-09-01T00:00:00Z', averageAccuracy: 78.5, averageStudyTime: 42.3, activeClassCount: 42 },
      { timestamp: '2025-09-01T06:00:00Z', averageAccuracy: 81.2, averageStudyTime: 38.7, activeClassCount: 38 },
      { timestamp: '2025-09-01T12:00:00Z', averageAccuracy: 82.8, averageStudyTime: 45.6, activeClassCount: 76 },
      { timestamp: '2025-09-01T18:00:00Z', averageAccuracy: 79.9, averageStudyTime: 43.1, activeClassCount: 58 }
    ]
  },
  recentActivity: [
    {
      id: 'activity-1',
      type: 'teacher_registration',
      description: '신규선생님이 교사 계정을 신청했습니다.',
      timestamp: '2025-09-02T09:15:00Z',
      userId: 'teacher-pending',
      userName: '신규선생'
    },
    {
      id: 'activity-2',
      type: 'class_created',
      description: '중학교 1학년 4반이 새로 생성되었습니다.',
      timestamp: '2025-09-02T08:30:00Z',
      userId: 'teacher-1',
      userName: '김선생',
      classId: 'class-new',
      className: '중학교 1학년 4반'
    },
    {
      id: 'activity-3',
      type: 'content_approved',
      description: '수학 문제 15개가 검수 완료되어 승인되었습니다.',
      timestamp: '2025-09-02T07:45:00Z'
    }
  ],
  topPerformingClasses: [
    {
      classId: 'class-1',
      className: '중학교 1학년 3반',
      teacherName: '김선생',
      metrics: {
        totalStudents: 28,
        activeStudents: 26,
        averageAccuracy: 84.5,
        averageStudyTime: 45,
        problemSetCompletion: 89.2,
        srsCompletionRate: 76.8
      },
      topPerformingStudents: [
        { studentId: 'student-1', studentName: '김학생', accuracy: 95.2, studyTime: 67, streak: 14 },
        { studentId: 'student-2', studentName: '이학생', accuracy: 91.8, studyTime: 58, streak: 12 }
      ],
      strugglingStudents: [
        { studentId: 'student-3', studentName: '박학생', accuracy: 65.4, lastActivity: '2025-08-30T15:00:00Z', issueType: 'inactive' }
      ]
    }
  ],
  pendingApprovals: [
    {
      id: 'approval-1',
      type: 'teacher_registration',
      title: '신규선생 교사 계정 승인 요청',
      submittedBy: '신규선생',
      submittedAt: '2025-09-01T15:00:00Z',
      priority: 'medium'
    },
    {
      id: 'approval-2',
      type: 'problem_approval',
      title: '수학 심화 문제 23개 검수 요청',
      submittedBy: '김선생',
      submittedAt: '2025-09-01T10:30:00Z',
      priority: 'low'
    }
  ]
};

export const useAdminDashboard = (adminId: string, options?: {
  refreshInterval?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ['adminDashboard', adminId],
    queryFn: async (): Promise<AdminDashboardData> => {
      // TODO: 실제 GetAdminDashboardUseCase 연동
      // const result = await getAdminDashboardUseCase.execute({
      //   adminId,
      //   forceRefresh: false
      // });
      // 
      // if (result.isFailure) {
      //   throw new Error(result.error);
      // }
      // 
      // return result.getValue();

      // Mock API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockAdminDashboardData;
    },
    staleTime: 2 * 60 * 1000, // 2분간 캐시 유지 (더 자주 갱신)
    refetchInterval: options?.refreshInterval || 30 * 1000, // 30초마다 자동 갱신
    enabled: options?.enabled ?? true,
  });
};

export const useApproveTeacher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { 
      teacherId: string; 
      approved: boolean;
      reason?: string;
    }) => {
      // TODO: ApproveTeacherUseCase 연동
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, teacherId: params.teacherId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    }
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (_params: {
      className: string;
      teacherId: string;
      maxStudents?: number;
    }) => {
      // TODO: CreateClassUseCase 연동
      await new Promise(resolve => setTimeout(resolve, 500));
      return { classId: `class-${Date.now()}` };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    }
  });
};

export const useResolveAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      alertId: string;
      resolution?: string;
    }) => {
      // TODO: ResolveSystemAlertUseCase 연동
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, alertId: params.alertId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    }
  });
};