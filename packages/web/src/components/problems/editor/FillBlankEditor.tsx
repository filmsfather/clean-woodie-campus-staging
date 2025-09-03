import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Textarea,
  Checkbox,
  Badge,
} from '../../ui';

// 도메인의 FillBlankContent와 일치하는 타입
export interface FillBlankData {
  text: string; // __blank__ 형태로 빈칸 표시
  blanks: {
    id: string;
    acceptedAnswers: string[];
    caseSensitive?: boolean;
    placeholder?: string;
    maxLength?: number;
  }[];
  allowsPartialCredit?: boolean;
}

interface FillBlankEditorProps {
  data?: FillBlankData;
  onChange: (data: FillBlankData) => void;
  disabled?: boolean;
}

export function FillBlankEditor({
  data = { text: '', blanks: [] },
  onChange,
  disabled = false,
}: FillBlankEditorProps) {
  const [newAnswer, setNewAnswer] = useState('');
  const [selectedBlankId, setSelectedBlankId] = useState<string | null>(null);

  // 텍스트에서 빈칸 찾기
  const blankMatches = useMemo(() => {
    const matches = [];
    const regex = /__blank__/g;
    let match;
    let index = 0;
    
    while ((match = regex.exec(data.text)) !== null) {
      matches.push({
        index,
        position: match.index,
        id: `blank_${index}`,
      });
      index++;
    }
    
    return matches;
  }, [data.text]);

  // 빈칸 ID 생성
  const generateBlankId = (index: number) => `blank_${index}`;

  // 텍스트 변경 시 빈칸 배열 동기화
  const handleTextChange = useCallback((text: string) => {
    const newBlankMatches = [];
    const regex = /__blank__/g;
    let match;
    let index = 0;
    
    while ((match = regex.exec(text)) !== null) {
      newBlankMatches.push({
        index,
        id: generateBlankId(index),
      });
      index++;
    }

    // 기존 빈칸 데이터 유지하면서 새로운 빈칸 추가
    const newBlanks = newBlankMatches.map(blankMatch => {
      const existingBlank = data.blanks.find(blank => blank.id === blankMatch.id);
      return existingBlank || {
        id: blankMatch.id,
        acceptedAnswers: [],
        caseSensitive: false,
      };
    });

    onChange({
      ...data,
      text,
      blanks: newBlanks,
    });
  }, [data, onChange]);

  // 빈칸 추가 버튼
  const handleAddBlank = useCallback(() => {
    const newText = data.text + (data.text ? ' ' : '') + '__blank__';
    handleTextChange(newText);
  }, [data.text, handleTextChange]);

  // 빈칸별 정답 추가
  const handleAddAnswer = useCallback((blankId: string) => {
    if (!newAnswer.trim()) return;

    const blankIndex = data.blanks.findIndex(blank => blank.id === blankId);
    if (blankIndex === -1) return;

    const blank = data.blanks[blankIndex];
    if (blank.acceptedAnswers.includes(newAnswer.trim())) return;

    const updatedBlanks = [...data.blanks];
    updatedBlanks[blankIndex] = {
      ...blank,
      acceptedAnswers: [...blank.acceptedAnswers, newAnswer.trim()],
    };

    onChange({
      ...data,
      blanks: updatedBlanks,
    });

    setNewAnswer('');
  }, [data, newAnswer, onChange]);

  // 정답 제거
  const handleRemoveAnswer = useCallback((blankId: string, answerToRemove: string) => {
    const blankIndex = data.blanks.findIndex(blank => blank.id === blankId);
    if (blankIndex === -1) return;

    const blank = data.blanks[blankIndex];
    const updatedBlanks = [...data.blanks];
    updatedBlanks[blankIndex] = {
      ...blank,
      acceptedAnswers: blank.acceptedAnswers.filter(answer => answer !== answerToRemove),
    };

    onChange({
      ...data,
      blanks: updatedBlanks,
    });
  }, [data, onChange]);

  // 빈칸 옵션 업데이트
  const handleUpdateBlankOption = useCallback((blankId: string, field: string, value: any) => {
    const blankIndex = data.blanks.findIndex(blank => blank.id === blankId);
    if (blankIndex === -1) return;

    const updatedBlanks = [...data.blanks];
    updatedBlanks[blankIndex] = {
      ...updatedBlanks[blankIndex],
      [field]: value,
    };

    onChange({
      ...data,
      blanks: updatedBlanks,
    });
  }, [data, onChange]);

  // 부분 점수 허용 설정
  const handleTogglePartialCredit = useCallback((allowed: boolean) => {
    onChange({
      ...data,
      allowsPartialCredit: allowed,
    });
  }, [data, onChange]);

  // 텍스트 미리보기 (빈칸을 입력 필드로 표시)
  const renderPreview = () => {
    if (!data.text) return null;

    const parts = data.text.split('__blank__');
    const elements = [];

    parts.forEach((part, index) => {
      elements.push(<span key={`text-${index}`}>{part}</span>);
      
      if (index < parts.length - 1) {
        const blankId = generateBlankId(index);
        const blank = data.blanks.find(b => b.id === blankId);
        
        elements.push(
          <span
            key={`blank-${index}`}
            className="inline-block mx-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 rounded text-blue-800 dark:text-blue-200 text-sm"
          >
            빈칸 {index + 1}
            {blank?.acceptedAnswers.length > 0 && (
              <span className="ml-1 text-xs">
                ({blank.acceptedAnswers.length}개 정답)
              </span>
            )}
          </span>
        );
      }
    });

    return <div className="leading-relaxed">{elements}</div>;
  };

  return (
    <div className="space-y-6">
      {/* 기본 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>빈칸 채우기 문제 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={data.allowsPartialCredit || false}
              onCheckedChange={handleTogglePartialCredit}
              disabled={disabled}
              id="partial-credit"
            />
            <label htmlFor="partial-credit" className="text-sm font-medium text-text-primary">
              부분 점수 허용
            </label>
            <span className="text-xs text-text-secondary">
              (일부 빈칸만 맞춰도 점수 부여)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 문제 텍스트 작성 */}
      <Card>
        <CardHeader>
          <CardTitle>문제 텍스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-text-primary">
                문제 텍스트 (빈칸은 __blank__로 표시)
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddBlank}
                disabled={disabled}
              >
                빈칸 추가
              </Button>
            </div>
            
            <Textarea
              value={data.text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="문제 텍스트를 입력하고 빈칸이 들어갈 위치에 __blank__를 입력하세요.&#10;&#10;예: 대한민국의 수도는 __blank__이고, 가장 큰 도시는 __blank__입니다."
              className="min-h-[120px] font-mono"
              disabled={disabled}
            />
            
            <p className="text-xs text-text-secondary mt-2">
              __blank__ 를 입력하면 빈칸이 생성됩니다. 감지된 빈칸: {blankMatches.length}개
            </p>
          </div>

          {/* 미리보기 */}
          {data.text && (
            <div className="p-4 bg-surface-secondary rounded-lg">
              <h4 className="text-sm font-medium text-text-primary mb-2">미리보기:</h4>
              {renderPreview()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 빈칸별 정답 설정 */}
      {data.blanks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>빈칸별 정답 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.blanks.map((blank, index) => (
              <div key={blank.id} className="border border-border-secondary rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-text-primary">
                    빈칸 {index + 1}
                  </h4>
                  <Badge variant="outline">
                    {blank.acceptedAnswers.length}개 정답
                  </Badge>
                </div>

                {/* 정답 추가 */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={selectedBlankId === blank.id ? newAnswer : ''}
                      onChange={(e) => {
                        setSelectedBlankId(blank.id);
                        setNewAnswer(e.target.value);
                      }}
                      onFocus={() => setSelectedBlankId(blank.id)}
                      placeholder="정답 입력"
                      disabled={disabled}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAnswer(blank.id);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddAnswer(blank.id)}
                      disabled={disabled || (selectedBlankId === blank.id && !newAnswer.trim())}
                    >
                      추가
                    </Button>
                  </div>

                  {/* 기존 정답 목록 */}
                  {blank.acceptedAnswers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {blank.acceptedAnswers.map((answer) => (
                        <Badge
                          key={answer}
                          variant="secondary"
                          className="cursor-pointer hover:bg-red-50"
                          onClick={() => !disabled && handleRemoveAnswer(blank.id, answer)}
                        >
                          {answer} {!disabled && '✕'}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 빈칸 옵션 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border-secondary">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={blank.caseSensitive || false}
                        onCheckedChange={(checked) => 
                          handleUpdateBlankOption(blank.id, 'caseSensitive', checked)
                        }
                        disabled={disabled}
                        id={`case-${blank.id}`}
                      />
                      <label htmlFor={`case-${blank.id}`} className="text-sm text-text-primary">
                        대소문자 구분
                      </label>
                    </div>

                    <div>
                      <label className="text-xs text-text-secondary block mb-1">
                        안내 메시지
                      </label>
                      <Input
                        value={blank.placeholder || ''}
                        onChange={(e) => 
                          handleUpdateBlankOption(blank.id, 'placeholder', e.target.value)
                        }
                        placeholder="예: 도시명을 입력하세요"
                        disabled={disabled}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-text-secondary block mb-1">
                        최대 글자 수
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={blank.maxLength || ''}
                        onChange={(e) => 
                          handleUpdateBlankOption(blank.id, 'maxLength', 
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        placeholder="제한 없음"
                        disabled={disabled}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 도움말 */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <div className="font-medium mb-2">💡 빈칸 채우기 문제 작성 팁:</div>
            <ul className="space-y-1 text-xs">
              <li>• 문제 텍스트에서 빈칸이 될 위치에 __blank__ 를 입력하세요</li>
              <li>• 각 빈칸마다 여러 개의 정답을 설정할 수 있습니다</li>
              <li>• 대소문자 구분 옵션을 활용하여 정확한 답안을 요구하세요</li>
              <li>• 부분 점수를 허용하면 일부 빈칸만 맞춰도 점수를 받습니다</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}