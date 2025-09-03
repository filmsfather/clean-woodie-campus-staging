import { UniqueEntityID } from '@domain/common/Identifier';
import { INotificationHistoryRepository, NotificationMessage } from '@domain/srs/interfaces/INotificationService';
import { BaseRepository } from '../repositories/BaseRepository';
/**
 * Supabase 기반 알림 이력 리포지토리 구현체
 * 알림 전송 이력, 실패 기록, 재시도 정보 관리
 */
export declare class SupabaseNotificationHistoryRepository extends BaseRepository implements INotificationHistoryRepository {
    private readonly tableName;
    private readonly schema;
    /**
     * 알림 전송 이력 저장
     */
    saveNotification(message: NotificationMessage): Promise<void>;
    /**
     * 사용자별 알림 이력 조회 (최근 순)
     */
    findByUserId(userId: UniqueEntityID, limit?: number): Promise<NotificationMessage[]>;
    /**
     * 전송 실패한 알림 조회 (재시도용)
     */
    findFailedNotifications(limit?: number): Promise<NotificationMessage[]>;
    /**
     * 알림 상태 업데이트 (전송 완료)
     */
    markAsSent(notificationId: string, sentAt: Date): Promise<void>;
    /**
     * 알림 전송 실패 기록
     */
    markAsFailed(notificationId: string, failureReason: string): Promise<void>;
    /**
     * 재시도 횟수 증가
     */
    incrementRetryCount(notificationId: string): Promise<void>;
    /**
     * 오래된 알림 이력 삭제 (데이터 정리용)
     * 일반적으로 6개월 이상 된 데이터를 삭제
     */
    deleteOldNotifications(olderThan: Date): Promise<void>;
    /**
     * 날짜 범위별 알림 통계 조회
     */
    getStatistics(startDate: Date, endDate: Date): Promise<{
        totalSent: number;
        totalFailed: number;
        byType: Record<string, number>;
        byHour: Record<number, number>;
    }>;
    /**
     * 도메인 객체를 데이터베이스 행으로 변환
     */
    private toPersistence;
    /**
     * 데이터베이스 행을 도메인 객체로 변환
     */
    private toDomain;
}
//# sourceMappingURL=SupabaseNotificationHistoryRepository.d.ts.map