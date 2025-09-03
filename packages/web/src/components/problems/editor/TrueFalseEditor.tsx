import React, { useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Radio,
  Badge,
} from '../../ui';

export interface TrueFalseData {
  correctAnswer: boolean;
  explanation?: string;
}

interface TrueFalseEditorProps {
  data?: TrueFalseData;
  onChange?: (data: TrueFalseData) => void;
  disabled?: boolean;
}

export function TrueFalseEditor({
  data,
  onChange,
  disabled = false,
}: TrueFalseEditorProps) {
  const [correctAnswer, setCorrectAnswer] = useState(
    data?.correctAnswer ?? null as boolean | null
  );
  const [explanation, setExplanation] = useState(data?.explanation || '');

  const handleDataChange = useCallback((updates: Partial<TrueFalseData>) => {
    const newData: TrueFalseData = {
      correctAnswer: correctAnswer ?? true,
      explanation,
      ...updates,
    };
    onChange?.(newData);
  }, [correctAnswer, explanation, onChange]);

  const handleAnswerChange = useCallback((value: boolean) => {
    setCorrectAnswer(value);
    handleDataChange({ correctAnswer: value });
  }, [handleDataChange]);

  const handleExplanationChange = useCallback((value: string) => {
    setExplanation(value);
    handleDataChange({ explanation: value });
  }, [handleDataChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ✅ OX형 정답 설정
          <Badge variant={correctAnswer !== null ? 'success' : 'error'} size="sm">
            {correctAnswer !== null ? '설정 완료' : '정답 선택 필요'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 안내 메시지 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-200">
            💡 문제에 대한 올바른 답을 선택해주세요. 
            필요하다면 해설도 추가할 수 있습니다.
          </p>
        </div>

        {/* 정답 선택 */}
        <div className="space-y-4">
          <h4 className="font-medium text-text-primary">정답 선택</h4>
          
          <div className="space-y-3">
            <label 
              className={`
                flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                ${correctAnswer === true 
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                  : 'border-border-primary hover:bg-surface-secondary'
                }
                ${disabled ? 'cursor-not-allowed opacity-60' : ''}
              `}
            >
              <Radio
                name="true-false-correct"
                value="true"
                checked={correctAnswer === true}
                onChange={(checked) => checked && handleAnswerChange(true)}
                disabled={disabled}
              />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⭕</span>
                  <div>
                    <div className="font-medium text-lg">O (참)</div>
                    <div className="text-sm text-text-secondary">
                      문제의 내용이 올바릅니다
                    </div>
                  </div>
                </div>
              </div>
              {correctAnswer === true && (
                <Badge variant="success" size="sm">정답</Badge>
              )}
            </label>

            <label 
              className={`
                flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                ${correctAnswer === false 
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                  : 'border-border-primary hover:bg-surface-secondary'
                }
                ${disabled ? 'cursor-not-allowed opacity-60' : ''}
              `}
            >
              <Radio
                name="true-false-correct"
                value="false"
                checked={correctAnswer === false}
                onChange={(checked) => checked && handleAnswerChange(false)}
                disabled={disabled}
              />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <div className="font-medium text-lg">X (거짓)</div>
                    <div className="text-sm text-text-secondary">
                      문제의 내용이 틀렸습니다
                    </div>
                  </div>
                </div>
              </div>
              {correctAnswer === false && (
                <Badge variant="success" size="sm">정답</Badge>
              )}
            </label>
          </div>
        </div>

        {/* 해설 (선택사항) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-text-primary">해설 (선택사항)</h4>
            <Badge variant="outline" size="sm">
              {explanation.trim() ? '작성됨' : '미작성'}
            </Badge>
          </div>
          
          <textarea
            className="w-full p-3 text-sm border border-border-primary rounded-lg bg-surface-primary text-text-primary placeholder-text-tertiary resize-none"
            rows={4}
            value={explanation}
            onChange={(e) => handleExplanationChange(e.target.value)}
            placeholder="왜 이 답이 맞는지 설명해주세요..."
            disabled={disabled}
            maxLength={500}
          />
          
          <div className="flex justify-between text-xs text-text-secondary">
            <div>
              학생들이 틀렸을 때 표시될 해설입니다
            </div>
            <div>
              {explanation.length}/500자
            </div>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
          <h4 className="font-medium text-text-primary mb-3">학생 화면 미리보기</h4>
          <div className="space-y-4">
            <div className="flex gap-4 justify-center">
              <label className="flex items-center gap-2 p-3 rounded-lg border border-border-primary bg-white dark:bg-gray-800 cursor-pointer hover:bg-surface-secondary">
                <Radio name="preview-tf" value="true" disabled />
                <span className="text-lg">⭕ O (참)</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-lg border border-border-primary bg-white dark:bg-gray-800 cursor-pointer hover:bg-surface-secondary">
                <Radio name="preview-tf" value="false" disabled />
                <span className="text-lg">❌ X (거짓)</span>
              </label>
            </div>
            
            {correctAnswer !== null && (
              <div className="text-center">
                <div className="text-sm text-text-secondary mb-1">정답</div>
                <Badge variant="success">
                  {correctAnswer ? 'O (참)' : 'X (거짓)'}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* 경고 메시지 */}
        {correctAnswer === null && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">
              ⚠️ 정답을 선택해주세요.
            </p>
          </div>
        )}

        {/* 팁 */}
        <div className="bg-surface-secondary rounded-lg p-3">
          <div className="text-sm space-y-1">
            <div className="font-medium text-text-primary">💡 좋은 OX 문제 작성 팁</div>
            <div className="text-text-secondary space-y-1">
              <div>• 명확하고 구체적인 문장으로 작성하세요</div>
              <div>• 애매한 표현이나 주관적 판단은 피하세요</div>
              <div>• 학생들이 헷갈릴 수 있는 부분은 해설로 설명하세요</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}