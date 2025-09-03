/**
 * SRS(Spaced Repetition System) 전역 정책 설정
 * 모든 SRS 관련 상수와 정책을 중앙에서 관리
 */
export declare class SrsPolicy {
    /** 최소 복습 간격 (일) */
    static readonly MIN_INTERVAL_DAYS = 1;
    /** 초기 복습 간격 (일) */
    static readonly INITIAL_INTERVAL_DAYS = 1;
    /** 최대 복습 간격 (일) - 실용적인 30일 제한 */
    static readonly MAX_INTERVAL_DAYS = 30;
    /** 최소 난이도 계수 */
    static readonly MIN_EASE_FACTOR = 1.3;
    /** 기본 난이도 계수 */
    static readonly DEFAULT_EASE_FACTOR = 2.5;
    /** 최대 난이도 계수 */
    static readonly MAX_EASE_FACTOR = 4;
    /** HARD 피드백 시 간격 배수 (감소) */
    static readonly HARD_INTERVAL_MULTIPLIER = 0.8;
    /** EASY 피드백 시 간격 추가 배수 */
    static readonly EASY_INTERVAL_BONUS_MULTIPLIER = 1.3;
    /** AGAIN 피드백 시 난이도 계수 감소량 */
    static readonly AGAIN_EASE_PENALTY = 0.8;
    /** HARD 피드백 시 난이도 계수 감소량 */
    static readonly HARD_EASE_PENALTY = 0.15;
    /** EASY 피드백 시 난이도 계수 증가량 */
    static readonly EASY_EASE_BONUS = 0.15;
    /** 간격 리셋이 필요한 연속 실패 횟수 */
    static readonly RESET_THRESHOLD_FAILURES = 3;
    /** 기본 복습 알림 (복습 시간 전 분) */
    static readonly DEFAULT_REMINDER_MINUTES = 30;
    /** 어려운 문제 조기 알림 (복습 시간 전 분) */
    static readonly EARLY_REMINDER_MINUTES = 120;
    /** Beginner 수준 최소 ease factor */
    static readonly BEGINNER_EASE_THRESHOLD = 2.8;
    /** Intermediate 수준 최소 ease factor */
    static readonly INTERMEDIATE_EASE_THRESHOLD = 2;
    /** 추가 알림이 필요한 최소 연속 실패 횟수 */
    static readonly EXTRA_REMINDER_FAILURE_THRESHOLD = 2;
    /** 추가 알림이 필요한 최대 ease factor */
    static readonly EXTRA_REMINDER_EASE_THRESHOLD = 1.8;
}
//# sourceMappingURL=SrsPolicy.d.ts.map