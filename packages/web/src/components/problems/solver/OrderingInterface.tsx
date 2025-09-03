import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  Button,
  Badge,
} from '../../ui';

interface OrderingItem {
  id: string;
  text: string;
}

interface OrderingInterfaceProps {
  items: OrderingItem[];
  selectedOrder: string[]; // 사용자가 배열한 순서 (item ID 배열)
  onChange: (order: string[]) => void;
  disabled?: boolean;
}

export function OrderingInterface({
  items,
  selectedOrder = [],
  onChange,
  disabled = false,
}: OrderingInterfaceProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 항목들을 랜덤하게 섞어서 초기 표시 (한 번만)
  const shuffledItems = useMemo(() => {
    if (selectedOrder.length > 0) {
      // 이미 사용자가 순서를 정한 경우 그 순서를 유지
      const orderedItems = selectedOrder.map(id => items.find(item => item.id === id)).filter(Boolean);
      const unorderedItems = items.filter(item => !selectedOrder.includes(item.id));
      return [...orderedItems, ...unorderedItems] as OrderingItem[];
    } else {
      // 초기에는 랜덤하게 섞음
      const shuffled = [...items];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
  }, [items, selectedOrder]);

  // 현재 표시할 순서 (사용자가 배열한 순서 또는 초기 순서)
  const currentOrder = useMemo(() => {
    if (selectedOrder.length === items.length) {
      return selectedOrder.map(id => items.find(item => item.id === id)).filter(Boolean) as OrderingItem[];
    } else {
      return shuffledItems;
    }
  }, [selectedOrder, items, shuffledItems]);

  // 드래그 시작
  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    if (disabled) return;
    
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', itemId);
  }, [disabled]);

  // 드래그 오버
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (disabled) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, [disabled]);

  // 드롭
  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    if (disabled || !draggedItem) return;
    
    e.preventDefault();
    
    const dragIndex = currentOrder.findIndex(item => item.id === draggedItem);
    if (dragIndex === dropIndex) return;

    const newOrder = [...currentOrder];
    const [draggedItemData] = newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItemData);

    onChange(newOrder.map(item => item.id));
    setDraggedItem(null);
    setDragOverIndex(null);
  }, [disabled, draggedItem, currentOrder, onChange]);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  // 위로 이동
  const handleMoveUp = useCallback((itemId: string) => {
    if (disabled) return;
    
    const currentIndex = currentOrder.findIndex(item => item.id === itemId);
    if (currentIndex <= 0) return;

    const newOrder = [...currentOrder];
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = 
      [newOrder[currentIndex], newOrder[currentIndex - 1]];

    onChange(newOrder.map(item => item.id));
  }, [disabled, currentOrder, onChange]);

  // 아래로 이동
  const handleMoveDown = useCallback((itemId: string) => {
    if (disabled) return;
    
    const currentIndex = currentOrder.findIndex(item => item.id === itemId);
    if (currentIndex >= currentOrder.length - 1) return;

    const newOrder = [...currentOrder];
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = 
      [newOrder[currentIndex + 1], newOrder[currentIndex]];

    onChange(newOrder.map(item => item.id));
  }, [disabled, currentOrder, onChange]);

  // 순서 초기화
  const handleReset = useCallback(() => {
    if (disabled) return;
    onChange([]);
  }, [disabled, onChange]);

  // 순서 섞기
  const handleShuffle = useCallback(() => {
    if (disabled) return;
    
    const shuffled = [...currentOrder];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    onChange(shuffled.map(item => item.id));
  }, [disabled, currentOrder, onChange]);

  const isComplete = selectedOrder.length === items.length;

  return (
    <div className="space-y-4">
      {/* 안내 메시지 */}
      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <div className="font-medium mb-1">순서 배열 방법</div>
          <div>
            항목을 드래그해서 올바른 순서로 배열하거나, 화살표 버튼을 사용하세요
          </div>
        </div>
      </div>

      {/* 제어 버튼들 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShuffle}
            disabled={disabled || currentOrder.length < 2}
          >
            순서 섞기
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={disabled || selectedOrder.length === 0}
          >
            초기화
          </Button>
        </div>
        
        <Badge variant={isComplete ? 'success' : 'default'}>
          {isComplete ? '배열 완료' : `${selectedOrder.length}/${items.length} 배열됨`}
        </Badge>
      </div>

      {/* 순서 배열 영역 */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {currentOrder.map((item, index) => (
              <div
                key={item.id}
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-move ${
                  draggedItem === item.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 opacity-50'
                    : dragOverIndex === index
                    ? 'border-primary-300 bg-primary-25 dark:bg-primary-900/10'
                    : 'border-border-primary bg-surface-secondary hover:bg-surface-tertiary'
                } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {/* 순서 번호 */}
                <div className="flex flex-col items-center min-w-[40px]">
                  <div className="text-xl font-bold text-primary-600">
                    {index + 1}
                  </div>
                  <div className="text-xs text-text-secondary">
                    번째
                  </div>
                </div>

                {/* 드래그 핸들 */}
                <div className="text-text-tertiary cursor-move">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="3" cy="3" r="1"/>
                    <circle cx="3" cy="8" r="1"/>
                    <circle cx="3" cy="13" r="1"/>
                    <circle cx="8" cy="3" r="1"/>
                    <circle cx="8" cy="8" r="1"/>
                    <circle cx="8" cy="13" r="1"/>
                    <circle cx="13" cy="3" r="1"/>
                    <circle cx="13" cy="8" r="1"/>
                    <circle cx="13" cy="13" r="1"/>
                  </svg>
                </div>

                {/* 항목 내용 */}
                <div className="flex-1 py-2">
                  <span className="text-text-primary font-medium">
                    {item.text}
                  </span>
                </div>

                {/* 이동 버튼들 */}
                <div className="flex flex-col gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveUp(item.id)}
                    disabled={disabled || index === 0}
                    className="px-2 py-1 h-7 text-xs"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveDown(item.id)}
                    disabled={disabled || index === currentOrder.length - 1}
                    className="px-2 py-1 h-7 text-xs"
                  >
                    ↓
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 진행 상태 */}
      <Card className="bg-surface-secondary">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-primary">
              <span className="font-medium">배열 상태:</span>
              <span className="ml-2">
                {isComplete ? '모든 항목이 배열되었습니다' : '항목을 올바른 순서로 배열하세요'}
              </span>
            </div>
            
            {!isComplete && (
              <span className="text-xs text-text-secondary">
                {items.length - selectedOrder.length}개 항목이 더 필요합니다
              </span>
            )}
          </div>

          {/* 미니 진행률 표시 */}
          <div className="flex items-center gap-1 mt-2">
            {items.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index < selectedOrder.length
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
                title={`${index + 1}번째 위치`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 도움말 */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-3">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <div className="font-medium mb-1">💡 사용 방법</div>
            <ul className="text-xs space-y-1">
              <li>• 항목을 드래그하여 원하는 위치로 이동하세요</li>
              <li>• 화살표 버튼으로 한 칸씩 위아래로 이동할 수 있습니다</li>
              <li>• "순서 섞기"로 다시 섞거나 "초기화"로 처음부터 시작하세요</li>
              <li>• 모든 항목을 올바른 순서로 배열해야 합니다</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}