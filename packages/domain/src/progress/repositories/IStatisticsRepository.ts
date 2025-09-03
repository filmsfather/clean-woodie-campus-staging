import { Result } from '../../common/Result'
import { UniqueEntityID } from '../../common/Identifier'
import { Statistics } from '../entities/Statistics'

/**
 * 학습 통계 리포지토리 인터페이스
 * 학습 통계 데이터의 영속성을 관리하는 계약을 정의
 */
export interface IStatisticsRepository {
  /**
   * 학생 ID와 문제집 ID로 통계 조회
   * @param studentId 학생 ID
   * @param problemSetId 문제집 ID
   * @returns 학습 통계 또는 null
   */
  findByStudentAndProblemSet(studentId: UniqueEntityID, problemSetId: UniqueEntityID): Promise<Result<Statistics | null>>

  /**
   * 학생의 모든 문제집 통계 조회
   * @param studentId 학생 ID
   * @returns 학생의 모든 통계 리스트
   */
  findByStudentId(studentId: UniqueEntityID): Promise<Result<Statistics[]>>

  /**
   * 문제집별 모든 학생 통계 조회
   * @param problemSetId 문제집 ID
   * @returns 문제집의 모든 학생 통계 리스트
   */
  findByProblemSetId(problemSetId: UniqueEntityID): Promise<Result<Statistics[]>>

  /**
   * 통계 저장 (생성 또는 업데이트)
   * @param statistics 저장할 통계 엔티티
   * @returns 저장 결과
   */
  save(statistics: Statistics): Promise<Result<void>>

  /**
   * 통계 삭제
   * @param statisticsId 삭제할 통계 ID
   * @returns 삭제 결과
   */
  delete(statisticsId: UniqueEntityID): Promise<Result<void>>

  /**
   * 클래스별 통계 조회
   * @param classId 클래스 ID
   * @param problemSetId 문제집 ID (선택적)
   * @returns 클래스 내 학생들의 통계 리스트
   */
  findByClassId(classId: string, problemSetId?: UniqueEntityID): Promise<Result<Statistics[]>>

  /**
   * 완료율 기준 상위 학생 조회
   * @param problemSetId 문제집 ID
   * @param limit 조회할 개수 (기본: 10)
   * @returns 완료율 상위 학생들의 통계 리스트
   */
  findTopByCompletionRate(problemSetId: UniqueEntityID, limit?: number): Promise<Result<Statistics[]>>

  /**
   * 정답률 기준 상위 학생 조회
   * @param problemSetId 문제집 ID
   * @param limit 조회할 개수 (기본: 10)
   * @returns 정답률 상위 학생들의 통계 리스트
   */
  findTopByAccuracyRate(problemSetId: UniqueEntityID, limit?: number): Promise<Result<Statistics[]>>

  /**
   * 특정 기간 내 생성된 통계 조회
   * @param startDate 시작 날짜
   * @param endDate 종료 날짜
   * @returns 기간 내 생성된 통계 리스트
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<Result<Statistics[]>>

  /**
   * 문제집별 평균 통계 계산
   * @param problemSetId 문제집 ID
   * @returns 문제집의 평균 완료율, 정답률, 응답 시간 등
   */
  calculateAverageStatistics(problemSetId: UniqueEntityID): Promise<Result<{
    averageCompletionRate: number
    averageAccuracyRate: number
    averageResponseTime: number
    totalStudents: number
  }>>
}