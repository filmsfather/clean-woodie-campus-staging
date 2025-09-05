/**
 * 시간 의존성을 추상화하는 인터페이스
 * 테스트 시 고정된 시간을 주입할 수 있게 함
 */
export interface IClock {
    /**
     * 현재 시간을 반환
     */
    now(): Date;
}
//# sourceMappingURL=IClock.d.ts.map