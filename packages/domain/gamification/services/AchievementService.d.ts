import { Result } from '../../common/Result';
import { UserAchievement } from '../entities/UserAchievement';
import { AchievementCode } from '../value-objects/AchievementCode';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { IAchievementRepository } from '../repositories/IAchievementRepository';
import { IUserAchievementRepository } from '../repositories/IUserAchievementRepository';
import { ITokenRepository } from '../repositories/ITokenRepository';
import { IClock } from '../../srs/services/IClock';
export declare class AchievementService {
    private achievementRepository;
    private userAchievementRepository;
    private tokenRepository;
    private clock;
    constructor(achievementRepository: IAchievementRepository, userAchievementRepository: IUserAchievementRepository, tokenRepository: ITokenRepository, clock: IClock);
    /**
     * 업적 달성 여부를 확인하고 부여합니다
     */
    checkAndAwardAchievement(studentId: StudentId, achievementCode: AchievementCode): Promise<Result<{
        awarded: boolean;
        userAchievement?: UserAchievement;
    }>>;
    /**
     * 여러 업적을 일괄 확인합니다
     */
    checkMultipleAchievements(studentId: StudentId, achievementCodes: AchievementCode[]): Promise<Result<UserAchievement[]>>;
    /**
     * 토큰 관련 업적을 확인합니다
     */
    checkTokenAchievements(studentId: StudentId, totalTokensEarned: number): Promise<Result<void>>;
    /**
     * 학생의 업적 목록을 조회합니다
     */
    getStudentAchievements(studentId: StudentId): Promise<Result<{
        achievements: UserAchievement[];
        stats: {
            totalCount: number;
            recentCount: number;
            unnotifiedCount: number;
        };
    }>>;
    /**
     * 미처리 알림 상태인 업적들을 조회하고 알림 처리로 표시합니다
     */
    getAndMarkUnnotifiedAchievements(studentId: StudentId): Promise<Result<UserAchievement[]>>;
    /**
     * 토큰 보상을 지급합니다 (private method)
     */
    private awardTokenReward;
}
//# sourceMappingURL=AchievementService.d.ts.map