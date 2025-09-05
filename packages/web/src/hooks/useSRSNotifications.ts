import { useState, useEffect, useCallback } from 'react';
import { srsApi, type NotificationSettings, type NotificationStatus } from '../services/api/srsApi';

// 훅 옵션 타입
export interface UseSRSNotificationsOptions {
  autoLoad?: boolean;  // 자동으로 알림 상태 로드 여부
  refreshInterval?: number;  // 자동 새로고침 간격 (밀리초)
  onSettingsChanged?: (settings: NotificationSettings) => void;  // 설정 변경 콜백
}

// 훅 상태 타입
export interface UseSRSNotificationsState {
  loading: boolean;  // 로딩 상태
  error: string | null;  // 오류 메시지
  saving: boolean;  // 설정 저장 중 상태
  saveError: string | null;  // 저장 오류 메시지
  
  // 알림 데이터
  status: NotificationStatus | null;  // 알림 상태
  settings: NotificationSettings | null;  // 알림 설정
}

// 훅 반환 타입
export interface UseSRSNotificationsReturn {
  // 상태
  state: UseSRSNotificationsState;
  
  // 빠른 접근
  status: NotificationStatus | null;
  settings: NotificationSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  hasUnreadNotifications: boolean;
  overdueCount: number;
  upcomingCount: number;
  
  // 액션들
  loadNotificationStatus: () => Promise<void>;
  loadNotificationSettings: () => Promise<void>;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  toggleNotifications: () => Promise<void>;
  toggleOverdueNotifications: () => Promise<void>;
  toggleReminderNotifications: () => Promise<void>;
  updateQuietHours: (start: string, end: string, enabled: boolean) => Promise<void>;
  updateDelaySettings: (overdueDelay: number, reminderAdvance: number) => Promise<void>;
  triggerOverdueNotification: () => Promise<void>;
  
  // 유틸리티
  refresh: () => Promise<void>;
  clearError: () => void;
  clearSaveError: () => void;
  
  // 헬퍼 함수들
  isNotificationEnabled: () => boolean;
  isInQuietHours: (time?: Date) => boolean;
  getNextNotificationTime: () => Date | null;
  formatLastChecked: () => string;
}

/**
 * SRS 알림 관리 커스텀 훅
 * 
 * 이 훅은 간격 반복 시스템의 알림 기능을 관리합니다.
 * 알림 설정, 연체 알림, 리마인더 등을 관리할 수 있습니다.
 * 
 * @param options - 훅 설정 옵션
 * @returns SRS 알림 관련 상태와 액션들
 * 
 * @example
 * ```typescript
 * const {
 *   status,
 *   settings,
 *   hasUnreadNotifications,
 *   toggleNotifications,
 *   updateQuietHours
 * } = useSRSNotifications({
 *   autoLoad: true,
 *   onSettingsChanged: (settings) => {
 *     console.log('알림 설정 변경됨:', settings);
 *   }
 * });
 * ```
 */
export const useSRSNotifications = (options: UseSRSNotificationsOptions = {}): UseSRSNotificationsReturn => {
  const { autoLoad = false, refreshInterval, onSettingsChanged } = options;

  // 상태 관리
  const [state, setState] = useState<UseSRSNotificationsState>({
    loading: false,
    error: null,
    saving: false,
    saveError: null,
    status: null,
    settings: null
  });

  // 알림 상태 로드
  const loadNotificationStatus = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await srsApi.getNotificationStatus();
      
      setState(prev => ({
        ...prev,
        loading: false,
        status: response
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || error.message || '알림 상태를 불러오는데 실패했습니다'
      }));
    }
  }, []);

  // 알림 설정 로드
  const loadNotificationSettings = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await srsApi.getNotificationSettings();
      
      setState(prev => ({
        ...prev,
        loading: false,
        settings: response
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || error.message || '알림 설정을 불러오는데 실패했습니다'
      }));
    }
  }, []);

  // 알림 설정 업데이트
  const updateNotificationSettings = useCallback(async (updates: Partial<NotificationSettings>) => {
    if (!state.settings) return;
    
    setState(prev => ({ ...prev, saving: true, saveError: null }));
    
    try {
      const response = await srsApi.updateNotificationSettings(updates);
      
      setState(prev => ({
        ...prev,
        saving: false,
        settings: response
      }));
      
      // 설정 변경 콜백 호출
      if (onSettingsChanged) {
        onSettingsChanged(response);
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        saving: false,
        saveError: error.response?.data?.message || error.message || '알림 설정 저장에 실패했습니다'
      }));
    }
  }, [state.settings, onSettingsChanged]);

  // 전체 알림 토글
  const toggleNotifications = useCallback(async () => {
    if (!state.settings) return;
    
    await updateNotificationSettings({
      enabled: !state.settings.enabled
    });
  }, [state.settings, updateNotificationSettings]);

  // 연체 알림 토글
  const toggleOverdueNotifications = useCallback(async () => {
    if (!state.settings) return;
    
    await updateNotificationSettings({
      overdueEnabled: !state.settings.overdueEnabled
    });
  }, [state.settings, updateNotificationSettings]);

  // 리마인더 알림 토글
  const toggleReminderNotifications = useCallback(async () => {
    if (!state.settings) return;
    
    await updateNotificationSettings({
      reminderEnabled: !state.settings.reminderEnabled
    });
  }, [state.settings, updateNotificationSettings]);

  // 조용한 시간 업데이트
  const updateQuietHours = useCallback(async (start: string, end: string, enabled: boolean) => {
    await updateNotificationSettings({
      quietHours: { start, end, enabled }
    });
  }, [updateNotificationSettings]);

  // 지연 설정 업데이트
  const updateDelaySettings = useCallback(async (overdueDelay: number, reminderAdvance: number) => {
    await updateNotificationSettings({
      overdueDelayMinutes: overdueDelay,
      reminderAdvanceMinutes: reminderAdvance
    });
  }, [updateNotificationSettings]);

  // 연체 알림 트리거 (수동)
  const triggerOverdueNotification = useCallback(async () => {
    try {
      await srsApi.triggerOverdueNotification();
      // 알림 상태 새로고침
      await loadNotificationStatus();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || error.message || '연체 알림 트리거에 실패했습니다'
      }));
    }
  }, [loadNotificationStatus]);

  // 유틸리티 함수들
  const refresh = useCallback(async () => {
    await Promise.all([
      loadNotificationStatus(),
      loadNotificationSettings()
    ]);
  }, [loadNotificationStatus, loadNotificationSettings]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearSaveError = useCallback(() => {
    setState(prev => ({ ...prev, saveError: null }));
  }, []);

  // 헬퍼 함수들
  const isNotificationEnabled = useCallback((): boolean => {
    return state.settings?.enabled || false;
  }, [state.settings]);

  const isInQuietHours = useCallback((time: Date = new Date()): boolean => {
    const quietHours = state.settings?.quietHours;
    if (!quietHours?.enabled) return false;

    const currentTime = time.toTimeString().slice(0, 5); // HH:MM 형식
    const start = quietHours.start;
    const end = quietHours.end;

    // 시간 비교 로직 (자정을 넘나드는 경우 고려)
    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  }, [state.settings]);

  const getNextNotificationTime = useCallback((): Date | null => {
    if (!state.status) return null;
    
    // 다음 알림 시간 계산 로직 (예시)
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    
    return isInQuietHours(nextHour) ? null : nextHour;
  }, [state.status, isInQuietHours]);

  const formatLastChecked = useCallback((): string => {
    if (!state.status?.lastChecked) return '확인되지 않음';
    
    const lastChecked = new Date(state.status.lastChecked);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastChecked.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일 전`;
  }, [state.status]);

  // 자동 로드 효과
  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [autoLoad, refresh]);

  // 자동 새로고침 효과
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        loadNotificationStatus(); // 상태만 주기적으로 새로고침
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, loadNotificationStatus]);

  // 빠른 접근을 위한 계산된 값들
  const isLoading = state.loading;
  const isSaving = state.saving;
  const hasUnreadNotifications = state.status?.hasUnreadNotifications || false;
  const overdueCount = state.status?.overdueCount || 0;
  const upcomingCount = state.status?.upcomingCount || 0;

  return {
    // 상태
    state,
    
    // 빠른 접근
    status: state.status,
    settings: state.settings,
    isLoading,
    isSaving,
    hasUnreadNotifications,
    overdueCount,
    upcomingCount,
    
    // 액션들
    loadNotificationStatus,
    loadNotificationSettings,
    updateNotificationSettings,
    toggleNotifications,
    toggleOverdueNotifications,
    toggleReminderNotifications,
    updateQuietHours,
    updateDelaySettings,
    triggerOverdueNotification,
    
    // 유틸리티
    refresh,
    clearError,
    clearSaveError,
    
    // 헬퍼 함수들
    isNotificationEnabled,
    isInQuietHours,
    getNextNotificationTime,
    formatLastChecked
  };
};