import { BaseUseCase } from '../../use-cases/UseCase';
import { Result, IReviewScheduleRepository } from '@woodie/domain';
/**
 * 복습 스케줄 업데이트 UseCase
 *
 * 비즈니스 규칙:
 * - 학생은 자신의 복습 스케줄만 수정 가능
 * - 교사/관리자는 학생의 복습 스케줄 조정 가능
 * - 다음 복습 시간, 간격, 난이도 팩터 수정 가능
 * - 스케줄 수정 시 이력이 기록됨
 * - 완료된 스케줄은 수정 불가
 */
export interface UpdateReviewScheduleRequest {
    scheduleId: string;
    requesterId: string;
    requesterRole: 'student' | 'teacher' | 'admin';
    updates: {
        nextReviewAt?: Date;
        currentInterval?: number;
        easeFactor?: number;
        priority?: 'low' | 'medium' | 'high';
        notes?: string;
        postponeBy?: {
            hours?: number;
            days?: number;
        };
        advanceBy?: {
            hours?: number;
            days?: number;
        };
    };
    reason?: string;
}
export interface UpdateReviewScheduleResponse {
    scheduleId: string;
    studentId: string;
    problemId: string;
    previousNextReviewAt: Date;
    newNextReviewAt: Date;
    previousInterval: number;
    newInterval: number;
    previousEaseFactor: number;
    newEaseFactor: number;
    updatedFields: string[];
    updatedAt: Date;
    updatedBy: string;
    updateReason?: string;
}
export declare class UpdateReviewScheduleUseCase extends BaseUseCase<UpdateReviewScheduleRequest, UpdateReviewScheduleResponse> {
    private reviewScheduleRepository;
    constructor(reviewScheduleRepository: IReviewScheduleRepository);
    execute(request: UpdateReviewScheduleRequest): Promise<Result<UpdateReviewScheduleResponse>>;
    private validateRequest;
    private hasUpdatePermission;
}
//# sourceMappingURL=UpdateReviewScheduleUseCase.d.ts.map