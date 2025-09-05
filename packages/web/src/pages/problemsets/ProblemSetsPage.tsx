import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { ProblemSetListContainer } from '../../containers';
import { FeatureGuard } from '../../components/auth';
import type { ProblemSet } from '../../services/api';

interface ProblemSetsPageProps {
  defaultFilter?: 'all' | 'my' | 'public' | 'shared';
}

/**
 * 문제집 메인 페이지
 * 문제집 목록과 필터링 기능을 제공하는 통합 페이지
 */
export const ProblemSetsPage: React.FC<ProblemSetsPageProps> = ({ 
  defaultFilter = 'all' 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'my' | 'public' | 'shared'>(defaultFilter);

  // Handle problem set selection
  const handleProblemSetSelect = useCallback((problemSet: ProblemSet) => {
    navigate(`/problemsets/${problemSet.id}`);
  }, [navigate]);

  // Handle problem set edit
  const handleProblemSetEdit = useCallback((problemSetId: string) => {
    navigate(`/problemsets/${problemSetId}/edit`);
  }, [navigate]);

  // Handle problem set creation
  const handleCreateProblemSet = useCallback(() => {
    navigate('/problemsets/create');
  }, [navigate]);

  // Handle problem set clone
  const handleProblemSetClone = useCallback((problemSetId: string) => {
    navigate(`/problemsets/${problemSetId}/clone`);
  }, [navigate]);

  // Generate filter configuration based on active filter
  const getFilterConfig = useCallback(() => {
    switch (activeFilter) {
      case 'my':
        return {
          filters: { teacherId: user?.id }
        };
      case 'public':
        return {
          filters: { isPublic: true }
        };
      case 'shared':
        return {
          filters: { isShared: true }
        };
      default:
        return {};
    }
  }, [activeFilter, user?.id]);

  // Check permissions
  const canCreateProblemSet = user?.role === 'teacher' || user?.role === 'admin';

  return (
    <div className="problem-sets-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>문제집 관리</h1>
          <div className="header-actions">
            <FeatureGuard 
              feature="problemset_management" 
              roles={['teacher', 'admin']}
            >
              {canCreateProblemSet && (
                <button 
                  onClick={handleCreateProblemSet}
                  className="create-button primary"
                >
                  새 문제집 만들기
                </button>
              )}
            </FeatureGuard>
          </div>
        </div>
        
        {/* Filter Toggle */}
        <div className="filter-toggle">
          <button 
            className={`toggle-button ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            전체
          </button>
          {user?.role !== 'student' && (
            <button 
              className={`toggle-button ${activeFilter === 'my' ? 'active' : ''}`}
              onClick={() => setActiveFilter('my')}
            >
              내 문제집
            </button>
          )}
          <button 
            className={`toggle-button ${activeFilter === 'public' ? 'active' : ''}`}
            onClick={() => setActiveFilter('public')}
          >
            공개 문제집
          </button>
          <button 
            className={`toggle-button ${activeFilter === 'shared' ? 'active' : ''}`}
            onClick={() => setActiveFilter('shared')}
          >
            공유된 문제집
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="page-content">
        <ProblemSetListContainer
          initialFilter={getFilterConfig()}
          onProblemSetSelect={handleProblemSetSelect}
          onProblemSetEdit={handleProblemSetEdit}
          onProblemSetClone={handleProblemSetClone}
          showFilters={true}
          pageSize={20}
        />
      </div>
    </div>
  );
};