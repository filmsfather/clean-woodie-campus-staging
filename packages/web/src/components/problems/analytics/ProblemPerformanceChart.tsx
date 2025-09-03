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
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Progress } from '../../ui/Progress';

interface ProblemData {
  id: string;
  title: string;
  type: 'multiple_choice' | 'short_answer' | 'long_answer' | 'true_false' | 'matching' | 'fill_blank' | 'ordering';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: string;
  statistics: {
    totalAttempts: number;
    correctAnswers: number;
    averageScore: number;
    averageTimeSpent: number; // 초 단위
    completionRate: number;
    retryRate: number;
  };
  performanceTrend: Array<{
    date: string;
    averageScore: number;
    attempts: number;
    completionRate: number;
  }>;
  difficultyAnalysis: {
    expectedDifficulty: number; // 1-10
    actualDifficulty: number; // 1-10
    confidence: number; // 0-1
  };
  commonErrors: Array<{
    errorType: string;
    count: number;
    percentage: number;
    description: string;
  }>;
}

interface ProblemPerformanceChartProps {
  problemId?: string;
  problems?: ProblemData[]; // 여러 문제 비교용
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  className?: string;
  onBack?: () => void;
  onSelectProblem?: (problemId: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];
const DIFFICULTY_COLORS = {
  easy: '#4ade80',
  medium: '#fbbf24', 
  hard: '#f87171'
};

export const ProblemPerformanceChart: React.FC<ProblemPerformanceChartProps> = ({
  problemId,
  problems,
  timeRange = 'month',
  className = '',
  onBack,
  onSelectProblem
}) => {
  const [data, setData] = useState<ProblemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<ProblemData | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detail' | 'comparison'>('overview');

  useEffect(() => {
    const fetchProblemData = async () => {
      setLoading(true);
      try {
        // 실제 구현에서는 API 호출
        const mockData: ProblemData[] = [
          {
            id: '1',
            title: '기본 수학 연산',
            type: 'multiple_choice',
            difficulty: 'easy',
            tags: ['수학', '기초', '연산'],
            createdAt: '2024-01-01',
            statistics: {
              totalAttempts: 150,
              correctAnswers: 135,
              averageScore: 90,
              averageTimeSpent: 45,
              completionRate: 95,
              retryRate: 12
            },
            performanceTrend: [
              { date: '2024-01-01', averageScore: 85, attempts: 30, completionRate: 90 },
              { date: '2024-01-08', averageScore: 88, attempts: 35, completionRate: 93 },
              { date: '2024-01-15', averageScore: 90, attempts: 40, completionRate: 95 },
              { date: '2024-01-22', averageScore: 92, attempts: 45, completionRate: 96 }
            ],
            difficultyAnalysis: {
              expectedDifficulty: 3,
              actualDifficulty: 2.5,
              confidence: 0.85
            },
            commonErrors: [
              { errorType: 'calculation_error', count: 8, percentage: 5.3, description: '계산 실수' },
              { errorType: 'misread_question', count: 5, percentage: 3.3, description: '문제 오독' },
              { errorType: 'time_pressure', count: 2, percentage: 1.3, description: '시간 부족' }
            ]
          },
          {
            id: '2',
            title: '문법 검사',
            type: 'short_answer',
            difficulty: 'medium',
            tags: ['국어', '문법', '어법'],
            createdAt: '2024-01-05',
            statistics: {
              totalAttempts: 120,
              correctAnswers: 84,
              averageScore: 70,
              averageTimeSpent: 90,
              completionRate: 85,
              retryRate: 25
            },
            performanceTrend: [
              { date: '2024-01-01', averageScore: 65, attempts: 25, completionRate: 80 },
              { date: '2024-01-08', averageScore: 68, attempts: 30, completionRate: 82 },
              { date: '2024-01-15', averageScore: 70, attempts: 32, completionRate: 85 },
              { date: '2024-01-22', averageScore: 72, attempts: 33, completionRate: 87 }
            ],
            difficultyAnalysis: {
              expectedDifficulty: 6,
              actualDifficulty: 7.2,
              confidence: 0.78
            },
            commonErrors: [
              { errorType: 'grammar_rule', count: 20, percentage: 16.7, description: '문법 규칙 오해' },
              { errorType: 'spelling_error', count: 12, percentage: 10.0, description: '맞춤법 오류' },
              { errorType: 'context_misunderstanding', count: 4, percentage: 3.3, description: '문맥 오해' }
            ]
          },
          {
            id: '3',
            title: '과학 실험 분석',
            type: 'long_answer',
            difficulty: 'hard',
            tags: ['과학', '실험', '분석'],
            createdAt: '2024-01-10',
            statistics: {
              totalAttempts: 80,
              correctAnswers: 45,
              averageScore: 56,
              averageTimeSpent: 180,
              completionRate: 75,
              retryRate: 40
            },
            performanceTrend: [
              { date: '2024-01-01', averageScore: 52, attempts: 18, completionRate: 70 },
              { date: '2024-01-08', averageScore: 54, attempts: 20, completionRate: 72 },
              { date: '2024-01-15', averageScore: 56, attempts: 22, completionRate: 75 },
              { date: '2024-01-22', averageScore: 58, attempts: 20, completionRate: 78 }
            ],
            difficultyAnalysis: {
              expectedDifficulty: 8,
              actualDifficulty: 8.5,
              confidence: 0.72
            },
            commonErrors: [
              { errorType: 'incomplete_analysis', count: 25, percentage: 31.3, description: '분석 불완전' },
              { errorType: 'wrong_conclusion', count: 8, percentage: 10.0, description: '잘못된 결론' },
              { errorType: 'missing_evidence', count: 2, percentage: 2.5, description: '근거 부족' }
            ]
          }
        ];

        // problemId가 있으면 해당 문제만, 없으면 전체 또는 제공된 problems 사용
        if (problemId) {
          const problem = mockData.find(p => p.id === problemId);
          setData(problem ? [problem] : []);
          setSelectedProblem(problem || null);
          setViewMode('detail');
        } else if (problems) {
          setData(problems);
        } else {
          setData(mockData);
        }
      } catch (error) {
        console.error('문제 성과 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblemData();
  }, [problemId, problems, timeRange]);

  if (loading) {
    return (
      <div className={`problem-performance-chart loading ${className}`}>
        <div className="loading-spinner">문제 성과 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={`problem-performance-chart error ${className}`}>
        <div className="error-message">문제 데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  const renderOverviewMode = () => (
    <div className="space-y-6">
      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-2xl font-bold text-primary">
              {data.reduce((sum, p) => sum + p.statistics.totalAttempts, 0)}
            </div>
            <div className="text-sm text-text-secondary">총 시도 횟수</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-2xl font-bold text-success">
              {(data.reduce((sum, p) => sum + p.statistics.averageScore, 0) / data.length).toFixed(1)}점
            </div>
            <div className="text-sm text-text-secondary">평균 점수</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-2xl font-bold text-warning">
              {(data.reduce((sum, p) => sum + p.statistics.completionRate, 0) / data.length).toFixed(1)}%
            </div>
            <div className="text-sm text-text-secondary">완료율</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-2xl font-bold text-info">
              {Math.round(data.reduce((sum, p) => sum + p.statistics.averageTimeSpent, 0) / data.length / 60)}분
            </div>
            <div className="text-sm text-text-secondary">평균 소요시간</div>
          </CardContent>
        </Card>
      </div>

      {/* 문제별 성과 비교 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>문제별 성과 비교</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="statistics.totalAttempts" fill="#8884d8" name="시도 횟수" />
              <Line yAxisId="right" type="monotone" dataKey="statistics.averageScore" stroke="#ff7300" strokeWidth={2} name="평균 점수" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 난이도별 분포 */}
      <Card>
        <CardHeader>
          <CardTitle>난이도별 문제 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: '쉬움', value: data.filter(p => p.difficulty === 'easy').length, fill: DIFFICULTY_COLORS.easy },
                    { name: '보통', value: data.filter(p => p.difficulty === 'medium').length, fill: DIFFICULTY_COLORS.medium },
                    { name: '어려움', value: data.filter(p => p.difficulty === 'hard').length, fill: DIFFICULTY_COLORS.hard }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-4">
              <h4 className="font-semibold">난이도별 평균 성과</h4>
              {['easy', 'medium', 'hard'].map(difficulty => {
                const difficultyProblems = data.filter(p => p.difficulty === difficulty);
                const avgScore = difficultyProblems.length > 0 
                  ? difficultyProblems.reduce((sum, p) => sum + p.statistics.averageScore, 0) / difficultyProblems.length 
                  : 0;
                
                return (
                  <div key={difficulty} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="capitalize">
                        {difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'}
                      </span>
                      <span className="font-medium">{avgScore.toFixed(1)}점</span>
                    </div>
                    <Progress 
                      value={avgScore} 
                      className="h-2"
                      variant={avgScore >= 80 ? 'success' : avgScore >= 60 ? 'default' : 'error'}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 문제 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>문제별 상세 성과</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map(problem => (
              <div
                key={problem.id}
                className="p-4 border border-border-primary rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedProblem(problem);
                  setViewMode('detail');
                  onSelectProblem?.(problem.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-text-primary">{problem.title}</h4>
                      <Badge 
                        variant={problem.difficulty === 'easy' ? 'success' : 
                               problem.difficulty === 'medium' ? 'warning' : 'error'}
                        size="sm"
                      >
                        {problem.difficulty === 'easy' ? '쉬움' : 
                         problem.difficulty === 'medium' ? '보통' : '어려움'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-text-secondary">
                      <span>유형: {problem.type}</span>
                      <span>시도: {problem.statistics.totalAttempts}회</span>
                      <span>평균: {problem.statistics.averageScore}점</span>
                      <span>완료율: {problem.statistics.completionRate}%</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    자세히 보기 →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDetailMode = () => {
    if (!selectedProblem) return null;

    return (
      <div className="space-y-6">
        {/* 문제 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{selectedProblem.title}</h2>
            <div className="flex items-center space-x-4 mt-2">
              <Badge 
                variant={selectedProblem.difficulty === 'easy' ? 'success' : 
                       selectedProblem.difficulty === 'medium' ? 'warning' : 'error'}
              >
                {selectedProblem.difficulty === 'easy' ? '쉬움' : 
                 selectedProblem.difficulty === 'medium' ? '보통' : '어려움'}
              </Badge>
              <span className="text-sm text-text-secondary">
                유형: {selectedProblem.type}
              </span>
              <span className="text-sm text-text-secondary">
                태그: {selectedProblem.tags.join(', ')}
              </span>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setViewMode('overview')}>
            ← 목록으로
          </Button>
        </div>

        {/* 성과 트렌드 */}
        <Card>
          <CardHeader>
            <CardTitle>성과 트렌드</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={selectedProblem.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area yAxisId="right" type="monotone" dataKey="completionRate" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="완료율 (%)" />
                <Line yAxisId="left" type="monotone" dataKey="averageScore" stroke="#8884d8" strokeWidth={3} name="평균 점수" />
                <Bar yAxisId="left" dataKey="attempts" fill="#ffc658" name="시도 횟수" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 난이도 분석 */}
        <Card>
          <CardHeader>
            <CardTitle>난이도 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {selectedProblem.difficultyAnalysis.expectedDifficulty}/10
                </div>
                <div className="text-sm text-text-secondary">예상 난이도</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {selectedProblem.difficultyAnalysis.actualDifficulty}/10
                </div>
                <div className="text-sm text-text-secondary">실제 난이도</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {(selectedProblem.difficultyAnalysis.confidence * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-text-secondary">신뢰도</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-surface-secondary rounded-lg">
              <p className="text-sm text-text-secondary">
                {selectedProblem.difficultyAnalysis.actualDifficulty > selectedProblem.difficultyAnalysis.expectedDifficulty 
                  ? '이 문제는 예상보다 어렵게 느껴집니다. 추가 설명이나 힌트를 제공하는 것을 고려해보세요.'
                  : selectedProblem.difficultyAnalysis.actualDifficulty < selectedProblem.difficultyAnalysis.expectedDifficulty
                  ? '이 문제는 예상보다 쉽게 느껴집니다. 난이도를 조정하거나 심화 문제를 추가하는 것을 고려해보세요.'
                  : '이 문제의 난이도는 적절합니다.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 공통 오류 분석 */}
        <Card>
          <CardHeader>
            <CardTitle>공통 오류 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedProblem.commonErrors.map((error, index) => (
                <div key={error.errorType} className="p-3 border border-border-primary rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-text-primary">{error.description}</h4>
                    <Badge variant="outline">
                      {error.count}회 ({error.percentage.toFixed(1)}%)
                    </Badge>
                  </div>
                  <Progress 
                    value={error.percentage} 
                    className="h-2 mt-2"
                    variant={error.percentage > 10 ? 'error' : 'default'}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={`problem-performance-chart ${className} space-y-6`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              ← 뒤로가기
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-text-primary">문제 성과 분석</h2>
            <p className="text-text-secondary">
              문제별 성과와 학습자 반응을 분석합니다
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
          {selectedProblem && (
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

export default ProblemPerformanceChart;