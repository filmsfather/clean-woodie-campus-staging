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

// 도메인의 OrderingContent와 일치하는 타입
export interface OrderingData {
  correctOrder: string[];
  allowsPartialCredit?: boolean;
  items?: {
    id: string;
    text: string;
  }[];
}

interface OrderingEditorProps {
  data?: OrderingData;
  onChange: (data: OrderingData) => void;
  disabled?: boolean;
}

export function OrderingEditor({
  data = { correctOrder: [] },
  onChange,
  disabled = false,
}: OrderingEditorProps) {
  const [newItem, setNewItem] = useState('');

  const items = data.items || [];
  const correctOrder = data.correctOrder || [];

  // 고유 ID 생성
  const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 항목 추가
  const handleAddItem = useCallback(() => {
    if (!newItem.trim()) return;

    const newItemData = {
      id: generateId(),
      text: newItem.trim(),
    };

    onChange({
      ...data,
      items: [...items, newItemData],
      correctOrder: [...correctOrder, newItemData.id], // 새 항목을 순서의 마지막에 추가
    });
    
    setNewItem('');
  }, [data, items, correctOrder, newItem, onChange]);

  // 항목 삭제
  const handleRemoveItem = useCallback((idToRemove: string) => {
    onChange({
      ...data,
      items: items.filter(item => item.id !== idToRemove),
      correctOrder: correctOrder.filter(id => id !== idToRemove),
    });
  }, [data, items, correctOrder, onChange]);

  // 항목 텍스트 수정
  const handleUpdateItem = useCallback((id: string, text: string) => {
    onChange({
      ...data,
      items: items.map(item => 
        item.id === id ? { ...item, text } : item
      ),
    });
  }, [data, items, onChange]);

  // 순서 변경 (위로)
  const handleMoveUp = useCallback((itemId: string) => {
    const currentIndex = correctOrder.indexOf(itemId);
    if (currentIndex <= 0) return;

    const newOrder = [...correctOrder];
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = 
      [newOrder[currentIndex], newOrder[currentIndex - 1]];

    onChange({
      ...data,
      correctOrder: newOrder,
    });
  }, [data, correctOrder, onChange]);

  // 순서 변경 (아래로)
  const handleMoveDown = useCallback((itemId: string) => {
    const currentIndex = correctOrder.indexOf(itemId);
    if (currentIndex >= correctOrder.length - 1) return;

    const newOrder = [...correctOrder];
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = 
      [newOrder[currentIndex + 1], newOrder[currentIndex]];

    onChange({
      ...data,
      correctOrder: newOrder,
    });
  }, [data, correctOrder, onChange]);

  // 특정 위치로 이동
  const handleMoveToPosition = useCallback((itemId: string, newPosition: number) => {
    const currentIndex = correctOrder.indexOf(itemId);
    if (currentIndex === -1 || newPosition < 0 || newPosition >= correctOrder.length) return;

    const newOrder = [...correctOrder];
    const [movedItem] = newOrder.splice(currentIndex, 1);
    newOrder.splice(newPosition, 0, movedItem);

    onChange({
      ...data,
      correctOrder: newOrder,
    });
  }, [data, correctOrder, onChange]);

  // 순서 랜덤 섞기
  const handleShuffle = useCallback(() => {
    const shuffled = [...correctOrder];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    onChange({
      ...data,
      correctOrder: shuffled,
    });
  }, [data, correctOrder, onChange]);

  // 부분 점수 허용 설정
  const handleTogglePartialCredit = useCallback((allowed: boolean) => {
    onChange({
      ...data,
      allowsPartialCredit: allowed,
    });
  }, [data, onChange]);

  // 항목 찾기
  const findItemById = useCallback((id: string) => {
    return items.find(item => item.id === id);
  }, [items]);

  return (
    <div className="space-y-6">
      {/* 기본 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>순서 배열 문제 설정</CardTitle>
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
              (일부 순서만 맞춰도 점수 부여)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 항목 관리 */}
      <Card>
        <CardHeader>
          <CardTitle>항목 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 새 항목 추가 */}
          <div className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="새 항목 입력"
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem();
                }
              }}
            />
            <Button size="sm" onClick={handleAddItem} disabled={disabled}>
              추가
            </Button>
          </div>

          {/* 기존 항목 목록 */}
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2 p-3 border border-border-primary rounded-lg">
                <span className="text-sm font-medium text-text-secondary w-8">
                  {index + 1}.
                </span>
                <Input
                  value={item.text}
                  onChange={(e) => handleUpdateItem(item.id, e.target.value)}
                  placeholder="항목 텍스트"
                  disabled={disabled}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  삭제
                </Button>
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="text-center py-8 text-text-secondary">
                순서를 배열할 항목들을 추가해주세요.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 정답 순서 설정 */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>정답 순서</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShuffle}
                  disabled={disabled || correctOrder.length < 2}
                >
                  순서 섞기
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {correctOrder.map((itemId, index) => {
                const item = findItemById(itemId);
                if (!item) return null;

                return (
                  <div key={itemId} className="flex items-center gap-3 p-4 bg-surface-secondary rounded-lg">
                    {/* 순서 번호 */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg font-bold text-primary-600 min-w-[24px] text-center">
                        {index + 1}
                      </span>
                      <div className="text-xs text-text-secondary">번째</div>
                    </div>

                    {/* 항목 내용 */}
                    <div className="flex-1 py-2">
                      <span className="text-text-primary font-medium">
                        {item.text}
                      </span>
                    </div>

                    {/* 순서 조정 버튼들 */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveUp(itemId)}
                        disabled={disabled || index === 0}
                        className="px-2 py-1 h-8"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveDown(itemId)}
                        disabled={disabled || index === correctOrder.length - 1}
                        className="px-2 py-1 h-8"
                      >
                        ↓
                      </Button>
                    </div>

                    {/* 위치 선택 드롭다운 */}
                    <div className="flex items-center gap-2">
                      <select
                        value={index}
                        onChange={(e) => handleMoveToPosition(itemId, parseInt(e.target.value))}
                        disabled={disabled}
                        className="px-2 py-1 text-sm border border-border-primary rounded bg-surface-primary"
                      >
                        {correctOrder.map((_, i) => (
                          <option key={i} value={i}>
                            {i + 1}번째
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 순서 요약 */}
            <div className="mt-6 p-4 bg-surface-tertiary rounded-lg">
              <h4 className="font-medium text-text-primary mb-2">정답 순서 요약</h4>
              <div className="text-sm text-text-secondary">
                {correctOrder.map((itemId, index) => {
                  const item = findItemById(itemId);
                  return item ? (
                    <span key={itemId} className="inline-block mr-2 mb-1">
                      {index + 1}. {item.text}
                      {index < correctOrder.length - 1 && ' → '}
                    </span>
                  ) : null;
                })}
              </div>
              <div className="text-xs text-text-tertiary mt-2">
                • 총 {correctOrder.length}개 항목
                • 부분 점수: {data.allowsPartialCredit ? '허용' : '비허용'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 도움말 */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <div className="font-medium mb-2">💡 순서 배열 문제 작성 팁:</div>
            <ul className="space-y-1 text-xs">
              <li>• 최소 2개 이상의 항목을 추가하세요</li>
              <li>• 위/아래 화살표나 드롭다운으로 정답 순서를 조정하세요</li>
              <li>• "순서 섞기" 버튼으로 다양한 순서를 테스트해보세요</li>
              <li>• 부분 점수를 허용하면 일부 순서만 맞춰도 점수를 받습니다</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}