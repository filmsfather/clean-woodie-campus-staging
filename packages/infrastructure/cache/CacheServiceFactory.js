import { RedisCacheService } from './RedisCacheService';
import { InMemoryCacheService } from './InMemoryCacheService';
export class CacheServiceFactory {
    static create(config) {
        switch (config.type) {
            case 'redis':
                return new RedisCacheService(config.redis || {}, config.logger);
            case 'memory':
                return new InMemoryCacheService(config.memory?.keyPrefix, config.memory?.cleanupIntervalMs);
            default:
                throw new Error(`Unsupported cache service type: ${config.type}`);
        }
    }
    static createFromEnv(logger) {
        const cacheType = process.env.CACHE_TYPE || 'memory';
        const config = {
            type: cacheType,
            logger
        };
        if (cacheType === 'redis') {
            config.redis = {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
                password: process.env.REDIS_PASSWORD,
                db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : undefined,
                keyPrefix: process.env.CACHE_KEY_PREFIX
            };
        }
        else {
            config.memory = {
                keyPrefix: process.env.CACHE_KEY_PREFIX,
                cleanupIntervalMs: process.env.CACHE_CLEANUP_INTERVAL_MS ?
                    parseInt(process.env.CACHE_CLEANUP_INTERVAL_MS) : undefined
            };
        }
        return this.create(config);
    }
}
//# sourceMappingURL=CacheServiceFactory.js.map