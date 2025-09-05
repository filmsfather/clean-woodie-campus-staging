import { Entity } from '../../entities/Entity';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
import { ReviewFeedback } from '../value-objects/ReviewFeedback';
interface StudyRecordProps {
    studentId: UniqueEntityID;
    problemId: UniqueEntityID;
    feedback: ReviewFeedback;
    isCorrect: boolean;
    responseTime?: number;
    answerContent?: any;
    createdAt: Date;
}
/**
 * 학습 기록 엔티티
 * 개별 복습 세션의 결과를 기록하는 불변 객체
 */
export declare class StudyRecord extends Entity<StudyRecordProps> {
    private constructor();
    get studentId(): UniqueEntityID;
    get problemId(): UniqueEntityID;
    get feedback(): ReviewFeedback;
    get isCorrect(): boolean;
    get responseTime(): number | undefined;
    get answerContent(): any;
    get createdAt(): Date;
    /**
     * 새로운 StudyRecord 생성
     */
    static create(props: {
        studentId: UniqueEntityID;
        problemId: UniqueEntityID;
        feedback: ReviewFeedback;
        isCorrect: boolean;
        responseTime?: number;
        answerContent?: any;
    }, id?: UniqueEntityID): Result<StudyRecord>;
    /**
     * 재구성 팩토리 메서드 (DB에서 복원할 때 사용)
     */
    static reconstitute(props: StudyRecordProps, id: UniqueEntityID): StudyRecord;
    /**
     * 응답 시간이 정상 범위인지 확인 (통계적 이상치 탐지용)
     */
    hasNormalResponseTime(): boolean;
    /**
     * 즉답 여부 확인 (3초 이내)
     */
    isInstantResponse(): boolean;
    /**
     * 어려워했는지 여부 (응답 시간 기준)
     */
    appearsToStruggle(): boolean;
    /**
     * 성과 점수 계산 (0-100)
     * 정답 여부와 응답 시간을 종합적으로 고려
     */
    calculatePerformanceScore(): number;
    /**
     * 학습 패턴 분석용 메타데이터
     */
    getStudyPattern(): {
        pattern: 'quick_correct' | 'slow_correct' | 'quick_incorrect' | 'slow_incorrect';
        confidence: number;
    };
}
export {};
//# sourceMappingURL=StudyRecord.d.ts.map