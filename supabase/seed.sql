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

-- Note: User profiles will be created automatically when users sign up via Supabase Auth
-- The trigger and function for this will be created in the next migration