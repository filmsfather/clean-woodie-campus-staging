import Redis from 'ioredis';
export class RedisCacheService {
    logger;
    redis;
    _stats;
    keyPrefix;
    tagMap = new Map();
    constructor(config = {}, logger) {
        this.logger = logger;
        this.keyPrefix = config.keyPrefix || 'woodie:';
        this._stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            hitRate: 0
        };
        this.redis = new Redis({
            host: config.host || process.env.REDIS_HOST || 'localhost',
            port: config.port || parseInt(process.env.REDIS_PORT || '6379'),
            password: config.password || process.env.REDIS_PASSWORD,
            db: config.db || parseInt(process.env.REDIS_DB || '0'),
            maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
            commandTimeout: config.commandTimeout || 5000,
            lazyConnect: true
        });
        this.setupEventListeners();
    }
    async get(key) {
        try {
            const fullKey = this.buildKey(key);
            const data = await this.redis.get(fullKey);
            if (data === null) {
                this._stats.misses++;
                this.updateHitRate();
                return null;
            }
            this._stats.hits++;
            this.updateHitRate();
            return JSON.parse(data);
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache get error', { key, error });
            return null;
        }
    }
    async set(key, value, options) {
        try {
            const fullKey = this.buildKey(key);
            const serializedValue = options?.serialize !== false ? JSON.stringify(value) : String(value);
            if (options?.ttl) {
                await this.redis.setex(fullKey, options.ttl, serializedValue);
            }
            else {
                await this.redis.set(fullKey, serializedValue);
            }
            // 태그 매핑 저장
            if (options?.tags) {
                for (const tag of options.tags) {
                    if (!this.tagMap.has(tag)) {
                        this.tagMap.set(tag, new Set());
                    }
                    this.tagMap.get(tag).add(fullKey);
                }
            }
            this._stats.sets++;
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache set error', { key, error });
            throw error;
        }
    }
    async delete(key) {
        try {
            const fullKey = this.buildKey(key);
            const result = await this.redis.del(fullKey);
            if (result > 0) {
                this._stats.deletes++;
                this.removeFromTagMap(fullKey);
                return true;
            }
            return false;
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache delete error', { key, error });
            return false;
        }
    }
    async exists(key) {
        try {
            const fullKey = this.buildKey(key);
            const result = await this.redis.exists(fullKey);
            return result === 1;
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache exists error', { key, error });
            return false;
        }
    }
    async clear() {
        try {
            const pattern = `${this.keyPrefix}*`;
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                this._stats.deletes += keys.length;
            }
            this.tagMap.clear();
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache clear error', { error });
            throw error;
        }
    }
    async mget(keys) {
        try {
            const fullKeys = keys.map(key => this.buildKey(key));
            const results = await this.redis.mget(...fullKeys);
            return results.map(result => {
                if (result === null) {
                    this._stats.misses++;
                    return null;
                }
                this._stats.hits++;
                try {
                    return JSON.parse(result);
                }
                catch {
                    return result;
                }
            });
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache mget error', { keys, error });
            return keys.map(() => null);
        }
        finally {
            this.updateHitRate();
        }
    }
    async mset(entries) {
        try {
            const pipeline = this.redis.pipeline();
            for (const entry of entries) {
                const fullKey = this.buildKey(entry.key);
                const serializedValue = entry.options?.serialize !== false ? JSON.stringify(entry.value) : String(entry.value);
                if (entry.options?.ttl) {
                    pipeline.setex(fullKey, entry.options.ttl, serializedValue);
                }
                else {
                    pipeline.set(fullKey, serializedValue);
                }
                // 태그 매핑
                if (entry.options?.tags) {
                    for (const tag of entry.options.tags) {
                        if (!this.tagMap.has(tag)) {
                            this.tagMap.set(tag, new Set());
                        }
                        this.tagMap.get(tag).add(fullKey);
                    }
                }
            }
            await pipeline.exec();
            this._stats.sets += entries.length;
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache mset error', { entries: entries.length, error });
            throw error;
        }
    }
    async mdelete(keys) {
        try {
            if (keys.length === 0)
                return 0;
            const fullKeys = keys.map(key => this.buildKey(key));
            const result = await this.redis.del(...fullKeys);
            fullKeys.forEach(fullKey => this.removeFromTagMap(fullKey));
            this._stats.deletes += result;
            return result;
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache mdelete error', { keys, error });
            return 0;
        }
    }
    async keys(pattern) {
        try {
            const fullPattern = this.buildKey(pattern);
            const keys = await this.redis.keys(fullPattern);
            return keys.map(key => key.replace(this.keyPrefix, ''));
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache keys error', { pattern, error });
            return [];
        }
    }
    async deleteByPattern(pattern) {
        try {
            const fullPattern = this.buildKey(pattern);
            const keys = await this.redis.keys(fullPattern);
            if (keys.length === 0)
                return 0;
            const result = await this.redis.del(...keys);
            keys.forEach(key => this.removeFromTagMap(key));
            this._stats.deletes += result;
            return result;
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache deleteByPattern error', { pattern, error });
            return 0;
        }
    }
    async invalidateByTags(tags) {
        try {
            let totalDeleted = 0;
            for (const tag of tags) {
                const keys = this.tagMap.get(tag);
                if (keys && keys.size > 0) {
                    const keysArray = Array.from(keys);
                    const result = await this.redis.del(...keysArray);
                    totalDeleted += result;
                    this._stats.deletes += result;
                    // 태그 매핑에서 제거
                    this.tagMap.delete(tag);
                }
            }
            return totalDeleted;
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache invalidateByTags error', { tags, error });
            return 0;
        }
    }
    async expire(key, ttl) {
        try {
            const fullKey = this.buildKey(key);
            const result = await this.redis.expire(fullKey, ttl);
            return result === 1;
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache expire error', { key, ttl, error });
            return false;
        }
    }
    async ttl(key) {
        try {
            const fullKey = this.buildKey(key);
            return await this.redis.ttl(fullKey);
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache ttl error', { key, error });
            return -1;
        }
    }
    async stats() {
        return { ...this._stats };
    }
    async increment(key, delta = 1) {
        try {
            const fullKey = this.buildKey(key);
            return await this.redis.incrby(fullKey, delta);
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache increment error', { key, delta, error });
            throw error;
        }
    }
    async decrement(key, delta = 1) {
        try {
            const fullKey = this.buildKey(key);
            return await this.redis.decrby(fullKey, delta);
        }
        catch (error) {
            this._stats.errors++;
            this.logger?.error('Cache decrement error', { key, delta, error });
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.redis.quit();
            this.logger?.info('Redis connection closed');
        }
        catch (error) {
            this.logger?.error('Error closing Redis connection', { error });
        }
    }
    buildKey(key) {
        return `${this.keyPrefix}${key}`;
    }
    updateHitRate() {
        const total = this._stats.hits + this._stats.misses;
        this._stats.hitRate = total > 0 ? (this._stats.hits / total) * 100 : 0;
    }
    removeFromTagMap(fullKey) {
        for (const [tag, keys] of this.tagMap) {
            keys.delete(fullKey);
            if (keys.size === 0) {
                this.tagMap.delete(tag);
            }
        }
    }
    setupEventListeners() {
        this.redis.on('connect', () => {
            this.logger?.info('Redis connected');
        });
        this.redis.on('ready', () => {
            this.logger?.info('Redis ready');
        });
        this.redis.on('error', (error) => {
            this.logger?.error('Redis error', { error });
        });
        this.redis.on('close', () => {
            this.logger?.warn('Redis connection closed');
        });
    }
}
//# sourceMappingURL=RedisCacheService.js.map