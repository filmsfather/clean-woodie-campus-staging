import { UniqueEntityID } from '../../common/Identifier'
import { StudyRecord } from '../entities/StudyRecord'

/**
 * 학습 기록 리포지토리 인터페이스 (Domain Layer)
 * 의존성 역전 원칙에 따라 Domain에서 계약 정의
 */
export interface IStudyRecordRepository {
  /**
   * 학습 기록 저장
   */
  save(record: StudyRecord): Promise<void>

  /**
   * 특정 학생의 학습 기록 조회
   */
  findByStudent(studentId: UniqueEntityID, limit?: number): Promise<StudyRecord[]>

  /**
   * 특정 학생의 학습 기록 조회 (별칭)
   */
  findByStudentId(studentId: UniqueEntityID, limit?: number): Promise<StudyRecord[]>

  /**
   * 특정 문제의 학습 기록 조회
   */
  findByProblem(problemId: UniqueEntityID, limit?: number): Promise<StudyRecord[]>

  /**
   * 특정 문제의 학습 기록 조회 (별칭)
   */
  findByProblemId(problemId: UniqueEntityID, limit?: number): Promise<StudyRecord[]>

  /**
   * 특정 학생의 특정 문제 학습 기록 조회
   */
  findByStudentAndProblem(
    studentId: UniqueEntityID, 
    problemId: UniqueEntityID
  ): Promise<StudyRecord[]>

  /**
   * 학생의 총 학습 기록 수 조회
   */
  countByStudent(studentId: UniqueEntityID): Promise<number>

  /**
   * 학생의 총 학습 기록 수 조회 (별칭)
   */
  countByStudentId(studentId: UniqueEntityID): Promise<number>

  /**
   * 특정 날짜 범위의 학습 기록 조회
   */
  findByDateRange(
    studentId: UniqueEntityID,
    startDate: Date,
    endDate: Date
  ): Promise<StudyRecord[]>
}