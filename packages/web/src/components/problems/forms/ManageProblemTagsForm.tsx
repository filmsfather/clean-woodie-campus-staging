// ManageProblemTagsUseCase에 대응하는 태그 관리 폼 컴포넌트
import React, { useState, useEffect } from 'react';
import { ManageProblemTagsInput, ProblemFormState, ProblemDetailDto } from '../../../types/problems';

interface ManageProblemTagsFormProps {
  state: ProblemFormState;
  problem: ProblemDetailDto;
  onSubmit: (input: ManageProblemTagsInput) => void;
  onCancel: () => void;
  suggestedTags?: string[]; // 추천 태그들 (옵션)
}

export const ManageProblemTagsForm: React.FC<ManageProblemTagsFormProps> = ({
  state,
  problem,
  onSubmit,
  onCancel,
  suggestedTags = []
}) => {
  const [formData, setFormData] = useState<ManageProblemTagsInput>({
    problemId: problem.id,
    teacherId: problem.teacherId,
    tags: [...problem.tags]
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    setFormData({
      problemId: problem.id,
      teacherId: problem.teacherId,
      tags: [...problem.tags]
    });
  }, [problem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.isSubmitting) return;

    onSubmit(formData);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSuggestedTagClick = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const hasChanges = () => {
    const originalTags = [...problem.tags].sort();
    const newTags = [...formData.tags].sort();
    
    return originalTags.length !== newTags.length || 
           !originalTags.every((tag, index) => tag === newTags[index]);
  };

  const getAddedTags = () => {
    return formData.tags.filter(tag => !problem.tags.includes(tag));
  };

  const getRemovedTags = () => {
    return problem.tags.filter(tag => !formData.tags.includes(tag));
  };

  return (
    <div className="manage-problem-tags-form">
      <div className="form-header">
        <h2>문제 태그 관리</h2>
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

      <form onSubmit={handleSubmit} className="tags-form">
        <div className="form-group">
          <label htmlFor="tagInput">새 태그 추가</label>
          <div className="tag-input">
            <input
              id="tagInput"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="태그를 입력하고 Enter 키를 누르거나 추가 버튼을 클릭하세요"
              disabled={state.isSubmitting}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || state.isSubmitting || formData.tags.includes(tagInput.trim())}
              className="btn-sm"
            >
              추가
            </button>
          </div>
          
          {tagInput.trim() && formData.tags.includes(tagInput.trim()) && (
            <small className="form-warning">
              이미 추가된 태그입니다.
            </small>
          )}
        </div>

        {/* 추천 태그 섹션 */}
        {suggestedTags.length > 0 && (
          <div className="suggested-tags">
            <h4>추천 태그</h4>
            <div className="tag-suggestions">
              {suggestedTags
                .filter(tag => !formData.tags.includes(tag))
                .map((tag, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestedTagClick(tag)}
                    disabled={state.isSubmitting}
                    className="suggested-tag"
                  >
                    #{tag} +
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="current-tags">
          <h4>현재 태그 목록</h4>
          {formData.tags.length > 0 ? (
            <div className="tag-list">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={state.isSubmitting}
                    className="tag-remove"
                    title="태그 제거"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="no-tags">설정된 태그가 없습니다.</p>
          )}
        </div>

        {hasChanges() && (
          <div className="changes-preview">
            <h4>변경 사항 미리보기</h4>
            
            {getAddedTags().length > 0 && (
              <div className="added-tags">
                <span className="change-label added">추가될 태그:</span>
                <div className="tag-preview">
                  {getAddedTags().map((tag, index) => (
                    <span key={index} className="tag added">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
            
            {getRemovedTags().length > 0 && (
              <div className="removed-tags">
                <span className="change-label removed">제거될 태그:</span>
                <div className="tag-preview">
                  {getRemovedTags().map((tag, index) => (
                    <span key={index} className="tag removed">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="tag-tips">
          <h4>태그 사용 팁</h4>
          <ul>
            <li>관련 과목이나 단원을 태그로 추가하세요 (예: 수학, 물리, 화학)</li>
            <li>문제의 특성을 나타내는 태그를 추가하세요 (예: 계산, 암기, 추론)</li>
            <li>난이도나 학년을 태그로 추가할 수 있습니다 (예: 중1, 고2, 기초)</li>
            <li>너무 많은 태그는 오히려 검색을 어렵게 만들 수 있습니다</li>
          </ul>
        </div>

        {state.error && (
          <div className="form-error">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="form-success">
            문제 태그가 성공적으로 수정되었습니다!
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
            {state.isSubmitting ? '저장 중...' : '태그 저장'}
          </button>
        </div>

        {!hasChanges() && (
          <p className="no-changes-hint">
            태그를 추가하거나 제거하여 변경사항을 만드세요.
          </p>
        )}
      </form>
    </div>
  );
};