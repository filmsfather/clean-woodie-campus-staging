-- 초대 토큰 테이블에 RLS 활성화 및 정책 설정
-- 관리자는 모든 권한, 일반 사용자는 토큰 검증만 가능

-- RLS 활성화
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- 관리자 정책: 모든 초대 토큰 관리 (생성, 조회, 수정, 삭제)
CREATE POLICY "Admins can manage all invite tokens" ON invite_tokens
    FOR ALL USING (public.is_admin());

-- 초대 생성자 정책: 자신이 생성한 초대 토큰 조회 가능 (교사도 초대 생성 가능하다면)
CREATE POLICY "Users can view their own created invites" ON invite_tokens
    FOR SELECT USING (created_by = auth.uid());

-- 토큰 검증 정책: 모든 사용자가 토큰으로 초대 정보 조회 가능 (가입 프로세스용)
-- 단, 민감한 정보(created_by 등)는 애플리케이션 레이어에서 필터링
CREATE POLICY "Anyone can validate invite tokens" ON invite_tokens
    FOR SELECT USING (
        -- 유효한 토큰만 조회 가능 (만료되지 않고 사용되지 않은)
        expires_at > NOW() 
        AND used_at IS NULL
    );

-- 토큰 사용 정책: 초대받은 사용자가 토큰 사용 처리 (used_at, used_by 업데이트)
CREATE POLICY "Users can use invite tokens for themselves" ON invite_tokens
    FOR UPDATE USING (
        -- 자신의 ID로 토큰 사용하는 경우만 허용
        auth.uid() IS NOT NULL
        AND expires_at > NOW()
        AND used_at IS NULL
    ) WITH CHECK (
        -- 업데이트 시 used_by가 현재 사용자 ID와 일치해야 함
        used_by = auth.uid()
        AND used_at IS NOT NULL
    );

-- 기존 profiles 테이블 정책 보완: 초대를 통한 프로필 생성 허용
-- 기존 "Users can insert their own profile" 정책이 있지만, 
-- 초대 기반 가입에서 조직/클래스 정보 설정을 위해 보완 정책 추가

CREATE POLICY "Invite-based profile creation" ON profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id 
        AND (
            -- 일반적인 자신의 프로필 생성
            auth.uid() IS NOT NULL
            OR 
            -- 또는 유효한 초대 토큰을 통한 가입 
            EXISTS (
                SELECT 1 FROM invite_tokens it
                WHERE it.email = profiles.email
                AND it.used_by = auth.uid()
                AND it.used_at IS NOT NULL
                AND it.role = profiles.role
            )
        )
    );

-- 조직 관련 정책 보완: 초대받은 사용자도 소속 조직 조회 가능
-- 기존 정책을 대체하지 않고 추가 조건으로 확장
CREATE POLICY "Invited users can view their organization" ON organizations
    FOR SELECT USING (
        -- 기존 조건: 프로필의 school_id로 조직 확인
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.school_id = organizations.id
        )
        OR
        -- 새 조건: 사용된 초대 토큰을 통한 조직 확인  
        EXISTS (
            SELECT 1 FROM invite_tokens it
            WHERE it.used_by = auth.uid()
            AND it.organization_id = organizations.id
            AND it.used_at IS NOT NULL
        )
    );

-- 클래스 관련 정책 보완: 초대를 통해 배정된 클래스 접근 허용
CREATE POLICY "Invited students can view their assigned class" ON classes
    FOR SELECT USING (
        -- 기존 조건들 유지하면서 새 조건 추가
        EXISTS (
            SELECT 1 FROM class_enrollments 
            WHERE class_enrollments.class_id = classes.id 
            AND class_enrollments.student_id = auth.uid()
        )
        OR
        -- 초대를 통해 배정된 클래스 접근
        EXISTS (
            SELECT 1 FROM invite_tokens it
            WHERE it.used_by = auth.uid()
            AND it.class_id = classes.id
            AND it.used_at IS NOT NULL
            AND it.role = 'student'
        )
    );

-- 보안 강화: 초대 토큰의 민감한 정보 보호를 위한 뷰 생성
-- 애플리케이션에서는 이 뷰를 통해 안전하게 토큰 정보에 접근
CREATE VIEW public_invite_info AS
SELECT 
    id,
    email,
    role,
    organization_id,
    class_id,
    token,
    expires_at,
    used_at,
    created_at,
    -- 민감한 정보는 조건부로만 노출
    CASE 
        WHEN auth.uid() = created_by OR public.is_admin() THEN created_by
        ELSE NULL 
    END as created_by,
    CASE 
        WHEN auth.uid() = used_by OR public.is_admin() THEN used_by  
        ELSE NULL
    END as used_by
FROM invite_tokens;

-- 뷰에 대한 RLS는 기본 테이블을 따름
ALTER VIEW public_invite_info SET (security_barrier = true);