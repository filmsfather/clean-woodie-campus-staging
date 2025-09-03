import React, { useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import { Progress } from '../../../ui/Progress';
import { useStudentDashboard, useStartProblemSet } from '../hooks/useStudentDashboard';
import { DashboardSkeleton } from '../../shared/components';
import { Unauthorized } from '../../../auth/Unauthorized';
import { ProblemSolverContainer, ProblemSetSession } from '../../../problems/solver/ProblemSolverContainer';

export const ProblemSolvingPage: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading } = useStudentDashboard(user?.id || '', {
    enabled: !!user && user.role === 'student'
  });
  const startProblemSet = useStartProblemSet();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [activeSession, setActiveSession] = useState<ProblemSetSession | null>(null);

  // 문제 시작 핸들러
  const handleStartProblemSet = (problemSetId: string) => {
    // 실제로는 API에서 문제 데이터를 가져와야 함
    const mockProblems = [
      {
        id: '1',
        title: '기본 덧셈 문제',
        type: 'multiple_choice' as const,
        difficulty: 'easy' as const,
        points: 10,
        content: '다음 계산의 결과를 구하시오: 15 + 27 = ?',
        options: ['40', '42', '44', '46'],
        correctAnswer: '42',
        explanation: '15 + 27 = 42입니다.',
        tags: ['수학', '덧셈']
      },
      {
        id: '2',
        title: '간단한 단답 문제',
        type: 'short_answer' as const,
        difficulty: 'easy' as const,
        points: 10,
        content: '대한민국의 수도는 어디인가요?',
        correctAnswer: '서울',
        explanation: '대한민국의 수도는 서울입니다.',
        tags: ['사회', '지리']
      }
    ];

    const session: ProblemSetSession = {
      sessionId: `session-${Date.now()}`,
      problemSetId,
      problems: mockProblems,
      currentProblemIndex: 0,
      answers: new Map(),
      startTime: new Date(),
      timeLimit: 1800, // 30분
      isCompleted: false
    };

    setActiveSession(session);
  };

  // solver 핸들러들
  const handleAnswerChange = (problemId: string, answer: any) => {
    if (!activeSession) return;
    
    const updatedAnswers = new Map(activeSession.answers);
    updatedAnswers.set(problemId, {
      problemId,
      type: activeSession.problems.find(p => p.id === problemId)?.type || '',
      answer,
      timeSpent: Math.floor((Date.now() - activeSession.startTime.getTime()) / 1000)
    });
    
    setActiveSession({
      ...activeSession,
      answers: updatedAnswers
    });
  };

  const handleNavigate = (newIndex: number) => {
    if (!activeSession) return;
    
    setActiveSession({
      ...activeSession,
      currentProblemIndex: newIndex
    });
  };

  const handleSubmit = async (answers: Map<string, any>) => {
    // 실제로는 API로 답안 제출
    console.log('답안 제출:', answers);
    setActiveSession(null); // 세션 종료
  };

  const handleBackToList = () => {
    setActiveSession(null);
  };

  if (!user || user.role !== 'student') {
    return <Unauthorized message="학생만 접근할 수 있는 페이지입니다." />;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // 활성 세션이 있으면 solver 컴포넌트 렌더링
  if (activeSession) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">문제 풀기</h1>
          <Button variant="ghost" onClick={handleBackToList}>
            문제집 목록으로 돌아가기
          </Button>
        </div>
        <ProblemSolverContainer
          session={activeSession}
          onAnswerChange={handleAnswerChange}
          onNavigate={handleNavigate}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  // Mock problem sets data
  const problemSets = [
    {
      id: '1',
      title: '기본 수학 연산',
      description: '덧셈, 뺄셈, 곱셈, 나눗셈의 기본 개념을 익혀보세요',
      difficulty: 'easy',
      subject: 'math',
      problemCount: 15,
      estimatedTime: 20,
      completionRate: 85,
      tags: ['기초수학', '연산'],
      isRecommended: true
    },
    {
      id: '2', 
      title: '영어 단어 암기',
      description: '중학교 필수 영어 단어 300개를 학습해보세요',
      difficulty: 'medium',
      subject: 'english',
      problemCount: 50,
      estimatedTime: 35,
      completionRate: 60,
      tags: ['영어단어', '암기'],
      isRecommended: false
    },
    {
      id: '3',
      title: '과학 실험 원리',
      description: '기초 화학 실험의 원리와 과정을 이해해보세요',
      difficulty: 'hard',
      subject: 'science',
      problemCount: 25,
      estimatedTime: 45,
      completionRate: 30,
      tags: ['화학', '실험'],
      isRecommended: true
    },
    {
      id: '4',
      title: '한국사 연대기',
      description: '조선시대부터 근현대사까지의 주요 사건들을 학습해보세요',
      difficulty: 'medium',
      subject: 'history',
      problemCount: 30,
      estimatedTime: 40,
      completionRate: 45,
      tags: ['한국사', '연대기'],
      isRecommended: false
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return difficulty;
    }
  };

  const getSubjectLabel = (subject: string) => {
    switch (subject) {
      case 'math': return '수학';
      case 'english': return '영어';
      case 'science': return '과학';
      case 'history': return '사회';
      default: return subject;
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'math': return '🔢';
      case 'english': return '🔤';
      case 'science': return '🔬';
      case 'history': return '📚';
      default: return '📖';
    }
  };

  const filteredProblemSets = problemSets.filter(set => {
    const difficultyMatch = selectedDifficulty === 'all' || set.difficulty === selectedDifficulty;
    const subjectMatch = selectedSubject === 'all' || set.subject === selectedSubject;
    return difficultyMatch && subjectMatch;
  });

  const recommendedSets = filteredProblemSets.filter(set => set.isRecommended);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">문제 풀기</h1>
        <p className="text-text-secondary">
          다양한 주제의 문제집을 풀어보며 실력을 향상시켜보세요!
        </p>
      </div>

      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-primary">
              {problemSets.length}
            </div>
            <div className="text-sm text-text-secondary">사용 가능한 문제집</div>
            <Badge variant="outline" size="sm">문제집</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-success">
              {problemSets.reduce((sum, set) => sum + set.problemCount, 0)}
            </div>
            <div className="text-sm text-text-secondary">전체 문제 수</div>
            <Badge variant="success" size="sm">문제</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-warning">
              {Math.round(problemSets.reduce((sum, set) => sum + set.completionRate, 0) / problemSets.length)}%
            </div>
            <div className="text-sm text-text-secondary">평균 완료율</div>
            <Badge variant="warning" size="sm">진도</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-info">
              {problemSets.reduce((sum, set) => sum + set.estimatedTime, 0)}분
            </div>
            <div className="text-sm text-text-secondary">전체 예상 시간</div>
            <Badge variant="default" size="sm">시간</Badge>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔍</span>
            <span>문제집 필터</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">난이도</label>
              <div className="flex space-x-2">
                {['all', 'easy', 'medium', 'hard'].map((difficulty) => (
                  <Button
                    key={difficulty}
                    variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDifficulty(difficulty)}
                  >
                    {difficulty === 'all' ? '전체' : getDifficultyLabel(difficulty)}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">과목</label>
              <div className="flex space-x-2">
                {['all', 'math', 'english', 'science', 'history'].map((subject) => (
                  <Button
                    key={subject}
                    variant={selectedSubject === subject ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject === 'all' ? '전체' : getSubjectLabel(subject)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 추천 문제집 */}
      {recommendedSets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>⭐</span>
              <span>추천 문제집</span>
              <Badge variant="default" size="sm">AI 추천</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-200">
                당신의 학습 현황과 취약점을 분석하여 가장 적합한 문제집을 추천해드립니다!
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recommendedSets.map((problemSet) => (
                <ProblemSetCard
                  key={problemSet.id}
                  problemSet={problemSet}
                  onStart={() => handleStartProblemSet(problemSet.id)}
                  isRecommended
                  isLoading={startProblemSet.isPending}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 전체 문제집 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>📚</span>
              <span>모든 문제집</span>
              <Badge variant="outline" size="sm">
                {filteredProblemSets.length}개
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProblemSets.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredProblemSets.map((problemSet) => (
                <ProblemSetCard
                  key={problemSet.id}
                  problemSet={problemSet}
                  onStart={() => handleStartProblemSet(problemSet.id)}
                  isLoading={startProblemSet.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔍</div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-text-primary">
                  조건에 맞는 문제집이 없습니다
                </h3>
                <p className="text-sm text-text-secondary">
                  필터 조건을 변경해보세요
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ProblemSetCard 컴포넌트
interface ProblemSetCardProps {
  problemSet: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    subject: string;
    problemCount: number;
    estimatedTime: number;
    completionRate: number;
    tags: string[];
    isRecommended: boolean;
  };
  onStart: () => void;
  isRecommended?: boolean;
  isLoading?: boolean;
}

const ProblemSetCard: React.FC<ProblemSetCardProps> = ({ problemSet, onStart, isRecommended, isLoading = false }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'; 
      case 'hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return difficulty;
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'math': return '🔢';
      case 'english': return '🔤';
      case 'science': return '🔬';
      case 'history': return '📚';
      default: return '📖';
    }
  };

  return (
    <div className={`p-6 rounded-lg border transition-all duration-200 hover:shadow-lg ${
      isRecommended 
        ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20' 
        : 'border-border-primary bg-surface-secondary hover:bg-surface-tertiary'
    }`}>
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="text-2xl mt-1">
              {getSubjectIcon(problemSet.subject)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-text-primary">
                  {problemSet.title}
                </h4>
                {isRecommended && (
                  <Badge variant="default" size="sm">
                    추천
                  </Badge>
                )}
              </div>
              <p className="text-sm text-text-secondary mb-2">
                {problemSet.description}
              </p>
            </div>
          </div>
        </div>

        {/* 태그 */}
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            size="sm"
            className={getDifficultyColor(problemSet.difficulty)}
          >
            {getDifficultyLabel(problemSet.difficulty)}
          </Badge>
          {problemSet.tags.map((tag, index) => (
            <Badge key={index} variant="outline" size="sm">
              {tag}
            </Badge>
          ))}
        </div>

        {/* 진행률 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">진행률</span>
            <span className="font-medium">{problemSet.completionRate}%</span>
          </div>
          <Progress
            value={problemSet.completionRate}
            variant={problemSet.completionRate >= 80 ? 'success' : problemSet.completionRate >= 50 ? 'warning' : 'default'}
            className="h-2"
          />
        </div>

        {/* 정보 */}
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <div className="flex items-center space-x-4">
            <span>📝 {problemSet.problemCount}문제</span>
            <span>⏱️ 약 {problemSet.estimatedTime}분</span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <Button
          onClick={onStart}
          className="w-full"
          size="sm"
          variant={isRecommended ? 'default' : 'outline'}
          disabled={isLoading}
        >
          {isLoading ? '준비 중...' : 
           problemSet.completionRate > 0 ? '이어서 풀기' : '시작하기'}
        </Button>
      </div>
    </div>
  );
};