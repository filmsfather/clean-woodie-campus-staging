import { UniqueEntityID, Result } from '@woodie/domain';
/**
 * 연체 복습 조회 Use Case
 *
 * 비즈니스 규칙:
 * - 복습 예정일이 지난 항목들만 조회
 * - 연체 기간, 난이도, 우선순위별 정렬 지원
 * - 긴급도에 따른 우선순위 분류
 * - 연체 기간이 길수록 높은 우선순위 부여
 */
export class GetOverdueReviewsUseCase {
    reviewScheduleRepository;
    clock;
    constructor(reviewScheduleRepository, clock) {
        this.reviewScheduleRepository = reviewScheduleRepository;
        this.clock = clock;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            const studentId = new UniqueEntityID(request.studentId);
            const limit = request.limit || 50;
            const offset = request.offset || 0;
            // 2. 연체된 복습 스케줄 조회
            const overdueSchedules = await this.reviewScheduleRepository.findOverdueByStudentId(studentId, this.clock.now());
            const schedules = overdueSchedules.slice(offset, offset + limit);
            const hasMore = overdueSchedules.length > offset + limit;
            // 3. 전체 연체 개수 조회
            const totalCount = await this.reviewScheduleRepository.countOverdueByStudentId(studentId, this.clock.now());
            // 4. 연체 항목들을 DTO로 변환
            const now = this.clock.now();
            const items = schedules.map(schedule => {
                const overdueMilliseconds = now.getTime() - schedule.nextReviewAt.getTime();
                const overdueHours = Math.floor(overdueMilliseconds / (1000 * 60 * 60));
                const overdueDays = Math.floor(overdueHours / 24);
                return {
                    scheduleId: schedule.id.toString(),
                    problemId: schedule.problemId.toString(),
                    nextReviewAt: schedule.nextReviewAt,
                    overdueHours,
                    overdueDays,
                    difficultyLevel: schedule.getDifficultyLevel(),
                    consecutiveFailures: schedule.consecutiveFailures,
                    easeFactor: schedule.easeFactor,
                    currentInterval: schedule.currentInterval,
                    retentionProbability: Math.round(schedule.getRetentionProbability(this.clock) * 100) / 100,
                    priority: this.calculatePriority(overdueDays, schedule.consecutiveFailures, schedule.getDifficultyLevel())
                };
            });
            // 5. 정렬 적용
            const sortedItems = this.applySorting(items, request.sortBy, request.sortOrder);
            // 6. 요약 통계 계산
            const summary = this.calculateSummary(sortedItems);
            // 7. 긴급 추천사항 생성
            const urgentRecommendations = this.generateUrgentRecommendations(sortedItems, summary);
            // 8. 응답 구성
            const response = {
                studentId: request.studentId,
                retrievedAt: now,
                items: sortedItems,
                pagination: {
                    total: totalCount,
                    offset,
                    limit,
                    hasMore
                },
                summary,
                urgentRecommendations
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to get overdue reviews: ${error}`);
        }
    }
    /**
     * 입력 요청 유효성 검증
     */
    validateRequest(request) {
        if (!request.studentId || request.studentId.trim() === '') {
            return Result.fail('Student ID is required');
        }
        if (request.limit !== undefined && request.limit <= 0) {
            return Result.fail('Limit must be a positive number');
        }
        if (request.offset !== undefined && request.offset < 0) {
            return Result.fail('Offset cannot be negative');
        }
        const validSortFields = ['overdue_duration', 'difficulty', 'priority', 'next_review_date'];
        if (request.sortBy && !validSortFields.includes(request.sortBy)) {
            return Result.fail(`Invalid sort field. Must be one of: ${validSortFields.join(', ')}`);
        }
        const validSortOrders = ['asc', 'desc'];
        if (request.sortOrder && !validSortOrders.includes(request.sortOrder)) {
            return Result.fail(`Invalid sort order. Must be one of: ${validSortOrders.join(', ')}`);
        }
        return Result.ok();
    }
    /**
     * 우선순위 계산
     */
    calculatePriority(overdueDays, consecutiveFailures, difficultyLevel) {
        let score = 0;
        // 연체 기간에 따른 점수
        if (overdueDays <= 1)
            score += 1;
        else if (overdueDays <= 3)
            score += 2;
        else if (overdueDays <= 7)
            score += 3;
        else
            score += 4;
        // 연속 실패에 따른 점수
        if (consecutiveFailures >= 3)
            score += 2;
        else if (consecutiveFailures >= 2)
            score += 1;
        // 난이도에 따른 점수
        if (difficultyLevel === 'advanced')
            score += 2;
        else if (difficultyLevel === 'intermediate')
            score += 1;
        // 점수에 따른 우선순위 분류
        if (score >= 6)
            return 'critical';
        else if (score >= 4)
            return 'high';
        else if (score >= 2)
            return 'medium';
        else
            return 'low';
    }
    /**
     * 정렬 적용
     */
    applySorting(items, sortBy, sortOrder) {
        const order = sortOrder === 'asc' ? 1 : -1;
        switch (sortBy) {
            case 'overdue_duration':
                return items.sort((a, b) => (b.overdueDays - a.overdueDays) * order);
            case 'difficulty':
                const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
                return items.sort((a, b) => (difficultyOrder[b.difficultyLevel] - difficultyOrder[a.difficultyLevel]) * order);
            case 'priority':
                const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
                return items.sort((a, b) => (priorityOrder[b.priority] - priorityOrder[a.priority]) * order);
            case 'next_review_date':
                return items.sort((a, b) => (a.nextReviewAt.getTime() - b.nextReviewAt.getTime()) * order);
            default:
                // 기본 정렬: 우선순위 > 연체 기간 순
                return items.sort((a, b) => {
                    const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
                    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                    if (priorityDiff !== 0)
                        return priorityDiff;
                    return b.overdueDays - a.overdueDays;
                });
        }
    }
    /**
     * 요약 통계 계산
     */
    calculateSummary(items) {
        const totalOverdue = items.length;
        const averageOverdueDays = totalOverdue > 0
            ? Math.round(items.reduce((sum, item) => sum + item.overdueDays, 0) / totalOverdue * 10) / 10
            : 0;
        const criticalCount = items.filter(item => item.priority === 'critical').length;
        const highPriorityCount = items.filter(item => item.priority === 'high').length;
        const longestOverdueDays = totalOverdue > 0
            ? Math.max(...items.map(item => item.overdueDays))
            : 0;
        return {
            totalOverdue,
            averageOverdueDays,
            criticalCount,
            highPriorityCount,
            longestOverdueDays
        };
    }
    /**
     * 긴급 추천사항 생성
     */
    generateUrgentRecommendations(items, summary) {
        const recommendations = [];
        // 위험도별 긴급 조치 필요
        if (summary.criticalCount > 0) {
            recommendations.push(`⚠️ ${summary.criticalCount}개의 매우 긴급한 복습이 있습니다. 즉시 처리하세요!`);
        }
        if (summary.highPriorityCount > 0) {
            recommendations.push(`🔥 ${summary.highPriorityCount}개의 높은 우선순위 복습을 우선 처리하세요.`);
        }
        // 장기 연체 항목 경고
        if (summary.longestOverdueDays > 14) {
            recommendations.push(`📅 ${summary.longestOverdueDays}일간 연체된 항목이 있습니다. 기본기부터 다시 시작하세요.`);
        }
        // 전체적인 연체 상황 평가
        if (summary.totalOverdue > 20) {
            recommendations.push('📚 연체 항목이 너무 많습니다. 일일 복습량을 늘리거나 학습 계획을 재조정하세요.');
        }
        else if (summary.averageOverdueDays > 5) {
            recommendations.push('⏰ 평균 연체 기간이 깁니다. 복습 알림 설정을 확인하고 학습 습관을 점검하세요.');
        }
        // 기억 보존 확률 기반 권고
        const lowRetentionItems = items.filter(item => item.retentionProbability < 0.3);
        if (lowRetentionItems.length > 0) {
            recommendations.push(`🧠 ${lowRetentionItems.length}개 항목의 기억 보존율이 매우 낮습니다. 기본 개념부터 다시 학습하세요.`);
        }
        // 연속 실패 패턴 경고
        const multipleFailureItems = items.filter(item => item.consecutiveFailures >= 3);
        if (multipleFailureItems.length > 0) {
            recommendations.push(`❌ ${multipleFailureItems.length}개 문제에서 연속 실패가 발생했습니다. 학습 방법을 바꿔보세요.`);
        }
        // 격려 메시지 (상황이 나쁘지 않은 경우)
        if (recommendations.length === 0) {
            recommendations.push('✅ 연체된 복습들을 차근차근 처리하시면 됩니다!');
        }
        return recommendations;
    }
}
//# sourceMappingURL=GetOverdueReviewsUseCase.js.map