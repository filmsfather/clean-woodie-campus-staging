import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  Button,
  Badge,
} from '../../ui';

interface MatchingItem {
  id: string;
  text: string;
}

interface MatchingAnswer {
  leftId: string;
  rightId: string;
}

interface MatchingInterfaceProps {
  leftItems: MatchingItem[];
  rightItems: MatchingItem[];
  selectedAnswers: MatchingAnswer[];
  onChange: (answers: MatchingAnswer[]) => void;
  disabled?: boolean;
}

export function MatchingInterface({
  leftItems,
  rightItems,
  selectedAnswers = [],
  onChange,
  disabled = false,
}: MatchingInterfaceProps) {
  const [selectedLeftItem, setSelectedLeftItem] = useState<string | null>(null);

  // 우측 항목을 랜덤하게 섞어서 표시 (컴포넌트 마운트 시 한 번만)
  const shuffledRightItems = useMemo(() => {
    const shuffled = [...rightItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [rightItems]);

  // 매칭 관계 확인
  const isMatched = useCallback((leftId: string, rightId: string) => {
    return selectedAnswers.some(answer => 
      answer.leftId === leftId && answer.rightId === rightId
    );
  }, [selectedAnswers]);

  // 좌측 항목의 매칭된 우측 항목들 가져오기
  const getMatchedRightItems = useCallback((leftId: string) => {
    return selectedAnswers
      .filter(answer => answer.leftId === leftId)
      .map(answer => answer.rightId);
  }, [selectedAnswers]);

  // 우측 항목의 매칭된 좌측 항목들 가져오기  
  const getMatchedLeftItems = useCallback((rightId: string) => {
    return selectedAnswers
      .filter(answer => answer.rightId === rightId)
      .map(answer => answer.leftId);
  }, [selectedAnswers]);

  // 좌측 항목 선택
  const handleSelectLeftItem = useCallback((leftId: string) => {
    if (disabled) return;
    
    if (selectedLeftItem === leftId) {
      setSelectedLeftItem(null); // 선택 해제
    } else {
      setSelectedLeftItem(leftId); // 선택
    }
  }, [disabled, selectedLeftItem]);

  // 우측 항목 클릭 시 매칭/매칭 해제
  const handleRightItemClick = useCallback((rightId: string) => {
    if (disabled || !selectedLeftItem) return;

    const existingMatch = selectedAnswers.find(answer => 
      answer.leftId === selectedLeftItem && answer.rightId === rightId
    );

    let newAnswers;
    if (existingMatch) {
      // 기존 매칭 해제
      newAnswers = selectedAnswers.filter(answer => 
        !(answer.leftId === selectedLeftItem && answer.rightId === rightId)
      );
    } else {
      // 새로운 매칭 추가
      newAnswers = [...selectedAnswers, { leftId: selectedLeftItem, rightId }];
    }

    onChange(newAnswers);
    setSelectedLeftItem(null); // 선택 해제
  }, [disabled, selectedLeftItem, selectedAnswers, onChange]);

  // 특정 매칭 제거
  const handleRemoveMatch = useCallback((leftId: string, rightId: string) => {
    if (disabled) return;

    const newAnswers = selectedAnswers.filter(answer => 
      !(answer.leftId === leftId && answer.rightId === rightId)
    );
    onChange(newAnswers);
  }, [disabled, selectedAnswers, onChange]);

  // 모든 매칭 초기화
  const handleClearAll = useCallback(() => {
    if (disabled) return;
    onChange([]);
    setSelectedLeftItem(null);
  }, [disabled, onChange]);

  return (
    <div className="space-y-6">
      {/* 안내 메시지 */}
      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <div className="font-medium mb-1">매칭 방법</div>
          <div>
            1. 좌측 항목을 클릭하여 선택하세요 →  
            2. 연결할 우측 항목을 클릭하세요
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측 항목들 */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-text-primary">좌측 항목</h3>
                {selectedAnswers.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={disabled}
                    className="text-red-600 hover:text-red-700"
                  >
                    모두 지우기
                  </Button>
                )}
              </div>

              {leftItems.map((item, index) => {
                const matchedCount = getMatchedRightItems(item.id).length;
                const isSelected = selectedLeftItem === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : matchedCount > 0
                        ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                        : 'border-border-primary bg-surface-secondary hover:bg-surface-tertiary'
                    }`}
                    onClick={() => handleSelectLeftItem(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-text-secondary min-w-[20px]">
                          {index + 1}.
                        </span>
                        <span className="text-text-primary">{item.text}</span>
                      </div>
                      
                      {matchedCount > 0 && (
                        <Badge variant="success" size="sm">
                          {matchedCount}개 연결됨
                        </Badge>
                      )}
                    </div>

                    {/* 매칭된 항목들 미니 프리뷰 */}
                    {matchedCount > 0 && (
                      <div className="mt-3 pt-3 border-t border-border-secondary">
                        <div className="flex flex-wrap gap-1">
                          {getMatchedRightItems(item.id).map(rightId => {
                            const rightItem = rightItems.find(r => r.id === rightId);
                            const rightIndex = shuffledRightItems.findIndex(r => r.id === rightId);
                            
                            return rightItem ? (
                              <Badge
                                key={rightId}
                                variant="outline"
                                size="sm"
                                className="cursor-pointer hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMatch(item.id, rightId);
                                }}
                              >
                                {String.fromCharCode(65 + rightIndex)}. {rightItem.text.length > 15 
                                  ? rightItem.text.substring(0, 15) + '...' 
                                  : rightItem.text
                                } ✕
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 우측 항목들 */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <h3 className="font-medium text-text-primary mb-4">우측 항목</h3>

              {shuffledRightItems.map((item, index) => {
                const matchedCount = getMatchedLeftItems(item.id).length;
                const canMatch = selectedLeftItem && !isMatched(selectedLeftItem, item.id);
                const isCurrentMatch = selectedLeftItem && isMatched(selectedLeftItem, item.id);

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      isCurrentMatch
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : canMatch
                        ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:border-primary-500'
                        : matchedCount > 0
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                        : selectedLeftItem
                        ? 'border-border-secondary bg-surface-primary hover:bg-surface-secondary'
                        : 'border-border-primary bg-surface-secondary hover:bg-surface-tertiary'
                    }`}
                    onClick={() => handleRightItemClick(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-text-secondary min-w-[20px]">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="text-text-primary">{item.text}</span>
                      </div>
                      
                      {matchedCount > 0 && (
                        <Badge variant="secondary" size="sm">
                          {matchedCount}개 연결됨
                        </Badge>
                      )}
                    </div>

                    {/* 연결 상태 표시 */}
                    {selectedLeftItem && (
                      <div className="mt-2 text-xs">
                        {isCurrentMatch ? (
                          <span className="text-green-600">✓ 연결됨 - 클릭하면 해제</span>
                        ) : (
                          <span className="text-primary-600">클릭하여 연결</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 진행 상황 표시 */}
      <Card className="bg-surface-secondary">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-primary">
              <span className="font-medium">매칭 진행 상황:</span>
              <span className="ml-2">{selectedAnswers.length}개 매칭 완료</span>
            </div>
            
            {selectedLeftItem && (
              <Badge variant="warning" size="sm">
                {leftItems.find(item => item.id === selectedLeftItem)?.text.substring(0, 20)}
                {leftItems.find(item => item.id === selectedLeftItem)?.text.length > 20 ? '...' : ''} 선택됨
              </Badge>
            )}
          </div>
          
          {selectedAnswers.length === 0 && (
            <div className="text-xs text-text-secondary mt-1">
              좌측 항목을 선택한 후 우측 항목을 클릭하여 매칭하세요.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}