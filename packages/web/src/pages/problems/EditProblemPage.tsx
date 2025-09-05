import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProblemDetailContainer } from '../../containers';
import type { Problem } from '../../services/api';

/**
 * 문제 편집 페이지
 * 기존 문제를 편집하는 페이지 (상세 페이지와 동일하지만 편집 모드)
 */
export const EditProblemPage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();

  // Handle problem update
  const handleProblemUpdate = useCallback((problem: Problem) => {
    // 업데이트 성공 후 상세 페이지로 리다이렉트
    navigate(`/problems/${problem.id}`, {
      state: {
        message: '문제가 성공적으로 수정되었습니다.'
      }
    });
  }, [navigate]);

  // Handle problem deletion
  const handleProblemDelete = useCallback((deletedProblemId: string) => {
    // 삭제 후 목록 페이지로 리다이렉트
    navigate('/problems', { 
      state: { 
        message: '문제가 성공적으로 삭제되었습니다.',
        deletedProblemId 
      }
    });
  }, [navigate]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    // 편집을 취소하고 상세 페이지로 돌아감
    if (problemId) {
      navigate(`/problems/${problemId}`);
    } else {
      navigate(-1);
    }
  }, [navigate, problemId]);

  // Validate problemId
  if (!problemId) {
    return (
      <div className="edit-problem-page error">
        <div className="error-content">
          <h2>잘못된 접근</h2>
          <p>편집할 문제 ID가 제공되지 않았습니다.</p>
          <button onClick={() => navigate('/problems')}>
            문제 목록으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-problem-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>문제 편집</h1>
          <div className="breadcrumb">
            <span 
              onClick={() => navigate('/problems')}
              className="breadcrumb-link"
            >
              문제 관리
            </span>
            <span className="breadcrumb-separator">/</span>
            <span 
              onClick={() => navigate(`/problems/${problemId}`)}
              className="breadcrumb-link"
            >
              문제 상세
            </span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">편집</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="page-content">
        <ProblemDetailContainer
          problemId={problemId}
          onProblemUpdate={handleProblemUpdate}
          onProblemDelete={handleProblemDelete}
          onBack={handleBack}
          showActions={true}
          editable={true} // 편집 모드로 설정
        />
      </div>
    </div>
  );
};