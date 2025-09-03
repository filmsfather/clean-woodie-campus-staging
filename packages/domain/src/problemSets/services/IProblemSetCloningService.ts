import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { ProblemSet } from '../entities/ProblemSet';
import { ProblemSetTitle } from '../value-objects/ProblemSetTitle';
import { ProblemSetDescription } from '../value-objects/ProblemSetDescription';

// 복제 옵션
export interface ProblemSetCloneOptions {
  preserveTitle?: boolean;
  newTitle?: ProblemSetTitle;
  preserveDescription?: boolean;
  newDescription?: ProblemSetDescription;
  preserveItemOrder?: boolean;
  excludeProblemIds?: UniqueEntityID[];
  onlyIncludeProblemIds?: UniqueEntityID[];
}

// 복제 결과
export interface ProblemSetCloneResult {
  clonedProblemSet: ProblemSet;
  originalItemCount: number;
  clonedItemCount: number;
  excludedItemCount: number;
  duplicatedItems: string[]; // 이미 대상 교사가 가지고 있던 문제들
}

// 일괄 복제 결과
export interface BulkCloneResult {
  successfulClones: ProblemSetCloneResult[];
  failedClones: Array<{
    originalProblemSetId: string;
    error: string;
  }>;
  summary: {
    totalAttempted: number;
    successCount: number;
    failCount: number;
    totalItemsCloned: number;
  };
}

// 복제 충돌 해결 전략
export enum CloneConflictResolution {
  SKIP = 'skip',           // 충돌 시 건너뛰기
  RENAME = 'rename',       // 자동으로 이름 변경
  OVERWRITE = 'overwrite', // 덮어쓰기
  MERGE = 'merge'          // 병합 (문제 추가)
}

/**
 * ProblemSet 복제 도메인 서비스
 * 문제집 복제, 공유, 템플릿 생성 등의 복잡한 비즈니스 로직을 담당
 */
export interface IProblemSetCloningService {
  
  // === 기본 복제 ===
  
  // 단일 문제집 복제
  cloneProblemSet(
    source: ProblemSet,
    targetTeacherId: string,
    options?: ProblemSetCloneOptions
  ): Promise<Result<ProblemSetCloneResult>>;
  
  // 문제집 ID로 복제
  cloneProblemSetById(
    sourceProblemSetId: UniqueEntityID,
    targetTeacherId: string,
    options?: ProblemSetCloneOptions
  ): Promise<Result<ProblemSetCloneResult>>;
  
  // === 일괄 복제 ===
  
  // 여러 문제집 일괄 복제
  bulkCloneProblemSets(
    sources: ProblemSet[],
    targetTeacherId: string,
    options?: ProblemSetCloneOptions
  ): Promise<Result<BulkCloneResult>>;
  
  // 교사의 모든 문제집 복제
  cloneAllFromTeacher(
    sourceTeacherId: string,
    targetTeacherId: string,
    options?: ProblemSetCloneOptions
  ): Promise<Result<BulkCloneResult>>;
  
  // === 선택적 복제 ===
  
  // 조건에 맞는 문제집만 복제
  cloneByFilter(
    sourceTeacherId: string,
    targetTeacherId: string,
    filter: {
      titleContains?: string;
      minItemCount?: number;
      maxItemCount?: number;
      createdAfter?: Date;
      hasDescription?: boolean;
    },
    options?: ProblemSetCloneOptions
  ): Promise<Result<BulkCloneResult>>;
  
  // 특정 문제들을 포함한 문제집만 복제
  cloneContainingProblems(
    sourceTeacherId: string,
    targetTeacherId: string,
    problemIds: UniqueEntityID[],
    options?: ProblemSetCloneOptions
  ): Promise<Result<BulkCloneResult>>;
  
  // === 고급 복제 ===
  
  // 문제집 병합 (여러 문제집을 하나로)
  mergeProblemSets(
    sourceProblemSets: ProblemSet[],
    targetTeacherId: string,
    newTitle: ProblemSetTitle,
    newDescription?: ProblemSetDescription
  ): Promise<Result<ProblemSet>>;
  
  // 문제집 분할 (큰 문제집을 여러 개로)
  splitProblemSet(
    source: ProblemSet,
    targetTeacherId: string,
    splitStrategy: {
      type: 'by_count' | 'by_tags' | 'by_difficulty';
      maxItemsPerSet?: number;
      targetSetCount?: number;
    }
  ): Promise<Result<ProblemSet[]>>;
  
  // === 템플릿 및 공유 ===
  
  // 템플릿으로 변환 (특정 항목들 제거하여 재사용 가능하게)
  createTemplate(
    source: ProblemSet,
    options: {
      removeTeacherSpecificData?: boolean;
      keepOnlyStructure?: boolean;
      anonymize?: boolean;
    }
  ): Promise<Result<ProblemSet>>;
  
  // 템플릿에서 문제집 생성
  createFromTemplate(
    template: ProblemSet,
    targetTeacherId: string,
    customizations: {
      title: ProblemSetTitle;
      description?: ProblemSetDescription;
      problemReplacements?: Map<UniqueEntityID, UniqueEntityID>;
    }
  ): Promise<Result<ProblemSet>>;
  
  // === 충돌 처리 ===
  
  // 제목 충돌 확인
  checkTitleConflict(
    teacherId: string,
    title: string
  ): Promise<Result<boolean>>;
  
  // 충돌 해결과 함께 복제
  cloneWithConflictResolution(
    source: ProblemSet,
    targetTeacherId: string,
    conflictResolution: CloneConflictResolution,
    options?: ProblemSetCloneOptions
  ): Promise<Result<ProblemSetCloneResult>>;
  
  // === 검증 및 미리보기 ===
  
  // 복제 가능성 검증
  validateCloneability(
    sourceProblemSetId: UniqueEntityID,
    targetTeacherId: string
  ): Promise<Result<{
    canClone: boolean;
    issues: string[];
    warnings: string[];
  }>>;
  
  // 복제 미리보기 (실제 복제하지 않고 결과 예측)
  previewClone(
    sourceProblemSetId: UniqueEntityID,
    targetTeacherId: string,
    options?: ProblemSetCloneOptions
  ): Promise<Result<{
    estimatedResult: Omit<ProblemSetCloneResult, 'clonedProblemSet'>;
    conflicts: string[];
    warnings: string[];
  }>>;
}