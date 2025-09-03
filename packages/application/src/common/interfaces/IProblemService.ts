import { UniqueEntityID } from '@woodie/domain'
import { Result } from '@woodie/domain'

/**
 * 문제 서비스 인터페이스
 * Application 레이어에서 정의하고 Infrastructure에서 구현
 */
export interface IProblemService {
  // 문제 조회
  getProblem(problemId: UniqueEntityID): Promise<Result<any>>
  
  // 교사의 문제 목록 조회
  getTeacherProblems(teacherId: string): Promise<Result<any[]>>
  
  // 문제 검색
  searchProblems(query: string, filters?: any): Promise<Result<any[]>>
  
  // 문제 생성
  createProblem(data: any): Promise<Result<UniqueEntityID>>
  
  // 문제 업데이트
  updateProblem(problemId: UniqueEntityID, data: any): Promise<Result<void>>
  
  // 문제 삭제
  deleteProblem(problemId: UniqueEntityID): Promise<Result<void>>
  
  // 인기 문제 조회
  getPopularProblems(limit?: number): Promise<Result<any[]>>
  
  // 교사별 문제 조회
  getProblemsByTeacher(teacherId: string): Promise<Result<any[]>>
}