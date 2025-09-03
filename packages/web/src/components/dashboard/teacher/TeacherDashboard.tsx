import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Progress } from '../../ui/Progress';
import { useTeacherDashboard } from './hooks/useTeacherDashboard';
import { DashboardSkeleton } from '../shared/components';
import { Unauthorized } from '../../auth/Unauthorized';
import { AnalyticsDashboard } from '../../problems/analytics';
import type { StudentProgress, RecentActivity, TeacherAlert } from './types';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading } = useTeacherDashboard(user?.id || '', {
    enabled: !!user && user.role === 'teacher'
  });
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics'>('dashboard');

  if (!user || user.role !== 'teacher') {
    return <Unauthorized message="교사만 접근할 수 있는 페이지입니다." />;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return <div>데이터를 불러올 수 없습니다.</div>;
  }

  const currentHour = new Date().getHours();
  const greeting = 
    currentHour < 12 ? '좋은 아침' : 
    currentHour < 18 ? '좋은 오후' : 
    '좋은 저녁';

  // 분석 대시보드 뷰
  if (currentView === 'analytics') {
    return (
      <AnalyticsDashboard
        teacherId={user.id}
        isAdminView={false}
        onBack={() => setCurrentView('dashboard')}
        onExportReport={() => {
          // TODO: 보고서 내보내기 구현
          console.log('보고서 내보내기');
        }}
        onViewDetails={(section) => {
          // TODO: 세부 분석 페이지로 이동
          console.log('세부 분석:', section);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">
          {greeting}이에요, {data.profile.displayName} 선생님! 👨‍🏫
        </h1>
        <p className="text-text-secondary">
          오늘도 학생들과 함께 성장하는 하루 되세요!
        </p>
      </div>

      {/* 클래스 현황 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-primary">
              {data.classStatistics.totalStudents}
            </div>
            <div className="text-sm text-text-secondary">전체 학생</div>
            <Badge variant="outline" size="sm">
              활성: {data.classStatistics.activeStudents}명
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-success">
              {Math.round((data.classStatistics.totalCompletedProblems / data.classStatistics.totalProblemsAssigned) * 100)}%
            </div>
            <div className="text-sm text-text-secondary">문제 완료율</div>
            <Badge variant="success" size="sm">
              {data.classStatistics.totalCompletedProblems}/{data.classStatistics.totalProblemsAssigned}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-warning">
              {data.classStatistics.averageAccuracy.toFixed(1)}%
            </div>
            <div className="text-sm text-text-secondary">평균 정확도</div>
            <Badge 
              variant={data.classStatistics.averageAccuracy >= 80 ? 'success' : 'warning'}
              size="sm"
            >
              클래스 평균
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-info">
              {data.classStatistics.averageStudyTime}분
            </div>
            <div className="text-sm text-text-secondary">평균 학습시간</div>
            <Badge variant="default" size="sm">일일</Badge>
          </CardContent>
        </Card>
      </div>

      {/* 긴급 알림 */}
      {data.alerts.filter(alert => alert.priority === 'high').length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-700 dark:text-red-300">
              <span>🚨</span>
              <span>긴급 알림</span>
              <Badge variant="error" size="sm">
                {data.alerts.filter(alert => alert.priority === 'high').length}건
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.alerts
              .filter(alert => alert.priority === 'high')
              .slice(0, 3)
              .map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
          </CardContent>
        </Card>
      )}

      {/* 메인 컨텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 실시간 활동 피드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>📈</span>
                <span>실시간 활동</span>
              </div>
              <Badge variant="outline" size="sm">
                실시간
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-80 overflow-y-auto space-y-3">
              {data.recentActivity.slice(0, 10).map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full">
              모든 활동 보기
            </Button>
          </CardContent>
        </Card>

        {/* 학생 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>👥</span>
                <span>학생 현황</span>
              </div>
              <Button variant="outline" size="sm">
                전체 보기
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-80 overflow-y-auto space-y-3">
              {data.studentProgress
                .sort((a, b) => {
                  // 위험군 학생을 먼저 표시
                  if (a.status === 'at_risk' && b.status !== 'at_risk') return -1;
                  if (a.status !== 'at_risk' && b.status === 'at_risk') return 1;
                  // 그 다음은 최근 활동 순
                  return new Date(b.recentActivity.lastLogin).getTime() - 
                         new Date(a.recentActivity.lastLogin).getTime();
                })
                .slice(0, 8)
                .map((student) => (
                  <StudentCard key={student.id} student={student} />
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 문제집 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>📚</span>
              <span>배정한 문제집</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                새 문제집 만들기
              </Button>
              <Button variant="default" size="sm">
                문제집 배정하기
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.problemSetOverviews.map((problemSet) => (
              <div
                key={problemSet.id}
                className="p-4 rounded-lg border border-border-primary bg-surface-secondary hover:bg-surface-tertiary transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-text-primary">
                      {problemSet.title}
                    </h4>
                    <Badge 
                      variant={problemSet.difficulty === 'hard' ? 'error' : 
                               problemSet.difficulty === 'medium' ? 'warning' : 'success'}
                      size="sm"
                    >
                      {problemSet.difficulty === 'easy' ? '쉬움' : 
                       problemSet.difficulty === 'medium' ? '보통' : '어려움'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-text-secondary">
                    {problemSet.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">진행률</span>
                      <span className="font-medium">
                        {problemSet.completedStudents}/{problemSet.assignedStudents} 완료
                      </span>
                    </div>
                    <Progress
                      value={(problemSet.completedStudents / problemSet.assignedStudents) * 100}
                      variant={(problemSet.completedStudents / problemSet.assignedStudents) >= 0.8 ? 'success' : 'default'}
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-tertiary">
                    <span>평균 {problemSet.averageScore}점</span>
                    <span>{problemSet.totalProblems}문제</span>
                    {problemSet.deadline && (
                      <span>마감: {new Date(problemSet.deadline).toLocaleDateString('ko-KR')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 빠른 액션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>⚡</span>
            <span>빠른 액션</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
              <span className="text-2xl">📝</span>
              <span className="text-sm">새 문제집</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
              <span className="text-2xl">📤</span>
              <span className="text-sm">문제집 배정</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => setCurrentView('analytics')}
            >
              <span className="text-2xl">📊</span>
              <span className="text-sm">성적 분석</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
              <span className="text-2xl">👥</span>
              <span className="text-sm">학생 관리</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 알림 카드 컴포넌트
interface AlertCardProps {
  alert: TeacherAlert;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'at_risk_student': return '⚠️';
      case 'deadline_approaching': return '⏰';
      case 'low_completion': return '📉';
      case 'achievement': return '🎉';
      default: return '📋';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg bg-white dark:bg-gray-800">
      <div className="text-xl mt-0.5">
        {getAlertIcon(alert.type)}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="font-medium text-text-primary">
          {alert.title}
        </h5>
        <p className="text-sm text-text-secondary">
          {alert.description}
        </p>
        <div className="text-xs text-text-tertiary mt-1">
          {new Date(alert.timestamp).toLocaleString('ko-KR')}
        </div>
      </div>
      {alert.actionRequired && (
        <Button variant="outline" size="sm">
          처리
        </Button>
      )}
    </div>
  );
};

// 활동 카드 컴포넌트
interface ActivityCardProps {
  activity: RecentActivity;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'problem_completed': return '✅';
      case 'student_achievement': return '🏆';
      case 'problem_set_assigned': return '📤';
      case 'login': return '👋';
      default: return '📋';
    }
  };

  return (
    <div className="flex items-start space-x-3">
      <div className="text-lg mt-0.5">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">
          <span className="font-medium">{activity.studentName}</span>님이{' '}
          {activity.description}
        </p>
        <div className="text-xs text-text-tertiary">
          {new Date(activity.timestamp).toLocaleString('ko-KR')}
        </div>
      </div>
    </div>
  );
};

// 학생 카드 컴포넌트
interface StudentCardProps {
  student: StudentProgress;
}

const StudentCard: React.FC<StudentCardProps> = ({ student }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'inactive': return 'text-yellow-600 bg-yellow-50';
      case 'at_risk': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      case 'at_risk': return '위험';
      default: return status;
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      student.status === 'at_risk' 
        ? 'bg-red-50 border border-red-200 dark:bg-red-900/10' 
        : 'bg-surface-secondary'
    }`}>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-primary-600 text-sm font-semibold">
            {student.name.charAt(0)}
          </span>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-text-primary">{student.name}</span>
            <Badge 
              variant={student.status === 'active' ? 'success' : 
                      student.status === 'at_risk' ? 'error' : 'warning'}
              size="sm"
            >
              {getStatusLabel(student.status)}
            </Badge>
          </div>
          <div className="text-xs text-text-tertiary">
            최근 활동: {new Date(student.recentActivity.lastLogin).toLocaleDateString('ko-KR')}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-text-primary">
          {student.averageScore}점
        </div>
        <div className="text-xs text-text-tertiary">
          {student.currentStreak}일 연속
        </div>
      </div>
    </div>
  );
};