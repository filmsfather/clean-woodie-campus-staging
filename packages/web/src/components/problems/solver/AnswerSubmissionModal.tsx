import React from 'react';
import { Modal, Button, Badge, Progress } from '../../ui';
import { ProblemSetSession, ProblemAnswer } from './ProblemSolverContainer';

interface AnswerSubmissionModalProps {
  session: ProblemSetSession;
  onConfirm?: () => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function AnswerSubmissionModal({
  session,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: AnswerSubmissionModalProps) {
  const answeredCount = session.answers.size;
  const totalCount = session.problems.length;
  const unansweredCount = totalCount - answeredCount;
  const completionRate = (answeredCount / totalCount) * 100;

  const bookmarkedProblems = Array.from(session.answers.entries())
    .filter(([_, answer]) => answer.isBookmarked)
    .map(([problemId, _]) => {
      const problemIndex = session.problems.findIndex(p => p.id === problemId);
      return problemIndex + 1;
    })
    .sort((a, b) => a - b);

  const unansweredProblems = session.problems
    .map((problem, index) => ({ problem, index }))
    .filter(({ problem }) => !session.answers.has(problem.id || ''))
    .map(({ index }) => index + 1);

  const totalTimeSpent = Array.from(session.answers.values())
    .reduce((total, answer) => total + answer.timeSpent, 0);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds}초`;
  };

  const canSubmit = answeredCount > 0; // 최소 1문제는 답해야 제출 가능

  return (
    <Modal
      isOpen={true}
      onClose={!isSubmitting ? onCancel : undefined}
      title="답안 제출 확인"
      size="lg"
    >
      <div className="space-y-6">
        {/* 제출 경고 메시지 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                답안 제출 전 확인사항
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                답안을 제출하면 더 이상 수정할 수 없습니다. 
                모든 답안을 다시 한 번 확인해주세요.
              </p>
            </div>
          </div>
        </div>

        {/* 답안 현황 요약 */}
        <div className="bg-surface-secondary rounded-lg p-4">
          <h3 className="font-semibold text-text-primary mb-4">답안 현황</h3>
          
          <div className="space-y-4">
            {/* 전체 진행률 */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">전체 진행률</span>
                <span className="font-medium">
                  {answeredCount}/{totalCount} ({completionRate.toFixed(0)}%)
                </span>
              </div>
              <Progress
                value={completionRate}
                variant={completionRate === 100 ? 'success' : completionRate >= 80 ? 'warning' : 'default'}
              />
            </div>

            {/* 상세 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-surface-primary rounded">
                <div className="text-lg font-bold text-green-600">
                  {answeredCount}
                </div>
                <div className="text-xs text-text-secondary">완료</div>
              </div>
              <div className="text-center p-3 bg-surface-primary rounded">
                <div className="text-lg font-bold text-red-600">
                  {unansweredCount}
                </div>
                <div className="text-xs text-text-secondary">미완료</div>
              </div>
              <div className="text-center p-3 bg-surface-primary rounded">
                <div className="text-lg font-bold text-yellow-600">
                  {bookmarkedProblems.length}
                </div>
                <div className="text-xs text-text-secondary">북마크</div>
              </div>
              <div className="text-center p-3 bg-surface-primary rounded">
                <div className="text-lg font-bold text-blue-600">
                  {formatTime(totalTimeSpent)}
                </div>
                <div className="text-xs text-text-secondary">소요시간</div>
              </div>
            </div>
          </div>
        </div>

        {/* 미완료 문제 안내 */}
        {unansweredCount > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
              ❌ 미완료 문제 ({unansweredCount}개)
            </h4>
            <div className="flex flex-wrap gap-2">
              {unansweredProblems.map((problemNumber) => (
                <Badge key={problemNumber} variant="outline" size="sm">
                  {problemNumber}번
                </Badge>
              ))}
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mt-2">
              미완료 문제들은 0점 처리됩니다.
            </p>
          </div>
        )}

        {/* 북마크된 문제 안내 */}
        {bookmarkedProblems.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              📌 북마크된 문제 ({bookmarkedProblems.length}개)
            </h4>
            <div className="flex flex-wrap gap-2">
              {bookmarkedProblems.map((problemNumber) => (
                <Badge key={problemNumber} variant="secondary" size="sm">
                  {problemNumber}번
                </Badge>
              ))}
            </div>
            <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-2">
              북마크된 문제들을 다시 한 번 확인해보세요.
            </p>
          </div>
        )}

        {/* 제출 불가 안내 */}
        {!canSubmit && (
          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
              제출할 수 없습니다
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              최소 1문제 이상 답안을 작성해야 제출할 수 있습니다.
            </p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between pt-4 border-t border-border-primary">
          <div className="text-sm text-text-secondary">
            {completionRate === 100 ? (
              <span className="text-green-600 font-medium">
                ✅ 모든 문제를 완료했습니다!
              </span>
            ) : (
              <span>
                {unansweredCount}개 문제가 미완료 상태입니다
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              계속 작성하기
            </Button>
            <Button
              variant={completionRate === 100 ? 'default' : 'destructive'}
              onClick={onConfirm}
              disabled={!canSubmit || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  제출 중...
                </>
              ) : (
                <>
                  📝 최종 제출
                  {completionRate < 100 && ` (${answeredCount}/${totalCount})`}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 추가 안내사항 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            💡 <strong>안내:</strong> 답안 제출 후에는 결과를 즉시 확인할 수 있습니다. 
            채점은 자동으로 이루어지며, 상세한 해설도 제공됩니다.
          </p>
        </div>
      </div>
    </Modal>
  );
}