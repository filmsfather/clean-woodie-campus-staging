import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { Result } from '../../common/Result';
import { Guard } from '../../common/Guard';
import { BatchJobStartedEvent } from '../events/BatchJobStartedEvent';
import { BatchJobCompletedEvent } from '../events/BatchJobCompletedEvent';
import { BatchJobFailedEvent } from '../events/BatchJobFailedEvent';
/**
 * 배치 작업 엔티티
 * 백그라운드에서 실행되는 데이터 처리 작업을 관리
 */
export class BatchJob extends AggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    get name() {
        return this.props.name;
    }
    get type() {
        return this.props.type;
    }
    get status() {
        return this.props.status;
    }
    get config() {
        return this.props.config;
    }
    get scheduledAt() {
        return this.props.scheduledAt;
    }
    get startedAt() {
        return this.props.startedAt;
    }
    get completedAt() {
        return this.props.completedAt;
    }
    get result() {
        return this.props.result;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    /**
     * 작업이 실행 가능한 상태인지 확인
     */
    canStart() {
        return this.props.status === 'pending' && this.props.scheduledAt <= new Date();
    }
    /**
     * 작업이 완료된 상태인지 확인
     */
    isCompleted() {
        return ['completed', 'failed', 'cancelled'].includes(this.props.status);
    }
    /**
     * 작업이 실행 중인지 확인
     */
    isRunning() {
        return this.props.status === 'running';
    }
    /**
     * 작업 실행 시작
     */
    start() {
        if (!this.canStart()) {
            return Result.fail('배치 작업을 시작할 수 없는 상태입니다');
        }
        const now = new Date();
        this.props.status = 'running';
        this.props.startedAt = now;
        this.props.updatedAt = now;
        // 작업 시작 이벤트 발행
        this.addDomainEvent(new BatchJobStartedEvent(this.id, this.props.name, this.props.type, now));
        return Result.ok();
    }
    /**
     * 작업 성공적 완료
     */
    complete(result) {
        if (!this.isRunning()) {
            return Result.fail('실행 중이지 않은 작업을 완료할 수 없습니다');
        }
        const now = new Date();
        this.props.status = 'completed';
        this.props.completedAt = now;
        this.props.result = result;
        this.props.updatedAt = now;
        // 작업 완료 이벤트 발행
        this.addDomainEvent(new BatchJobCompletedEvent(this.id, this.props.name, this.props.type, this.calculateDuration(), result));
        return Result.ok();
    }
    /**
     * 작업 실패 처리
     */
    fail(errorMessage, partialResult) {
        if (!this.isRunning()) {
            return Result.fail('실행 중이지 않은 작업을 실패 처리할 수 없습니다');
        }
        const now = new Date();
        this.props.status = 'failed';
        this.props.completedAt = now;
        this.props.result = {
            recordsProcessed: partialResult?.recordsProcessed || 0,
            recordsSucceeded: partialResult?.recordsSucceeded || 0,
            recordsFailed: partialResult?.recordsFailed || 0,
            executionTimeMs: this.calculateDuration(),
            errorMessage,
            additionalInfo: partialResult?.additionalInfo
        };
        this.props.updatedAt = now;
        // 작업 실패 이벤트 발행
        this.addDomainEvent(new BatchJobFailedEvent(this.id, this.props.name, this.props.type, errorMessage, this.props.result));
        return Result.ok();
    }
    /**
     * 작업 취소
     */
    cancel() {
        if (this.isCompleted()) {
            return Result.fail('이미 완료된 작업은 취소할 수 없습니다');
        }
        const now = new Date();
        this.props.status = 'cancelled';
        this.props.completedAt = now;
        this.props.updatedAt = now;
        return Result.ok();
    }
    /**
     * 작업 재시도를 위한 초기화
     */
    resetForRetry() {
        if (!['failed', 'cancelled'].includes(this.props.status)) {
            return Result.fail('재시도할 수 없는 작업 상태입니다');
        }
        const now = new Date();
        this.props.status = 'pending';
        this.props.startedAt = undefined;
        this.props.completedAt = undefined;
        this.props.result = undefined;
        this.props.updatedAt = now;
        return Result.ok();
    }
    /**
     * 실행 시간 계산 (밀리초)
     */
    calculateDuration() {
        if (!this.props.startedAt)
            return 0;
        const endTime = this.props.completedAt || new Date();
        return endTime.getTime() - this.props.startedAt.getTime();
    }
    /**
     * 작업 성공률 계산
     */
    getSuccessRate() {
        if (!this.props.result || this.props.result.recordsProcessed === 0) {
            return 0;
        }
        return (this.props.result.recordsSucceeded / this.props.result.recordsProcessed) * 100;
    }
    /**
     * 타임아웃 확인
     */
    isTimedOut() {
        if (!this.isRunning() || !this.props.startedAt) {
            return false;
        }
        const elapsed = new Date().getTime() - this.props.startedAt.getTime();
        return elapsed > this.props.config.timeoutMs;
    }
    /**
     * BatchJob 생성
     */
    static create(props, id) {
        const guardResult = Guard.againstNullOrUndefinedBulk([
            { argument: props.name, argumentName: 'name' },
            { argument: props.type, argumentName: 'type' },
            { argument: props.config, argumentName: 'config' },
            { argument: props.scheduledAt, argumentName: 'scheduledAt' }
        ]);
        if (guardResult.isFailure) {
            return Result.fail(guardResult.error);
        }
        // 이름 검증
        if (props.name.trim().length === 0) {
            return Result.fail('작업 이름은 비워둘 수 없습니다');
        }
        // 설정 검증
        if (props.config.retryAttempts < 0) {
            return Result.fail('재시도 횟수는 음수가 될 수 없습니다');
        }
        if (props.config.timeoutMs <= 0) {
            return Result.fail('타임아웃은 0보다 커야 합니다');
        }
        const now = new Date();
        const batchJob = new BatchJob({
            name: props.name.trim(),
            type: props.type,
            status: 'pending',
            config: props.config,
            scheduledAt: props.scheduledAt,
            createdAt: now,
            updatedAt: now
        }, id);
        return Result.ok(batchJob);
    }
    /**
     * 재구성 팩토리 메서드 (DB에서 복원할 때 사용)
     */
    static reconstitute(props, id) {
        return new BatchJob(props, id);
    }
}
//# sourceMappingURL=BatchJob.js.map