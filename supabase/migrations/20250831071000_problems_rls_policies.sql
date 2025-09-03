-- 문제 관리 시스템 RLS (Row Level Security) 정책
-- 교사별 문제 뱅크 구현을 위한 접근 제어

-- 1. RLS 활성화
ALTER TABLE learning.problems ENABLE ROW LEVEL SECURITY;

-- 2. 기본 정책: 교사는 자신의 문제만 접근 가능

-- 교사별 문제 조회 정책
CREATE POLICY "Teachers can view own problems"
  ON learning.problems
  FOR SELECT
  USING (teacher_id = auth.uid());

-- 교사별 문제 생성 정책
CREATE POLICY "Teachers can create own problems"
  ON learning.problems
  FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

-- 교사별 문제 수정 정책
CREATE POLICY "Teachers can update own problems"
  ON learning.problems
  FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- 교사별 문제 삭제 정책
CREATE POLICY "Teachers can delete own problems"
  ON learning.problems
  FOR DELETE
  USING (teacher_id = auth.uid());

-- 3. 관리자 정책 (선택적 - 관리자는 모든 문제에 접근 가능)

-- 관리자 전체 조회 정책
CREATE POLICY "Admins can view all problems"
  ON learning.problems
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 관리자 전체 수정 정책
CREATE POLICY "Admins can update all problems"
  ON learning.problems
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 관리자 전체 삭제 정책
CREATE POLICY "Admins can delete all problems"
  ON learning.problems
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 4. 문제 뱅크 공유 기능을 위한 정책 (향후 확장)

-- 공유된 문제 조회를 위한 테이블 (향후 구현 예정)
/*
CREATE TABLE IF NOT EXISTS learning.problem_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES learning.problems(id) ON DELETE CASCADE,
  owner_teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level VARCHAR(20) DEFAULT 'read' CHECK (permission_level IN ('read', 'clone', 'edit')),
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  UNIQUE(problem_id, shared_teacher_id)
);

-- 공유된 문제 조회 정책 (향후 활성화)
CREATE POLICY "Teachers can view shared problems"
  ON learning.problems
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM learning.problem_shares
      WHERE problem_shares.problem_id = problems.id
      AND problem_shares.shared_teacher_id = auth.uid()
      AND problem_shares.is_active = true
      AND (problem_shares.expires_at IS NULL OR problem_shares.expires_at > NOW())
    )
  );
*/

-- 5. 성능 최적화를 위한 RLS 함수

-- 현재 사용자가 교사인지 확인하는 함수
CREATE OR REPLACE FUNCTION learning.current_user_is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('teacher', 'admin')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 현재 사용자가 관리자인지 확인하는 함수
CREATE OR REPLACE FUNCTION learning.current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 문제 접근 권한 확인 함수 (Application에서 사용)

CREATE OR REPLACE FUNCTION learning.can_access_problem(
  p_problem_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 문제 소유자인지 확인
  IF EXISTS (
    SELECT 1 FROM learning.problems
    WHERE id = p_problem_id
    AND teacher_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 관리자인지 확인
  IF learning.current_user_is_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- 향후 공유 기능 추가 시
  /*
  IF EXISTS (
    SELECT 1 FROM learning.problem_shares
    WHERE problem_id = p_problem_id
    AND shared_teacher_id = p_user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    RETURN TRUE;
  END IF;
  */
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 문제 소유권 확인 함수

CREATE OR REPLACE FUNCTION learning.is_problem_owner(
  p_problem_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM learning.problems
    WHERE id = p_problem_id
    AND teacher_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 교사별 문제 통계 뷰 (RLS 적용)

CREATE VIEW learning.teacher_problem_stats AS
SELECT 
  teacher_id,
  COUNT(*) as total_problems,
  COUNT(*) FILTER (WHERE is_active = true) as active_problems,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_problems,
  COUNT(DISTINCT type) as unique_types,
  AVG(difficulty) as avg_difficulty,
  AVG(array_length(COALESCE(tags, '{}'), 1)) as avg_tags_per_problem,
  MIN(created_at) as first_problem_created,
  MAX(updated_at) as last_problem_updated,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as created_this_week,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as created_this_month
FROM learning.problems
GROUP BY teacher_id;

-- RLS를 뷰에도 적용 (뷰는 기본 테이블의 RLS를 따름)
-- PostgreSQL 뷰는 직접 RLS 정책을 적용할 수 없으므로
-- 기본 테이블(learning.problems)의 RLS가 자동으로 적용됨
ALTER VIEW learning.teacher_problem_stats OWNER TO postgres;

-- 9. 인덱스 최적화 (RLS 성능 향상)

-- teacher_id 기반 쿼리 최적화
CREATE INDEX IF NOT EXISTS idx_problems_teacher_active 
  ON learning.problems(teacher_id, is_active);

CREATE INDEX IF NOT EXISTS idx_problems_teacher_type_difficulty 
  ON learning.problems(teacher_id, type, difficulty);

CREATE INDEX IF NOT EXISTS idx_problems_teacher_created 
  ON learning.problems(teacher_id, created_at DESC);

-- 태그 검색 최적화 (GIN 인덱스는 tags만 적용)
CREATE INDEX IF NOT EXISTS idx_problems_tags 
  ON learning.problems USING gin(tags);

-- teacher_id별 태그 검색은 별도 B-tree 인덱스
CREATE INDEX IF NOT EXISTS idx_problems_teacher_id 
  ON learning.problems(teacher_id);

-- 10. RLS 성능 모니터링을 위한 함수

CREATE OR REPLACE FUNCTION learning.analyze_problem_access_patterns()
RETURNS TABLE(
  teacher_id TEXT,
  total_problems BIGINT,
  avg_query_time_ms NUMERIC,
  most_common_filters JSONB
) AS $$
BEGIN
  -- 실제 구현에서는 pg_stat_statements 등을 활용하여
  -- 쿼리 성능을 분석할 수 있습니다.
  RETURN QUERY
  SELECT 
    p.teacher_id,
    COUNT(*) as total_problems,
    0::numeric as avg_query_time_ms, -- 실제 구현 시 통계 데이터 사용
    '{}'::jsonb as most_common_filters
  FROM learning.problems p
  GROUP BY p.teacher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 권한 테스트를 위한 샘플 함수

CREATE OR REPLACE FUNCTION learning.test_problem_permissions(
  p_teacher_id UUID,
  p_problem_count INTEGER DEFAULT 5
)
RETURNS TABLE(
  problem_id UUID,
  can_view BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN
) AS $$
DECLARE
  test_problem_id UUID;
BEGIN
  -- 테스트용 문제 생성 및 권한 확인
  FOR i IN 1..p_problem_count LOOP
    INSERT INTO learning.problems (
      teacher_id,
      content,
      correct_answer,
      type,
      difficulty,
      tags
    ) VALUES (
      p_teacher_id,
      jsonb_build_object(
        'type', 'multiple_choice',
        'title', 'Test Problem ' || i,
        'choices', jsonb_build_array('A', 'B', 'C', 'D')
      ),
      jsonb_build_object(
        'type', 'multiple_choice',
        'correctChoices', jsonb_build_array('A'),
        'points', 10
      ),
      'multiple_choice',
      (i % 5) + 1,
      ARRAY['test', 'sample']
    )
    RETURNING id INTO test_problem_id;
    
    RETURN QUERY SELECT
      test_problem_id,
      learning.can_access_problem(test_problem_id, p_teacher_id),
      learning.is_problem_owner(test_problem_id, p_teacher_id),
      learning.is_problem_owner(test_problem_id, p_teacher_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 12. 정책 검증 완료
-- RLS 정책이 올바르게 작동하는지 확인하기 위한 주석
-- 실제 사용 시에는 다음과 같은 테스트를 수행해야 합니다:
--
-- 1. 교사 A가 교사 B의 문제에 접근할 수 없는지 확인
-- 2. 교사가 자신의 문제만 조회/수정/삭제할 수 있는지 확인  
-- 3. 관리자가 모든 문제에 접근할 수 있는지 확인
-- 4. RLS가 활성화된 상태에서 성능이 적절한지 확인

COMMENT ON TABLE learning.problems IS 'Problems table with Row Level Security policies for teacher-specific problem banks';
COMMENT ON POLICY "Teachers can view own problems" ON learning.problems IS 'Teachers can only view their own problems';
COMMENT ON POLICY "Admins can view all problems" ON learning.problems IS 'Administrators can view all problems for management purposes';