import React from 'react';
import { Button } from '../ui/Button';

type UnauthorizedProps = {
  message?: string;
  showBackButton?: boolean;
};

export const Unauthorized: React.FC<UnauthorizedProps> = ({
  message = "이 페이지에 접근할 권한이 없습니다.",
  showBackButton = true
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">🚫</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">접근 권한 없음</h1>
          <p className="text-text-secondary">{message}</p>
        </div>
        {showBackButton && (
          <Button
            onClick={() => window.history.back()}
            variant="default"
            size="lg"
          >
            뒤로 가기
          </Button>
        )}
      </div>
    </div>
  );
};