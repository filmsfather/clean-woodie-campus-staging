import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  CardContent,
  Textarea,
  Badge,
  Progress,
} from '../../ui';

interface LongAnswerTextareaProps {
  answer: string;
  onChange: (answer: string) => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
}

export function LongAnswerTextarea({
  answer,
  onChange,
  placeholder = "답안을 자세히 작성해주세요...",
  minLength,
  maxLength,
  disabled = false,
}: LongAnswerTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // 최대 길이 제한 적용
    if (maxLength && value.length > maxLength) {
      return;
    }
    
    onChange(value);
  }, [maxLength, onChange]);

  const currentLength = answer.length;
  const isMinLengthMet = !minLength || currentLength >= minLength;
  const lengthProgress = maxLength ? (currentLength / maxLength) * 100 : 0;
  
  // 길이 상태에 따른 색상 결정
  const getLengthColor = () => {
    if (minLength && currentLength < minLength) {
      return 'text-yellow-600'; // 최소 길이 미달
    }
    if (maxLength && currentLength > maxLength * 0.9) {
      return 'text-orange-600'; // 최대 길이 근접
    }
    return 'text-text-secondary'; // 정상
  };

  const getProgressVariant = () => {
    if (maxLength && lengthProgress > 90) return 'error';
    if (maxLength && lengthProgress > 70) return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-3">
      <Card className={`transition-all duration-200 ${
        isFocused ? 'ring-2 ring-primary-500 border-primary-300' : ''
      }`}>
        <CardContent className="p-4">
          <Textarea
            value={answer}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[200px] border-none shadow-none p-0 resize-none focus:ring-0"
            style={{ 
              fontSize: '16px', 
              lineHeight: '1.6',
            }}
          />
        </CardContent>
      </Card>

      {/* 길이 정보 및 진행률 표시 */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {/* 현재 글자 수 */}
          <div className={`font-medium ${getLengthColor()}`}>
            {currentLength.toLocaleString()}자
            {maxLength && (
              <span className="text-text-tertiary">
                / {maxLength.toLocaleString()}자
              </span>
            )}
          </div>

          {/* 최소 길이 상태 */}
          {minLength && (
            <div className="flex items-center gap-2">
              {isMinLengthMet ? (
                <Badge variant="success" size="sm">
                  ✓ 최소 길이 충족
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  최소 {minLength}자 필요
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* 진행률 바 (최대 길이가 설정된 경우) */}
        {maxLength && (
          <div className="flex items-center gap-2">
            <Progress
              value={lengthProgress}
              variant={getProgressVariant()}
              className="w-16 h-2"
            />
            <span className="text-xs text-text-tertiary">
              {Math.round(lengthProgress)}%
            </span>
          </div>
        )}
      </div>

      {/* 도움말 메시지 */}
      <div className="text-xs text-text-secondary space-y-1">
        {minLength && !isMinLengthMet && (
          <div className="text-yellow-600">
            • 최소 {minLength}자 이상 작성해주세요. (현재 {currentLength}자)
          </div>
        )}
        
        {maxLength && currentLength > maxLength * 0.9 && (
          <div className="text-orange-600">
            • 최대 글자 수에 근접했습니다. ({maxLength - currentLength}자 남음)
          </div>
        )}
        
        {!minLength && !maxLength && (
          <div>
            • 가능한 자세하고 구체적으로 작성해주세요.
          </div>
        )}
      </div>

      {/* 작성 팁 (포커스 상태일 때 표시) */}
      {isFocused && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="py-3">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div className="font-medium mb-2">💡 좋은 답안 작성 팁:</div>
              <ul className="space-y-1 text-xs">
                <li>• 문제에서 요구하는 핵심 내용을 포함하세요</li>
                <li>• 구체적인 예시나 근거를 들어 설명하세요</li>
                <li>• 논리적인 순서로 답안을 구성하세요</li>
                <li>• 맞춤법과 문법을 확인하세요</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}