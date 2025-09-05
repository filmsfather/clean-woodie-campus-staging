import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IProblemSetRepository } from '@woodie/domain';
/**
 * 공유된 문제집 검색 UseCase
 *
 * 비즈니스 규칙:
 * - 교사는 다른 교사들이 공유한 문제집을 검색할 수 있음
 * - 학생은 공개된(isPublic=true) 문제집만 검색 가능
 * - 관리자는 모든 공유/공개 문제집 검색 가능
 * - 자신의 문제집은 검색 결과에서 제외
 * - 제목, 설명, 교사명으로 검색 가능
 * - 난이도, 문제 수, 주제별 필터링 지원
 */
export interface SearchSharedProblemSetsRequest {
    requesterId: string;
    requesterRole: 'student' | 'teacher' | 'admin';
    searchQuery?: string;
    filters?: {
        excludeOwnProblemSets?: boolean;
        minItemCount?: number;
        maxItemCount?: number;
        isPublicOnly?: boolean;
        teacherIds?: string[];
        tags?: string[];
        difficultyLevel?: 'easy' | 'medium' | 'hard' | 'mixed';
        createdAfter?: Date;
        createdBefore?: Date;
    };
    sorting?: {
        field: 'title' | 'createdAt' | 'updatedAt' | 'itemCount' | 'popularity';
        order: 'asc' | 'desc';
    };
    pagination?: {
        page: number;
        limit: number;
    };
}
export interface SearchSharedProblemSetsResponse {
    problemSets: Array<{
        id: string;
        title: string;
        description?: string;
        teacherId: string;
        teacherName?: string;
        itemCount: number;
        totalPoints?: number;
        estimatedTimeMinutes?: number;
        isPublic: boolean;
        isShared: boolean;
        tags?: string[];
        difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
        popularity?: number;
        createdAt: Date;
        updatedAt: Date;
        canClone: boolean;
        canView: boolean;
    }>;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
    aggregations: {
        totalSharedSets: number;
        totalPublicSets: number;
        popularTags: Array<{
            tag: string;
            count: number;
        }>;
        teacherStats: Array<{
            teacherId: string;
            teacherName?: string;
            sharedCount: number;
        }>;
    };
}
export declare class SearchSharedProblemSetsUseCase extends BaseUseCase<SearchSharedProblemSetsRequest, SearchSharedProblemSetsResponse> {
    private problemSetRepository;
    constructor(problemSetRepository: IProblemSetRepository);
    execute(request: SearchSharedProblemSetsRequest): Promise<Result<SearchSharedProblemSetsResponse>>;
    private validateRequest;
    private getAccessibleProblemSets;
    private applySearchFilters;
    private applySorting;
    private enhanceProblemSetsWithMetadata;
    private generateAggregations;
    private generateTeacherStats;
    private calculateTotalPoints;
    private calculateEstimatedTime;
    private extractTags;
    private analyzeDifficulty;
    private calculatePopularity;
    private canClone;
    private canView;
}
//# sourceMappingURL=SearchSharedProblemSetsUseCase.d.ts.map