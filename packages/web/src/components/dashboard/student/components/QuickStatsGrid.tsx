import React from 'react';
import { Card, CardContent } from '../../../ui/Card';
import { Badge } from '../../../ui/Badge';
import type { StudentStatistics, StudyStreak } from '../types';

interface QuickStatsGridProps {
  statistics: StudentStatistics;
  studyStreak: StudyStreak;
}

export const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({ statistics, studyStreak }) => {
  const getStreakVariant = (current: number, longest: number) => {
    const ratio = current / longest;
    if (ratio >= 0.8) return 'success';
    if (ratio >= 0.5) return 'warning';
    return 'default';
  };

  const getAccuracyVariant = (accuracy: number) => {
    if (accuracy >= 90) return 'success';
    if (accuracy >= 80) return 'warning';
    if (accuracy >= 70) return 'default';
    return 'error';
  };

  const stats = [
    {
      value: `${studyStreak.currentStreak}일`,
      label: '현재 스트릭',
      sublabel: `최장 기록: ${studyStreak.longestStreak}일`,
      icon: '🔥',
      variant: getStreakVariant(studyStreak.currentStreak, studyStreak.longestStreak)
    },
    {
      value: `${Math.floor(statistics.totalStudyHours)}시간`,
      label: '총 학습시간',
      sublabel: '이번 달 누적',
      icon: '⏰',
      variant: 'default' as const
    },
    {
      value: `${statistics.averageAccuracy}%`,
      label: '평균 정답률',
      sublabel: '전체 문제집 기준',
      icon: '🎯',
      variant: getAccuracyVariant(statistics.averageAccuracy)
    },
    {
      value: `${statistics.completedProblemSets}개`,
      label: '완료한 문제집',
      sublabel: `총 ${statistics.totalActiveProblemSets}개 중`,
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