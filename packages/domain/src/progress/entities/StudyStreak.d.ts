import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
interface StudyStreakProps {
    studentId: UniqueEntityID;
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * 학습 스트릭 엔티티
 * 학생의 연속 학습일을 추적하고 관리하는 도메인 엔티티
 *
 * 비즈니스 규칙:
 * - 연속 학습일은 하루 건너뛰면 리셋됨
 * - 최장 스트릭은 현재 스트릭보다 작을 수 없음
 * - 같은 날에 여러 번 학습해도 스트릭은 1일로 계산
 */
export declare class StudyStreak extends AggregateRoot<StudyStreakProps> {
    private constructor();
    get studentId(): UniqueEntityID;
    get currentStreak(): number;
    get longestStreak(): number;
    get lastStudyDate(): Date;
    get createdAt(): Date;
    get updatedAt(): Date;
    /**
     * 스트릭 정보 업데이트
     * 내부적으로 사용되는 메서드로 외부에서 직접 호출하지 않음
     */
    private updateStreakInternal;
    /**
     * 학습 활동 기록
     * 새로운 학습 활동이 발생했을 때 스트릭을 업데이트함
     *
     * @param studyDate 학습한 날짜
     */
    recordStudy(studyDate: Date): void;
    /**
     * 스트릭 리셋
     * 관리자나 시스템에 의해 스트릭을 초기화할 때 사용
     */
    resetStreak(): void;
    /**
     * 스트릭이 활성 상태인지 확인
     * 마지막 학습일이 어제 또는 오늘인 경우 활성으로 간주
     */
    isActiveStreak(): boolean;
    /**
     * 스트릭이 위험 상태인지 확인 (끊어질 위험)
     * 마지막 학습일이 어제인 경우 위험으로 간주
     */
    isAtRisk(): boolean;
    /**
     * 개인 기록 달성 여부 확인
     * 현재 스트릭이 최장 스트릭과 같은지 확인
     */
    isPersonalRecord(): boolean;
    /**
     * 날짜에서 시간을 제거하여 날짜만 반환
     * 스트릭 계산 시 시간을 고려하지 않기 위함
     */
    private getDateOnly;
    /**
     * 스트릭 이정표 확인
     * 특별한 이정표 스트릭인 경우 해당 값을 반환
     */
    private getStreakMilestone;
    /**
     * StudyStreak 엔티티 생성
     *
     * @param props 스트릭 속성
     * @param id 엔티티 ID (선택적)
     * @returns Result<StudyStreak>
     */
    static create(props: {
        studentId: UniqueEntityID;
        currentStreak: number;
        longestStreak: number;
        lastStudyDate: Date;
    }, id?: UniqueEntityID): Result<StudyStreak>;
    /**
     * 재구성 팩토리 메서드 (DB에서 복원할 때 사용)
     *
     * @param props 전체 속성
     * @param id 엔티티 ID
     * @returns StudyStreak
     */
    static reconstitute(props: StudyStreakProps, id: UniqueEntityID): StudyStreak;
}
export {};
//# sourceMappingURL=StudyStreak.d.ts.map