import React, { useState } from 'react';
import type { DetailedProblemSet } from '../../services/api';

export interface ProblemSetEditorProps {
  problemSet: DetailedProblemSet;
  onSave: (problemSet: DetailedProblemSet) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ProblemSetEditor: React.FC<ProblemSetEditorProps> = ({
  problemSet,
  onSave,
  onCancel,
  loading = false
}) => {
  const [title, setTitle] = useState(problemSet.title);
  const [description, setDescription] = useState(problemSet.description || '');
  const [isPublic, setIsPublic] = useState(problemSet.isPublic);
  const [isShared, setIsShared] = useState(problemSet.isShared);

  const handleSave = () => {
    const updatedProblemSet: DetailedProblemSet = {
      ...problemSet,
      title,
      description,
      isPublic,
      isShared
    };
    onSave(updatedProblemSet);
  };

  return (
    <div className="problem-set-editor">
      <h2>문제집 편집</h2>
      
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="form-group">
          <label htmlFor="title">제목</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">설명</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
        
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            공개 문제집
          </label>
        </div>
        
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
            />
            다른 교사와 공유
          </label>
        </div>
        
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </button>
          <button type="button" onClick={onCancel} disabled={loading}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
};