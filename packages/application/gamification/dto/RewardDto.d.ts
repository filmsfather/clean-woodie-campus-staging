export interface RewardDto {
    id: string;
    code: string;
    name: string;
    description: string;
    category: 'digital_badge' | 'feature_unlock' | 'virtual_item' | 'special_privilege' | 'cosmetic';
    tokenCost: number;
    maxRedemptions?: number;
    currentRedemptions: number;
    remainingStock?: number;
    isActive: boolean;
    iconUrl?: string;
    expiresAt?: string;
    createdAt: string;
    isAvailable: boolean;
    canAfford: boolean;
}
export interface RewardRedemptionDto {
    id: string;
    studentId: string;
    rewardId: string;
    reward?: RewardDto;
    tokenCost: number;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    redeemedAt: string;
    completedAt?: string;
    failureReason?: string;
    processingTimeMinutes?: number;
}
export interface RewardCategoryDto {
    category: string;
    displayName: string;
    rewards: RewardDto[];
    totalCount: number;
}
export interface RedemptionStatsDto {
    totalRedemptions: number;
    totalTokensSpent: number;
    successfulRedemptions: number;
    failedRedemptions: number;
    pendingRedemptions: number;
    averageRedemptionValue: number;
    mostPopularReward?: {
        rewardId: string;
        rewardName: string;
        count: number;
    };
}
//# sourceMappingURL=RewardDto.d.ts.map