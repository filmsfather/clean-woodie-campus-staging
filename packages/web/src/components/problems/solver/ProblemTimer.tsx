import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Badge } from '../../ui';

export interface ProblemTimerProps {
  timeLimit?: number;
  onTimeUp?: () => void;
  onTimeUpdate?: (remainingTime: number) => void;
  isPaused?: boolean;
  showMilliseconds?: boolean;
  warningThreshold?: number;
  criticalThreshold?: number;
  className?: string;
}

export function ProblemTimer({
  timeLimit,
  onTimeUp,
  onTimeUpdate,
  isPaused = false,
  showMilliseconds = false,
  warningThreshold = 60,
  criticalThreshold = 30,
  className = '',
}: ProblemTimerProps) {
  const [remainingTime, setRemainingTime] = useState(timeLimit || 0);
  const [isRunning, setIsRunning] = useState(!isPaused);

  useEffect(() => {
    if (timeLimit) {
      setRemainingTime(timeLimit);
    }
  }, [timeLimit]);

  useEffect(() => {
    setIsRunning(!isPaused);
  }, [isPaused]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isRunning && remainingTime > 0) {
      intervalId = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = prev - 1;
          onTimeUpdate?.(newTime);
          
          if (newTime <= 0) {
            onTimeUp?.();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, remainingTime, onTimeUp, onTimeUpdate]);

  const formatTime = useCallback((seconds: number): string => {
    if (seconds <= 0) return showMilliseconds ? '00:00:00' : '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return showMilliseconds
      ? `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [showMilliseconds]);

  const getTimerVariant = useCallback(() => {
    if (remainingTime <= criticalThreshold) return 'error';
    if (remainingTime <= warningThreshold) return 'warning';
    return 'default';
  }, [remainingTime, criticalThreshold, warningThreshold]);

  const getTimerIcon = useCallback(() => {
    if (remainingTime <= criticalThreshold) {
      return (
        <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }

    if (!isRunning) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6l4-2-4-2z" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }, [remainingTime, criticalThreshold, isRunning]);

  const getProgressPercentage = useCallback(() => {
    if (!timeLimit) return 100;
    return Math.max(0, (remainingTime / timeLimit) * 100);
  }, [remainingTime, timeLimit]);

  if (!timeLimit) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm text-text-secondary">시간 제한 없음</span>
      </div>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {getTimerIcon()}
            <Badge variant={getTimerVariant()} size="lg" className="font-mono text-base px-3 py-1">
              {formatTime(remainingTime)}
            </Badge>
          </div>
          
          <div className="flex-1">
            <div className="w-full bg-surface-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  remainingTime <= criticalThreshold
                    ? 'bg-status-error'
                    : remainingTime <= warningThreshold
                    ? 'bg-status-warning'
                    : 'bg-status-success'
                }`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-secondary mt-1">
              <span>남은 시간</span>
              <span>{Math.ceil((remainingTime / timeLimit) * 100)}%</span>
            </div>
          </div>
        </div>

        {remainingTime <= criticalThreshold && remainingTime > 0 && (
          <div className="mt-2 p-2 bg-status-error/10 border border-status-error/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-status-error">
              <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span className="font-medium">시간이 얼마 남지 않았습니다!</span>
            </div>
          </div>
        )}

        {!isRunning && (
          <div className="mt-2 p-2 bg-surface-secondary rounded-lg">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6l4-2-4-2z" />
              </svg>
              <span>타이머가 일시정지되었습니다</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 컴팩트 버전 - 헤더나 상단바에서 사용
export interface CompactTimerProps extends Omit<ProblemTimerProps, 'className'> {
  size?: 'sm' | 'md';
}

export function CompactTimer({
  timeLimit,
  onTimeUp,
  onTimeUpdate,
  isPaused = false,
  warningThreshold = 60,
  criticalThreshold = 30,
  size = 'md',
}: CompactTimerProps) {
  const [remainingTime, setRemainingTime] = useState(timeLimit || 0);
  const [isRunning, setIsRunning] = useState(!isPaused);

  useEffect(() => {
    if (timeLimit) {
      setRemainingTime(timeLimit);
    }
  }, [timeLimit]);

  useEffect(() => {
    setIsRunning(!isPaused);
  }, [isPaused]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isRunning && remainingTime > 0) {
      intervalId = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = prev - 1;
          onTimeUpdate?.(newTime);
          
          if (newTime <= 0) {
            onTimeUp?.();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, remainingTime, onTimeUp, onTimeUpdate]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getVariant = () => {
    if (remainingTime <= criticalThreshold) return 'error';
    if (remainingTime <= warningThreshold) return 'warning';
    return 'outline';
  };

  if (!timeLimit) {
    return (
      <div className="flex items-center gap-1">
        <svg className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} text-text-secondary`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`text-text-secondary ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>∞</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <svg 
        className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ${
          remainingTime <= criticalThreshold ? 'text-status-error animate-pulse' : 
          remainingTime <= warningThreshold ? 'text-status-warning' : 'text-text-secondary'
        }`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <Badge 
        variant={getVariant()} 
        size={size} 
        className={`font-mono ${remainingTime <= criticalThreshold ? 'animate-pulse' : ''}`}
      >
        {formatTime(remainingTime)}
      </Badge>
    </div>
  );
}