import React, { useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import { Progress } from '../../../ui/Progress';
import { useStudentDashboard } from '../hooks/useStudentDashboard';
import { DashboardSkeleton } from '../../shared/components';
import { Unauthorized } from '../../../auth/Unauthorized';

export const MyProgressPage: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading } = useStudentDashboard(user?.id || '', {
    enabled: !!user && user.role === 'student'
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'semester'>('week');

  if (!user || user.role !== 'student') {
    return <Unauthorized message="학생만 접근할 수 있는 페이지입니다." />;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Mock progress data
  const progressData = {
    week: {
      studyTime: 485, // 분
      problemsSolved: 127,
      accuracy: 78,
      streak: 5,
      achievements: ['연속 5일 학습', '100문제 달성']
    },
    month: {
      studyTime: 2140, // 분
      problemsSolved: 542,
      accuracy: 82,
      streak: 12,
      achievements: ['월간 500문제 달성', '정확도 80% 달성', '연속 10일 학습']
    },
    semester: {
      studyTime: 12800, // 분
      problemsSolved: 2845,
      accuracy: 85,
      streak: 45,
      achievements: ['학기 2000문제 달성', '정확도 85% 달성', '완벽한 출석']
    }
  };

  const currentData = progressData[selectedPeriod];

  const subjectProgress = [
    { name: '수학', solved: 45, total: 60, accuracy: 88, color: 'bg-blue-500' },
    { name: '영어', solved: 38, total: 50, accuracy: 76, color: 'bg-green-500' },
    { name: '과학', solved: 25, total: 40, accuracy: 82, color: 'bg-purple-500' },
    { name: '사회', solved: 19, total: 30, accuracy: 79, color: 'bg-orange-500' }
  ];

  const weeklyData = [
    { day: '월', solved: 15, time: 45 },
    { day: '화', solved: 22, time: 68 },
    { day: '수', solved: 18, time: 52 },
    { day: '목', solved: 28, time: 85 },
    { day: '금', solved: 31, time: 92 },
    { day: '토', solved: 8, time: 25 },
    { day: '일', solved: 5, time: 18 }
  ];

  const recentAchievements = [
    {
      id: 1,
      title: '연속 학습 챌린저',
      description: '5일 연속 학습 완료',
      icon: '🔥',
      earnedAt: '2025-09-01',
      type: 'streak'
    },
    {
      id: 2,
      title: '정확도 마스터',
      description: '주간 평균 정확도 80% 달성',
      icon: '🎯',
      earnedAt: '2025-08-28',
      type: 'accuracy'
    },
    {
      id: 3,
      title: '수학 전문가',
      description: '수학 문제 100개 완료',
      icon: '🔢',
      earnedAt: '2025-08-25',
      type: 'subject'
    }
  ];

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'week': return '이번 주';
      case 'month': return '이번 달';
      case 'semester': return '이번 학기';
      default: return period;
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-text-primary">내 성과</h1>
        <p className="text-text-secondary">
          학습 진행 상황과 성취를 확인해보세요!
        </p>
        
        {/* 기간 선택 */}
        <div className="flex space-x-2">
          {(['week', 'month', 'semester'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {getPeriodLabel(period)}
            </Button>
          ))}
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-primary">
              {formatTime(currentData.studyTime)}
            </div>
            <div className="text-sm text-text-secondary">총 학습시간</div>
            <Badge variant="outline" size="sm">⏱️</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-success">
              {currentData.problemsSolved}
            </div>
            <div className="text-sm text-text-secondary">푼 문제 수</div>
            <Badge variant="success" size="sm">📝</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-warning">
              {currentData.accuracy}%
            </div>
            <div className="text-sm text-text-secondary">평균 정확도</div>
            <Badge variant="warning" size="sm">🎯</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-info">
              {currentData.streak}일
            </div>
            <div className="text-sm text-text-secondary">연속 학습</div>
            <Badge variant="default" size="sm">🔥</Badge>
          </CardContent>
        </Card>
      </div>

      {/* 과목별 진행 상황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📊</span>
            <span>과목별 성과</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subjectProgress.map((subject, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${subject.color}`} />
                  <span className="font-medium text-text-primary">{subject.name}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-text-secondary">
                    {subject.solved}/{subject.total} 문제
                  </span>
                  <Badge 
                    variant={subject.accuracy >= 85 ? 'success' : subject.accuracy >= 70 ? 'warning' : 'error'}
                    size="sm"
                  >
                    {subject.accuracy}%
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <Progress
                  value={(subject.solved / subject.total) * 100}
                  variant={subject.solved / subject.total >= 0.8 ? 'success' : 'default'}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-text-tertiary">
                  <span>진행률: {Math.round((subject.solved / subject.total) * 100)}%</span>
                  <span>정확도: {subject.accuracy}%</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 주간 학습 패턴 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📈</span>
            <span>주간 학습 패턴</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weeklyData.map((day, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-sm font-medium text-text-secondary">{day.day}</div>
                <div className="space-y-1">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(day.solved / Math.max(...weeklyData.map(d => d.solved))) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-text-tertiary">{day.solved}문제</div>
                  <div className="text-xs text-text-tertiary">{day.time}분</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 최근 성취 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🏆</span>
            <span>최근 성취</span>
            <Badge variant="outline" size="sm">
              {recentAchievements.length}개
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-4 rounded-lg border border-border-primary bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl mt-1">
                      {achievement.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-text-primary mb-1">
                        {achievement.title}
                      </h4>
                      <p className="text-sm text-text-secondary mb-2">
                        {achievement.description}
                      </p>
                      <div className="text-xs text-text-tertiary">
                        {new Date(achievement.earnedAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <div className="text-4xl">🎯</div>
              <div className="text-lg font-medium text-text-primary">
                첫 번째 성취를 달성해보세요!
              </div>
              <div className="text-sm text-text-secondary">
                꾸준히 학습하면 다양한 성취를 얻을 수 있어요
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 목표 설정 및 동기부여 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🎯</span>
              <span>이번 주 목표</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">주간 문제 풀기</span>
                <span className="text-sm font-medium">127/150</span>
              </div>
              <Progress value={84.7} variant="success" className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">평균 정확도</span>
                <span className="text-sm font-medium">78/80%</span>
              </div>
              <Progress value={97.5} variant="warning" className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">연속 학습</span>
                <span className="text-sm font-medium">5/7일</span>
              </div>
              <Progress value={71.4} variant="default" className="h-2" />
            </div>

            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full">
                목표 수정하기
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>💪</span>
              <span>동기부여</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
              <div className="text-center space-y-2">
                <div className="text-2xl">🌟</div>
                <div className="text-sm font-medium text-text-primary">
                  "꾸준함이 재능을 이긴다"
                </div>
                <div className="text-xs text-text-secondary">
                  지금까지 정말 잘하고 있어요! 계속 힘내세요.
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-text-primary">다음 성취까지</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">연속 7일 학습</span>
                  <span className="text-text-primary">2일 남음</span>
                </div>
                <Progress value={71} variant="default" className="h-2" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-text-primary">이달의 순위</div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-yellow-600">15위</div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                  상위 25%에 해당해요!
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};