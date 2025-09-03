import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Progress, Badge } from '../../ui';

export interface ProgressData {
  totalProblems: number;
  answeredProblems: number;
  correctAnswers?: number;
  bookmarkedProblems?: number;
  timeSpent?: number;
  timeLimit?: number;
}

export interface ProblemStatus {
  id: string;
  status: 'unanswered' | 'answered' | 'correct' | 'incorrect' | 'bookmarked' | 'current';
  timeSpent?: number;
}

export interface ProgressTrackerProps {
  progress: ProgressData;
  problemStatuses?: ProblemStatus[];
  showDetailedStats?: boolean;
  showProblemGrid?: boolean;
  showTimeStats?: boolean;
  variant?: 'compact' | 'detailed' | 'minimal';
  className?: string;
  onProblemClick?: (problemId: string) => void;
}

export function ProgressTracker({
  progress,
  problemStatuses = [],
  showDetailedStats = true,
  showProblemGrid = true,
  showTimeStats = true,
  variant = 'detailed',
  className = '',
  onProblemClick,
}: ProgressTrackerProps) {
  const stats = useMemo(() => {
    const completionRate = progress.totalProblems > 0 
      ? (progress.answeredProblems / progress.totalProblems) * 100 
      : 0;
    
    const accuracyRate = progress.answeredProblems > 0 && progress.correctAnswers !== undefined
      ? (progress.correctAnswers / progress.answeredProblems) * 100
      : undefined;

    const timeProgress = progress.timeLimit && progress.timeSpent
      ? (progress.timeSpent / progress.timeLimit) * 100
      : undefined;

    const averageTimePerProblem = progress.answeredProblems > 0 && progress.timeSpent
      ? Math.round(progress.timeSpent / progress.answeredProblems)
      : undefined;

    return {
      completionRate,
      accuracyRate,
      timeProgress,
      averageTimePerProblem,
    };
  }, [progress]);

  const getStatusIcon = (status: ProblemStatus['status']) => {
    switch (status) {
      case 'correct':
        return '✓';
      case 'incorrect':
        return '✗';
      case 'answered':
        return '●';
      case 'bookmarked':
        return '★';
      case 'current':
        return '▶';
      default:
        return '○';
    }
  };

  const getStatusColor = (status: ProblemStatus['status']) => {
    switch (status) {
      case 'correct':
        return 'bg-status-success text-white';
      case 'incorrect':
        return 'bg-status-error text-white';
      case 'answered':
        return 'bg-brand-500 text-white';
      case 'bookmarked':
        return 'bg-status-warning text-white';
      case 'current':
        return 'bg-brand-600 text-white animate-pulse';
      default:
        return 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Progress 
            value={stats.completionRate} 
            className="w-20 h-2" 
            variant={stats.completionRate >= 80 ? 'success' : 'default'}
          />
          <span className="text-sm text-text-secondary">
            {progress.answeredProblems}/{progress.totalProblems}
          </span>
        </div>
        {stats.accuracyRate !== undefined && (
          <Badge variant={stats.accuracyRate >= 80 ? 'success' : stats.accuracyRate >= 60 ? 'warning' : 'error'}>
            {stats.accuracyRate.toFixed(0)}%
          </Badge>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-text-primary">진행률</span>
              <span className="text-sm text-text-secondary">
                {progress.answeredProblems}/{progress.totalProblems} ({stats.completionRate.toFixed(0)}%)
              </span>
            </div>
            <Progress 
              value={stats.completionRate} 
              variant={stats.completionRate >= 80 ? 'success' : 'default'}
            />
            
            {stats.accuracyRate !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-text-primary">정답률</span>
                <Badge variant={stats.accuracyRate >= 80 ? 'success' : stats.accuracyRate >= 60 ? 'warning' : 'error'}>
                  {stats.accuracyRate.toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          📊 학습 진행상황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 전체 진행률 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-text-primary">전체 진행률</span>
            <span className="text-sm text-text-secondary">
              {progress.answeredProblems}/{progress.totalProblems} 문제 완료
            </span>
          </div>
          <Progress 
            value={stats.completionRate} 
            variant={stats.completionRate >= 80 ? 'success' : 'default'}
            className="h-3"
          />
          <div className="text-right">
            <Badge 
              variant={stats.completionRate >= 80 ? 'success' : stats.completionRate >= 50 ? 'warning' : 'error'}
              size="sm"
            >
              {stats.completionRate.toFixed(1)}% 완료
            </Badge>
          </div>
        </div>

        {/* 상세 통계 */}
        {showDetailedStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-surface-secondary rounded-lg">
              <div className="text-2xl font-bold text-text-primary">
                {progress.answeredProblems}
              </div>
              <div className="text-xs text-text-secondary">답변 완료</div>
            </div>
            
            <div className="text-center p-3 bg-surface-secondary rounded-lg">
              <div className="text-2xl font-bold text-text-primary">
                {progress.totalProblems - progress.answeredProblems}
              </div>
              <div className="text-xs text-text-secondary">남은 문제</div>
            </div>

            {progress.correctAnswers !== undefined && (
              <div className="text-center p-3 bg-surface-secondary rounded-lg">
                <div className="text-2xl font-bold text-status-success">
                  {progress.correctAnswers}
                </div>
                <div className="text-xs text-text-secondary">정답</div>
              </div>
            )}

            {progress.bookmarkedProblems !== undefined && (
              <div className="text-center p-3 bg-surface-secondary rounded-lg">
                <div className="text-2xl font-bold text-status-warning">
                  {progress.bookmarkedProblems}
                </div>
                <div className="text-xs text-text-secondary">북마크</div>
              </div>
            )}
          </div>
        )}

        {/* 정답률 */}
        {stats.accuracyRate !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-text-primary">정답률</span>
              <span className="text-sm text-text-secondary">
                {progress.correctAnswers}/{progress.answeredProblems} 정답
              </span>
            </div>
            <Progress 
              value={stats.accuracyRate} 
              variant={stats.accuracyRate >= 80 ? 'success' : stats.accuracyRate >= 60 ? 'warning' : 'error'}
              className="h-3"
            />
            <div className="text-right">
              <Badge 
                variant={stats.accuracyRate >= 80 ? 'success' : stats.accuracyRate >= 60 ? 'warning' : 'error'}
                size="sm"
              >
                {stats.accuracyRate.toFixed(1)}% 정답률
              </Badge>
            </div>
          </div>
        )}

        {/* 시간 통계 */}
        {showTimeStats && progress.timeSpent && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-text-primary">소요 시간</span>
              <span className="text-sm text-text-secondary">
                {formatTime(progress.timeSpent)}
                {progress.timeLimit && ` / ${formatTime(progress.timeLimit)}`}
              </span>
            </div>
            
            {progress.timeLimit && stats.timeProgress !== undefined && (
              <div className="space-y-1">
                <Progress 
                  value={stats.timeProgress} 
                  variant={stats.timeProgress >= 90 ? 'error' : stats.timeProgress >= 75 ? 'warning' : 'success'}
                  className="h-2"
                />
                <div className="text-xs text-text-secondary text-right">
                  {stats.timeProgress.toFixed(0)}% 시간 경과
                </div>
              </div>
            )}

            {stats.averageTimePerProblem && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">평균 문제당 시간</span>
                <span className="font-medium text-text-primary">
                  {formatTime(stats.averageTimePerProblem)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 문제별 상태 그리드 */}
        {showProblemGrid && problemStatuses.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-text-primary">문제별 상태</span>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-status-success"></div>
                  <span className="text-text-secondary">정답</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-status-error"></div>
                  <span className="text-text-secondary">오답</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-brand-500"></div>
                  <span className="text-text-secondary">답변</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-surface-secondary border border-border-primary"></div>
                  <span className="text-text-secondary">미답변</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-10 gap-2">
              {problemStatuses.map((problem, index) => (
                <button
                  key={problem.id}
                  onClick={() => onProblemClick?.(problem.id)}
                  className={`
                    w-8 h-8 rounded text-xs font-medium transition-all hover:scale-105
                    ${getStatusColor(problem.status)}
                    ${onProblemClick ? 'cursor-pointer' : 'cursor-default'}
                  `}
                  title={`문제 ${index + 1}: ${problem.status}`}
                >
                  {getStatusIcon(problem.status)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 성과 요약 */}
        {stats.completionRate >= 100 && stats.accuracyRate !== undefined && (
          <div className="p-4 bg-gradient-to-r from-brand-50 to-status-success/10 border border-brand-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎉</div>
              <div>
                <div className="font-semibold text-text-primary">
                  {stats.accuracyRate >= 90 ? '훌륭해요!' : 
                   stats.accuracyRate >= 80 ? '잘했어요!' :
                   stats.accuracyRate >= 70 ? '괜찮아요!' : '다시 도전해보세요!'}
                </div>
                <div className="text-sm text-text-secondary">
                  {progress.totalProblems}문제 중 {progress.correctAnswers}문제 정답
                  {progress.timeSpent && `, 총 ${formatTime(progress.timeSpent)} 소요`}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 헤더용 컴팩트 진행률 표시기
export interface HeaderProgressProps {
  current: number;
  total: number;
  variant?: 'default' | 'minimal';
}

export function HeaderProgress({ current, total, variant = 'default' }: HeaderProgressProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Progress value={percentage} className="w-16 h-1" />
        <span className="text-text-secondary font-mono">
          {current}/{total}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary">진행률</span>
        <Progress value={percentage} className="w-20 h-2" />
      </div>
      <Badge variant="outline" size="sm">
        {current}/{total} ({percentage.toFixed(0)}%)
      </Badge>
    </div>
  );
}