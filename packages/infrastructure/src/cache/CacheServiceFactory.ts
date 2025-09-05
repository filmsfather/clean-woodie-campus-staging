import { ICacheService } from '@woodie/application/common/interfaces/ICacheService';
import { RedisCacheService, RedisCacheConfig } from './RedisCacheService';
import { InMemoryCacheService } from './InMemoryCacheService';

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

export class CacheServiceFactory {
  static create(config: CacheServiceConfig): ICacheService {
    switch (config.type) {
      case 'redis':
        return new RedisCacheService(config.redis || {}, config.logger);
        
      case 'memory':
        return new InMemoryCacheService(
          config.memory?.keyPrefix,
          config.memory?.cleanupIntervalMs
        );
        
      default:
        throw new Error(`Unsupported cache service type: ${config.type}`);
    }
  }

  static createFromEnv(logger?: CacheServiceConfig['logger']): ICacheService {
    const cacheType = (process.env.CACHE_TYPE as CacheServiceType) || 'memory';
    
    const config: CacheServiceConfig = {
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
    } else {
      config.memory = {
        keyPrefix: process.env.CACHE_KEY_PREFIX,
        cleanupIntervalMs: process.env.CACHE_CLEANUP_INTERVAL_MS ? 
          parseInt(process.env.CACHE_CLEANUP_INTERVAL_MS) : undefined
      };
    }

    return this.create(config);
  }
}