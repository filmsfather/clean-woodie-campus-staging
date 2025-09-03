import React, { useState, useCallback } from 'react';
import { Input } from '../../ui';

interface ShortAnswerInputProps {
  answer?: string;
  onChange?: (answer: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function ShortAnswerInput({
  answer = '',
  onChange,
  disabled = false,
  placeholder = '답을 입력해주세요...',
  maxLength = 200,
}: ShortAnswerInputProps) {
  const [localAnswer, setLocalAnswer] = useState(answer);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalAnswer(value);
    onChange?.(value);
  }, [onChange]);

  return (
    <div className="space-y-4">
      {/* 안내 메시지 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          ✏️ 간단하고 명확한 답을 입력해주세요.
        </p>
      </div>

      {/* 답안 입력 */}
      <div className="space-y-2">
        <Input
          value={localAnswer}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className="text-lg py-3"
          autoFocus
        />
        
        {/* 글자 수 표시 */}
        <div className="flex justify-between text-xs text-text-secondary">
          <div>
            {localAnswer.length > 0 ? (
              <span className="text-green-600">✓ 답안 입력됨</span>
            ) : (
              <span>답안을 입력해주세요</span>
            )}
          </div>
          <div>
            {localAnswer.length}/{maxLength}자
          </div>
        </div>
      </div>

      {/* 입력 팁 */}
      <div className="text-xs text-text-tertiary space-y-1">
        <div><strong>입력 팁:</strong></div>
        <div>• 정확한 답을 간단명료하게 입력하세요</div>
        <div>• 불필요한 공백이나 특수문자는 피해주세요</div>
        <div>• 여러 답이 가능한 경우, 가장 일반적인 표현을 사용하세요</div>
      </div>

      {/* 답안 길이 경고 */}
      {localAnswer.length > maxLength * 0.9 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-sm text-yellow-700 dark:text-yellow-300">
          ⚠️ 답안이 너무 깁니다. 더 간단하게 입력해보세요.
        </div>
      )}
    </div>
  );
}