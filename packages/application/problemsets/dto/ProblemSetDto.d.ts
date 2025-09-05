/**
 * ProblemSet 관련 DTO 정의
 * DDD: Application Layer의 DTO는 도메인 엔티티와 외부 인터페이스 간의 변환을 담당
 */
export interface ProblemSetDto {
    id: string;
    title: string;
    description?: string;
    teacherId: string;
    teacherName?: string;
    itemCount: number;
    totalPoints?: number;
    estimatedTimeMinutes?: number;
    isPublic: boolean;
    isShared: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProblemSetItemDto {
    id: string;
    problemId: string;
    problemTitle?: string;
    problemType?: string;
    orderIndex: number;
    points: number;
    settings?: Record<string, any>;
}
export interface DetailedProblemSetDto extends ProblemSetDto {
    items: ProblemSetItemDto[];
}
export interface CreateProblemSetRequest {
    title: string;
    description?: string;
    teacherId: string;
    isPublic?: boolean;
    isShared?: boolean;
    initialProblems?: Array<{
        problemId: string;
        orderIndex: number;
        points?: number;
    }>;
}
export interface CreateProblemSetResponse {
    problemSet: ProblemSetDto;
    validationWarnings?: string[];
}
export interface GetProblemSetRequest {
    problemSetId: string;
    requesterId: string;
    requesterRole: 'student' | 'teacher' | 'admin';
    includeItems?: boolean;
}
export interface GetProblemSetResponse {
    problemSet: DetailedProblemSetDto;
    permissions: ProblemSetPermissionsDto;
}
export interface UpdateProblemSetRequest {
    problemSetId: string;
    requesterId: string;
    updates: {
        title?: string;
        description?: string;
        isPublic?: boolean;
        isShared?: boolean;
    };
}
export interface UpdateProblemSetResponse {
    problemSet: ProblemSetDto;
    updatedFields: string[];
}
export interface DeleteProblemSetRequest {
    problemSetId: string;
    requesterId: string;
    force?: boolean;
}
export interface DeleteProblemSetResponse {
    success: boolean;
    warnings?: string[];
}
export interface GetProblemSetListRequest {
    requesterId: string;
    requesterRole: 'student' | 'teacher' | 'admin';
    filters?: {
        teacherId?: string;
        isPublic?: boolean;
        isShared?: boolean;
        search?: string;
    };
    pagination?: {
        page: number;
        limit: number;
    };
    sorting?: {
        field: 'title' | 'createdAt' | 'updatedAt' | 'itemCount';
        order: 'asc' | 'desc';
    };
}
export interface GetProblemSetListResponse {
    problemSets: ProblemSetDto[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
    filters: {
        applied: any;
        available: {
            teachers: string[];
            tags: string[];
        };
    };
}
export interface AddProblemToProblemSetRequest {
    problemSetId: string;
    problemId: string;
    requesterId: string;
    orderIndex?: number;
    points?: number;
}
export interface AddProblemToProblemSetResponse {
    problemSet: DetailedProblemSetDto;
    addedItem: ProblemSetItemDto;
}
export interface RemoveProblemFromProblemSetRequest {
    problemSetId: string;
    problemId: string;
    requesterId: string;
}
export interface RemoveProblemFromProblemSetResponse {
    problemSet: DetailedProblemSetDto;
    removedItem: ProblemSetItemDto;
}
export interface ReorderProblemSetItemsRequest {
    problemSetId: string;
    requesterId: string;
    orderedProblemIds: string[];
}
export interface ReorderProblemSetItemsResponse {
    problemSet: DetailedProblemSetDto;
    reorderedItems: ProblemSetItemDto[];
}
export interface CloneProblemSetRequest {
    sourceProblemSetId: string;
    targetTeacherId: string;
    newTitle?: string;
    newDescription?: string;
    isPublic?: boolean;
    isShared?: boolean;
}
export interface CloneProblemSetResponse {
    clonedProblemSet: ProblemSetDto;
    originalProblemSet: Pick<ProblemSetDto, 'id' | 'title' | 'teacherName'>;
}
export interface ProblemSetPermissionsDto {
    problemSetId: string;
    userId: string;
    userRole: 'student' | 'teacher' | 'admin';
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canShare: boolean;
    canClone: boolean;
    isOwner: boolean;
}
export interface ProblemSetValidationResult {
    valid: boolean;
    errors: Array<{
        field: string;
        code: string;
        message: string;
    }>;
    warnings: Array<{
        field: string;
        code: string;
        message: string;
    }>;
}
//# sourceMappingURL=ProblemSetDto.d.ts.map