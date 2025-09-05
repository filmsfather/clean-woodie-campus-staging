import { ReviewCompletedEvent } from '@woodie/domain/srs';
import { IStudyRecordRepository } from '@woodie/domain/srs';
/**
 * ReviewCompleted 이벤트 핸들러
 * 복습 완료 시 StudyRecord를 생성하는 Infrastructure 레이어 컴포넌트
 *
 * 트랜잭션 경계:
 * - ReviewSchedule 저장과 별개의 트랜잭션으로 실행
 * - 실패 시 재시도 가능하도록 설계
 */
export declare class ReviewCompletedEventHandler {
    private studyRecordRepository;
    constructor(studyRecordRepository: IStudyRecordRepository);
    /**
     * ReviewCompleted 이벤트 처리
     * StudyRecord 생성 및 저장
     */
    handle(event: ReviewCompletedEvent): Promise<void>;
    /**
     * 이벤트 처리 가능 여부 확인
     */
    canHandle(eventType: string): boolean;
    /**
     * 배치로 여러 이벤트 처리 (성능 최적화용)
     */
    handleBatch(events: ReviewCompletedEvent[]): Promise<void>;
}
//# sourceMappingURL=ReviewCompletedEventHandler.d.ts.map