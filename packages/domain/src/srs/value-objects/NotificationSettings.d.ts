import { Result } from '../../common/Result';
import { ValueObject } from '../../value-objects/ValueObject';
interface NotificationSettingsProps {
    enabled: boolean;
    reviewReminders: boolean;
    overdueReminders: boolean;
    dailySummary: boolean;
    milestoneAlerts: boolean;
    quietHours: {
        start: string;
        end: string;
    };
    timezone: string;
}
/**
 * 사용자 알림 설정 값 객체
 * 개별 사용자의 알림 선호도와 설정을 관리
 */
export declare class NotificationSettings extends ValueObject<NotificationSettingsProps> {
    private constructor();
    get enabled(): boolean;
    get reviewReminders(): boolean;
    get overdueReminders(): boolean;
    get dailySummary(): boolean;
    get milestoneAlerts(): boolean;
    get quietHours(): {
        start: string;
        end: string;
    };
    get timezone(): string;
    /**
     * 알림 설정 생성
     */
    static create(props: NotificationSettingsProps): Result<NotificationSettings>;
    /**
     * 기본 알림 설정 생성
     */
    static createDefault(timezone?: string): NotificationSettings;
    /**
     * 현재 시간이 조용한 시간(quiet hours) 범위에 있는지 확인
     */
    isQuietTime(currentTime: Date): boolean;
    /**
     * 특정 알림 타입이 활성화되었는지 확인
     */
    isNotificationTypeEnabled(type: 'review' | 'overdue' | 'summary' | 'milestone'): boolean;
    /**
     * 알림 설정 업데이트 (불변성 유지)
     */
    updateSettings(updates: Partial<NotificationSettingsProps>): Result<NotificationSettings>;
    /**
     * 알림 완전 비활성화
     */
    disable(): NotificationSettings;
    /**
     * 알림 완전 활성화
     */
    enable(): NotificationSettings;
}
export {};
//# sourceMappingURL=NotificationSettings.d.ts.map