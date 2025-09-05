import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IReviewScheduleRepository } from '@woodie/domain';
/**
 * 복습 스케줄 삭제 UseCase
 *
 * 비즈니스 규칙:
 * - 학생은 자신의 복습 스케줄만 삭제 가능
 * - 교사/관리자는 학생의 복습 스케줄 삭제 가능
 * - 완료된 스케줄은 삭제하지 않고 보관 (소프트 삭제)
 * - 진행 중인 스케줄은 완전 삭제 가능
 * - 삭제 시 관련 통계 데이터는 유지
 * - 일괄 삭제 지원
 */
export interface DeleteReviewScheduleRequest {
    scheduleIds: string[];
    requesterId: string;
    requesterRole: 'student' | 'teacher' | 'admin';
    deleteType: 'soft' | 'hard';
    reason?: string;
    preserveStatistics?: boolean;
}
export interface DeleteReviewScheduleResponse {
    deletedSchedules: Array<{
        scheduleId: string;
        studentId: string;
        problemId: string;
        wasCompleted: boolean;
        deleteType: 'soft' | 'hard';
        deletedAt: Date;
    }>;
    failures: Array<{
        scheduleId: string;
        reason: string;
        error: string;
    }>;
    summary: {
        totalRequested: number;
        totalDeleted: number;
        totalFailed: number;
        softDeleted: number;
        hardDeleted: number;
    };
    warnings?: string[];
}
export declare class DeleteReviewScheduleUseCase extends BaseUseCase<DeleteReviewScheduleRequest, DeleteReviewScheduleResponse> {
    private reviewScheduleRepository;
    constructor(reviewScheduleRepository: IReviewScheduleRepository);
    execute(request: DeleteReviewScheduleRequest): Promise<Result<DeleteReviewScheduleResponse>>;
    private validateRequest;
    private validateSchedulesForDeletion;
    private deleteSchedule;
    private hasDeletePermission;
}
//# sourceMappingURL=DeleteReviewScheduleUseCase.d.ts.map