import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Select } from '../ui/Select';
import { useSRSStatistics } from '../../hooks';
import type { GetReviewStatisticsResponse } from '../../services/api/srsApi';

// 컴포넌트 props 타입
interface SRSStatisticsDashboardProps {
  className?: string;
  showStudyPatterns?: boolean;  // 학습 패턴 분석 표시 여부
  autoRefresh?: boolean;  // 자동 새로고침 여부
  refreshInterval?: number;  // 새로고침 간격 (밀리초)
}

// 생산성 레벨에 따른 색상 및 메시지
const productivityConfig = {
  excellent: {
    color: 'success',
    message: '훌륭한 학습 성과를 보이고 있습니다!',
    icon: '🎉'
  },
  good: {
    color: 'primary',
    message: '좋은 학습 패턴을 유지하고 있습니다.',
    icon: '👍'
  },
  fair: {
    color: 'warning',
    message: '학습 패턴을 개선해보세요.',
    icon: '💪'
  },
  needs_improvement: {
    color: 'danger',
    message: '더 꾸준한 학습이 필요합니다.',
    icon: '📚'
  }
} as const;

/**
 * SRS 통계 대시보드 컴포넌트
 * 
 * 사용자의 복습 통계와 학습 패턴을 시각적으로 표시하는 대시보드입니다.
 * 완료율, 연속 학습일, 효율성 등의 지표를 제공합니다.
 */
export const SRSStatisticsDashboard: React.FC<SRSStatisticsDashboardProps> = ({
  className = '',
  showStudyPatterns = true,
  autoRefresh = false,
  refreshInterval = 300000 // 5분
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const {
    statistics,
    studyPatterns,
    isLoading,
    loadStatistics,
    analyzeStudyPatterns,
    setPeriod,
    getProductivityLevel,
    getCompletionRate,
    getStreakDays,
    getTrends,
    getRecommendations,
    state
  } = useSRSStatistics({
    autoLoad: true,
    refreshInterval: autoRefresh ? refreshInterval : undefined,
    defaultPeriod: selectedPeriod,
    includeNotifications: true
  });

  // 기간 변경 처리
  const handlePeriodChange = async (period: string) => {
    const newPeriod = period as 'today' | 'week' | 'month' | 'all';
    setSelectedPeriod(newPeriod);
    await setPeriod(newPeriod);
  };

  // 학습 패턴 분석 로드
  useEffect(() => {
    if (showStudyPatterns && !studyPatterns && !state.analysisLoading) {
      analyzeStudyPatterns({
        timeRangeInDays: selectedPeriod === 'today' ? 1 : 
                        selectedPeriod === 'week' ? 7 :
                        selectedPeriod === 'month' ? 30 : 90,
        includeComparisons: true,
        analysisDepth: 'standard'
      });
    }
  }, [showStudyPatterns, studyPatterns, selectedPeriod, analyzeStudyPatterns, state.analysisLoading]);

  // 로딩 상태
  if (isLoading && !statistics) {
    return (
      <div className={`srs-statistics-dashboard ${className}`}>
        <Card>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // 오류 상태
  if (state.error) {
    return (
      <div className={`srs-statistics-dashboard ${className}`}>
        <Card variant="danger">
          <div className="text-center py-6">
            <p className="text-red-600 mb-4">{state.error}</p>
            <Button onClick={() => loadStatistics()} variant="primary">
              다시 시도
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!statistics) return null;

  const productivity = getProductivityLevel();
  const completionRate = getCompletionRate();
  const streakDays = getStreakDays();
  const trends = getTrends();
  const recommendations = getRecommendations();

  const productivityInfo = productivity ? productivityConfig[productivity] : null;

  return (
    <div className={`srs-statistics-dashboard ${className}`}>
      {/* 헤더 - 기간 선택 */}
      <div className="dashboard-header mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">학습 통계</h2>
          
          <div className="flex items-center gap-3">
            <Select
              value={selectedPeriod}
              onChange={handlePeriodChange}
              size="sm"
            >
              <option value="today">오늘</option>
              <option value="week">이번 주</option>
              <option value="month">이번 달</option>
              <option value="all">전체</option>
            </Select>
            
            <Button
              onClick={() => loadStatistics()}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? '새로고침 중...' : '새로고침'}
            </Button>
          </div>
        </div>
      </div>

      {/* 주요 지표 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 완료율 */}
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {completionRate}%
            </div>
            <div className="text-sm text-gray-600 mb-3">완료율</div>
            <Progress value={completionRate} size="sm" />
          </div>
        </Card>

        {/* 연속 학습일 */}
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {streakDays}일
            </div>
            <div className="text-sm text-gray-600">연속 학습</div>
            <div className="text-xs text-gray-500 mt-1">
              {streakDays >= 7 ? '일주일 달성!' : `${7 - streakDays}일 더`}
            </div>
          </div>
        </Card>

        {/* 평균 정답률 */}
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {statistics.review.averageRetention}%
            </div>
            <div className="text-sm text-gray-600">평균 정답률</div>
            <div className="text-xs text-gray-500 mt-1">
              {trends.retentionTrend === 'improving' ? '📈 상승' : 
               trends.retentionTrend === 'declining' ? '📉 하락' : '➡️ 유지'}
            </div>
          </div>
        </Card>

        {/* 효율성 */}
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {statistics.review.efficiency}
            </div>
            <div className="text-sm text-gray-600">효율성 점수</div>
            <div className="text-xs text-gray-500 mt-1">
              문제/분
            </div>
          </div>
        </Card>
      </div>

      {/* 생산성 평가 */}
      {productivityInfo && (
        <Card className="mb-6" variant={productivityInfo.color}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{productivityInfo.icon}</span>
            <div>
              <h3 className="font-semibold text-lg">
                {productivity?.toUpperCase()} 레벨
              </h3>
              <p className="text-sm">{productivityInfo.message}</p>
            </div>
          </div>
        </Card>
      )}

      {/* 상세 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 복습 현황 */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">복습 현황</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>오늘 예정된 복습</span>
              <span className="font-medium">{statistics.review.dueToday}개</span>
            </div>
            <div className="flex justify-between">
              <span>완료한 복습</span>
              <span className="font-medium text-green-600">
                {statistics.review.completedToday}개
              </span>
            </div>
            <div className="flex justify-between">
              <span>연체된 복습</span>
              <span className="font-medium text-red-600">
                {statistics.review.overdue}개
              </span>
            </div>
            <div className="flex justify-between">
              <span>총 복습 시간</span>
              <span className="font-medium">
                {Math.round(statistics.review.totalTimeSpent / 60)}분
              </span>
            </div>
          </div>
        </Card>

        {/* 트렌드 분석 */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">학습 트렌드</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>기억 보존</span>
              <Badge 
                variant={trends.retentionTrend === 'improving' ? 'success' : 
                        trends.retentionTrend === 'declining' ? 'danger' : 'secondary'}
              >
                {trends.retentionTrend === 'improving' ? '상승' : 
                 trends.retentionTrend === 'declining' ? '하락' : '유지'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>응답 속도</span>
              <Badge 
                variant={trends.speedTrend === 'improving' ? 'success' : 
                        trends.speedTrend === 'declining' ? 'danger' : 'secondary'}
              >
                {trends.speedTrend === 'improving' ? '향상' : 
                 trends.speedTrend === 'declining' ? '저하' : '유지'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>일관성 점수</span>
              <div className="flex items-center gap-2">
                <Progress value={trends.consistencyScore} size="xs" className="w-16" />
                <span className="text-sm">{trends.consistencyScore}점</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 학습 패턴 분석 (선택적) */}
      {showStudyPatterns && studyPatterns && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">학습 패턴 분석</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">주요 패턴</h4>
              <div className="space-y-2 text-sm">
                <div>선호 시간대: {studyPatterns.patterns.peakHours.join(', ')}</div>
                <div>평균 세션: {studyPatterns.patterns.sessionDuration}분</div>
                <div>학습 빈도: {studyPatterns.patterns.frequency}</div>
                <div>선호 난이도: {studyPatterns.patterns.preferredDifficulty}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">분석 결과</h4>
              <div className="space-y-1 text-sm text-gray-600">
                {studyPatterns.insights.map((insight, index) => (
                  <div key={index}>• {insight}</div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 개선 제안 */}
      {recommendations.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">개선 제안</h3>
          <div className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">💡</span>
                <span className="text-sm text-gray-700">{recommendation}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

SRSStatisticsDashboard.displayName = 'SRSStatisticsDashboard';

export default SRSStatisticsDashboard;