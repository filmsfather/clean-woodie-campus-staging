import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { Button, Card, Badge, Avatar, Select } from '../../components/ui';
import { useQuery } from '@tanstack/react-query';

// Application Layer DTO 타입 직접 사용 (DTO-First 원칙)
interface StreakRankingDto {
  rankings: Array<{
    rank: number;
    studentId: string;
    studentName?: string;
    studentEmail?: string;
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: Date;
    isActive: boolean;
  }>;
  myRanking?: {
    rank: number;
    currentStreak: number;
    longestStreak: number;
  };
}

interface GetStreakRankingsResponse {
  rankings: StreakRankingDto;
  filters: {
    limit: number;
    isClassSpecific: boolean;
    classId?: string;
  };
}

/**
 * GetStreakRankingsUseCase → StreakLeaderboardPage
 * 스트릭 순위표 및 리더보드 UI 표면
 */
export const StreakLeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string | undefined>(undefined);
  const [limit, setLimit] = useState(20);

  // GetStreakRankingsUseCase 호출
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['streakRankings', selectedClass, limit, user?.id],
    queryFn: async (): Promise<GetStreakRankingsResponse> => {
      // TODO: 실제 GetStreakRankingsUseCase 연동
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock 데이터 (Application DTO 형태)
      const mockRankings: StreakRankingDto = {
        rankings: [
          {
            rank: 1,
            studentId: 'student-1',
            studentName: user?.role === 'student' && user?.id === 'student-1' ? user.name : undefined,
            currentStreak: 45,
            longestStreak: 52,
            lastStudyDate: new Date(),
            isActive: true
          },
          {
            rank: 2,
            studentId: 'student-2',
            studentName: user?.role === 'student' && user?.id === 'student-2' ? user.name : undefined,
            currentStreak: 38,
            longestStreak: 45,
            lastStudyDate: new Date(),
            isActive: true
          },
          {
            rank: 3,
            studentId: 'student-3',
            studentName: user?.role === 'student' && user?.id === 'student-3' ? user.name : undefined,
            currentStreak: 32,
            longestStreak: 38,
            lastStudyDate: new Date(Date.now() - 60 * 60 * 1000),
            isActive: true
          },
          {
            rank: 4,
            studentId: 'student-4',
            currentStreak: 28,
            longestStreak: 35,
            lastStudyDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
            isActive: true
          },
          {
            rank: 5,
            studentId: 'student-5',
            currentStreak: 25,
            longestStreak: 30,
            lastStudyDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
            isActive: true
          },
          {
            rank: 6,
            studentId: 'student-6',
            currentStreak: 22,
            longestStreak: 28,
            lastStudyDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
            isActive: true
          },
          {
            rank: 7,
            studentId: 'student-7',
            currentStreak: 18,
            longestStreak: 25,
            lastStudyDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
            isActive: true
          },
          {
            rank: 8,
            studentId: 'student-8',
            currentStreak: 15,
            longestStreak: 22,
            lastStudyDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
            isActive: true
          },
          {
            rank: 9,
            studentId: 'student-9',
            currentStreak: 12,
            longestStreak: 18,
            lastStudyDate: new Date(Date.now() - 8 * 60 * 60 * 1000),
            isActive: false
          },
          {
            rank: 10,
            studentId: 'student-10',
            currentStreak: 8,
            longestStreak: 15,
            lastStudyDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
            isActive: false
          }
        ],
        myRanking: user ? {
          rank: user.role === 'student' ? 
            (user.id === 'student-1' ? 1 : 
             user.id === 'student-2' ? 2 :
             user.id === 'student-3' ? 3 : 15) : undefined,
          currentStreak: user.id === 'student-1' ? 45 :
                        user.id === 'student-2' ? 38 :
                        user.id === 'student-3' ? 32 : 5,
          longestStreak: user.id === 'student-1' ? 52 :
                        user.id === 'student-2' ? 45 :
                        user.id === 'student-3' ? 38 : 12
        } : undefined
      };

      return {
        rankings: mockRankings,
        filters: {
          limit,
          isClassSpecific: !!selectedClass,
          classId: selectedClass
        }
      };
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000 // 5분마다 갱신
  });

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const getStreakColor = (streak: number): string => {
    if (streak >= 30) return 'text-purple-600 font-bold';
    if (streak >= 20) return 'text-blue-600 font-semibold';
    if (streak >= 10) return 'text-green-600';
    if (streak >= 5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getLastStudyText = (lastStudyDate: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - lastStudyDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
  };

  const isMyRanking = (studentId: string): boolean => {
    return user?.id === studentId;
  };

  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6 text-center">
          <p className="text-red-600">리더보드를 불러올 수 없습니다.</p>
          <Button onClick={() => refetch()} className="mt-4">
            다시 시도
          </Button>
        </Card>
      </div>
    );
  }

  const { rankings } = data;

  return (
    <FeatureGuard feature="streakRankings">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🔥 스트릭 리더보드</h1>
            <p className="text-gray-600">연속 학습 일수 순위표</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {user.role !== 'student' && (
              <Select
                value={selectedClass || ''}
                onChange={(e) => setSelectedClass(e.target.value || undefined)}
              >
                <option value="">전체 학생</option>
                <option value="class-1">중학교 1학년 A반</option>
                <option value="class-2">중학교 1학년 B반</option>
                <option value="class-3">중학교 2학년 A반</option>
              </Select>
            )}
            
            <Select
              value={limit.toString()}
              onChange={(e) => setLimit(parseInt(e.target.value))}
            >
              <option value="10">상위 10명</option>
              <option value="20">상위 20명</option>
              <option value="50">상위 50명</option>
            </Select>
          </div>
        </div>

        {/* 내 순위 카드 (학생만) */}
        {user.role === 'student' && rankings.myRanking && (
          <Card className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">내 현재 순위</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{getRankIcon(rankings.myRanking.rank) || '🎯'}</div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {rankings.myRanking.rank}위
                  </div>
                  <div className="text-sm text-gray-600">전체 순위</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-2xl font-bold ${getStreakColor(rankings.myRanking.currentStreak)}`}>
                  {rankings.myRanking.currentStreak}일
                </div>
                <div className="text-sm text-gray-600">현재 스트릭</div>
                <div className="text-xs text-gray-500">
                  최고: {rankings.myRanking.longestStreak}일
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* TOP 3 하이라이트 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {rankings.rankings.slice(0, 3).map((student) => (
            <Card 
              key={student.studentId} 
              className={`p-6 text-center ${
                isMyRanking(student.studentId) ? 'ring-2 ring-blue-400 bg-blue-50' : ''
              }`}
            >
              <div className="text-4xl mb-2">{getRankIcon(student.rank)}</div>
              <div className="text-lg font-semibold mb-1">
                {student.studentName || `학생 ${student.studentId.slice(-1)}`}
              </div>
              <div className={`text-3xl font-bold mb-2 ${getStreakColor(student.currentStreak)}`}>
                {student.currentStreak}일
              </div>
              <div className="text-sm text-gray-600 mb-1">
                최고 기록: {student.longestStreak}일
              </div>
              <div className="flex items-center justify-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${student.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-gray-500">
                  {getLastStudyText(student.lastStudyDate)}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* 전체 순위표 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">전체 순위</h3>
          <div className="space-y-2">
            {rankings.rankings.map((student, index) => (
              <div
                key={student.studentId}
                className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                  isMyRanking(student.studentId)
                    ? 'bg-blue-100 border border-blue-200'
                    : index < 3
                    ? 'bg-yellow-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getRankIcon(student.rank)}</span>
                    <span className="text-lg font-semibold w-8 text-center">
                      {student.rank}
                    </span>
                  </div>
                  
                  <Avatar 
                    name={student.studentName || `학생 ${student.studentId.slice(-1)}`}
                    size="md"
                  />
                  
                  <div>
                    <div className="font-medium">
                      {student.studentName || `학생 ${student.studentId.slice(-1)}`}
                      {isMyRanking(student.studentId) && (
                        <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">나</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${student.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                      <span>{getLastStudyText(student.lastStudyDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xl font-bold ${getStreakColor(student.currentStreak)}`}>
                    {student.currentStreak}일
                  </div>
                  <div className="text-sm text-gray-500">
                    최고: {student.longestStreak}일
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 스트릭 유지 팁 */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50">
          <h3 className="text-lg font-semibold mb-3 text-green-800">💡 스트릭 유지 팁</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-green-600">✓</span>
                <span>매일 같은 시간에 학습 습관 만들기</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600">✓</span>
                <span>짧은 시간이라도 꾸준히 문제 풀기</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600">✓</span>
                <span>목표를 작게 설정하고 점진적 증가</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">📱</span>
                <span>알림 설정으로 학습 시간 리마인더</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">🎯</span>
                <span>친구들과 함께 스트릭 경쟁하기</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">🏆</span>
                <span>마일스톤 달성 시 자신에게 보상주기</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </FeatureGuard>
  );
};