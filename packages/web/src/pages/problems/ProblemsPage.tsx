import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProblemListContainer, ProblemSearchContainer } from '../../containers';
import type { Problem } from '../../services/api';

interface ProblemsPageProps {
  defaultView?: 'list' | 'search';
}

/**
 * 문제 메인 페이지
 * 문제 목록과 검색 기능을 제공하는 통합 페이지
 */
export const ProblemsPage: React.FC<ProblemsPageProps> = ({ 
  defaultView = 'list' 
}) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'list' | 'search'>(defaultView);

  // Handle problem selection
  const handleProblemSelect = useCallback((problem: Problem) => {
    navigate(`/problems/${problem.id}`);
  }, [navigate]);

  // Handle problem edit
  const handleProblemEdit = useCallback((problemId: string) => {
    navigate(`/problems/${problemId}/edit`);
  }, [navigate]);

  // Handle problem creation
  const handleCreateProblem = useCallback(() => {
    navigate('/problems/create');
  }, [navigate]);

  return (
    <div className="problems-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>문제 관리</h1>
          <div className="header-actions">
            <button 
              onClick={handleCreateProblem}
              className="create-button primary"
            >
              새 문제 만들기
            </button>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="view-toggle">
          <button 
            className={`toggle-button ${activeView === 'list' ? 'active' : ''}`}
            onClick={() => setActiveView('list')}
          >
            목록 보기
          </button>
          <button 
            className={`toggle-button ${activeView === 'search' ? 'active' : ''}`}
            onClick={() => setActiveView('search')}
          >
            검색
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="page-content">
        {activeView === 'list' ? (
          <ProblemListContainer
            onProblemSelect={handleProblemSelect}
            onProblemEdit={handleProblemEdit}
            showFilters={true}
            pageSize={20}
          />
        ) : (
          <ProblemSearchContainer
            onProblemSelect={handleProblemSelect}
            onProblemEdit={handleProblemEdit}
            showAdvancedFilters={true}
            autoSearch={true}
            pageSize={20}
          />
        )}
      </div>
    </div>
  );
};