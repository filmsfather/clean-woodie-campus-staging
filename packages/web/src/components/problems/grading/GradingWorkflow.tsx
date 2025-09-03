import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Progress } from '../../ui/Progress';
import { Modal } from '../../ui/Modal';
import { TeacherGradingInterface } from './TeacherGradingInterface';
import { BulkGradingInterface } from './BulkGradingInterface';
import { ProblemData } from '../editor/ProblemEditor';
import { GradingResult } from '../results/GradingResults';

interface StudentSubmission {
  studentId: string;
  studentName: string;
  classId?: string;
  className?: string;
  submittedAt: Date;
  answers: { [problemId: string]: any };
  timeSpent: { [problemId: string]: number };
  isAutoGraded: boolean;
  gradingResults?: GradingResult[];
  totalScore?: number;
  maxScore: number;
  status: 'pending' | 'grading' | 'completed' | 'reviewed';
  priority: 'high' | 'medium' | 'low';
}

interface AssignmentInfo {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  problems: ProblemData[];
  totalPoints: number;
  submissionCount: number;
  gradedCount: number;
}

interface GradingWorkflowProps {
  assignment: AssignmentInfo;
  submissions: StudentSubmission[];
  onUpdateSubmission: (submission: StudentSubmission) => Promise<void>;
  onBulkGrade: (studentIds: string[], results: any[]) => Promise<void>;
  onPublishGrades: (assignmentId: string) => Promise<void>;
  onExportGrades: (assignmentId: string, format: 'csv' | 'excel' | 'pdf') => Promise<void>;
  className?: string;
}

type WorkflowView = 'overview' | 'individual' | 'bulk' | 'review' | 'publish';

export const GradingWorkflow: React.FC<GradingWorkflowProps> = ({
  assignment,
  submissions,
  onUpdateSubmission,
  onBulkGrade,
  onPublishGrades,
  onExportGrades,
  className = ''
}) => {
  const [currentView, setCurrentView] = useState<WorkflowView>('overview');
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // 통계 계산
  const stats = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter(s => s.status === 'pending').length;
    const grading = submissions.filter(s => s.status === 'grading').length;
    const completed = submissions.filter(s => s.status === 'completed').length;
    const reviewed = submissions.filter(s => s.status === 'reviewed').length;
    const avgScore = submissions
      .filter(s => s.totalScore !== undefined)
      .reduce((sum, s) => sum + (s.totalScore || 0), 0) / Math.max(completed + reviewed, 1);

    return {
      total,
      pending,
      grading,
      completed,
      reviewed,
      avgScore: Math.round(avgScore),
      progressPercent: Math.round((completed + reviewed) / Math.max(total, 1) * 100)
    };
  }, [submissions]);

  // 우선순위별 제출물 분류
  const prioritySubmissions = useMemo(() => {
    const high = submissions.filter(s => s.priority === 'high' && s.status === 'pending');
    const medium = submissions.filter(s => s.priority === 'medium' && s.status === 'pending');
    const low = submissions.filter(s => s.priority === 'low' && s.status === 'pending');
    
    return { high, medium, low };
  }, [submissions]);

  // 개별 채점 핸들러
  const handleGradeSubmission = useCallback(async (studentId: string, grades: GradingResult[]) => {
    const submission = submissions.find(s => s.studentId === studentId);
    if (!submission) return;

    const totalScore = grades.reduce((sum, grade) => sum + grade.earnedPoints, 0);
    const updatedSubmission = {
      ...submission,
      gradingResults: grades,
      totalScore,
      status: 'completed' as const,
      isAutoGraded: false
    };

    await onUpdateSubmission(updatedSubmission);
  }, [submissions, onUpdateSubmission]);

  // 피드백 저장 핸들러
  const handleSaveFeedback = useCallback(async (studentId: string, problemId: string, feedback: string) => {
    const submission = submissions.find(s => s.studentId === studentId);
    if (!submission) return;

    const updatedGradingResults = submission.gradingResults?.map(result => 
      result.problemId === problemId 
        ? { ...result, feedback }
        : result
    ) || [];

    const updatedSubmission = {
      ...submission,
      gradingResults: updatedGradingResults
    };

    await onUpdateSubmission(updatedSubmission);
  }, [submissions, onUpdateSubmission]);

  // 완료 표시 핸들러
  const handleMarkComplete = useCallback(async (studentId: string) => {
    const submission = submissions.find(s => s.studentId === studentId);
    if (!submission) return;

    const updatedSubmission = {
      ...submission,
      status: 'reviewed' as const
    };

    await onUpdateSubmission(updatedSubmission);
  }, [submissions, onUpdateSubmission]);

  // 개요 화면 렌더링
  const renderOverview = () => (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{assignment.title}</h2>
          <p className="text-text-secondary">
            총 {stats.total}명 제출 • {stats.progressPercent}% 완료 • 평균 {stats.avgScore}점
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsBulkModalOpen(true)}
            disabled={stats.pending === 0}
          >
            일괄 채점 ({stats.pending}개)
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsPublishModalOpen(true)}
            disabled={stats.completed + stats.reviewed === 0}
          >
            성적 발표
          </Button>
        </div>
      </div>

      {/* 진행률 */}
      <Card>
        <CardHeader>
          <CardTitle>채점 진행률</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={stats.progressPercent} className="mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
              <div className="text-sm text-text-secondary">총 제출</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-text-secondary">대기중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.grading}</div>
              <div className="text-sm text-text-secondary">채점중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-text-secondary">완료</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.reviewed}</div>
              <div className="text-sm text-text-secondary">검토완료</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 우선순위별 제출물 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 높은 우선순위 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="error" size="sm">높음</Badge>
              <span>우선 채점 ({prioritySubmissions.high.length}개)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {prioritySubmissions.high.map(submission => (
                <div key={submission.studentId} 
                     className="p-3 bg-surface-secondary rounded cursor-pointer hover:bg-surface-tertiary"
                     onClick={() => {
                       setSelectedSubmission(submission);
                       setCurrentView('individual');
                     }}>
                  <div className="font-medium text-text-primary">{submission.studentName}</div>
                  <div className="text-sm text-text-secondary">
                    {submission.className} • {new Date(submission.submittedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 보통 우선순위 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="warning" size="sm">보통</Badge>
              <span>일반 채점 ({prioritySubmissions.medium.length}개)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {prioritySubmissions.medium.slice(0, 5).map(submission => (
                <div key={submission.studentId} 
                     className="p-3 bg-surface-secondary rounded cursor-pointer hover:bg-surface-tertiary"
                     onClick={() => {
                       setSelectedSubmission(submission);
                       setCurrentView('individual');
                     }}>
                  <div className="font-medium text-text-primary">{submission.studentName}</div>
                  <div className="text-sm text-text-secondary">
                    {submission.className} • {new Date(submission.submittedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {prioritySubmissions.medium.length > 5 && (
                <div className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentView('individual')}>
                    +{prioritySubmissions.medium.length - 5}개 더 보기
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 낮은 우선순위 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="success" size="sm">낮음</Badge>
              <span>나중 채점 ({prioritySubmissions.low.length}개)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {prioritySubmissions.low.slice(0, 3).map(submission => (
                <div key={submission.studentId} 
                     className="p-3 bg-surface-secondary rounded cursor-pointer hover:bg-surface-tertiary"
                     onClick={() => {
                       setSelectedSubmission(submission);
                       setCurrentView('individual');
                     }}>
                  <div className="font-medium text-text-primary">{submission.studentName}</div>
                  <div className="text-sm text-text-secondary">
                    {submission.className} • {new Date(submission.submittedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {prioritySubmissions.low.length > 3 && (
                <div className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentView('individual')}>
                    +{prioritySubmissions.low.length - 3}개 더 보기
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 액션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentView('individual')}
              className="h-16"
            >
              <div className="text-center">
                <div className="text-lg font-bold">개별 채점</div>
                <div className="text-sm">학생별 상세 채점</div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsBulkModalOpen(true)}
              className="h-16"
              disabled={stats.pending === 0}
            >
              <div className="text-center">
                <div className="text-lg font-bold">일괄 채점</div>
                <div className="text-sm">자동/대량 채점</div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentView('review')}
              className="h-16"
              disabled={stats.completed === 0}
            >
              <div className="text-center">
                <div className="text-lg font-bold">검토</div>
                <div className="text-sm">채점 결과 검토</div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => onExportGrades(assignment.id, 'excel')}
              className="h-16"
              disabled={stats.completed + stats.reviewed === 0}
            >
              <div className="text-center">
                <div className="text-lg font-bold">내보내기</div>
                <div className="text-sm">성적표 다운로드</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 네비게이션 탭
  const renderNavigation = () => (
    <div className="flex items-center space-x-1 mb-6">
      <Button
        variant={currentView === 'overview' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentView('overview')}
      >
        개요
      </Button>
      <Button
        variant={currentView === 'individual' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentView('individual')}
      >
        개별 채점
      </Button>
      <Button
        variant={currentView === 'review' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentView('review')}
        disabled={stats.completed === 0}
      >
        검토
      </Button>
      <Button
        variant={currentView === 'publish' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentView('publish')}
        disabled={stats.completed + stats.reviewed === 0}
      >
        발표
      </Button>
    </div>
  );

  return (
    <div className={`grading-workflow ${className}`}>
      {renderNavigation()}
      
      {/* 메인 컨텐츠 */}
      {currentView === 'overview' && renderOverview()}
      
      {currentView === 'individual' && (
        <TeacherGradingInterface
          submissions={submissions}
          problems={assignment.problems}
          onGradeSubmission={handleGradeSubmission}
          onSaveFeedback={handleSaveFeedback}
          onMarkComplete={handleMarkComplete}
          allowBulkOperations={true}
        />
      )}
      
      {currentView === 'review' && (
        <div>
          <h3 className="text-xl font-bold mb-4">채점 결과 검토</h3>
          {/* 검토 인터페이스 구현 필요 */}
        </div>
      )}
      
      {currentView === 'publish' && (
        <div>
          <h3 className="text-xl font-bold mb-4">성적 발표</h3>
          {/* 발표 인터페이스 구현 필요 */}
        </div>
      )}

      {/* 일괄 채점 모달 */}
      {isBulkModalOpen && (
        <BulkGradingInterface
          submissions={submissions.filter(s => s.status === 'pending')}
          problems={assignment.problems}
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onBulkGrade={async (results) => {
            const studentIds = results.map(r => r.studentId);
            await onBulkGrade(studentIds, results);
            setIsBulkModalOpen(false);
          }}
        />
      )}

      {/* 성적 발표 모달 */}
      {isPublishModalOpen && (
        <Modal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          title="성적 발표"
          size="medium"
        >
          <div className="space-y-4">
            <p>채점이 완료된 {stats.completed + stats.reviewed}개의 제출물을 학생들에게 공개하시겠습니까?</p>
            
            <div className="bg-surface-secondary p-4 rounded">
              <h4 className="font-medium mb-2">발표 예정 성적</h4>
              <div className="text-sm text-text-secondary">
                • 평균 점수: {stats.avgScore}점/{assignment.totalPoints}점
                • 완료된 채점: {stats.completed + stats.reviewed}개
                • 미완료: {stats.pending + stats.grading}개
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setIsPublishModalOpen(false)}>
                취소
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  await onPublishGrades(assignment.id);
                  setIsPublishModalOpen(false);
                }}
              >
                발표하기
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default GradingWorkflow;