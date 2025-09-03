import { Result } from '../../common/Result';
import { RewardRedemption, RedemptionStatus } from '../entities/RewardRedemption';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { UniqueEntityID } from '../../common/Identifier';

export interface IRewardRedemptionRepository {
  /**
   * 교환 기록 ID로 조회
   */
  findById(id: UniqueEntityID): Promise<Result<RewardRedemption>>;

  /**
   * 학생의 교환 기록 조회
   */
  findByStudentId(
    studentId: StudentId,
    status?: RedemptionStatus,
    limit?: number
  ): Promise<Result<RewardRedemption[]>>;

  /**
   * 특정 보상의 교환 기록 조회
   */
  findByRewardId(
    rewardId: UniqueEntityID,
    status?: RedemptionStatus,
    limit?: number
  ): Promise<Result<RewardRedemption[]>>;

  /**
   * 상태별 교환 기록 조회
   */
  findByStatus(
    status: RedemptionStatus,
    limit?: number
  ): Promise<Result<RewardRedemption[]>>;

  /**
   * 교환 기록 저장
   */
  save(redemption: RewardRedemption): Promise<Result<void>>;

  /**
   * 교환 기록 삭제
   */
  delete(id: UniqueEntityID): Promise<Result<void>>;

  /**
   * 학생의 교환 통계 조회
   */
  getStudentRedemptionStats(studentId: StudentId): Promise<Result<{
    totalRedemptions: number;
    totalTokensSpent: number;
    successfulRedemptions: number;
    failedRedemptions: number;
    pendingRedemptions: number;
  }>>;

  /**
   * 보상별 교환 통계 조회
   */
  getRewardRedemptionStats(rewardId: UniqueEntityID): Promise<Result<{
    totalRedemptions: number;
    successfulRedemptions: number;
    failedRedemptions: number;
    averageProcessingTime: number; // 분 단위
  }>>;

  /**
   * 기간별 교환 통계 조회
   */
  getRedemptionStatsByPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<Result<{
    totalRedemptions: number;
    totalTokensSpent: number;
    mostPopularReward?: UniqueEntityID;
    averageRedemptionValue: number;
  }>>;

  /**
   * 처리 대기 중인 교환들 조회
   */
  findPendingRedemptions(limit?: number): Promise<Result<RewardRedemption[]>>;

  /**
   * 오래된 처리 대기 교환들 조회
   */
  findOldPendingRedemptions(
    olderThanHours: number,
    limit?: number
  ): Promise<Result<RewardRedemption[]>>;
}