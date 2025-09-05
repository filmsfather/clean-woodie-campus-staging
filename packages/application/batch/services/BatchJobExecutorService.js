import { Result } from '@woodie/domain/common/Result';
/**
 * 배치 작업 실행 서비스
 * 다양한 타입의 배치 작업 실행기들을 관리하고 실행을 조율
 */
export class BatchJobExecutorService {
    batchJobRepository;
    eventDispatcher;
    executors = new Map();
    constructor(batchJobRepository, eventDispatcher) {
        this.batchJobRepository = batchJobRepository;
        this.eventDispatcher = eventDispatcher;
    }
    /**
     * 배치 작업 실행기 등록
     */
    registerExecutor(executor) {
        this.executors.set(executor.supportedType, executor);
    }
    /**
     * 등록된 실행기들 조회
     */
    getRegisteredExecutors() {
        return Array.from(this.executors.keys());
    }
    /**
     * 특정 타입의 실행기 존재 여부 확인
     */
    hasExecutorForType(type) {
        return this.executors.has(type);
    }
    /**
     * 실행 가능한 배치 작업들을 조회하고 실행
     */
    async processAvailableJobs(maxJobs = 5) {
        try {
            const pendingJobsResult = await this.batchJobRepository.findPendingJobs(maxJobs);
            if (pendingJobsResult.isFailure) {
                return Result.fail(`실행 가능한 작업 조회 실패: ${pendingJobsResult.error}`);
            }
            const pendingJobs = pendingJobsResult.value;
            const results = {
                processed: 0,
                succeeded: 0,
                failed: 0,
                details: []
            };
            // 각 작업을 순차적으로 실행 (병렬 실행도 가능하지만 안정성을 위해 순차)
            for (const job of pendingJobs) {
                const executionResult = await this.executeJob(job);
                results.processed++;
                if (executionResult.isSuccess) {
                    results.succeeded++;
                    results.details.push({
                        jobId: job.id.toString(),
                        type: job.type,
                        status: 'success'
                    });
                }
                else {
                    results.failed++;
                    results.details.push({
                        jobId: job.id.toString(),
                        type: job.type,
                        status: 'failure',
                        error: executionResult.error
                    });
                }
            }
            return Result.ok(results);
        }
        catch (error) {
            return Result.fail(`배치 작업 처리 중 오류: ${error}`);
        }
    }
    /**
     * 단일 배치 작업 실행
     */
    async executeJob(job) {
        try {
            // 실행기 확인
            const executor = this.executors.get(job.type);
            if (!executor) {
                const errorMsg = `${job.type} 타입의 실행기를 찾을 수 없습니다`;
                await this.handleJobFailure(job, errorMsg);
                return Result.fail(errorMsg);
            }
            // 유효성 검사
            const validationResult = executor.validate(job);
            if (validationResult.isFailure) {
                const errorMsg = `작업 유효성 검사 실패: ${validationResult.error}`;
                await this.handleJobFailure(job, errorMsg);
                return Result.fail(errorMsg);
            }
            // 작업 시작
            const startResult = job.start();
            if (startResult.isFailure) {
                return Result.fail(`작업 시작 실패: ${startResult.error}`);
            }
            // 시작 상태 저장 및 이벤트 발행
            await this.saveJobAndDispatchEvents(job);
            // 실행
            const executionResult = await executor.execute(job);
            if (executionResult.isSuccess) {
                // 성공 처리
                const completeResult = job.complete(executionResult.value);
                if (completeResult.isSuccess) {
                    await this.saveJobAndDispatchEvents(job);
                    return Result.ok(executionResult.value);
                }
                else {
                    return Result.fail(`작업 완료 처리 실패: ${completeResult.error}`);
                }
            }
            else {
                // 실패 처리
                await this.handleJobFailure(job, executionResult.error);
                return Result.fail(executionResult.error);
            }
        }
        catch (error) {
            await this.handleJobFailure(job, `실행 중 예외 발생: ${error}`);
            return Result.fail(`배치 작업 실행 실패: ${error}`);
        }
    }
    /**
     * 타임아웃된 작업들 정리
     */
    async handleTimedOutJobs() {
        try {
            const timedOutJobsResult = await this.batchJobRepository.findTimedOutJobs();
            if (timedOutJobsResult.isFailure) {
                return Result.fail(`타임아웃 작업 조회 실패: ${timedOutJobsResult.error}`);
            }
            const timedOutJobs = timedOutJobsResult.value;
            let handledCount = 0;
            for (const job of timedOutJobs) {
                await this.handleJobFailure(job, '실행 시간 초과');
                handledCount++;
            }
            return Result.ok(handledCount);
        }
        catch (error) {
            return Result.fail(`타임아웃 작업 처리 실패: ${error}`);
        }
    }
    /**
     * 특정 작업 취소
     */
    async cancelJob(jobId) {
        try {
            const jobResult = await this.batchJobRepository.findById(jobId);
            if (jobResult.isFailure) {
                return Result.fail(`작업 조회 실패: ${jobResult.error}`);
            }
            const job = jobResult.value;
            if (!job) {
                return Result.fail('존재하지 않는 작업입니다');
            }
            // 실행기에서 취소 지원하는지 확인
            const executor = this.executors.get(job.type);
            if (executor && executor.canBeCancelled && executor.cancel) {
                const cancelResult = await executor.cancel(job);
                if (cancelResult.isFailure) {
                    return Result.fail(`실행기에서 취소 실패: ${cancelResult.error}`);
                }
            }
            // 작업 상태 변경
            const cancelResult = job.cancel();
            if (cancelResult.isFailure) {
                return Result.fail(`작업 취소 실패: ${cancelResult.error}`);
            }
            // 상태 저장
            await this.saveJobAndDispatchEvents(job);
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`작업 취소 처리 실패: ${error}`);
        }
    }
    /**
     * 실패한 작업 재시도
     */
    async retryFailedJob(jobId) {
        try {
            const jobResult = await this.batchJobRepository.findById(jobId);
            if (jobResult.isFailure) {
                return Result.fail(`작업 조회 실패: ${jobResult.error}`);
            }
            const job = jobResult.value;
            if (!job) {
                return Result.fail('존재하지 않는 작업입니다');
            }
            if (job.status !== 'failed') {
                return Result.fail('실패한 작업만 재시도할 수 있습니다');
            }
            // 재시도를 위한 초기화
            const resetResult = job.resetForRetry();
            if (resetResult.isFailure) {
                return Result.fail(`재시도 초기화 실패: ${resetResult.error}`);
            }
            // 상태 저장
            const saveResult = await this.batchJobRepository.save(job);
            if (saveResult.isFailure) {
                return Result.fail(`재시도 작업 저장 실패: ${saveResult.error}`);
            }
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`작업 재시도 처리 실패: ${error}`);
        }
    }
    /**
     * 작업 실패 처리 헬퍼 메서드
     */
    async handleJobFailure(job, errorMessage) {
        const failResult = job.fail(errorMessage);
        if (failResult.isSuccess) {
            await this.saveJobAndDispatchEvents(job);
        }
    }
    /**
     * 작업 저장 및 이벤트 발행 헬퍼 메서드
     */
    async saveJobAndDispatchEvents(job) {
        // 상태 저장
        await this.batchJobRepository.save(job);
        // 도메인 이벤트 발행
        const events = job.getUncommittedEvents();
        for (const event of events) {
            await this.eventDispatcher.dispatch(event);
        }
        job.markEventsAsCommitted();
    }
}
//# sourceMappingURL=BatchJobExecutorService.js.map