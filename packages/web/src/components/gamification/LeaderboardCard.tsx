import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface LeaderboardEntry {
  id: string;
  studentId: string;
  studentName: string;
  rank: number;
  score: number;
  rankChange?: number;
  avatar?: string;
  badges?: string[];
}

interface LeaderboardData {
  type: string;
  displayName: string;
  entries: LeaderboardEntry[];
  currentUserRank?: {
    rank: number;
    score: number;
    percentile: number;
  };
}

interface LeaderboardCardProps {
  type: 'token_balance' | 'token_earned' | 'achievements' | 'weekly_tokens';
  title: string;
  className?: string;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ 
  type, 
  title, 
  className = '' 
}) => {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, [type]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gamification/leaderboards?limit=10');
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }

      const result = await response.json();
      setData(result[type]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏅';
    }
  };

  const getRankChangeIcon = (change?: number): string | null => {
    if (change === undefined) return null;
    if (change > 0) return '📈';
    if (change < 0) return '📉';
    return '➖';
  };

  const formatScore = (score: number, type: string): string => {
    switch (type) {
      case 'token_balance':
      case 'token_earned':
      case 'weekly_tokens':
        return `${score.toLocaleString()} 토큰`;
      case 'achievements':
        return `${score}개`;
      default:
        return score.toString();
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">데이터를 불러올 수 없습니다</p>
          <button 
            onClick={fetchLeaderboardData}
            className="text-sm text-blue-600 hover:underline"
          >
            다시 시도
          </button>
        </div>
      </Card>
    );
  }

  if (!data || !data.entries.length) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">아직 데이터가 없습니다</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{title}</h3>
        {data.currentUserRank && (
          <Badge className="bg-blue-100 text-blue-800">
            내 순위: #{data.currentUserRank.rank}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {data.entries.map((entry) => (
          <div 
            key={entry.id} 
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              data.currentUserRank && entry.rank === data.currentUserRank.rank
                ? 'bg-blue-50 border-2 border-blue-200'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {/* 순위 아이콘 */}
            <div className="flex items-center justify-center w-8 h-8">
              <span className="text-lg">{getRankIcon(entry.rank)}</span>
            </div>

            {/* 학생 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="font-medium text-gray-900 truncate">
                  {entry.studentName}
                </p>
                {entry.badges && entry.badges.map((badge, i) => (
                  <span key={i} className="text-xs">{badge}</span>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                {formatScore(entry.score, type)}
              </p>
            </div>

            {/* 순위 변동 */}
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-gray-700">
                #{entry.rank}
              </span>
              {getRankChangeIcon(entry.rankChange) && (
                <div className="flex items-center space-x-1 text-xs">
                  <span>{getRankChangeIcon(entry.rankChange)}</span>
                  <span className={
                    entry.rankChange && entry.rankChange > 0 
                      ? 'text-green-600' 
                      : entry.rankChange && entry.rankChange < 0 
                      ? 'text-red-600' 
                      : 'text-gray-500'
                  }>
                    {entry.rankChange && Math.abs(entry.rankChange)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 현재 사용자 순위가 표시된 범위 밖에 있는 경우 */}
      {data.currentUserRank && data.currentUserRank.rank > data.entries.length && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">내 순위</p>
              <p className="text-sm text-blue-700">
                {formatScore(data.currentUserRank.score, type)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-900">
                #{data.currentUserRank.rank}
              </p>
              <p className="text-xs text-blue-600">
                상위 {data.currentUserRank.percentile}%
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};