import { BaseUseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
/**
 * 클래스 진도 현황 조회 UseCase
 *
 * 비즈니스 규칙:
 * - 교사는 자신이 담당하는 클래스만 조회 가능
 * - 관리자는 모든 클래스 조회 가능
 * - 학생 개인정보는 적절히 마스킹하여 제공
 * - 성과 분석과 인사이트를 함께 제공
 */
export class GetClassProgressUseCase extends BaseUseCase {
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
            // 2. 권한 확인 (실제 구현에서는 더 엄격한 검증 필요)
            const authResult = this.checkAuthorization(request);
            if (authResult.isFailure) {
                return Result.fail(authResult.error);
            }
            // 3. 클래스 진도 조회
            const progressResult = await this.progressService.getClassProgress(request.classId, request.problemSetId);
            if (progressResult.isFailure) {
                return Result.fail(progressResult.error);
            }
            let classProgress = progressResult.value;
            // 4. 정렬 적용
            if (request.sortBy) {
                classProgress = this.applySorting(classProgress, request.sortBy, request.sortOrder || 'desc');
            }
            // 5. 인사이트 분석
            const insights = this.generateInsights(classProgress);
            // 6. 요약 정보 생성
            const summary = this.generateSummary(classProgress, insights);
            // 7. 응답 구성
            const response = {
                classProgress,
                insights,
                summary
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to get class progress: ${error}`);
        }
    }
    validateRequest(request) {
        if (!request.classId || request.classId.trim() === '') {
            return Result.fail('Class ID is required');
        }
        const validSortOptions = ['name', 'streak', 'completion', 'accuracy'];
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
        // TODO: 실제 권한 확인 로직 구현
        // - 교사는 담당 클래스만 접근 가능
        // - 관리자는 모든 클래스 접근 가능
        return Result.ok();
    }
    applySorting(classProgress, sortBy, sortOrder) {
        const multiplier = sortOrder === 'asc' ? 1 : -1;
        // 통계 정렬
        let sortedStatistics = [...classProgress.statistics];
        switch (sortBy) {
            case 'completion':
                sortedStatistics.sort((a, b) => (b.completionRate - a.completionRate) * multiplier);
                break;
            case 'accuracy':
                sortedStatistics.sort((a, b) => (b.accuracyRate - a.accuracyRate) * multiplier);
                break;
            case 'streak':
                // 스트릭은 별도로 정렬하지 않고 통계와 연결해서 처리
                break;
            default:
                // name 정렬은 실제 구현에서 학생 이름 정보가 필요
                break;
        }
        // 스트릭 정렬
        let sortedStreaks = [...classProgress.streaks];
        if (sortBy === 'streak') {
            sortedStreaks.sort((a, b) => (b.currentStreak - a.currentStreak) * multiplier);
        }
        return {
            ...classProgress,
            statistics: sortedStatistics,
            streaks: sortedStreaks
        };
    }
    generateInsights(classProgress) {
        const insights = [];
        const { statistics, streaks, classMetrics } = classProgress;
        // 1. 높은 성과자 식별
        const topPerformers = statistics
            .filter(s => s.completionRate >= 0.8 && s.accuracyRate >= 0.85)
            .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
            .slice(0, 3);
        topPerformers.forEach(student => {
            insights.push({
                type: 'high_performer',
                studentId: student.studentId,
                message: `우수한 성과를 보이고 있습니다 (완료율 ${Math.round(student.completionRate * 100)}%, 정답률 ${Math.round(student.accuracyRate * 100)}%)`,
                priority: 'low',
                suggestions: ['추가 도전 문제 제공', '멘토 역할 부여']
            });
        });
        // 2. 도움이 필요한 학생 식별
        const strugglingStudents = statistics.filter(s => s.completionRate < 0.3 || s.accuracyRate < 0.5);
        strugglingStudents.forEach(student => {
            insights.push({
                type: 'needs_attention',
                studentId: student.studentId,
                message: `학습에 어려움을 겪고 있습니다 (완료율 ${Math.round(student.completionRate * 100)}%, 정답률 ${Math.round(student.accuracyRate * 100)}%)`,
                priority: 'high',
                suggestions: ['개별 지도 필요', '기초 문제부터 재시작', '학습 방법 상담']
            });
        });
        // 3. 스트릭 리더 식별
        const topStreaks = streaks
            .filter(s => s.currentStreak >= 7)
            .sort((a, b) => b.currentStreak - a.currentStreak)
            .slice(0, 2);
        topStreaks.forEach(streak => {
            insights.push({
                type: 'streak_leader',
                studentId: streak.studentId,
                message: `${streak.currentStreak}일 연속 학습 중! 훌륭한 학습 습관입니다`,
                priority: 'low',
                suggestions: ['클래스 내 롤모델로 소개', '스트릭 유지 격려']
            });
        });
        // 4. 개선이 필요한 영역 식별
        if (classMetrics.averageCompletionRate < 0.5) {
            insights.push({
                type: 'improvement_needed',
                studentId: 'class_overall',
                message: `클래스 전체 완료율이 ${Math.round(classMetrics.averageCompletionRate * 100)}%로 낮습니다`,
                priority: 'high',
                suggestions: ['문제 난이도 조정', '학습 시간 확보', '동기 부여 방안 마련']
            });
        }
        return insights;
    }
    generateSummary(classProgress, insights) {
        const { statistics, classMetrics } = classProgress;
        // 참여도 레벨 계산
        let engagementLevel = 'low';
        if (classMetrics.averageCompletionRate >= 0.7 && classMetrics.activeStreakCount >= classMetrics.totalStudents * 0.6) {
            engagementLevel = 'high';
        }
        else if (classMetrics.averageCompletionRate >= 0.4 || classMetrics.activeStreakCount >= classMetrics.totalStudents * 0.3) {
            engagementLevel = 'medium';
        }
        // 추천사항 생성
        const recommendations = [];
        if (insights.filter(i => i.type === 'needs_attention').length >= 3) {
            recommendations.push({
                action: '학습 부진 학생들을 위한 보충 수업 계획',
                reason: '3명 이상의 학생이 학습에 어려움을 겪고 있습니다',
                targetStudents: insights
                    .filter(i => i.type === 'needs_attention')
                    .map(i => i.studentId)
            });
        }
        if (classMetrics.atRiskStudents >= 2) {
            recommendations.push({
                action: '스트릭 유지 동기부여 프로그램 실시',
                reason: `${classMetrics.atRiskStudents}명의 학생이 스트릭이 끊어질 위험에 있습니다`
            });
        }
        if (engagementLevel === 'high') {
            recommendations.push({
                action: '고급 문제나 프로젝트 과제 제공',
                reason: '클래스 전체적으로 높은 참여도를 보이고 있습니다'
            });
        }
        return {
            totalStudents: classMetrics.totalStudents,
            engagementLevel,
            averagePerformance: {
                completionRate: classMetrics.averageCompletionRate,
                accuracyRate: classMetrics.averageAccuracyRate,
                currentStreak: classMetrics.averageCurrentStreak
            },
            recommendations
        };
    }
}
//# sourceMappingURL=GetClassProgressUseCase.js.map