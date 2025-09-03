import { describe, it, expect } from 'vitest'
import { Entity } from '../entities/Entity'

class TestEntity extends Entity<string> {
  constructor(id: string, private value: string) {
    super(id)
    this.value = value
  }

  getValue(): string {
    return this.value
  }
}

describe('Entity', () => {
  it('should create entity with id', () => {
    const entity = new TestEntity('1', 'test')
    expect(entity.id).toBe('1')
    expect(entity.value).toBe('test')
  })

  it('should return true when comparing same entities', () => {
    const entity1 = new TestEntity('1', 'test')
    const entity2 = new TestEntity('1', 'different')
    
    expect(entity1.equals(entity2)).toBe(true)
  })

  it('should return false when comparing different entities', () => {
    const entity1 = new TestEntity('1', 'test')
    const entity2 = new TestEntity('2', 'test')
    
    expect(entity1.equals(entity2)).toBe(false)
  })

  it('should return false when comparing with null or undefined', () => {
    const entity = new TestEntity('1', 'test')
    
    expect(entity.equals(null as any)).toBe(false)
    expect(entity.equals(undefined as any)).toBe(false)
  })
})