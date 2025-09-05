import { Result } from '@woodie/domain/common/Result';
import { Problem } from '@woodie/domain/problems/entities/Problem';
export interface ProblemSearchCriteria {
    searchTerm?: string;
    tags?: string[];
    difficultyLevel?: number;
    difficultyRange?: {
        min: number;
        max: number;
    };
    teacherId?: string;
    isActive?: boolean;
    createdAfter?: string;
    createdBefore?: string;
    offset?: number;
    limit?: number;
}
export interface ProblemSearchResult {
    problems: Problem[];
    totalCount: number;
}
/**
 * Problem Search Service Interface
 * Clean Architecture Output Port - 도메인 서비스를 위한 인터페이스
 *
 * Application Layer가 Infrastructure Layer에 의존하지 않도록
 * 추상화된 인터페이스를 제공합니다.
 */
export interface IProblemSearchService {
    /**
     * 문제 검색
     *
     * @param criteria - 검색 조건
     * @returns 검색된 문제 목록과 총 개수
     */
    searchProblems(criteria: ProblemSearchCriteria): Promise<Result<ProblemSearchResult>>;
    /**
     * 특정 문제 ID로 문제 찾기
     *
     * @param problemId - 문제 ID
     * @param requesterId - 요청자 ID (권한 검증용)
     * @returns 문제 엔티티
     */
    findProblemById(problemId: string, requesterId?: string): Promise<Result<Problem>>;
    /**
     * 교사 ID로 문제 목록 조회
     *
     * @param teacherId - 교사 ID
     * @param includeInactive - 비활성 문제 포함 여부
     * @returns 문제 목록
     */
    findProblemsByTeacher(teacherId: string, includeInactive?: boolean): Promise<Result<Problem[]>>;
    /**
     * 태그로 문제 검색
     *
     * @param tags - 태그 목록
     * @param teacherId - 교사 ID (선택적)
     * @returns 해당 태그를 가진 문제 목록
     */
    findProblemsByTags(tags: string[], teacherId?: string): Promise<Result<Problem[]>>;
    /**
     * 인기 문제 조회
     *
     * @param limit - 반환할 최대 개수
     * @param teacherId - 교사 ID (선택적)
     * @returns 인기 문제 목록
     */
    findPopularProblems(limit?: number, teacherId?: string): Promise<Result<Problem[]>>;
}
//# sourceMappingURL=IProblemSearchService.d.ts.map