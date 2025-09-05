// GetProblemUseCase에 대응하는 상세 UI 컴포넌트  
import React from 'react';
import { ProblemDetailDto, ProblemDetailState } from '../../types/problems';
import { FeatureGuard } from '../auth/FeatureGuard';

interface ProblemDetailProps {
  state: ProblemDetailState;
  onEdit?: () => void;
  onEditAnswer?: () => void;
  onChangeDifficulty?: () => void;
  onManageTags?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onClone?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}

export const ProblemDetail: React.FC<ProblemDetailProps> = ({
  state,
  onEdit,
  onEditAnswer,
  onChangeDifficulty,
  onManageTags,
  onActivate,
  onDeactivate,
  onClone,
  onDelete,
  onBack
}) => {
  if (state.isLoading) {
    return <div className="loading">문제를 불러오는 중...</div>;
  }

  if (state.error) {
    return (
      <div className="error">
        <h3>오류가 발생했습니다</h3>
        <p>{state.error}</p>
        <button onClick={onBack} className="btn-secondary">돌아가기</button>
      </div>
    );
  }

  if (!state.problem) {
    return (
      <div className="empty-state">
        <h3>문제를 찾을 수 없습니다</h3>
        <button onClick={onBack} className="btn-secondary">돌아가기</button>
      </div>
    );
  }

  const { problem } = state;

  return (
    <div className="problem-detail">
      <div className="detail-header">
        <button onClick={onBack} className="btn-back">← 목록으로</button>
        <div className="header-actions">
          <FeatureGuard feature="problemContentUpdate">
            <button onClick={onEdit} className="btn-secondary">내용 수정</button>
          </FeatureGuard>
          <FeatureGuard feature="problemCloning">
            <button onClick={onClone} className="btn-secondary">복제</button>
          </FeatureGuard>
        </div>
      </div>

      <div className="problem-header">
        <h1>{problem.title}</h1>
        <div className="problem-status">
          <span className={`status-badge ${problem.isActive ? 'active' : 'inactive'}`}>
            {problem.isActive ? '활성' : '비활성'}
          </span>
          <span className="type-badge">{problem.type}</span>
          <span className="difficulty-badge">난이도 {problem.difficulty}</span>
        </div>
      </div>

      {problem.description && (
        <div className="problem-description">
          <h3>설명</h3>
          <p>{problem.description}</p>
        </div>
      )}

      <div className="problem-content">
        <h3>문제 내용</h3>
        <div className="content-display">
          {problem.content.instructions && (
            <div className="instructions">
              <h4>지시사항</h4>
              <p>{problem.content.instructions}</p>
            </div>
          )}
          
          {/* 문제 타입별 추가 내용 렌더링 */}
          <ProblemContentRenderer content={problem.content} />
        </div>
      </div>

      <div className="problem-answer">
        <h3>정답 정보</h3>
        <div className="answer-info">
          <span className="answer-type">타입: {problem.correctAnswer.type}</span>
          <span className="answer-points">배점: {problem.correctAnswer.points}점</span>
          
          <FeatureGuard feature="problemAnswerUpdate">
            <button onClick={onEditAnswer} className="btn-sm">정답 수정</button>
          </FeatureGuard>
        </div>
      </div>

      <div className="problem-tags">
        <h3>태그</h3>
        <div className="tags-container">
          {problem.tags.length > 0 ? (
            problem.tags.map((tag, index) => (
              <span key={index} className="tag">#{tag}</span>
            ))
          ) : (
            <span className="no-tags">태그가 없습니다</span>
          )}
          
          <FeatureGuard feature="problemTagManagement">
            <button onClick={onManageTags} className="btn-sm btn-outline">
              태그 관리
            </button>
          </FeatureGuard>
        </div>
      </div>

      <div className="problem-actions">
        <div className="primary-actions">
          <FeatureGuard feature="problemDifficultyChange">
            <button onClick={onChangeDifficulty} className="btn-secondary">
              난이도 변경
            </button>
          </FeatureGuard>
          
          {problem.isActive ? (
            <FeatureGuard feature="problemDeactivation">
              <button onClick={onDeactivate} className="btn-warning">
                비활성화
              </button>
            </FeatureGuard>
          ) : (
            <FeatureGuard feature="problemActivation">
              <button onClick={onActivate} className="btn-success">
                활성화
              </button>
            </FeatureGuard>
          )}
        </div>

        <div className="danger-actions">
          <FeatureGuard feature="problemDeletion">
            <button onClick={onDelete} className="btn-danger">삭제</button>
          </FeatureGuard>
        </div>
      </div>

      <div className="problem-metadata">
        <p className="created-at">생성일: {new Date(problem.createdAt).toLocaleDateString()}</p>
        <p className="updated-at">수정일: {new Date(problem.updatedAt).toLocaleDateString()}</p>
        <p className="teacher-id">작성자 ID: {problem.teacherId}</p>
      </div>
    </div>
  );
};

// 문제 타입별 콘텐츠 렌더러
interface ProblemContentRendererProps {
  content: ProblemDetailDto['content'];
}

const ProblemContentRenderer: React.FC<ProblemContentRendererProps> = ({ content }) => {
  // 타입별로 다르게 렌더링
  switch (content.type) {
    case 'multiple_choice':
      return (
        <div className="multiple-choice">
          {content.choices && (
            <div className="choices">
              <h4>선택지</h4>
              <ul>
                {content.choices.map((choice: any, index: number) => (
                  <li key={index}>{choice}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    
    case 'short_answer':
      return (
        <div className="short-answer">
          {content.placeholder && (
            <p className="placeholder">예시 답변: {content.placeholder}</p>
          )}
        </div>
      );
    
    default:
      return (
        <div className="generic-content">
          {Object.entries(content).map(([key, value]) => {
            if (key === 'type' || key === 'title' || key === 'description') return null;
            return (
              <div key={key} className="content-field">
                <strong>{key}:</strong> {JSON.stringify(value)}
              </div>
            );
          })}
        </div>
      );
  }
};