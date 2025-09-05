import React from 'react';
import type { CreateProblemSetRequest, Problem } from '../../services/api';

export interface ProblemSetFormProps {
  mode: 'create' | 'edit';
  formData: CreateProblemSetRequest;
  validationErrors: Record<string, string>;
  loading: boolean;
  onFieldChange: (field: keyof CreateProblemSetRequest, value: any) => void;
  onAddProblem: () => void;
  onRemoveProblem: (problemId: string) => void;
  onReorderProblems: (orderedProblemIds: string[]) => void;
}

export const ProblemSetForm: React.FC<ProblemSetFormProps> = ({
  mode,
  formData,
  validationErrors,
  loading,
  onFieldChange,
  onAddProblem,
  onRemoveProblem,
  onReorderProblems
}) => {
  return (
    <div className="problem-set-form">
      <div className="form-group">
        <label htmlFor="title">제목 *</label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
          className={validationErrors.title ? 'error' : ''}
          disabled={loading}
        />
        {validationErrors.title && (
          <span className="error-message">{validationErrors.title}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="description">설명</label>
        <textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => onFieldChange('description', e.target.value)}
          rows={4}
          className={validationErrors.description ? 'error' : ''}
          disabled={loading}
        />
        {validationErrors.description && (
          <span className="error-message">{validationErrors.description}</span>
        )}
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.isPublic}
            onChange={(e) => onFieldChange('isPublic', e.target.checked)}
            disabled={loading}
          />
          공개 문제집
        </label>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.isShared}
            onChange={(e) => onFieldChange('isShared', e.target.checked)}
            disabled={loading}
          />
          다른 교사와 공유
        </label>
      </div>

      {mode === 'create' && (
        <div className="form-group">
          <label>초기 문제들</label>
          <div className="initial-problems">
            {formData.initialProblems?.map((problem, index) => (
              <div key={problem.problemId} className="problem-item">
                <span>{index + 1}. {problem.problemId}</span>
                <span>점수: {problem.points}</span>
                <button
                  type="button"
                  onClick={() => onRemoveProblem(problem.problemId)}
                  disabled={loading}
                >
                  제거
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={onAddProblem}
              disabled={loading}
            >
              문제 추가
            </button>
          </div>
          {validationErrors.initialProblems && (
            <span className="error-message">{validationErrors.initialProblems}</span>
          )}
        </div>
      )}
    </div>
  );
};