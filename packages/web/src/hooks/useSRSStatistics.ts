import { useState, useEffect, useCallback } from 'react';
import { srsApi, type GetReviewStatisticsRequest, type GetReviewStatisticsResponse, type StudyPatternsAnalysisRequest, type StudyPatternsAnalysisResponse } from '../services/api/srsApi';

// 훅 옵션 타입
export interface UseSRSStatisticsOptions {
  autoLoad?: boolean;  // 자동으로 통계 로드 여부
  refreshInterval?: number;  // 자동 새로고침 간격 (밀리초)
  defaultPeriod?: 'today' | 'week' | 'month' | 'all';  // 기본 기간
  includeNotifications?: boolean;  // 알림 통계 포함 여부
}

// 훅 상태 타입
export interface UseSRSStatisticsState {
  loading: boolean;  // 로딩 상태
  error: string | null;  // 오류 메시지
  
  // 통계 데이터
  statistics: GetReviewStatisticsResponse | null;  // 복습 통계
  studyPatterns: StudyPatternsAnalysisResponse | null;  // 학습 패턴 분석
  
  // 필터 상태
  currentPeriod: 'today' | 'week' | 'month' | 'all';  // 현재 선택된 기간
  includeNotifications: boolean;  // 알림 포함 여부
  
  // 분석 관련
  analysisLoading: boolean;  // 패턴 분석 로딩 상태
  analysisError: string | null;  // 패턴 분석 오류
}

// 훅 반환 타입
export interface UseSRSStatisticsReturn {
  // 상태
  state: UseSRSStatisticsState;
  
  // 빠른 접근
  statistics: GetReviewStatisticsResponse | null;
  studyPatterns: StudyPatternsAnalysisResponse | null;
  isLoading: boolean;
  hasData: boolean;
  
  // 액션들
  loadStatistics: (period?: 'today' | 'week' | 'month' | 'all', includeNotifications?: boolean) => Promise<void>;
  analyzeStudyPatterns: (request?: StudyPatternsAnalysisRequest) => Promise<void>;
  setPeriod: (period: 'today' | 'week' | 'month' | 'all') => Promise<void>;
  toggleNotifications: () => Promise<void>;
  
  // 유틸리티
  refresh: () => Promise<void>;
  clearError: () => void;
  clearAnalysisError: () => void;
  
  // 데이터 추출 헬퍼
  getProductivityLevel: () => 'excellent' | 'good' | 'fair' | 'needs_improvement' | null;
  getCompletionRate: () => number;
  getStreakDays: () => number;
  getTrends: () => {
    retentionTrend: 'improving' | 'stable' | 'declining' | null;
    speedTrend: 'improving' | 'stable' | 'declining' | null;
    consistencyScore: number;
  };
  getRecommendations: () => string[];
}

/**
 * SRS 통계 및 분석 관리 커스텀 훅
 * 
 * 이 훅은 간격 반복 시스템의 학습 통계와 패턴 분석을 관리합니다.
 * 복습 완료율, 학습 패턴, 성과 트렌드 등을 제공합니다.
 * 
 * @param options - 훅 설정 옵션
 * @returns SRS 통계 관련 상태와 액션들
 * 
 * @example
 * ```typescript
 * const {
 *   statistics,
 *   studyPatterns,
 *   loadStatistics,
 *   analyzeStudyPatterns,
 *   getProductivityLevel
 * } = useSRSStatistics({
 *   autoLoad: true,
 *   defaultPeriod: 'week',
 *   includeNotifications: true
 * });
 * ```
 */
export const useSRSStatistics = (options: UseSRSStatisticsOptions = {}): UseSRSStatisticsReturn => {
  const { 
    autoLoad = false, 
    refreshInterval, 
    defaultPeriod = 'all',
    includeNotifications = true 
  } = options;

  // 상태 관리
  const [state, setState] = useState<UseSRSStatisticsState>({
    loading: false,
    error: null,
    statistics: null,
    studyPatterns: null,
    currentPeriod: defaultPeriod,
    includeNotifications,
    analysisLoading: false,
    analysisError: null
  });

  // 통계 데이터 로드
  const loadStatistics = useCallback(async (
    period: 'today' | 'week' | 'month' | 'all' = state.currentPeriod,
    includeNotificationsParam: boolean = state.includeNotifications
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const request: GetReviewStatisticsRequest = {
        period,
        includeNotifications: includeNotificationsParam
      };
      
      const response = await srsApi.getReviewStatistics(request);
      
      setState(prev => ({
        ...prev,
        loading: false,
        statistics: response,
        currentPeriod: period,
        includeNotifications: includeNotificationsParam
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || error.message || '통계를 불러오는데 실패했습니다'
      }));
    }
  }, [state.currentPeriod, state.includeNotifications]);

  // 학습 패턴 분석
  const analyzeStudyPatterns = useCallback(async (request: StudyPatternsAnalysisRequest = {}) => {
    setState(prev => ({ ...prev, analysisLoading: true, analysisError: null }));
    
    try {
      const response = await srsApi.analyzeStudyPatterns(request);
      
      setState(prev => ({
        ...prev,
        analysisLoading: false,
        studyPatterns: response
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        analysisLoading: false,
        analysisError: error.response?.data?.message || error.message || '학습 패턴 분석에 실패했습니다'
      }));
    }
  }, []);

  // 기간 변경
  const setPeriod = useCallback(async (period: 'today' | 'week' | 'month' | 'all') => {
    await loadStatistics(period, state.includeNotifications);
  }, [loadStatistics, state.includeNotifications]);

  // 알림 포함 토글
  const toggleNotifications = useCallback(async () => {
    const newIncludeNotifications = !state.includeNotifications;
    await loadStatistics(state.currentPeriod, newIncludeNotifications);
  }, [loadStatistics, state.currentPeriod, state.includeNotifications]);

  // 유틸리티 함수들
  const refresh = useCallback(async () => {
    await Promise.all([
      loadStatistics(),
      state.studyPatterns ? analyzeStudyPatterns() : Promise.resolve()
    ]);
  }, [loadStatistics, analyzeStudyPatterns, state.studyPatterns]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearAnalysisError = useCallback(() => {
    setState(prev => ({ ...prev, analysisError: null }));
  }, []);

  // 데이터 추출 헬퍼 함수들
  const getProductivityLevel = useCallback((): 'excellent' | 'good' | 'fair' | 'needs_improvement' | null => {
    return state.statistics?.review?.productivity || null;
  }, [state.statistics]);

  const getCompletionRate = useCallback((): number => {
    return state.statistics?.review?.completionRate || 0;
  }, [state.statistics]);

  const getStreakDays = useCallback((): number => {
    return state.statistics?.review?.streakDays || 0;
  }, [state.statistics]);

  const getTrends = useCallback(() => {
    const trends = state.statistics?.trends;
    return {
      retentionTrend: trends?.retentionTrend || null,
      speedTrend: trends?.speedTrend || null,
      consistencyScore: trends?.consistencyScore || 0
    };
  }, [state.statistics]);

  const getRecommendations = useCallback((): string[] => {
    return state.statistics?.recommendations || [];
  }, [state.statistics]);

  // 자동 로드 효과
  useEffect(() => {
    if (autoLoad) {
      loadStatistics();
    }
  }, [autoLoad, loadStatistics]);

  // 자동 새로고침 효과
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, refresh]);

  // 빠른 접근을 위한 계산된 값들
  const isLoading = state.loading || state.analysisLoading;
  const hasData = state.statistics !== null;

  return {
    // 상태
    state,
    
    // 빠른 접근
    statistics: state.statistics,
    studyPatterns: state.studyPatterns,
    isLoading,
    hasData,
    
    // 액션들
    loadStatistics,
    analyzeStudyPatterns,
    setPeriod,
    toggleNotifications,
    
    // 유틸리티
    refresh,
    clearError,
    clearAnalysisError,
    
    // 데이터 추출 헬퍼
    getProductivityLevel,
    getCompletionRate,
    getStreakDays,
    getTrends,
    getRecommendations
  };
};