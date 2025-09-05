import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { Badge } from '../../../ui/Badge';
import { Progress } from '../../../ui/Progress';
import type { StudyStreak } from '../types';

interface StudyStreakCardProps {
  studyStreak: StudyStreak;
}

const WeeklyPatternGrid: React.FC<{ 
  pattern: StudyStreak['weeklyPattern'] 
}> = ({ pattern }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
  };

  return (
    <div className="space-y-3">
      <h5 className="text-sm font-medium text-text-secondary">이번 주 학습 현황</h5>
      <div className="flex gap-1">
        {pattern.map((day, index) => (
          <div key={index} className="flex-1">
            <div
              className={`h-10 rounded-sm flex items-center justify-center text-xs font-medium transition-colors ${
                day.completed && day.studyMinutes > 0
                  ? 'bg-success text-white'
                  : day.studyMinutes > 0
                  ? 'bg-warning text-white'
                  : 'bg-surface-tertiary text-text-tertiary'
              }`}
            >
              {formatDate(day.date)}
            </div>
            <div className="text-xs text-center mt-1 space-y-0.5">
              <div className="text-text-tertiary">
                {day.studyMinutes}분
              </div>
              <div className="text-text-muted">
                {day.problemsSolved}문제
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">주간 학습 완료</span>
        <span className="font-medium">
          {pattern.filter(d => d.completed).length}/7일
        </span>
      </div>
    </div>
  );
};

export const StudyStreakCard: React.FC<StudyStreakCardProps> = ({ studyStreak }) => {
  if (!studyStreak) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔥</span>
            <span>학습 스트릭</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-text-secondary">스트릭 데이터를 로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  const streakPercentage = Math.min((studyStreak.currentStreak / studyStreak.longestStreak) * 100, 100);
  const totalMinutesThisWeek = studyStreak.weeklyPattern?.reduce((sum, day) => sum + day.studyMinutes, 0) || 0;
  const averageMinutesPerDay = Math.round(totalMinutesThisWeek / 7);
  
  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return '정말 대단해요! 🏆';
    if (streak >= 14) return '꾸준하게 잘하고 있어요! 🌟';
    if (streak >= 7) return '좋은 습관이 만들어지고 있어요! 💪';
    if (streak >= 3) return '좋은 시작이에요! 👍';
    return '오늘부터 시작해봐요! 📚';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span>🔥</span>
            <span>학습 스트릭</span>
          </span>
          <Badge variant="success">
            {studyStreak.currentStreak}일 연속
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 스트릭 진행률 */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-success">
              {studyStreak.currentStreak}일
            </div>
            <div className="text-sm text-text-secondary">
              최장 기록: {studyStreak.longestStreak}일
            </div>
            <div className="text-xs text-text-tertiary">
              {getStreakMessage(studyStreak.currentStreak)}
            </div>
          </div>
          
          {/* 목표 대비 진행률 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">최장 기록까지</span>
              <span className="font-medium">{Math.round(streakPercentage)}%</span>
            </div>
            <Progress
              value={streakPercentage}
              variant="success"
              className="h-2"
            />
          </div>
        </div>

        {/* 주간 패턴 */}
        {studyStreak.weeklyPattern && (
          <WeeklyPatternGrid pattern={studyStreak.weeklyPattern} />
        )}

        {/* 추가 통계 */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-primary">
          <div className="text-center">
            <div className="text-lg font-semibold text-text-primary">
              {averageMinutesPerDay}분
            </div>
            <div className="text-xs text-text-secondary">
              일평균 학습시간
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-text-primary">
              {studyStreak.weeklyPattern.reduce((sum, day) => sum + day.problemsSolved, 0)}개
            </div>
            <div className="text-xs text-text-secondary">
              이번 주 문제 수
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};