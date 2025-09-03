/**
 * 캐시 서비스 인터페이스
 * 의존성 역전 원칙을 위한 추상화 레이어
 */
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    hitRate: number;
}
export interface CacheOptions {
    ttl?: number;
    tags?: string[];
}
export interface ICacheService {
    /**
     * 캐시에서 값 조회
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * 캐시에 값 저장 (overloaded for CacheOptions and TTL)
     */
    set<T>(key: string, value: T, optionsOrTtl?: CacheOptions | number): Promise<boolean>;
    /**
     * 캐시에서 키 삭제
     */
    del(key: string): Promise<boolean>;
    /**
     * 여러 키 동시 삭제
     */
    delMany(keys: string[]): Promise<number>;
    /**
     * 패턴에 매칭되는 모든 키 삭제
     */
    invalidatePattern(pattern: string): Promise<number>;
    /**
     * 키의 TTL 설정
     */
    expire(key: string, ttlSeconds: number): Promise<boolean>;
    /**
     * 키의 남은 TTL 조회
     */
    ttl(key: string): Promise<number>;
    /**
     * 키가 존재하는지 확인
     */
    exists(key: string): Promise<boolean>;
    /**
     * 캐시 통계 조회
     */
    getStats(): CacheStats;
    /**
     * 캐시 통계 초기화
     */
    resetStats(): void;
    /**
     * 연결 종료
     */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=ICacheService.d.ts.map