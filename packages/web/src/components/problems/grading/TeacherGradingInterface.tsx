import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Input,
  Textarea,
  Select,
  Progress,
  Grid,
} from '../../ui';
import { ProblemData } from '../editor/ProblemEditor';
import { GradingResult, SessionResult } from '../results/GradingResults';
import { AnswerComparison } from '../results/AnswerComparison';
import { FeedbackDisplay } from '../results/FeedbackDisplay';

interface StudentSubmission {
  studentId: string;
  studentName: string;
  submittedAt: Date;
  answers: { [problemId: string]: any };
  timeSpent: { [problemId: string]: number };
  isAutoGraded: boolean;
  gradingResults?: GradingResult[];
  totalScore?: number;
  maxScore: number;
  status: 'pending' | 'grading' | 'completed' | 'reviewed';
}

interface TeacherGradingInterfaceProps {
  submissions: StudentSubmission[];
  problems: ProblemData[];
  onGradeSubmission: (studentId: string, grades: GradingResult[]) => Promise<void>;
  onSaveFeedback: (studentId: string, problemId: string, feedback: string) => Promise<void>;
  onMarkComplete: (studentId: string) => Promise<void>;
  allowBulkOperations?: boolean;
}

type GradingView = 'list' | 'student' | 'problem';
type FilterStatus = 'all' | 'pending' | 'grading' | 'completed' | 'reviewed';

export function TeacherGradingInterface({
  submissions,
  problems,
  onGradeSubmission,
  onSaveFeedback,
  onMarkComplete,
  allowBulkOperations = true,
}: TeacherGradingInterfaceProps) {
  const [currentView, setCurrentView] = useState<GradingView>('list');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [customGrades, setCustomGrades] = useState<{ [key: string]: { score: number; feedback: string } }>({});

  // 필터링된 제출물
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;
      const matchesSearch = submission.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [submissions, filterStatus, searchTerm]);

  // 통계 계산
  const stats = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter(s => s.status === 'pending').length;
    const grading = submissions.filter(s => s.status === 'grading').length;
    const completed = submissions.filter(s => s.status === 'completed').length;
    const reviewed = submissions.filter(s => s.status === 'reviewed').length;
    
    return { total, pending, grading, completed, reviewed };
  }, [submissions]);

  const selectedSubmission = selectedStudentId 
    ? submissions.find(s => s.studentId === selectedStudentId)
    : null;

  // 개별 문제 채점
  const handleGradeProblem = useCallback(async (
    studentId: string, 
    problemId: string, 
    score: number, 
    feedback: string
  ) => {
    const submission = submissions.find(s => s.studentId === studentId);
    if (!submission) return;

    const problem = problems.find(p => p.id === problemId);
    if (!problem) return;

    const gradingResult: GradingResult = {
      problemId,
      isCorrect: score === problem.points,
      earnedPoints: score,
      maxPoints: problem.points,
      studentAnswer: submission.answers[problemId],
      correctAnswer: null, // 실제로는 도메인에서 가져와야 함
      feedback,
      timeSpent: submission.timeSpent[problemId] || 0,
    };

    // 기존 채점 결과 업데이트
    const existingResults = submission.gradingResults || [];
    const updatedResults = existingResults.filter(r => r.problemId !== problemId);
    updatedResults.push(gradingResult);

    await onGradeSubmission(studentId, updatedResults);
  }, [submissions, problems, onGradeSubmission]);

  // 자동 채점 실행
  const handleAutoGrade = useCallback(async (studentId: string) => {
    setIsGrading(true);
    try {
      const submission = submissions.find(s => s.studentId === studentId);
      if (!submission) return;

      const gradingResults: GradingResult[] = [];

      for (const problem of problems) {
        if (!problem.id) continue;
        
        const studentAnswer = submission.answers[problem.id];
        let isCorrect = false;
        let earnedPoints = 0;

        // 문제 유형별 자동 채점 로직
        switch (problem.type) {
          case 'multiple_choice':
            const correctChoices = problem.multipleChoiceData?.choices.filter(c => c.isCorrect) || [];
            const studentChoices = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];
            
            const correctIds = correctChoices.map(c => c.id);
            const isExactMatch = correctIds.length === studentChoices.length &&
              correctIds.every(id => studentChoices.includes(id)) &&
              studentChoices.every(id => correctIds.includes(id));
            
            isCorrect = isExactMatch;
            earnedPoints = isCorrect ? problem.points : 0;
            break;

          case 'short_answer':
            const acceptedAnswers = problem.shortAnswerData?.correctAnswers || [];
            const caseSensitive = problem.shortAnswerData?.caseSensitive || false;
            
            const studentText = String(studentAnswer || '').trim();
            isCorrect = acceptedAnswers.some(correct => {
              return caseSensitive 
                ? correct === studentText
                : correct.toLowerCase() === studentText.toLowerCase();
            });
            
            earnedPoints = isCorrect ? problem.points : 0;
            break;

          case 'true_false':
            const correctAnswer = problem.trueFalseData?.correctAnswer;
            isCorrect = studentAnswer === correctAnswer;
            earnedPoints = isCorrect ? problem.points : 0;
            break;

          case 'matching':
            const correctMatches = problem.matchingData?.correctMatches || [];
            const studentMatches = studentAnswer || [];
            const allowsPartialCredit = problem.matchingData?.allowsPartialCredit || false;
            
            let correctCount = 0;
            for (const studentMatch of studentMatches) {
              if (correctMatches.some(correct => 
                correct.leftId === studentMatch.leftId && correct.rightId === studentMatch.rightId
              )) {
                correctCount++;
              }
            }
            
            if (allowsPartialCredit) {
              earnedPoints = Math.round((correctCount / correctMatches.length) * problem.points);
              isCorrect = correctCount === correctMatches.length;
            } else {
              isCorrect = correctCount === correctMatches.length;
              earnedPoints = isCorrect ? problem.points : 0;
            }
            break;

          case 'fill_blank':
            const blanks = problem.fillBlankData?.blanks || [];
            const studentBlanks = studentAnswer || {};
            const allowsPartialCreditFB = problem.fillBlankData?.allowsPartialCredit || false;
            
            let correctBlanks = 0;
            for (const blank of blanks) {
              const studentBlankAnswer = String(studentBlanks[blank.id] || '').trim();
              const isBlankCorrect = blank.acceptedAnswers.some(accepted => {
                return blank.caseSensitive
                  ? accepted === studentBlankAnswer
                  : accepted.toLowerCase() === studentBlankAnswer.toLowerCase();
              });
              
              if (isBlankCorrect) correctBlanks++;
            }
            
            if (allowsPartialCreditFB) {
              earnedPoints = Math.round((correctBlanks / blanks.length) * problem.points);
              isCorrect = correctBlanks === blanks.length;
            } else {
              isCorrect = correctBlanks === blanks.length;
              earnedPoints = isCorrect ? problem.points : 0;
            }
            break;

          case 'ordering':
            const correctOrder = problem.orderingData?.correctOrder || [];
            const studentOrder = studentAnswer || [];
            const allowsPartialCreditOrd = problem.orderingData?.allowsPartialCredit || false;
            
            let correctPositions = 0;
            for (let i = 0; i < correctOrder.length; i++) {
              if (correctOrder[i] === studentOrder[i]) {
                correctPositions++;
              }
            }
            
            if (allowsPartialCreditOrd) {
              earnedPoints = Math.round((correctPositions / correctOrder.length) * problem.points);
              isCorrect = correctPositions === correctOrder.length;
            } else {
              isCorrect = correctPositions === correctOrder.length;
              earnedPoints = isCorrect ? problem.points : 0;
            }
            break;

          case 'long_answer':
            // 서술형은 수동 채점 필요
            earnedPoints = 0;
            isCorrect = false;
            break;
        }

        gradingResults.push({
          problemId: problem.id,
          isCorrect,
          earnedPoints,
          maxPoints: problem.points,
          studentAnswer,
          correctAnswer: null,
          feedback: '',
          timeSpent: submission.timeSpent[problem.id] || 0,
        });
      }

      await onGradeSubmission(studentId, gradingResults);
    } finally {
      setIsGrading(false);
    }
  }, [submissions, problems, onGradeSubmission]);

  // 렌더링 함수들
  const renderGradingStats = () => (
    <Grid cols={{ base: 2, md: 5 }} gap={4} className="mb-6">
      <Card>
        <CardContent className="text-center py-4">
          <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
          <div className="text-sm text-text-secondary">전체</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="text-center py-4">
          <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          <div className="text-sm text-text-secondary">대기중</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="text-center py-4">
          <div className="text-2xl font-bold text-blue-600">{stats.grading}</div>
          <div className="text-sm text-text-secondary">채점중</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="text-center py-4">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-text-secondary">완료</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="text-center py-4">
          <div className="text-2xl font-bold text-purple-600">{stats.reviewed}</div>
          <div className="text-sm text-text-secondary">검토완료</div>
        </CardContent>
      </Card>
    </Grid>
  );

  const renderSubmissionsList = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>제출물 목록</CardTitle>
          <div className="flex gap-3">
            <Input
              placeholder="학생 이름 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Select
              value={filterStatus}
              onValueChange={(value) => setFilterStatus(value as FilterStatus)}
            >
              <option value="all">전체</option>
              <option value="pending">대기중</option>
              <option value="grading">채점중</option>
              <option value="completed">완료</option>
              <option value="reviewed">검토완료</option>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.studentId}
              className="flex items-center justify-between p-4 border border-border-primary rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-medium text-text-primary">
                    {submission.studentName}
                  </div>
                  <div className="text-sm text-text-secondary">
                    제출: {submission.submittedAt.toLocaleDateString()} {submission.submittedAt.toLocaleTimeString()}
                  </div>
                </div>
                <Badge 
                  variant={
                    submission.status === 'completed' ? 'success' :
                    submission.status === 'grading' ? 'warning' :
                    submission.status === 'reviewed' ? 'info' : 'outline'
                  }
                >
                  {submission.status === 'pending' ? '대기중' :
                   submission.status === 'grading' ? '채점중' :
                   submission.status === 'completed' ? '완료' : '검토완료'}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                {submission.totalScore !== undefined && (
                  <div className="text-right">
                    <div className="font-medium">
                      {submission.totalScore}/{submission.maxScore}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {Math.round((submission.totalScore / submission.maxScore) * 100)}%
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {submission.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleAutoGrade(submission.studentId)}
                      disabled={isGrading}
                    >
                      자동채점
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedStudentId(submission.studentId);
                      setCurrentView('student');
                    }}
                  >
                    채점하기
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderStudentGrading = () => {
    if (!selectedSubmission) return null;

    return (
      <div className="space-y-6">
        {/* 학생 정보 헤더 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">
                  {selectedSubmission.studentName} 채점
                </CardTitle>
                <p className="text-text-secondary">
                  제출시간: {selectedSubmission.submittedAt.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentView('list');
                    setSelectedStudentId(null);
                  }}
                >
                  목록으로
                </Button>
                {selectedSubmission.status === 'completed' && (
                  <Button
                    onClick={() => onMarkComplete(selectedSubmission.studentId)}
                  >
                    검토완료 표시
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 문제별 채점 */}
        <div className="space-y-4">
          {problems.map((problem, index) => {
            if (!problem.id) return null;
            
            const gradingResult = selectedSubmission.gradingResults?.find(gr => gr.problemId === problem.id);
            const customGradeKey = `${selectedSubmission.studentId}_${problem.id}`;
            const customGrade = customGrades[customGradeKey];
            
            return (
              <Card key={problem.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      문제 {index + 1}: {problem.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" size="sm">
                        {problem.points}점
                      </Badge>
                      {gradingResult && (
                        <Badge 
                          variant={gradingResult.isCorrect ? 'success' : 'error'}
                          size="sm"
                        >
                          {gradingResult.earnedPoints}/{gradingResult.maxPoints}점
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 문제 내용 */}
                  <div className="p-3 bg-surface-secondary rounded-lg">
                    <p className="text-text-primary whitespace-pre-wrap">
                      {problem.content}
                    </p>
                  </div>

                  {/* 답안 비교 */}
                  {gradingResult && (
                    <AnswerComparison
                      gradingResult={gradingResult}
                      problem={problem}
                      showExplanation={true}
                    />
                  )}

                  {/* 채점 도구 */}
                  {problem.type === 'long_answer' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                      <div>
                        <label className="text-sm font-medium text-text-primary block mb-2">
                          점수 ({problem.points}점 만점)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max={problem.points}
                          value={customGrade?.score || gradingResult?.earnedPoints || ''}
                          onChange={(e) => {
                            const score = parseInt(e.target.value) || 0;
                            setCustomGrades(prev => ({
                              ...prev,
                              [customGradeKey]: {
                                ...prev[customGradeKey],
                                score,
                                feedback: prev[customGradeKey]?.feedback || ''
                              }
                            }));
                          }}
                          placeholder="점수 입력"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-text-primary block mb-2">
                          피드백
                        </label>
                        <Textarea
                          value={customGrade?.feedback || gradingResult?.feedback || ''}
                          onChange={(e) => {
                            const feedback = e.target.value;
                            setCustomGrades(prev => ({
                              ...prev,
                              [customGradeKey]: {
                                ...prev[customGradeKey],
                                score: prev[customGradeKey]?.score || gradingResult?.earnedPoints || 0,
                                feedback
                              }
                            }));
                          }}
                          placeholder="학생에게 줄 피드백을 작성해주세요..."
                          className="min-h-[80px]"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const grade = customGrades[customGradeKey];
                            if (grade && problem.id) {
                              handleGradeProblem(
                                selectedSubmission.studentId,
                                problem.id,
                                grade.score,
                                grade.feedback
                              );
                            }
                          }}
                          disabled={!customGrades[customGradeKey]}
                        >
                          점수 저장
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 피드백 표시/편집 */}
                  <FeedbackDisplay
                    gradingResult={gradingResult || {
                      problemId: problem.id,
                      isCorrect: false,
                      earnedPoints: 0,
                      maxPoints: problem.points,
                      studentAnswer: selectedSubmission.answers[problem.id],
                      correctAnswer: null,
                      feedback: '',
                      timeSpent: 0
                    }}
                    problem={problem}
                    canEditFeedback={true}
                    onFeedbackUpdate={(feedback) => {
                      if (problem.id) {
                        onSaveFeedback(selectedSubmission.studentId, problem.id, feedback);
                      }
                    }}
                    showDetailedFeedback={true}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 상단 네비게이션 */}
      <div className="flex gap-3">
        <Button
          variant={currentView === 'list' ? 'default' : 'outline'}
          onClick={() => setCurrentView('list')}
        >
          📋 제출물 목록
        </Button>
        {allowBulkOperations && (
          <Button
            variant="outline"
            onClick={() => {/* 일괄 채점 모달 열기 */}}
          >
            ⚡ 일괄 채점
          </Button>
        )}
      </div>

      {/* 통계 */}
      {renderGradingStats()}

      {/* 메인 콘텐츠 */}
      {currentView === 'list' && renderSubmissionsList()}
      {currentView === 'student' && renderStudentGrading()}
    </div>
  );
}