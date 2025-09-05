import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProblemSetFormContainer } from '../../containers';
import { FeatureGuard } from '../../components/auth';
import type { ProblemSet } from '../../services/api';

/**
 * 문제집 생성 페이지
 * 새로운 문제집을 만드는 페이지
 */
export const CreateProblemSetPage: React.FC = () => {
  const navigate = useNavigate();

  // Handle successful creation
  const handleSave = useCallback((problemSet: ProblemSet) => {
    console.log('Problem set created:', problemSet);
    // Navigate to the newly created problem set detail page
    navigate(`/problemsets/${problemSet.id}`);
  }, [navigate]);

  // Handle cancellation
  const handleCancel = useCallback(() => {
    navigate('/problemsets');
  }, [navigate]);

  // Handle error
  const handleError = useCallback((error: string) => {
    console.error('Error creating problem set:', error);
    // Error will be displayed by the form container
  }, []);

  return (
    <FeatureGuard 
      feature="problemset_management" 
      roles={['teacher', 'admin']}
      fallback={
        <div className="create-problem-set-page error">
          <div className="error-message">
            <h2>접근 권한 없음</h2>
            <p>문제집을 생성할 권한이 없습니다.</p>
            <button onClick={handleCancel} className="back-button">
              문제집 목록으로 돌아가기
            </button>
          </div>
        </div>
      }
    >
      <div className="create-problem-set-page">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <button onClick={handleCancel} className="back-button">
              ← 문제집 목록으로 돌아가기
            </button>
            <h1>새 문제집 만들기</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="page-content">
          <ProblemSetFormContainer
            mode="create"
            onSave={handleSave}
            onCancel={handleCancel}
            onError={handleError}
          />
        </div>
      </div>
    </FeatureGuard>
  );
};