/**
 * 고정 크기 순환 버퍼
 * 메모리 효율적인 데이터 저장을 위한 자료구조
 */

export class CircularBuffer<T> {
  private buffer: (T | undefined)[]
  private head = 0
  private tail = 0
  private count = 0
  private readonly capacity: number

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('Capacity must be positive')
    }
    this.capacity = capacity
    this.buffer = new Array(capacity)
  }

  /**
   * 요소 추가 (버퍼가 가득 차면 가장 오래된 요소 덮어쓰기)
   */
  push(item: T): void {
    this.buffer[this.tail] = item
    
    if (this.count < this.capacity) {
      this.count++
    } else {
      // 버퍼가 가득 참 - head 포인터 이동
      this.head = (this.head + 1) % this.capacity
    }
    
    this.tail = (this.tail + 1) % this.capacity
  }

  /**
   * 가장 오래된 요소 제거 및 반환
   */
  shift(): T | undefined {
    if (this.count === 0) {
      return undefined
    }

    const item = this.buffer[this.head]
    this.buffer[this.head] = undefined
    this.head = (this.head + 1) % this.capacity
    this.count--

    return item
  }

  /**
   * 모든 요소를 배열로 반환 (가장 오래된 것부터)
   */
  toArray(): T[] {
    const result: T[] = []
    
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.capacity
      const item = this.buffer[index]
      if (item !== undefined) {
        result.push(item)
      }
    }
    
    return result
  }

  /**
   * 조건에 맞는 요소들만 필터링하여 반환
   */
  filter(predicate: (item: T) => boolean): T[] {
    return this.toArray().filter(predicate)
  }

  /**
   * 버퍼 내용 초기화
   */
  clear(): void {
    this.buffer.fill(undefined)
    this.head = 0
    this.tail = 0
    this.count = 0
  }

  /**
   * 현재 저장된 요소 개수
   */
  size(): number {
    return this.count
  }

  /**
   * 버퍼 용량
   */
  getCapacity(): number {
    return this.capacity
  }

  /**
   * 버퍼가 비어있는지 확인
   */
  isEmpty(): boolean {
    return this.count === 0
  }

  /**
   * 버퍼가 가득 찼는지 확인
   */
  isFull(): boolean {
    return this.count === this.capacity
  }

  /**
   * 최신 요소 반환 (제거하지 않음)
   */
  peek(): T | undefined {
    if (this.count === 0) {
      return undefined
    }
    
    const lastIndex = this.tail === 0 ? this.capacity - 1 : this.tail - 1
    return this.buffer[lastIndex]
  }

  /**
   * 가장 오래된 요소 반환 (제거하지 않음)
   */
  peekOldest(): T | undefined {
    if (this.count === 0) {
      return undefined
    }
    
    return this.buffer[this.head]
  }
}