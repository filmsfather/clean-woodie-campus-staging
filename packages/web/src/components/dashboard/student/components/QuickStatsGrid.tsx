import React from 'react';
import { Card, CardContent } from '../../../ui/Card';
import { Badge } from '../../../ui/Badge';

interface QuickStatsGridProps {
  currentStreak: number;
  longestStreak: number;
  reviewCount: number;
  totalStudyHours: number;
  averageAccuracy: number;
  completedProblemSets: number;
  totalActiveProblemSets: number;
}

export const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({ 
  currentStreak, 
  longestStreak, 
  totalStudyHours,
  averageAccuracy,
  completedProblemSets,
  totalActiveProblemSets
}) => {
  const getStreakVariant = (current: number, longest: number) => {
    const ratio = current / longest;
    if (ratio >= 0.8) return 'success' as const;
    if (ratio >= 0.5) return 'warning' as const;
    return 'default' as const;
  };

  const getAccuracyVariant = (accuracy: number) => {
    if (accuracy >= 90) return 'success' as const;
    if (accuracy >= 80) return 'warning' as const;
    if (accuracy >= 70) return 'default' as const;
    return 'error' as const;
  };

  const stats = [
    {
      value: `${currentStreak}일`,
      label: '현재 스트릭',
      sublabel: `최장 기록: ${longestStreak}일`,
      icon: '🔥',
      variant: getStreakVariant(currentStreak, longestStreak)
    },
    {
      value: `${Math.floor(totalStudyHours)}시간`,
      label: '총 학습시간',
      sublabel: '이번 달 누적',
      icon: '⏰',
      variant: 'default' as const
    },
    {
      value: `${averageAccuracy}%`,
      label: '평균 정답률',
      sublabel: '전체 문제집 기준',
      icon: '🎯',
      variant: getAccuracyVariant(averageAccuracy)
    },
    {
      value: `${completedProblemSets}개`,
      label: '완료한 문제집',
      sublabel: `총 ${totalActiveProblemSets}개 중`,
      icon: '📚',
      variant: 'success' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="text-center space-y-3 py-6">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">{stat.icon}</span>
              <Badge variant={stat.variant} size="sm">
                활발
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-text-primary">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-text-secondary">
                {stat.label}
              </div>
              <div className="text-xs text-text-tertiary">
                {stat.sublabel}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};