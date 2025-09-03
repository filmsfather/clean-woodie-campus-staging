import React, { useState, useCallback } from 'react';
import { Checkbox, Radio } from '../../ui';

interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface MultipleChoiceAnswerProps {
  choices: Choice[];
  selectedAnswers: string[]; // 선택된 답안 ID들
  onChange?: (selectedAnswers: string[]) => void;
  disabled?: boolean;
  allowMultiple?: boolean; // 복수 선택 허용 여부 (자동 감지하지만 강제 설정 가능)
}

export function MultipleChoiceAnswer({
  choices,
  selectedAnswers = [],
  onChange,
  disabled = false,
  allowMultiple,
}: MultipleChoiceAnswerProps) {
  // 복수 정답이 있는지 자동 감지 (편집 모드에서만 확인 가능)
  const hasMultipleCorrect = choices.filter(choice => choice.isCorrect).length > 1;
  const isMultipleChoice = allowMultiple ?? hasMultipleCorrect;

  const handleSelectionChange = useCallback((choiceId: string, isSelected: boolean) => {
    let newSelectedAnswers: string[];

    if (isMultipleChoice) {
      // 복수 선택 모드
      if (isSelected) {
        newSelectedAnswers = [...selectedAnswers, choiceId];
      } else {
        newSelectedAnswers = selectedAnswers.filter(id => id !== choiceId);
      }
    } else {
      // 단일 선택 모드
      newSelectedAnswers = isSelected ? [choiceId] : [];
    }

    onChange?.(newSelectedAnswers);
  }, [selectedAnswers, isMultipleChoice, onChange]);

  if (choices.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">❓</div>
        <p className="text-text-secondary">
          선택할 수 있는 답안이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 안내 메시지 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          {isMultipleChoice ? (
            <>✓ 정답을 모두 선택해주세요. (복수 선택 가능)</>
          ) : (
            <>○ 정답을 하나만 선택해주세요.</>
          )}
        </p>
      </div>

      {/* 선택지 목록 */}
      <div className="space-y-3">
        {choices.map((choice, index) => {
          const isSelected = selectedAnswers.includes(choice.id);
          
          return (
            <label
              key={choice.id}
              className={`
                flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200
                ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-surface-secondary'}
                ${isSelected 
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                  : 'border-border-primary'
                }
              `}
            >
              {/* 선택 컨트롤 */}
              <div className="flex-shrink-0 mt-0.5">
                {isMultipleChoice ? (
                  <Checkbox
                    checked={isSelected}
                    onChange={(checked) => handleSelectionChange(choice.id, checked)}
                    disabled={disabled}
                    aria-label={`선택지 ${index + 1}`}
                  />
                ) : (
                  <Radio
                    name="multiple-choice-answer"
                    value={choice.id}
                    checked={isSelected}
                    onChange={(checked) => handleSelectionChange(choice.id, checked)}
                    disabled={disabled}
                    aria-label={`선택지 ${index + 1}`}
                  />
                )}
              </div>

              {/* 선택지 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 font-medium text-text-primary">
                    {index + 1}.
                  </span>
                  <span className={`
                    flex-1 text-text-primary
                    ${isSelected ? 'font-medium' : ''}
                  `}>
                    {choice.text}
                  </span>
                </div>
              </div>

              {/* 선택 상태 표시 */}
              {isSelected && (
                <div className="flex-shrink-0 text-brand-600 text-sm font-medium">
                  선택됨
                </div>
              )}
            </label>
          );
        })}
      </div>

      {/* 선택 상태 요약 */}
      <div className="flex items-center justify-between text-sm py-2">
        <div className="text-text-secondary">
          {selectedAnswers.length > 0 ? (
            <span>
              {selectedAnswers.length}개 선택
              {isMultipleChoice && selectedAnswers.length > 1 && ' (복수 선택)'}
            </span>
          ) : (
            <span>답안을 선택해주세요</span>
          )}
        </div>
        
        {selectedAnswers.length > 0 && (
          <button
            onClick={() => onChange?.([])}
            disabled={disabled}
            className="text-text-tertiary hover:text-text-secondary text-sm underline"
          >
            선택 초기화
          </button>
        )}
      </div>

      {/* 추가 안내 (복수 선택인 경우) */}
      {isMultipleChoice && selectedAnswers.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            ✅ {selectedAnswers.length}개의 답안을 선택했습니다. 
            다른 선택지도 정답일 수 있으니 신중히 검토해주세요.
          </p>
        </div>
      )}

      {/* 키보드 단축키 안내 */}
      <div className="text-xs text-text-tertiary">
        <p>
          💡 <strong>팁:</strong> 숫자 키 1-{Math.min(choices.length, 9)}를 눌러 빠르게 선택할 수 있습니다.
          {isMultipleChoice && ' 스페이스바로 현재 선택을 토글할 수 있습니다.'}
        </p>
      </div>
    </div>
  );
}