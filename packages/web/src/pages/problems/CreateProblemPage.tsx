import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProblemFormContainer } from '../../containers';
import type { Problem, CreateProblemRequest } from '../../services/api';

/**
 * 문제 생성 페이지
 * 새로운 문제를 생성하는 페이지
 */
export const CreateProblemPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get initial data from location state if available
  const initialData = (location.state as { initialData?: Partial<CreateProblemRequest> })?.initialData;

  // Handle successful problem creation
  const handleProblemCreated = useCallback((problem: Problem) => {
    // 생성된 문제 상세 페이지로 리다이렉트
    navigate(`/problems/${problem.id}`, {
      state: {
        message: '문제가 성공적으로 생성되었습니다.',
        isNewProblem: true
      }
    });
  }, [navigate]);

  // Handle form cancellation
  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className="create-problem-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>새 문제 만들기</h1>
          <div className="breadcrumb">
            <span 
              onClick={() => navigate('/problems')}
              className="breadcrumb-link"
            >
              문제 관리
            </span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">새 문제</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="page-content">
        <div className="form-section">
          <ProblemFormContainer
            onProblemCreated={handleProblemCreated}
            onCancel={handleCancel}
            initialData={initialData}
            showSuccessMessage={true}
          />
        </div>
      </div>
    </div>
  );
};