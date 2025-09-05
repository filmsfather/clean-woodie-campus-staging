import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Progress } from '../../ui/Progress';

interface StudentData {
  id: string;
  name: string;
  email: string;
  classId: string;
  className: string;
  enrolledAt: string;
  statistics: {
    totalProblemsAssigned: number;
    totalProblemsCompleted: number;
    totalCorrectAnswers: number;
    averageScore: number;
    totalStudyTime: number; // 분 단위
    currentStreak: number;
    longestStreak: number;
    retryRate: number;
  };
  performanceTrend: Array<{
    date: string;
    averageScore: number;
    problemsCompleted: number;
    studyTime: number;
    streakDays: number;
  }>;
  subjectPerformance: Array<{
    subject: string;
    averageScore: number;
    problemsCompleted: number;
    timeSpent: number;
    strength: number; // 1-10
  }>;
  difficultyBreakdown: {
    easy: { completed: number; averageScore: number; timeSpent: number };
    medium: { completed: number; averageScore: number; timeSpent: number };
    hard: { completed: number; averageScore: number; timeSpent: number };
  };
  learningPatterns: {
    preferredTime: string; // '오전', '오후', '저녁'
    sessionDuration: number; // 평균 세션 시간 (분)
    weeklyActivity: Array<{
      day: string;
      activity: number;
    }>;
  };
  riskIndicators: {
    isAtRisk: boolean;
    riskFactors: string[];
    recommendations: string[];
  };
}

interface StudentPerformanceAnalysisProps {
  studentId?: string;
  students?: StudentData[];
  classId?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  className?: string;
  onBack?: () => void;
  onSelectStudent?: (studentId: string) => void;
}

const SUBJECT_COLORS = {
  '수학': '#0088FE',
  '국어': '#00C49F', 
  '영어': '#FFBB28',
  '과학': '#FF8042',
  '사회': '#8884D8',
  '기타': '#82ca9d'
};

export const StudentPerformanceAnalysis: React.FC<StudentPerformanceAnalysisProps> = ({
  studentId,
  students,
  classId,
  timeRange = 'month',
  className = '',
  onBack,
  onSelectStudent
}) => {
  const [data, setData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detail' | 'comparison'>('overview');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'progress' | 'risk'>('score');

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      try {
        // 실제 구현에서는 API 호출
        const mockData: StudentData[] = [
          {
            id: '1',
            name: '김민수',
            email: 'minsu@example.com',
            classId: 'class-1',
            className: '3학년 1반',
            enrolledAt: '2024-01-01',
            statistics: {
              totalProblemsAssigned: 50,
              totalProblemsCompleted: 45,
              totalCorrectAnswers: 40,
              averageScore: 88.9,
              totalStudyTime: 320,
              currentStreak: 7,
              longestStreak: 12,
              retryRate: 15
            },
            performanceTrend: [
              { date: '2024-01-01', averageScore: 85, problemsCompleted: 8, studyTime: 60, streakDays: 5 },
              { date: '2024-01-08', averageScore: 87, problemsCompleted: 12, studyTime: 75, streakDays: 7 },
              { date: '2024-01-15', averageScore: 90, problemsCompleted: 15, studyTime: 90, streakDays: 10 },
              { date: '2024-01-22', averageScore: 89, problemsCompleted: 10, studyTime: 65, streakDays: 7 }
            ],
            subjectPerformance: [
              { subject: '수학', averageScore: 92, problemsCompleted: 15, timeSpent: 120, strength: 9 },
              { subject: '국어', averageScore: 85, problemsCompleted: 12, timeSpent: 90, strength: 7 },
              { subject: '영어', averageScore: 90, problemsCompleted: 10, timeSpent: 80, strength: 8 },
              { subject: '과학', averageScore: 88, problemsCompleted: 8, timeSpent: 70, strength: 8 }
            ],
            difficultyBreakdown: {
              easy: { completed: 20, averageScore: 95, timeSpent: 80 },
              medium: { completed: 15, averageScore: 85, timeSpent: 120 },
              hard: { completed: 10, averageScore: 78, timeSpent: 150 }
            },
            learningPatterns: {
              preferredTime: '저녁',
              sessionDuration: 45,
              weeklyActivity: [
                { day: '월', activity: 8 },
                { day: '화', activity: 6 },
                { day: '수', activity: 9 },
                { day: '목', activity: 7 },
                { day: '금', activity: 5 },
                { day: '토', activity: 3 },
                { day: '일', activity: 2 }
              ]
            },
            riskIndicators: {
              isAtRisk: false,
              riskFactors: [],
              recommendations: ['계속해서 꾸준한 학습을 유지하세요', '어려운 문제에도 도전해보세요']
            }
          },
          {
            id: '2',
            name: '이지영',
            email: 'jiyoung@example.com',
            classId: 'class-1',
            className: '3학년 1반',
            enrolledAt: '2024-01-01',
            statistics: {
              totalProblemsAssigned: 50,
              totalProblemsCompleted: 35,
              totalCorrectAnswers: 25,
              averageScore: 71.4,
              totalStudyTime: 180,
              currentStreak: 2,
              longestStreak: 5,
              retryRate: 35
            },
            performanceTrend: [
              { date: '2024-01-01', averageScore: 75, problemsCompleted: 10, studyTime: 50, streakDays: 3 },
              { date: '2024-01-08', averageScore: 70, problemsCompleted: 8, studyTime: 40, streakDays: 2 },
              { date: '2024-01-15', averageScore: 68, problemsCompleted: 9, studyTime: 45, streakDays: 1 },
              { date: '2024-01-22', averageScore: 72, problemsCompleted: 8, studyTime: 35, streakDays: 2 }
            ],
            subjectPerformance: [
              { subject: '수학', averageScore: 65, problemsCompleted: 8, timeSpent: 60, strength: 5 },
              { subject: '국어', averageScore: 78, problemsCompleted: 12, timeSpent: 70, strength: 7 },
              { subject: '영어', averageScore: 70, problemsCompleted: 9, timeSpent: 50, strength: 6 },
              { subject: '과학', averageScore: 72, problemsCompleted: 6, timeSpent: 45, strength: 6 }
            ],
            difficultyBreakdown: {
              easy: { completed: 20, averageScore: 85, timeSpent: 60 },
              medium: { completed: 10, averageScore: 65, timeSpent: 80 },
              hard: { completed: 5, averageScore: 55, timeSpent: 90 }
            },
            learningPatterns: {
              preferredTime: '오후',
              sessionDuration: 25,
              weeklyActivity: [
                { day: '월', activity: 4 },
                { day: '화', activity: 6 },
                { day: '수', activity: 5 },
                { day: '목', activity: 4 },
                { day: '금', activity: 3 },
                { day: '토', activity: 2 },
                { day: '일', activity: 1 }
              ]
            },
            riskIndicators: {
              isAtRisk: true,
              riskFactors: ['낮은 완료율', '짧은 학습 세션', '어려운 문제 회피'],
              recommendations: [
                '기초 문제부터 차근차근 풀어보세요',
                '학습 시간을 늘려보세요',
                '어려운 문제도 포기하지 마세요'
              ]
            }
          },
          {
            id: '3',
            name: '박준호',
            email: 'junho@example.com',
            classId: 'class-1',
            className: '3학년 1반',
            enrolledAt: '2024-01-01',
            statistics: {
              totalProblemsAssigned: 50,
              totalProblemsCompleted: 48,
              totalCorrectAnswers: 42,
              averageScore: 87.5,
              totalStudyTime: 280,
              currentStreak: 14,
              longestStreak: 14,
              retryRate: 20
            },
            performanceTrend: [
              { date: '2024-01-01', averageScore: 82, problemsCompleted: 12, studyTime: 70, streakDays: 8 },
              { date: '2024-01-08', averageScore: 85, problemsCompleted: 14, studyTime: 75, streakDays: 12 },
              { date: '2024-01-15', averageScore: 90, problemsCompleted: 12, studyTime: 80, streakDays: 14 },
              { date: '2024-01-22', averageScore: 92, problemsCompleted: 10, studyTime: 65, streakDays: 14 }
            ],
            subjectPerformance: [
              { subject: '수학', averageScore: 95, problemsCompleted: 18, timeSpent: 100, strength: 10 },
              { subject: '국어', averageScore: 82, problemsCompleted: 12, timeSpent: 80, strength: 7 },
              { subject: '영어', averageScore: 88, problemsCompleted: 10, timeSpent: 70, strength: 8 },
              { subject: '과학', averageScore: 85, problemsCompleted: 8, timeSpent: 60, strength: 8 }
            ],
            difficultyBreakdown: {
              easy: { completed: 18, averageScore: 98, timeSpent: 45 },
              medium: { completed: 20, averageScore: 88, timeSpent: 90 },
              hard: { completed: 10, averageScore: 82, timeSpent: 120 }
            },
            learningPatterns: {
              preferredTime: '오전',
              sessionDuration: 60,
              weeklyActivity: [
                { day: '월', activity: 10 },
                { day: '화', activity: 8 },
                { day: '수', activity: 9 },
                { day: '목', activity: 8 },
                { day: '금', activity: 7 },
                { day: '토', activity: 4 },
                { day: '일', activity: 3 }
              ]
            },
            riskIndicators: {
              isAtRisk: false,
              riskFactors: [],
              recommendations: ['우수한 성과를 보이고 있습니다', '도전적인 문제들을 더 시도해보세요']
            }
          }
        ];

        if (studentId) {
          const student = mockData.find(s => s.id === studentId);
          setData(student ? [student] : []);
          setSelectedStudent(student || null);
          setViewMode('detail');
        } else if (students) {
          setData(students);
        } else {
          setData(mockData);
        }
      } catch (error) {
        console.error('학생 성과 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId, students, classId, timeRange]);

  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'score':
        return b.statistics.averageScore - a.statistics.averageScore;
      case 'progress':
        return (b.statistics.totalProblemsCompleted / b.statistics.totalProblemsAssigned) - 
               (a.statistics.totalProblemsCompleted / a.statistics.totalProblemsAssigned);
      case 'risk':
        return (a.riskIndicators.isAtRisk ? 1 : 0) - (b.riskIndicators.isAtRisk ? 1 : 0);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className={`student-performance-analysis loading ${className}`}>
        <div className="loading-spinner">학생 성과 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={`student-performance-analysis error ${className}`}>
        <div className="error-message">학생 데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  const renderOverviewMode = () => (
    <div className="space-y-6">
      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-2xl font-bold text-primary">{data.length}</div>
            <div className="text-sm text-text-secondary">총 학생 수</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-2xl font-bold text-success">
              {(data.reduce((sum, s) => sum + s.statistics.averageScore, 0) / data.length).toFixed(1)}점
            </div>
            <div className="text-sm text-text-secondary">평균 점수</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-2xl font-bold text-warning">
              {((data.reduce((sum, s) => sum + s.statistics.totalProblemsCompleted, 0) / 
                 data.reduce((sum, s) => sum + s.statistics.totalProblemsAssigned, 0)) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-text-secondary">평균 완료율</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-2xl font-bold text-error">
              {data.filter(s => s.riskIndicators.isAtRisk).length}
            </div>
            <div className="text-sm text-text-secondary">위험군 학생</div>
          </CardContent>
        </Card>
      </div>

      {/* 학급 성과 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle>학급 성과 트렌드</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data[0]?.performanceTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="averageScore" 
                stackId="1" 
                stroke="#8884d8" 
                fill="#8884d8"
                name="평균 점수"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 학생별 성과 분포 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>학생별 성과 분포</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant={sortBy === 'name' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('name')}
              >
                이름순
              </Button>
              <Button
                variant={sortBy === 'score' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('score')}
              >
                점수순
              </Button>
              <Button
                variant={sortBy === 'progress' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('progress')}
              >
                진도순
              </Button>
              <Button
                variant={sortBy === 'risk' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('risk')}
              >
                위험도순
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={sortedData}>
              <CartesianGrid />
              <XAxis 
                type="number" 
                dataKey="statistics.totalProblemsCompleted" 
                name="완료한 문제 수"
              />
              <YAxis 
                type="number" 
                dataKey="statistics.averageScore" 
                name="평균 점수"
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload as StudentData;
                    return (
                      <div className="bg-white p-3 border rounded shadow">
                        <p className="font-semibold">{data.name}</p>
                        <p>평균 점수: {data.statistics.averageScore.toFixed(1)}점</p>
                        <p>완료 문제: {data.statistics.totalProblemsCompleted}개</p>
                        <p>완료율: {((data.statistics.totalProblemsCompleted / data.statistics.totalProblemsAssigned) * 100).toFixed(1)}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                dataKey="statistics.averageScore" 
                fill={(entry: any) => entry.riskIndicators?.isAtRisk ? '#f87171' : '#0088FE'}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 학생 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>학생 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedData.map(student => (
              <div
                key={student.id}
                className={`p-4 border rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer ${
                  student.riskIndicators.isAtRisk ? 'border-red-200 bg-red-50 dark:bg-red-900/10' : 'border-border-primary'
                }`}
                onClick={() => {
                  setSelectedStudent(student);
                  setViewMode('detail');
                  onSelectStudent?.(student.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold">
                        {student.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-text-primary">{student.name}</h4>
                        {student.riskIndicators.isAtRisk && (
                          <Badge variant="error" size="sm">위험</Badge>
                        )}
                        <Badge variant="outline" size="sm">
                          {student.statistics.currentStreak}일 연속
                        </Badge>
                      </div>
                      <div className="text-sm text-text-secondary mt-1">
                        평균: {student.statistics.averageScore.toFixed(1)}점 • 
                        완료: {student.statistics.totalProblemsCompleted}/{student.statistics.totalProblemsAssigned} • 
                        학습시간: {Math.round(student.statistics.totalStudyTime / 60)}시간
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Progress 
                      value={(student.statistics.totalProblemsCompleted / student.statistics.totalProblemsAssigned) * 100}
                      className="w-20 h-2"
                      variant={student.riskIndicators.isAtRisk ? 'error' : 'default'}
                    />
                    <div className="text-xs text-text-tertiary mt-1">
                      {((student.statistics.totalProblemsCompleted / student.statistics.totalProblemsAssigned) * 100).toFixed(1)}% 완료
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDetailMode = () => {
    if (!selectedStudent) return null;

    return (
      <div className="space-y-6">
        {/* 학생 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{selectedStudent.name}</h2>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-text-secondary">{selectedStudent.className}</span>
              <span className="text-sm text-text-secondary">{selectedStudent.email}</span>
              {selectedStudent.riskIndicators.isAtRisk && (
                <Badge variant="error">위험군</Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" onClick={() => setViewMode('overview')}>
            ← 목록으로
          </Button>
        </div>

        {/* 학습 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="text-center py-4 space-y-1">
              <div className="text-xl font-bold text-success">
                {selectedStudent.statistics.averageScore.toFixed(1)}점
              </div>
              <div className="text-xs text-text-secondary">평균 점수</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4 space-y-1">
              <div className="text-xl font-bold text-primary">
                {selectedStudent.statistics.totalProblemsCompleted}/{selectedStudent.statistics.totalProblemsAssigned}
              </div>
              <div className="text-xs text-text-secondary">완료 문제</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4 space-y-1">
              <div className="text-xl font-bold text-warning">
                {selectedStudent.statistics.currentStreak}일
              </div>
              <div className="text-xs text-text-secondary">연속 학습</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4 space-y-1">
              <div className="text-xl font-bold text-info">
                {Math.round(selectedStudent.statistics.totalStudyTime / 60)}시간
              </div>
              <div className="text-xs text-text-secondary">총 학습시간</div>
            </CardContent>
          </Card>
        </div>

        {/* 성과 트렌드 */}
        <Card>
          <CardHeader>
            <CardTitle>학습 성과 트렌드</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={selectedStudent.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="averageScore" fill="#8884d8" stroke="#8884d8" name="평균 점수" />
                <Bar yAxisId="right" dataKey="problemsCompleted" fill="#82ca9d" name="완료 문제 수" />
                <Line yAxisId="left" type="monotone" dataKey="streakDays" stroke="#ffc658" strokeWidth={2} name="연속 학습 일수" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 과목별 성과 */}
        <Card>
          <CardHeader>
            <CardTitle>과목별 성과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={selectedStudent.subjectPerformance}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="점수"
                    dataKey="averageScore"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="강점도"
                    dataKey="strength"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
              
              <div className="space-y-3">
                {selectedStudent.subjectPerformance.map(subject => (
                  <div key={subject.subject} className="p-3 bg-surface-secondary rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{subject.subject}</span>
                      <Badge variant="outline">{subject.averageScore}점</Badge>
                    </div>
                    <Progress value={subject.averageScore} className="h-2" />
                    <div className="text-xs text-text-secondary mt-1">
                      완료: {subject.problemsCompleted}문제 • 시간: {Math.round(subject.timeSpent / 60)}시간
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 학습 패턴 */}
        <Card>
          <CardHeader>
            <CardTitle>학습 패턴 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">주간 학습 활동</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={selectedStudent.learningPatterns.weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="activity" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-surface-secondary rounded-lg">
                  <h4 className="font-medium mb-2">학습 선호 시간</h4>
                  <div className="text-2xl font-bold text-primary">
                    {selectedStudent.learningPatterns.preferredTime}
                  </div>
                </div>
                <div className="p-4 bg-surface-secondary rounded-lg">
                  <h4 className="font-medium mb-2">평균 세션 시간</h4>
                  <div className="text-2xl font-bold text-success">
                    {selectedStudent.learningPatterns.sessionDuration}분
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 위험 지표 및 권장사항 */}
        {selectedStudent.riskIndicators.isAtRisk && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300 flex items-center space-x-2">
                <span>⚠️</span>
                <span>위험 지표</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">위험 요소</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-600 dark:text-red-400">
                  {selectedStudent.riskIndicators.riskFactors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">권장사항</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-600 dark:text-blue-400">
                  {selectedStudent.riskIndicators.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className={`student-performance-analysis ${className} space-y-6`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              ← 뒤로가기
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-text-primary">학생 성과 분석</h2>
            <p className="text-text-secondary">
              개별 학생의 학습 성과와 패턴을 분석합니다
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('overview')}
          >
            개요
          </Button>
          {selectedStudent && (
            <Button
              variant={viewMode === 'detail' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('detail')}
            >
              상세
            </Button>
          )}
        </div>
      </div>

      {/* 콘텐츠 */}
      {viewMode === 'overview' && renderOverviewMode()}
      {viewMode === 'detail' && renderDetailMode()}
    </div>
  );
};

export default StudentPerformanceAnalysis;