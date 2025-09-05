import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProblemDetailContainer } from '../../containers';
import type { Problem } from '../../services/api';

/**
 * 문제 상세 페이지
 * 단일 문제의 상세 정보를 보여주고 편집 기능을 제공
 */
export const ProblemDetailPage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();

  // Handle problem update
  const handleProblemUpdate = useCallback((problem: Problem) => {
    // 업데이트 완료 피드백 (옵션)
    console.log('문제가 업데이트되었습니다:', problem);
  }, []);

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

  // Handle problem clone
  const handleProblemClone = useCallback((clonedProblem: Problem) => {
    // 복제된 문제 상세 페이지로 이동
    navigate(`/problems/${clonedProblem.id}`, {
      state: { 
        message: '문제가 성공적으로 복제되었습니다.' 
      }
    });
  }, [navigate]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Validate problemId
  if (!problemId) {
    return (
      <div className="problem-detail-page error">
        <div className="error-content">
          <h2>잘못된 접근</h2>
          <p>문제 ID가 제공되지 않았습니다.</p>
          <button onClick={() => navigate('/problems')}>
            문제 목록으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="problem-detail-page">
      <ProblemDetailContainer
        problemId={problemId}
        onProblemUpdate={handleProblemUpdate}
        onProblemDelete={handleProblemDelete}
        onProblemClone={handleProblemClone}
        onBack={handleBack}
        showActions={true}
        editable={true}
      />
    </div>
  );
};