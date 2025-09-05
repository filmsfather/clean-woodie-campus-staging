import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { ProblemSet } from '../entities/ProblemSet';
import { ProblemSetTitle } from '../value-objects/ProblemSetTitle';
import { ProblemSetDescription } from '../value-objects/ProblemSetDescription';
export interface ProblemSetCloneOptions {
    preserveTitle?: boolean;
    newTitle?: ProblemSetTitle;
    preserveDescription?: boolean;
    newDescription?: ProblemSetDescription;
    preserveItemOrder?: boolean;
    excludeProblemIds?: UniqueEntityID[];
    onlyIncludeProblemIds?: UniqueEntityID[];
}
export interface ProblemSetCloneResult {
    clonedProblemSet: ProblemSet;
    originalItemCount: number;
    clonedItemCount: number;
    excludedItemCount: number;
    duplicatedItems: string[];
}
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
export declare enum CloneConflictResolution {
    SKIP = "skip",// 충돌 시 건너뛰기
    RENAME = "rename",// 자동으로 이름 변경
    OVERWRITE = "overwrite",// 덮어쓰기
    MERGE = "merge"
}
/**
 * ProblemSet 복제 도메인 서비스
 * 문제집 복제, 공유, 템플릿 생성 등의 복잡한 비즈니스 로직을 담당
 */
export interface IProblemSetCloningService {
    cloneProblemSet(source: ProblemSet, targetTeacherId: string, options?: ProblemSetCloneOptions): Promise<Result<ProblemSetCloneResult>>;
    cloneProblemSetById(sourceProblemSetId: UniqueEntityID, targetTeacherId: string, options?: ProblemSetCloneOptions): Promise<Result<ProblemSetCloneResult>>;
    bulkCloneProblemSets(sources: ProblemSet[], targetTeacherId: string, options?: ProblemSetCloneOptions): Promise<Result<BulkCloneResult>>;
    cloneAllFromTeacher(sourceTeacherId: string, targetTeacherId: string, options?: ProblemSetCloneOptions): Promise<Result<BulkCloneResult>>;
    cloneByFilter(sourceTeacherId: string, targetTeacherId: string, filter: {
        titleContains?: string;
        minItemCount?: number;
        maxItemCount?: number;
        createdAfter?: Date;
        hasDescription?: boolean;
    }, options?: ProblemSetCloneOptions): Promise<Result<BulkCloneResult>>;
    cloneContainingProblems(sourceTeacherId: string, targetTeacherId: string, problemIds: UniqueEntityID[], options?: ProblemSetCloneOptions): Promise<Result<BulkCloneResult>>;
    mergeProblemSets(sourceProblemSets: ProblemSet[], targetTeacherId: string, newTitle: ProblemSetTitle, newDescription?: ProblemSetDescription): Promise<Result<ProblemSet>>;
    splitProblemSet(source: ProblemSet, targetTeacherId: string, splitStrategy: {
        type: 'by_count' | 'by_tags' | 'by_difficulty';
        maxItemsPerSet?: number;
        targetSetCount?: number;
    }): Promise<Result<ProblemSet[]>>;
    createTemplate(source: ProblemSet, options: {
        removeTeacherSpecificData?: boolean;
        keepOnlyStructure?: boolean;
        anonymize?: boolean;
    }): Promise<Result<ProblemSet>>;
    createFromTemplate(template: ProblemSet, targetTeacherId: string, customizations: {
        title: ProblemSetTitle;
        description?: ProblemSetDescription;
        problemReplacements?: Map<UniqueEntityID, UniqueEntityID>;
    }): Promise<Result<ProblemSet>>;
    checkTitleConflict(teacherId: string, title: string): Promise<Result<boolean>>;
    cloneWithConflictResolution(source: ProblemSet, targetTeacherId: string, conflictResolution: CloneConflictResolution, options?: ProblemSetCloneOptions): Promise<Result<ProblemSetCloneResult>>;
    validateCloneability(sourceProblemSetId: UniqueEntityID, targetTeacherId: string): Promise<Result<{
        canClone: boolean;
        issues: string[];
        warnings: string[];
    }>>;
    previewClone(sourceProblemSetId: UniqueEntityID, targetTeacherId: string, options?: ProblemSetCloneOptions): Promise<Result<{
        estimatedResult: Omit<ProblemSetCloneResult, 'clonedProblemSet'>;
        conflicts: string[];
        warnings: string[];
    }>>;
}
//# sourceMappingURL=IProblemSetCloningService.d.ts.map