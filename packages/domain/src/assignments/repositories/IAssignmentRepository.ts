import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { Assignment, AssignmentStatus } from '../entities/Assignment';

// Assignment 조회 필터 인터페이스
export interface AssignmentFilter {
  teacherId?: string; // 특정 교사의 과제만 조회
  problemSetId?: UniqueEntityID; // 특정 문제집과 연결된 과제만 조회
  status?: AssignmentStatus; // 특정 상태의 과제만 조회
  dueDateFrom?: Date; // 마감일 시작 범위
  dueDateTo?: Date; // 마감일 종료 범위
  isOverdue?: boolean; // 마감된 과제만 조회
}

// Assignment 정렬 옵션
export interface AssignmentSortOptions {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'title'; // 정렬 필드
  direction: 'asc' | 'desc'; // 정렬 방향
}

// Assignment 페이지네이션 결과
export interface AssignmentPageResult {
  assignments: Assignment[]; // 조회된 과제 목록
  total: number; // 전체 과제 수
  page: number; // 현재 페이지
  limit: number; // 페이지당 항목 수
  hasNext: boolean; // 다음 페이지 존재 여부
}

// Assignment Repository 인터페이스
// Clean Architecture 원칙에 따라 기본적인 CRUD 작업만 포함
// 복잡한 비즈니스 로직은 도메인 서비스에서 처리
export interface IAssignmentRepository {
  // 기본 CRUD 작업
  save(assignment: Assignment): Promise<Result<void>>;
  findById(id: UniqueEntityID): Promise<Result<Assignment>>;
  delete(id: UniqueEntityID): Promise<Result<void>>;
  exists(id: UniqueEntityID): Promise<Result<boolean>>;

  // 단순한 조회 작업
  findByTeacherId(teacherId: string): Promise<Result<Assignment[]>>;
  findByProblemSetId(problemSetId: UniqueEntityID): Promise<Result<Assignment[]>>;
  findByStatus(status: AssignmentStatus): Promise<Result<Assignment[]>>;
  
  // 필터링된 조회 (페이지네이션 포함)
  findWithFilter(
    filter: AssignmentFilter,
    sort?: AssignmentSortOptions,
    page?: number,
    limit?: number
  ): Promise<Result<AssignmentPageResult>>;

  // 활성 과제 조회 (학생이 접근 가능한 과제)
  findActiveAssignments(teacherId?: string): Promise<Result<Assignment[]>>;
  
  // 마감 임박 과제 조회
  findAssignmentsDueSoon(daysFromNow: number): Promise<Result<Assignment[]>>;

  // 교사의 과제 통계 조회
  countByTeacherAndStatus(teacherId: string, status: AssignmentStatus): Promise<Result<number>>;
}