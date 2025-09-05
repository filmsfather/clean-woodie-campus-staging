import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProblemSetFormContainer } from '../../containers';
import { FeatureGuard } from '../../components/auth';
import type { ProblemSet } from '../../services/api';

/**
 * 문제집 편집 페이지
 * 기존 문제집을 수정하는 페이지
 */
export const EditProblemSetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Handle successful save
  const handleSave = useCallback((problemSet: ProblemSet) => {
    console.log('Problem set updated:', problemSet);
    // Navigate back to the problem set detail page
    navigate(`/problemsets/${problemSet.id}`);
  }, [navigate]);

  // Handle cancellation
  const handleCancel = useCallback(() => {
    if (id) {
      navigate(`/problemsets/${id}`);
    } else {
      navigate('/problemsets');
    }
  }, [navigate, id]);

  // Handle error
  const handleError = useCallback((error: string) => {
    console.error('Error updating problem set:', error);
    // Error will be displayed by the form container
  }, []);

  if (!id) {
    return (
      <div className="edit-problem-set-page error">
        <div className="error-message">
          <h2>잘못된 접근</h2>
          <p>문제집 ID가 유효하지 않습니다.</p>
          <button onClick={() => navigate('/problemsets')} className="back-button">
            문제집 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <FeatureGuard 
      feature="problemset_management" 
      roles={['teacher', 'admin']}
      fallback={
        <div className="edit-problem-set-page error">
          <div className="error-message">
            <h2>접근 권한 없음</h2>
            <p>문제집을 수정할 권한이 없습니다.</p>
            <button onClick={handleCancel} className="back-button">
              문제집으로 돌아가기
            </button>
          </div>
        </div>
      }
    >
      <div className="edit-problem-set-page">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <button onClick={handleCancel} className="back-button">
              ← 문제집으로 돌아가기
            </button>
            <h1>문제집 편집</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="page-content">
          <ProblemSetFormContainer
            mode="edit"
            problemSetId={id}
            onSave={handleSave}
            onCancel={handleCancel}
            onError={handleError}
          />
        </div>
      </div>
    </FeatureGuard>
  );
};