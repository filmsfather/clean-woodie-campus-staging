import { Result } from '../../common/Result';
import { LeaderboardEntry } from '../entities/LeaderboardEntry';
import { LeaderboardType } from '../value-objects/LeaderboardType';
import { StudentId } from '../../assignments/value-objects/StudentId';
import { UniqueEntityID } from '../../common/Identifier';

export interface ILeaderboardRepository {
  /**
   * 리더보드 조회
   */
  getLeaderboard(
    type: LeaderboardType,
    limit: number,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<Result<LeaderboardEntry[]>>;

  /**
   * 학생의 특정 리더보드에서의 순위 조회
   */
  getStudentRank(
    studentId: StudentId,
    type: LeaderboardType,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<Result<LeaderboardEntry | null>>;

  /**
   * 리더보드 엔트리 저장
   */
  save(entry: LeaderboardEntry): Promise<Result<void>>;

  /**
   * 여러 리더보드 엔트리를 일괄 저장
   */
  saveBatch(entries: LeaderboardEntry[]): Promise<Result<void>>;

  /**
   * 리더보드 엔트리 삭제
   */
  delete(id: UniqueEntityID): Promise<Result<void>>;

  /**
   * 특정 기간의 리더보드 엔트리들 삭제
   */
  deleteByPeriod(
    type: LeaderboardType,
    periodStart: Date,
    periodEnd: Date
  ): Promise<Result<void>>;

  /**
   * 토큰 잔액 기준 리더보드 데이터 조회
   */
  getTokenBalanceData(limit: number): Promise<Result<{
    studentId: StudentId;
    score: number;
  }[]>>;

  /**
   * 총 토큰 획득량 기준 리더보드 데이터 조회
   */
  getTokenEarnedData(limit: number): Promise<Result<{
    studentId: StudentId;
    score: number;
  }[]>>;

  /**
   * 업적 개수 기준 리더보드 데이터 조회
   */
  getAchievementCountData(limit: number): Promise<Result<{
    studentId: StudentId;
    score: number;
  }[]>>;

  /**
   * 기간별 토큰 획득량 기준 리더보드 데이터 조회
   */
  getTokenEarnedByPeriodData(
    startDate: Date,
    endDate: Date,
    limit: number
  ): Promise<Result<{
    studentId: StudentId;
    score: number;
  }[]>>;
}