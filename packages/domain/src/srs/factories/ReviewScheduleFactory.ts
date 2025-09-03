import { UniqueEntityID } from '../../common/Identifier'
import { Result } from '../../common/Result'
import { Guard } from '../../common/Guard'
import { ReviewSchedule } from '../entities/ReviewSchedule'
import { ISpacedRepetitionPolicy } from '../services/ISpacedRepetitionPolicy'
import { IClock } from '../services/IClock'
import { ReviewScheduledEvent } from '../events/ReviewScheduledEvent'

export class ReviewScheduleFactory {
  /**
   * 새로운 복습 일정 생성
   */
  public static create(props: {
    studentId: UniqueEntityID
    problemId: UniqueEntityID
    policy: ISpacedRepetitionPolicy
    clock: IClock
    id?: UniqueEntityID
  }): Result<ReviewSchedule> {
    const { studentId, problemId, policy, clock, id } = props

    const studentIdGuard = Guard.againstNullOrUndefined(studentId, 'studentId')
    if (studentIdGuard.isFailure) {
      return Result.fail<ReviewSchedule>(studentIdGuard.error)
    }

    const problemIdGuard = Guard.againstNullOrUndefined(problemId, 'problemId')
    if (problemIdGuard.isFailure) {
      return Result.fail<ReviewSchedule>(problemIdGuard.error)
    }

    const policyGuard = Guard.againstNullOrUndefined(policy, 'policy')
    if (policyGuard.isFailure) {
      return Result.fail<ReviewSchedule>(policyGuard.error)
    }

    const clockGuard = Guard.againstNullOrUndefined(clock, 'clock')
    if (clockGuard.isFailure) {
      return Result.fail<ReviewSchedule>(clockGuard.error)
    }

    try {
      const baseDate = clock.now()
      const initialState = policy.createInitialState(baseDate)
      const scheduleId = id || new UniqueEntityID()

      const reviewScheduleResult = ReviewSchedule.create({
        studentId,
        problemId,
        reviewState: initialState,
        consecutiveFailures: 0
      }, scheduleId)

      if (reviewScheduleResult.isFailure) {
        return Result.fail<ReviewSchedule>(reviewScheduleResult.error)
      }

      return Result.ok<ReviewSchedule>(reviewScheduleResult.value)

    } catch (error) {
      return Result.fail<ReviewSchedule>(`ReviewSchedule creation failed: ${error}`)
    }
  }
}