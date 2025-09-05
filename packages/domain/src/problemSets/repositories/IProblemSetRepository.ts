import { ProblemSet } from '../entities/ProblemSet';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';

/**
 * ProblemSet Repository Interface - 단순한 데이터 저장소 역할만 담당
 * 복잡한 검색, 통계, 복제 로직은 별도 Domain Service로 분리
 */
export interface IProblemSetRepository {
  
  // === 기본 CRUD 작업 ===
  
  // 문제집 저장 (생성 또는 업데이트)
  save(problemSet: ProblemSet): Promise<Result<void>>;
  
  // ID로 문제집 조회
  findById(id: UniqueEntityID): Promise<Result<ProblemSet>>;
  
  // 문제집 삭제 (물리적 삭제)
  delete(id: UniqueEntityID): Promise<Result<void>>;
  
  // === 단순한 조회 작업 ===
  
  // 교사의 모든 문제집 조회 (단순 목록)
  findByTeacherId(teacherId: string): Promise<Result<ProblemSet[]>>;
  
  // 특정 문제가 포함된 문제집들 조회
  findProblemSetsByProblemId(problemId: UniqueEntityID): Promise<Result<ProblemSet[]>>;
  
  // 여러 문제가 포함된 문제집들 조회
  findProblemSetsByProblemIds(problemIds: UniqueEntityID[]): Promise<Result<ProblemSet[]>>;
  
  // 제목으로 문제집 조회 (정확 일치)
  findByTeacherIdAndTitle(teacherId: string, title: string): Promise<Result<ProblemSet>>;
  
  // === 존재 확인 및 소유권 검증 ===
  
  // 문제집 존재 여부 확인
  exists(id: UniqueEntityID): Promise<Result<boolean>>;
  
  // 여러 문제집 존재 여부 일괄 확인
  existsMany(ids: UniqueEntityID[]): Promise<Result<Array<{ id: string; exists: boolean }>>>;
  
  // 교사의 문제집 소유권 확인
  verifyOwnership(problemSetId: UniqueEntityID, teacherId: string): Promise<Result<boolean>>;
  
  // 일괄 소유권 확인
  bulkVerifyOwnership(
    problemSetIds: UniqueEntityID[],
    teacherId: string
  ): Promise<Result<Array<{ id: string; isOwner: boolean }>>>;
  
  // === 단순한 카운팅 ===
  
  // 교사의 문제집 개수 조회
  countByTeacherId(teacherId: string): Promise<Result<number>>;
  
  // 특정 문제를 사용하는 문제집 개수 조회
  countProblemSetsByProblemId(problemId: UniqueEntityID): Promise<Result<number>>;
  
  // === 공유 관련 조회 ===
  
  // 공유된 문제집들 조회 (isShared=true)
  findSharedProblemSets(): Promise<Result<ProblemSet[]>>;
  
  // 공개된 문제집들 조회 (isPublic=true)
  findPublicProblemSets(): Promise<Result<ProblemSet[]>>;
  
  // 특정 교사를 제외한 공유된 문제집들 조회
  findSharedProblemSetsExcludingTeacher(excludeTeacherId: string): Promise<Result<ProblemSet[]>>;
}