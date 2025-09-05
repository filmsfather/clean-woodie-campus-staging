import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
import { ReviewSchedule } from '../entities/ReviewSchedule';
import { ISpacedRepetitionPolicy } from '../services/ISpacedRepetitionPolicy';
import { IClock } from '../services/IClock';
export declare class ReviewScheduleFactory {
    /**
     * 새로운 복습 일정 생성
     */
    static create(props: {
        studentId: UniqueEntityID;
        problemId: UniqueEntityID;
        policy: ISpacedRepetitionPolicy;
        clock: IClock;
        id?: UniqueEntityID;
    }): Result<ReviewSchedule>;
}
//# sourceMappingURL=ReviewScheduleFactory.d.ts.map