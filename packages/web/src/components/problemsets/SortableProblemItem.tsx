import React from 'react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProblemItem } from './ProblemSetEditor';

interface SortableProblemItemProps {
  problem: ProblemItem;
  index: number;
  onRemove: () => void;
  isLoading?: boolean;
}

export const SortableProblemItem: React.FC<SortableProblemItemProps> = ({
  problem,
  index,
  onRemove,
  isLoading = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: problem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
      case '쉬움':
        return 'bg-green-100 text-green-800';
      case 'medium':
      case '보통':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
      case '어려움':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '쉬움';
      case 'medium':
        return '보통';
      case 'hard':
        return '어려움';
      default:
        return difficulty;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${isDragging ? 'z-50' : 'z-10'}
      `}
    >
      <div className="flex items-center gap-4">
        {/* 드래그 핸들 */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
          title="드래그하여 순서 변경"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>

        {/* 문제 번호 */}
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
          {index + 1}
        </div>

        {/* 문제 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {problem.title}
            </h3>
            <span className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${getDifficultyColor(problem.difficulty)}
            `}>
              {getDifficultyText(problem.difficulty)}
            </span>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2">
            {problem.content}
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-2">
          <button
            className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50"
            title="문제 편집"
            disabled={isLoading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50"
            title="문제 제거"
            disabled={isLoading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};