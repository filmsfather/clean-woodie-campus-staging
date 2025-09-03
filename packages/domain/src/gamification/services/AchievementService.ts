import { Result } from '../../common/Result';
import { Achievement } from '../entities/Achievement';
import { UserAchievement } from '../entities/UserAchievement';
import { AchievementCode } from '../value-objects/AchievementCode';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { UniqueEntityID } from '../../common/Identifier';
import { IAchievementRepository } from '../repositories/IAchievementRepository';
import { IUserAchievementRepository } from '../repositories/IUserAchievementRepository';
import { ITokenRepository } from '../repositories/ITokenRepository';
import { TokenAmount } from '../value-objects/TokenAmount';
import { TokenReason } from '../value-objects/TokenReason';
import { IClock } from '../../srs/services/IClock';

export class AchievementService {
  constructor(
    private achievementRepository: IAchievementRepository,
    private userAchievementRepository: IUserAchievementRepository,
    private tokenRepository: ITokenRepository,
    private clock: IClock
  ) {}

  /**
   * 업적 달성 여부를 확인하고 부여합니다
   */
  async checkAndAwardAchievement(
    studentId: StudentId, 
    achievementCode: AchievementCode
  ): Promise<Result<{ awarded: boolean; userAchievement?: UserAchievement }>> {
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
    const existingResult = await this.userAchievementRepository.findByStudentAndAchievement(
      studentId,
      achievement.id
    );

    if (existingResult.isSuccess) {
      return Result.ok({ awarded: false, userAchievement: existingResult.getValue() });
    }

    // 새 업적 부여
    const userAchievementResult = UserAchievement.createAndNotify(
      studentId,
      achievement.id,
      this.clock
    );

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
  async checkMultipleAchievements(
    studentId: StudentId,
    achievementCodes: AchievementCode[]
  ): Promise<Result<UserAchievement[]>> {
    const newAchievements: UserAchievement[] = [];

    for (const code of achievementCodes) {
      const result = await this.checkAndAwardAchievement(studentId, code);
      if (result.isSuccess && result.getValue().awarded && result.getValue().userAchievement) {
        newAchievements.push(result.getValue().userAchievement!);
      }
    }

    return Result.ok(newAchievements);
  }

  /**
   * 토큰 관련 업적을 확인합니다
   */
  async checkTokenAchievements(studentId: StudentId, totalTokensEarned: number): Promise<Result<void>> {
    const thresholds = [10, 50, 100, 500, 1000, 5000, 10000];
    const achievementCodes: AchievementCode[] = [];

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
  async getStudentAchievements(studentId: StudentId): Promise<Result<{
    achievements: UserAchievement[];
    stats: {
      totalCount: number;
      recentCount: number;
      unnotifiedCount: number;
    };
  }>> {
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
  async getAndMarkUnnotifiedAchievements(studentId: StudentId): Promise<Result<UserAchievement[]>> {
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
  private async awardTokenReward(studentId: StudentId, achievement: Achievement): Promise<void> {
    const tokenResult = await this.tokenRepository.findByStudentId(studentId);
    
    let token;
    if (tokenResult.isFailure) {
      // 새 토큰 계정 생성하는 로직은 TokenService에서 처리
      return;
    } else {
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