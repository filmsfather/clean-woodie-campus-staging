import { UniqueEntityID } from '@woodie/domain'
import { Result } from '@woodie/domain'

/**
 * 진도 서비스 인터페이스
 * Application 레이어에서 정의하고 Infrastructure에서 구현
 */
export interface IProgressService {
  // 학생 진도 조회
  getStudentProgress(studentId: UniqueEntityID, problemSetId?: UniqueEntityID): Promise<Result<any>>
  
  // 클래스 전체 진도 조회
  getClassProgress(classId: string): Promise<Result<any[]>>
  
  // 진도 업데이트
  updateProgress(studentId: UniqueEntityID, problemId: UniqueEntityID, isCorrect: boolean): Promise<Result<void>>
  
  // 통계 데이터 조회
  getStatistics(studentId: UniqueEntityID, timeRange?: { from: Date; to: Date }): Promise<Result<any>>
  
  // 상위 스트릭 조회
  getTopStreaks(limit?: number): Promise<Result<any[]>>
  
  // 위험 학생 조회
  getAtRiskStudents(): Promise<Result<any[]>>
  
  // 시스템 진도 통계
  getSystemProgressStats(): Promise<Result<any>>
  
  // 학생 스트릭 조회
  getStudentStreak(studentId: UniqueEntityID): Promise<Result<any>>
  
  // 학생 통계 조회
  getStudentStatistics(studentId: UniqueEntityID): Promise<Result<any>>
}