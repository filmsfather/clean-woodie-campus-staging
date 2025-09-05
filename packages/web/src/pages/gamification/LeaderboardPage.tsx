import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { Button, Card, Badge, Avatar, Select } from '../../components/ui';
import { useQuery } from '@tanstack/react-query';
import { LeaderboardSummaryDto } from '@woodie/application';

// Application Layer DTO 타입 직접 사용 (DTO-First 원칙)
interface GetLeaderboardsRequest {
  studentId?: string;
  limit?: number;
}

/**
 * GetLeaderboardsUseCase → LeaderboardPage
 * 각종 리더보드 및 순위표 UI 표면
 */
export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedBoard, setSelectedBoard] = useState<'token_balance' | 'token_earned' | 'achievements' | 'weekly_tokens'>('token_balance');
  const [limit, setLimit] = useState(10);

  // GetLeaderboardsUseCase 호출
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leaderboards', user?.id, limit],
    queryFn: async (): Promise<LeaderboardSummaryDto> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock 데이터 (Application DTO 형태)
      const mockLeaderboards: LeaderboardSummaryDto = {
        tokenBalance: {
          type: 'token_balance',
          displayName: '토큰 잔액',
          entries: [
            {
              id: 'entry-1',
              studentId: 'student-1',
              studentName: user?.role === 'student' && user?.id === 'student-1' ? user.name : '학생 A',
              rank: 1,
              score: 2450,
              rankChange: 2,
              avatar: undefined,
              badges: ['🏆', '🔥']
            },
            {
              id: 'entry-2',
              studentId: 'student-2',
              studentName: user?.role === 'student' && user?.id === 'student-2' ? user.name : '학생 B',
              rank: 2,
              score: 1980,
              rankChange: -1,
              avatar: undefined,
              badges: ['⭐']
            },
            {
              id: 'entry-3',
              studentId: 'student-3',
              studentName: user?.role === 'student' && user?.id === 'student-3' ? user.name : '학생 C',
              rank: 3,
              score: 1750,
              rankChange: 1,
              avatar: undefined,
              badges: ['💎']
            },
            {
              id: 'entry-4',
              studentId: 'student-4',
              studentName: '학생 D',
              rank: 4,
              score: 1620,
              rankChange: 0,
              avatar: undefined,
              badges: []
            },
            {
              id: 'entry-5',
              studentId: 'student-5',
              studentName: '학생 E',
              rank: 5,
              score: 1450,
              rankChange: -2,
              avatar: undefined,
              badges: ['🎯']
            },
            {
              id: 'entry-6',
              studentId: 'student-6',
              studentName: '학생 F',
              rank: 6,
              score: 1280,
              rankChange: 3,
              avatar: undefined,
              badges: []
            },
            {
              id: 'entry-7',
              studentId: 'student-7',
              studentName: '학생 G',
              rank: 7,
              score: 1150,
              rankChange: 0,
              avatar: undefined,
              badges: ['🔥']
            },
            {
              id: 'entry-8',
              studentId: 'student-8',
              studentName: '학생 H',
              rank: 8,
              score: 980,
              rankChange: -1,
              avatar: undefined,
              badges: []
            },
            {
              id: 'entry-9',
              studentId: 'student-9',
              studentName: '학생 I',
              rank: 9,
              score: 850,
              rankChange: 2,
              avatar: undefined,
              badges: []
            },
            {
              id: 'entry-10',
              studentId: 'student-10',
              studentName: '학생 J',
              rank: 10,
              score: 720,
              rankChange: -1,
              avatar: undefined,
              badges: []
            }
          ],
          totalEntries: 47,
          lastUpdated: new Date().toISOString(),
          currentUserRank: user?.role === 'student' ? {
            rank: user.id === 'student-1' ? 1 :
                  user.id === 'student-2' ? 2 :
                  user.id === 'student-3' ? 3 : 15,
            score: user.id === 'student-1' ? 2450 :
                   user.id === 'student-2' ? 1980 :
                   user.id === 'student-3' ? 1750 : 420,
            percentile: user.id === 'student-1' ? 98 :
                       user.id === 'student-2' ? 95 :
                       user.id === 'student-3' ? 90 : 70
          } : undefined
        },
        tokenEarned: {
          type: 'token_earned',
          displayName: '총 획득 토큰',
          entries: [
            {
              id: 'entry-1',
              studentId: 'student-2',
              studentName: user?.role === 'student' && user?.id === 'student-2' ? user.name : '학생 B',
              rank: 1,
              score: 5200,
              rankChange: 0,
              avatar: undefined,
              badges: ['🏆', '💰']
            },
            {
              id: 'entry-2',
              studentId: 'student-1',
              studentName: user?.role === 'student' && user?.id === 'student-1' ? user.name : '학생 A',
              rank: 2,
              score: 4850,
              rankChange: 1,
              avatar: undefined,
              badges: ['🔥', '⚡']
            },
            {
              id: 'entry-3',
              studentId: 'student-3',
              studentName: user?.role === 'student' && user?.id === 'student-3' ? user.name : '학생 C',
              rank: 3,
              score: 4200,
              rankChange: -1,
              avatar: undefined,
              badges: ['💎', '🎯']
            }
          ].concat([...Array(7)].map((_, i) => ({
            id: `entry-${i + 4}`,
            studentId: `student-${i + 4}`,
            studentName: `학생 ${String.fromCharCode(68 + i)}`,
            rank: i + 4,
            score: 4000 - (i * 300),
            rankChange: Math.floor(Math.random() * 7) - 3,
            avatar: undefined,
            badges: Math.random() > 0.7 ? ['⭐'] : []
          }))),
          totalEntries: 47,
          lastUpdated: new Date().toISOString(),
          currentUserRank: user?.role === 'student' ? {
            rank: user.id === 'student-1' ? 2 :
                  user.id === 'student-2' ? 1 :
                  user.id === 'student-3' ? 3 : 20,
            score: user.id === 'student-1' ? 4850 :
                   user.id === 'student-2' ? 5200 :
                   user.id === 'student-3' ? 4200 : 1200,
            percentile: user.id === 'student-1' ? 96 :
                       user.id === 'student-2' ? 98 :
                       user.id === 'student-3' ? 94 : 58
          } : undefined
        },
        achievements: {
          type: 'achievements',
          displayName: '업적 개수',
          entries: [
            {
              id: 'entry-1',
              studentId: 'student-3',
              studentName: user?.role === 'student' && user?.id === 'student-3' ? user.name : '학생 C',
              rank: 1,
              score: 28,
              rankChange: 2,
              avatar: undefined,
              badges: ['🏆', '🌟', '💫']
            },
            {
              id: 'entry-2',
              studentId: 'student-1',
              studentName: user?.role === 'student' && user?.id === 'student-1' ? user.name : '학생 A',
              rank: 2,
              score: 25,
              rankChange: -1,
              avatar: undefined,
              badges: ['🔥', '⚡', '💎']
            },
            {
              id: 'entry-3',
              studentId: 'student-2',
              studentName: user?.role === 'student' && user?.id === 'student-2' ? user.name : '학생 B',
              rank: 3,
              score: 22,
              rankChange: 0,
              avatar: undefined,
              badges: ['⭐', '🎯']
            }
          ].concat([...Array(7)].map((_, i) => ({
            id: `entry-${i + 4}`,
            studentId: `student-${i + 4}`,
            studentName: `학생 ${String.fromCharCode(68 + i)}`,
            rank: i + 4,
            score: 20 - (i * 2),
            rankChange: Math.floor(Math.random() * 5) - 2,
            avatar: undefined,
            badges: Math.random() > 0.6 ? ['⭐'] : []
          }))),
          totalEntries: 47,
          lastUpdated: new Date().toISOString(),
          currentUserRank: user?.role === 'student' ? {
            rank: user.id === 'student-1' ? 2 :
                  user.id === 'student-2' ? 3 :
                  user.id === 'student-3' ? 1 : 25,
            score: user.id === 'student-1' ? 25 :
                   user.id === 'student-2' ? 22 :
                   user.id === 'student-3' ? 28 : 8,
            percentile: user.id === 'student-1' ? 96 :
                       user.id === 'student-2' ? 94 :
                       user.id === 'student-3' ? 98 : 47
          } : undefined
        },
        weeklyTokens: {
          type: 'weekly_tokens',
          displayName: '이번 주 토큰',
          entries: [
            {
              id: 'entry-1',
              studentId: 'student-1',
              studentName: user?.role === 'student' && user?.id === 'student-1' ? user.name : '학생 A',
              rank: 1,
              score: 850,
              rankChange: 3,
              avatar: undefined,
              badges: ['🚀', '🔥']
            },
            {
              id: 'entry-2',
              studentId: 'student-3',
              studentName: user?.role === 'student' && user?.id === 'student-3' ? user.name : '학생 C',
              rank: 2,
              score: 720,
              rankChange: 1,
              avatar: undefined,
              badges: ['⚡']
            },
            {
              id: 'entry-3',
              studentId: 'student-2',
              studentName: user?.role === 'student' && user?.id === 'student-2' ? user.name : '학생 B',
              rank: 3,
              score: 680,
              rankChange: -2,
              avatar: undefined,
              badges: ['💎']
            }
          ].concat([...Array(7)].map((_, i) => ({
            id: `entry-${i + 4}`,
            studentId: `student-${i + 4}`,
            studentName: `학생 ${String.fromCharCode(68 + i)}`,
            rank: i + 4,
            score: 650 - (i * 80),
            rankChange: Math.floor(Math.random() * 7) - 3,
            avatar: undefined,
            badges: Math.random() > 0.8 ? ['⭐'] : []
          }))),
          totalEntries: 47,
          lastUpdated: new Date().toISOString(),
          periodStart: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          periodEnd: new Date().toISOString(),
          currentUserRank: user?.role === 'student' ? {
            rank: user.id === 'student-1' ? 1 :
                  user.id === 'student-2' ? 3 :
                  user.id === 'student-3' ? 2 : 18,
            score: user.id === 'student-1' ? 850 :
                   user.id === 'student-2' ? 680 :
                   user.id === 'student-3' ? 720 : 150,
            percentile: user.id === 'student-1' ? 98 :
                       user.id === 'student-2' ? 94 :
                       user.id === 'student-3' ? 96 : 62
          } : undefined
        }
      };

      return mockLeaderboards;
    },
    enabled: !!user?.id,
    refetchInterval: 2 * 60 * 1000 // 2분마다 갱신
  });

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const getRankChangeIcon = (change?: number): { icon: string; color: string } => {
    if (!change || change === 0) return { icon: '➖', color: 'text-gray-400' };
    if (change > 0) return { icon: '🔺', color: 'text-green-500' };
    return { icon: '🔻', color: 'text-red-500' };
  };

  const getScoreLabel = (type: string): string => {
    switch (type) {
      case 'token_balance': return '토큰';
      case 'token_earned': return '토큰';
      case 'achievements': return '개';
      case 'weekly_tokens': return '토큰';
      default: return '점';
    }
  };

  const getBoardDescription = (type: string): string => {
    switch (type) {
      case 'token_balance': return '현재 보유하고 있는 토큰 수량';
      case 'token_earned': return '지금까지 획득한 총 토큰 수량';
      case 'achievements': return '달성한 업적의 총 개수';
      case 'weekly_tokens': return '이번 주에 획득한 토큰 수량';
      default: return '';
    }
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

  const currentBoard = data?.[selectedBoard];

  return (
    <FeatureGuard feature="leaderboards">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏆 리더보드</h1>
            <p className="text-gray-600">전체 학생들의 성과 순위</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value as typeof selectedBoard)}
            >
              <option value="token_balance">토큰 잔액 순위</option>
              <option value="token_earned">총 획득 토큰 순위</option>
              <option value="achievements">업적 달성 순위</option>
              <option value="weekly_tokens">주간 토큰 순위</option>
            </Select>
            
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

        {/* currentBoard가 없으면 렌더링하지 않음 */}
        {!currentBoard && <div className="text-center py-8">데이터를 불러오는 중...</div>}
        {currentBoard && (
          <>
            {/* 내 순위 카드 (학생만) */}
        {user.role === 'student' && currentBoard?.currentUserRank && (
          <Card className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <h3 className="text-lg font-semibold mb-4 text-purple-800">내 현재 순위</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">
                  {getRankIcon(currentBoard.currentUserRank.rank) || '🎯'}
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {currentBoard.currentUserRank.rank}위
                  </div>
                  <div className="text-sm text-gray-600">
                    상위 {Math.round(100 - currentBoard.currentUserRank.percentile)}%
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {currentBoard.currentUserRank.score.toLocaleString()}
                  <span className="text-sm ml-1">{getScoreLabel(currentBoard.type)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {getBoardDescription(currentBoard.type)}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 리더보드 정보 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">{currentBoard.displayName}</h2>
            <p className="text-sm text-gray-600">{getBoardDescription(currentBoard.type)}</p>
            {currentBoard.periodStart && currentBoard.periodEnd && (
              <p className="text-xs text-gray-500 mt-1">
                기간: {new Date(currentBoard.periodStart).toLocaleDateString()} - {new Date(currentBoard.periodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600">총 참가자</div>
            <div className="text-lg font-bold">{currentBoard.totalEntries.toLocaleString()}명</div>
            <div className="text-xs text-gray-500">
              최종 업데이트: {new Date(currentBoard.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* TOP 3 하이라이트 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {currentBoard.entries.slice(0, 3).map((entry) => (
            <Card 
              key={entry.id} 
              className={`p-6 text-center ${
                isMyRanking(entry.studentId) ? 'ring-2 ring-purple-400 bg-purple-50' : ''
              } ${
                entry.rank === 1 ? 'bg-gradient-to-b from-yellow-50 to-orange-50' :
                entry.rank === 2 ? 'bg-gradient-to-b from-gray-50 to-gray-100' :
                'bg-gradient-to-b from-orange-50 to-red-50'
              }`}
            >
              <div className="text-4xl mb-2">{getRankIcon(entry.rank)}</div>
              <div className="text-lg font-semibold mb-1">{entry.studentName}</div>
              {entry.badges.length > 0 && (
                <div className="flex justify-center space-x-1 mb-2">
                  {entry.badges.map((badge, idx) => (
                    <span key={idx} className="text-lg">{badge}</span>
                  ))}
                </div>
              )}
              <div className="text-2xl font-bold mb-2 text-blue-600">
                {entry.score.toLocaleString()}
                <span className="text-sm ml-1">{getScoreLabel(currentBoard.type)}</span>
              </div>
              {entry.rankChange !== undefined && entry.rankChange !== 0 && (
                <div className="flex items-center justify-center space-x-1">
                  <span className={`text-xs ${getRankChangeIcon(entry.rankChange).color}`}>
                    {getRankChangeIcon(entry.rankChange).icon}
                  </span>
                  <span className={`text-xs ${getRankChangeIcon(entry.rankChange).color}`}>
                    {Math.abs(entry.rankChange)}
                  </span>
                </div>
              )}
              {isMyRanking(entry.studentId) && (
                <Badge className="mt-2 bg-purple-100 text-purple-800 text-xs">나</Badge>
              )}
            </Card>
          ))}
        </div>

        {/* 전체 순위표 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">전체 순위</h3>
          <div className="space-y-2">
            {currentBoard.entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                  isMyRanking(entry.studentId)
                    ? 'bg-purple-100 border border-purple-200'
                    : index < 3
                    ? 'bg-yellow-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 w-16">
                    <span className="text-xl">{getRankIcon(entry.rank)}</span>
                    <span className="text-lg font-semibold">
                      {entry.rank}
                    </span>
                  </div>
                  
                  <Avatar 
                    name={entry.studentName}
                    size="md"
                  />
                  
                  <div>
                    <div className="font-medium">
                      {entry.studentName}
                      {isMyRanking(entry.studentId) && (
                        <Badge className="ml-2 bg-purple-100 text-purple-800 text-xs">나</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center space-x-2">
                      {entry.badges.length > 0 && (
                        <div className="flex space-x-1">
                          {entry.badges.map((badge, idx) => (
                            <span key={idx} className="text-sm">{badge}</span>
                          ))}
                        </div>
                      )}
                      {entry.rankChange !== undefined && entry.rankChange !== 0 && (
                        <div className="flex items-center space-x-1">
                          <span className={`${getRankChangeIcon(entry.rankChange).color}`}>
                            {getRankChangeIcon(entry.rankChange).icon}
                          </span>
                          <span className={`text-xs ${getRankChangeIcon(entry.rankChange).color}`}>
                            {Math.abs(entry.rankChange)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getScoreLabel(currentBoard.type)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {currentBoard.entries.length < currentBoard.totalEntries && (
            <div className="text-center mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {currentBoard.totalEntries - currentBoard.entries.length}명의 추가 참가자가 있습니다
              </p>
              <Button variant="outline" className="mt-2" onClick={() => setLimit(50)}>
                더 보기
              </Button>
            </div>
          )}
        </Card>

        {/* 순위 상승 팁 */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50">
          <h3 className="text-lg font-semibold mb-3 text-green-800">💡 순위 상승 팁</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-green-600">🎯</span>
                <span>매일 꾸준한 문제 풀이로 토큰 적립</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600">🔥</span>
                <span>연속 학습 스트릭 유지로 보너스 토큰</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600">🏆</span>
                <span>어려운 문제 도전으로 고득점 획득</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">⭐</span>
                <span>업적 달성으로 추가 점수와 배지 획득</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">📈</span>
                <span>정답률 향상으로 효율성 점수 증가</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">🎊</span>
                <span>특별 이벤트 참여로 대량 점수 획득</span>
              </div>
            </div>
          </div>
        </Card>
          </>
        )}
      </div>
    </FeatureGuard>
  );
};