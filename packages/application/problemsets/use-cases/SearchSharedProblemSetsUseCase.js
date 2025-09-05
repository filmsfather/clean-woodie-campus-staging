import { BaseUseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
export class SearchSharedProblemSetsUseCase extends BaseUseCase {
    problemSetRepository;
    constructor(problemSetRepository) {
        super();
        this.problemSetRepository = problemSetRepository;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            // 2. 권한별 접근 가능한 문제집 결정
            const accessibleProblemSets = await this.getAccessibleProblemSets(request);
            if (accessibleProblemSets.isFailure) {
                return Result.fail(accessibleProblemSets.error);
            }
            // 3. 검색 필터 적용
            let filteredProblemSets = this.applySearchFilters(accessibleProblemSets.value, request.searchQuery, request.filters);
            // 4. 자신의 문제집 제외 (기본값: true)
            if (request.filters?.excludeOwnProblemSets !== false) {
                filteredProblemSets = filteredProblemSets.filter(ps => ps.teacherId !== request.requesterId);
            }
            // 5. 정렬 적용
            const sortedProblemSets = this.applySorting(filteredProblemSets, request.sorting);
            // 6. 페이지네이션 적용
            const pagination = {
                page: request.pagination?.page || 1,
                limit: Math.min(request.pagination?.limit || 20, 100) // 최대 100개
            };
            const startIndex = (pagination.page - 1) * pagination.limit;
            const endIndex = startIndex + pagination.limit;
            const paginatedProblemSets = sortedProblemSets.slice(startIndex, endIndex);
            // 7. 추가 정보 및 권한 설정
            const enhancedProblemSets = await this.enhanceProblemSetsWithMetadata(paginatedProblemSets, request.requesterId, request.requesterRole);
            // 8. 집계 정보 생성
            const aggregations = this.generateAggregations(accessibleProblemSets.value, filteredProblemSets);
            // 9. 응답 생성
            const response = {
                problemSets: enhancedProblemSets,
                pagination: {
                    currentPage: pagination.page,
                    totalPages: Math.ceil(sortedProblemSets.length / pagination.limit),
                    totalCount: sortedProblemSets.length,
                    hasNext: endIndex < sortedProblemSets.length,
                    hasPrevious: pagination.page > 1
                },
                aggregations
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error searching shared problem sets: ${error}`);
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.requesterId || request.requesterId.trim().length === 0) {
            errors.push('Requester ID is required');
        }
        if (!['student', 'teacher', 'admin'].includes(request.requesterRole)) {
            errors.push('Invalid requester role');
        }
        if (request.searchQuery && request.searchQuery.length > 100) {
            errors.push('Search query must be 100 characters or less');
        }
        if (request.filters?.minItemCount && request.filters.minItemCount < 0) {
            errors.push('Minimum item count must be non-negative');
        }
        if (request.filters?.maxItemCount && request.filters.maxItemCount < 0) {
            errors.push('Maximum item count must be non-negative');
        }
        if (request.filters?.minItemCount && request.filters?.maxItemCount) {
            if (request.filters.minItemCount > request.filters.maxItemCount) {
                errors.push('Minimum item count cannot be greater than maximum item count');
            }
        }
        if (request.pagination?.page && request.pagination.page < 1) {
            errors.push('Page number must be positive');
        }
        if (request.pagination?.limit && (request.pagination.limit < 1 || request.pagination.limit > 100)) {
            errors.push('Limit must be between 1 and 100');
        }
        if (errors.length > 0) {
            return Result.fail(errors.join(', '));
        }
        return Result.ok();
    }
    async getAccessibleProblemSets(request) {
        try {
            let problemSets = [];
            if (request.requesterRole === 'student') {
                // 학생은 공개된 문제집만 접근 가능
                const publicSetsResult = await this.problemSetRepository.findPublicProblemSets();
                if (publicSetsResult.isSuccess) {
                    problemSets = publicSetsResult.value;
                }
            }
            else if (request.requesterRole === 'teacher') {
                // 교사는 공유된 모든 문제집 접근 가능
                const sharedSetsResult = await this.problemSetRepository.findSharedProblemSets();
                if (sharedSetsResult.isSuccess) {
                    problemSets = sharedSetsResult.value;
                }
            }
            else if (request.requesterRole === 'admin') {
                // 관리자는 공유된 모든 문제집 접근 가능
                const sharedSetsResult = await this.problemSetRepository.findSharedProblemSets();
                if (sharedSetsResult.isSuccess) {
                    problemSets = sharedSetsResult.value;
                }
            }
            return Result.ok(problemSets);
        }
        catch (error) {
            return Result.fail(`Failed to retrieve accessible problem sets: ${error}`);
        }
    }
    applySearchFilters(problemSets, searchQuery, filters) {
        let filtered = [...problemSets];
        // 텍스트 검색
        if (searchQuery && searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(ps => ps.title.value.toLowerCase().includes(query) ||
                (ps.description?.value || '').toLowerCase().includes(query) ||
                (ps.teacherName || '').toLowerCase().includes(query));
        }
        // 필터 적용
        if (filters) {
            if (filters.minItemCount !== undefined) {
                filtered = filtered.filter(ps => ps.itemCount >= filters.minItemCount);
            }
            if (filters.maxItemCount !== undefined) {
                filtered = filtered.filter(ps => ps.itemCount <= filters.maxItemCount);
            }
            if (filters.isPublicOnly) {
                filtered = filtered.filter(ps => ps.isPublic);
            }
            if (filters.teacherIds && filters.teacherIds.length > 0) {
                filtered = filtered.filter(ps => filters.teacherIds.includes(ps.teacherId));
            }
            if (filters.createdAfter) {
                filtered = filtered.filter(ps => ps.createdAt >= filters.createdAfter);
            }
            if (filters.createdBefore) {
                filtered = filtered.filter(ps => ps.createdAt <= filters.createdBefore);
            }
            // 난이도 필터링은 문제집의 문제들을 분석해야 하므로 실제 구현에서는 별도 로직 필요
            if (filters.difficultyLevel) {
                // 실제로는 문제집의 문제들의 난이도를 분석해야 함
                // 여기서는 간단히 mock 처리
            }
        }
        return filtered;
    }
    applySorting(problemSets, sorting) {
        if (!sorting || !sorting.field) {
            // 기본 정렬: 최신순
            return problemSets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        const isAsc = sorting.order === 'asc';
        return problemSets.sort((a, b) => {
            let aVal, bVal;
            switch (sorting.field) {
                case 'title':
                    aVal = a.title.value.toLowerCase();
                    bVal = b.title.value.toLowerCase();
                    break;
                case 'createdAt':
                case 'updatedAt':
                    aVal = a[sorting.field].getTime();
                    bVal = b[sorting.field].getTime();
                    break;
                case 'itemCount':
                    aVal = a.itemCount;
                    bVal = b.itemCount;
                    break;
                case 'popularity':
                    aVal = a.popularity || 0;
                    bVal = b.popularity || 0;
                    break;
                default:
                    return 0;
            }
            if (aVal < bVal)
                return isAsc ? -1 : 1;
            if (aVal > bVal)
                return isAsc ? 1 : -1;
            return 0;
        });
    }
    async enhanceProblemSetsWithMetadata(problemSets, requesterId, requesterRole) {
        return problemSets.map(ps => ({
            id: ps.id.toString(),
            title: ps.title.value,
            description: ps.description?.value,
            teacherId: ps.teacherId,
            teacherName: 'Teacher Name', // 실제로는 Teacher 서비스에서 조회
            itemCount: ps.itemCount,
            totalPoints: this.calculateTotalPoints(ps),
            estimatedTimeMinutes: this.calculateEstimatedTime(ps),
            isPublic: ps.isPublic,
            isShared: ps.isShared,
            tags: this.extractTags(ps), // 실제로는 태그 시스템 구현 필요
            difficulty: this.analyzeDifficulty(ps), // 실제로는 문제들의 난이도 분석 필요
            popularity: this.calculatePopularity(ps), // 실제로는 사용/복제 통계 필요
            createdAt: ps.createdAt,
            updatedAt: ps.updatedAt,
            canClone: this.canClone(ps, requesterId, requesterRole),
            canView: this.canView(ps, requesterId, requesterRole)
        }));
    }
    generateAggregations(allProblemSets, filteredProblemSets) {
        const totalSharedSets = allProblemSets.filter(ps => ps.isShared).length;
        const totalPublicSets = allProblemSets.filter(ps => ps.isPublic).length;
        // 인기 태그 추출 (실제로는 태그 시스템 구현 필요)
        const popularTags = [
            { tag: 'math', count: 15 },
            { tag: 'algebra', count: 12 },
            { tag: 'geometry', count: 8 }
        ];
        // 교사별 공유 통계
        const teacherStats = this.generateTeacherStats(allProblemSets);
        return {
            totalSharedSets,
            totalPublicSets,
            popularTags,
            teacherStats
        };
    }
    generateTeacherStats(problemSets) {
        const teacherMap = new Map();
        problemSets.forEach(ps => {
            if (!teacherMap.has(ps.teacherId)) {
                teacherMap.set(ps.teacherId, {
                    teacherId: ps.teacherId,
                    teacherName: 'Teacher Name', // 실제로는 조회 필요
                    sharedCount: 0
                });
            }
            if (ps.isShared) {
                teacherMap.get(ps.teacherId).sharedCount++;
            }
        });
        return Array.from(teacherMap.values())
            .filter(stat => stat.sharedCount > 0)
            .sort((a, b) => b.sharedCount - a.sharedCount)
            .slice(0, 10); // 상위 10명
    }
    calculateTotalPoints(problemSet) {
        // 실제로는 문제집의 문제들 점수 합산
        return problemSet.itemCount * 10; // 임시 계산
    }
    calculateEstimatedTime(problemSet) {
        // 실제로는 문제들의 예상 소요 시간 합산
        return problemSet.itemCount * 3; // 임시 계산
    }
    extractTags(problemSet) {
        // 실제로는 문제집에 설정된 태그들 반환
        return []; // 임시
    }
    analyzeDifficulty(problemSet) {
        // 실제로는 문제집 내 문제들의 난이도 분석
        return 'mixed'; // 임시
    }
    calculatePopularity(problemSet) {
        // 실제로는 복제 횟수, 사용 횟수 등을 기반으로 계산
        return 0; // 임시
    }
    canClone(problemSet, requesterId, requesterRole) {
        if (problemSet.teacherId === requesterId)
            return true;
        if (requesterRole === 'admin')
            return true;
        return problemSet.isShared;
    }
    canView(problemSet, requesterId, requesterRole) {
        if (problemSet.teacherId === requesterId)
            return true;
        if (requesterRole === 'admin')
            return true;
        if (requesterRole === 'student')
            return problemSet.isPublic;
        return problemSet.isShared;
    }
}
//# sourceMappingURL=SearchSharedProblemSetsUseCase.js.map