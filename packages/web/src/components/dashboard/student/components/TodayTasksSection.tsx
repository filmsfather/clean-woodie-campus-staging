import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import type { TodayTask } from '../types';

interface TodayTasksSectionProps {
  tasks: TodayTask[];
  onStartTask: (taskId: string) => void;
  isStartingTask?: boolean;
}

interface TaskItemProps {
  task: TodayTask;
  onStart: () => void;
  urgent?: boolean;
  isLoading?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onStart, urgent, isLoading }) => {
  const getTaskIcon = (type: TodayTask['type']) => {
    switch (type) {
      case 'srs_review':
        return '🔄';
      case 'new_problems':
        return '✨';
      case 'problem_set':
        return '📝';
      default:
        return '📚';
    }
  };

  const getTaskTypeLabel = (type: TodayTask['type']) => {
    switch (type) {
      case 'srs_review':
        return '복습';
      case 'new_problems':
        return '새 문제';
      case 'problem_set':
        return '문제집';
      default:
        return '학습';
    }
  };

  const getPriorityVariant = (priority: TodayTask['priority']) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
      urgent 
        ? 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800' 
        : 'border-border-primary bg-surface-secondary hover:bg-surface-tertiary'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="text-xl mt-1">
            {getTaskIcon(task.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-text-primary truncate">
                {task.title}
              </h4>
              <Badge 
                variant={getPriorityVariant(task.priority)} 
                size="sm"
              >
                {getTaskTypeLabel(task.type)}
              </Badge>
              {urgent && (
                <Badge variant="error" size="sm">
                  긴급
                </Badge>
              )}
            </div>
            <p className="text-sm text-text-secondary mb-2">
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
          disabled={isLoading}
          className="ml-3 shrink-0"
        >
          {isLoading ? '시작 중...' : '시작'}
        </Button>
      </div>
    </div>
  );
};

export const TodayTasksSection: React.FC<TodayTasksSectionProps> = ({ 
  tasks, 
  onStartTask, 
  isStartingTask 
}) => {
  const urgentTasks = tasks.filter(t => t.priority === 'high');
  const regularTasks = tasks.filter(t => t.priority !== 'high');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span>📅</span>
            <span>오늘의 학습</span>
          </span>
          <Badge 
            variant={urgentTasks.length > 0 ? 'error' : tasks.length > 0 ? 'warning' : 'success'}
          >
            {tasks.length === 0 ? '완료!' : `${tasks.length}개 남음`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 긴급 태스크들 */}
        {urgentTasks.map(task => (
          <TaskItem 
            key={task.id} 
            task={task} 
            urgent 
            onStart={() => onStartTask(task.id)}
            isLoading={isStartingTask}
          />
        ))}
        
        {/* 일반 태스크들 */}
        {regularTasks.map(task => (
          <TaskItem 
            key={task.id} 
            task={task} 
            onStart={() => onStartTask(task.id)}
            isLoading={isStartingTask}
          />
        ))}
        
        {/* 태스크가 없을 때 */}
        {tasks.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <div className="text-4xl">🎉</div>
            <div className="text-lg font-medium text-text-primary">
              오늘의 학습을 모두 완료했어요!
            </div>
            <p className="text-text-secondary">
              훌륭해요! 내일도 열심히 해봐요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};