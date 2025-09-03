import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { INotificationSettingsRepository } from '@woodie/domain/srs/interfaces/INotificationService';
import { NotificationSettings } from '@woodie/domain/srs/value-objects/NotificationSettings';
/**
 * Supabase 기반 알림 설정 리포지토리 구현체
 * 사용자별 알림 선호도와 설정을 영구 저장
 */
export declare class SupabaseNotificationSettingsRepository implements INotificationSettingsRepository {
    protected client: any;
    private readonly tableName;
    private readonly schema;
    constructor(client: any);
    /**
     * 사용자 알림 설정 조회
     */
    findByUserId(userId: UniqueEntityID): Promise<NotificationSettings | null>;
    /**
     * INotificationSettingsRepository save 구현
     */
    save(userId: UniqueEntityID, settings: NotificationSettings): Promise<void>;
    /**
     * 알림 설정 저장 (생성 또는 업데이트)
     */
    saveUserSettings(userId: UniqueEntityID, settings: NotificationSettings): Promise<void>;
    /**
     * INotificationSettingsRepository delete 구현
     */
    delete(userId: UniqueEntityID): Promise<void>;
    /**
     * 알림 설정 삭제
     */
    deleteUserSettings(userId: UniqueEntityID): Promise<void>;
    /**
     * 특정 알림 타입이 활성화된 사용자 목록 조회
     * 배치 알림 전송 시 사용
     */
    findUsersWithEnabledNotification(type: 'review' | 'overdue' | 'summary' | 'milestone'): Promise<UniqueEntityID[]>;
    /**
     * 도메인 객체를 데이터베이스 행으로 변환
     */
    private toPersistence;
    /**
     * 데이터베이스 행을 도메인 객체로 변환
     */
    private toDomain;
}
//# sourceMappingURL=SupabaseNotificationSettingsRepository.d.ts.map