import React, { useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Checkbox,
  Badge,
} from '../../ui';

export interface ShortAnswerData {
  correctAnswers: string[];
  caseSensitive: boolean;
  exactMatch: boolean;
  allowPartialCredit: boolean;
}

interface ShortAnswerEditorProps {
  data?: ShortAnswerData;
  onChange?: (data: ShortAnswerData) => void;
  disabled?: boolean;
}

export function ShortAnswerEditor({
  data,
  onChange,
  disabled = false,
}: ShortAnswerEditorProps) {
  const [correctAnswers, setCorrectAnswers] = useState(
    data?.correctAnswers || ['']
  );
  const [caseSensitive, setCaseSensitive] = useState(data?.caseSensitive || false);
  const [exactMatch, setExactMatch] = useState(data?.exactMatch || true);
  const [allowPartialCredit, setAllowPartialCredit] = useState(data?.allowPartialCredit || false);
  const [newAnswer, setNewAnswer] = useState('');

  const handleDataChange = useCallback((updates: Partial<ShortAnswerData>) => {
    const newData: ShortAnswerData = {
      correctAnswers,
      caseSensitive,
      exactMatch,
      allowPartialCredit,
      ...updates,
    };
    onChange?.(newData);
  }, [correctAnswers, caseSensitive, exactMatch, allowPartialCredit, onChange]);

  const handleAnswersChange = useCallback((newAnswers: string[]) => {
    setCorrectAnswers(newAnswers);
    handleDataChange({ correctAnswers: newAnswers });
  }, [handleDataChange]);

  const addAnswer = useCallback(() => {
    if (newAnswer.trim() && !correctAnswers.includes(newAnswer.trim())) {
      const updatedAnswers = [...correctAnswers, newAnswer.trim()];
      handleAnswersChange(updatedAnswers);
      setNewAnswer('');
    }
  }, [newAnswer, correctAnswers, handleAnswersChange]);

  const removeAnswer = useCallback((index: number) => {
    if (correctAnswers.length <= 1) return; // 최소 1개 유지
    const updatedAnswers = correctAnswers.filter((_, i) => i !== index);
    handleAnswersChange(updatedAnswers);
  }, [correctAnswers, handleAnswersChange]);

  const updateAnswer = useCallback((index: number, value: string) => {
    const updatedAnswers = correctAnswers.map((answer, i) => 
      i === index ? value : answer
    );
    handleAnswersChange(updatedAnswers);
  }, [correctAnswers, handleAnswersChange]);

  const handleCaseSensitiveChange = useCallback((checked: boolean) => {
    setCaseSensitive(checked);
    handleDataChange({ caseSensitive: checked });
  }, [handleDataChange]);

  const handleExactMatchChange = useCallback((checked: boolean) => {
    setExactMatch(checked);
    handleDataChange({ exactMatch: checked });
  }, [handleDataChange]);

  const handlePartialCreditChange = useCallback((checked: boolean) => {
    setAllowPartialCredit(checked);
    handleDataChange({ allowPartialCredit: checked });
  }, [handleDataChange]);

  const validAnswersCount = correctAnswers.filter(answer => answer.trim()).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ✏️ 단답형 정답 설정
          <Badge variant="outline" size="sm">
            {validAnswersCount}개 정답
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 안내 메시지 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-200">
            💡 학생들이 입력할 수 있는 모든 정답을 등록해주세요. 
            여러 표현이 가능한 경우 모두 추가하면 더 정확한 채점이 가능합니다.
          </p>
        </div>

        {/* 정답 목록 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-text-primary">정답 목록</h4>
            <Badge variant={validAnswersCount > 0 ? 'success' : 'error'} size="sm">
              {validAnswersCount > 0 ? '설정 완료' : '정답 필요'}
            </Badge>
          </div>

          {correctAnswers.map((answer, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium text-green-700">
                {index + 1}
              </div>
              <Input
                value={answer}
                onChange={(e) => updateAnswer(index, e.target.value)}
                placeholder={`${index + 1}번째 정답을 입력하세요`}
                disabled={disabled}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeAnswer(index)}
                disabled={disabled || correctAnswers.length <= 1}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                ✕
              </Button>
            </div>
          ))}
        </div>

        {/* 새 정답 추가 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Input
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="새 정답을 입력하세요"
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAnswer();
                }
              }}
            />
            <Button
              size="sm"
              onClick={addAnswer}
              disabled={disabled || !newAnswer.trim() || correctAnswers.includes(newAnswer.trim())}
            >
              추가
            </Button>
          </div>
          <p className="text-xs text-text-tertiary">
            Enter 키를 눌러 빠르게 추가할 수 있습니다
          </p>
        </div>

        {/* 채점 옵션 */}
        <div className="bg-surface-secondary rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-text-primary">채점 옵션</h4>
          
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={caseSensitive}
                onChange={handleCaseSensitiveChange}
                disabled={disabled}
                className="mt-0.5"
              />
              <div>
                <div className="font-medium text-sm">대소문자 구분</div>
                <div className="text-xs text-text-secondary">
                  체크하면 'Apple'과 'apple'을 다르게 판단합니다
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={exactMatch}
                onChange={handleExactMatchChange}
                disabled={disabled}
                className="mt-0.5"
              />
              <div>
                <div className="font-medium text-sm">정확한 일치</div>
                <div className="text-xs text-text-secondary">
                  체크 해제하면 공백이나 특수문자를 무시하고 채점합니다
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={allowPartialCredit}
                onChange={handlePartialCreditChange}
                disabled={disabled}
                className="mt-0.5"
              />
              <div>
                <div className="font-medium text-sm">부분 점수 허용</div>
                <div className="text-xs text-text-secondary">
                  유사한 답안에 대해 부분 점수를 부여합니다
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
          <h4 className="font-medium text-text-primary mb-3">학생 화면 미리보기</h4>
          <div className="space-y-3">
            <Input
              placeholder="여기에 답을 입력하세요..."
              disabled
              className="bg-white dark:bg-gray-800"
            />
            <div className="text-xs text-text-secondary space-y-1">
              <div><strong>정답 예시:</strong></div>
              {correctAnswers.filter(a => a.trim()).map((answer, index) => (
                <div key={index} className="text-green-600">
                  • {answer}
                  {!caseSensitive && answer !== answer.toLowerCase() && ` (또는 ${answer.toLowerCase()})`}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 경고 메시지 */}
        {validAnswersCount === 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">
              ⚠️ 정답을 최소 1개 이상 입력해주세요.
            </p>
          </div>
        )}

        {correctAnswers.some(answer => !answer.trim()) && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ 빈 정답이 있습니다. 모든 정답을 입력해주세요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}