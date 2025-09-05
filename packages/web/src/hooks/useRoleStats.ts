import { useState, useEffect, useCallback } from 'react';
import { roleApi } from '../services/api';
import { RoleStatistics } from '../types/auth';

/**
 * useRoleStats - 역할 통계 관리를 위한 커스텀 훅
 * 
 * RoleStatisticsDashboard 컴포넌트와 연결
 * GetRoleStatisticsUseCase와 연동
 */

interface UseRoleStatsOptions {
  organizationId?: string;
  schoolId?: string;
  autoLoad?: boolean;
  refreshInterval?: number; // 자동 새로고침 간격 (ms)
}

interface UseRoleStatsState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface DetailedRoleStatistics extends RoleStatistics {
  trends: {
    studentGrowth: number;
    teacherGrowth: number;
    adminGrowth: number;
    totalGrowth: number;
  };
  distribution: {
    byGrade: Array<{
      grade: number;
      count: number;
    }>;
    bySchool: Array<{
      schoolId: string;
      schoolName: string;
      count: number;
    }>;
  };
  recentActivity: Array<{
    date: string;
    newUsers: number;
    deletedUsers: number;
    roleChanges: number;
  }>;
}

interface RoleChangeHistoryItem {
  id: string;
  userId: string;
  targetUserId: string;
  targetUserName: string;
  targetUserEmail: string;
  previousRole: 'student' | 'teacher' | 'admin';
  newRole: 'student' | 'teacher' | 'admin';
  reason?: string;
  timestamp: string;
}

interface UseRoleStatsReturn {
  // 기본 통계
  basicStats: RoleStatistics | null;
  detailedStats: DetailedRoleStatistics | null;
  state: UseRoleStatsState;
  
  // 역할 변경 이력
  roleChanges: RoleChangeHistoryItem[];
  roleChangesLoading: boolean;
  roleChangesError: string | null;
  
  // 액션
  loadBasicStats: () => Promise<void>;
  loadDetailedStats: () => Promise<void>;
  loadRoleChanges: (params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  refresh: () => Promise<void>;
  
  // 유틸리티
  getPercentage: (role: 'student' | 'teacher' | 'admin') => number;
  getTotalUsers: () => number;
  getMostActiveRole: () => 'student' | 'teacher' | 'admin' | null;
  getGrowthTrend: () => 'positive' | 'negative' | 'stable';
  
  // 필터링된 데이터
  getGradeDistribution: () => Array<{ grade: number; count: number; percentage: number }>;
  getSchoolDistribution: () => Array<{ schoolId: string; schoolName: string; count: number; percentage: number }>;
  getRecentActivity: (days?: number) => Array<{ date: string; newUsers: number; deletedUsers: number; roleChanges: number }>;
}

export const useRoleStats = (options: UseRoleStatsOptions = {}): UseRoleStatsReturn => {
  const {
    organizationId,
    schoolId,
    autoLoad = true,
    refreshInterval
  } = options;

  // 상태
  const [basicStats, setBasicStats] = useState<RoleStatistics | null>(null);
  const [detailedStats, setDetailedStats] = useState<DetailedRoleStatistics | null>(null);
  const [state, setState] = useState<UseRoleStatsState>({
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  // 역할 변경 이력
  const [roleChanges, setRoleChanges] = useState<RoleChangeHistoryItem[]>([]);
  const [roleChangesLoading, setRoleChangesLoading] = useState(false);
  const [roleChangesError, setRoleChangesError] = useState<string | null>(null);

  // 기본 통계 로드
  const loadBasicStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const stats = await roleApi.getBasicRoleStatistics(organizationId);
      setBasicStats(stats);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '기본 통계를 불러오는데 실패했습니다.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [organizationId]);

  // 상세 통계 로드
  const loadDetailedStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const params = {
        organizationId,
        schoolId,
        period: 'month' as const
      };
      
      const stats = await roleApi.getRoleStatistics(params);
      setDetailedStats(stats);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '상세 통계를 불러오는데 실패했습니다.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [organizationId, schoolId]);

  // 역할 변경 이력 로드
  const loadRoleChanges = useCallback(async (params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      setRoleChangesLoading(true);
      setRoleChangesError(null);
      
      const response = await roleApi.getRoleChangeHistory({
        ...params,
        limit: params?.limit || 50
      });
      
      setRoleChanges(response.changes);
      setRoleChangesLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '역할 변경 이력을 불러오는데 실패했습니다.';
      setRoleChangesError(errorMessage);
      setRoleChangesLoading(false);
    }
  }, []);

  // 모든 데이터 새로고침
  const refresh = useCallback(async () => {
    await Promise.all([
      loadBasicStats(),
      loadDetailedStats(),
      loadRoleChanges()
    ]);
  }, [loadBasicStats, loadDetailedStats, loadRoleChanges]);

  // 유틸리티 함수들
  const getPercentage = useCallback((role: 'student' | 'teacher' | 'admin') => {
    if (!basicStats || basicStats.totalUsers === 0) return 0;
    
    const count = basicStats[role === 'student' ? 'students' : role === 'teacher' ? 'teachers' : 'admins'];
    return Math.round((count / basicStats.totalUsers) * 100);
  }, [basicStats]);

  const getTotalUsers = useCallback(() => {
    return basicStats?.totalUsers || 0;
  }, [basicStats]);

  const getMostActiveRole = useCallback((): 'student' | 'teacher' | 'admin' | null => {
    if (!basicStats) return null;
    
    const { students, teachers, admins } = basicStats;
    const max = Math.max(students, teachers, admins);
    
    if (max === students) return 'student';
    if (max === teachers) return 'teacher';
    if (max === admins) return 'admin';
    
    return null;
  }, [basicStats]);

  const getGrowthTrend = useCallback((): 'positive' | 'negative' | 'stable' => {
    if (!detailedStats) return 'stable';
    
    const totalGrowth = detailedStats.trends.totalGrowth;
    
    if (totalGrowth > 5) return 'positive';
    if (totalGrowth < -5) return 'negative';
    return 'stable';
  }, [detailedStats]);

  // 필터링된 데이터
  const getGradeDistribution = useCallback(() => {
    if (!detailedStats || !detailedStats.distribution.byGrade) return [];
    
    const totalStudents = detailedStats.students;
    
    return detailedStats.distribution.byGrade.map(item => ({
      grade: item.grade,
      count: item.count,
      percentage: totalStudents > 0 ? Math.round((item.count / totalStudents) * 100) : 0
    }));
  }, [detailedStats]);

  const getSchoolDistribution = useCallback(() => {
    if (!detailedStats || !detailedStats.distribution.bySchool) return [];
    
    const totalUsers = detailedStats.totalUsers;
    
    return detailedStats.distribution.bySchool.map(item => ({
      schoolId: item.schoolId,
      schoolName: item.schoolName,
      count: item.count,
      percentage: totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0
    }));
  }, [detailedStats]);

  const getRecentActivity = useCallback((days: number = 7) => {
    if (!detailedStats || !detailedStats.recentActivity) return [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return detailedStats.recentActivity.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= cutoffDate;
    });
  }, [detailedStats]);

  // 자동 로드
  useEffect(() => {
    if (autoLoad) {
      loadBasicStats();
      loadDetailedStats();
    }
  }, [autoLoad]); // load 함수들은 의도적으로 제외

  // 자동 새로고침
  useEffect(() => {
    if (!refreshInterval) return;
    
    const interval = setInterval(() => {
      loadBasicStats();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval, loadBasicStats]);

  return {
    // 기본 통계
    basicStats,
    detailedStats,
    state,
    
    // 역할 변경 이력
    roleChanges,
    roleChangesLoading,
    roleChangesError,
    
    // 액션
    loadBasicStats,
    loadDetailedStats,
    loadRoleChanges,
    refresh,
    
    // 유틸리티
    getPercentage,
    getTotalUsers,
    getMostActiveRole,
    getGrowthTrend,
    
    // 필터링된 데이터
    getGradeDistribution,
    getSchoolDistribution,
    getRecentActivity
  };
};