import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { StudentDashboardData } from '../types';

// TODO: 실제 GetStudentDashboardUseCase와 연동
// 현재는 Mock 데이터 사용
const mockStudentDashboardData: StudentDashboardData = {
  profile: {
    id: '1',
    name: '김학생',
    displayName: '김학생',
    gradeLevel: 10,
    avatarUrl: undefined
  },
  studyStreak: {
    currentStreak: 7,
    longestStreak: 28,
    lastStudyDate: new Date().toISOString(),
    weeklyPattern: [
      { date: '2025-08-26', studyMinutes: 45, completed: true, problemsSolved: 12 },
      { date: '2025-08-27', studyMinutes: 30, completed: true, problemsSolved: 8 },
      { date: '2025-08-28', studyMinutes: 60, completed: true, problemsSolved: 15 },
      { date: '2025-08-29', studyMinutes: 35, completed: true, problemsSolved: 10 },
      { date: '2025-08-30', studyMinutes: 40, completed: true, problemsSolved: 11 },
      { date: '2025-08-31', studyMinutes: 55, completed: true, problemsSolved: 14 },
      { date: '2025-09-01', studyMinutes: 25, completed: true, problemsSolved: 7 }
    ]
  },
  statistics: {
    totalStudyHours: 42.5,
    averageAccuracy: 87,
    problemsSolvedToday: 0,
    problemsSolvedTotal: 342,
    completedProblemSets: 3,
    totalActiveProblemSets: 5
  },
  todayTasks: [
    {
      id: 'task-1',
      type: 'srs_review',
      title: '복습 문제 15개',
      description: '어제 틀린 문제들을 다시 풀어보세요',
      estimatedMinutes: 20,
      priority: 'high',
      dueTime: '09:00'
    },
    {
      id: 'task-2',
      type: 'problem_set',
      title: '수학 1학년 - 방정식',
      description: '새로운 문제 10개',
      estimatedMinutes: 30,
      priority: 'medium'
    },
    {
      id: 'task-3',
      type: 'new_problems',
      title: '영어 단어 학습',
      description: '새로운 단어 20개 학습',
      estimatedMinutes: 15,
      priority: 'low'
    }
  ],
  reviewQueue: {
    totalCount: 45,
    urgentCount: 15,
    items: [
      {
        problemId: 'prob-1',
        title: '일차방정식 문제',
        nextReviewDate: new Date().toISOString(),
        difficulty: 'medium',
        previousAccuracy: 60
      },
      {
        problemId: 'prob-2',
        title: '영어 단어: achieve',
        nextReviewDate: new Date().toISOString(),
        difficulty: 'hard',
        previousAccuracy: 40
      }
    ]
  },
  activeProblemSets: [
    {
      id: 'ps-1',
      title: '중학교 수학 1학년',
      completionRate: 0.75,
      accuracyRate: 0.88,
      lastStudied: '2025-09-01T10:30:00Z',
      totalProblems: 100,
      completedProblems: 75,
      assignedBy: '김선생님',
      deadline: '2025-09-15'
    },
    {
      id: 'ps-2',
      title: '영어 기초 단어',
      completionRate: 1.0,
      accuracyRate: 0.82,
      lastStudied: '2025-08-30T14:20:00Z',
      totalProblems: 200,
      completedProblems: 200
    }
  ],
  progressData: [
    { date: '2025-08-26', studyMinutes: 45, problemsSolved: 12, accuracy: 88, streakDay: 1 },
    { date: '2025-08-27', studyMinutes: 30, problemsSolved: 8, accuracy: 92, streakDay: 2 },
    { date: '2025-08-28', studyMinutes: 60, problemsSolved: 15, accuracy: 85, streakDay: 3 },
    { date: '2025-08-29', studyMinutes: 35, problemsSolved: 10, accuracy: 90, streakDay: 4 },
    { date: '2025-08-30', studyMinutes: 40, problemsSolved: 11, accuracy: 87, streakDay: 5 },
    { date: '2025-08-31', studyMinutes: 55, problemsSolved: 14, accuracy: 83, streakDay: 6 },
    { date: '2025-09-01', studyMinutes: 25, problemsSolved: 7, accuracy: 95, streakDay: 7 }
  ],
  upcomingDeadlines: [
    {
      type: 'problem_set',
      title: '중학교 수학 1학년',
      deadline: '2025-09-15',
      progress: 75,
      urgent: false
    },
    {
      type: 'test',
      title: '중간고사 대비',
      deadline: '2025-09-10',
      progress: 45,
      urgent: true
    }
  ]
};

export const useStudentDashboard = (studentId: string, options?: {
  refreshInterval?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ['studentDashboard', studentId],
    queryFn: async (): Promise<StudentDashboardData> => {
      // TODO: 실제 GetStudentDashboardUseCase 연동
      // const result = await getStudentDashboardUseCase.execute({
      //   studentId,
      //   forceRefresh: false
      // });
      // 
      // if (result.isFailure) {
      //   throw new Error(result.error);
      // }
      // 
      // return result.getValue();

      // Mock API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockStudentDashboardData;
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchInterval: options?.refreshInterval || 30 * 1000, // 30초마다 자동 갱신
    enabled: options?.enabled ?? true,
  });
};

export const useStartStudySession = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      // TODO: StartStudySessionUseCase 연동
      // return await startStudySessionUseCase.execute({ taskId });
      
      // Mock 구현
      await new Promise(resolve => setTimeout(resolve, 500));
      return { sessionId: `session-${Date.now()}`, taskId };
    },
    onSuccess: (data, taskId) => {
      // 대시보드 데이터 무효화하여 새로고침
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      
      // 태스크 타입에 따른 라우팅
      const task = mockStudentDashboardData.todayTasks.find(t => t.id === taskId);
      if (task?.type === 'srs_review') {
        navigate('/study/review');
      } else if (task?.type === 'problem_set') {
        navigate(`/study/problem-set/${taskId}`);
      } else {
        navigate(`/study/session/${data.sessionId}`);
      }
    }
  });
};

export const useStartReview = () => {
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async () => {
      // TODO: SRS 복습 시작 UseCase 연동
      await new Promise(resolve => setTimeout(resolve, 300));
      return { reviewSessionId: `review-${Date.now()}` };
    },
    onSuccess: () => {
      navigate('/study/review');
    }
  });
};

export const useStartProblemSet = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async (problemSetId: string) => {
      // TODO: StartProblemSetUseCase 연동
      // return await startProblemSetUseCase.execute({ problemSetId });
      
      // Mock 구현
      await new Promise(resolve => setTimeout(resolve, 500));
      return { sessionId: `problem-set-${Date.now()}`, problemSetId };
    },
    onSuccess: (data, problemSetId) => {
      // 대시보드 데이터 무효화하여 새로고침
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      
      // 문제집 풀이 세션으로 이동
      navigate(`/study/problem-set/${problemSetId}/session/${data.sessionId}`);
    }
  });
};