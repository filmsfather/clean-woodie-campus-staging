import { Result } from '../../common/Result';
import { UserAchievement } from '../entities/UserAchievement';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { UniqueEntityID } from '../../common/Identifier';

export interface IUserAchievementRepository {
  /**
   * 학생의 특정 업적 획득 여부 조회
   */
  findByStudentAndAchievement(
    studentId: StudentId, 
    achievementId: UniqueEntityID
  ): Promise<Result<UserAchievement>>;

  /**
   * 학생의 모든 업적 조회
   */
  findByStudentId(studentId: StudentId): Promise<Result<UserAchievement[]>>;

  /**
   * 특정 업적을 획득한 모든 학생 조회
   */
  findByAchievementId(achievementId: UniqueEntityID): Promise<Result<UserAchievement[]>>;

  /**
   * 사용자 업적 저장
   */
  save(userAchievement: UserAchievement): Promise<Result<void>>;

  /**
   * 사용자 업적 삭제
   */
  delete(id: UniqueEntityID): Promise<Result<void>>;

  /**
   * 학생의 업적 통계 조회
   */
  getStudentAchievementStats(studentId: StudentId): Promise<Result<{
    totalCount: number;
    recentCount: number; // 최근 30일
    unnotifiedCount: number;
  }>>;

  /**
   * 업적별 획득 통계 조회
   */
  getAchievementStats(achievementId: UniqueEntityID): Promise<Result<{
    totalEarned: number;
    recentEarned: number; // 최근 30일
  }>>;

  /**
   * 미알림 상태인 사용자 업적들 조회
   */
  findUnnotified(studentId: StudentId): Promise<Result<UserAchievement[]>>;
}