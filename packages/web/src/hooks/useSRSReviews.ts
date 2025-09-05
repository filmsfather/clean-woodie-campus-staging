import { useState, useEffect, useCallback } from 'react';
import { srsApi, type ReviewQueueItem, type ReviewFeedback, type GetTodayReviewsResponse, type SubmitReviewFeedbackResponse } from '../services/api/srsApi';

// 훅 옵션 타입
export interface UseSRSReviewsOptions {
  autoLoad?: boolean;  // 자동으로 리뷰 로드 여부
  refreshInterval?: number;  // 자동 새로고침 간격 (밀리초)
  onReviewCompleted?: (result: SubmitReviewFeedbackResponse) => void;  // 리뷰 완료 콜백
}

// 훅 상태 타입
export interface UseSRSReviewsState {
  loading: boolean;  // 로딩 상태
  error: string | null;  // 오류 메시지
  submitting: boolean;  // 피드백 제출 중 상태
  submitError: string | null;  // 제출 오류 메시지
  
  // 복습 큐 데이터
  reviews: ReviewQueueItem[];  // 복습 항목 목록
  totalCount: number;  // 전체 복습 개수
  highPriorityCount: number;  // 높은 우선순위 복습 개수
  overdueCount: number;  // 연체된 복습 개수
  upcomingCount: number;  // 곧 예정된 복습 개수
  
  // 현재 복습
  currentReviewIndex: number;  // 현재 복습 인덱스
  currentReview: ReviewQueueItem | null;  // 현재 복습 항목
}

// 훅 반환 타입
export interface UseSRSReviewsReturn {
  // 상태
  state: UseSRSReviewsState;
  
  // 자주 사용하는 데이터에 빠른 접근
  reviews: ReviewQueueItem[];
  currentReview: ReviewQueueItem | null;
  hasReviews: boolean;  // 복습이 있는지 여부
  isLoading: boolean;   // 로딩 중인지 여부
  isSubmitting: boolean;  // 제출 중인지 여부
  
  // 액션들
  loadTodayReviews: () => Promise<void>;  // 오늘의 복습 로드
  submitReviewFeedback: (scheduleId: string, feedback: ReviewFeedback) => Promise<SubmitReviewFeedbackResponse | null>;  // 복습 피드백 제출
  nextReview: () => void;  // 다음 복습으로 이동
  previousReview: () => void;  // 이전 복습으로 이동
  goToReview: (index: number) => void;  // 특정 복습으로 이동
  markReviewCompleted: (scheduleId: string) => void;  // 복습 완료 표시
  
  // 유틸리티
  refresh: () => Promise<void>;  // 새로고침
  clearError: () => void;  // 오류 메시지 지우기
  clearSubmitError: () => void;  // 제출 오류 메시지 지우기
  resetCurrentReview: () => void;  // 현재 복습 리셋
  
  // 통계
  getReviewProgress: () => {
    completed: number;      // 완료한 복습 수
    remaining: number;      // 남은 복습 수
    progressPercent: number;  // 진행률 (백분율)
  };
}

/**
 * SRS 복습 관리 커스텀 훅
 * 
 * 이 훅은 간격 반복 시스템(Spaced Repetition System)의 복습 기능을 관리합니다.
 * 오늘의 복습 항목을 불러오고, 피드백을 제출하며, 복습 진행을 관리할 수 있습니다.
 * 
 * @param options - 훅 설정 옵션
 * @returns SRS 복습 관련 상태와 액션들
 * 
 * @example
 * ```typescript
 * const {
 *   reviews,
 *   currentReview,
 *   loadTodayReviews,
 *   submitReviewFeedback,
 *   nextReview,
 *   state
 * } = useSRSReviews({
 *   autoLoad: true,
 *   onReviewCompleted: (result) => {
 *     console.log('복습 완료:', result);
 *   }
 * });
 * ```
 */
export const useSRSReviews = (options: UseSRSReviewsOptions = {}): UseSRSReviewsReturn => {
  const { autoLoad = false, refreshInterval, onReviewCompleted } = options;

  // 상태 관리
  const [state, setState] = useState<UseSRSReviewsState>({
    loading: false,
    error: null,
    submitting: false,
    submitError: null,
    reviews: [],
    totalCount: 0,
    highPriorityCount: 0,
    overdueCount: 0,
    upcomingCount: 0,
    currentReviewIndex: 0,
    currentReview: null
  });

  // 완료한 복습들을 추적하는 상태
  const [completedReviews, setCompletedReviews] = useState<Set<string>>(new Set());

  // 오늘의 복습 불러오기
  const loadTodayReviews = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response: GetTodayReviewsResponse = await srsApi.getTodayReviews();
      
      setState(prev => ({
        ...prev,
        loading: false,
        reviews: response.reviews,
        totalCount: response.totalCount,
        highPriorityCount: response.highPriorityCount,
        overdueCount: response.overdueCount,
        upcomingCount: response.upcomingCount,
        currentReview: response.reviews.length > 0 ? response.reviews[0] : null,
        currentReviewIndex: 0
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || error.message || '오늘의 복습을 불러오는데 실패했습니다'
      }));
    }
  }, []);

  // 복습 피드백 제출
  const submitReviewFeedback = useCallback(async (
    scheduleId: string, 
    feedback: ReviewFeedback
  ): Promise<SubmitReviewFeedbackResponse | null> => {
    setState(prev => ({ ...prev, submitting: true, submitError: null }));
    
    try {
      const response = await srsApi.submitReviewFeedback(scheduleId, feedback);
      
      // 완료로 표시
      setCompletedReviews(prev => new Set([...prev, scheduleId]));
      
      // 완료 콜백 호출
      if (onReviewCompleted) {
        onReviewCompleted(response);
      }
      
      setState(prev => ({ ...prev, submitting: false }));
      
      return response;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        submitting: false,
        submitError: error.response?.data?.message || error.message || '리뷰 피드백 제출에 실패했습니다'
      }));
      return null;
    }
  }, [onReviewCompleted]);

  // 다음 복습으로 이동
  const nextReview = useCallback(() => {
    setState(prev => {
      const nextIndex = Math.min(prev.currentReviewIndex + 1, prev.reviews.length - 1);
      return {
        ...prev,
        currentReviewIndex: nextIndex,
        currentReview: prev.reviews[nextIndex] || null
      };
    });
  }, []);

  // 이전 복습으로 이동
  const previousReview = useCallback(() => {
    setState(prev => {
      const prevIndex = Math.max(prev.currentReviewIndex - 1, 0);
      return {
        ...prev,
        currentReviewIndex: prevIndex,
        currentReview: prev.reviews[prevIndex] || null
      };
    });
  }, []);

  // 특정 복습으로 이동
  const goToReview = useCallback((index: number) => {
    setState(prev => {
      const validIndex = Math.max(0, Math.min(index, prev.reviews.length - 1));
      return {
        ...prev,
        currentReviewIndex: validIndex,
        currentReview: prev.reviews[validIndex] || null
      };
    });
  }, []);

  // 복습을 완료로 표시 (UI에서만)
  const markReviewCompleted = useCallback((scheduleId: string) => {
    setCompletedReviews(prev => new Set([...prev, scheduleId]));
  }, []);

  // 유틸리티 함수들
  const refresh = useCallback(async () => {
    await loadTodayReviews();
  }, [loadTodayReviews]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearSubmitError = useCallback(() => {
    setState(prev => ({ ...prev, submitError: null }));
  }, []);

  const resetCurrentReview = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentReviewIndex: 0,
      currentReview: prev.reviews.length > 0 ? prev.reviews[0] : null
    }));
  }, []);

  // 복습 진행률 통계 가져오기
  const getReviewProgress = useCallback(() => {
    const completed = completedReviews.size;
    const total = state.totalCount;
    const remaining = Math.max(0, total - completed);
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completed,
      remaining,
      progressPercent
    };
  }, [completedReviews.size, state.totalCount]);

  // 자동 로드 효과
  useEffect(() => {
    if (autoLoad) {
      loadTodayReviews();
    }
  }, [autoLoad, loadTodayReviews]);

  // 자동 새로고침 효과
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        loadTodayReviews();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, loadTodayReviews]);

  // 빠른 접근을 위한 계산된 값들
  const hasReviews = state.reviews.length > 0;
  const isLoading = state.loading;
  const isSubmitting = state.submitting;

  return {
    // 상태
    state,
    
    // 빠른 접근
    reviews: state.reviews,
    currentReview: state.currentReview,
    hasReviews,
    isLoading,
    isSubmitting,
    
    // 액션들
    loadTodayReviews,
    submitReviewFeedback,
    nextReview,
    previousReview,
    goToReview,
    markReviewCompleted,
    
    // 유틸리티
    refresh,
    clearError,
    clearSubmitError,
    resetCurrentReview,
    getReviewProgress
  };
};