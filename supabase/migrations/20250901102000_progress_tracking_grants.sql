-- 진도 추적 시스템 권한 부여
-- 뷰와 함수가 생성된 후에 실행되는 권한 설정

-- 1. 뷰에 대한 권한 설정
-- authenticated 사용자는 뷰를 조회할 수 있음 (RLS는 기본 테이블에서 적용됨)
GRANT SELECT ON progress.active_streaks TO authenticated;
GRANT SELECT ON progress.problem_set_summary TO authenticated;
GRANT SELECT ON progress.student_progress_summary TO authenticated;
GRANT SELECT ON progress.class_progress_summary TO authenticated;

-- 2. 함수에 대한 권한 설정
GRANT EXECUTE ON FUNCTION progress.calculate_student_efficiency_score(UUID) TO authenticated;

-- 3. 스키마에 대한 사용 권한
GRANT USAGE ON SCHEMA progress TO authenticated;

-- 4. 테이블에 대한 기본 권한 (RLS로 제한됨)
-- SELECT 권한은 RLS 정책으로 제한
GRANT SELECT ON progress.study_streaks TO authenticated;
GRANT SELECT ON progress.statistics TO authenticated;

-- INSERT, UPDATE, DELETE는 서비스 레벨에서만 수행 (service role용)
-- 필요시 service role에 대한 추가 권한 부여 가능

-- 5. 시퀀스 권한 (UUID 생성용, 필요한 경우)
-- UUID는 gen_random_uuid()를 사용하므로 별도 시퀀스 권한 불필요

-- 6. 코멘트
COMMENT ON SCHEMA progress IS 'Learning progress tracking system schema with proper RLS and permissions';

-- 7. 권한 확인용 뷰 (개발/관리용)
CREATE OR REPLACE VIEW progress.permission_summary AS
SELECT 
  table_schema as schemaname,
  table_name as tablename,
  'table' as object_type,
  array_agg(DISTINCT privilege_type) as privileges
FROM information_schema.table_privileges 
WHERE grantee = 'authenticated' 
  AND table_schema = 'progress'
GROUP BY table_schema, table_name
UNION ALL
SELECT 
  view_schema as schemaname,
  view_name as tablename,
  'view' as object_type,
  array_agg(DISTINCT privilege_type) as privileges
FROM information_schema.view_table_usage vtu
JOIN information_schema.table_privileges tp 
  ON vtu.view_schema = tp.table_schema 
  AND vtu.view_name = tp.table_name
WHERE tp.grantee = 'authenticated' 
  AND vtu.view_schema = 'progress'
GROUP BY view_schema, view_name
ORDER BY object_type, tablename;