-- 데이터베이스 성능 최적화 마이그레이션
-- 쿼리 패턴 분석 기반 인덱스 최적화 및 성능 개선
-- 도메인 순수성을 유지하면서 인프라스트럭처 레이어에서만 성능 향상

-- 1. 문제(Problems) 테이블 추가 최적화
-- 선생님별 활성 문제 조회 성능 개선
CREATE INDEX IF NOT EXISTS idx_problems_teacher_active_type_difficulty 
  ON learning.problems(teacher_id, is_active, type, difficulty) 
  WHERE is_active = true;

-- 태그 기반 검색 성능 개선 (부분 매칭)
CREATE INDEX IF NOT EXISTS idx_problems_tags_gin_ops 
  ON learning.problems USING gin(tags);

-- 최근 생성된 활성 문제 조회 최적화
CREATE INDEX IF NOT EXISTS idx_problems_recent_active 
  ON learning.problems(created_at DESC, is_active) 
  WHERE is_active = true;

-- 문제 콘텐츠 검색 성능 개선 (covering index)
CREATE INDEX IF NOT EXISTS idx_problems_search_covering 
  ON learning.problems(teacher_id, type, difficulty, id, content, tags, created_at) 
  WHERE is_active = true;

-- 2. SRS 테이블 최적화
-- 학생별 만료된 복습 카드 조회 최적화 (findDueReviews 메서드 최적화)
CREATE INDEX IF NOT EXISTS idx_review_schedules_student_overdue 
  ON learning.review_schedules(student_id, next_review_at, ease_factor);

-- 복습 간격별 분석을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_review_schedules_interval_analysis 
  ON learning.review_schedules(current_interval, ease_factor, review_count);

-- 연속 실패 횟수 기반 복습 우선순위 인덱스
CREATE INDEX IF NOT EXISTS idx_review_schedules_failure_priority 
  ON learning.review_schedules(student_id, consecutive_failures DESC, next_review_at) 
  WHERE consecutive_failures > 0;

-- 학습 기록 학생별 최근 활동 조회 최적화
CREATE INDEX IF NOT EXISTS idx_study_records_student_recent 
  ON learning.study_records(student_id, created_at DESC, feedback);

-- 문제별 정답률 분석을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_study_records_problem_stats 
  ON learning.study_records(problem_id, is_correct, created_at);

-- 3. 진도 추적 테이블 최적화
-- 학생별 스트릭 순위 조회 최적화 (findTopStreaks 메서드 최적화)
CREATE INDEX IF NOT EXISTS idx_study_streaks_leaderboard 
  ON progress.study_streaks(current_streak DESC, longest_streak DESC, student_id);

-- 오늘 학습한 학생 조회 최적화
CREATE INDEX IF NOT EXISTS idx_study_streaks_today 
  ON progress.study_streaks(last_study_date, current_streak);

-- 위험 상태 학생 조회 최적화 (findAtRiskStreaks 메서드 최적화)
CREATE INDEX IF NOT EXISTS idx_study_streaks_at_risk 
  ON progress.study_streaks(last_study_date, student_id);

-- 문제집별 완료율 분석 최적화
CREATE INDEX IF NOT EXISTS idx_statistics_completion_analysis 
  ON progress.statistics(problem_set_id, completed_problems, total_problems, student_id, correct_answers, total_time_spent);

-- 학생별 전체 성과 분석 최적화
CREATE INDEX IF NOT EXISTS idx_statistics_student_performance 
  ON progress.statistics(student_id, created_at, completed_problems, total_problems, correct_answers, total_time_spent);

-- 4. 자주 사용되는 쿼리 패턴을 위한 복합 인덱스
-- 클래스 내 학생 진도 조회 (클래스 시스템이 있다면)
CREATE INDEX IF NOT EXISTS idx_class_student_progress 
  ON progress.statistics(student_id, problem_set_id, completed_problems, total_problems, correct_answers);

-- 시간 범위별 학습 활동 분석
CREATE INDEX IF NOT EXISTS idx_study_records_time_range 
  ON learning.study_records(created_at, student_id, is_correct);

-- 5. 파티셔닝을 위한 준비 (대용량 데이터 대비)
-- 학습 기록 테이블의 월별 파티셔닝 준비
-- (실제 데이터 양에 따라 추후 적용)

-- 6. 성능 분석을 위한 뷰 생성
-- 성능 스키마 생성 (모니터링용)
CREATE SCHEMA IF NOT EXISTS performance;

-- 쿼리 성능 모니터링 뷰
CREATE OR REPLACE VIEW performance.query_performance AS
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation,
  most_common_vals::text as most_common_vals_text,
  most_common_freqs,
  histogram_bounds::text as histogram_bounds_text
FROM pg_stats 
WHERE schemaname IN ('learning', 'progress', 'auth')
ORDER BY schemaname, tablename, attname;

-- 인덱스 사용률 모니터링 뷰
CREATE OR REPLACE VIEW performance.index_usage AS
SELECT 
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan,
  CASE 
    WHEN idx_scan = 0 THEN 0
    ELSE idx_tup_read::float / idx_scan
  END as avg_tuples_per_scan
FROM pg_stat_user_indexes 
WHERE schemaname IN ('learning', 'progress', 'auth')
ORDER BY idx_scan DESC, avg_tuples_per_scan DESC;

-- 테이블 스캔 통계 뷰
CREATE OR REPLACE VIEW performance.table_scan_stats AS
SELECT 
  schemaname,
  relname as tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  CASE 
    WHEN seq_scan + idx_scan = 0 THEN 0
    ELSE seq_scan::float / (seq_scan + idx_scan) * 100
  END as seq_scan_percentage
FROM pg_stat_user_tables 
WHERE schemaname IN ('learning', 'progress', 'auth')
ORDER BY seq_scan_percentage DESC, seq_scan DESC;

-- 7. 쿼리 최적화를 위한 헬퍼 함수들
-- 학생의 오늘 복습 카드 수 조회 (최적화된 버전)
-- 도메인 로직은 변경하지 않고 인덱스만 활용
CREATE OR REPLACE FUNCTION learning.get_today_review_count(p_student_id UUID)
RETURNS INTEGER AS $$
BEGIN
  -- 인덱스를 활용한 최적화된 쿼리
  RETURN (
    SELECT COUNT(*)
    FROM learning.review_schedules
    WHERE student_id = p_student_id 
      AND next_review_at <= NOW()
      AND next_review_at >= CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 문제집별 평균 완료 시간 계산 (캐시 활용 권장)
CREATE OR REPLACE FUNCTION progress.get_problem_set_avg_completion_time(p_problem_set_id UUID)
RETURNS INTERVAL AS $$
DECLARE
  avg_time_ms BIGINT;
BEGIN
  SELECT AVG(total_time_spent)::BIGINT
  INTO avg_time_ms
  FROM progress.statistics 
  WHERE problem_set_id = p_problem_set_id
    AND completed_problems > 0;
    
  RETURN COALESCE(avg_time_ms * INTERVAL '1 millisecond', INTERVAL '0');
END;
$$ LANGUAGE plpgsql STABLE;

-- 학생의 학습 효율성 트렌드 계산 (최근 30일)
-- 도메인 계산 로직은 변경하지 않고 인덱스로 성능만 개선
CREATE OR REPLACE FUNCTION progress.get_student_efficiency_trend(p_student_id UUID)
RETURNS TABLE(
  date_recorded DATE,
  efficiency_score NUMERIC,
  problems_completed INTEGER,
  accuracy_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT 
      sr.created_at::DATE as study_date,
      COUNT(*) as problems_completed,
      AVG(CASE WHEN sr.is_correct THEN 100.0 ELSE 0.0 END) as accuracy_rate,
      AVG(sr.response_time) as avg_response_time
    FROM learning.study_records sr
    WHERE sr.student_id = p_student_id
      AND sr.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY sr.created_at::DATE
  )
  SELECT 
    ds.study_date,
    -- 효율성 점수 계산 (정확도 70% + 응답시간 보너스 30%)
    -- 도메인에서 정의한 동일한 비즈니스 로직 사용
    (ds.accuracy_rate * 0.7 + 
     CASE 
       WHEN ds.avg_response_time <= 5 THEN 30
       WHEN ds.avg_response_time <= 15 THEN 20
       WHEN ds.avg_response_time <= 30 THEN 10
       ELSE 0
     END)::NUMERIC as efficiency_score,
    ds.problems_completed::INTEGER,
    ds.accuracy_rate::NUMERIC
  FROM daily_stats ds
  ORDER BY ds.study_date DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. 통계 수집 업데이트 (새 인덱스들)
ANALYZE learning.problems;
ANALYZE learning.review_schedules;
ANALYZE learning.study_records;
ANALYZE progress.study_streaks;
ANALYZE progress.statistics;

-- 9. 코멘트 추가
COMMENT ON SCHEMA performance IS '데이터베이스 성능 모니터링 및 분석을 위한 스키마';
COMMENT ON VIEW performance.query_performance IS '쿼리 성능 분석을 위한 통계 정보';
COMMENT ON VIEW performance.index_usage IS '인덱스 사용률 모니터링';
COMMENT ON VIEW performance.table_scan_stats IS '테이블 스캔 통계 및 최적화 포인트 분석';

-- 10. 성능 최적화 권장사항 주석
/* 
도메인 호환성 확인됨:
✅ 도메인 엔티티는 데이터베이스 인덱스를 전혀 인지하지 않음
✅ 리포지토리 인터페이스는 순수한 비즈니스 계약만 정의
✅ 인덱스는 인프라스트럭처 레이어에서만 관리됨
✅ 비즈니스 로직은 변경되지 않고 성능만 향상됨

성능 최적화 권장사항:
1. 정기적인 VACUUM ANALYZE 실행 (주 1회)
2. pg_stat_reset() 후 일정 기간 모니터링하여 사용하지 않는 인덱스 제거
3. 대용량 데이터 축적 시 파티셔닝 고려
4. 복잡한 집계 쿼리는 materialized view 활용 검토
5. 캐시 레이어 적극 활용 (Redis)
*/