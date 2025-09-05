import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { BatchJob, BatchJobStatus, BatchJobType } from '../entities/BatchJob';
/**
 * 배치 작업 리포지토리 인터페이스
 * 배치 작업의 영속성을 관리하는 계약을 정의
 */
export interface IBatchJobRepository {
    /**
     * ID로 배치 작업 조회
     * @param id 배치 작업 ID
     * @returns 배치 작업 또는 null
     */
    findById(id: UniqueEntityID): Promise<Result<BatchJob | null>>;
    /**
     * 실행 가능한 배치 작업들 조회
     * 스케줄된 시간이 현재 시간 이전이고 상태가 pending인 작업들
     * @param limit 조회할 최대 개수 (기본: 10)
     * @returns 실행 가능한 배치 작업 목록
     */
    findPendingJobs(limit?: number): Promise<Result<BatchJob[]>>;
    /**
     * 실행 중인 배치 작업들 조회
     * @returns 실행 중인 배치 작업 목록
     */
    findRunningJobs(): Promise<Result<BatchJob[]>>;
    /**
     * 타입별 배치 작업 조회
     * @param type 배치 작업 타입
     * @param status 작업 상태 (선택적)
     * @param limit 조회할 최대 개수
     * @returns 조건에 맞는 배치 작업 목록
     */
    findByType(type: BatchJobType, status?: BatchJobStatus, limit?: number): Promise<Result<BatchJob[]>>;
    /**
     * 최근 완료된 배치 작업들 조회
     * @param type 배치 작업 타입 (선택적)
     * @param hours 최근 몇 시간 이내 (기본: 24시간)
     * @param limit 조회할 최대 개수
     * @returns 최근 완료된 배치 작업 목록
     */
    findRecentlyCompleted(type?: BatchJobType, hours?: number, limit?: number): Promise<Result<BatchJob[]>>;
    /**
     * 실패한 배치 작업들 조회 (재시도 대상)
     * @param retryable 재시도 가능한 작업만 조회할지 여부
     * @param limit 조회할 최대 개수
     * @returns 실패한 배치 작업 목록
     */
    findFailedJobs(retryable?: boolean, limit?: number): Promise<Result<BatchJob[]>>;
    /**
     * 타임아웃된 배치 작업들 조회
     * 실행 중이지만 설정된 타임아웃 시간을 초과한 작업들
     * @returns 타임아웃된 배치 작업 목록
     */
    findTimedOutJobs(): Promise<Result<BatchJob[]>>;
    /**
     * 배치 작업 저장 (생성 또는 업데이트)
     * @param batchJob 저장할 배치 작업
     * @returns 저장 결과
     */
    save(batchJob: BatchJob): Promise<Result<void>>;
    /**
     * 배치 작업 삭제
     * @param id 삭제할 배치 작업 ID
     * @returns 삭제 결과
     */
    delete(id: UniqueEntityID): Promise<Result<void>>;
    /**
     * 오래된 배치 작업 기록 정리
     * @param olderThanDays 며칠 이전 기록을 삭제할지 (기본: 30일)
     * @param keepStatuses 유지할 상태들 (기본: 실패한 작업은 유지)
     * @returns 삭제된 작업 수
     */
    cleanupOldJobs(olderThanDays?: number, keepStatuses?: BatchJobStatus[]): Promise<Result<number>>;
    /**
     * 배치 작업 통계 조회
     * @param fromDate 시작 날짜
     * @param toDate 종료 날짜
     * @returns 배치 작업 실행 통계
     */
    getJobStatistics(fromDate: Date, toDate: Date): Promise<Result<{
        totalJobs: number;
        completedJobs: number;
        failedJobs: number;
        averageExecutionTimeMs: number;
        jobsByType: Record<BatchJobType, number>;
        successRate: number;
    }>>;
}
//# sourceMappingURL=IBatchJobRepository.d.ts.map