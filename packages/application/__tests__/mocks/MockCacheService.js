import { vi } from 'vitest';
export class MockCacheService {
    cache = new Map();
    get = vi.fn((key) => {
        const value = this.cache.get(key);
        return value ? JSON.parse(value) : null;
    });
    set = vi.fn((key, value, ttl) => {
        this.cache.set(key, typeof value === 'string' ? value : JSON.stringify(value));
        return true;
    });
    delete = vi.fn((key) => {
        return this.cache.delete(key);
    });
    del = vi.fn((key) => {
        return this.cache.delete(key);
    });
    delMany = vi.fn();
    invalidatePattern = vi.fn();
    expire = vi.fn();
    ttl = vi.fn();
    exists = vi.fn();
    getStats = vi.fn(() => ({
        hits: 100,
        misses: 20,
        sets: 50,
        deletes: 10,
        hitRate: 0.83
    }));
    resetStats = vi.fn();
    disconnect = vi.fn();
}
export const createMockCacheService = () => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    delMany: vi.fn(),
    invalidatePattern: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    exists: vi.fn(),
    getStats: vi.fn(() => ({
        hits: 100,
        misses: 20,
        sets: 50,
        deletes: 10,
        hitRate: 0.83
    })),
    resetStats: vi.fn(),
    disconnect: vi.fn()
});
export const createMockCacheServiceWithData = (data) => {
    const mockCache = createMockCacheService();
    vi.mocked(mockCache.get).mockImplementation(async (key) => {
        return data[key] || null;
    });
    vi.mocked(mockCache.set).mockResolvedValue(true);
    vi.mocked(mockCache.del).mockResolvedValue(true);
    return mockCache;
};
//# sourceMappingURL=MockCacheService.js.map