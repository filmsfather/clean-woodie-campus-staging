-- 초대 토큰 시스템 생성
-- Admin이 새 사용자를 초대하기 위한 토큰 관리 테이블

CREATE TABLE invite_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL, -- 초대받을 사용자 이메일
    role user_role NOT NULL DEFAULT 'student', -- 초대할 사용자 역할 (기존 enum 재사용)
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- 소속 기관
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE, -- 초대할 클래스 (학생인 경우만)
    token TEXT UNIQUE NOT NULL, -- 고유 초대 토큰 (URL에 포함될 32자리 랜덤 문자열)
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 토큰 만료 시간 (기본 7일)
    used_at TIMESTAMP WITH TIME ZONE, -- 토큰 사용 시간 (가입 완료 시 설정)
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- 초대를 생성한 관리자
    used_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- 토큰을 사용한 사용자
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- 비즈니스 규칙 제약 조건
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- 이메일 형식 검증
    CONSTRAINT valid_token_length CHECK (LENGTH(token) >= 32), -- 토큰 최소 길이 보장
    CONSTRAINT expires_in_future CHECK (expires_at > created_at), -- 만료일이 생성일보다 미래
    CONSTRAINT teacher_admin_no_class CHECK ( -- 교사/관리자는 클래스 지정 불가
        CASE 
            WHEN role IN ('teacher', 'admin') THEN class_id IS NULL
            ELSE TRUE
        END
    )
);

-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_invite_tokens_email ON invite_tokens(email); -- 이메일로 중복 초대 검색
CREATE INDEX idx_invite_tokens_token ON invite_tokens(token); -- 토큰 기반 빠른 조회
CREATE INDEX idx_invite_tokens_expires ON invite_tokens(expires_at); -- 만료된 토큰 정리
CREATE INDEX idx_invite_tokens_organization ON invite_tokens(organization_id); -- 기관별 초대 관리
CREATE INDEX idx_invite_tokens_created_by ON invite_tokens(created_by); -- 관리자별 초대 이력
CREATE INDEX idx_invite_tokens_unused ON invite_tokens(used_at) WHERE used_at IS NULL; -- 미사용 토큰 조회 최적화

-- updated_at 트리거 적용 (기존 패턴 따름)
CREATE TRIGGER update_invite_tokens_updated_at 
    BEFORE UPDATE ON invite_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 토큰 유효성 검증 헬퍼 함수
CREATE OR REPLACE FUNCTION validate_invite_token(token_value TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    invite_id UUID,
    email TEXT,
    role user_role,
    organization_id UUID,
    class_id UUID,
    error_message TEXT
) AS $$
BEGIN
    -- 유효한 토큰 조회 (만료되지 않고 사용되지 않은 토큰)
    SELECT 
        TRUE as is_valid,
        t.id as invite_id,
        t.email,
        t.role,
        t.organization_id,
        t.class_id,
        NULL as error_message
    INTO is_valid, invite_id, email, role, organization_id, class_id, error_message
    FROM invite_tokens t
    WHERE t.token = token_value
      AND t.expires_at > NOW()
      AND t.used_at IS NULL;
    
    -- 토큰을 찾지 못한 경우 상세 오류 메시지 제공
    IF NOT FOUND THEN
        IF EXISTS (
            SELECT 1 FROM invite_tokens t 
            WHERE t.token = token_value 
              AND t.expires_at <= NOW()
        ) THEN
            is_valid := FALSE;
            error_message := 'Token has expired';
        ELSIF EXISTS (
            SELECT 1 FROM invite_tokens t 
            WHERE t.token = token_value 
              AND t.used_at IS NOT NULL
        ) THEN
            is_valid := FALSE;
            error_message := 'Token has already been used';
        ELSE
            is_valid := FALSE;
            error_message := 'Invalid token';
        END IF;
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 만료된 토큰 정리 함수 (배치 작업용)
CREATE OR REPLACE FUNCTION cleanup_expired_invite_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 만료 후 30일이 지난 토큰들을 삭제 (감사 목적으로 일정기간 보관)
    DELETE FROM invite_tokens 
    WHERE expires_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;