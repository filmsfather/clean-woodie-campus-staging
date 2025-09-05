import { ICacheService } from '@woodie/application/common/interfaces/ICacheService';
import { RedisCacheConfig } from './RedisCacheService';
export type CacheServiceType = 'redis' | 'memory';
export interface CacheServiceConfig {
    type: CacheServiceType;
    redis?: RedisCacheConfig;
    memory?: {
        keyPrefix?: string;
        cleanupIntervalMs?: number;
    };
    logger?: {
        info: (msg: string, meta?: any) => void;
        error: (msg: string, meta?: any) => void;
        warn: (msg: string, meta?: any) => void;
    };
}
export declare class CacheServiceFactory {
    static create(config: CacheServiceConfig): ICacheService;
    static createFromEnv(logger?: CacheServiceConfig['logger']): ICacheService;
}
//# sourceMappingURL=CacheServiceFactory.d.ts.map