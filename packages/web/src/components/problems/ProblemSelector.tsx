import React, { useState } from 'react';
import type { Problem } from '../../services/api';

export interface ProblemSelectorProps {
  onProblemSelect: (problem: Problem, options?: { orderIndex?: number; points?: number }) => void;
  onClose: () => void;
  excludeProblemIds?: string[];
  multiSelect?: boolean;
}

export const ProblemSelector: React.FC<ProblemSelectorProps> = ({
  onProblemSelect,
  onClose,
  excludeProblemIds = [],
  multiSelect = false
}) => {
  const [selectedProblems, setSelectedProblems] = useState<Problem[]>([]);
  
  // Mock problems for demonstration
  const mockProblems: Problem[] = [
    {
      id: 'prob1',
      title: '이차방정식 풀기',
      type: 'multiple_choice',
      difficulty: 5,
      content: '다음 이차방정식을 풀어보세요.',
      answer: 'A',
      points: 100,
      isActive: true,
      tags: ['수학', '이차방정식'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'prob2',
      title: '함수의 극값',
      type: 'short_answer',
      difficulty: 7,
      content: '주어진 함수의 극값을 구하세요.',
      answer: '답안',
      points: 150,
      isActive: true,
      tags: ['수학', '함수'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const availableProblems = mockProblems.filter(
    problem => !excludeProblemIds.includes(problem.id)
  );

  const handleSelect = (problem: Problem) => {
    if (multiSelect) {
      setSelectedProblems(prev => [...prev, problem]);
    } else {
      onProblemSelect(problem);
    }
  };

  const handleConfirmMultiSelect = () => {
    selectedProblems.forEach(problem => onProblemSelect(problem));
    onClose();
  };

  return (
    <div className="problem-selector-modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h3>문제 선택</h3>
          <button onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="problem-list">
            {availableProblems.map(problem => (
              <div key={problem.id} className="problem-item">
                <div className="problem-info">
                  <h4>{problem.title}</h4>
                  <p>난이도: {problem.difficulty}/10</p>
                  <p>점수: {problem.points}</p>
                </div>
                <button onClick={() => handleSelect(problem)}>
                  선택
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {multiSelect && selectedProblems.length > 0 && (
          <div className="modal-footer">
            <p>{selectedProblems.length}개 문제 선택됨</p>
            <button onClick={handleConfirmMultiSelect}>확인</button>
          </div>
        )}
      </div>
    </div>
  );
};