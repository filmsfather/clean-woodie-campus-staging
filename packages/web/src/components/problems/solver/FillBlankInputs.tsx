import React, { useCallback, useMemo } from 'react';
import {
  Input,
  Card,
  CardContent,
  Badge,
} from '../../ui';

interface BlankConfig {
  id: string;
  placeholder?: string;
  maxLength?: number;
}

interface FillBlankInputsProps {
  text: string; // __blank__ 형태로 빈칸이 표시된 텍스트
  blanks: BlankConfig[];
  answers: { [blankId: string]: string }; // 각 빈칸의 답안
  onChange: (answers: { [blankId: string]: string }) => void;
  disabled?: boolean;
}

export function FillBlankInputs({
  text,
  blanks,
  answers,
  onChange,
  disabled = false,
}: FillBlankInputsProps) {
  // 텍스트를 파싱하여 렌더링할 요소들 생성
  const renderedElements = useMemo(() => {
    if (!text) return [];

    const parts = text.split('__blank__');
    const elements = [];

    parts.forEach((part, index) => {
      // 텍스트 부분 추가
      if (part) {
        elements.push({
          type: 'text',
          content: part,
          key: `text-${index}`,
        });
      }

      // 빈칸이 있는 경우 입력 필드 추가
      if (index < parts.length - 1) {
        const blankId = `blank_${index}`;
        const blankConfig = blanks.find(b => b.id === blankId);
        
        elements.push({
          type: 'blank',
          blankId,
          config: blankConfig,
          key: `blank-${index}`,
          index,
        });
      }
    });

    return elements;
  }, [text, blanks]);

  // 답안 변경 핸들러
  const handleAnswerChange = useCallback((blankId: string, value: string) => {
    onChange({
      ...answers,
      [blankId]: value,
    });
  }, [answers, onChange]);

  // 입력 필드 렌더링
  const renderBlankInput = (blankId: string, config: BlankConfig | undefined, index: number) => {
    const currentAnswer = answers[blankId] || '';
    const placeholder = config?.placeholder || `빈칸 ${index + 1}`;
    const maxLength = config?.maxLength;
    
    return (
      <span className="inline-block mx-1">
        <Input
          value={currentAnswer}
          onChange={(e) => handleAnswerChange(blankId, e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className="inline-block w-32 h-8 text-center text-sm border-2 border-primary-300 focus:border-primary-500"
          style={{
            minWidth: Math.max(80, placeholder.length * 8) + 'px',
          }}
        />
      </span>
    );
  };

  // 답안 상태 확인
  const getAnswerStats = () => {
    const totalBlanks = blanks.length;
    const filledBlanks = Object.values(answers).filter(answer => answer.trim() !== '').length;
    return { totalBlanks, filledBlanks };
  };

  const { totalBlanks, filledBlanks } = getAnswerStats();

  return (
    <div className="space-y-4">
      {/* 메인 텍스트와 입력 필드 */}
      <Card>
        <CardContent className="p-6">
          <div className="text-lg leading-relaxed">
            {renderedElements.map((element) => {
              if (element.type === 'text') {
                return (
                  <span 
                    key={element.key} 
                    className="text-text-primary"
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {element.content}
                  </span>
                );
              } else if (element.type === 'blank') {
                return (
                  <span key={element.key}>
                    {renderBlankInput(element.blankId, element.config, element.index)}
                  </span>
                );
              }
              return null;
            })}
          </div>
        </CardContent>
      </Card>

      {/* 진행 상황 표시 */}
      <Card className="bg-surface-secondary">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-primary">
                작성 진행률:
              </span>
              <Badge variant={filledBlanks === totalBlanks ? 'success' : 'default'}>
                {filledBlanks} / {totalBlanks} 완료
              </Badge>
            </div>

            {filledBlanks < totalBlanks && (
              <span className="text-xs text-text-secondary">
                {totalBlanks - filledBlanks}개의 빈칸이 남았습니다.
              </span>
            )}
          </div>

          {/* 개별 빈칸 상태 (옵션) */}
          {totalBlanks > 1 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {blanks.map((blank, index) => {
                const hasAnswer = answers[blank.id]?.trim() !== '';
                return (
                  <div
                    key={blank.id}
                    className={`w-6 h-6 text-xs rounded flex items-center justify-center ${
                      hasAnswer
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-500 border border-gray-300'
                    }`}
                    title={`빈칸 ${index + 1}: ${hasAnswer ? '작성됨' : '미작성'}`}
                  >
                    {index + 1}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 도움말 메시지 */}
      {totalBlanks > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="py-3">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div className="font-medium mb-1">💡 답안 작성 안내</div>
              <ul className="text-xs space-y-1">
                <li>• 각 빈칸에 적절한 답안을 입력하세요</li>
                <li>• 대소문자나 띄어쓰기에 주의하세요</li>
                <li>• 모든 빈칸을 채워야 제출할 수 있습니다</li>
                {blanks.some(b => b.maxLength) && (
                  <li>• 일부 빈칸은 글자 수 제한이 있습니다</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}