import React from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import { Progress } from '../../../ui/Progress';
import { useStudentDashboard, useStartStudySession } from '../hooks/useStudentDashboard';
import { DashboardSkeleton } from '../../shared/components';
import { Unauthorized } from '../../../auth/Unauthorized';

export const TodayStudyPage: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading } = useStudentDashboard(user?.id || '', {
    enabled: !!user && user.role === 'student'
  });
  const startStudySession = useStartStudySession();

  if (!user || user.role !== 'student') {
    return <Unauthorized message="학생만 접근할 수 있는 페이지입니다." />;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const todayTasks = data?.todayTasks || [];
  const completedTasks = []; // TODO: 완료된 태스크 데이터
  const totalTasks = todayTasks.length + completedTasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

  const handleStartTask = (taskId: string) => {
    startStudySession.mutate(taskId);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">오늘의 학습</h1>
        <p className="text-text-secondary">
          오늘 완료해야 할 학습 항목들을 확인하고 시작해보세요!
        </p>
      </div>

      {/* 진행 현황 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>오늘의 진행 현황</span>
            <Badge variant={completionRate === 100 ? 'success' : 'default'}>
              {completedTasks.length}/{totalTasks} 완료
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">전체 진행률</span>
              <span className="font-medium">{Math.round(completionRate)}%</span>
            </div>
            <Progress
              value={completionRate}
              variant={completionRate >= 80 ? 'success' : completionRate >= 50 ? 'warning' : 'default'}
              className="h-3"
            />
          </div>
          
          {completionRate === 100 ? (
            <div className="text-center py-4 space-y-2">
              <div className="text-2xl">🎉</div>
              <div className="text-sm font-medium text-success">
                오늘의 학습을 모두 완료했어요!
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-text-primary">
                  {todayTasks.filter(t => t.priority === 'high').length}
                </div>
                <div className="text-xs text-text-secondary">긴급 태스크</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-text-primary">
                  {todayTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0)}분
                </div>
                <div className="text-xs text-text-secondary">예상 소요시간</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-text-primary">
                  {completedTasks.length}
                </div>
                <div className="text-xs text-text-secondary">완료한 항목</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 우선순위별 태스크 목록 */}
      {todayTasks.length > 0 ? (
        <div className="space-y-4">
          {/* 긴급 태스크 */}
          {todayTasks.filter(task => task.priority === 'high').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-red-600">🚨</span>
                  <span>긴급 - 우선 완료 필요</span>
                  <Badge variant="error" size="sm">
                    {todayTasks.filter(task => task.priority === 'high').length}개
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayTasks
                  .filter(task => task.priority === 'high')
                  .map(task => (
                    <TaskCard key={task.id} task={task} onStart={() => handleStartTask(task.id)} urgent />
                  ))}
              </CardContent>
            </Card>
          )}

          {/* 일반 태스크 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📚</span>
                <span>일반 학습</span>
                <Badge variant="default" size="sm">
                  {todayTasks.filter(task => task.priority !== 'high').length}개
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayTasks
                .filter(task => task.priority !== 'high')
                .map(task => (
                  <TaskCard key={task.id} task={task} onStart={() => handleStartTask(task.id)} />
                ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12 space-y-4">
            <div className="text-4xl">🎉</div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-text-primary">
                오늘의 학습을 모두 완료했어요!
              </h3>
              <p className="text-text-secondary">
                훌륭해요! 내일도 열심히 해봐요.
              </p>
            </div>
            <div className="space-x-3">
              <Button variant="outline">
                추가 학습하기
              </Button>
              <Button variant="default">
                대시보드로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// TaskCard 컴포넌트
interface TaskCardProps {
  task: {
    id: string;
    type: 'srs_review' | 'new_problems' | 'problem_set';
    title: string;
    description: string;
    estimatedMinutes: number;
    priority: 'high' | 'medium' | 'low';
    dueTime?: string;
  };
  onStart: () => void;
  urgent?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStart, urgent }) => {
  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'srs_review': return '🔄';
      case 'new_problems': return '✨';
      case 'problem_set': return '📝';
      default: return '📚';
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'srs_review': return '복습';
      case 'new_problems': return '새 문제';
      case 'problem_set': return '문제집';
      default: return '학습';
    }
  };

  return (
    <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
      urgent 
        ? 'border-red-200 bg-red-50 dark:bg-red-900/10' 
        : 'border-border-primary bg-surface-secondary hover:bg-surface-tertiary'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="text-2xl mt-1">
            {getTaskIcon(task.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-semibold text-text-primary">
                {task.title}
              </h4>
              <Badge variant="outline" size="sm">
                {getTaskTypeLabel(task.type)}
              </Badge>
            </div>
            <p className="text-sm text-text-secondary mb-3">
              {task.description}
            </p>
            <div className="flex items-center space-x-4 text-xs text-text-tertiary">
              <span>⏱️ 예상 {task.estimatedMinutes}분</span>
              {task.dueTime && (
                <span>🕐 {task.dueTime}까지</span>
              )}
            </div>
          </div>
        </div>
        <Button
          onClick={onStart}
          size="sm"
          variant={urgent ? 'default' : 'outline'}
          className="ml-4"
        >
          시작하기
        </Button>
      </div>
    </div>
  );
};