import React from 'react';
import { Button, Badge } from '../../ui';
import { ProblemAnswer } from './ProblemSolverContainer';
import { ProblemData } from '../editor/ProblemEditor';

interface ProblemNavigationProps {
  currentIndex: number;
  totalCount: number;
  answers: Map<string, ProblemAnswer>;
  problems: ProblemData[];
  onNavigate?: (index: number) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export function ProblemNavigation({
  currentIndex,
  totalCount,
  answers,
  problems,
  onNavigate,
  onSubmit,
  disabled = false,
}: ProblemNavigationProps) {
  const answeredCount = answers.size;
  const unansweredCount = totalCount - answeredCount;
  const bookmarkedCount = Array.from(answers.values())
    .filter(answer => answer.isBookmarked).length;

  const isPreviousAvailable = currentIndex > 0;
  const isNextAvailable = currentIndex < totalCount - 1;

  const handlePrevious = () => {
    if (isPreviousAvailable) {
      onNavigate?.(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (isNextAvailable) {
      onNavigate?.(currentIndex + 1);
    }
  };

  const getQuestionStatus = (index: number) => {
    const problem = problems[index];
    const answer = answers.get(problem?.id || '');
    
    if (answer?.isBookmarked) return 'bookmarked';
    if (answer) return 'answered';
    return 'unanswered';
  };

  const getStatusColor = (status: string, isCurrent: boolean) => {
    if (isCurrent) return 'bg-brand-500 text-white';
    
    switch (status) {
      case 'answered': return 'bg-green-100 text-green-800 border-green-300';
      case 'bookmarked': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'answered': return '✓';
      case 'bookmarked': return '📌';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* 기본 네비게이션 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={!isPreviousAvailable || disabled}
            className="flex items-center gap-2"
          >
            ← 이전 문제
          </Button>
          
          <div className="text-sm text-text-secondary">
            {currentIndex + 1} / {totalCount}
          </div>
          
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={!isNextAvailable || disabled}
            className="flex items-center gap-2"
          >
            다음 문제 →
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="success" size="sm">
              완료 {answeredCount}
            </Badge>
            {unansweredCount > 0 && (
              <Badge variant="outline" size="sm">
                미완료 {unansweredCount}
              </Badge>
            )}
            {bookmarkedCount > 0 && (
              <Badge variant="secondary" size="sm">
                📌 {bookmarkedCount}
              </Badge>
            )}
          </div>
          
          <Button
            variant="default"
            onClick={onSubmit}
            disabled={disabled}
            className="font-medium"
          >
            답안 제출
          </Button>
        </div>
      </div>

      {/* 문제 번호 그리드 네비게이션 */}
      <div className="bg-surface-secondary rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-text-primary">문제 바로가기</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span>완료</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>북마크</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
              <span>미완료</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-10 gap-2">
          {Array.from({ length: totalCount }, (_, index) => {
            const status = getQuestionStatus(index);
            const isCurrent = index === currentIndex;
            const statusIcon = getStatusIcon(status);
            
            return (
              <button
                key={index}
                onClick={() => onNavigate?.(index)}
                disabled={disabled}
                className={`
                  relative w-10 h-10 rounded border-2 text-sm font-medium
                  transition-all duration-200 hover:scale-105
                  ${getStatusColor(status, isCurrent)}
                  ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
                title={`문제 ${index + 1} ${
                  status === 'answered' ? '(완료됨)' : 
                  status === 'bookmarked' ? '(북마크됨)' : 
                  '(미완료)'
                }`}
              >
                <span className="absolute inset-0 flex items-center justify-center">
                  {index + 1}
                </span>
                {statusIcon && (
                  <span className="absolute -top-1 -right-1 text-xs">
                    {statusIcon}
                  </span>
                )}
                {isCurrent && (
                  <div className="absolute -top-2 -left-2 -right-2 -bottom-2 border-2 border-brand-300 rounded-lg animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <button
          onClick={() => {
            // 첫 번째 미완료 문제로 이동
            const firstUnanswered = problems.findIndex((problem, index) => 
              !answers.has(problem.id || '') && index !== currentIndex
            );
            if (firstUnanswered !== -1) {
              onNavigate?.(firstUnanswered);
            }
          }}
          disabled={unansweredCount === 0 || disabled}
          className="text-text-secondary hover:text-text-primary disabled:opacity-50"
        >
          📝 첫 번째 미완료 문제로
        </button>
        
        <span className="text-text-tertiary">|</span>
        
        <button
          onClick={() => {
            // 북마크된 문제들로 이동
            const bookmarkedIndex = problems.findIndex((problem, index) => 
              answers.get(problem.id || '')?.isBookmarked && index !== currentIndex
            );
            if (bookmarkedIndex !== -1) {
              onNavigate?.(bookmarkedIndex);
            }
          }}
          disabled={bookmarkedCount === 0 || disabled}
          className="text-text-secondary hover:text-text-primary disabled:opacity-50"
        >
          📌 북마크된 문제로
        </button>

        <span className="text-text-tertiary">|</span>
        
        <button
          onClick={() => onNavigate?.(totalCount - 1)}
          disabled={currentIndex === totalCount - 1 || disabled}
          className="text-text-secondary hover:text-text-primary disabled:opacity-50"
        >
          🏁 마지막 문제로
        </button>
      </div>

      {/* 키보드 단축키 안내 */}
      <div className="text-center">
        <details className="text-xs text-text-tertiary">
          <summary className="cursor-pointer hover:text-text-secondary">
            키보드 단축키 보기
          </summary>
          <div className="mt-2 space-y-1">
            <div>← / → : 이전/다음 문제</div>
            <div>Space : 북마크 토글</div>
            <div>Enter : 답안 제출</div>
            <div>1-9 : 해당 번호 문제로 바로가기</div>
          </div>
        </details>
      </div>
    </div>
  );
}