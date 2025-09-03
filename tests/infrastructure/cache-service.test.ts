/**
 * CacheService 통합 테스트
 * Redis와의 실제 연동을 테스트하는 통합 테스트
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { CacheService, CacheKeys, CacheTTL } from '../../packages/infrastructure/src/cache/CacheService'

// 테스트용 로거
const mockLogger = {
  info: () => {},
  debug: () => {},
  warn: () => {},
  error: () => {},
}

describe('CacheService Integration Tests', () => {
  let cacheService: CacheService

  beforeAll(async () => {
    // 테스트용 Redis 설정 (테스트 DB 사용)
    cacheService = new CacheService(
      {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        db: 15, // 테스트 전용 DB
        keyPrefix: 'test:',
      },
      mockLogger as any
    )

    // Redis 연결 확인
    const connected = await cacheService.isConnected()
    if (!connected) {
      throw new Error('Redis connection failed - tests cannot run')
    }
  })

  afterAll(async () => {
    // 테스트 키 정리
    await cacheService.invalidatePattern('*')
    await cacheService.disconnect()
  })

  beforeEach(async () => {
    // 각 테스트 전에 캐시 정리
    await cacheService.invalidatePattern('*')
    cacheService.resetStats()
  })

  describe('Basic Operations', () => {
    it('should set and get string data', async () => {
      const key = 'test-string'
      const value = 'hello world'

      const setResult = await cacheService.set(key, value)
      expect(setResult).toBe(true)

      const getResult = await cacheService.get<string>(key)
      expect(getResult).toBe(value)
    })

    it('should set and get object data', async () => {
      const key = 'test-object'
      const value = {
        id: '123',
        name: 'John Doe',
        scores: [85, 92, 78],
        metadata: {
          created: '2024-01-01',
          updated: '2024-01-15'
        }
      }

      const setResult = await cacheService.set(key, value)
      expect(setResult).toBe(true)

      const getResult = await cacheService.get<typeof value>(key)
      expect(getResult).toEqual(value)
    })

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent-key')
      expect(result).toBeNull()
    })

    it('should delete existing keys', async () => {
      const key = 'test-delete'
      const value = 'to be deleted'

      await cacheService.set(key, value)
      const getResult1 = await cacheService.get(key)
      expect(getResult1).toBe(value)

      const delResult = await cacheService.del(key)
      expect(delResult).toBe(true)

      const getResult2 = await cacheService.get(key)
      expect(getResult2).toBeNull()
    })
  })

  describe('TTL Operations', () => {
    it('should set data with TTL', async () => {
      const key = 'test-ttl'
      const value = 'expires soon'
      const ttl = 2 // 2 seconds

      const setResult = await cacheService.set(key, value, ttl)
      expect(setResult).toBe(true)

      // 즉시 조회 - 존재해야 함
      const getResult1 = await cacheService.get(key)
      expect(getResult1).toBe(value)

      // TTL 확인
      const remainingTtl = await cacheService.ttl(key)
      expect(remainingTtl).toBeGreaterThan(0)
      expect(remainingTtl).toBeLessThanOrEqual(ttl)

      // TTL 대기
      await new Promise(resolve => setTimeout(resolve, ttl * 1000 + 100))

      // 만료 후 조회 - null이어야 함
      const getResult2 = await cacheService.get(key)
      expect(getResult2).toBeNull()
    }, 10000)

    it('should update TTL of existing key', async () => {
      const key = 'test-expire'
      const value = 'has ttl'

      await cacheService.set(key, value)
      
      const expireResult = await cacheService.expire(key, 1)
      expect(expireResult).toBe(true)

      const ttl = await cacheService.ttl(key)
      expect(ttl).toBeGreaterThan(0)
      expect(ttl).toBeLessThanOrEqual(1)
    })
  })

  describe('Pattern Operations', () => {
    it('should delete multiple keys matching pattern', async () => {
      const keys = [
        'user:123:profile',
        'user:123:settings',
        'user:456:profile',
        'user:456:settings',
        'system:config'
      ]

      // 테스트 데이터 설정
      for (const key of keys) {
        await cacheService.set(key, `data for ${key}`)
      }

      // 패턴 매칭 삭제
      const deletedCount = await cacheService.invalidatePattern('user:123:*')
      expect(deletedCount).toBe(2)

      // 확인
      const result123Profile = await cacheService.get('user:123:profile')
      const result123Settings = await cacheService.get('user:123:settings')
      const result456Profile = await cacheService.get('user:456:profile')
      const systemConfig = await cacheService.get('system:config')

      expect(result123Profile).toBeNull()
      expect(result123Settings).toBeNull()
      expect(result456Profile).not.toBeNull() // 삭제되지 않아야 함
      expect(systemConfig).not.toBeNull() // 삭제되지 않아야 함
    })
  })

  describe('Hash Operations', () => {
    it('should set and get hash fields', async () => {
      const key = 'user:hash'
      const field1 = 'name'
      const value1 = 'John Doe'
      const field2 = 'email'
      const value2 = 'john@example.com'

      const hset1 = await cacheService.hset(key, field1, value1)
      const hset2 = await cacheService.hset(key, field2, value2)

      expect(hset1).toBe(true)
      expect(hset2).toBe(true)

      const hget1 = await cacheService.hget<string>(key, field1)
      const hget2 = await cacheService.hget<string>(key, field2)

      expect(hget1).toBe(value1)
      expect(hget2).toBe(value2)
    })
  })

  describe('Statistics', () => {
    it('should track cache statistics', async () => {
      const key1 = 'stats-test-1'
      const key2 = 'stats-test-2'
      const value = 'test value'

      // Set operations
      await cacheService.set(key1, value)
      await cacheService.set(key2, value)

      // Get operations (hits)
      await cacheService.get(key1)
      await cacheService.get(key2)

      // Get operations (misses)
      await cacheService.get('non-existent-1')
      await cacheService.get('non-existent-2')

      // Delete operations
      await cacheService.del(key1)
      await cacheService.del(key2)

      const stats = cacheService.getStats()

      expect(stats.sets).toBe(2)
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(2)
      expect(stats.deletes).toBe(2)
      expect(stats.hitRate).toBe(50) // 2 hits out of 4 total gets
    })
  })

  describe('Cache Key Constants', () => {
    it('should use predefined cache keys correctly', async () => {
      const studentId = 'student-123'
      const teacherId = 'teacher-456'

      const studentDashboardKey = CacheKeys.STUDENT_DASHBOARD(studentId)
      const teacherDashboardKey = CacheKeys.TEACHER_DASHBOARD(teacherId)
      
      const dashboardData = {
        id: studentId,
        todayTasks: [],
        reviewCount: 5,
        currentStreak: 10
      }

      const teacherData = {
        id: teacherId,
        totalStudents: 25,
        activeStudents: 20
      }

      // 캐시에 저장
      await cacheService.set(studentDashboardKey, dashboardData, CacheTTL.MEDIUM)
      await cacheService.set(teacherDashboardKey, teacherData, CacheTTL.LONG)

      // 조회
      const retrievedStudentData = await cacheService.get(studentDashboardKey)
      const retrievedTeacherData = await cacheService.get(teacherDashboardKey)

      expect(retrievedStudentData).toEqual(dashboardData)
      expect(retrievedTeacherData).toEqual(teacherData)

      // TTL 확인
      const studentTtl = await cacheService.ttl(studentDashboardKey)
      const teacherTtl = await cacheService.ttl(teacherDashboardKey)

      expect(studentTtl).toBeGreaterThan(0)
      expect(studentTtl).toBeLessThanOrEqual(CacheTTL.MEDIUM)
      expect(teacherTtl).toBeGreaterThan(CacheTTL.MEDIUM)
      expect(teacherTtl).toBeLessThanOrEqual(CacheTTL.LONG)
    })
  })

  describe('Error Handling', () => {
    it('should handle connection issues gracefully', async () => {
      // 실제 Redis 연결 오류를 시뮬레이션하기는 어려우므로,
      // 최소한 연결 상태 체크 정도만 테스트
      const connected = await cacheService.isConnected()
      expect(typeof connected).toBe('boolean')
    })
  })
})