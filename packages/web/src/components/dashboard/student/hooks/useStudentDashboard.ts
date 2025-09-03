import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { StudentDashboardDto } from '@woodie/application';
import type { GetStudentDashboardResponse } from '@woodie/application';

// Application Layer DTO를 UI 타입으로 직접 사용 (DTO-First 원칙)
// TODO: 실제 GetStudentDashboardUseCase와 연동
const mockStudentDashboardResponse: GetStudentDashboardResponse = {
  dashboard: {
    studentId: 'student-1',
    todayTasks: [
      {
        problemId: 'prob-1',
        title: '복습 문제 15개',
        difficulty: 'medium',
        estimatedTime: 20
      },
      {
        problemId: 'prob-2', 
        title: '수학 1학년 - 방정식',
        difficulty: 'easy',
        estimatedTime: 30
      },
      {
        problemId: 'prob-3',
        title: '영어 단어 학습',
        difficulty: 'hard',
        estimatedTime: 15
      }
    ],
    reviewCount: 45,
    currentStreak: 7,
    longestStreak: 28,
    progressData: [
      { date: '2025-08-26', problemsSolved: 12, timeSpent: 45 },
      { date: '2025-08-27', problemsSolved: 8, timeSpent: 30 },
      { date: '2025-08-28', problemsSolved: 15, timeSpent: 60 },
      { date: '2025-08-29', problemsSolved: 10, timeSpent: 35 },
      { date: '2025-08-30', problemsSolved: 11, timeSpent: 40 },
      { date: '2025-08-31', problemsSolved: 14, timeSpent: 55 },
      { date: '2025-09-01', problemsSolved: 7, timeSpent: 25 }
    ],
    upcomingDeadlines: [
      {
        title: '중학교 수학 1학년',
        dueDate: '2025-09-15',
        type: 'assignment'
      },
      {
        title: '중간고사 대비',
        dueDate: '2025-09-10', 
        type: 'review'
      }
    ],
    lastUpdated: new Date().toISOString()
  },
  fromCache: false
};

export const useStudentDashboard = (studentId: string, options?: {
  refreshInterval?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ['studentDashboard', studentId],
    queryFn: async (): Promise<GetStudentDashboardResponse> => {
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

      // Mock API 호출 시뮬레이션 - Application DTO 그대로 반환
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockStudentDashboardResponse;
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
      
      // 태스크 라우팅 - 모든 태스크는 문제 풀이 페이지로
      navigate(`/study/problem/${taskId}`);
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