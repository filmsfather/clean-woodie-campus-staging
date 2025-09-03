import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ProblemPerformanceChart } from './ProblemPerformanceChart';
import { StudentPerformanceAnalysis } from './StudentPerformanceAnalysis';

// 통계 데이터 인터페이스 (도메인 레이어와 연계)
interface ProblemSetStatistics {
  totalProblemSets: number;
  totalItems: number;
  averageItemsPerSet: number;
  emptyProblemSetsCount: number;
  largestProblemSetSize: number;
  smallestProblemSetSize: number;
}

interface ActivityStatistics {
  createdThisWeek: number;
  createdThisMonth: number;
  createdThisYear: number;
  updatedThisWeek: number;
  updatedThisMonth: number;
  mostActiveDay: {
    date: string;
    activityCount: number;
  };
}

interface UsageStatistic {
  problemId: string;
  problemTitle: string;
  usageCount: number;
  percentage: number;
}

interface SizeDistribution {
  itemCount: number;
  problemSetCount: number;
  percentage: number;
}

interface DashboardData {
  statistics: ProblemSetStatistics;
  activity: ActivityStatistics;
  mostUsedProblems: UsageStatistic[];
  sizeDistribution: SizeDistribution[];
  performanceTrends: Array<{
    date: string;
    averageScore: number;
    completionRate: number;
    studentCount: number;
  }>;
}

interface AnalyticsDashboardProps {
  teacherId?: string; // 교사용일 때만 제공
  isAdminView?: boolean; // 관리자 뷰인지 구분
  dateRange?: {
    start: Date;
    end: Date;
  };
  className?: string;
  onExportReport?: () => void;
  onViewDetails?: (section: string) => void;
  onBack?: () => void; // 뒤로가기 콜백
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  teacherId,
  isAdminView = false,
  dateRange,
  className = '',
  onExportReport,
  onViewDetails,
  onBack
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'performance' | 'insights'>('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [currentView, setCurrentView] = useState<'dashboard' | 'problem-performance' | 'student-performance'>('dashboard');
  const [selectedContext, setSelectedContext] = useState<{
    problemId?: string;
    studentId?: string;
    classId?: string;
  }>({});

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        // 실제 구현에서는 API 호출로 데이터 가져오기
        // isAdminView에 따라 전체 시스템 데이터 vs 교사별 데이터 구분
        const mockData: DashboardData = {
          statistics: {
            totalProblemSets: isAdminView ? 450 : 45,
            totalItems: isAdminView ? 3400 : 340,
            averageItemsPerSet: 7.6,
            emptyProblemSetsCount: isAdminView ? 30 : 3,
            largestProblemSetSize: 25,
            smallestProblemSetSize: 1
          },
          activity: {
            createdThisWeek: isAdminView ? 25 : 3,
            createdThisMonth: isAdminView ? 120 : 12,
            createdThisYear: isAdminView ? 450 : 45,
            updatedThisWeek: isAdminView ? 80 : 8,
            updatedThisMonth: isAdminView ? 280 : 28,
            mostActiveDay: {
              date: '2024-01-15',
              activityCount: isAdminView ? 150 : 15
            }
          },
          mostUsedProblems: [
            { problemId: '1', problemTitle: '기본 수학 연산', usageCount: isAdminView ? 450 : 45, percentage: 13.2 },
            { problemId: '2', problemTitle: '문법 검사', usageCount: isAdminView ? 380 : 38, percentage: 11.2 },
            { problemId: '3', problemTitle: '과학 실험', usageCount: isAdminView ? 320 : 32, percentage: 9.4 },
            { problemId: '4', problemTitle: '역사 퀴즈', usageCount: isAdminView ? 280 : 28, percentage: 8.2 },
            { problemId: '5', problemTitle: '영어 독해', usageCount: isAdminView ? 250 : 25, percentage: 7.4 }
          ],
          sizeDistribution: [
            { itemCount: 1, problemSetCount: isAdminView ? 80 : 8, percentage: 17.8 },
            { itemCount: 5, problemSetCount: isAdminView ? 150 : 15, percentage: 33.3 },
            { itemCount: 10, problemSetCount: isAdminView ? 120 : 12, percentage: 26.7 },
            { itemCount: 15, problemSetCount: isAdminView ? 70 : 7, percentage: 15.6 },
            { itemCount: 20, problemSetCount: isAdminView ? 30 : 3, percentage: 6.7 }
          ],
          performanceTrends: [
            { date: '2024-01-01', averageScore: 78, completionRate: 85, studentCount: isAdminView ? 1200 : 120 },
            { date: '2024-01-08', averageScore: 82, completionRate: 88, studentCount: isAdminView ? 1250 : 125 },
            { date: '2024-01-15', averageScore: 85, completionRate: 92, studentCount: isAdminView ? 1300 : 130 },
            { date: '2024-01-22', averageScore: 79, completionRate: 87, studentCount: isAdminView ? 1280 : 128 },
            { date: '2024-01-29', averageScore: 83, completionRate: 90, studentCount: isAdminView ? 1350 : 135 }
          ]
        };
        
        setData(mockData);
      } catch (error) {
        console.error('분석 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [teacherId, isAdminView, dateRange, timeRange]);

  if (loading) {
    return (
      <div className={`analytics-dashboard loading ${className}`}>
        <div className="loading-spinner">분석 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`analytics-dashboard error ${className}`}>
        <div className="error-message">분석 데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* 핵심 지표 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-primary">
              {data.statistics.totalProblemSets}
            </div>
            <div className="text-sm text-text-secondary">
              {isAdminView ? '전체 문제집 수' : '내 문제집 수'}
            </div>
            <Badge variant="outline" size="sm">
              +{data.activity.createdThisMonth} 이번 달
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-success">
              {data.statistics.totalItems}
            </div>
            <div className="text-sm text-text-secondary">총 문제 수</div>
            <Badge variant="success" size="sm">
              평균 {data.statistics.averageItemsPerSet.toFixed(1)}개/세트
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-warning">
              {data.statistics.totalProblemSets - data.statistics.emptyProblemSetsCount}
            </div>
            <div className="text-sm text-text-secondary">활성 문제집</div>
            <Badge variant="warning" size="sm">
              {data.statistics.emptyProblemSetsCount}개 비어있음
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6 space-y-2">
            <div className="text-3xl font-bold text-info">
              {data.activity.updatedThisWeek}
            </div>
            <div className="text-sm text-text-secondary">이번 주 업데이트</div>
            <Badge variant="default" size="sm">
              총 {data.activity.updatedThisMonth}개 이번 달
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* 문제집 크기 분포 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>문제집 크기 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.sizeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="itemCount" 
                label={{ value: '문제 수', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                label={{ value: '문제집 수', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'problemSetCount' ? `${value}개 문제집` : value,
                  name === 'problemSetCount' ? '문제집 수' : name
                ]}
              />
              <Bar dataKey="problemSetCount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 성과 트렌드 차트 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>성과 트렌드</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleViewStudentPerformance()}
            >
              상세 보기 →
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.performanceTrends}>
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
              <Area 
                type="monotone" 
                dataKey="completionRate" 
                stackId="2" 
                stroke="#82ca9d" 
                fill="#82ca9d"
                name="완료율 (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderUsageTab = () => (
    <div className="space-y-6">
      {/* 가장 많이 사용된 문제 차트 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>가장 많이 사용된 문제 (상위 5개)</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleViewProblemPerformance()}
            >
              문제별 분석 →
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.mostUsedProblems} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="problemTitle" type="category" width={150} />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}회 (${data.mostUsedProblems.find(p => p.usageCount === value)?.percentage}%)`,
                  '사용 횟수'
                ]}
              />
              <Bar dataKey="usageCount" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 문제집 활동 패턴 */}
      <Card>
        <CardHeader>
          <CardTitle>활동 패턴</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-surface-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {data.activity.createdThisWeek}개
              </div>
              <div className="text-sm text-text-secondary">이번 주 생성</div>
            </div>
            <div className="text-center p-4 bg-surface-secondary rounded-lg">
              <div className="text-2xl font-bold text-success">
                {data.activity.createdThisMonth}개
              </div>
              <div className="text-sm text-text-secondary">이번 달 생성</div>
            </div>
            <div className="text-center p-4 bg-surface-secondary rounded-lg">
              <div className="text-lg font-bold text-warning">
                {new Date(data.activity.mostActiveDay.date).toLocaleDateString()}
              </div>
              <div className="text-sm text-text-secondary">
                가장 활발한 날 ({data.activity.mostActiveDay.activityCount}개 활동)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {/* 성과 트렌드 라인 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>주간 성과 트렌드</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data.performanceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="averageScore" 
                stroke="#8884d8" 
                strokeWidth={3}
                name="평균 점수"
              />
              <Line 
                type="monotone" 
                dataKey="completionRate" 
                stroke="#82ca9d" 
                strokeWidth={3}
                name="완료율 (%)"
              />
              <Line 
                type="monotone" 
                dataKey="studentCount" 
                stroke="#ffc658" 
                strokeWidth={2}
                name="참여 학생 수"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 성과 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>성과 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-surface-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {(data.performanceTrends.reduce((sum, item) => sum + item.averageScore, 0) / data.performanceTrends.length).toFixed(1)}점
              </div>
              <div className="text-sm text-text-secondary">평균 점수</div>
            </div>
            <div className="text-center p-4 bg-surface-secondary rounded-lg">
              <div className="text-2xl font-bold text-success">
                {(data.performanceTrends.reduce((sum, item) => sum + item.completionRate, 0) / data.performanceTrends.length).toFixed(1)}%
              </div>
              <div className="text-sm text-text-secondary">평균 완료율</div>
            </div>
            <div className="text-center p-4 bg-surface-secondary rounded-lg">
              <div className="text-2xl font-bold text-info">
                {Math.max(...data.performanceTrends.map(item => item.studentCount))}명
              </div>
              <div className="text-sm text-text-secondary">최대 참여 학생</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>인사이트 및 권장사항</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 rounded-lg">
              <h4 className="text-green-800 dark:text-green-300 font-semibold flex items-center space-x-2">
                <span>✅</span>
                <span>잘하고 있는 점</span>
              </h4>
              <ul className="mt-3 space-y-1 text-sm text-green-700 dark:text-green-400">
                <li>• 평균 문제집 크기가 적절합니다 ({data.statistics.averageItemsPerSet.toFixed(1)}개)</li>
                <li>• 꾸준한 문제집 업데이트 활동을 보여줍니다</li>
                <li>• 다양한 문제 유형을 활용하고 있습니다</li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 rounded-lg">
              <h4 className="text-yellow-800 dark:text-yellow-300 font-semibold flex items-center space-x-2">
                <span>⚠️</span>
                <span>개선할 점</span>
              </h4>
              <ul className="mt-3 space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
                <li>• {data.statistics.emptyProblemSetsCount}개의 비어있는 문제집이 있습니다</li>
                <li>• 일부 문제의 사용빈도가 매우 높습니다 (상위 20%가 전체 사용의 40% 차지)</li>
                <li>• 문제집 크기 편차가 큽니다 (최대 {data.statistics.largestProblemSetSize}개, 최소 {data.statistics.smallestProblemSetSize}개)</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 rounded-lg">
              <h4 className="text-blue-800 dark:text-blue-300 font-semibold flex items-center space-x-2">
                <span>💡</span>
                <span>권장사항</span>
              </h4>
              <ul className="mt-3 space-y-1 text-sm text-blue-700 dark:text-blue-400">
                <li>• 비어있는 문제집을 정리하거나 내용을 추가해보세요</li>
                <li>• 사용빈도가 낮은 문제들의 활용방안을 검토해보세요</li>
                <li>• 문제집 크기를 5-15개 사이로 표준화하는 것을 권장합니다</li>
                <li>• 새로운 문제 유형을 도입하여 다양성을 높여보세요</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button 
                variant="default"
                onClick={() => handleViewProblemPerformance()}
              >
                📊 문제별 성과 분석
              </Button>
              <Button 
                variant="default"
                onClick={() => handleViewStudentPerformance()}
              >
                👥 학생별 성과 분석  
              </Button>
              <Button 
                variant="outline"
                onClick={() => onViewDetails?.('optimization')}
              >
                🔧 최적화 상세 분석
              </Button>
              {isAdminView && (
                <Button 
                  variant="outline"
                  onClick={() => onViewDetails?.('comparison')}
                >
                  📈 교사별 비교 분석
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={`analytics-dashboard ${className} space-y-6`}>
      {/* 대시보드 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              ← 뒤로가기
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {isAdminView ? '시스템 분석 대시보드' : '문제집 분석 대시보드'}
            </h2>
            <p className="text-text-secondary">
              {isAdminView ? '전체 시스템 통계 및 성과 분석' : '내 문제집 통계 및 성과 분석'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1">
            <Button 
              variant={timeRange === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('week')}
            >
              주간
            </Button>
            <Button 
              variant={timeRange === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('month')}
            >
              월간
            </Button>
            <Button 
              variant={timeRange === 'year' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('year')}
            >
              연간
            </Button>
          </div>
          
          {onExportReport && (
            <Button variant="outline" onClick={onExportReport}>
              보고서 내보내기
            </Button>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex space-x-1 bg-surface-secondary p-1 rounded-lg">
        <button 
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'overview' 
              ? 'bg-white dark:bg-gray-800 shadow-sm text-text-primary' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          개요
        </button>
        <button 
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'usage' 
              ? 'bg-white dark:bg-gray-800 shadow-sm text-text-primary' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setActiveTab('usage')}
        >
          사용 현황
        </button>
        <button 
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'performance' 
              ? 'bg-white dark:bg-gray-800 shadow-sm text-text-primary' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setActiveTab('performance')}
        >
          성과 분석
        </button>
        <button 
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'insights' 
              ? 'bg-white dark:bg-gray-800 shadow-sm text-text-primary' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setActiveTab('insights')}
        >
          인사이트
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'usage' && renderUsageTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'insights' && renderInsightsTab()}
      </div>
    </div>
  );

  // 네비게이션 핸들러
  const handleViewProblemPerformance = (problemId?: string) => {
    setSelectedContext({ problemId });
    setCurrentView('problem-performance');
  };

  const handleViewStudentPerformance = (studentId?: string, classId?: string) => {
    setSelectedContext({ studentId, classId });
    setCurrentView('student-performance');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedContext({});
  };

  // 메인 렌더링 분기
  if (currentView === 'problem-performance') {
    return (
      <ProblemPerformanceChart
        problemId={selectedContext.problemId}
        timeRange={timeRange}
        onBack={handleBackToDashboard}
        onSelectProblem={(problemId) => setSelectedContext({ problemId })}
        className={className}
      />
    );
  }

  if (currentView === 'student-performance') {
    return (
      <StudentPerformanceAnalysis
        studentId={selectedContext.studentId}
        classId={selectedContext.classId}
        timeRange={timeRange}
        onBack={handleBackToDashboard}
        onSelectStudent={(studentId) => setSelectedContext({ studentId })}
        className={className}
      />
    );
  }

  return renderDashboardView();
};

export default AnalyticsDashboard;