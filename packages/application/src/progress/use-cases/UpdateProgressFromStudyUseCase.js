import { BaseUseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
/**
 * 학습 활동 기반 진도 업데이트 UseCase
 *
 * StudyRecord가 생성될 때 자동으로 호출되어 스트릭과 통계를 업데이트
 *
 * 비즈니스 규칙:
 * - 유효한 학습 활동만 진도에 반영
 * - 같은 날 여러 번 학습해도 스트릭은 1일로 계산
 * - 통계는 실시간으로 업데이트됨
 * - 중요한 성취(이정표, 완료 등)는 별도 처리
 */
export class UpdateProgressFromStudyUseCase extends BaseUseCase {
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
            // 2. 진도 업데이트 요청 구성
            const updateRequest = {
                studentId: request.studentId,
                problemId: request.problemId,
                problemSetId: request.problemSetId,
                isCorrect: request.isCorrect,
                responseTime: request.responseTime,
                totalProblemsInSet: request.totalProblemsInSet,
                studyDate: request.studyDate
            };
            // 3. 진도 업데이트 실행
            const updateResult = await this.progressService.updateProgressFromStudyRecord(updateRequest);
            if (updateResult.isFailure) {
                return Result.fail(updateResult.error);
            }
            const result = updateResult.value;
            // 4. 성취 분석
            const achievements = this.analyzeAchievements(result);
            // 5. 알림 필요성 확인
            const notifications = this.checkNotificationNeeds(result, achievements);
            // 6. 응답 구성
            const response = {
                updateResult: result,
                achievements,
                notifications
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to update progress: ${error}`);
        }
    }
    validateRequest(request) {
        if (!request.studentId || request.studentId.trim() === '') {
            return Result.fail('Student ID is required');
        }
        if (!request.problemId || request.problemId.trim() === '') {
            return Result.fail('Problem ID is required');
        }
        if (!request.problemSetId || request.problemSetId.trim() === '') {
            return Result.fail('Problem Set ID is required');
        }
        if (typeof request.isCorrect !== 'boolean') {
            return Result.fail('isCorrect must be a boolean');
        }
        if (request.responseTime < 0) {
            return Result.fail('Response time cannot be negative');
        }
        if (request.totalProblemsInSet <= 0) {
            return Result.fail('Total problems in set must be positive');
        }
        return Result.ok();
    }
    analyzeAchievements(result) {
        const achievements = {};
        // 스트릭 이정표 달성
        if (result.streakUpdated.achievedMilestone) {
            achievements.streakMilestones = [result.streakUpdated.achievedMilestone];
        }
        // 새로운 개인 기록
        if (result.streakUpdated.isNewRecord) {
            achievements.newPersonalRecord = true;
        }
        // 문제집 완료
        if (result.statisticsUpdated.wasJustCompleted) {
            achievements.problemSetCompleted = true;
        }
        // 성능 향상 (정답률 증가)
        if (result.statisticsUpdated.currentAccuracyRate > result.statisticsUpdated.previousAccuracyRate) {
            achievements.performanceImprovement = true;
        }
        return Object.keys(achievements).length > 0 ? achievements : undefined;
    }
    checkNotificationNeeds(result, achievements) {
        const notifications = {};
        // 스트릭 위험 알림 (연속 학습이 끊어질 위험)
        if (result.streakUpdated.streakStatus === 'continued' && result.streakUpdated.currentStreak >= 7) {
            notifications.streakReminder = true;
        }
        // 격려 메시지
        if (achievements?.streakMilestones || achievements?.newPersonalRecord) {
            notifications.encouragementMessage = this.generateEncouragementMessage(result, achievements);
        }
        // 부모 알림 (중요한 성취 시)
        if (achievements?.streakMilestones?.some((m) => m >= 30) || achievements?.problemSetCompleted) {
            notifications.parentNotification = true;
        }
        return Object.keys(notifications).length > 0 ? notifications : undefined;
    }
    generateEncouragementMessage(result, achievements) {
        if (achievements.streakMilestones) {
            const milestone = achievements.streakMilestones[0];
            return `축하합니다! ${milestone}일 연속 학습을 달성했습니다! 🎉`;
        }
        if (achievements.newPersonalRecord) {
            return `새로운 개인 기록! ${result.streakUpdated.currentStreak}일 연속 학습 달성! ⭐`;
        }
        if (achievements.problemSetCompleted) {
            const grade = result.statisticsUpdated.performanceGrade;
            return `문제집 완료! ${grade}등급으로 훌륭한 성과입니다! 📚`;
        }
        if (achievements.performanceImprovement) {
            const accuracy = Math.round(result.statisticsUpdated.currentAccuracyRate * 100);
            return `정답률이 ${accuracy}%로 향상되었습니다! 계속 화이팅! 💪`;
        }
        return '훌륭한 학습입니다! 계속해서 꾸준히 노력하세요! 😊';
    }
}
//# sourceMappingURL=UpdateProgressFromStudyUseCase.js.map