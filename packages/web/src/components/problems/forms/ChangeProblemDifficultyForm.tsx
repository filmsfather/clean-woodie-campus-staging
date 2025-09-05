// ChangeProblemDifficultyUseCase에 대응하는 난이도 변경 폼 컴포넌트
import React, { useState, useEffect } from 'react';
import { ChangeProblemDifficultyInput, ProblemFormState, ProblemDetailDto } from '../../../types/problems';

interface ChangeProblemDifficultyFormProps {
  state: ProblemFormState;
  problem: ProblemDetailDto;
  onSubmit: (input: ChangeProblemDifficultyInput) => void;
  onCancel: () => void;
}

export const ChangeProblemDifficultyForm: React.FC<ChangeProblemDifficultyFormProps> = ({
  state,
  problem,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<ChangeProblemDifficultyInput>({
    problemId: problem.id,
    teacherId: problem.teacherId,
    newDifficultyLevel: problem.difficulty
  });

  useEffect(() => {
    setFormData({
      problemId: problem.id,
      teacherId: problem.teacherId,
      newDifficultyLevel: problem.difficulty
    });
  }, [problem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.isSubmitting || formData.newDifficultyLevel === problem.difficulty) return;

    onSubmit(formData);
  };

  const hasChanges = () => {
    return formData.newDifficultyLevel !== problem.difficulty;
  };

  const getDifficultyLabel = (level: number): string => {
    if (level <= 2) return '매우 쉬움';
    if (level <= 4) return '쉬움';
    if (level <= 6) return '보통';
    if (level <= 8) return '어려움';
    return '매우 어려움';
  };

  const getDifficultyColor = (level: number): string => {
    if (level <= 2) return 'green';
    if (level <= 4) return 'lightgreen';
    if (level <= 6) return 'orange';
    if (level <= 8) return 'red';
    return 'darkred';
  };

  return (
    <div className="change-problem-difficulty-form">
      <div className="form-header">
        <h2>문제 난이도 변경</h2>
        <button onClick={onCancel} className="btn-close">×</button>
      </div>

      <div className="current-problem-info">
        <h3>현재 문제 정보</h3>
        <div className="problem-summary">
          <p><strong>제목:</strong> {problem.title}</p>
          <p><strong>유형:</strong> {problem.type}</p>
          <div className="current-difficulty">
            <strong>현재 난이도:</strong> 
            <span 
              className={`difficulty-badge ${getDifficultyColor(problem.difficulty)}`}
              style={{ color: getDifficultyColor(problem.difficulty) }}
            >
              {problem.difficulty} / 10 ({getDifficultyLabel(problem.difficulty)})
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="difficulty-form">
        <div className="form-group">
          <label htmlFor="difficulty">새로운 난이도 *</label>
          <div className="difficulty-selector">
            <input
              id="difficulty"
              type="range"
              min="1"
              max="10"
              value={formData.newDifficultyLevel}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                newDifficultyLevel: parseInt(e.target.value) 
              }))}
              disabled={state.isSubmitting}
            />
            <div className="difficulty-display">
              <span 
                className={`difficulty-value ${getDifficultyColor(formData.newDifficultyLevel)}`}
                style={{ color: getDifficultyColor(formData.newDifficultyLevel) }}
              >
                {formData.newDifficultyLevel} / 10
              </span>
              <span 
                className={`difficulty-label ${getDifficultyColor(formData.newDifficultyLevel)}`}
                style={{ color: getDifficultyColor(formData.newDifficultyLevel) }}
              >
                ({getDifficultyLabel(formData.newDifficultyLevel)})
              </span>
            </div>
          </div>
          
          <div className="difficulty-scale">
            <div className="scale-labels">
              <span>1 (매우 쉬움)</span>
              <span>3 (쉬움)</span>
              <span>5 (보통)</span>
              <span>7 (어려움)</span>
              <span>10 (매우 어려움)</span>
            </div>
          </div>
        </div>

        {hasChanges() && (
          <div className="change-preview">
            <h4>변경 사항 미리보기</h4>
            <div className="change-comparison">
              <div className="before">
                <span className="label">변경 전:</span>
                <span 
                  className={`value ${getDifficultyColor(problem.difficulty)}`}
                  style={{ color: getDifficultyColor(problem.difficulty) }}
                >
                  {problem.difficulty} ({getDifficultyLabel(problem.difficulty)})
                </span>
              </div>
              <div className="after">
                <span className="label">변경 후:</span>
                <span 
                  className={`value ${getDifficultyColor(formData.newDifficultyLevel)}`}
                  style={{ color: getDifficultyColor(formData.newDifficultyLevel) }}
                >
                  {formData.newDifficultyLevel} ({getDifficultyLabel(formData.newDifficultyLevel)})
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="difficulty-guide">
          <h4>난이도 설정 가이드</h4>
          <div className="guide-content">
            <div className="guide-item">
              <span className="level" style={{ color: 'green' }}>1-2 (매우 쉬움):</span>
              기초 개념, 단순 암기 문제
            </div>
            <div className="guide-item">
              <span className="level" style={{ color: 'lightgreen' }}>3-4 (쉬움):</span>
              기본 응용, 단순 계산 문제
            </div>
            <div className="guide-item">
              <span className="level" style={{ color: 'orange' }}>5-6 (보통):</span>
              중간 수준 응용, 복합 개념 문제
            </div>
            <div className="guide-item">
              <span className="level" style={{ color: 'red' }}>7-8 (어려움):</span>
              고난도 응용, 창의적 사고 문제
            </div>
            <div className="guide-item">
              <span className="level" style={{ color: 'darkred' }}>9-10 (매우 어려움):</span>
              최고 수준, 연구 수준의 문제
            </div>
          </div>
        </div>

        {state.error && (
          <div className="form-error">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="form-success">
            문제 난이도가 성공적으로 변경되었습니다!
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={state.isSubmitting}
            className="btn-secondary"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={state.isSubmitting || !hasChanges()}
            className="btn-primary"
          >
            {state.isSubmitting ? '변경 중...' : '난이도 변경'}
          </button>
        </div>

        {!hasChanges() && (
          <p className="no-changes-hint">
            난이도를 조정하여 변경사항을 만드세요.
          </p>
        )}
      </form>
    </div>
  );
};