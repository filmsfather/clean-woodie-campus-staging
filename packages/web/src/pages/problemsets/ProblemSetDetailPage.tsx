import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { ProblemSetDetailContainer } from '../../containers';
import { FeatureGuard } from '../../components/auth';
import type { DetailedProblemSet } from '../../services/api';

/**
 * 문제집 상세 페이지
 * 개별 문제집의 상세 정보와 문제들을 표시하고 관리하는 페이지
 */
export const ProblemSetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // Handle navigation back to list
  const handleNavigateBack = useCallback(() => {
    navigate('/problemsets');
  }, [navigate]);

  // Handle problem set update
  const handleProblemSetUpdate = useCallback((problemSet: DetailedProblemSet) => {
    console.log('Problem set updated:', problemSet);
    // Could show success message or trigger refresh
  }, []);

  // Handle problem set deletion
  const handleProblemSetDelete = useCallback((problemSetId: string) => {
    console.log('Problem set deleted:', problemSetId);
    // Navigate back to list after successful deletion
    navigate('/problemsets');
  }, [navigate]);

  // Handle mode change
  const handleModeChange = useCallback((newMode: 'view' | 'edit') => {
    setMode(newMode);
  }, []);

  if (!id) {
    return (
      <div className="problem-set-detail-page error">
        <div className="error-message">
          <h2>잘못된 접근</h2>
          <p>문제집 ID가 유효하지 않습니다.</p>
          <button onClick={handleNavigateBack} className="back-button">
            문제집 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <FeatureGuard 
      feature="problemset_view" 
      roles={['student', 'teacher', 'admin']}
      fallback={
        <div className="problem-set-detail-page error">
          <div className="error-message">
            <h2>접근 권한 없음</h2>
            <p>이 문제집을 볼 권한이 없습니다.</p>
            <button onClick={handleNavigateBack} className="back-button">
              문제집 목록으로 돌아가기
            </button>
          </div>
        </div>
      }
    >
      <div className="problem-set-detail-page">
        <ProblemSetDetailContainer
          problemSetId={id}
          mode={mode}
          onModeChange={handleModeChange}
          onProblemSetUpdate={handleProblemSetUpdate}
          onProblemSetDelete={handleProblemSetDelete}
          onNavigateBack={handleNavigateBack}
          showEditButton={user?.role !== 'student'}
          showDeleteButton={user?.role === 'teacher' || user?.role === 'admin'}
        />
      </div>
    </FeatureGuard>
  );
};