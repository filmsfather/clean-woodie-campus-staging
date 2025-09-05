-- 기존 테스트 데이터 삭제 (중복 방지)
-- profiles 먼저 삭제 (외래키 제약 조건 때문)
DELETE FROM profiles WHERE id IN (uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4());
DELETE FROM profiles WHERE email IN ('admin@woodiecampus.com', 'teacher@woodiecampus.com', 'student@woodiecampus.com');

-- auth.users 삭제 (CASCADE로 연관 데이터도 자동 삭제됨)
DELETE FROM auth.users WHERE id IN (uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4());
DELETE FROM auth.users WHERE email IN ('admin@woodiecampus.com', 'teacher@woodiecampus.com', 'student@woodiecampus.com');

-- 테스트 조직(학교) 데이터 삽입
INSERT INTO organizations (id, name, description) VALUES 
('123e4567-e89b-12d3-a456-426614174000', 'Woodie Test School', 'A test school for development')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 기본 성취(업적) 데이터 삽입
-- 학생들의 학습 동기부여를 위한 다양한 성취 목표들
INSERT INTO achievements (id, name, description, token_reward, criteria) VALUES 
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'First Submission', 'Complete your first assignment', 10, '{"type": "first_submission"}'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Perfect Score', 'Get 100% on an assignment', 25, '{"type": "perfect_score"}'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Speed Demon', 'Complete 5 problems in under 10 minutes', 50, '{"type": "speed_completion", "count": 5, "time_limit": 600}'),
('d4e5f6a7-b8c9-0123-defa-456789012345', 'Consistent Learner', 'Complete assignments for 7 days in a row', 100, '{"type": "streak", "days": 7}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  token_reward = EXCLUDED.token_reward,
  criteria = EXCLUDED.criteria;

-- 기본 어드민 사용자 생성
-- 이메일: admin@woodiecampus.com  
-- 비밀번호: admin123!@#
-- 실제 프로덕션에서는 반드시 비밀번호를 변경하세요!

-- UUID 변수 생성을 위한 임시 테이블 사용
DO $$
DECLARE
  admin_id UUID := uuid_generate_v4();
  teacher_id UUID := uuid_generate_v4(); 
  student_id UUID := uuid_generate_v4();
BEGIN
  -- 1. auth.users 테이블에 사용자들 추가 (UPSERT 방식)
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES 
  (admin_id, 'admin@woodiecampus.com', crypt('admin123!@#', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''),
  (teacher_id, 'teacher@woodiecampus.com', crypt('teacher123', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''),
  (student_id, 'student@woodiecampus.com', crypt('student123', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', '')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = NOW();

  -- 2. public.profiles 테이블에 프로필들 추가 (UPSERT 방식)
  INSERT INTO profiles (
    id, email, full_name, role, school_id, grade_level, created_at, updated_at
  ) VALUES 
  (admin_id, 'admin@woodiecampus.com', 'System Administrator', 'admin', '123e4567-e89b-12d3-a456-426614174000', NULL, NOW(), NOW()),
  (teacher_id, 'teacher@woodiecampus.com', 'Test Teacher', 'teacher', '123e4567-e89b-12d3-a456-426614174000', NULL, NOW(), NOW()),
  (student_id, 'student@woodiecampus.com', 'Test Student', 'student', '123e4567-e89b-12d3-a456-426614174000', 10, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    school_id = EXCLUDED.school_id,
    grade_level = EXCLUDED.grade_level,
    updated_at = NOW();
END $$;

-- Note: Test users created above with DO block
-- User profiles will be created automatically when users sign up via Supabase Auth  
-- The trigger and function for this will be created in the migrations