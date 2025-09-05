export interface TokenDto {
    id: string;
    studentId: string;
    balance: number;
    totalEarned: number;
    totalSpent: number;
    updatedAt: string;
}
export interface TokenTransactionDto {
    id: string;
    studentId: string;
    type: 'earned' | 'spent';
    amount: number;
    reason: string;
    createdAt: string;
}
export interface TokenStatsDto {
    totalBalance: number;
    totalEarned: number;
    totalSpent: number;
    recentEarnings: number;
    rank?: number;
    percentile?: number;
}
//# sourceMappingURL=TokenDto.d.ts.map