-- 진도 추적 시스템 RLS (Row Level Security) 정책
-- 학생은 자신의 데이터만, 교사는 담당 학급 데이터만 접근 가능

-- 1. RLS 활성화
ALTER TABLE progress.study_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress.statistics ENABLE ROW LEVEL SECURITY;

-- 2. study_streaks 테이블 RLS 정책
-- 학생: 자신의 스트릭만 조회/수정 가능
CREATE POLICY "Students can view own streaks" ON progress.study_streaks
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR 
    -- 교사는 자신이 가르치는 학급의 학생들 스트릭 조회 가능
    (public.is_teacher() AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = progress.study_streaks.student_id
      AND c.teacher_id = auth.uid()
    ))
    OR
    -- 관리자는 모든 데이터 조회 가능
    public.is_admin()
  );

-- 시스템에서 스트릭 삽입 (서비스 레벨에서만)
CREATE POLICY "System can insert streaks" ON progress.study_streaks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- 자신의 스트릭만 생성 가능 (실제로는 서비스 레벨에서 관리)
    student_id = auth.uid()
    OR
    -- 교사가 학급 학생의 스트릭 생성 (드문 경우)
    (public.is_teacher() AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = student_id
      AND c.teacher_id = auth.uid()
    ))
    OR
    public.is_admin()
  );

-- 시스템에서 스트릭 업데이트 (서비스 레벨에서만)
CREATE POLICY "System can update streaks" ON progress.study_streaks
  FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    OR
    (public.is_teacher() AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = progress.study_streaks.student_id
      AND c.teacher_id = auth.uid()
    ))
    OR
    public.is_admin()
  )
  WITH CHECK (
    student_id = auth.uid()
    OR
    (public.is_teacher() AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = student_id
      AND c.teacher_id = auth.uid()
    ))
    OR
    public.is_admin()
  );

-- 스트릭 삭제는 관리자만 가능
CREATE POLICY "Admins can delete streaks" ON progress.study_streaks
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 3. statistics 테이블 RLS 정책
-- 학생: 자신의 통계만 조회 가능
CREATE POLICY "Students can view own statistics" ON progress.statistics
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR 
    -- 교사는 자신이 가르치는 학급의 학생들 통계 조회 가능
    (public.is_teacher() AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = progress.statistics.student_id
      AND c.teacher_id = auth.uid()
    ))
    OR
    -- 교사는 자신이 만든 문제집의 통계 조회 가능
    (public.is_teacher() AND EXISTS (
      SELECT 1 FROM problem_sets ps
      WHERE ps.id = progress.statistics.problem_set_id
      AND ps.created_by = auth.uid()
    ))
    OR
    -- 관리자는 모든 데이터 조회 가능
    public.is_admin()
  );

-- 시스템에서 통계 삽입 (서비스 레벨에서만)
CREATE POLICY "System can insert statistics" ON progress.statistics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- 자신의 통계만 생성 가능 (실제로는 서비스 레벨에서 관리)
    student_id = auth.uid()
    OR
    -- 교사가 자신의 문제집에 대한 학생 통계 생성
    (public.is_teacher() AND EXISTS (
      SELECT 1 FROM problem_sets ps
      WHERE ps.id = problem_set_id
      AND ps.created_by = auth.uid()
    ))
    OR
    public.is_admin()
  );

-- 시스템에서 통계 업데이트 (서비스 레벨에서만)
CREATE POLICY "System can update statistics" ON progress.statistics
  FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    OR
    (public.is_teacher() AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = progress.statistics.student_id
      AND c.teacher_id = auth.uid()
    ))
    OR
    (public.is_teacher() AND EXISTS (
      SELECT 1 FROM problem_sets ps
      WHERE ps.id = progress.statistics.problem_set_id
      AND ps.created_by = auth.uid()
    ))
    OR
    public.is_admin()
  )
  WITH CHECK (
    student_id = auth.uid()
    OR
    (public.is_teacher() AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = student_id
      AND c.teacher_id = auth.uid()
    ))
    OR
    (public.is_teacher() AND EXISTS (
      SELECT 1 FROM problem_sets ps
      WHERE ps.id = problem_set_id
      AND ps.created_by = auth.uid()
    ))
    OR
    public.is_admin()
  );

-- 통계 삭제는 관리자만 가능
CREATE POLICY "Admins can delete statistics" ON progress.statistics
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 4. 성능을 위한 추가 인덱스 (RLS 쿼리 최적화)
-- 교사-학생 관계 조회 최적화
CREATE INDEX IF NOT EXISTS idx_class_enrollments_teacher_lookup 
  ON class_enrollments(student_id, class_id);

-- 문제집 소유자 조회 최적화  
CREATE INDEX IF NOT EXISTS idx_problem_sets_created_by 
  ON problem_sets(created_by)
  WHERE created_by IS NOT NULL;

-- 클래스-교사 관계 최적화
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id
  ON classes(teacher_id)
  WHERE teacher_id IS NOT NULL;

-- 5. 뷰에 대한 권한 설정 (뷰 생성 후에 실행됨)
-- authenticated 사용자는 뷰를 조회할 수 있음 (RLS는 기본 테이블에서 적용됨)
-- 이 GRANT 문들은 뷰가 생성된 후에 따로 실행되어야 함

-- 6. RLS 정책 테스트용 함수 (개발/테스트 환경용)
CREATE OR REPLACE FUNCTION progress.test_rls_policies()
RETURNS TABLE(
  test_name TEXT,
  result BOOLEAN,
  description TEXT
) AS $$
BEGIN
  -- 이 함수는 RLS 정책이 올바르게 작동하는지 테스트하는 용도
  -- 실제 운영환경에서는 제거하거나 제한적으로 사용
  
  RETURN QUERY SELECT 
    'RLS enabled for study_streaks'::TEXT,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'study_streaks' AND relnamespace = 'progress'::regnamespace),
    'study_streaks table should have RLS enabled'::TEXT;
    
  RETURN QUERY SELECT 
    'RLS enabled for statistics'::TEXT,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'statistics' AND relnamespace = 'progress'::regnamespace),
    'statistics table should have RLS enabled'::TEXT;
    
  RETURN QUERY SELECT 
    'Helper functions available'::TEXT,
    (SELECT COUNT(*) > 0 FROM pg_proc WHERE proname = 'user_role' AND pronamespace = 'public'::regnamespace),
    'public.user_role() function should be available'::TEXT;
    
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 코멘트
COMMENT ON POLICY "Students can view own streaks" ON progress.study_streaks 
  IS 'Students can view their own learning streaks, teachers can view their class students streaks';

COMMENT ON POLICY "Students can view own statistics" ON progress.statistics 
  IS 'Students can view their own learning statistics, teachers can view their class or problem set statistics';

-- 8. 권한 부여 (테스트 함수만, 나머지는 별도 파일에서)
GRANT EXECUTE ON FUNCTION progress.test_rls_policies() TO authenticated;