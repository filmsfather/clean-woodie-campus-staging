import React, { useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Textarea,
  Badge,
} from '../../ui';

// 도메인의 LongAnswerContent와 일치하는 타입
export interface LongAnswerData {
  sampleAnswer?: string;
  keywords?: string[];
  rubric?: {
    criteria: string;
    points: number;
    description: string;
  }[];
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
}

interface LongAnswerEditorProps {
  data?: LongAnswerData;
  onChange: (data: LongAnswerData) => void;
  disabled?: boolean;
}

export function LongAnswerEditor({
  data = {},
  onChange,
  disabled = false,
}: LongAnswerEditorProps) {
  const [newKeyword, setNewKeyword] = useState('');
  const [newCriteria, setNewCriteria] = useState({
    criteria: '',
    points: 5,
    description: '',
  });

  const handleSampleAnswerChange = useCallback((sampleAnswer: string) => {
    onChange({ ...data, sampleAnswer });
  }, [data, onChange]);

  const handleLengthChange = useCallback((field: 'minLength' | 'maxLength', value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    onChange({ ...data, [field]: numValue });
  }, [data, onChange]);

  const handlePlaceholderChange = useCallback((placeholder: string) => {
    onChange({ ...data, placeholder });
  }, [data, onChange]);

  // 키워드 관리
  const handleAddKeyword = useCallback(() => {
    if (!newKeyword.trim()) return;
    
    const keywords = data.keywords || [];
    if (keywords.includes(newKeyword.trim())) return;

    onChange({
      ...data,
      keywords: [...keywords, newKeyword.trim()],
    });
    setNewKeyword('');
  }, [data, newKeyword, onChange]);

  const handleRemoveKeyword = useCallback((keywordToRemove: string) => {
    const keywords = data.keywords || [];
    onChange({
      ...data,
      keywords: keywords.filter(keyword => keyword !== keywordToRemove),
    });
  }, [data, onChange]);

  // 채점 기준 관리
  const handleAddRubric = useCallback(() => {
    if (!newCriteria.criteria.trim() || !newCriteria.description.trim()) return;
    
    const rubric = data.rubric || [];
    onChange({
      ...data,
      rubric: [...rubric, { ...newCriteria }],
    });
    
    setNewCriteria({ criteria: '', points: 5, description: '' });
  }, [data, newCriteria, onChange]);

  const handleRemoveRubric = useCallback((index: number) => {
    const rubric = data.rubric || [];
    onChange({
      ...data,
      rubric: rubric.filter((_, i) => i !== index),
    });
  }, [data, onChange]);

  const handleUpdateRubric = useCallback((index: number, field: keyof typeof newCriteria, value: any) => {
    const rubric = data.rubric || [];
    const updatedRubric = rubric.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onChange({ ...data, rubric: updatedRubric });
  }, [data, onChange]);

  return (
    <div className="space-y-6">
      {/* 기본 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>서술형 문제 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary block mb-2">
              답안 입력 안내 메시지
            </label>
            <Input
              value={data.placeholder || ''}
              onChange={(e) => handlePlaceholderChange(e.target.value)}
              placeholder="예: 자세한 설명을 작성해주세요"
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-primary block mb-2">
                최소 글자 수
              </label>
              <Input
                type="number"
                min="1"
                max="10000"
                value={data.minLength || ''}
                onChange={(e) => handleLengthChange('minLength', e.target.value)}
                placeholder="예: 100"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary block mb-2">
                최대 글자 수
              </label>
              <Input
                type="number"
                min="1"
                max="10000"
                value={data.maxLength || ''}
                onChange={(e) => handleLengthChange('maxLength', e.target.value)}
                placeholder="예: 1000"
                disabled={disabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 모범 답안 */}
      <Card>
        <CardHeader>
          <CardTitle>모범 답안 (선택사항)</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium text-text-primary block mb-2">
              참고용 모범 답안
            </label>
            <Textarea
              value={data.sampleAnswer || ''}
              onChange={(e) => handleSampleAnswerChange(e.target.value)}
              placeholder="학생들에게 보여줄 모범 답안을 작성하세요..."
              className="min-h-[120px]"
              disabled={disabled}
            />
            <p className="text-xs text-text-secondary mt-2">
              채점 시 참고용으로 사용되며, 학생에게는 문제 제출 후 공개됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 핵심 키워드 */}
      <Card>
        <CardHeader>
          <CardTitle>핵심 키워드 (선택사항)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="핵심 키워드 입력"
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
            />
            <Button size="sm" onClick={handleAddKeyword} disabled={disabled}>
              추가
            </Button>
          </div>
          
          {data.keywords && data.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.keywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => !disabled && handleRemoveKeyword(keyword)}
                >
                  {keyword} {!disabled && '✕'}
                </Badge>
              ))}
            </div>
          )}
          
          <p className="text-xs text-text-secondary">
            채점 시 이 키워드들의 포함 여부를 확인할 수 있습니다.
          </p>
        </CardContent>
      </Card>

      {/* 채점 기준 */}
      <Card>
        <CardHeader>
          <CardTitle>채점 기준 (선택사항)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 새 채점 기준 추가 */}
          <div className="p-4 border border-border-secondary rounded-lg bg-surface-secondary">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-text-primary block mb-1">
                  채점 기준
                </label>
                <Input
                  value={newCriteria.criteria}
                  onChange={(e) => setNewCriteria(prev => ({ ...prev, criteria: e.target.value }))}
                  placeholder="예: 개념의 정확한 이해"
                  disabled={disabled}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-text-primary block mb-1">
                  배점
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={newCriteria.points}
                  onChange={(e) => setNewCriteria(prev => ({ ...prev, points: parseInt(e.target.value) || 5 }))}
                  disabled={disabled}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-text-primary block mb-1">
                  설명
                </label>
                <Textarea
                  value={newCriteria.description}
                  onChange={(e) => setNewCriteria(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="이 기준에 대한 상세 설명"
                  className="min-h-[60px]"
                  disabled={disabled}
                />
              </div>
              
              <Button 
                size="sm" 
                onClick={handleAddRubric} 
                disabled={disabled || !newCriteria.criteria.trim() || !newCriteria.description.trim()}
              >
                채점 기준 추가
              </Button>
            </div>
          </div>

          {/* 기존 채점 기준 목록 */}
          {data.rubric && data.rubric.length > 0 && (
            <div className="space-y-3">
              {data.rubric.map((criterion, index) => (
                <div key={index} className="p-4 border border-border-primary rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={criterion.criteria}
                          onChange={(e) => handleUpdateRubric(index, 'criteria', e.target.value)}
                          placeholder="채점 기준"
                          disabled={disabled}
                          className="flex-1"
                        />
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="1"
                            max="50"
                            value={criterion.points}
                            onChange={(e) => handleUpdateRubric(index, 'points', parseInt(e.target.value) || 5)}
                            disabled={disabled}
                            className="w-16"
                          />
                          <span className="text-sm text-text-secondary">점</span>
                        </div>
                      </div>
                      <Textarea
                        value={criterion.description}
                        onChange={(e) => handleUpdateRubric(index, 'description', e.target.value)}
                        placeholder="기준 설명"
                        className="min-h-[60px]"
                        disabled={disabled}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveRubric(index)}
                      disabled={disabled}
                      className="ml-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="text-sm text-text-secondary">
                총 배점: {data.rubric.reduce((sum, criterion) => sum + criterion.points, 0)}점
              </div>
            </div>
          )}
          
          <p className="text-xs text-text-secondary">
            세부적인 채점 기준을 설정하면 일관된 평가가 가능합니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}