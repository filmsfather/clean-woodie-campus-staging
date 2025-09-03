import { Result } from '../../common/Result';
import { Reward, RewardCategory } from '../entities/Reward';
import { RewardCode } from '../value-objects/RewardCode';
import { UniqueEntityID } from '../../common/Identifier';

export interface IRewardRepository {
  /**
   * 보상 코드로 조회
   */
  findByCode(code: RewardCode): Promise<Result<Reward>>;

  /**
   * 보상 ID로 조회
   */
  findById(id: UniqueEntityID): Promise<Result<Reward>>;

  /**
   * 활성화된 모든 보상 조회
   */
  findAllActive(): Promise<Result<Reward[]>>;

  /**
   * 카테고리별 보상 조회
   */
  findByCategory(category: RewardCategory): Promise<Result<Reward[]>>;

  /**
   * 가격 범위별 보상 조회
   */
  findByTokenCostRange(minCost: number, maxCost: number): Promise<Result<Reward[]>>;

  /**
   * 교환 가능한 보상들 조회
   */
  findAvailableRewards(currentDate?: Date): Promise<Result<Reward[]>>;

  /**
   * 보상 저장 (생성 또는 업데이트)
   */
  save(reward: Reward): Promise<Result<void>>;

  /**
   * 보상 삭제
   */
  delete(id: UniqueEntityID): Promise<Result<void>>;

  /**
   * 재고 부족 보상들 조회
   */
  findLowStockRewards(threshold: number): Promise<Result<Reward[]>>;

  /**
   * 품절 보상들 조회
   */
  findOutOfStockRewards(): Promise<Result<Reward[]>>;
}