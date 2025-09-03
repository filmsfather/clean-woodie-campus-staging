import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Button } from '../ui/Button';

interface TokenStats {
  totalBalance: number;
  totalEarned: number;
  totalSpent: number;
  recentEarnings: number;
  rank?: number;
  percentile?: number;
}

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl?: string;
  tokenReward: number;
  earnedAt?: string;
  isRecent: boolean;
}

interface LeaderboardEntry {
  rank: number;
  score: number;
  percentile: number;
}

interface RecommendedReward {
  id: string;
  name: string;
  description: string;
  tokenCost: number;
  iconUrl?: string;
  canAfford: boolean;
}

interface ActivityFeedItem {
  id: string;
  type: 'token_earned' | 'achievement_earned' | 'reward_redeemed' | 'rank_changed';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
  value?: number;
}

interface GamificationData {
  tokenStats: TokenStats;
  achievements: Achievement[];
  myRankings: {
    tokenBalance: LeaderboardEntry | null;
    tokenEarned: LeaderboardEntry | null;
    achievements: LeaderboardEntry | null;
    weeklyTokens: LeaderboardEntry | null;
  };
  recommendedRewards: RecommendedReward[];
  activityFeed: ActivityFeedItem[];
  weeklyProgress: {
    tokensEarned: number;
    achievementsEarned: number;
    rankImprovement: number;
  };
}

export const GamificationDashboard: React.FC = () => {
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gamification/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async (rewardCode: string) => {
    try {
      const response = await fetch('/api/gamification/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rewardCode }),
      });

      if (!response.ok) {
        throw new Error('Failed to redeem reward');
      }

      // 대시보드 데이터 새로고침
      fetchDashboardData();
    } catch (err) {
      console.error('Error redeeming reward:', err);
      // TODO: 에러 토스트 표시
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <Button onClick={fetchDashboardData} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">게임화 대시보드</h1>
        <p className="opacity-90">학습을 통해 토큰을 획득하고 업적을 달성하세요!</p>
      </div>

      {/* 토큰 및 순위 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">현재 토큰</p>
              <p className="text-2xl font-bold text-blue-600">{data.tokenStats.totalBalance.toLocaleString()}</p>
            </div>
            <div className="text-3xl">🪙</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 획득 토큰</p>
              <p className="text-2xl font-bold text-green-600">{data.tokenStats.totalEarned.toLocaleString()}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">업적 개수</p>
              <p className="text-2xl font-bold text-purple-600">{data.achievements.length}</p>
            </div>
            <div className="text-3xl">🏆</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 순위</p>
              <p className="text-2xl font-bold text-orange-600">
                {data.myRankings.tokenEarned ? `#${data.myRankings.tokenEarned.rank}` : 'N/A'}
              </p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </Card>
      </div>

      {/* 이번 주 진행 상황 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">이번 주 진행 상황</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">획득 토큰</p>
            <p className="text-lg font-semibold text-blue-600">
              {data.weeklyProgress.tokensEarned.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">새로운 업적</p>
            <p className="text-lg font-semibold text-purple-600">
              {data.weeklyProgress.achievementsEarned}개
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">순위 변동</p>
            <p className={`text-lg font-semibold ${
              data.weeklyProgress.rankImprovement > 0 ? 'text-green-600' : 
              data.weeklyProgress.rankImprovement < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {data.weeklyProgress.rankImprovement > 0 ? '+' : ''}
              {data.weeklyProgress.rankImprovement}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 업적 */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">최근 업적</h2>
          <div className="space-y-3">
            {data.achievements.slice(0, 5).map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl">{achievement.iconUrl || '🏆'}</div>
                <div className="flex-1">
                  <p className="font-medium">{achievement.name}</p>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  {achievement.isRecent && (
                    <Badge className="mt-1 bg-green-100 text-green-800">새로 획득!</Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-blue-600">+{achievement.tokenReward}</p>
                  <p className="text-xs text-gray-500">토큰</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 추천 보상 */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">추천 보상</h2>
          <div className="space-y-3">
            {data.recommendedRewards.map((reward) => (
              <div key={reward.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="text-2xl">{reward.iconUrl || '🎁'}</div>
                <div className="flex-1">
                  <p className="font-medium">{reward.name}</p>
                  <p className="text-sm text-gray-600">{reward.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-blue-600">{reward.tokenCost.toLocaleString()}</p>
                  <Button
                    size="sm"
                    disabled={!reward.canAfford}
                    onClick={() => redeemReward(reward.id)}
                    className="mt-1"
                  >
                    교환
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 활동 피드 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">최근 활동</h2>
        <div className="space-y-3">
          {data.activityFeed.slice(0, 10).map((item) => (
            <div key={item.id} className="flex items-center space-x-3 p-3 border-l-4 border-blue-200 bg-blue-50 rounded-r-lg">
              <div className="text-xl">{item.icon || getActivityIcon(item.type)}</div>
              <div className="flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleDateString()}
                </p>
                {item.value && (
                  <p className="text-sm font-medium text-blue-600">+{item.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

function getActivityIcon(type: string): string {
  switch (type) {
    case 'token_earned':
      return '🪙';
    case 'achievement_earned':
      return '🏆';
    case 'reward_redeemed':
      return '🎁';
    case 'rank_changed':
      return '📈';
    default:
      return '📝';
  }
}