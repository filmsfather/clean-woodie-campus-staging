import { UniqueEntityID, Result, NotificationSettings } from '@woodie/domain';
export interface NotificationSettingsDTO {
    enableReviewReminders: boolean;
    enableOverdueAlerts: boolean;
    enableStreakNotifications: boolean;
    enableAchievementNotifications: boolean;
    reminderMinutesBefore: number;
    overdueThresholdHours: number;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    preferredDeliveryMethods: ('push' | 'email' | 'in_app')[];
}
export interface ManageNotificationSettingsRequest {
    studentId: string;
    settings: NotificationSettingsDTO;
}
export interface ManageNotificationSettingsResponse {
    studentId: string;
    updatedAt: Date;
    settings: NotificationSettingsDTO;
    validationWarnings?: string[];
    optimizationSuggestions?: string[];
}
/**
 * 알림 설정 관리 Use Case
 *
 * 비즈니스 규칙:
 * - 인증된 사용자만 자신의 알림 설정을 변경할 수 있음
 * - 알림 빈도와 시간대를 개인화하여 설정
 * - 학습 패턴에 맞는 최적화 제안 제공
 * - 과도한 알림 방지를 위한 유효성 검증
 */
export declare class ManageNotificationSettingsUseCase {
    private notificationSettingsRepository;
    constructor(notificationSettingsRepository: INotificationSettingsRepository);
    execute(request: ManageNotificationSettingsRequest): Promise<Result<ManageNotificationSettingsResponse>>;
    /**
     * 입력 요청 유효성 검증
     */
    private validateRequest;
    /**
     * 시간 형식 유효성 검증 (HH:MM)
     */
    private isValidTimeFormat;
    /**
     * 유효성 경고 생성
     */
    private generateValidationWarnings;
    /**
     * 최적화 제안 생성
     */
    private generateOptimizationSuggestions;
    /**
     * 학생 활동 패턴 분석 (간단한 버전)
     */
    private analyzeStudentActivityPattern;
    /**
     * 시간 문자열을 분 단위로 파싱
     */
    private parseTime;
}
interface INotificationSettingsRepository {
    findByStudentId(studentId: UniqueEntityID): Promise<Result<NotificationSettings | null>>;
    save(studentId: UniqueEntityID, settings: NotificationSettings): Promise<Result<void>>;
    delete(studentId: UniqueEntityID): Promise<Result<void>>;
}
export {};
//# sourceMappingURL=ManageNotificationSettingsUseCase.d.ts.map