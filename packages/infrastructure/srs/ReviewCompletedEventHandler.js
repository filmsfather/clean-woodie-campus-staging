import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { StudyRecord, ReviewFeedback } from '@woodie/domain/srs';
/**
 * ReviewCompleted 이벤트 핸들러
 * 복습 완료 시 StudyRecord를 생성하는 Infrastructure 레이어 컴포넌트
 *
 * 트랜잭션 경계:
 * - ReviewSchedule 저장과 별개의 트랜잭션으로 실행
 * - 실패 시 재시도 가능하도록 설계
 */
export class ReviewCompletedEventHandler {
    studyRecordRepository;
    constructor(studyRecordRepository) {
        this.studyRecordRepository = studyRecordRepository;
    }
    /**
     * ReviewCompleted 이벤트 처리
     * StudyRecord 생성 및 저장
     */
    async handle(event) {
        try {
            // 1. 피드백 값 객체 생성
            const feedbackResult = ReviewFeedback.create(event.feedback);
            if (feedbackResult.isFailure) {
                throw new Error(`Invalid feedback in event: ${feedbackResult.error}`);
            }
            // 2. StudyRecord 도메인 엔티티 생성
            const studyRecordResult = StudyRecord.create({
                studentId: new UniqueEntityID(event.studentId),
                problemId: new UniqueEntityID(event.problemId),
                feedback: feedbackResult.getValue(),
                isCorrect: event.isCorrect,
                responseTime: event.responseTime,
                answerContent: event.answerContent
            });
            if (studyRecordResult.isFailure) {
                throw new Error(`Failed to create StudyRecord: ${studyRecordResult.error}`);
            }
            // 3. StudyRecord 저장
            await this.studyRecordRepository.save(studyRecordResult.getValue());
            console.log(`StudyRecord created for review: ${event.aggregateId}`);
        }
        catch (error) {
            // ⭐ 실제 운영 환경에서는 재시도 큐나 데드레터 큐로 전송
            console.error('Failed to handle ReviewCompletedEvent:', {
                eventId: event.aggregateId,
                error: error instanceof Error ? error.message : error
            });
            // 필요시 재시도 로직 또는 알림 발송
            throw error; // 상위로 에러 전파하여 재시도 가능하게 함
        }
    }
    /**
     * 이벤트 처리 가능 여부 확인
     */
    canHandle(eventType) {
        return eventType === 'ReviewCompletedEvent';
    }
    /**
     * 배치로 여러 이벤트 처리 (성능 최적화용)
     */
    async handleBatch(events) {
        const studyRecords = [];
        // 1. 모든 이벤트를 StudyRecord로 변환
        for (const event of events) {
            try {
                const feedbackResult = ReviewFeedback.create(event.feedback);
                if (feedbackResult.isFailure)
                    continue;
                const studyRecordResult = StudyRecord.create({
                    studentId: new UniqueEntityID(event.studentId),
                    problemId: new UniqueEntityID(event.problemId),
                    feedback: feedbackResult.getValue(),
                    isCorrect: event.isCorrect,
                    responseTime: event.responseTime,
                    answerContent: event.answerContent
                });
                if (studyRecordResult.isSuccess) {
                    studyRecords.push(studyRecordResult.getValue());
                }
            }
            catch (error) {
                console.error(`Failed to process event ${event.aggregateId}:`, error);
            }
        }
        // 2. 배치로 저장
        for (const record of studyRecords) {
            try {
                await this.studyRecordRepository.save(record);
            }
            catch (error) {
                console.error(`Failed to save StudyRecord ${record.id}:`, error);
            }
        }
        console.log(`Processed ${studyRecords.length} StudyRecords in batch`);
    }
}
//# sourceMappingURL=ReviewCompletedEventHandler.js.map