import { Result } from '../../common/Result';
import { UserAchievement } from '../entities/UserAchievement';
import { AchievementCode } from '../value-objects/AchievementCode';
import { TokenReason } from '../value-objects/TokenReason';
export class AchievementService {
    achievementRepository;
    userAchievementRepository;
    tokenRepository;
    clock;
    constructor(achievementRepository, userAchievementRepository, tokenRepository, clock) {
        this.achievementRepository = achievementRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.tokenRepository = tokenRepository;
        this.clock = clock;
    }
    /**
     * 업적 달성 여부를 확인하고 부여합니다
     */
    async checkAndAwardAchievement(studentId, achievementCode) {
        // 업적 정의 조회
        const achievementResult = await this.achievementRepository.findByCode(achievementCode);
        if (achievementResult.isFailure) {
            return Result.fail(`Achievement ${achievementCode.value} not found`);
        }
        const achievement = achievementResult.getValue();
        // 비활성화된 업적인지 확인
        if (!achievement.isActive) {
            return Result.ok({ awarded: false });
        }
        // 이미 획득한 업적인지 확인
        const existingResult = await this.userAchievementRepository.findByStudentAndAchievement(studentId, achievement.id);
        if (existingResult.isSuccess) {
            return Result.ok({ awarded: false, userAchievement: existingResult.getValue() });
        }
        // 새 업적 부여
        const userAchievementResult = UserAchievement.createAndNotify(studentId, achievement.id, this.clock);
        if (userAchievementResult.isFailure) {
            return Result.fail(userAchievementResult.getErrorValue());
        }
        const userAchievement = userAchievementResult.getValue();
        // 사용자 업적 저장
        const saveResult = await this.userAchievementRepository.save(userAchievement);
        if (saveResult.isFailure) {
            return Result.fail(saveResult.getErrorValue());
        }
        // 토큰 보상 지급
        if (achievement.hasReward()) {
            await this.awardTokenReward(studentId, achievement);
        }
        return Result.ok({ awarded: true, userAchievement });
    }
    /**
     * 여러 업적을 일괄 확인합니다
     */
    async checkMultipleAchievements(studentId, achievementCodes) {
        const newAchievements = [];
        for (const code of achievementCodes) {
            const result = await this.checkAndAwardAchievement(studentId, code);
            if (result.isSuccess && result.getValue().awarded && result.getValue().userAchievement) {
                newAchievements.push(result.getValue().userAchievement);
            }
        }
        return Result.ok(newAchievements);
    }
    /**
     * 토큰 관련 업적을 확인합니다
     */
    async checkTokenAchievements(studentId, totalTokensEarned) {
        const thresholds = [10, 50, 100, 500, 1000, 5000, 10000];
        const achievementCodes = [];
        for (const threshold of thresholds) {
            if (totalTokensEarned >= threshold) {
                const codeResult = AchievementCode.create(`EARN_TOKENS_${threshold}`);
                if (codeResult.isSuccess) {
                    achievementCodes.push(codeResult.getValue());
                }
            }
        }
        await this.checkMultipleAchievements(studentId, achievementCodes);
        return Result.ok();
    }
    /**
     * 학생의 업적 목록을 조회합니다
     */
    async getStudentAchievements(studentId) {
        const achievementsResult = await this.userAchievementRepository.findByStudentId(studentId);
        if (achievementsResult.isFailure) {
            return Result.fail(achievementsResult.getErrorValue());
        }
        const statsResult = await this.userAchievementRepository.getStudentAchievementStats(studentId);
        if (statsResult.isFailure) {
            return Result.fail(statsResult.getErrorValue());
        }
        return Result.ok({
            achievements: achievementsResult.getValue(),
            stats: statsResult.getValue()
        });
    }
    /**
     * 미처리 알림 상태인 업적들을 조회하고 알림 처리로 표시합니다
     */
    async getAndMarkUnnotifiedAchievements(studentId) {
        const unnotifiedResult = await this.userAchievementRepository.findUnnotified(studentId);
        if (unnotifiedResult.isFailure) {
            return Result.fail(unnotifiedResult.getErrorValue());
        }
        const unnotified = unnotifiedResult.getValue();
        // 알림 처리 완료로 표시
        for (const userAchievement of unnotified) {
            userAchievement.markAsNotified();
            await this.userAchievementRepository.save(userAchievement);
        }
        return Result.ok(unnotified);
    }
    /**
     * 토큰 보상을 지급합니다 (private method)
     */
    async awardTokenReward(studentId, achievement) {
        const tokenResult = await this.tokenRepository.findByStudentId(studentId);
        let token;
        if (tokenResult.isFailure) {
            // 새 토큰 계정 생성하는 로직은 TokenService에서 처리
            return;
        }
        else {
            token = tokenResult.getValue();
        }
        const reasonResult = TokenReason.create(`Achievement: ${achievement.name.value}`);
        if (reasonResult.isSuccess) {
            const addResult = token.addTokens(achievement.tokenReward, reasonResult.getValue(), this.clock);
            if (addResult.isSuccess) {
                await this.tokenRepository.save(token);
            }
        }
    }
}
//# sourceMappingURL=AchievementService.js.map