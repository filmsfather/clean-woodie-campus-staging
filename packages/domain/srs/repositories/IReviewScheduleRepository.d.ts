import { UniqueEntityID } from '../../common/Identifier';
import { ReviewSchedule } from '../entities/ReviewSchedule';
export interface IReviewScheduleRepository {
    /**
     * ID로 복습 일정 조회
     */
    findById(id: UniqueEntityID): Promise<ReviewSchedule | null>;
    /**
     * 여러 ID로 복습 일정 조회
     */
    findByIds(ids: UniqueEntityID[]): Promise<ReviewSchedule[]>;
    /**
     * 특정 학생의 복습 일정 조회
     */
    findByStudentId(studentId: UniqueEntityID, limit?: number): Promise<ReviewSchedule[]>;
    /**
     * 특정 문제의 복습 일정 조회
     */
    findByProblemId(problemId: UniqueEntityID, limit?: number): Promise<ReviewSchedule[]>;
    /**
     * 학생과 문제로 복습 일정 조회
     */
    findByStudentAndProblem(studentId: UniqueEntityID, problemId: UniqueEntityID): Promise<ReviewSchedule | null>;
    /**
     * 특정 학생의 복습 예정 항목들 조회
     */
    findDueReviews(studentId: UniqueEntityID, dueDate: Date): Promise<ReviewSchedule[]>;
    /**
     * 특정 학생의 오늘 복습 항목들 조회 (우선순위별 정렬)
     */
    findTodayReviews(studentId: UniqueEntityID, currentDate: Date): Promise<ReviewSchedule[]>;
    /**
     * 특정 학생의 지연된 복습 항목들 조회
     */
    findOverdueReviews(studentId: UniqueEntityID, currentDate: Date): Promise<ReviewSchedule[]>;
    /**
     * 특정 학생의 지연된 복습 항목들 조회 (별칭)
     */
    findOverdueByStudentId(studentId: UniqueEntityID, currentDate?: Date): Promise<ReviewSchedule[]>;
    /**
     * 지연된 복습 일정 전체 조회
     */
    findOverdueSchedules(currentDate?: Date): Promise<ReviewSchedule[]>;
    /**
     * 특정 학생의 지연된 복습 항목 수 조회
     */
    countOverdueByStudentId(studentId: UniqueEntityID, currentDate?: Date): Promise<number>;
    /**
     * 복습 일정 저장/업데이트
     */
    save(reviewSchedule: ReviewSchedule): Promise<void>;
    /**
     * 복습 일정 삭제
     */
    delete(id: UniqueEntityID): Promise<void>;
    /**
     * 학생의 총 복습 항목 수 조회
     */
    countByStudent(studentId: UniqueEntityID): Promise<number>;
    /**
     * 학생의 상태별 복습 항목 수 조회
     */
    countByStudentAndStatus(studentId: UniqueEntityID, status: 'due' | 'overdue' | 'upcoming'): Promise<number>;
}
//# sourceMappingURL=IReviewScheduleRepository.d.ts.map