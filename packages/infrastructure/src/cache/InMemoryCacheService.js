export class InMemoryCacheService {
    store = new Map();
    tagMap = new Map();
    _stats;
    keyPrefix;
    cleanupInterval;
    constructor(keyPrefix = 'woodie:', cleanupIntervalMs = 60000) {
        this.keyPrefix = keyPrefix;
        this._stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            hitRate: 0
        };
        // 주기적으로 만료된 키 정리
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, cleanupIntervalMs);
    }
    async get(key) {
        try {
            const fullKey = this.buildKey(key);
            const entry = this.store.get(fullKey);
            if (!entry) {
                this._stats.misses++;
                this.updateHitRate();
                return null;
            }
            // TTL 확인
            if (entry.expiresAt && Date.now() > entry.expiresAt) {
                this.store.delete(fullKey);
                this.removeFromTagMap(fullKey);
                this._stats.misses++;
                this.updateHitRate();
                return null;
            }
            this._stats.hits++;
            this.updateHitRate();
            return entry.value;
        }
        catch (error) {
            this._stats.errors++;
            return null;
        }
    }
    async set(key, value, options) {
        try {
            const fullKey = this.buildKey(key);
            const expiresAt = options?.ttl ? Date.now() + (options.ttl * 1000) : undefined;
            const entry = {
                value,
                expiresAt,
                tags: options?.tags
            };
            this.store.set(fullKey, entry);
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
            throw error;
        }
    }
    async delete(key) {
        try {
            const fullKey = this.buildKey(key);
            const deleted = this.store.delete(fullKey);
            if (deleted) {
                this.removeFromTagMap(fullKey);
                this._stats.deletes++;
                return true;
            }
            return false;
        }
        catch (error) {
            this._stats.errors++;
            return false;
        }
    }
    async exists(key) {
        try {
            const fullKey = this.buildKey(key);
            const entry = this.store.get(fullKey);
            if (!entry)
                return false;
            // TTL 확인
            if (entry.expiresAt && Date.now() > entry.expiresAt) {
                this.store.delete(fullKey);
                this.removeFromTagMap(fullKey);
                return false;
            }
            return true;
        }
        catch (error) {
            this._stats.errors++;
            return false;
        }
    }
    async clear() {
        try {
            // 프리픽스로 시작하는 키만 삭제
            const keysToDelete = [];
            for (const key of this.store.keys()) {
                if (key.startsWith(this.keyPrefix)) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => {
                this.store.delete(key);
                this.removeFromTagMap(key);
            });
            this._stats.deletes += keysToDelete.length;
        }
        catch (error) {
            this._stats.errors++;
            throw error;
        }
    }
    async mget(keys) {
        const results = [];
        for (const key of keys) {
            results.push(await this.get(key));
        }
        return results;
    }
    async mset(entries) {
        for (const entry of entries) {
            await this.set(entry.key, entry.value, entry.options);
        }
    }
    async mdelete(keys) {
        let deleted = 0;
        for (const key of keys) {
            if (await this.delete(key)) {
                deleted++;
            }
        }
        return deleted;
    }
    async keys(pattern) {
        try {
            const fullPattern = this.buildKey(pattern);
            const regex = new RegExp(fullPattern.replace(/\*/g, '.*'));
            const matchingKeys = [];
            for (const key of this.store.keys()) {
                if (regex.test(key)) {
                    matchingKeys.push(key.replace(this.keyPrefix, ''));
                }
            }
            return matchingKeys;
        }
        catch (error) {
            this._stats.errors++;
            return [];
        }
    }
    async deleteByPattern(pattern) {
        try {
            const matchingKeys = await this.keys(pattern);
            return await this.mdelete(matchingKeys);
        }
        catch (error) {
            this._stats.errors++;
            return 0;
        }
    }
    async invalidateByTags(tags) {
        try {
            let totalDeleted = 0;
            for (const tag of tags) {
                const keys = this.tagMap.get(tag);
                if (keys && keys.size > 0) {
                    for (const key of keys) {
                        if (this.store.delete(key)) {
                            totalDeleted++;
                            this._stats.deletes++;
                        }
                    }
                    this.tagMap.delete(tag);
                }
            }
            return totalDeleted;
        }
        catch (error) {
            this._stats.errors++;
            return 0;
        }
    }
    async expire(key, ttl) {
        try {
            const fullKey = this.buildKey(key);
            const entry = this.store.get(fullKey);
            if (!entry)
                return false;
            entry.expiresAt = Date.now() + (ttl * 1000);
            this.store.set(fullKey, entry);
            return true;
        }
        catch (error) {
            this._stats.errors++;
            return false;
        }
    }
    async ttl(key) {
        try {
            const fullKey = this.buildKey(key);
            const entry = this.store.get(fullKey);
            if (!entry || !entry.expiresAt)
                return -1;
            const remaining = Math.max(0, entry.expiresAt - Date.now());
            return Math.floor(remaining / 1000);
        }
        catch (error) {
            this._stats.errors++;
            return -1;
        }
    }
    async stats() {
        return { ...this._stats };
    }
    async increment(key, delta = 1) {
        try {
            const current = await this.get(key) || 0;
            const newValue = current + delta;
            await this.set(key, newValue);
            return newValue;
        }
        catch (error) {
            this._stats.errors++;
            throw error;
        }
    }
    async decrement(key, delta = 1) {
        try {
            const current = await this.get(key) || 0;
            const newValue = current - delta;
            await this.set(key, newValue);
            return newValue;
        }
        catch (error) {
            this._stats.errors++;
            throw error;
        }
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
        this.store.clear();
        this.tagMap.clear();
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
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
        for (const [key, entry] of this.store) {
            if (entry.expiresAt && now > entry.expiresAt) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => {
            this.store.delete(key);
            this.removeFromTagMap(key);
        });
        if (keysToDelete.length > 0) {
            this._stats.deletes += keysToDelete.length;
        }
    }
}
//# sourceMappingURL=InMemoryCacheService.js.map