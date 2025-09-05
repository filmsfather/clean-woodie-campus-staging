import { UniqueEntityID, Result, ReviewFeedback, StudyRecord } from '@woodie/domain';
/**
 * 학습 기록 생성 Use Case
 *
 * 비즈니스 규칙:
 * - 복습 완료 후 학습 기록이 자동으로 생성됨
 * - 성과 점수가 자동 계산됨
 * - 학습 패턴이 분석되어 저장됨
 * - 생성된 기록은 불변 객체로 저장됨
 */
export class CreateStudyRecordUseCase {
    studyRecordRepository;
    constructor(studyRecordRepository) {
        this.studyRecordRepository = studyRecordRepository;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            // 2. 도메인 객체 생성
            const studentId = new UniqueEntityID(request.studentId);
            const problemId = new UniqueEntityID(request.problemId);
            const feedbackResult = ReviewFeedback.create(request.feedback);
            if (feedbackResult.isFailure) {
                return Result.fail(`Invalid feedback: ${feedbackResult.error}`);
            }
            const feedback = feedbackResult.getValue();
            // 3. StudyRecord 엔티티 생성
            const studyRecordResult = StudyRecord.create({
                studentId,
                problemId,
                feedback,
                isCorrect: request.isCorrect,
                responseTime: request.responseTime,
                answerContent: request.answerContent
            });
            if (studyRecordResult.isFailure) {
                return Result.fail(studyRecordResult.error);
            }
            const studyRecord = studyRecordResult.getValue();
            // 4. 레포지토리에 저장
            await this.studyRecordRepository.save(studyRecord);
            // 5. 응답 구성
            const response = {
                recordId: studyRecord.id.toString(),
                studentId: studyRecord.studentId.toString(),
                problemId: studyRecord.problemId.toString(),
                feedback: studyRecord.feedback.value,
                isCorrect: studyRecord.isCorrect,
                performanceScore: studyRecord.calculatePerformanceScore(),
                studyPattern: studyRecord.getStudyPattern(),
                createdAt: studyRecord.createdAt
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to create study record: ${error}`);
        }
    }
    /**
     * 입력 요청 유효성 검증
     */
    validateRequest(request) {
        if (!request.studentId || request.studentId.trim() === '') {
            return Result.fail('Student ID is required');
        }
        if (!request.problemId || request.problemId.trim() === '') {
            return Result.fail('Problem ID is required');
        }
        if (!request.feedback) {
            return Result.fail('Feedback is required');
        }
        const validFeedbacks = ['AGAIN', 'HARD', 'GOOD', 'EASY'];
        if (!validFeedbacks.includes(request.feedback)) {
            return Result.fail(`Invalid feedback. Must be one of: ${validFeedbacks.join(', ')}`);
        }
        if (typeof request.isCorrect !== 'boolean') {
            return Result.fail('isCorrect must be a boolean value');
        }
        if (request.responseTime !== undefined && request.responseTime < 0) {
            return Result.fail('Response time cannot be negative');
        }
        return Result.ok();
    }
}
//# sourceMappingURL=CreateStudyRecordUseCase.js.map