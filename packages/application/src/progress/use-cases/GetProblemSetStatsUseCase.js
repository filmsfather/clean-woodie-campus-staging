import { BaseUseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
/**
 * 문제집 통계 조회 UseCase
 *
 * 비즈니스 규칙:
 * - 교사는 자신이 관리하는 문제집 통계만 조회 가능
 * - 관리자는 모든 문제집 통계 조회 가능
 * - 학생은 자신이 참여한 문제집의 제한된 통계만 조회 가능
 * - 통계 분석 및 개선 인사이트 제공
 */
export class GetProblemSetStatsUseCase extends BaseUseCase {
    progressService;
    constructor(progressService) {
        super();
        this.progressService = progressService;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            // 2. 권한 확인
            const authResult = this.checkAuthorization(request);
            if (authResult.isFailure) {
                return Result.fail(authResult.error);
            }
            // 3. 문제집 통계 조회
            const summaryResult = await this.progressService.getProblemSetStatsSummary(request.problemSetId);
            if (summaryResult.isFailure) {
                return Result.fail(summaryResult.error);
            }
            const summary = summaryResult.value;
            // 4. 인사이트 분석
            const insights = this.generateInsights(summary);
            // 5. 비교 데이터 생성
            const comparisons = await this.generateComparisons(summary);
            // 6. 정렬 적용 (개별 통계가 요청된 경우)
            if (request.includeIndividualStats && request.sortBy) {
                this.applySorting(summary, request.sortBy, request.sortOrder || 'desc');
            }
            // 7. 응답 구성
            const response = {
                summary,
                insights,
                comparisons
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to get problem set stats: ${error}`);
        }
    }
    validateRequest(request) {
        if (!request.problemSetId || request.problemSetId.trim() === '') {
            return Result.fail('Problem Set ID is required');
        }
        const validSortOptions = ['completion', 'accuracy', 'efficiency'];
        if (request.sortBy && !validSortOptions.includes(request.sortBy)) {
            return Result.fail(`Invalid sort option. Must be one of: ${validSortOptions.join(', ')}`);
        }
        const validSortOrders = ['asc', 'desc'];
        if (request.sortOrder && !validSortOrders.includes(request.sortOrder)) {
            return Result.fail(`Invalid sort order. Must be one of: ${validSortOrders.join(', ')}`);
        }
        return Result.ok();
    }
    checkAuthorization(request) {
        // 관리자는 모든 데이터에 접근 가능
        if (request.requesterRole === 'admin') {
            return Result.ok();
        }
        // 교사는 자신이 관리하는 문제집에 접근 가능
        if (request.requesterRole === 'teacher') {
            // TODO: 교사-문제집 소유권 확인 로직 구현
            return Result.ok();
        }
        // 학생은 제한된 통계만 접근 가능
        if (request.requesterRole === 'student') {
            // TODO: 학생-문제집 참여 여부 확인 로직 구현
            return Result.ok();
        }
        return Result.fail('Access denied: Insufficient permissions to view problem set statistics');
    }
    generateInsights(summary) {
        const insights = [];
        // 완료율 분석
        if (summary.averageCompletionRate >= 0.8) {
            insights.push({
                type: 'high_completion',
                message: '학생들이 문제집을 잘 완료하고 있습니다',
                value: summary.averageCompletionRate,
                threshold: 0.8,
                recommendation: '난이도를 점진적으로 높여보세요'
            });
        }
        else if (summary.averageCompletionRate < 0.4) {
            insights.push({
                type: 'low_completion',
                message: '문제집 완료율이 낮습니다',
                value: summary.averageCompletionRate,
                threshold: 0.4,
                recommendation: '문제 난이도를 조정하거나 힌트를 추가해보세요'
            });
        }
        // 정답률 분석
        if (summary.averageAccuracyRate >= 0.85) {
            insights.push({
                type: 'high_accuracy',
                message: '높은 정답률을 보이고 있습니다',
                value: summary.averageAccuracyRate,
                threshold: 0.85,
                recommendation: '더 도전적인 문제를 추가해보세요'
            });
        }
        else if (summary.averageAccuracyRate < 0.6) {
            insights.push({
                type: 'low_accuracy',
                message: '정답률이 낮습니다',
                value: summary.averageAccuracyRate,
                threshold: 0.6,
                recommendation: '설명을 보강하거나 예시 문제를 추가해보세요'
            });
        }
        // 시간 효율성 분석
        if (summary.averageResponseTime > 300000) { // 5분 이상
            insights.push({
                type: 'time_efficiency',
                message: '평균 응답 시간이 깁니다',
                value: summary.averageResponseTime,
                threshold: 300000,
                recommendation: '문제를 더 간결하게 만들거나 시간 제한을 고려해보세요'
            });
        }
        return insights;
    }
    async generateComparisons(summary) {
        // 실제 구현에서는 데이터베이스에서 평균값들을 조회해야 함
        const classAverage = {
            completionRate: summary.averageCompletionRate,
            accuracyRate: summary.averageAccuracyRate,
            averageTime: summary.averageResponseTime
        };
        // TODO: 실제 학교 평균 데이터 조회
        const schoolAverage = {
            completionRate: 0.65, // 예시 데이터
            accuracyRate: 0.72, // 예시 데이터
            averageTime: 180000 // 예시 데이터
        };
        return {
            classAverage,
            schoolAverage
        };
    }
    applySorting(summary, sortBy, sortOrder) {
        const multiplier = sortOrder === 'asc' ? 1 : -1;
        switch (sortBy) {
            case 'completion':
                summary.topPerformers.sort((a, b) => (b.completionRate - a.completionRate) * multiplier);
                break;
            case 'accuracy':
                summary.topPerformers.sort((a, b) => (b.accuracyRate - a.accuracyRate) * multiplier);
                break;
            case 'efficiency':
                summary.topPerformers.sort((a, b) => (b.efficiencyScore - a.efficiencyScore) * multiplier);
                break;
        }
    }
}
//# sourceMappingURL=GetProblemSetStatsUseCase.js.map