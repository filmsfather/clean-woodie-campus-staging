import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Radio,
} from '../../ui';
import { ProblemData } from './ProblemEditor';

interface ProblemPreviewProps {
  data: ProblemData;
}

const DIFFICULTY_LABELS = {
  easy: '쉬움',
  medium: '보통', 
  hard: '어려움',
};

const DIFFICULTY_COLORS = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
} as const;

export function ProblemPreview({ data }: ProblemPreviewProps) {
  const renderProblemContent = () => {
    switch (data.type) {
      case 'multiple_choice':
        return renderMultipleChoice();
      case 'short_answer':
        return renderShortAnswer();
      case 'true_false':
        return renderTrueFalse();
      default:
        return (
          <div className="text-center py-8 text-text-secondary">
            <div className="text-4xl mb-4">🚧</div>
            <p>이 문제 유형의 미리보기는 준비 중입니다.</p>
          </div>
        );
    }
  };

  const renderMultipleChoice = () => {
    const choiceData = data.multipleChoiceData;
    if (!choiceData || choiceData.choices.length === 0) {
      return (
        <div className="text-center py-4 text-text-secondary">
          선택지를 추가해주세요.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-text-secondary mb-4">
          정답을 선택해주세요. (복수 선택 가능)
        </p>
        {choiceData.choices.map((choice, index) => (
          <label
            key={choice.id}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              choice.isCorrect
                ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                : 'border-border-primary hover:bg-surface-secondary'
            }`}
          >
            <Radio
              name="preview-choice"
              value={choice.id}
              disabled
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-start gap-2">
                <span className="font-medium">{index + 1}.</span>
                <span className={choice.text.trim() ? '' : 'text-text-tertiary italic'}>
                  {choice.text.trim() || '선택지를 입력하세요'}
                </span>
                {choice.isCorrect && (
                  <Badge variant="success" size="sm" className="ml-2">
                    정답
                  </Badge>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>
    );
  };

  const renderShortAnswer = () => {
    return (
      <div className="space-y-3">
        <p className="text-sm text-text-secondary mb-4">
          답을 입력해주세요.
        </p>
        <input
          type="text"
          className="w-full p-3 border border-border-primary rounded-lg bg-surface-primary text-text-primary"
          placeholder="여기에 답을 입력하세요..."
          disabled
        />
        {data.shortAnswerData?.correctAnswers && (
          <div className="text-xs text-text-secondary">
            <strong>정답 예시:</strong> {data.shortAnswerData.correctAnswers.join(', ')}
          </div>
        )}
      </div>
    );
  };

  const renderTrueFalse = () => {
    return (
      <div className="space-y-3">
        <p className="text-sm text-text-secondary mb-4">
          맞으면 O, 틀리면 X를 선택해주세요.
        </p>
        <div className="flex gap-4 justify-center">
          <label className={`flex items-center gap-2 p-4 rounded-lg border cursor-pointer ${
            data.trueFalseData?.correctAnswer === true
              ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
              : 'border-border-primary hover:bg-surface-secondary'
          }`}>
            <Radio name="preview-tf" value="true" disabled />
            <span className="text-lg font-medium">O (참)</span>
            {data.trueFalseData?.correctAnswer === true && (
              <Badge variant="success" size="sm">정답</Badge>
            )}
          </label>
          <label className={`flex items-center gap-2 p-4 rounded-lg border cursor-pointer ${
            data.trueFalseData?.correctAnswer === false
              ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
              : 'border-border-primary hover:bg-surface-secondary'
          }`}>
            <Radio name="preview-tf" value="false" disabled />
            <span className="text-lg font-medium">X (거짓)</span>
            {data.trueFalseData?.correctAnswer === false && (
              <Badge variant="success" size="sm">정답</Badge>
            )}
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 미리보기 헤더 */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👁️</span>
            <div>
              <h2 className="font-semibold text-blue-800 dark:text-blue-200">
                학생 화면 미리보기
              </h2>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                학생들이 보게 될 화면을 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 문제 미리보기 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">
                {data.title.trim() || '문제 제목을 입력하세요'}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={DIFFICULTY_COLORS[data.difficulty]}
                  size="sm"
                >
                  {DIFFICULTY_LABELS[data.difficulty]}
                </Badge>
                <Badge variant="outline" size="sm">
                  {data.points}점
                </Badge>
                {data.timeLimit && (
                  <Badge variant="outline" size="sm">
                    ⏱️ {Math.floor(data.timeLimit / 60)}분 {data.timeLimit % 60}초
                  </Badge>
                )}
                {data.tags.map(tag => (
                  <Badge key={tag} variant="secondary" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 문제 내용 */}
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">
              {data.content.trim() || (
                <span className="text-text-tertiary italic">
                  문제 내용을 입력하세요
                </span>
              )}
            </div>
          </div>

          {/* 구분선 */}
          <hr className="border-border-primary" />

          {/* 문제 유형별 내용 */}
          {renderProblemContent()}

          {/* 하단 버튼들 (미리보기용) */}
          <div className="flex justify-between pt-4 border-t border-border-primary">
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border border-border-primary rounded bg-surface-primary text-text-secondary" disabled>
                이전 문제
              </button>
              <button className="px-3 py-1 text-sm border border-border-primary rounded bg-surface-primary text-text-secondary" disabled>
                다음 문제
              </button>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border border-border-primary rounded bg-surface-primary text-text-secondary" disabled>
                북마크
              </button>
              <button className="px-4 py-2 text-sm bg-brand-500 text-white rounded font-medium" disabled>
                답안 제출
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 미리보기 안내 */}
      <Card className="bg-gray-50 dark:bg-gray-900/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <div className="text-sm space-y-1">
              <p className="font-medium text-text-primary">미리보기 안내</p>
              <ul className="text-text-secondary space-y-1">
                <li>• 실제 문제 풀이와 동일한 화면입니다.</li>
                <li>• 정답이 표시되어 있어 확인하기 쉽습니다.</li>
                <li>• 버튼들은 미리보기 모드에서 비활성화됩니다.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}