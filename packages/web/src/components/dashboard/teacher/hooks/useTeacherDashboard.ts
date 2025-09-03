import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { TeacherDashboardData } from '../types';

// TODO: 실제 GetTeacherDashboardUseCase와 연동
// 현재는 Mock 데이터 사용
const mockTeacherDashboardData: TeacherDashboardData = {
  profile: {
    id: 'teacher-1',
    name: '김선생',
    displayName: '김선생',
    subject: ['수학', '과학'],
    avatarUrl: undefined
  },
  classStatistics: {
    totalStudents: 28,
    activeStudents: 24,
    averageAccuracy: 82.5,
    totalProblemsAssigned: 450,
    totalCompletedProblems: 387,
    averageStudyTime: 45 // 분
  },
  studentProgress: [
    {
      id: 'student-1',
      name: '김학생',
      gradeLevel: 10,
      recentActivity: {
        lastLogin: '2025-09-02T09:30:00Z',
        problemsSolved: 12,
        studyTime: 35,
        accuracy: 88
      },
      currentStreak: 7,
      averageScore: 85,
      status: 'active'
    },
    {
      id: 'student-2', 
      name: '이학생',
      gradeLevel: 10,
      recentActivity: {
        lastLogin: '2025-09-01T14:20:00Z',
        problemsSolved: 8,
        studyTime: 25,
        accuracy: 92
      },
      currentStreak: 3,
      averageScore: 78,
      status: 'active'
    },
    {
      id: 'student-3',
      name: '박학생', 
      gradeLevel: 10,
      recentActivity: {
        lastLogin: '2025-08-30T16:45:00Z',
        problemsSolved: 3,
        studyTime: 15,
        accuracy: 65
      },
      currentStreak: 0,
      averageScore: 58,
      status: 'at_risk'
    }
  ],
  problemSetOverviews: [
    {
      id: 'ps-1',
      title: '중학교 수학 1학년 - 방정식',
      description: '일차방정식과 연립방정식 문제집',
      totalProblems: 25,
      assignedStudents: 28,
      completedStudents: 22,
      averageScore: 84,
      averageCompletionTime: 32,
      deadline: '2025-09-15',
      createdAt: '2025-08-28',
      difficulty: 'medium',
      subject: '수학'
    },
    {
      id: 'ps-2',
      title: '영어 기초 단어집',
      description: '중학교 필수 영어 단어 300개',
      totalProblems: 50,
      assignedStudents: 28,
      completedStudents: 18,
      averageScore: 76,
      averageCompletionTime: 45,
      deadline: '2025-09-20',
      createdAt: '2025-08-25',
      difficulty: 'easy',
      subject: '영어'
    }
  ],
  recentActivity: [
    {
      id: 'activity-1',
      type: 'problem_completed',
      studentId: 'student-1',
      studentName: '김학생',
      description: '수학 방정식 문제집 10문제 완료 (95% 정확도)',
      timestamp: '2025-09-02T10:30:00Z',
      metadata: {
        problemSetId: 'ps-1',
        accuracy: 95,
        timeSpent: 22
      }
    },
    {
      id: 'activity-2',
      type: 'student_achievement',
      studentId: 'student-2',
      studentName: '이학생',
      description: '5일 연속 학습 달성!',
      timestamp: '2025-09-02T09:15:00Z',
      metadata: {
        achievementType: 'streak'
      }
    },
    {
      id: 'activity-3',
      type: 'problem_completed',
      studentId: 'student-3',
      studentName: '박학생',
      description: '영어 단어집 3문제 완료 (67% 정확도)',
      timestamp: '2025-09-02T08:45:00Z',
      metadata: {
        problemSetId: 'ps-2',
        accuracy: 67,
        timeSpent: 15
      }
    }
  ],
  analytics: {
    period: 'week',
    studyTimeData: [
      { date: '2025-08-26', totalMinutes: 820, activeStudents: 22 },
      { date: '2025-08-27', totalMinutes: 945, activeStudents: 25 },
      { date: '2025-08-28', totalMinutes: 1120, activeStudents: 26 },
      { date: '2025-08-29', totalMinutes: 890, activeStudents: 23 },
      { date: '2025-08-30', totalMinutes: 1050, activeStudents: 24 },
      { date: '2025-08-31', totalMinutes: 760, activeStudents: 18 },
      { date: '2025-09-01', totalMinutes: 680, activeStudents: 20 }
    ],
    accuracyTrends: [
      { date: '2025-08-26', averageAccuracy: 78 },
      { date: '2025-08-27', averageAccuracy: 81 },
      { date: '2025-08-28', averageAccuracy: 83 },
      { date: '2025-08-29', averageAccuracy: 80 },
      { date: '2025-08-30', averageAccuracy: 85 },
      { date: '2025-08-31', averageAccuracy: 82 },
      { date: '2025-09-01', averageAccuracy: 84 }
    ],
    problemCompletionData: [
      { date: '2025-08-26', completed: 45, assigned: 50 },
      { date: '2025-08-27', completed: 62, assigned: 65 },
      { date: '2025-08-28', completed: 58, assigned: 70 },
      { date: '2025-08-29', completed: 51, assigned: 55 },
      { date: '2025-08-30', completed: 48, assigned: 60 },
      { date: '2025-08-31', completed: 35, assigned: 40 },
      { date: '2025-09-01', completed: 41, assigned: 45 }
    ],
    subjectPerformance: [
      { subject: '수학', averageScore: 84, totalProblems: 150, completedProblems: 128 },
      { subject: '영어', averageScore: 76, totalProblems: 200, completedProblems: 165 },
      { subject: '과학', averageScore: 82, totalProblems: 100, completedProblems: 94 }
    ]
  },
  alerts: [
    {
      id: 'alert-1',
      type: 'at_risk_student',
      priority: 'high',
      title: '학습 부진 학생 발견',
      description: '박학생이 최근 3일간 학습하지 않았습니다.',
      timestamp: '2025-09-02T09:00:00Z',
      actionRequired: true,
      relatedStudentId: 'student-3'
    },
    {
      id: 'alert-2',
      type: 'deadline_approaching',
      priority: 'medium',
      title: '문제집 마감일 임박',
      description: '수학 방정식 문제집 마감까지 13일 남았습니다. (78% 완료)',
      timestamp: '2025-09-02T08:30:00Z',
      actionRequired: false,
      relatedProblemSetId: 'ps-1'
    }
  ],
  upcomingDeadlines: [
    {
      problemSetId: 'ps-1',
      title: '중학교 수학 1학년 - 방정식',
      deadline: '2025-09-15',
      assignedStudents: 28,
      completedStudents: 22,
      urgent: false
    },
    {
      problemSetId: 'ps-2',
      title: '영어 기초 단어집',
      deadline: '2025-09-20',
      assignedStudents: 28,
      completedStudents: 18,
      urgent: false
    }
  ]
};

export const useTeacherDashboard = (teacherId: string, options?: {
  refreshInterval?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ['teacherDashboard', teacherId],
    queryFn: async (): Promise<TeacherDashboardData> => {
      // TODO: 실제 GetTeacherDashboardUseCase 연동
      // const result = await getTeacherDashboardUseCase.execute({
      //   teacherId,
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
      return mockTeacherDashboardData;
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchInterval: options?.refreshInterval || 60 * 1000, // 1분마다 자동 갱신
    enabled: options?.enabled ?? true,
  });
};

export const useAssignProblemSet = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async (params: { 
      problemSetId: string; 
      studentIds: string[];
      deadline?: string;
    }) => {
      // TODO: AssignProblemSetUseCase 연동
      await new Promise(resolve => setTimeout(resolve, 500));
      return { assignmentId: `assignment-${Date.now()}` };
    },
    onSuccess: () => {
      // 대시보드 데이터 무효화하여 새로고침
      queryClient.invalidateQueries({ queryKey: ['teacherDashboard'] });
    }
  });
};

export const useCreateProblemSet = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async (params: {
      title: string;
      description: string;
      problems: any[];
      difficulty: 'easy' | 'medium' | 'hard';
      subject: string;
    }) => {
      // TODO: CreateProblemSetUseCase 연동
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { problemSetId: `ps-${Date.now()}` };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacherDashboard'] });
      navigate(`/manage/problem-sets/${data.problemSetId}`);
    }
  });
};