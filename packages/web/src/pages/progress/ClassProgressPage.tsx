import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { Button, Card, Badge, Select, Avatar } from '../../components/ui';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Application Layer DTO 타입 직접 사용 (DTO-First 원칙)
interface StudyStreakDto {
  id: string;
  studentId: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date;
  isActive: boolean;
  isAtRisk: boolean;
  isPersonalRecord: boolean;
}

interface StatisticsDto {
  id: string;
  studentId: string;
  problemSetId: string;
  totalProblems: number;
  completedProblems: number;
  correctAnswers: number;
  completionRate: number;
  accuracyRate: number;
  totalTimeSpent: number;
  efficiencyScore: number;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface ClassProgressDto {
  classId: string;
  className?: string;
  teacherId: string;
  streaks: StudyStreakDto[];
  statistics: StatisticsDto[];
  classMetrics: {
    totalStudents: number;
    activeStreakCount: number;
    averageCurrentStreak: number;
    averageCompletionRate: number;
    averageAccuracyRate: number;
    studentsWithStreak: number;
    studiedToday: number;
    atRiskStudents: number;
  };
}

interface GetClassProgressResponse {
  classProgress: ClassProgressDto;
  insights: Array<{
    type: 'high_performer' | 'needs_attention' | 'streak_leader' | 'improvement_needed';
    studentId: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    suggestions?: string[];
  }>;
  summary: {
    totalStudents: number;
    engagementLevel: 'high' | 'medium' | 'low';
    averagePerformance: {
      completionRate: number;
      accuracyRate: number;
      currentStreak: number;
    };
    recommendations: Array<{
      action: string;
      reason: string;
      targetStudents?: string[];
    }>;
  };
}

interface ClassProgressPageProps {
  classId?: string;
}

/**
 * GetClassProgressUseCase → ClassProgressPage
 * 클래스 진도 현황 및 분석 대시보드 UI 표면
 */
export const ClassProgressPage: React.FC<ClassProgressPageProps> = ({ classId }) => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState(classId || 'class-1');
  const [sortBy, setSortBy] = useState<'name' | 'streak' | 'completion' | 'accuracy'>('completion');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // GetClassProgressUseCase 호출
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['classProgress', selectedClass, sortBy, sortOrder],
    queryFn: async (): Promise<GetClassProgressResponse> => {
      // TODO: 실제 GetClassProgressUseCase 연동
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock 데이터 (Application DTO 형태)
      const mockStreaks: StudyStreakDto[] = [
        {
          id: 'streak-1',
          studentId: 'student-1',
          currentStreak: 15,
          longestStreak: 28,
          lastStudyDate: new Date(),
          isActive: true,
          isAtRisk: false,
          isPersonalRecord: false
        },
        {
          id: 'streak-2',
          studentId: 'student-2',
          currentStreak: 3,
          longestStreak: 12,
          lastStudyDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          isActive: false,
          isAtRisk: true,
          isPersonalRecord: false
        },
        {
          id: 'streak-3',
          studentId: 'student-3',
          currentStreak: 8,
          longestStreak: 15,
          lastStudyDate: new Date(),
          isActive: true,
          isAtRisk: false,
          isPersonalRecord: false
        }
      ];

      const mockStatistics: StatisticsDto[] = [
        {
          id: 'stats-1',
          studentId: 'student-1',
          problemSetId: 'set-1',
          totalProblems: 50,
          completedProblems: 45,
          correctAnswers: 42,
          completionRate: 0.9,
          accuracyRate: 0.93,
          totalTimeSpent: 3600000,
          efficiencyScore: 8.7,
          performanceGrade: 'A'
        },
        {
          id: 'stats-2',
          studentId: 'student-2',
          problemSetId: 'set-1',
          totalProblems: 50,
          completedProblems: 20,
          correctAnswers: 12,
          completionRate: 0.4,
          accuracyRate: 0.6,
          totalTimeSpent: 2400000,
          efficiencyScore: 4.2,
          performanceGrade: 'D'
        },
        {
          id: 'stats-3',
          studentId: 'student-3',
          problemSetId: 'set-1',
          totalProblems: 50,
          completedProblems: 35,
          correctAnswers: 30,
          completionRate: 0.7,
          accuracyRate: 0.86,
          totalTimeSpent: 2800000,
          efficiencyScore: 7.1,
          performanceGrade: 'B'
        }
      ];

      const classProgress: ClassProgressDto = {
        classId: selectedClass,
        className: '중학교 1학년 A반',
        teacherId: user?.id || 'teacher-1',
        streaks: mockStreaks,
        statistics: mockStatistics,
        classMetrics: {
          totalStudents: 3,
          activeStreakCount: 2,
          averageCurrentStreak: 8.7,
          averageCompletionRate: 0.67,
          averageAccuracyRate: 0.8,
          studentsWithStreak: 2,
          studiedToday: 2,
          atRiskStudents: 1
        }
      };

      const insights = [
        {
          type: 'high_performer' as const,
          studentId: 'student-1',
          message: '우수한 성과를 보이고 있습니다 (완료율 90%, 정답률 93%)',
          priority: 'low' as const,
          suggestions: ['추가 도전 문제 제공', '멘토 역할 부여']
        },
        {
          type: 'needs_attention' as const,
          studentId: 'student-2',
          message: '학습에 어려움을 겪고 있습니다 (완료율 40%, 정답률 60%)',
          priority: 'high' as const,
          suggestions: ['개별 지도 필요', '기초 문제부터 재시작']
        },
        {
          type: 'streak_leader' as const,
          studentId: 'student-1',
          message: '15일 연속 학습 중! 훌륭한 학습 습관입니다',
          priority: 'low' as const,
          suggestions: ['클래스 내 롤모델로 소개']
        }
      ];

      const summary = {
        totalStudents: 3,
        engagementLevel: 'medium' as const,
        averagePerformance: {
          completionRate: 0.67,
          accuracyRate: 0.8,
          currentStreak: 8.7
        },
        recommendations: [
          {
            action: '학습 부진 학생 개별 지도',
            reason: '1명의 학생이 학습에 어려움을 겪고 있습니다',
            targetStudents: ['student-2']
          },
          {
            action: '스트릭 유지 동기부여',
            reason: '1명의 학생이 스트릭이 끊어질 위험에 있습니다'
          }
        ]
      };

      return { classProgress, insights, summary };
    },
    enabled: !!user?.id
  });

  if (!user || user.role !== 'teacher') {
    return <div>교사 권한이 필요합니다.</div>;
  }

  const handleSortChange = (field: typeof sortBy, order: typeof sortOrder) => {
    setSortBy(field);
    setSortOrder(order);
  };

  const getEngagementColor = (level: string): string => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A': return 'text-green-600 font-bold';
      case 'B': return 'text-blue-600 font-semibold';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600 font-semibold';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card className="p-6 text-center">
          <p className="text-red-600">클래스 진도를 불러올 수 없습니다.</p>
          <Button onClick={() => refetch()} className="mt-4">
            다시 시도
          </Button>
        </Card>
      </div>
    );
  }

  const { classProgress, insights, summary } = data;

  // 차트 데이터 준비
  const studentData = classProgress.statistics.map(stat => {
    const streak = classProgress.streaks.find(s => s.studentId === stat.studentId);
    return {
      studentId: stat.studentId,
      name: `학생 ${stat.studentId.slice(-1)}`,
      completionRate: Math.round(stat.completionRate * 100),
      accuracyRate: Math.round(stat.accuracyRate * 100),
      currentStreak: streak?.currentStreak || 0,
      grade: stat.performanceGrade,
      efficiencyScore: stat.efficiencyScore
    };
  });

  const performanceDistribution = [
    { grade: 'A', count: studentData.filter(s => s.grade === 'A').length },
    { grade: 'B', count: studentData.filter(s => s.grade === 'B').length },
    { grade: 'C', count: studentData.filter(s => s.grade === 'C').length },
    { grade: 'D', count: studentData.filter(s => s.grade === 'D').length },
    { grade: 'F', count: studentData.filter(s => s.grade === 'F').length }
  ].filter(item => item.count > 0);

  const COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#F97316', '#EF4444'];

  return (
    <FeatureGuard feature="classProgress">
      <div className="max-w-6xl mx-auto p-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">클래스 진도 현황</h1>
            <p className="text-gray-600">{classProgress.className || '클래스 이름'}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="class-1">중학교 1학년 A반</option>
              <option value="class-2">중학교 1학년 B반</option>
              <option value="class-3">중학교 2학년 A반</option>
            </Select>

            <div className="flex items-center space-x-2">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="completion">완료율</option>
                <option value="accuracy">정답률</option>
                <option value="streak">스트릭</option>
                <option value="name">이름</option>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </Button>
            </div>
          </div>
        </div>

        {/* 전체 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-3xl font-bold text-blue-600">{summary.totalStudents}</div>
            <div className="text-sm text-gray-600">총 학생 수</div>
            <div className={`text-xs mt-1 ${getEngagementColor(summary.engagementLevel)}`}>
              참여도: {summary.engagementLevel === 'high' ? '높음' : 
                     summary.engagementLevel === 'medium' ? '보통' : '낮음'}
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-3xl font-bold text-green-600">
              {Math.round(summary.averagePerformance.completionRate * 100)}%
            </div>
            <div className="text-sm text-gray-600">평균 완료율</div>
            <div className="text-xs text-gray-500 mt-1">
              활발한 학습: {classProgress.classMetrics.studiedToday}명
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-3xl font-bold text-purple-600">
              {Math.round(summary.averagePerformance.accuracyRate * 100)}%
            </div>
            <div className="text-sm text-gray-600">평균 정답률</div>
            <div className="text-xs text-gray-500 mt-1">
              클래스 전체 성과
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-3xl font-bold text-orange-600">
              {Math.round(summary.averagePerformance.currentStreak)}일
            </div>
            <div className="text-sm text-gray-600">평균 스트릭</div>
            {classProgress.classMetrics.atRiskStudents > 0 && (
              <div className="text-xs text-red-600 mt-1">
                위험: {classProgress.classMetrics.atRiskStudents}명
              </div>
            )}
          </Card>
        </div>

        {/* 차트 및 인사이트 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* 학생별 성과 차트 */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-lg font-semibold mb-4">학생별 성과 비교</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completionRate" fill="#3B82F6" name="완료율 (%)" />
                <Bar dataKey="accuracyRate" fill="#10B981" name="정답률 (%)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* 성적 분포 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">성적 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ grade, count }) => `${grade}: ${count}명`}
                >
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* 학생별 상세 정보 */}
        <Card className="mb-8 p-6">
          <h3 className="text-lg font-semibold mb-4">학생별 상세 현황</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">학생</th>
                  <th className="text-left py-3 px-4">완료율</th>
                  <th className="text-left py-3 px-4">정답률</th>
                  <th className="text-left py-3 px-4">현재 스트릭</th>
                  <th className="text-left py-3 px-4">성적</th>
                  <th className="text-left py-3 px-4">효율 점수</th>
                  <th className="text-left py-3 px-4">상태</th>
                </tr>
              </thead>
              <tbody>
                {studentData.map((student) => {
                  const streak = classProgress.streaks.find(s => s.studentId === student.studentId);
                  return (
                    <tr key={student.studentId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Avatar name={student.name} size="sm" />
                          <span>{student.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{student.completionRate}%</td>
                      <td className="py-3 px-4">{student.accuracyRate}%</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <span>{student.currentStreak}일</span>
                          {streak?.isAtRisk && (
                            <Badge className="bg-red-100 text-red-800 text-xs">위험</Badge>
                          )}
                        </div>
                      </td>
                      <td className={`py-3 px-4 ${getGradeColor(student.grade)}`}>
                        {student.grade}
                      </td>
                      <td className="py-3 px-4">{student.efficiencyScore.toFixed(1)}</td>
                      <td className="py-3 px-4">
                        {streak?.isActive ? (
                          <Badge className="bg-green-100 text-green-800">활발</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">비활성</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 인사이트 및 추천사항 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 인사이트 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">학습 인사이트</h3>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(insight.priority)}>
                        {insight.priority === 'high' ? '높음' : 
                         insight.priority === 'medium' ? '보통' : '낮음'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        학생 {insight.studentId.slice(-1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm mb-2">{insight.message}</p>
                  {insight.suggestions && insight.suggestions.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <strong>제안:</strong> {insight.suggestions.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* 추천사항 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">개선 추천사항</h3>
            <div className="space-y-4">
              {summary.recommendations.map((rec, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">{rec.action}</h4>
                  <p className="text-sm text-blue-700 mb-2">{rec.reason}</p>
                  {rec.targetStudents && (
                    <div className="text-xs text-blue-600">
                      대상 학생: {rec.targetStudents.length}명
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </FeatureGuard>
  );
};