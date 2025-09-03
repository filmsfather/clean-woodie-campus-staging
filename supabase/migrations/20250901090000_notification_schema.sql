-- 실시간 알림 시스템을 위한 테이블 스키마
-- Supabase Realtime과 연동하여 사용자별 알림 설정 및 이력 관리

-- 1. 사용자 알림 설정 테이블
CREATE TABLE learning.notification_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    review_reminders BOOLEAN NOT NULL DEFAULT true,
    overdue_reminders BOOLEAN NOT NULL DEFAULT true,  
    daily_summary BOOLEAN NOT NULL DEFAULT true,
    milestone_alerts BOOLEAN NOT NULL DEFAULT true,
    quiet_hours_start TIME NOT NULL DEFAULT '22:00',
    quiet_hours_end TIME NOT NULL DEFAULT '08:00',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Seoul',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 알림 전송 이력 테이블
CREATE TABLE learning.notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'review_due', 'review_overdue', 'daily_summary', 'milestone'
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB, -- 추가 메타데이터 (문제 ID, 일정 ID 등)
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ, -- 실제 전송 완료 시간
    failed_at TIMESTAMPTZ, -- 전송 실패 시간
    failure_reason TEXT, -- 실패 사유
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 인덱스 생성
-- 사용자별 알림 이력 조회 최적화
CREATE INDEX idx_notification_history_recipient 
ON learning.notification_history(recipient_id, created_at DESC);

-- 알림 타입별 조회 최적화
CREATE INDEX idx_notification_history_type 
ON learning.notification_history(type, created_at DESC);

-- 실패한 알림 조회 최적화 (재시도용)
CREATE INDEX idx_notification_history_failed 
ON learning.notification_history(failed_at, retry_count) 
WHERE sent_at IS NULL AND failed_at IS NOT NULL;

-- 전송 대기 중인 예약 알림 조회 최적화
CREATE INDEX idx_notification_history_pending 
ON learning.notification_history(scheduled_at) 
WHERE sent_at IS NULL AND failed_at IS NULL;

-- 4. RLS (Row Level Security) 정책
-- 사용자는 자신의 알림 설정만 조회/수정 가능
ALTER TABLE learning.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_settings_user_policy 
ON learning.notification_settings 
FOR ALL 
USING (auth.uid() = user_id);

-- 사용자는 자신의 알림 이력만 조회 가능
ALTER TABLE learning.notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_history_user_policy 
ON learning.notification_history 
FOR SELECT 
USING (auth.uid() = recipient_id);

-- 서비스 계정은 모든 알림 이력에 접근 가능 (관리/모니터링용)
CREATE POLICY notification_history_service_policy 
ON learning.notification_history 
FOR ALL 
USING (current_setting('role') = 'service_role');

-- 5. 자동 업데이트 트리거 (알림 설정)
CREATE OR REPLACE FUNCTION learning.update_notification_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_settings_timestamp
    BEFORE UPDATE ON learning.notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION learning.update_notification_settings_timestamp();

-- 6. 재시도 횟수 증가 함수
CREATE OR REPLACE FUNCTION learning.increment_notification_retry(notification_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE learning.notification_history 
    SET retry_count = retry_count + 1,
        failed_at = NOW()
    WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 알림 통계 조회 함수
CREATE OR REPLACE FUNCTION learning.get_notification_stats(
    user_id_param UUID,
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_sent BIGINT,
    total_failed BIGINT,
    success_rate NUMERIC,
    avg_delivery_time_seconds NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE sent_at IS NOT NULL) as total_sent,
        COUNT(*) FILTER (WHERE failed_at IS NOT NULL AND sent_at IS NULL) as total_failed,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE sent_at IS NOT NULL) * 100.0 / COUNT(*)), 2)
            ELSE 0
        END as success_rate,
        CASE 
            WHEN COUNT(*) FILTER (WHERE sent_at IS NOT NULL) > 0 THEN
                ROUND(AVG(EXTRACT(EPOCH FROM (sent_at - scheduled_at))) FILTER (WHERE sent_at IS NOT NULL), 2)
            ELSE 0
        END as avg_delivery_time_seconds
    FROM learning.notification_history
    WHERE recipient_id = user_id_param
      AND created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 오래된 알림 이력 정리 함수 (배치 작업용)
CREATE OR REPLACE FUNCTION learning.cleanup_old_notifications(
    older_than_days INTEGER DEFAULT 180
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM learning.notification_history 
    WHERE created_at < NOW() - (older_than_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 로그 기록
    RAISE NOTICE 'Cleaned up % old notification records older than % days', deleted_count, older_than_days;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Realtime 활성화
-- 알림 설정 변경 시 실시간 동기화
ALTER publication supabase_realtime ADD TABLE learning.notification_settings;

-- 10. 코멘트 추가
COMMENT ON TABLE learning.notification_settings IS '사용자별 알림 선호도 설정 (조용한 시간, 알림 타입별 활성화 등)';
COMMENT ON TABLE learning.notification_history IS '알림 전송 이력 및 실패 추적 (재시도, 통계, 모니터링용)';

COMMENT ON COLUMN learning.notification_settings.quiet_hours_start IS '조용한 시간 시작 (HH:MM 형식)';
COMMENT ON COLUMN learning.notification_settings.quiet_hours_end IS '조용한 시간 종료 (HH:MM 형식)';
COMMENT ON COLUMN learning.notification_settings.timezone IS '사용자 타임존 (IANA 표준)';

COMMENT ON COLUMN learning.notification_history.data IS '알림 관련 메타데이터 (문제 ID, 복습 일정 ID, 우선순위 등)';
COMMENT ON COLUMN learning.notification_history.retry_count IS '재시도 횟수 (최대 3회)';

-- 성공 메시지
SELECT 'Notification system schema created successfully!' as status;