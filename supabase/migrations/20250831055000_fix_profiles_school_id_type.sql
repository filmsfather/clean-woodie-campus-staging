-- profiles.school_id를 TEXT에서 UUID로 변경하여 타입 일관성 확보
-- 기존 RLS 정책이 해당 컬럼을 참조하므로 먼저 정책 삭제 후 복원

-- 1. 기존 RLS 정책 임시 삭제 (school_id를 참조하는 정책들)
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Teachers can view their organization" ON organizations;

-- 2. 기존 데이터 검증 및 정리
-- 유효하지 않은 UUID 형식의 school_id를 NULL로 변경
UPDATE profiles 
SET school_id = NULL 
WHERE school_id IS NOT NULL 
  AND school_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- 3. 컬럼 타입 변경
ALTER TABLE profiles 
ALTER COLUMN school_id TYPE UUID 
USING CASE 
    WHEN school_id IS NULL THEN NULL
    ELSE school_id::UUID 
END;

-- 4. 외래 키 제약 조건 추가 (참조 무결성 강화)
ALTER TABLE profiles 
ADD CONSTRAINT fk_profiles_school_id 
FOREIGN KEY (school_id) REFERENCES organizations(id) 
ON DELETE SET NULL;

-- 5. 성능을 위한 인덱스 추가
CREATE INDEX idx_profiles_school_id ON profiles(school_id) WHERE school_id IS NOT NULL;

-- 6. 기본 RLS 정책 복원 (UUID 타입으로 수정)
CREATE POLICY "Users can view organizations they belong to" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.school_id = organizations.id
        )
    );

CREATE POLICY "Teachers can view their organization" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin')
            AND profiles.school_id = organizations.id
        )
    );