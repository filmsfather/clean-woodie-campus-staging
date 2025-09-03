import React from 'react';
import { Button } from '../../../ui/Button';

interface DashboardErrorProps {
  onRetry: () => void;
  error?: Error;
  title?: string;
  message?: string;
}

export const DashboardError: React.FC<DashboardErrorProps> = ({ 
  onRetry, 
  error,
  title = "대시보드를 불러올 수 없어요",
  message
}) => {
  const defaultMessage = error?.message || '네트워크 연결을 확인하고 다시 시도해주세요';
  
  return (
    <div className="text-center py-12 space-y-4">
      <div className="text-6xl mb-4">😅</div>
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        {title}
      </h2>
      <p className="text-text-secondary mb-4">
        {message || defaultMessage}
      </p>
      <div className="space-x-3">
        <Button onClick={onRetry} variant="default">
          다시 시도
        </Button>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          페이지 새로고침
        </Button>
      </div>
    </div>
  );
};

export const EmptyDashboard: React.FC<{
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ 
  title = "데이터가 없어요",
  message = "첫 학습을 시작해보세요!",
  actionLabel = "시작하기",
  onAction
}) => {
  return (
    <div className="text-center py-12 space-y-4">
      <div className="text-6xl mb-4">📚</div>
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        {title}
      </h2>
      <p className="text-text-secondary mb-4">
        {message}
      </p>
      {onAction && (
        <Button onClick={onAction} variant="default">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};