import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FeatureGuard } from '../../components/auth/FeatureGuard';
import { Button, Card, Badge, Avatar, Select, Modal } from '../../components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RewardDto, RewardRedemptionDto } from '@woodie/application';

// Application Layer DTO 타입 직접 사용 (DTO-First 원칙)
interface GetAvailableRewardsResponse {
  rewards: RewardDto[];
  categories: Array<{
    category: string;
    displayName: string;
    rewards: RewardDto[];
    totalCount: number;
  }>;
  studentTokenBalance: number;
  recentRedemptions: RewardRedemptionDto[];
}

interface RedeemRewardRequest {
  studentId: string;
  rewardCode: string;
}

/**
 * RedeemRewardUseCase → RewardRedemptionPage
 * 보상 카탈로그 및 교환 UI 표면
 */
export const RewardRedemptionPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedReward, setSelectedReward] = useState<RewardDto | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const queryClient = useQueryClient();

  // GetAvailableRewards 호출 (가상의 UseCase)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['availableRewards', user?.id, selectedCategory],
    queryFn: async (): Promise<GetAvailableRewardsResponse> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock 데이터 (Application DTO 형태)
      const mockRewards: RewardDto[] = [
        {
          id: 'reward-1',
          code: 'digital-badge-first-place',
          name: '1등 달성 배지',
          description: '처음으로 1등을 달성한 학생에게 주어지는 특별한 배지입니다.',
          category: 'digital_badge',
          tokenCost: 500,
          maxRedemptions: undefined,
          currentRedemptions: 12,
          remainingStock: undefined,
          isActive: true,
          iconUrl: '🥇',
          expiresAt: undefined,
          createdAt: new Date().toISOString(),
          isAvailable: true,
          canAfford: (user?.role === 'student' && mockTokenBalance >= 500) || false
        },
        {
          id: 'reward-2',
          code: 'feature-unlock-advanced-stats',
          name: '고급 통계 기능 잠금 해제',
          description: '상세한 학습 분석과 개인 맞춤 리포트를 확인할 수 있는 기능을 7일간 이용할 수 있습니다.',
          category: 'feature_unlock',
          tokenCost: 300,
          maxRedemptions: 1,
          currentRedemptions: 0,
          remainingStock: 1,
          isActive: true,
          iconUrl: '📊',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          isAvailable: true,
          canAfford: (user?.role === 'student' && mockTokenBalance >= 300) || false
        },
        {
          id: 'reward-3',
          code: 'virtual-item-study-pet',
          name: '공부 펫 (가상 동물)',
          description: '학습을 도와주는 귀여운 가상 펫입니다. 스트릭이 유지될수록 더 건강해집니다.',
          category: 'virtual_item',
          tokenCost: 800,
          maxRedemptions: undefined,
          currentRedemptions: 5,
          remainingStock: undefined,
          isActive: true,
          iconUrl: '🐾',
          expiresAt: undefined,
          createdAt: new Date().toISOString(),
          isAvailable: true,
          canAfford: (user?.role === 'student' && mockTokenBalance >= 800) || false
        },
        {
          id: 'reward-4',
          code: 'special-privilege-hint-pack',
          name: '문제 힌트 팩 (5개)',
          description: '어려운 문제에서 사용할 수 있는 힌트 5개를 제공합니다.',
          category: 'special_privilege',
          tokenCost: 200,
          maxRedemptions: 10,
          currentRedemptions: 3,
          remainingStock: 7,
          isActive: true,
          iconUrl: '💡',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          isAvailable: true,
          canAfford: (user?.role === 'student' && mockTokenBalance >= 200) || false
        },
        {
          id: 'reward-5',
          code: 'cosmetic-theme-dark-mode',
          name: '다크 모드 테마',
          description: '눈이 편안한 다크 모드 테마를 영구적으로 사용할 수 있습니다.',
          category: 'cosmetic',
          tokenCost: 150,
          maxRedemptions: 1,
          currentRedemptions: 0,
          remainingStock: 1,
          isActive: true,
          iconUrl: '🌙',
          expiresAt: undefined,
          createdAt: new Date().toISOString(),
          isAvailable: true,
          canAfford: (user?.role === 'student' && mockTokenBalance >= 150) || false
        },
        {
          id: 'reward-6',
          code: 'digital-badge-streak-master',
          name: '스트릭 마스터 배지',
          description: '30일 연속 학습을 달성한 학생에게 주어지는 명예 배지입니다.',
          category: 'digital_badge',
          tokenCost: 1000,
          maxRedemptions: undefined,
          currentRedemptions: 2,
          remainingStock: undefined,
          isActive: true,
          iconUrl: '🔥',
          expiresAt: undefined,
          createdAt: new Date().toISOString(),
          isAvailable: false, // 조건 미충족
          canAfford: false
        }
      ];

      const mockTokenBalance = user?.role === 'student' ? 
        (user.id === 'student-1' ? 850 :
         user.id === 'student-2' ? 620 :
         user.id === 'student-3' ? 350 : 180) : 0;

      const categories = [
        {
          category: 'digital_badge',
          displayName: '디지털 배지',
          rewards: mockRewards.filter(r => r.category === 'digital_badge'),
          totalCount: mockRewards.filter(r => r.category === 'digital_badge').length
        },
        {
          category: 'feature_unlock',
          displayName: '기능 잠금 해제',
          rewards: mockRewards.filter(r => r.category === 'feature_unlock'),
          totalCount: mockRewards.filter(r => r.category === 'feature_unlock').length
        },
        {
          category: 'virtual_item',
          displayName: '가상 아이템',
          rewards: mockRewards.filter(r => r.category === 'virtual_item'),
          totalCount: mockRewards.filter(r => r.category === 'virtual_item').length
        },
        {
          category: 'special_privilege',
          displayName: '특별 혜택',
          rewards: mockRewards.filter(r => r.category === 'special_privilege'),
          totalCount: mockRewards.filter(r => r.category === 'special_privilege').length
        },
        {
          category: 'cosmetic',
          displayName: '외관 변경',
          rewards: mockRewards.filter(r => r.category === 'cosmetic'),
          totalCount: mockRewards.filter(r => r.category === 'cosmetic').length
        }
      ];

      const recentRedemptions: RewardRedemptionDto[] = user?.role === 'student' ? [
        {
          id: 'redemption-1',
          studentId: user.id,
          rewardId: 'reward-4',
          reward: mockRewards.find(r => r.id === 'reward-4'),
          tokenCost: 200,
          status: 'completed',
          redeemedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          processingTimeMinutes: 0
        }
      ] : [];

      return {
        rewards: mockRewards,
        categories,
        studentTokenBalance: mockTokenBalance,
        recentRedemptions
      };
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000 // 5분마다 갱신
  });

  // RedeemRewardUseCase 호출
  const redeemMutation = useMutation({
    mutationFn: async (request: RedeemRewardRequest): Promise<RewardRedemptionDto> => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock 응답
      const reward = data?.rewards.find(r => r.code === request.rewardCode);
      if (!reward) {
        throw new Error('Reward not found');
      }

      if (!reward.canAfford) {
        throw new Error('Insufficient tokens');
      }

      if (!reward.isAvailable) {
        throw new Error('Reward not available');
      }

      const mockRedemption: RewardRedemptionDto = {
        id: `redemption-${Date.now()}`,
        studentId: request.studentId,
        rewardId: reward.id,
        reward,
        tokenCost: reward.tokenCost,
        status: 'completed',
        redeemedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        processingTimeMinutes: 0
      };

      return mockRedemption;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableRewards'] });
      setShowRedemptionModal(false);
      setSelectedReward(null);
    }
  });

  const mockTokenBalance = data?.studentTokenBalance || 0;

  const getCategoryDisplayName = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'all': '전체',
      'digital_badge': '디지털 배지',
      'feature_unlock': '기능 잠금 해제', 
      'virtual_item': '가상 아이템',
      'special_privilege': '특별 혜택',
      'cosmetic': '외관 변경'
    };
    return categoryMap[category] || category;
  };

  const getFilteredRewards = (): RewardDto[] => {
    if (!data) return [];
    if (selectedCategory === 'all') return data.rewards;
    return data.rewards.filter(reward => reward.category === selectedCategory);
  };

  const getExpiryText = (expiresAt?: string): string => {
    if (!expiresAt) return '';
    
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return '곧 만료';
    if (diffDays === 1) return '1일 후 만료';
    return `${diffDays}일 후 만료`;
  };

  const handleRedeemClick = (reward: RewardDto) => {
    if (!reward.canAfford || !reward.isAvailable || !user) return;
    
    setSelectedReward(reward);
    setShowRedemptionModal(true);
  };

  const handleConfirmRedemption = () => {
    if (!selectedReward || !user) return;

    redeemMutation.mutate({
      studentId: user.id,
      rewardCode: selectedReward.code
    });
  };

  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  if (user.role !== 'student') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6 text-center">
          <p className="text-gray-600">학생만 이용할 수 있는 기능입니다.</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
          <p className="text-red-600">보상 목록을 불러올 수 없습니다.</p>
          <Button onClick={() => refetch()} className="mt-4">
            다시 시도
          </Button>
        </Card>
      </div>
    );
  }

  const filteredRewards = getFilteredRewards();

  return (
    <FeatureGuard feature="rewards">
      <div className="max-w-6xl mx-auto p-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🎁 보상 상점</h1>
            <p className="text-gray-600">토큰으로 다양한 보상을 교환하세요</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 토큰 잔액 */}
            <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🪙</span>
                <div>
                  <div className="text-lg font-bold text-yellow-700">
                    {mockTokenBalance.toLocaleString()}
                  </div>
                  <div className="text-xs text-yellow-600">보유 토큰</div>
                </div>
              </div>
            </Card>
            
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">전체 카테고리</option>
              {data.categories.map((category) => (
                <option key={category.category} value={category.category}>
                  {category.displayName} ({category.totalCount})
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* 최근 교환 내역 */}
        {data.recentRedemptions.length > 0 && (
          <Card className="mb-8 p-6 bg-green-50 border-green-200">
            <h3 className="text-lg font-semibold mb-4 text-green-800">최근 교환한 보상</h3>
            <div className="space-y-3">
              {data.recentRedemptions.map((redemption) => (
                <div key={redemption.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{redemption.reward?.iconUrl}</span>
                    <div>
                      <div className="font-medium">{redemption.reward?.name}</div>
                      <div className="text-sm text-gray-600 flex items-center space-x-2">
                        <Badge 
                          className={`text-xs ${
                            redemption.status === 'completed' ? 'bg-green-100 text-green-800' :
                            redemption.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {redemption.status === 'completed' ? '완료' :
                           redemption.status === 'pending' ? '진행중' : '실패'}
                        </Badge>
                        <span>{new Date(redemption.redeemedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-yellow-600">-{redemption.tokenCost} 토큰</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 보상 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward) => (
            <Card 
              key={reward.id} 
              className={`p-6 transition-all duration-200 ${
                reward.canAfford && reward.isAvailable 
                  ? 'hover:shadow-lg hover:scale-105 cursor-pointer' 
                  : 'opacity-60'
              }`}
              onClick={() => reward.canAfford && reward.isAvailable && handleRedeemClick(reward)}
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{reward.iconUrl}</div>
                <h3 className="text-lg font-semibold mb-1">{reward.name}</h3>
                <Badge className={`text-xs ${
                  reward.category === 'digital_badge' ? 'bg-purple-100 text-purple-800' :
                  reward.category === 'feature_unlock' ? 'bg-blue-100 text-blue-800' :
                  reward.category === 'virtual_item' ? 'bg-pink-100 text-pink-800' :
                  reward.category === 'special_privilege' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {getCategoryDisplayName(reward.category)}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {reward.description}
              </p>
              
              <div className="space-y-2 mb-4">
                {/* 재고 정보 */}
                {reward.remainingStock !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span>남은 수량:</span>
                    <span className={reward.remainingStock > 0 ? 'text-green-600' : 'text-red-600'}>
                      {reward.remainingStock > 0 ? `${reward.remainingStock}개` : '품절'}
                    </span>
                  </div>
                )}
                
                {/* 만료일 정보 */}
                {reward.expiresAt && (
                  <div className="flex justify-between text-sm">
                    <span>만료:</span>
                    <span className="text-orange-600">{getExpiryText(reward.expiresAt)}</span>
                  </div>
                )}
                
                {/* 교환 횟수 */}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>교환된 횟수:</span>
                  <span>{reward.currentRedemptions}회</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <span className="text-lg">🪙</span>
                  <span className={`text-lg font-bold ${
                    reward.canAfford ? 'text-yellow-600' : 'text-red-500'
                  }`}>
                    {reward.tokenCost.toLocaleString()}
                  </span>
                </div>
                
                <Button
                  size="sm"
                  disabled={!reward.canAfford || !reward.isAvailable || redeemMutation.isPending}
                  className={
                    reward.canAfford && reward.isAvailable 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-gray-300'
                  }
                >
                  {!reward.isAvailable ? '이용불가' :
                   !reward.canAfford ? '토큰부족' : '교환하기'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredRewards.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">선택한 카테고리에 보상이 없습니다</h3>
            <p className="text-gray-600">다른 카테고리를 확인해보세요</p>
            <Button 
              onClick={() => setSelectedCategory('all')} 
              className="mt-4"
            >
              전체 보상 보기
            </Button>
          </Card>
        )}

        {/* 교환 확인 모달 */}
        <Modal 
          isOpen={showRedemptionModal} 
          onClose={() => setShowRedemptionModal(false)}
          title="보상 교환 확인"
        >
          {selectedReward && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">{selectedReward.iconUrl}</div>
                <h3 className="text-lg font-semibold">{selectedReward.name}</h3>
              </div>
              
              <p className="text-sm text-gray-600">{selectedReward.description}</p>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span>소모될 토큰:</span>
                  <span className="text-lg font-bold text-yellow-600">
                    🪙 {selectedReward.tokenCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span>교환 후 잔액:</span>
                  <span className="font-medium">
                    🪙 {(mockTokenBalance - selectedReward.tokenCost).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowRedemptionModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={redeemMutation.isPending}
                >
                  취소
                </Button>
                <Button
                  onClick={handleConfirmRedemption}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={redeemMutation.isPending}
                >
                  {redeemMutation.isPending ? '교환 중...' : '교환 확인'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* 토큰 획득 안내 */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">💡 토큰 획득 방법</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">📚</span>
                <span>문제를 정확히 풀 때마다 토큰 획득</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">🔥</span>
                <span>연속 학습(스트릭) 유지 시 보너스 토큰</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">🎯</span>
                <span>일일 학습 목표 달성 시 추가 토큰</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-purple-600">🏆</span>
                <span>문제집 완주 시 대량 토큰 지급</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-purple-600">⭐</span>
                <span>업적 달성 시 특별 토큰 보상</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-purple-600">🎊</span>
                <span>이벤트 참여로 추가 토큰 기회</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </FeatureGuard>
  );
};