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

// 도메인의 MatchingContent와 일치하는 타입
export interface MatchingData {
  correctMatches: {
    leftId: string;
    rightId: string;
  }[];
  allowsPartialCredit?: boolean;
  leftItems?: {
    id: string;
    text: string;
  }[];
  rightItems?: {
    id: string;
    text: string;
  }[];
}

interface MatchingEditorProps {
  data?: MatchingData;
  onChange: (data: MatchingData) => void;
  disabled?: boolean;
}

export function MatchingEditor({
  data = { correctMatches: [] },
  onChange,
  disabled = false,
}: MatchingEditorProps) {
  const [newLeftItem, setNewLeftItem] = useState('');
  const [newRightItem, setNewRightItem] = useState('');

  const leftItems = data.leftItems || [];
  const rightItems = data.rightItems || [];
  const correctMatches = data.correctMatches || [];

  // 고유 ID 생성
  const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 좌측 항목 추가
  const handleAddLeftItem = useCallback(() => {
    if (!newLeftItem.trim()) return;

    const newItem = {
      id: generateId('left'),
      text: newLeftItem.trim(),
    };

    onChange({
      ...data,
      leftItems: [...leftItems, newItem],
    });
    
    setNewLeftItem('');
  }, [data, leftItems, newLeftItem, onChange]);

  // 우측 항목 추가
  const handleAddRightItem = useCallback(() => {
    if (!newRightItem.trim()) return;

    const newItem = {
      id: generateId('right'),
      text: newRightItem.trim(),
    };

    onChange({
      ...data,
      rightItems: [...rightItems, newItem],
    });
    
    setNewRightItem('');
  }, [data, rightItems, newRightItem, onChange]);

  // 좌측 항목 삭제
  const handleRemoveLeftItem = useCallback((idToRemove: string) => {
    onChange({
      ...data,
      leftItems: leftItems.filter(item => item.id !== idToRemove),
      correctMatches: correctMatches.filter(match => match.leftId !== idToRemove),
    });
  }, [data, leftItems, correctMatches, onChange]);

  // 우측 항목 삭제
  const handleRemoveRightItem = useCallback((idToRemove: string) => {
    onChange({
      ...data,
      rightItems: rightItems.filter(item => item.id !== idToRemove),
      correctMatches: correctMatches.filter(match => match.rightId !== idToRemove),
    });
  }, [data, rightItems, correctMatches, onChange]);

  // 항목 텍스트 수정
  const handleUpdateLeftItem = useCallback((id: string, text: string) => {
    onChange({
      ...data,
      leftItems: leftItems.map(item => 
        item.id === id ? { ...item, text } : item
      ),
    });
  }, [data, leftItems, onChange]);

  const handleUpdateRightItem = useCallback((id: string, text: string) => {
    onChange({
      ...data,
      rightItems: rightItems.map(item => 
        item.id === id ? { ...item, text } : item
      ),
    });
  }, [data, rightItems, onChange]);

  // 매칭 관계 설정/해제
  const handleToggleMatch = useCallback((leftId: string, rightId: string) => {
    const existingMatchIndex = correctMatches.findIndex(
      match => match.leftId === leftId && match.rightId === rightId
    );

    let newMatches;
    if (existingMatchIndex >= 0) {
      // 매칭 해제
      newMatches = correctMatches.filter((_, index) => index !== existingMatchIndex);
    } else {
      // 매칭 설정
      newMatches = [...correctMatches, { leftId, rightId }];
    }

    onChange({
      ...data,
      correctMatches: newMatches,
    });
  }, [data, correctMatches, onChange]);

  // 부분 점수 허용 설정
  const handleTogglePartialCredit = useCallback((allowed: boolean) => {
    onChange({
      ...data,
      allowsPartialCredit: allowed,
    });
  }, [data, onChange]);

  // 매칭 상태 확인
  const isMatched = (leftId: string, rightId: string) => {
    return correctMatches.some(match => match.leftId === leftId && match.rightId === rightId);
  };

  // 각 좌측 항목이 매칭된 우측 항목들 확인
  const getMatchedRightItems = (leftId: string) => {
    return correctMatches.filter(match => match.leftId === leftId).map(match => match.rightId);
  };

  return (
    <div className="space-y-6">
      {/* 매칭 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>매칭 문제 설정</CardTitle>
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
              (일부 매칭만 맞춰도 점수 부여)
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측 항목 관리 */}
        <Card>
          <CardHeader>
            <CardTitle>좌측 항목</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 새 항목 추가 */}
            <div className="flex gap-2">
              <Input
                value={newLeftItem}
                onChange={(e) => setNewLeftItem(e.target.value)}
                placeholder="좌측 항목 입력"
                disabled={disabled}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLeftItem();
                  }
                }}
              />
              <Button size="sm" onClick={handleAddLeftItem} disabled={disabled}>
                추가
              </Button>
            </div>

            {/* 기존 항목 목록 */}
            <div className="space-y-2">
              {leftItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 p-3 border border-border-primary rounded-lg">
                  <span className="text-sm font-medium text-text-secondary w-8">
                    {index + 1}.
                  </span>
                  <Input
                    value={item.text}
                    onChange={(e) => handleUpdateLeftItem(item.id, e.target.value)}
                    placeholder="항목 텍스트"
                    disabled={disabled}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveLeftItem(item.id)}
                    disabled={disabled}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    삭제
                  </Button>
                </div>
              ))}
              
              {leftItems.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  좌측 항목을 추가해주세요.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 우측 항목 관리 */}
        <Card>
          <CardHeader>
            <CardTitle>우측 항목</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 새 항목 추가 */}
            <div className="flex gap-2">
              <Input
                value={newRightItem}
                onChange={(e) => setNewRightItem(e.target.value)}
                placeholder="우측 항목 입력"
                disabled={disabled}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRightItem();
                  }
                }}
              />
              <Button size="sm" onClick={handleAddRightItem} disabled={disabled}>
                추가
              </Button>
            </div>

            {/* 기존 항목 목록 */}
            <div className="space-y-2">
              {rightItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 p-3 border border-border-primary rounded-lg">
                  <span className="text-sm font-medium text-text-secondary w-8">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <Input
                    value={item.text}
                    onChange={(e) => handleUpdateRightItem(item.id, e.target.value)}
                    placeholder="항목 텍스트"
                    disabled={disabled}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveRightItem(item.id)}
                    disabled={disabled}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    삭제
                  </Button>
                </div>
              ))}
              
              {rightItems.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  우측 항목을 추가해주세요.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 매칭 관계 설정 */}
      {leftItems.length > 0 && rightItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>정답 매칭 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leftItems.map((leftItem, leftIndex) => (
                <div key={leftItem.id} className="border border-border-secondary rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-medium text-text-primary min-w-[20px]">
                      {leftIndex + 1}.
                    </span>
                    <span className="font-medium text-text-primary flex-1">
                      {leftItem.text}
                    </span>
                    <span className="text-sm text-text-secondary">
                      연결된 항목: {getMatchedRightItems(leftItem.id).length}개
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ml-8">
                    {rightItems.map((rightItem, rightIndex) => (
                      <label
                        key={rightItem.id}
                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                          isMatched(leftItem.id, rightItem.id)
                            ? 'bg-green-50 border-green-300 text-green-800'
                            : 'bg-surface-secondary border-border-primary hover:bg-surface-tertiary'
                        }`}
                      >
                        <Checkbox
                          checked={isMatched(leftItem.id, rightItem.id)}
                          onCheckedChange={() => !disabled && handleToggleMatch(leftItem.id, rightItem.id)}
                          disabled={disabled}
                        />
                        <span className="text-sm">
                          {String.fromCharCode(65 + rightIndex)}. {rightItem.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 매칭 요약 정보 */}
            <div className="mt-6 p-4 bg-surface-secondary rounded-lg">
              <h4 className="font-medium text-text-primary mb-2">매칭 요약</h4>
              <div className="text-sm text-text-secondary space-y-1">
                <div>• 총 매칭 관계: {correctMatches.length}개</div>
                <div>• 좌측 항목: {leftItems.length}개</div>
                <div>• 우측 항목: {rightItems.length}개</div>
                <div>• 부분 점수: {data.allowsPartialCredit ? '허용' : '비허용'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 도움말 */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <div className="font-medium mb-2">💡 매칭 문제 작성 팁:</div>
            <ul className="space-y-1 text-xs">
              <li>• 좌측과 우측에 각각 최소 2개 이상의 항목을 추가하세요</li>
              <li>• 하나의 좌측 항목이 여러 우측 항목과 매칭될 수 있습니다</li>
              <li>• 부분 점수를 허용하면 일부 매칭만 맞춰도 점수를 받을 수 있습니다</li>
              <li>• 항목 순서는 학생에게 무작위로 제시될 수 있습니다</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}