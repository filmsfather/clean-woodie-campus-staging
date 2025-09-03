import React from 'react';
import { Radio } from '../../ui';

interface TrueFalseButtonsProps {
  selectedAnswer?: boolean | null;
  onChange?: (answer: boolean) => void;
  disabled?: boolean;
}

export function TrueFalseButtons({
  selectedAnswer,
  onChange,
  disabled = false,
}: TrueFalseButtonsProps) {
  return (
    <div className="space-y-4">
      {/* 안내 메시지 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          ✅ 문제가 맞으면 O, 틀리면 X를 선택해주세요.
        </p>
      </div>

      {/* OX 선택 버튼 */}
      <div className="flex gap-6 justify-center">
        <label 
          className={`
            flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
            min-w-[140px] hover:scale-105
            ${selectedAnswer === true 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg' 
              : 'border-border-primary hover:border-green-300 hover:bg-surface-secondary'
            }
            ${disabled ? 'cursor-not-allowed opacity-60' : ''}
          `}
        >
          <div className="text-6xl mb-2">⭕</div>
          <Radio
            name="true-false-answer"
            value="true"
            checked={selectedAnswer === true}
            onChange={(checked) => checked && onChange?.(true)}
            disabled={disabled}
          />
          <div className="text-center">
            <div className="font-bold text-lg text-green-700 dark:text-green-300">O</div>
            <div className="text-sm text-text-secondary">참 / 맞음</div>
          </div>
          {selectedAnswer === true && (
            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
              ✓
            </div>
          )}
        </label>

        <label 
          className={`
            flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
            min-w-[140px] hover:scale-105
            ${selectedAnswer === false 
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-lg' 
              : 'border-border-primary hover:border-red-300 hover:bg-surface-secondary'
            }
            ${disabled ? 'cursor-not-allowed opacity-60' : ''}
          `}
        >
          <div className="text-6xl mb-2">❌</div>
          <Radio
            name="true-false-answer"
            value="false"
            checked={selectedAnswer === false}
            onChange={(checked) => checked && onChange?.(false)}
            disabled={disabled}
          />
          <div className="text-center">
            <div className="font-bold text-lg text-red-700 dark:text-red-300">X</div>
            <div className="text-sm text-text-secondary">거짓 / 틀림</div>
          </div>
          {selectedAnswer === false && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
              ✓
            </div>
          )}
        </label>
      </div>

      {/* 선택 상태 표시 */}
      <div className="text-center">
        {selectedAnswer !== null && selectedAnswer !== undefined ? (
          <div className="text-sm font-medium text-green-600">
            ✅ {selectedAnswer ? 'O (참)' : 'X (거짓)'}을 선택했습니다
          </div>
        ) : (
          <div className="text-sm text-text-secondary">
            답을 선택해주세요
          </div>
        )}
      </div>

      {/* 키보드 단축키 안내 */}
      <div className="text-center">
        <details className="text-xs text-text-tertiary">
          <summary className="cursor-pointer hover:text-text-secondary">
            키보드 단축키 보기
          </summary>
          <div className="mt-2 space-y-1">
            <div>O / 1 : O(참) 선택</div>
            <div>X / 2 : X(거짓) 선택</div>
            <div>Space : 선택 초기화</div>
          </div>
        </details>
      </div>

      {/* 선택 초기화 버튼 */}
      {selectedAnswer !== null && selectedAnswer !== undefined && (
        <div className="text-center pt-2">
          <button
            onClick={() => onChange?.(null as any)}
            disabled={disabled}
            className="text-text-tertiary hover:text-text-secondary text-sm underline"
          >
            선택 초기화
          </button>
        </div>
      )}
    </div>
  );
}