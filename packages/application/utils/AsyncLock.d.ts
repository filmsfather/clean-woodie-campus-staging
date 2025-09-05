/**
 * 비동기 뮤텍스 락
 * 동시성 제어를 위한 락 메커니즘
 */
export declare class AsyncLock {
    private locks;
    /**
     * 키에 대한 락을 획득하고 작업 실행
     */
    acquire<T>(key: string, fn: () => Promise<T>): Promise<T>;
    /**
     * 현재 락 상태 확인
     */
    isLocked(key: string): boolean;
    /**
     * 모든 락 정리
     */
    clear(): void;
    /**
     * 활성 락 개수 조회
     */
    size(): number;
}
//# sourceMappingURL=AsyncLock.d.ts.map