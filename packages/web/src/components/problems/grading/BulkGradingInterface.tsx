import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Checkbox,
  Progress,
  Modal,
  Textarea,
} from '../../ui';
import { ProblemData } from '../editor/ProblemEditor';

interface StudentSubmission {
  studentId: string;
  studentName: string;
  submittedAt: Date;
  answers: { [problemId: string]: any };
  timeSpent: { [problemId: string]: number };
  status: 'pending' | 'grading' | 'completed' | 'reviewed';
}

interface BulkGradingResult {
  studentId: string;
  studentName: string;
  problemResults: {
    problemId: string;
    earnedPoints: number;
    maxPoints: number;
    isCorrect: boolean;
    processingStatus: 'pending' | 'success' | 'error';
    errorMessage?: string;
  }[];
  totalScore: number;
  maxScore: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

interface BulkGradingInterfaceProps {
  submissions: StudentSubmission[];
  problems: ProblemData[];
  isOpen: boolean;
  onClose: () => void;
  onBulkGrade: (results: BulkGradingResult[]) => Promise<void>;
}

type BulkOperation = 'auto-grade' | 'set-score' | 'add-feedback' | 'update-status';

export function BulkGradingInterface({
  submissions,
  problems,
  isOpen,
  onClose,
  onBulkGrade,
}: BulkGradingInterfaceProps) {
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation>('auto-grade');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedProblems, setSelectedProblems] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState<BulkGradingResult[]>([]);
  const [bulkScore, setBulkScore] = useState<number>(0);
  const [bulkFeedback, setBulkFeedback] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'select' | 'configure' | 'processing' | 'results'>('select');

  // 선택 가능한 제출물 (대기중인 것들만)
  const eligibleSubmissions = useMemo(() => {
    return submissions.filter(s => s.status === 'pending');
  }, [submissions]);

  // 자동 채점 가능한 문제들 (서술형 제외)
  const autoGradableProblems = useMemo(() => {
    return problems.filter(p => p.type !== 'long_answer');
  }, [problems]);

  const resetModal = useCallback(() => {
    setSelectedOperation('auto-grade');
    setSelectedStudents(new Set());
    setSelectedProblems(new Set());
    setProcessingResults([]);
    setBulkScore(0);
    setBulkFeedback('');
    setCurrentStep('select');
    setIsProcessing(false);
  }, []);

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      resetModal();
      onClose();
    }
  }, [isProcessing, resetModal, onClose]);

  // 학생 선택/해제
  const handleStudentToggle = useCallback((studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  }, []);

  // 문제 선택/해제
  const handleProblemToggle = useCallback((problemId: string) => {
    setSelectedProblems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(problemId)) {
        newSet.delete(problemId);
      } else {
        newSet.add(problemId);
      }
      return newSet;
    });
  }, []);

  // 전체 선택/해제
  const handleSelectAllStudents = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(eligibleSubmissions.map(s => s.studentId)));
    } else {
      setSelectedStudents(new Set());
    }
  }, [eligibleSubmissions]);

  const handleSelectAllProblems = useCallback((checked: boolean) => {
    const problemSet = selectedOperation === 'auto-grade' ? autoGradableProblems : problems;
    if (checked) {
      setSelectedProblems(new Set(problemSet.map(p => p.id).filter(Boolean) as string[]));
    } else {
      setSelectedProblems(new Set());
    }
  }, [selectedOperation, autoGradableProblems, problems]);

  // 자동 채점 로직 (TeacherGradingInterface에서 가져온 것과 동일)
  const performAutoGrading = useCallback((submission: StudentSubmission, problem: ProblemData) => {
    if (!problem.id) return { earnedPoints: 0, isCorrect: false };

    const studentAnswer = submission.answers[problem.id];
    let isCorrect = false;
    let earnedPoints = 0;

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

      default:
        earnedPoints = 0;
        isCorrect = false;
    }

    return { earnedPoints, isCorrect };
  }, []);

  // 일괄 작업 실행
  const handleExecuteBulkOperation = useCallback(async () => {
    if (selectedStudents.size === 0 || selectedProblems.size === 0) return;

    setIsProcessing(true);
    setCurrentStep('processing');

    const results: BulkGradingResult[] = [];
    
    // 선택된 학생들에 대해 처리
    for (const studentId of selectedStudents) {
      const submission = eligibleSubmissions.find(s => s.studentId === studentId);
      if (!submission) continue;

      const result: BulkGradingResult = {
        studentId,
        studentName: submission.studentName,
        problemResults: [],
        totalScore: 0,
        maxScore: 0,
        processingStatus: 'processing',
      };

      try {
        // 선택된 문제들에 대해 처리
        for (const problemId of selectedProblems) {
          const problem = problems.find(p => p.id === problemId);
          if (!problem || !problem.id) continue;

          let earnedPoints = 0;
          let isCorrect = false;
          let processingStatus: 'pending' | 'success' | 'error' = 'pending';

          try {
            switch (selectedOperation) {
              case 'auto-grade':
                const gradingResult = performAutoGrading(submission, problem);
                earnedPoints = gradingResult.earnedPoints;
                isCorrect = gradingResult.isCorrect;
                processingStatus = 'success';
                break;

              case 'set-score':
                earnedPoints = bulkScore;
                isCorrect = earnedPoints === problem.points;
                processingStatus = 'success';
                break;

              case 'add-feedback':
                // 피드백 추가는 점수에 영향 없음
                earnedPoints = 0;
                isCorrect = false;
                processingStatus = 'success';
                break;

              case 'update-status':
                // 상태 업데이트는 점수에 영향 없음
                earnedPoints = 0;
                isCorrect = false;
                processingStatus = 'success';
                break;
            }
          } catch (error) {
            processingStatus = 'error';
          }

          result.problemResults.push({
            problemId: problem.id,
            earnedPoints,
            maxPoints: problem.points,
            isCorrect,
            processingStatus,
            errorMessage: processingStatus === 'error' ? '채점 중 오류 발생' : undefined,
          });

          result.totalScore += earnedPoints;
          result.maxScore += problem.points;
        }

        result.processingStatus = 'completed';
      } catch (error) {
        result.processingStatus = 'failed';
      }

      results.push(result);
      setProcessingResults([...results]); // 실시간 업데이트
    }

    setIsProcessing(false);
    setCurrentStep('results');
  }, [
    selectedStudents, 
    selectedProblems, 
    eligibleSubmissions, 
    problems, 
    selectedOperation, 
    bulkScore, 
    performAutoGrading
  ]);

  // 결과 저장
  const handleSaveResults = useCallback(async () => {
    try {
      await onBulkGrade(processingResults);
      handleClose();
    } catch (error) {
      console.error('일괄 채점 저장 실패:', error);
    }
  }, [processingResults, onBulkGrade, handleClose]);

  const renderSelectionStep = () => (
    <div className="space-y-6">
      {/* 작업 유형 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>작업 유형 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedOperation === 'auto-grade'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-border-primary hover:bg-surface-secondary'
              }`}
              onClick={() => setSelectedOperation('auto-grade')}
            >
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-medium">자동 채점</div>
              <div className="text-sm text-text-secondary">
                객관식, 단답형 등 자동 채점 가능한 문제들을 일괄 처리
              </div>
            </button>
            
            <button
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedOperation === 'set-score'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-border-primary hover:bg-surface-secondary'
              }`}
              onClick={() => setSelectedOperation('set-score')}
            >
              <div className="text-2xl mb-2">💯</div>
              <div className="font-medium">점수 일괄 설정</div>
              <div className="text-sm text-text-secondary">
                선택된 문제들에 동일한 점수를 일괄 부여
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 학생 선택 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>학생 선택 ({selectedStudents.size}명)</CardTitle>
            <Checkbox
              checked={selectedStudents.size === eligibleSubmissions.length && eligibleSubmissions.length > 0}
              onCheckedChange={handleSelectAllStudents}
            >
              전체 선택
            </Checkbox>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {eligibleSubmissions.map((submission) => (
              <div
                key={submission.studentId}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedStudents.has(submission.studentId)}
                    onCheckedChange={() => handleStudentToggle(submission.studentId)}
                  />
                  <div>
                    <div className="font-medium">{submission.studentName}</div>
                    <div className="text-sm text-text-secondary">
                      {submission.submittedAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Badge variant="outline">대기중</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 문제 선택 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              문제 선택 ({selectedProblems.size}개)
              {selectedOperation === 'auto-grade' && (
                <Badge variant="info" size="sm" className="ml-2">
                  자동채점 가능만 표시
                </Badge>
              )}
            </CardTitle>
            <Checkbox
              checked={selectedProblems.size === (selectedOperation === 'auto-grade' ? autoGradableProblems : problems).length}
              onCheckedChange={handleSelectAllProblems}
            >
              전체 선택
            </Checkbox>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(selectedOperation === 'auto-grade' ? autoGradableProblems : problems).map((problem, index) => {
              if (!problem.id) return null;
              return (
                <div
                  key={problem.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedProblems.has(problem.id)}
                      onCheckedChange={() => handleProblemToggle(problem.id)}
                    />
                    <div>
                      <div className="font-medium">
                        문제 {index + 1}: {problem.title}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {problem.type} • {problem.points}점
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {problem.type === 'multiple_choice' ? '객관식' :
                     problem.type === 'short_answer' ? '단답형' :
                     problem.type === 'true_false' ? 'OX형' :
                     problem.type === 'long_answer' ? '서술형' :
                     problem.type === 'matching' ? '매칭형' :
                     problem.type === 'fill_blank' ? '빈칸형' :
                     problem.type === 'ordering' ? '순서형' : problem.type}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleClose}>
          취소
        </Button>
        <Button
          onClick={() => setCurrentStep('configure')}
          disabled={selectedStudents.size === 0 || selectedProblems.size === 0}
        >
          다음 단계
        </Button>
      </div>
    </div>
  );

  const renderConfigureStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>작업 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              선택 요약
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <div>• 대상 학생: {selectedStudents.size}명</div>
              <div>• 대상 문제: {selectedProblems.size}개</div>
              <div>• 작업 유형: {
                selectedOperation === 'auto-grade' ? '자동 채점' :
                selectedOperation === 'set-score' ? '점수 일괄 설정' :
                selectedOperation === 'add-feedback' ? '피드백 추가' : '상태 변경'
              }</div>
            </div>
          </div>

          {selectedOperation === 'set-score' && (
            <div>
              <label className="text-sm font-medium text-text-primary block mb-2">
                설정할 점수
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={bulkScore}
                onChange={(e) => setBulkScore(parseInt(e.target.value) || 0)}
                placeholder="점수 입력"
              />
              <p className="text-xs text-text-secondary mt-1">
                모든 선택된 문제에 동일한 점수가 부여됩니다.
              </p>
            </div>
          )}

          {selectedOperation === 'add-feedback' && (
            <div>
              <label className="text-sm font-medium text-text-primary block mb-2">
                추가할 피드백
              </label>
              <Textarea
                value={bulkFeedback}
                onChange={(e) => setBulkFeedback(e.target.value)}
                placeholder="학생들에게 공통으로 전달할 피드백을 입력하세요..."
                className="min-h-[100px]"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('select')}>
          이전
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button onClick={handleExecuteBulkOperation}>
            작업 실행
          </Button>
        </div>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="space-y-6 text-center">
      <div className="text-4xl mb-4">⚡</div>
      <h3 className="text-xl font-semibold">일괄 작업 진행 중...</h3>
      <Progress value={(processingResults.length / selectedStudents.size) * 100} className="w-full" />
      <p className="text-text-secondary">
        {processingResults.length} / {selectedStudents.size} 명 처리 완료
      </p>
    </div>
  );

  const renderResultsStep = () => {
    const successCount = processingResults.filter(r => r.processingStatus === 'completed').length;
    const failureCount = processingResults.filter(r => r.processingStatus === 'failed').length;

    return (
      <div className="space-y-6">
        {/* 결과 요약 */}
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="text-center py-6">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
              일괄 작업 완료
            </h3>
            <div className="text-green-700 dark:text-green-300 space-y-1">
              <div>성공: {successCount}명</div>
              {failureCount > 0 && <div>실패: {failureCount}명</div>}
            </div>
          </CardContent>
        </Card>

        {/* 상세 결과 */}
        <Card>
          <CardHeader>
            <CardTitle>처리 결과 상세</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {processingResults.map((result) => (
                <div
                  key={result.studentId}
                  className={`p-4 rounded-lg border ${
                    result.processingStatus === 'completed'
                      ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-300 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">{result.studentName}</div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={result.processingStatus === 'completed' ? 'success' : 'error'}
                        size="sm"
                      >
                        {result.processingStatus === 'completed' ? '성공' : '실패'}
                      </Badge>
                      {result.totalScore > 0 && (
                        <Badge variant="outline" size="sm">
                          {result.totalScore}/{result.maxScore}점
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-text-secondary">
                    처리된 문제: {result.problemResults.length}개 • 
                    성공: {result.problemResults.filter(p => p.processingStatus === 'success').length}개
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              setCurrentStep('select');
              setProcessingResults([]);
            }}
          >
            다시 실행
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              닫기
            </Button>
            <Button onClick={handleSaveResults}>
              결과 저장
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="일괄 채점"
      size="lg"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        {currentStep === 'select' && renderSelectionStep()}
        {currentStep === 'configure' && renderConfigureStep()}
        {currentStep === 'processing' && renderProcessingStep()}
        {currentStep === 'results' && renderResultsStep()}
      </div>
    </Modal>
  );
}