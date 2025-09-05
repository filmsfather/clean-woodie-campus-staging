// CreateProblemUseCase에 대응하는 생성 폼 컴포넌트
import React, { useState } from 'react';
import { CreateProblemInput, ProblemFormState } from '../../../types/problems';

interface CreateProblemFormProps {
  state: ProblemFormState;
  onSubmit: (input: CreateProblemInput) => void;
  onCancel: () => void;
  initialData?: Partial<CreateProblemInput>;
}

export const CreateProblemForm: React.FC<CreateProblemFormProps> = ({
  state,
  onSubmit,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState<CreateProblemInput>({
    teacherId: initialData?.teacherId || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'short_answer',
    correctAnswerValue: initialData?.correctAnswerValue || '',
    difficultyLevel: initialData?.difficultyLevel || 1,
    tags: initialData?.tags || []
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.isSubmitting) return;

    onSubmit(formData);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="create-problem-form">
      <div className="form-header">
        <h2>새 문제 만들기</h2>
        <button onClick={onCancel} className="btn-close">×</button>
      </div>

      <form onSubmit={handleSubmit} className="problem-form">
        <div className="form-group">
          <label htmlFor="title">제목 *</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
            disabled={state.isSubmitting}
            placeholder="문제 제목을 입력하세요"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">설명</label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            disabled={state.isSubmitting}
            placeholder="문제에 대한 설명을 입력하세요 (선택사항)"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">문제 유형 *</label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            required
            disabled={state.isSubmitting}
          >
            <option value="short_answer">단답형</option>
            <option value="multiple_choice">객관식</option>
            <option value="essay">서술형</option>
            <option value="true_false">참/거짓</option>
            <option value="fill_blank">빈칸 채우기</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="correctAnswer">정답 *</label>
          <input
            id="correctAnswer"
            type="text"
            value={formData.correctAnswerValue}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              correctAnswerValue: e.target.value 
            }))}
            required
            disabled={state.isSubmitting}
            placeholder="정답을 입력하세요"
          />
          <small className="form-hint">
            객관식의 경우 정답 번호(1, 2, 3, ...)를, 단답형의 경우 정확한 답을 입력하세요.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="difficulty">난이도 *</label>
          <div className="difficulty-selector">
            <input
              id="difficulty"
              type="range"
              min="1"
              max="10"
              value={formData.difficultyLevel}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                difficultyLevel: parseInt(e.target.value) 
              }))}
              disabled={state.isSubmitting}
            />
            <span className="difficulty-value">
              {formData.difficultyLevel} / 10
            </span>
          </div>
          <div className="difficulty-labels">
            <span>쉬움</span>
            <span>어려움</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="tags">태그</label>
          <div className="tag-input">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="태그를 입력하고 Enter 키를 누르세요"
              disabled={state.isSubmitting}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || state.isSubmitting}
              className="btn-sm"
            >
              추가
            </button>
          </div>
          
          {formData.tags && formData.tags.length > 0 && (
            <div className="tag-list">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={state.isSubmitting}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {state.error && (
          <div className="form-error">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="form-success">
            문제가 성공적으로 생성되었습니다!
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
            disabled={state.isSubmitting || !formData.title || !formData.correctAnswerValue}
            className="btn-primary"
          >
            {state.isSubmitting ? '생성 중...' : '문제 생성'}
          </button>
        </div>
      </form>
    </div>
  );
};