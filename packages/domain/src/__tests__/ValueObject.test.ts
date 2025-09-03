import { describe, it, expect } from 'vitest'
import { ValueObject } from '../value-objects/ValueObject'

interface TestProps {
  name: string
  age: number
}

class TestValueObject extends ValueObject<TestProps> {
  get name(): string {
    return this.props.name
  }

  get age(): number {
    return this.props.age
  }
}

describe('ValueObject', () => {
  it('should create value object with props', () => {
    const vo = new TestValueObject({ name: 'test', age: 25 })
    expect(vo.name).toBe('test')
    expect(vo.age).toBe(25)
  })

  it('should return true when comparing identical value objects', () => {
    const vo1 = new TestValueObject({ name: 'test', age: 25 })
    const vo2 = new TestValueObject({ name: 'test', age: 25 })
    
    expect(vo1.equals(vo2)).toBe(true)
  })

  it('should return false when comparing different value objects', () => {
    const vo1 = new TestValueObject({ name: 'test', age: 25 })
    const vo2 = new TestValueObject({ name: 'test', age: 26 })
    
    expect(vo1.equals(vo2)).toBe(false)
  })

  it('should be immutable', () => {
    const vo = new TestValueObject({ name: 'test', age: 25 })
    
    expect(() => {
      (vo as any).props.name = 'changed'
    }).toThrow()
  })

  it('should return string representation', () => {
    const vo = new TestValueObject({ name: 'test', age: 25 })
    const str = vo.toString()
    
    expect(str).toContain('test')
    expect(str).toContain('25')
  })
})