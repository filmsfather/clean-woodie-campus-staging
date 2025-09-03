import React, { useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Checkbox,
} from '../../ui';

export interface MultipleChoiceData {
  choices: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
}

interface MultipleChoiceEditorProps {
  data?: MultipleChoiceData;
  onChange?: (data: MultipleChoiceData) => void;
  disabled?: boolean;
}

export function MultipleChoiceEditor({
  data,
  onChange,
  disabled = false,
}: MultipleChoiceEditorProps) {
  const [choices, setChoices] = useState(
    data?.choices || [
      { id: '1', text: '', isCorrect: false },
      { id: '2', text: '', isCorrect: false },
    ]
  );

  const handleChoicesChange = useCallback((newChoices: typeof choices) => {
    setChoices(newChoices);
    onChange?.({ choices: newChoices });
  }, [onChange]);

  const addChoice = useCallback(() => {
    const newChoice = {
      id: Date.now().toString(),
      text: '',
      isCorrect: false,
    };
    handleChoicesChange([...choices, newChoice]);
  }, [choices, handleChoicesChange]);

  const removeChoice = useCallback((choiceId: string) => {
    if (choices.length <= 2) return; // 최소 2개 유지
    handleChoicesChange(choices.filter(choice => choice.id !== choiceId));
  }, [choices, handleChoicesChange]);

  const updateChoiceText = useCallback((choiceId: string, text: string) => {
    handleChoicesChange(
      choices.map(choice =>
        choice.id === choiceId ? { ...choice, text } : choice
      )
    );
  }, [choices, handleChoicesChange]);

  const updateChoiceCorrectness = useCallback((choiceId: string, isCorrect: boolean) => {
    handleChoicesChange(
      choices.map(choice =>
        choice.id === choiceId ? { ...choice, isCorrect } : choice
      )
    );
  }, [choices, handleChoicesChange]);

  const correctCount = choices.filter(choice => choice.isCorrect).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            🔘 객관식 선택지
            <span className="text-sm font-normal text-text-secondary">
              ({choices.length}개, 정답 {correctCount}개)
            </span>
          </CardTitle>
          <Button
            size="sm"
            onClick={addChoice}
            disabled={disabled || choices.length >= 6} // 최대 6개 제한
          >
            + 선택지 추가
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 안내 메시지 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-200">
            💡 각 선택지를 입력하고, 정답에 해당하는 선택지를 체크해주세요. 
            복수 정답이 가능합니다.
          </p>
        </div>

        {/* 선택지 목록 */}
        <div className="space-y-3">
          {choices.map((choice, index) => (
            <div key={choice.id} className="flex items-start gap-3 p-3 border border-border-primary rounded-lg">
              {/* 선택지 번호 */}
              <div className="flex-shrink-0 w-8 h-8 bg-surface-secondary rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>

              {/* 정답 체크박스 */}
              <div className="flex-shrink-0 pt-2">
                <Checkbox
                  checked={choice.isCorrect}
                  onChange={(checked) => updateChoiceCorrectness(choice.id, checked)}
                  disabled={disabled}
                  aria-label={`선택지 ${index + 1} 정답 여부`}
                />
              </div>

              {/* 선택지 텍스트 입력 */}
              <div className="flex-1">
                <Input
                  value={choice.text}
                  onChange={(e) => updateChoiceText(choice.id, e.target.value)}
                  placeholder={`${index + 1}번 선택지를 입력하세요`}
                  disabled={disabled}
                  className={choice.isCorrect ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : ''}
                />
                {choice.isCorrect && (
                  <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ✓ 정답으로 설정됨
                  </div>
                )}
              </div>

              {/* 삭제 버튼 */}
              <div className="flex-shrink-0 pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeChoice(choice.id)}
                  disabled={disabled || choices.length <= 2}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* 상태 안내 */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-text-secondary">
            선택지 {choices.length}/6개 
            {choices.length >= 6 && ' (최대)'}
          </div>
          <div className={`font-medium ${
            correctCount === 0 
              ? 'text-red-600' 
              : correctCount === 1 
                ? 'text-green-600'
                : 'text-blue-600'
          }`}>
            {correctCount === 0 
              ? '정답을 선택해주세요' 
              : correctCount === 1
                ? '단일 정답'
                : `복수 정답 (${correctCount}개)`
            }
          </div>
        </div>

        {/* 경고 메시지 */}
        {correctCount === 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">
              ⚠️ 정답을 최소 1개 이상 선택해주세요.
            </p>
          </div>
        )}

        {/* 빈 선택지 경고 */}
        {choices.some(choice => !choice.text.trim()) && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ 모든 선택지를 입력해주세요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}