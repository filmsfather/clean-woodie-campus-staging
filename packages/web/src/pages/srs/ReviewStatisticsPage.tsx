import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { Card } from '../../components/ui';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Application Layer DTO 타입 직접 사용 (DTO-First 원칙)
interface ReviewStatistics {
  totalScheduled: number;
  dueToday: number;
  overdue: number;
  completedToday: number;
  streakDays: number;
  averageRetention: number;
  totalTimeSpent: number; // 분 단위
}

interface DailyReviewData {
  date: string;
  completed: number;
  accuracy: number;
  timeSpent: number;
}

interface GetReviewStatisticsResponse {
  statistics: ReviewStatistics;
  dailyData: DailyReviewData[];
  difficultyBreakdown: {
    beginner: { completed: number; accuracy: number };
    intermediate: { completed: number; accuracy: number };
    advanced: { completed: number; accuracy: number };
  };
}

/**
 * GetReviewStatisticsUseCase → ReviewStatisticsPage
 * 복습 통계 및 분석 대시보드 UI 표면
 */
export const ReviewStatisticsPage: React.FC = () => {
  const { user } = useAuth();

  // GetReviewStatisticsUseCase 호출
  const { data, isLoading, error } = useQuery({
    queryKey: ['reviewStatistics', user?.id],
    queryFn: async (): Promise<GetReviewStatisticsResponse> => {
      // TODO: 실제 GetReviewStatisticsUseCase 연동
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock 데이터 (Application DTO 형태)
      const mockStatistics: ReviewStatistics = {
        totalScheduled: 156,
        dueToday: 23,
        overdue: 5,
        completedToday: 18,
        streakDays: 12,
        averageRetention: 87,
        totalTimeSpent: 45 // 분
      };

      const mockDailyData: DailyReviewData[] = [
        { date: '2025-08-26', completed: 15, accuracy: 85, timeSpent: 35 },
        { date: '2025-08-27', completed: 20, accuracy: 92, timeSpent: 42 },
        { date: '2025-08-28', completed: 12, accuracy: 78, timeSpent: 28 },
        { date: '2025-08-29', completed: 25, accuracy: 90, timeSpent: 55 },
        { date: '2025-08-30', completed: 18, accuracy: 88, timeSpent: 38 },
        { date: '2025-08-31', completed: 22, accuracy: 95, timeSpent: 48 },
        { date: '2025-09-01', completed: 18, accuracy: 87, timeSpent: 45 }
      ];

      return {
        statistics: mockStatistics,
        dailyData: mockDailyData,
        difficultyBreakdown: {
          beginner: { completed: 45, accuracy: 95 },
          intermediate: { completed: 78, accuracy: 88 },
          advanced: { completed: 33, accuracy: 76 }
        }
      };
    },
    enabled: !!user?.id
  });

  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card className="p-6 text-center">
          <p className="text-red-600">복습 통계를 불러올 수 없습니다.</p>
        </Card>
      </div>
    );
  }

  const { statistics, dailyData, difficultyBreakdown } = data;

  // 차트 데이터 가공
  const difficultyChartData = [
    { name: '초급', value: difficultyBreakdown.beginner.completed, accuracy: difficultyBreakdown.beginner.accuracy },
    { name: '중급', value: difficultyBreakdown.intermediate.completed, accuracy: difficultyBreakdown.intermediate.accuracy },
    { name: '고급', value: difficultyBreakdown.advanced.completed, accuracy: difficultyBreakdown.advanced.accuracy }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <FeatureGuard feature="reviewSystem">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">복습 통계</h1>
          <div className="text-sm text-gray-500">
            마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
          </div>
        </div>

        {/* 주요 지표 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-3xl font-bold text-blue-600">{statistics.streakDays}</div>
            <div className="text-sm text-gray-600">연속 학습 일수</div>
            <div className="text-xs text-green-600 mt-1">🔥 계속 유지하세요!</div>
          </Card>
          
          <Card className="p-6">
            <div className="text-3xl font-bold text-green-600">{statistics.averageRetention}%</div>
            <div className="text-sm text-gray-600">평균 정답률</div>
            <div className="text-xs text-gray-500 mt-1">최근 30개 복습 기준</div>
          </Card>
          
          <Card className="p-6">
            <div className="text-3xl font-bold text-orange-600">{statistics.completedToday}</div>
            <div className="text-sm text-gray-600">오늘 완료한 복습</div>
            <div className="text-xs text-gray-500 mt-1">
              남은 복습: {statistics.dueToday - statistics.completedToday}개
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-3xl font-bold text-purple-600">
              {Math.floor(statistics.totalTimeSpent / 60)}h {statistics.totalTimeSpent % 60}m
            </div>
            <div className="text-sm text-gray-600">오늘 학습 시간</div>
            {statistics.overdue > 0 && (
              <div className="text-xs text-red-600 mt-1">⚠️ 연체 {statistics.overdue}개</div>
            )}
          </Card>
        </div>

        {/* 차트 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 일별 복습 완료 추이 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">일별 복습 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('ko-KR')}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="completed" fill="#3B82F6" name="완료 개수" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="정답률 (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* 난이도별 분포 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">난이도별 복습 분포</h3>
            <div className="grid grid-cols-2 gap-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {difficultyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-4">
                {difficultyChartData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index] }}
                      ></div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{item.value}개</div>
                      <div className="text-sm text-gray-600">{item.accuracy}% 정답률</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* 일별 학습 시간 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">일별 학습 시간</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('ko-KR')}
                formatter={(value) => [`${value}분`, '학습 시간']}
              />
              <Bar dataKey="timeSpent" fill="#8B5CF6" name="학습 시간 (분)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 복습 현황 요약 */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">복습 현황 요약</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{statistics.totalScheduled}</div>
              <div className="text-sm text-gray-600">전체 예정된 복습</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((statistics.completedToday / Math.max(statistics.dueToday, 1)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">오늘 복습 완료율</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.dueToday - statistics.completedToday + statistics.overdue}
              </div>
              <div className="text-sm text-gray-600">남은 복습 (연체 포함)</div>
            </div>
          </div>
        </Card>
      </div>
    </FeatureGuard>
  );
};