import { BaseUseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
/**
 * 문제집 목록 조회 UseCase
 *
 * 비즈니스 규칙:
 * - 교사: 자신이 생성한 문제집 + 공유된(isShared=true) 문제집 조회
 * - 학생: 과제로 배정받은 문제집만 조회 (별도 UseCase 필요할 수 있음)
 * - 관리자: 모든 문제집 조회 가능
 * - 필터링, 정렬, 페이지네이션 지원
 * - 공유 가능한 문제집들 우선 표시
 */
export class GetProblemSetListUseCase extends BaseUseCase {
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
            // 2. 권한에 따른 조회 범위 결정
            const scopeResult = this.determineScopeByRole(request);
            if (scopeResult.isFailure) {
                return Result.fail(scopeResult.error);
            }
            const { canViewAll, canViewShared, ownTeacherId } = scopeResult.value;
            // 3. 문제집 목록 조회 (권한 및 필터 적용)
            const problemSetsResult = await this.fetchProblemSets(request, {
                canViewAll,
                canViewShared,
                ownTeacherId
            });
            if (problemSetsResult.isFailure) {
                return Result.fail(problemSetsResult.error);
            }
            const { problemSets, totalCount } = problemSetsResult.value;
            // 4. DTO 변환
            const problemSetDtos = problemSets.map(problemSet => this.mapToDto(problemSet, request.requesterRole));
            // 5. 페이지네이션 정보 계산
            const pagination = this.calculatePagination(request.pagination?.page || 1, request.pagination?.limit || 20, totalCount);
            // 6. 응답 구성
            const response = {
                problemSets: problemSetDtos,
                pagination,
                filters: {
                    applied: request.filters || {},
                    available: {
                        teachers: [], // TODO: 실제 교사 목록 조회
                        tags: [] // TODO: 실제 태그 목록 조회
                    }
                }
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error retrieving problem set list: ${error}`);
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.requesterId || request.requesterId.trim().length === 0) {
            errors.push('Requester ID is required');
        }
        if (!request.requesterRole || !['student', 'teacher', 'admin'].includes(request.requesterRole)) {
            errors.push('Valid requester role is required');
        }
        // 페이지네이션 검증
        if (request.pagination) {
            if (request.pagination.page && request.pagination.page < 1) {
                errors.push('Page number must be greater than 0');
            }
            if (request.pagination.limit && (request.pagination.limit < 1 || request.pagination.limit > 100)) {
                errors.push('Page limit must be between 1 and 100');
            }
        }
        // 정렬 검증
        if (request.sorting) {
            const validFields = ['title', 'createdAt', 'updatedAt', 'itemCount'];
            if (!validFields.includes(request.sorting.field)) {
                errors.push(`Sort field must be one of: ${validFields.join(', ')}`);
            }
            if (!['asc', 'desc'].includes(request.sorting.order)) {
                errors.push('Sort order must be "asc" or "desc"');
            }
        }
        if (errors.length > 0) {
            return Result.fail(errors.join(', '));
        }
        return Result.ok();
    }
    determineScopeByRole(request) {
        switch (request.requesterRole) {
            case 'admin':
                return Result.ok({
                    canViewAll: true,
                    canViewShared: true
                });
            case 'teacher':
                return Result.ok({
                    canViewAll: false,
                    canViewShared: true,
                    ownTeacherId: request.requesterId
                });
            case 'student':
                // 학생은 과제로 배정받은 문제집만 조회 가능
                // 이 UseCase에서는 제한적으로 처리하거나 별도 UseCase 사용 권장
                return Result.ok({
                    canViewAll: false,
                    canViewShared: false,
                    ownTeacherId: undefined
                });
            default:
                return Result.fail('Invalid requester role');
        }
    }
    async fetchProblemSets(request, scope) {
        try {
            let problemSets = [];
            if (scope.canViewAll) {
                // 관리자: 모든 문제집 조회
                const allResult = await this.problemSetRepository.findByTeacherId(''); // TODO: findAll 메서드 필요
                if (allResult.isSuccess) {
                    problemSets = allResult.value;
                }
            }
            else if (scope.canViewShared && scope.ownTeacherId) {
                // 교사: 자신의 문제집 + 공유된 문제집
                const ownResult = await this.problemSetRepository.findByTeacherId(scope.ownTeacherId);
                let ownProblemSets = [];
                if (ownResult.isSuccess) {
                    ownProblemSets = ownResult.value;
                }
                // 공유된 문제집 조회 (자신을 제외한)
                const sharedResult = await this.problemSetRepository.findSharedProblemSetsExcludingTeacher(scope.ownTeacherId);
                let sharedProblemSets = [];
                if (sharedResult.isSuccess) {
                    sharedProblemSets = sharedResult.value;
                }
                problemSets = [...ownProblemSets, ...sharedProblemSets];
            }
            // 필터 적용
            const filteredProblemSets = this.applyFilters(problemSets, request.filters);
            // 정렬 적용
            const sortedProblemSets = this.applySorting(filteredProblemSets, request.sorting);
            // 페이지네이션 적용
            const page = request.pagination?.page || 1;
            const limit = request.pagination?.limit || 20;
            const startIndex = (page - 1) * limit;
            const paginatedProblemSets = sortedProblemSets.slice(startIndex, startIndex + limit);
            return Result.ok({
                problemSets: paginatedProblemSets,
                totalCount: sortedProblemSets.length
            });
        }
        catch (error) {
            return Result.fail(`Failed to fetch problem sets: ${error}`);
        }
    }
    applyFilters(problemSets, filters) {
        if (!filters)
            return problemSets;
        return problemSets.filter(problemSet => {
            // 교사 ID 필터
            if (filters.teacherId && problemSet.teacherId !== filters.teacherId) {
                return false;
            }
            // 공개 상태 필터
            if (filters.isPublic !== undefined && problemSet.isPublic !== filters.isPublic) {
                return false;
            }
            // 공유 상태 필터
            if (filters.isShared !== undefined && problemSet.isShared !== filters.isShared) {
                return false;
            }
            // 검색어 필터 (제목, 설명)
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const titleMatch = problemSet.title.value.toLowerCase().includes(searchTerm);
                const descriptionMatch = problemSet.description?.value?.toLowerCase().includes(searchTerm) || false;
                if (!titleMatch && !descriptionMatch) {
                    return false;
                }
            }
            return true;
        });
    }
    applySorting(problemSets, sorting) {
        if (!sorting) {
            // 기본 정렬: 업데이트 시간 내림차순
            return problemSets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }
        const { field, order } = sorting;
        const multiplier = order === 'asc' ? 1 : -1;
        return problemSets.sort((a, b) => {
            let valueA;
            let valueB;
            switch (field) {
                case 'title':
                    valueA = a.title.value.toLowerCase();
                    valueB = b.title.value.toLowerCase();
                    return valueA.localeCompare(valueB) * multiplier;
                case 'itemCount':
                    valueA = a.itemCount;
                    valueB = b.itemCount;
                    return (valueA - valueB) * multiplier;
                case 'createdAt':
                case 'updatedAt':
                    valueA = new Date(a[field]).getTime();
                    valueB = new Date(b[field]).getTime();
                    return (valueA - valueB) * multiplier;
                default:
                    return 0;
            }
        });
    }
    calculatePagination(page, limit, totalCount) {
        const totalPages = Math.ceil(totalCount / limit);
        return {
            currentPage: page,
            totalPages,
            totalCount,
            hasNext: page < totalPages,
            hasPrevious: page > 1
        };
    }
    mapToDto(problemSet, requesterRole) {
        const dto = {
            id: problemSet.id.toString(),
            title: problemSet.title.value,
            description: problemSet.description?.value,
            teacherId: problemSet.teacherId,
            itemCount: problemSet.itemCount,
            totalPoints: this.calculateTotalPoints(problemSet),
            estimatedTimeMinutes: this.calculateEstimatedTime(problemSet),
            isPublic: problemSet.isPublic,
            isShared: problemSet.isShared,
            createdAt: problemSet.createdAt,
            updatedAt: problemSet.updatedAt
        };
        // 학생에게는 민감한 정보 숨김
        if (requesterRole === 'student') {
            dto.teacherId = 'hidden';
        }
        return dto;
    }
    calculateTotalPoints(problemSet) {
        const items = problemSet.getOrderedItems();
        return items.reduce((total, item) => total + (item.points || 10), 0);
    }
    calculateEstimatedTime(problemSet) {
        const items = problemSet.getOrderedItems();
        return items.reduce((total, item) => total + (item.estimatedTimeMinutes || 3), 0);
    }
}
//# sourceMappingURL=GetProblemSetListUseCase.js.map