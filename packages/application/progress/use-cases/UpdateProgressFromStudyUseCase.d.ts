import { BaseUseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { ProgressTrackingApplicationService } from '../services/ProgressTrackingApplicationService';
import { UpdateProgressResponse } from '../dto/ProgressDto';
export interface UpdateProgressFromStudyUseCaseRequest {
    studentId: string;
    problemId: string;
    problemSetId: string;
    isCorrect: boolean;
    responseTime: number;
    totalProblemsInSet: number;
    studyDate?: Date;
    metadata?: {
        problemType?: string;
        difficulty?: number;
        tags?: string[];
    };
}
export interface UpdateProgressFromStudyUseCaseResponse {
    updateResult: UpdateProgressResponse;
    achievements?: {
        streakMilestones?: number[];
        newPersonalRecord?: boolean;
        problemSetCompleted?: boolean;
        performanceImprovement?: boolean;
    };
    notifications?: {
        streakReminder?: boolean;
        encouragementMessage?: string;
        parentNotification?: boolean;
    };
}
/**
 * 학습 활동 기반 진도 업데이트 UseCase
 *
 * StudyRecord가 생성될 때 자동으로 호출되어 스트릭과 통계를 업데이트
 *
 * 비즈니스 규칙:
 * - 유효한 학습 활동만 진도에 반영
 * - 같은 날 여러 번 학습해도 스트릭은 1일로 계산
 * - 통계는 실시간으로 업데이트됨
 * - 중요한 성취(이정표, 완료 등)는 별도 처리
 */
export declare class UpdateProgressFromStudyUseCase extends BaseUseCase<UpdateProgressFromStudyUseCaseRequest, UpdateProgressFromStudyUseCaseResponse> {
    private progressService;
    constructor(progressService: ProgressTrackingApplicationService);
    execute(request: UpdateProgressFromStudyUseCaseRequest): Promise<Result<UpdateProgressFromStudyUseCaseResponse>>;
    private validateRequest;
    private analyzeAchievements;
    private checkNotificationNeeds;
    private generateEncouragementMessage;
}
//# sourceMappingURL=UpdateProgressFromStudyUseCase.d.ts.map