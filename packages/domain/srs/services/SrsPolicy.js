/**
 * SRS(Spaced Repetition System) 전역 정책 설정
 * 모든 SRS 관련 상수와 정책을 중앙에서 관리
 */
export class SrsPolicy {
    // === 간격 정책 ===
    /** 최소 복습 간격 (일) */
    static MIN_INTERVAL_DAYS = 1;
    /** 초기 복습 간격 (일) */
    static INITIAL_INTERVAL_DAYS = 1;
    /** 최대 복습 간격 (일) - 실용적인 30일 제한 */
    static MAX_INTERVAL_DAYS = 30;
    // === 난이도 계수 정책 ===
    /** 최소 난이도 계수 */
    static MIN_EASE_FACTOR = 1.3;
    /** 기본 난이도 계수 */
    static DEFAULT_EASE_FACTOR = 2.5;
    /** 최대 난이도 계수 */
    static MAX_EASE_FACTOR = 4.0;
    // === 피드백별 배수 정책 ===
    /** HARD 피드백 시 간격 배수 (감소) */
    static HARD_INTERVAL_MULTIPLIER = 0.8;
    /** EASY 피드백 시 간격 추가 배수 */
    static EASY_INTERVAL_BONUS_MULTIPLIER = 1.3;
    /** AGAIN 피드백 시 난이도 계수 감소량 */
    static AGAIN_EASE_PENALTY = 0.8;
    /** HARD 피드백 시 난이도 계수 감소량 */
    static HARD_EASE_PENALTY = 0.15;
    /** EASY 피드백 시 난이도 계수 증가량 */
    static EASY_EASE_BONUS = 0.15;
    // === 연속 실패 정책 ===
    /** 간격 리셋이 필요한 연속 실패 횟수 */
    static RESET_THRESHOLD_FAILURES = 3;
    // === 알림 정책 ===
    /** 기본 복습 알림 (복습 시간 전 분) */
    static DEFAULT_REMINDER_MINUTES = 30;
    /** 어려운 문제 조기 알림 (복습 시간 전 분) */
    static EARLY_REMINDER_MINUTES = 120;
    // === 난이도 수준 판단 기준 ===
    /** Beginner 수준 최소 ease factor */
    static BEGINNER_EASE_THRESHOLD = 2.8;
    /** Intermediate 수준 최소 ease factor */
    static INTERMEDIATE_EASE_THRESHOLD = 2.0;
    // === 추가 알림 조건 ===
    /** 추가 알림이 필요한 최소 연속 실패 횟수 */
    static EXTRA_REMINDER_FAILURE_THRESHOLD = 2;
    /** 추가 알림이 필요한 최대 ease factor */
    static EXTRA_REMINDER_EASE_THRESHOLD = 1.8;
}
//# sourceMappingURL=SrsPolicy.js.map