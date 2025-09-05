import { UniqueEntityID, Result } from '@woodie/domain';
/**
 * 난이도 수준 평가 Use Case
 *
 * 비즈니스 규칙:
 * - EaseFactor와 학습 기록을 종합하여 난이도 평가
 * - 개별 문제별 맞춤형 학습 전략 제안
 * - 학습자의 전반적인 수준과 취약점 분석
 * - 다음 학습 단계 추천
 */
export class AssessDifficultyLevelUseCase {
    reviewScheduleRepository;
    studyRecordRepository;
    constructor(reviewScheduleRepository, studyRecordRepository) {
        this.reviewScheduleRepository = reviewScheduleRepository;
        this.studyRecordRepository = studyRecordRepository;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            const studentId = new UniqueEntityID(request.studentId);
            // 2. 복습 스케줄 조회
            let schedules = [];
            if (request.problemId) {
                const problemId = new UniqueEntityID(request.problemId);
                const schedule = await this.reviewScheduleRepository.findByStudentAndProblem(studentId, problemId);
                if (schedule) {
                    schedules = [schedule];
                }
            }
            else {
                schedules = await this.reviewScheduleRepository.findByStudentId(studentId);
            }
            if (schedules.length === 0) {
                return Result.fail('No review schedules found');
            }
            // 3. 각 스케줄에 대한 난이도 평가
            const items = [];
            for (const schedule of schedules) {
                // 해당 문제의 최근 학습 기록 조회
                const records = await this.studyRecordRepository.findByStudentAndProblem(studentId, schedule.problemId);
                let averagePerformanceScore;
                let lastReviewPattern;
                if (records.length > 0) {
                    averagePerformanceScore = records.reduce((sum, record) => sum + record.calculatePerformanceScore(), 0) / records.length;
                    const lastRecord = records[0];
                    lastReviewPattern = lastRecord.getStudyPattern().pattern;
                }
                const item = {
                    scheduleId: schedule.id.toString(),
                    problemId: schedule.problemId.toString(),
                    currentLevel: schedule.getDifficultyLevel(),
                    easeFactor: schedule.easeFactor,
                    reviewCount: schedule.reviewCount,
                    consecutiveFailures: schedule.consecutiveFailures,
                    averagePerformanceScore: averagePerformanceScore ?
                        Math.round(averagePerformanceScore * 100) / 100 : undefined,
                    lastReviewPattern,
                    suggestedAction: this.determineSuggestedAction(schedule, averagePerformanceScore, lastReviewPattern)
                };
                items.push(item);
            }
            // 4. 전체 요약 계산
            const overallSummary = this.calculateOverallSummary(items);
            // 5. 추천사항 생성 (옵션)
            const recommendations = request.includeRecommendations
                ? this.generateRecommendations(items, overallSummary)
                : undefined;
            // 6. 응답 구성
            const response = {
                studentId: request.studentId,
                assessmentDate: new Date(),
                items: items.sort((a, b) => {
                    // 어려움 순서로 정렬 (advanced > intermediate > beginner)
                    const levelOrder = { 'advanced': 3, 'intermediate': 2, 'beginner': 1 };
                    return levelOrder[b.currentLevel] - levelOrder[a.currentLevel];
                }),
                overallSummary,
                recommendations
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to assess difficulty level: ${error}`);
        }
    }
    /**
     * 입력 요청 유효성 검증
     */
    validateRequest(request) {
        if (!request.studentId || request.studentId.trim() === '') {
            return Result.fail('Student ID is required');
        }
        return Result.ok();
    }
    /**
     * 추천 액션 결정
     */
    determineSuggestedAction(schedule, averagePerformanceScore, lastReviewPattern) {
        const difficultyLevel = schedule.getDifficultyLevel();
        const consecutiveFailures = schedule.consecutiveFailures;
        const easeFactor = schedule.easeFactor;
        // 연속 실패가 많은 경우
        if (consecutiveFailures >= 3) {
            return 'review_fundamentals';
        }
        // 성과 점수가 낮은 경우
        if (averagePerformanceScore !== undefined && averagePerformanceScore < 60) {
            return 'review_fundamentals';
        }
        // 어려운 패턴이 지속되는 경우
        if (lastReviewPattern === 'slow_incorrect' || lastReviewPattern === 'quick_incorrect') {
            return 'increase_frequency';
        }
        // 고급 수준에서 좋은 성과를 보이는 경우
        if (difficultyLevel === 'advanced' && easeFactor >= 2.5 &&
            averagePerformanceScore !== undefined && averagePerformanceScore >= 85) {
            return 'consider_advanced';
        }
        // 초급/중급에서 빠른 정답 패턴을 보이는 경우
        if ((difficultyLevel === 'beginner' || difficultyLevel === 'intermediate') &&
            lastReviewPattern === 'quick_correct' && easeFactor >= 2.0) {
            return 'consider_advanced';
        }
        return 'continue';
    }
    /**
     * 전체 요약 계산
     */
    calculateOverallSummary(items) {
        const beginnerCount = items.filter(item => item.currentLevel === 'beginner').length;
        const intermediateCount = items.filter(item => item.currentLevel === 'intermediate').length;
        const advancedCount = items.filter(item => item.currentLevel === 'advanced').length;
        const averageEaseFactor = items.reduce((sum, item) => sum + item.easeFactor, 0) / items.length;
        const strugglingItems = items.filter(item => item.consecutiveFailures >= 2 ||
            (item.averagePerformanceScore !== undefined && item.averagePerformanceScore < 60)).length;
        return {
            beginnerCount,
            intermediateCount,
            advancedCount,
            averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
            strugglingItems
        };
    }
    /**
     * 추천사항 생성
     */
    generateRecommendations(items, summary) {
        const priorityItems = [];
        const studyStrategy = [];
        const nextSteps = [];
        // 우선순위 항목 식별
        const reviewFundamentalsItems = items.filter(item => item.suggestedAction === 'review_fundamentals');
        const increaseFrequencyItems = items.filter(item => item.suggestedAction === 'increase_frequency');
        if (reviewFundamentalsItems.length > 0) {
            priorityItems.push(`${reviewFundamentalsItems.length}개 문제의 기본 개념을 다시 학습하세요`);
        }
        if (increaseFrequencyItems.length > 0) {
            priorityItems.push(`${increaseFrequencyItems.length}개 문제의 복습 빈도를 늘리세요`);
        }
        // 학습 전략 제안
        if (summary.strugglingItems > items.length * 0.3) {
            studyStrategy.push('어려움을 겪고 있는 문제가 많습니다. 전체적인 학습 방법을 재검토하세요');
        }
        if (summary.beginnerCount > summary.advancedCount * 2) {
            studyStrategy.push('기초 문제 중심으로 학습하고 있습니다. 단계적으로 난이도를 올려보세요');
        }
        if (summary.averageEaseFactor < 1.5) {
            studyStrategy.push('전반적으로 복습이 자주 필요한 상태입니다. 학습 시간을 늘려보세요');
        }
        else if (summary.averageEaseFactor > 2.5) {
            studyStrategy.push('우수한 기억력을 보이고 있습니다. 더 도전적인 내용을 추가해보세요');
        }
        // 다음 단계 제안
        const considerAdvancedItems = items.filter(item => item.suggestedAction === 'consider_advanced');
        if (considerAdvancedItems.length > 0) {
            nextSteps.push(`${considerAdvancedItems.length}개 문제에서 고급 과정을 고려해볼 수 있습니다`);
        }
        if (summary.advancedCount === 0 && summary.intermediateCount > summary.beginnerCount) {
            nextSteps.push('중급 수준에 안정되었습니다. 고급 문제에 도전해보세요');
        }
        // 기본 메시지 추가
        if (priorityItems.length === 0 && studyStrategy.length === 0) {
            studyStrategy.push('현재 학습 패턴을 잘 유지하고 있습니다');
        }
        if (nextSteps.length === 0) {
            nextSteps.push('꾸준한 복습으로 현재 수준을 유지해보세요');
        }
        return {
            priorityItems,
            studyStrategy,
            nextSteps
        };
    }
}
//# sourceMappingURL=AssessDifficultyLevelUseCase.js.map