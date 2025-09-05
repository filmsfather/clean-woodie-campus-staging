import { Result } from '@woodie/domain';
import { IStudyRecordRepository } from '@woodie/domain';
export interface GetStudyRecordsRequest {
    studentId: string;
    problemId?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
}
export interface StudyRecordDTO {
    recordId: string;
    studentId: string;
    problemId: string;
    feedback: string;
    isCorrect: boolean;
    responseTime?: number;
    answerContent?: any;
    performanceScore: number;
    studyPattern: {
        pattern: 'quick_correct' | 'slow_correct' | 'quick_incorrect' | 'slow_incorrect';
        confidence: number;
    };
    createdAt: Date;
}
export interface GetStudyRecordsResponse {
    records: StudyRecordDTO[];
    totalCount: number;
    hasMore: boolean;
    summary: {
        totalRecords: number;
        correctAnswers: number;
        incorrectAnswers: number;
        averageResponseTime?: number;
        averagePerformanceScore: number;
    };
}
/**
 * 학습 기록 조회 Use Case
 *
 * 비즈니스 규칙:
 * - 인증된 사용자만 자신의 학습 기록을 조회할 수 있음
 * - 기간별, 문제별 필터링 지원
 * - 페이지네이션 지원
 * - 요약 통계 정보 제공
 */
export declare class GetStudyRecordsUseCase {
    private studyRecordRepository;
    constructor(studyRecordRepository: IStudyRecordRepository);
    execute(request: GetStudyRecordsRequest): Promise<Result<GetStudyRecordsResponse>>;
    /**
     * 입력 요청 유효성 검증
     */
    private validateRequest;
    /**
     * Domain 객체를 DTO로 변환
     */
    private toDTO;
    /**
     * 요약 통계 계산
     */
    private calculateSummary;
}
//# sourceMappingURL=GetStudyRecordsUseCase.d.ts.map