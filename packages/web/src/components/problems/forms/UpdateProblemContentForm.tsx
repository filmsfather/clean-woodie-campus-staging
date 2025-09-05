// UpdateProblemContentUseCase에 대응하는 내용 수정 폼 컴포넌트
import React, { useState, useEffect } from 'react';
import { UpdateProblemContentInput, ProblemFormState, ProblemDetailDto } from '../../../types/problems';

interface UpdateProblemContentFormProps {
  state: ProblemFormState;
  problem: ProblemDetailDto;
  onSubmit: (input: UpdateProblemContentInput) => void;
  onCancel: () => void;
}

export const UpdateProblemContentForm: React.FC<UpdateProblemContentFormProps> = ({
  state,
  problem,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<UpdateProblemContentInput>({
    problemId: problem.id,
    teacherId: problem.teacherId,
    title: problem.title,
    description: problem.description || ''
  });

  // 문제 데이터 변경시 폼 데이터 업데이트
  useEffect(() => {
    setFormData({
      problemId: problem.id,
      teacherId: problem.teacherId,
      title: problem.title,
      description: problem.description || ''
    });
  }, [problem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.isSubmitting) return;

    onSubmit(formData);
  };

  const hasChanges = () => {
    return formData.title !== problem.title || 
           formData.description !== (problem.description || '');
  };

  return (
    <div className="update-problem-content-form">
      <div className="form-header">
        <h2>문제 내용 수정</h2>
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
          {formData.title !== problem.title && (
            <div className="change-indicator">
              <span className="original">원본: {problem.title}</span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">설명</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            disabled={state.isSubmitting}
            placeholder="문제에 대한 설명을 입력하세요 (선택사항)"
            rows={4}
          />
          {formData.description !== (problem.description || '') && (
            <div className="change-indicator">
              <span className="original">
                원본: {problem.description || '(설명 없음)'}
              </span>
            </div>
          )}
        </div>

        <div className="form-info">
          <h3>변경되지 않는 정보</h3>
          <div className="readonly-info">
            <div className="info-item">
              <label>문제 유형</label>
              <span>{problem.type}</span>
            </div>
            <div className="info-item">
              <label>현재 난이도</label>
              <span>{problem.difficulty} / 10</span>
            </div>
            <div className="info-item">
              <label>현재 태그</label>
              <div className="tag-display">
                {problem.tags.length > 0 ? (
                  problem.tags.map((tag, index) => (
                    <span key={index} className="tag">#{tag}</span>
                  ))
                ) : (
                  <span className="no-tags">태그 없음</span>
                )}
              </div>
            </div>
          </div>
          <p className="form-hint">
            문제 유형, 난이도, 태그는 각각의 전용 수정 기능을 사용하세요.
          </p>
        </div>

        {state.error && (
          <div className="form-error">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="form-success">
            문제 내용이 성공적으로 수정되었습니다!
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
            disabled={state.isSubmitting || !formData.title.trim() || !hasChanges()}
            className="btn-primary"
          >
            {state.isSubmitting ? '수정 중...' : '내용 수정'}
          </button>
        </div>

        {!hasChanges() && formData.title.trim() && (
          <p className="no-changes-hint">
            변경사항이 없습니다.
          </p>
        )}
      </form>
    </div>
  );
};