import { describe, it, expect } from 'vitest'
import { Result } from '../common/Result'

describe('Result', () => {
  it('should create successful result', () => {
    const result = Result.ok('test value')
    
    expect(result.isSuccess).toBe(true)
    expect(result.isFailure).toBe(false)
    expect(result.value).toBe('test value')
  })

  it('should create failed result', () => {
    const result = Result.fail('error message')
    
    expect(result.isSuccess).toBe(false)
    expect(result.isFailure).toBe(true)
    expect(result.error).toBe('error message')
  })

  it('should throw when accessing value on failed result', () => {
    const result = Result.fail('error message')
    
    expect(() => result.value).toThrow()
  })

  it('should combine successful results', () => {
    const result1 = Result.ok('value1')
    const result2 = Result.ok('value2')
    
    const combined = Result.combine([result1, result2])
    
    expect(combined.isSuccess).toBe(true)
  })

  it('should fail when combining with failed result', () => {
    const result1 = Result.ok('value1')
    const result2 = Result.fail('error')
    
    const combined = Result.combine([result1, result2])
    
    expect(combined.isFailure).toBe(true)
  })
})