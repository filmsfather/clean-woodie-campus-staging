/**
 * 고정 크기 순환 버퍼
 * 메모리 효율적인 데이터 저장을 위한 자료구조
 */
export declare class CircularBuffer<T> {
    private buffer;
    private head;
    private tail;
    private count;
    private readonly capacity;
    constructor(capacity: number);
    /**
     * 요소 추가 (버퍼가 가득 차면 가장 오래된 요소 덮어쓰기)
     */
    push(item: T): void;
    /**
     * 가장 오래된 요소 제거 및 반환
     */
    shift(): T | undefined;
    /**
     * 모든 요소를 배열로 반환 (가장 오래된 것부터)
     */
    toArray(): T[];
    /**
     * 조건에 맞는 요소들만 필터링하여 반환
     */
    filter(predicate: (item: T) => boolean): T[];
    /**
     * 버퍼 내용 초기화
     */
    clear(): void;
    /**
     * 현재 저장된 요소 개수
     */
    size(): number;
    /**
     * 버퍼 용량
     */
    getCapacity(): number;
    /**
     * 버퍼가 비어있는지 확인
     */
    isEmpty(): boolean;
    /**
     * 버퍼가 가득 찼는지 확인
     */
    isFull(): boolean;
    /**
     * 최신 요소 반환 (제거하지 않음)
     */
    peek(): T | undefined;
    /**
     * 가장 오래된 요소 반환 (제거하지 않음)
     */
    peekOldest(): T | undefined;
}
//# sourceMappingURL=CircularBuffer.d.ts.map