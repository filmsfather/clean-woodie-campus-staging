import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';
import { ReviewSchedule } from '../entities/ReviewSchedule';
export class ReviewScheduleFactory {
    /**
     * 새로운 복습 일정 생성
     */
    static create(props) {
        const { studentId, problemId, policy, clock, id } = props;
        const studentIdGuard = Guard.againstNullOrUndefined(studentId, 'studentId');
        if (studentIdGuard.isFailure) {
            return Result.fail(studentIdGuard.error);
        }
        const problemIdGuard = Guard.againstNullOrUndefined(problemId, 'problemId');
        if (problemIdGuard.isFailure) {
            return Result.fail(problemIdGuard.error);
        }
        const policyGuard = Guard.againstNullOrUndefined(policy, 'policy');
        if (policyGuard.isFailure) {
            return Result.fail(policyGuard.error);
        }
        const clockGuard = Guard.againstNullOrUndefined(clock, 'clock');
        if (clockGuard.isFailure) {
            return Result.fail(clockGuard.error);
        }
        try {
            const baseDate = clock.now();
            const initialState = policy.createInitialState(baseDate);
            const scheduleId = id || new UniqueEntityID();
            const reviewScheduleResult = ReviewSchedule.create({
                studentId,
                problemId,
                reviewState: initialState,
                consecutiveFailures: 0
            }, scheduleId);
            if (reviewScheduleResult.isFailure) {
                return Result.fail(reviewScheduleResult.error);
            }
            return Result.ok(reviewScheduleResult.value);
        }
        catch (error) {
            return Result.fail(`ReviewSchedule creation failed: ${error}`);
        }
    }
}
//# sourceMappingURL=ReviewScheduleFactory.js.map