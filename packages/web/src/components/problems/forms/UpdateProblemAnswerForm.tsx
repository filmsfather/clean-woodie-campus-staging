// UpdateProblemAnswerUseCase에 대응하는 정답 수정 폼 컴포넌트
import React, { useState, useEffect } from 'react';
import { UpdateProblemAnswerInput, ProblemFormState, ProblemDetailDto } from '../../../types/problems';

interface UpdateProblemAnswerFormProps {
  state: ProblemFormState;
  problem: ProblemDetailDto;
  onSubmit: (input: UpdateProblemAnswerInput) => void;
  onCancel: () => void;
}

export const UpdateProblemAnswerForm: React.FC<UpdateProblemAnswerFormProps> = ({
  state,
  problem,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<UpdateProblemAnswerInput>({
    problemId: problem.id,
    teacherId: problem.teacherId,
    correctAnswerValue: ''
  });

  // 컴포넌트 마운트시 현재 정답 정보는 보안상 표시하지 않음
  useEffect(() => {
    setFormData({
      problemId: problem.id,
      teacherId: problem.teacherId,
      correctAnswerValue: ''
    });
  }, [problem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.isSubmitting || !formData.correctAnswerValue.trim()) return;

    onSubmit({
      ...formData,
      correctAnswerValue: formData.correctAnswerValue.trim()
    });
  };

  const getAnswerPlaceholder = () => {
    switch (problem.type) {
      case 'multiple_choice':
        return '정답 번호 (예: 1, 2, 3, 4, 5)';
      case 'true_false':
        return '참 또는 거짓 (true/false)';
      case 'short_answer':
        return '정확한 답을 입력하세요';
      case 'fill_blank':
        return '빈칸에 들어갈 정답';
      case 'essay':
        return '모범 답안 또는 채점 기준';
      default:
        return '정답을 입력하세요';
    }
  };

  const getAnswerHint = () => {
    switch (problem.type) {
      case 'multiple_choice':
        return '선택지 번호를 입력하세요 (1, 2, 3, 4, 5 등)';
      case 'true_false':
        return 'true 또는 false로 입력하세요';
      case 'short_answer':
        return '대소문자 구분에 주의하세요';
      case 'fill_blank':
        return '여러 정답이 있다면 쉼표로 구분하세요';
      case 'essay':
        return '채점 기준이나 모범 답안을 제시하세요';
      default:
        return '';
    }
  };

  return (
    <div className="update-problem-answer-form">
      <div className="form-header">
        <h2>문제 정답 수정</h2>
        <button onClick={onCancel} className="btn-close">×</button>
      </div>

      <div className="current-problem-info">
        <h3>현재 문제 정보</h3>
        <div className="problem-summary">
          <p><strong>제목:</strong> {problem.title}</p>
          <p><strong>유형:</strong> {problem.type}</p>
          <p><strong>난이도:</strong> {problem.difficulty} / 10</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="answer-form">
        <div className="form-group">
          <label htmlFor="correctAnswer">새로운 정답 *</label>
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
            placeholder={getAnswerPlaceholder()}
          />
          {getAnswerHint() && (
            <small className="form-hint">
              {getAnswerHint()}
            </small>
          )}
        </div>

        <div className="security-notice">
          <h4>보안 안내</h4>
          <p>
            보안상의 이유로 현재 정답은 표시되지 않습니다. 
            새로운 정답을 입력하여 기존 정답을 변경할 수 있습니다.
          </p>
        </div>

        <div className="answer-type-info">
          <h4>문제 유형별 정답 입력 가이드</h4>
          <div className="answer-guide">
            <div className="guide-item">
              <strong>객관식:</strong> 정답 선택지 번호 (1, 2, 3, ...)
            </div>
            <div className="guide-item">
              <strong>참/거짓:</strong> true 또는 false
            </div>
            <div className="guide-item">
              <strong>단답형:</strong> 정확한 답 (대소문자 주의)
            </div>
            <div className="guide-item">
              <strong>빈칸 채우기:</strong> 정답 (여러 답 가능시 쉼표 구분)
            </div>
            <div className="guide-item">
              <strong>서술형:</strong> 모범 답안 또는 채점 기준
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
            문제 정답이 성공적으로 수정되었습니다!
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
            disabled={state.isSubmitting || !formData.correctAnswerValue.trim()}
            className="btn-primary"
          >
            {state.isSubmitting ? '수정 중...' : '정답 수정'}
          </button>
        </div>
      </form>
    </div>
  );
};