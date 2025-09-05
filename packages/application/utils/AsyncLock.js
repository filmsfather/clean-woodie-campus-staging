/**
 * 비동기 뮤텍스 락
 * 동시성 제어를 위한 락 메커니즘
 */
export class AsyncLock {
    locks = new Map();
    /**
     * 키에 대한 락을 획득하고 작업 실행
     */
    async acquire(key, fn) {
        // 기존 락이 있으면 대기
        while (this.locks.has(key)) {
            await this.locks.get(key);
        }
        // 새로운 락 생성
        let releaseLock;
        const lockPromise = new Promise((resolve) => {
            releaseLock = resolve;
        });
        this.locks.set(key, lockPromise);
        try {
            // 작업 실행
            const result = await fn();
            return result;
        }
        finally {
            // 락 해제
            this.locks.delete(key);
            releaseLock();
        }
    }
    /**
     * 현재 락 상태 확인
     */
    isLocked(key) {
        return this.locks.has(key);
    }
    /**
     * 모든 락 정리
     */
    clear() {
        this.locks.clear();
    }
    /**
     * 활성 락 개수 조회
     */
    size() {
        return this.locks.size;
    }
}
//# sourceMappingURL=AsyncLock.js.map