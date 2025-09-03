import { Entity } from '../../entities/Entity';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { LeaderboardType } from '../value-objects/LeaderboardType';

export interface LeaderboardEntryProps {
  studentId: StudentId;
  rank: number;
  score: number;
  leaderboardType: LeaderboardType;
  periodStart?: Date;
  periodEnd?: Date;
  updatedAt: Date;
}

/**
 * 리더보드 항목 엔티티
 * 특정 학생의 리더보드 순위와 점수를 나타냅니다
 */
export class LeaderboardEntry extends Entity<LeaderboardEntryProps> {
  get studentId(): StudentId {
    return this.props.studentId;
  }

  get rank(): number {
    return this.props.rank;
  }

  get score(): number {
    return this.props.score;
  }

  get leaderboardType(): LeaderboardType {
    return this.props.leaderboardType;
  }

  get periodStart(): Date | undefined {
    return this.props.periodStart;
  }

  get periodEnd(): Date | undefined {
    return this.props.periodEnd;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static create(props: LeaderboardEntryProps, id?: UniqueEntityID): Result<LeaderboardEntry> {
    // 비즈니스 규칙 검증
    if (props.rank <= 0) {
      return Result.fail('Rank must be positive');
    }

    if (props.score < 0) {
      return Result.fail('Score cannot be negative');
    }

    if (props.periodStart && props.periodEnd && props.periodStart >= props.periodEnd) {
      return Result.fail('Period start must be before period end');
    }

    const entry = new LeaderboardEntry(props, id);
    return Result.ok(entry);
  }

  /**
   * 순위를 업데이트합니다
   */
  public updateRank(newRank: number): Result<void> {
    if (newRank <= 0) {
      return Result.fail('Rank must be positive');
    }

    this.props.rank = newRank;
    this.props.updatedAt = new Date();
    return Result.ok();
  }

  /**
   * 점수를 업데이트합니다
   */
  public updateScore(newScore: number): Result<void> {
    if (newScore < 0) {
      return Result.fail('Score cannot be negative');
    }

    this.props.score = newScore;
    this.props.updatedAt = new Date();
    return Result.ok();
  }

  /**
   * 순위와 점수를 동시에 업데이트합니다
   */
  public updateRankAndScore(newRank: number, newScore: number): Result<void> {
    if (newRank <= 0) {
      return Result.fail('Rank must be positive');
    }

    if (newScore < 0) {
      return Result.fail('Score cannot be negative');
    }

    this.props.rank = newRank;
    this.props.score = newScore;
    this.props.updatedAt = new Date();
    return Result.ok();
  }

  /**
   * 상위 순위인지 확인합니다 (3위 이내)
   */
  public isTopRank(): boolean {
    return this.props.rank <= 3;
  }

  /**
   * 순위 변동을 계산합니다
   */
  public calculateRankChange(previousRank?: number): number {
    if (previousRank === undefined) {
      return 0;
    }
    return previousRank - this.props.rank; // 양수면 순위 상승, 음수면 하락
  }

  /**
   * 기간이 설정된 리더보드인지 확인합니다
   */
  public hasPeriod(): boolean {
    return this.props.periodStart !== undefined && this.props.periodEnd !== undefined;
  }
}