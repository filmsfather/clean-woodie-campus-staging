-- 테스트 조직(학교) 데이터 삽입
INSERT INTO organizations (id, name, description) VALUES 
('123e4567-e89b-12d3-a456-426614174000', 'Woodie Test School', 'A test school for development');

-- 기본 성취(업적) 데이터 삽입
-- 학생들의 학습 동기부여를 위한 다양한 성취 목표들
INSERT INTO achievements (id, name, description, token_reward, criteria) VALUES 
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'First Submission', 'Complete your first assignment', 10, '{"type": "first_submission"}'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Perfect Score', 'Get 100% on an assignment', 25, '{"type": "perfect_score"}'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Speed Demon', 'Complete 5 problems in under 10 minutes', 50, '{"type": "speed_completion", "count": 5, "time_limit": 600}'),
('d4e5f6a7-b8c9-0123-defa-456789012345', 'Consistent Learner', 'Complete assignments for 7 days in a row', 100, '{"type": "streak", "days": 7}');

-- 기본 어드민 사용자 생성
-- 이메일: admin@woodiecampus.com
-- 비밀번호: admin123!@#
-- 실제 프로덕션에서는 반드시 비밀번호를 변경하세요!

-- 1. auth.users 테이블에 어드민 사용자 추가
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  'admin-user-id-12345678-1234-5678-9012-123456789012',
  'admin@woodiecampus.com',
  crypt('admin123!@#', gen_salt('bf')), -- bcrypt 해시
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
);

-- 2. public.profiles 테이블에 어드민 프로필 추가
INSERT INTO profiles (
  id,
  email,
  full_name,
  display_name,
  role,
  organization_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  'admin-user-id-12345678-1234-5678-9012-123456789012',
  'admin@woodiecampus.com',
  'System Administrator',
  'Admin',
  'admin',
  '123e4567-e89b-12d3-a456-426614174000',
  true,
  NOW(),
  NOW()
);

-- 기본 테스트 사용자들도 추가
-- 교사 계정
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  'teacher-user-id-12345678-1234-5678-9012-123456789012',
  'teacher@woodiecampus.com',
  crypt('teacher123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
);

INSERT INTO profiles (
  id,
  email,
  full_name,
  display_name,
  role,
  organization_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  'teacher-user-id-12345678-1234-5678-9012-123456789012',
  'teacher@woodiecampus.com',
  'Test Teacher',
  'Teacher Kim',
  'teacher',
  '123e4567-e89b-12d3-a456-426614174000',
  true,
  NOW(),
  NOW()
);

-- 학생 계정  
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  'student-user-id-12345678-1234-5678-9012-123456789012',
  'student@woodiecampus.com',
  crypt('student123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
);

INSERT INTO profiles (
  id,
  email,
  full_name,
  display_name,
  role,
  organization_id,
  grade_level,
  is_active,
  created_at,
  updated_at
) VALUES (
  'student-user-id-12345678-1234-5678-9012-123456789012',
  'student@woodiecampus.com',
  'Test Student',
  'Student Lee',
  'student',
  '123e4567-e89b-12d3-a456-426614174000',
  10,
  true,
  NOW(),
  NOW()
);

-- Note: User profiles will be created automatically when users sign up via Supabase Auth
-- The trigger and function for this will be created in the migrations