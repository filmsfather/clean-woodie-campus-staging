import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../../ui/Avatar';
import { Progress } from '../../../ui/Progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/Select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../../../ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Clock, Users, TrendingUp, TrendingDown, BookOpen, Award, AlertCircle } from 'lucide-react';

// 반 데이터 인터페이스
interface ClassData {
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  classRanking: number;
  recentActivity: Array<{
    studentName: string;
    action: string;
    timestamp: string;
  }>;
  problemSetStats: Array<{
    problemSetId: string;
    title: string;
    assignedDate: string;
    completionRate: number;
    averageScore: number;
    studentsCompleted: number;
    studentsInProgress: number;
  }>;
}

interface ClassOverviewProps {
  refreshInterval?: number;
  minHeight?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ClassOverview: React.FC<ClassOverviewProps> = ({ 
  refreshInterval = 300,
  minHeight = 300 
}) => {
  const [data, setData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  // Mock 데이터 - 실제 구현에서는 API 호출로 교체
  useEffect(() => {
    const fetchClassData = async () => {
      setLoading(true);
      try {
        // 실제 구현에서는 API 호출
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setData({
          totalStudents: 28,
          activeStudents: 25,
          averageProgress: 73.5,
          classRanking: 3,
          recentActivity: [
            {
              studentName: '김민수',
              action: '수학 문제집 완료',
              timestamp: '2분 전'
            },
            {
              studentName: '이지현',
              action: '영어 복습 문제 풀이',
              timestamp: '5분 전'
            },
            {
              studentName: '박준호',
              action: '과학 실험 보고서 제출',
              timestamp: '12분 전'
            },
            {
              studentName: '최서연',
              action: '문학 독해 문제 완료',
              timestamp: '18분 전'
            }
          ],
          problemSetStats: [
            {
              problemSetId: '1',
              title: '중간고사 대비 수학',
              assignedDate: '2024-09-01',
              completionRate: 89.3,
              averageScore: 78.5,
              studentsCompleted: 25,
              studentsInProgress: 3
            },
            {
              problemSetId: '2',
              title: '영어 문법 심화',
              assignedDate: '2024-09-03',
              completionRate: 67.9,
              averageScore: 82.1,
              studentsCompleted: 19,
              studentsInProgress: 9
            },
            {
              problemSetId: '3',
              title: '과학 실험 문제',
              assignedDate: '2024-09-05',
              completionRate: 42.9,
              averageScore: 75.3,
              studentsCompleted: 12,
              studentsInProgress: 16
            },
            {
              problemSetId: '4',
              title: '국어 독해 연습',
              assignedDate: '2024-09-07',
              completionRate: 25.0,
              averageScore: 71.8,
              studentsCompleted: 7,
              studentsInProgress: 21
            }
          ]
        });
        setError(null);
      } catch (err) {
        setError('반 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();

    // 자동 새로고침
    const interval = setInterval(fetchClassData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval, selectedTimeframe]);

  if (loading) {
    return (
      <Card className="h-full" style={{ minHeight }}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="h-full" style={{ minHeight }}>
        <CardContent className="flex items-center justify-center h-full text-center">
          <div className="text-red-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error || '데이터를 불러올 수 없습니다.'}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 차트 데이터 준비
  const completionData = data.problemSetStats.map(stat => ({
    name: stat.title.substring(0, 10) + '...',
    completion: stat.completionRate,
    score: stat.averageScore
  }));

  const activityLevelData = [
    { name: '활성 학생', value: data.activeStudents, color: COLORS[0] },
    { name: '비활성 학생', value: data.totalStudents - data.activeStudents, color: COLORS[1] }
  ];

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              반 현황 대시보드
            </CardTitle>
            <p className="text-sm text-text-secondary mt-1">
              실시간 학급 관리 및 성과 모니터링
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">오늘</SelectItem>
                <SelectItem value="week">이번주</SelectItem>
                <SelectItem value="month">이번달</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              내보내기
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 주요 지표 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">총 학생 수</p>
                <p className="text-2xl font-bold">{data.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">활성 학생</p>
                <p className="text-2xl font-bold text-green-600">{data.activeStudents}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">평균 진도율</p>
                <p className="text-2xl font-bold">{data.averageProgress}%</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-500" />
            </div>
            <Progress value={data.averageProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">반 순위</p>
                <p className="text-2xl font-bold">#{data.classRanking}</p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 문제집 완료율 차트 */}
        <Card>
          <CardHeader>
            <CardTitle>문제집 완료 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completion: { label: "완료율 (%)", color: "#0088FE" },
                score: { label: "평균 점수", color: "#00C49F" }
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionData}>
                  <XAxis 
                    dataKey="name" 
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completion" fill="#0088FE" name="완료율" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 학생 활동 수준 */}
        <Card>
          <CardHeader>
            <CardTitle>학생 활동 수준</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                활성: { label: "활성 학생", color: COLORS[0] },
                비활성: { label: "비활성 학생", color: COLORS[1] }
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityLevelData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {activityLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* 문제집 상세 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>문제집 진행 상황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.problemSetStats.map((stat) => (
              <div key={stat.problemSetId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{stat.title}</h4>
                    <p className="text-sm text-text-secondary">
                      배정일: {new Date(stat.assignedDate).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={stat.completionRate >= 80 ? 'default' : stat.completionRate >= 50 ? 'secondary' : 'destructive'}
                    >
                      {stat.completionRate.toFixed(1)}% 완료
                    </Badge>
                  </div>
                </div>
                
                <Progress value={stat.completionRate} className="mb-2" />
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary">완료:</span>
                    <span className="ml-1 font-medium">{stat.studentsCompleted}명</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">진행중:</span>
                    <span className="ml-1 font-medium">{stat.studentsInProgress}명</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">평균점수:</span>
                    <span className="ml-1 font-medium">{stat.averageScore.toFixed(1)}점</span>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      상세보기
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 최근 활동 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            최근 학생 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {activity.studentName.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{activity.studentName}</p>
                    <p className="text-xs text-text-secondary">{activity.action}</p>
                  </div>
                </div>
                <span className="text-xs text-text-secondary">{activity.timestamp}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            전체 활동 보기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassOverview;