import { Result, ReviewFeedbackType } from '@woodie/domain';
import { IStudyRecordRepository } from '@woodie/domain';
export interface CreateStudyRecordRequest {
    studentId: string;
    problemId: string;
    feedback: ReviewFeedbackType;
    isCorrect: boolean;
    responseTime?: number;
    answerContent?: any;
}
export interface CreateStudyRecordResponse {
    recordId: string;
    studentId: string;
    problemId: string;
    feedback: ReviewFeedbackType;
    isCorrect: boolean;
    performanceScore: number;
    studyPattern: {
        pattern: 'quick_correct' | 'slow_correct' | 'quick_incorrect' | 'slow_incorrect';
        confidence: number;
    };
    createdAt: Date;
}
/**
 * 학습 기록 생성 Use Case
 *
 * 비즈니스 규칙:
 * - 복습 완료 후 학습 기록이 자동으로 생성됨
 * - 성과 점수가 자동 계산됨
 * - 학습 패턴이 분석되어 저장됨
 * - 생성된 기록은 불변 객체로 저장됨
 */
export declare class CreateStudyRecordUseCase {
    private studyRecordRepository;
    constructor(studyRecordRepository: IStudyRecordRepository);
    execute(request: CreateStudyRecordRequest): Promise<Result<CreateStudyRecordResponse>>;
    /**
     * 입력 요청 유효성 검증
     */
    private validateRequest;
}
//# sourceMappingURL=CreateStudyRecordUseCase.d.ts.map