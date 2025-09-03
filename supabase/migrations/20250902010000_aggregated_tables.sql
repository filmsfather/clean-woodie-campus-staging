-- 집계 테이블 및 배치 작업 시스템
-- 성능 향상을 위한 사전 계산된 집계 데이터 관리

-- 1. aggregates 스키마 생성
CREATE SCHEMA IF NOT EXISTS aggregates;

-- 2. 일별 학습 통계 집계 테이블
CREATE TABLE aggregates.daily_learning_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_recorded DATE NOT NULL,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 학습 활동 통계
  problems_attempted INTEGER NOT NULL DEFAULT 0,
  problems_completed INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_study_time_ms BIGINT NOT NULL DEFAULT 0, -- 밀리초 단위
  
  -- SRS 관련 통계
  reviews_due INTEGER NOT NULL DEFAULT 0,
  reviews_completed INTEGER NOT NULL DEFAULT 0,
  reviews_correct INTEGER NOT NULL DEFAULT 0,
  avg_ease_factor NUMERIC(3,2),
  avg_response_time_ms INTEGER,
  
  -- 스트릭 정보
  streak_count INTEGER NOT NULL DEFAULT 0,
  is_streak_day BOOLEAN NOT NULL DEFAULT false,
  
  -- 계산된 지표들
  accuracy_rate NUMERIC(5,2), -- 정답률 (0-100%)
  efficiency_score NUMERIC(5,2), -- 효율성 점수 (0-100)
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 제약 조건
  CONSTRAINT valid_accuracy_rate CHECK (accuracy_rate >= 0 AND accuracy_rate <= 100),
  CONSTRAINT valid_efficiency_score CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
  CONSTRAINT valid_problems_completed CHECK (problems_completed <= problems_attempted),
  CONSTRAINT valid_correct_answers CHECK (correct_answers <= problems_completed),
  
  -- 유니크 제약: 학생당 하루에 하나의 기록만
  UNIQUE(student_id, date_recorded)
);

-- 3. 주별 학습 통계 집계 테이블
CREATE TABLE aggregates.weekly_learning_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date DATE NOT NULL,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 주간 집계 통계
  total_study_days INTEGER NOT NULL DEFAULT 0,
  avg_daily_problems NUMERIC(8,2),
  avg_daily_study_time_ms BIGINT,
  total_problems_attempted INTEGER NOT NULL DEFAULT 0,
  total_problems_completed INTEGER NOT NULL DEFAULT 0,
  total_correct_answers INTEGER NOT NULL DEFAULT 0,
  total_reviews_completed INTEGER NOT NULL DEFAULT 0,
  
  -- 주간 성과 지표
  weekly_accuracy_rate NUMERIC(5,2),
  weekly_efficiency_score NUMERIC(5,2),
  consistency_score NUMERIC(5,2), -- 주간 일관성 점수
  
  -- 스트릭 정보
  max_streak_in_week INTEGER NOT NULL DEFAULT 0,
  streak_at_week_end INTEGER NOT NULL DEFAULT 0,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 유니크 제약: 학생당 주당 하나의 기록만
  UNIQUE(student_id, week_start_date)
);

-- 4. 문제집별 집계 통계 테이블
CREATE TABLE aggregates.problem_set_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_set_id UUID NOT NULL REFERENCES problem_sets(id) ON DELETE CASCADE,
  
  -- 기본 통계
  total_students INTEGER NOT NULL DEFAULT 0,
  active_students_last_7days INTEGER NOT NULL DEFAULT 0,
  active_students_last_30days INTEGER NOT NULL DEFAULT 0,
  
  -- 완료 통계
  students_completed INTEGER NOT NULL DEFAULT 0,
  avg_completion_rate NUMERIC(5,2),
  avg_completion_time_ms BIGINT,
  
  -- 성과 통계
  avg_accuracy_rate NUMERIC(5,2),
  median_accuracy_rate NUMERIC(5,2),
  avg_attempts_per_problem NUMERIC(8,2),
  
  -- 난이도 분석
  estimated_difficulty_score NUMERIC(5,2), -- 실제 학습 데이터 기반 난이도
  avg_student_efficiency NUMERIC(5,2),
  
  -- 시간 정보
  last_activity_at TIMESTAMPTZ,
  stats_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 전체 시스템 집계 통계 테이블 (대시보드용)
CREATE TABLE aggregates.system_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_recorded DATE NOT NULL,
  
  -- 사용자 통계
  total_active_students INTEGER NOT NULL DEFAULT 0,
  new_students_today INTEGER NOT NULL DEFAULT 0,
  students_with_streak INTEGER NOT NULL DEFAULT 0,
  
  -- 학습 활동 통계
  total_problems_attempted INTEGER NOT NULL DEFAULT 0,
  total_reviews_completed INTEGER NOT NULL DEFAULT 0,
  avg_system_accuracy NUMERIC(5,2),
  avg_system_efficiency NUMERIC(5,2),
  
  -- 스트릭 통계
  max_streak_today INTEGER NOT NULL DEFAULT 0,
  avg_active_streak NUMERIC(8,2),
  students_at_risk INTEGER NOT NULL DEFAULT 0, -- 스트릭이 끊어질 위험에 있는 학생 수
  
  -- 시스템 성능
  avg_response_time_ms INTEGER,
  cache_hit_rate NUMERIC(5,2),
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 유니크 제약: 하루에 하나의 시스템 통계만
  UNIQUE(date_recorded)
);

-- 6. 인덱스 생성
-- daily_learning_stats 인덱스
CREATE INDEX idx_daily_learning_stats_student_date ON aggregates.daily_learning_stats(student_id, date_recorded DESC);
CREATE INDEX idx_daily_learning_stats_date ON aggregates.daily_learning_stats(date_recorded DESC);
CREATE INDEX idx_daily_learning_stats_efficiency ON aggregates.daily_learning_stats(efficiency_score DESC);
CREATE INDEX idx_daily_learning_stats_streak ON aggregates.daily_learning_stats(is_streak_day, streak_count DESC);

-- weekly_learning_stats 인덱스
CREATE INDEX idx_weekly_learning_stats_student_week ON aggregates.weekly_learning_stats(student_id, week_start_date DESC);
CREATE INDEX idx_weekly_learning_stats_week ON aggregates.weekly_learning_stats(week_start_date DESC);
CREATE INDEX idx_weekly_learning_stats_consistency ON aggregates.weekly_learning_stats(consistency_score DESC);

-- problem_set_stats 인덱스
CREATE INDEX idx_problem_set_stats_set_id ON aggregates.problem_set_stats(problem_set_id);
CREATE INDEX idx_problem_set_stats_completion ON aggregates.problem_set_stats(avg_completion_rate DESC);
CREATE INDEX idx_problem_set_stats_difficulty ON aggregates.problem_set_stats(estimated_difficulty_score DESC);
CREATE INDEX idx_problem_set_stats_updated ON aggregates.problem_set_stats(stats_updated_at DESC);

-- system_stats 인덱스
CREATE INDEX idx_system_stats_date ON aggregates.system_stats(date_recorded DESC);

-- 7. 집계 데이터 생성 함수들
-- 일별 학습 통계 집계 함수
CREATE OR REPLACE FUNCTION aggregates.aggregate_daily_learning_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER := 0;
  student_record RECORD;
BEGIN
  -- 해당 날짜의 모든 활성 학생들에 대해 집계 실행
  FOR student_record IN 
    SELECT DISTINCT sr.student_id
    FROM learning.study_records sr
    WHERE sr.created_at::DATE = target_date
  LOOP
    -- 기존 데이터 삭제 후 재생성 (UPSERT)
    DELETE FROM aggregates.daily_learning_stats 
    WHERE student_id = student_record.student_id AND date_recorded = target_date;
    
    -- 새로운 집계 데이터 생성
    INSERT INTO aggregates.daily_learning_stats (
      date_recorded,
      student_id,
      problems_attempted,
      problems_completed,
      correct_answers,
      total_study_time_ms,
      reviews_due,
      reviews_completed,
      reviews_correct,
      avg_ease_factor,
      avg_response_time_ms,
      streak_count,
      is_streak_day,
      accuracy_rate,
      efficiency_score
    )
    SELECT 
      target_date,
      student_record.student_id,
      COUNT(*) as problems_attempted,
      COUNT(*) FILTER (WHERE sr.is_correct) as problems_completed,
      COUNT(*) FILTER (WHERE sr.is_correct) as correct_answers,
      COALESCE(SUM(sr.response_time * 1000), 0) as total_study_time_ms, -- 초를 밀리초로 변환
      
      -- SRS 통계 (별도 조회)
      COALESCE((
        SELECT COUNT(*) 
        FROM learning.review_schedules rs 
        WHERE rs.student_id = student_record.student_id 
          AND rs.next_review_at::DATE <= target_date
      ), 0) as reviews_due,
      
      COUNT(*) as reviews_completed, -- study_records 기준
      COUNT(*) FILTER (WHERE sr.is_correct) as reviews_correct,
      
      COALESCE((
        SELECT AVG(rs.ease_factor) 
        FROM learning.review_schedules rs 
        WHERE rs.student_id = student_record.student_id
      ), 2.5) as avg_ease_factor,
      
      AVG(sr.response_time * 1000)::INTEGER as avg_response_time_ms,
      
      -- 스트릭 정보 (별도 조회)
      COALESCE((
        SELECT ss.current_streak 
        FROM progress.study_streaks ss 
        WHERE ss.student_id = student_record.student_id
      ), 0) as streak_count,
      
      true as is_streak_day, -- 학습 기록이 있으면 스트릭 데이
      
      -- 계산된 지표들
      (COUNT(*) FILTER (WHERE sr.is_correct)::FLOAT / NULLIF(COUNT(*), 0) * 100)::NUMERIC(5,2) as accuracy_rate,
      
      -- 효율성 점수 계산 (정확도 70% + 응답시간 보너스 30%)
      LEAST(100, (
        (COUNT(*) FILTER (WHERE sr.is_correct)::FLOAT / NULLIF(COUNT(*), 0) * 70) +
        CASE 
          WHEN AVG(sr.response_time) <= 5 THEN 30
          WHEN AVG(sr.response_time) <= 15 THEN 20
          WHEN AVG(sr.response_time) <= 30 THEN 10
          ELSE 0
        END
      ))::NUMERIC(5,2) as efficiency_score
      
    FROM learning.study_records sr
    WHERE sr.student_id = student_record.student_id 
      AND sr.created_at::DATE = target_date
    GROUP BY student_record.student_id;
    
    affected_rows := affected_rows + 1;
  END LOOP;
  
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- 주별 학습 통계 집계 함수
CREATE OR REPLACE FUNCTION aggregates.aggregate_weekly_learning_stats(target_week_start DATE DEFAULT date_trunc('week', CURRENT_DATE)::DATE)
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER := 0;
  week_end_date DATE := target_week_start + INTERVAL '6 days';
  student_record RECORD;
BEGIN
  -- 해당 주에 활동한 모든 학생들 조회
  FOR student_record IN 
    SELECT DISTINCT dls.student_id
    FROM aggregates.daily_learning_stats dls
    WHERE dls.date_recorded BETWEEN target_week_start AND week_end_date
  LOOP
    -- 기존 데이터 삭제 후 재생성
    DELETE FROM aggregates.weekly_learning_stats 
    WHERE student_id = student_record.student_id AND week_start_date = target_week_start;
    
    -- 주간 집계 데이터 생성
    INSERT INTO aggregates.weekly_learning_stats (
      week_start_date,
      student_id,
      total_study_days,
      avg_daily_problems,
      avg_daily_study_time_ms,
      total_problems_attempted,
      total_problems_completed,
      total_correct_answers,
      total_reviews_completed,
      weekly_accuracy_rate,
      weekly_efficiency_score,
      consistency_score,
      max_streak_in_week,
      streak_at_week_end
    )
    SELECT 
      target_week_start,
      student_record.student_id,
      COUNT(*) as total_study_days,
      AVG(dls.problems_attempted) as avg_daily_problems,
      AVG(dls.total_study_time_ms) as avg_daily_study_time_ms,
      SUM(dls.problems_attempted) as total_problems_attempted,
      SUM(dls.problems_completed) as total_problems_completed,
      SUM(dls.correct_answers) as total_correct_answers,
      SUM(dls.reviews_completed) as total_reviews_completed,
      AVG(dls.accuracy_rate) as weekly_accuracy_rate,
      AVG(dls.efficiency_score) as weekly_efficiency_score,
      
      -- 일관성 점수: 주 7일 중 학습한 비율 * 100
      (COUNT(*)::FLOAT / 7 * 100)::NUMERIC(5,2) as consistency_score,
      
      MAX(dls.streak_count) as max_streak_in_week,
      MAX(dls.streak_count) FILTER (WHERE dls.date_recorded = week_end_date) as streak_at_week_end
      
    FROM aggregates.daily_learning_stats dls
    WHERE dls.student_id = student_record.student_id 
      AND dls.date_recorded BETWEEN target_week_start AND week_end_date
    GROUP BY student_record.student_id;
    
    affected_rows := affected_rows + 1;
  END LOOP;
  
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- 문제집 통계 집계 함수
CREATE OR REPLACE FUNCTION aggregates.aggregate_problem_set_stats()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER := 0;
  problem_set_record RECORD;
BEGIN
  -- 모든 문제집에 대해 통계 계산
  FOR problem_set_record IN 
    SELECT DISTINCT ps.id as problem_set_id
    FROM problem_sets ps
    WHERE ps.is_active = true
  LOOP
    -- UPSERT 방식으로 업데이트
    INSERT INTO aggregates.problem_set_stats (
      problem_set_id,
      total_students,
      active_students_last_7days,
      active_students_last_30days,
      students_completed,
      avg_completion_rate,
      avg_completion_time_ms,
      avg_accuracy_rate,
      median_accuracy_rate,
      avg_attempts_per_problem,
      estimated_difficulty_score,
      avg_student_efficiency,
      last_activity_at,
      stats_updated_at
    )
    SELECT 
      problem_set_record.problem_set_id,
      COUNT(DISTINCT s.student_id) as total_students,
      COUNT(DISTINCT s.student_id) FILTER (
        WHERE s.updated_at >= CURRENT_DATE - INTERVAL '7 days'
      ) as active_students_last_7days,
      COUNT(DISTINCT s.student_id) FILTER (
        WHERE s.updated_at >= CURRENT_DATE - INTERVAL '30 days'
      ) as active_students_last_30days,
      COUNT(DISTINCT s.student_id) FILTER (
        WHERE s.completed_problems = s.total_problems AND s.total_problems > 0
      ) as students_completed,
      AVG(
        CASE 
          WHEN s.total_problems > 0 THEN s.completed_problems::FLOAT / s.total_problems * 100
          ELSE 0 
        END
      )::NUMERIC(5,2) as avg_completion_rate,
      AVG(s.total_time_spent) as avg_completion_time_ms,
      AVG(
        CASE 
          WHEN s.completed_problems > 0 THEN s.correct_answers::FLOAT / s.completed_problems * 100
          ELSE 0 
        END
      )::NUMERIC(5,2) as avg_accuracy_rate,
      -- 중간값은 간단한 근사치 사용
      AVG(
        CASE 
          WHEN s.completed_problems > 0 THEN s.correct_answers::FLOAT / s.completed_problems * 100
          ELSE 0 
        END
      )::NUMERIC(5,2) as median_accuracy_rate,
      AVG(
        CASE 
          WHEN s.total_problems > 0 THEN s.completed_problems::FLOAT / s.total_problems
          ELSE 0 
        END
      )::NUMERIC(8,2) as avg_attempts_per_problem,
      -- 추정 난이도 점수 (낮은 정답률 = 높은 난이도)
      (100 - COALESCE(AVG(
        CASE 
          WHEN s.completed_problems > 0 THEN s.correct_answers::FLOAT / s.completed_problems * 100
          ELSE 50 
        END
      ), 50))::NUMERIC(5,2) as estimated_difficulty_score,
      COALESCE(AVG(
        CASE 
          WHEN s.completed_problems > 0 AND s.total_time_spent > 0 
          THEN (s.correct_answers::FLOAT / s.completed_problems * 70) +
               CASE 
                 WHEN s.average_response_time <= 5000 THEN 30
                 WHEN s.average_response_time <= 15000 THEN 20
                 WHEN s.average_response_time <= 30000 THEN 10
                 ELSE 0
               END
          ELSE 0 
        END
      ), 0)::NUMERIC(5,2) as avg_student_efficiency,
      MAX(s.updated_at) as last_activity_at,
      NOW() as stats_updated_at
      
    FROM progress.statistics s
    WHERE s.problem_set_id = problem_set_record.problem_set_id
    GROUP BY problem_set_record.problem_set_id
    
    ON CONFLICT (problem_set_id) DO UPDATE SET
      total_students = EXCLUDED.total_students,
      active_students_last_7days = EXCLUDED.active_students_last_7days,
      active_students_last_30days = EXCLUDED.active_students_last_30days,
      students_completed = EXCLUDED.students_completed,
      avg_completion_rate = EXCLUDED.avg_completion_rate,
      avg_completion_time_ms = EXCLUDED.avg_completion_time_ms,
      avg_accuracy_rate = EXCLUDED.avg_accuracy_rate,
      median_accuracy_rate = EXCLUDED.median_accuracy_rate,
      avg_attempts_per_problem = EXCLUDED.avg_attempts_per_problem,
      estimated_difficulty_score = EXCLUDED.estimated_difficulty_score,
      avg_student_efficiency = EXCLUDED.avg_student_efficiency,
      last_activity_at = EXCLUDED.last_activity_at,
      stats_updated_at = EXCLUDED.stats_updated_at,
      updated_at = NOW();
    
    affected_rows := affected_rows + 1;
  END LOOP;
  
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- 시스템 통계 집계 함수
CREATE OR REPLACE FUNCTION aggregates.aggregate_system_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO aggregates.system_stats (
    date_recorded,
    total_active_students,
    new_students_today,
    students_with_streak,
    total_problems_attempted,
    total_reviews_completed,
    avg_system_accuracy,
    avg_system_efficiency,
    max_streak_today,
    avg_active_streak,
    students_at_risk,
    avg_response_time_ms
  )
  SELECT 
    target_date,
    COUNT(DISTINCT dls.student_id) as total_active_students,
    COUNT(DISTINCT p.id) FILTER (WHERE p.created_at::DATE = target_date) as new_students_today,
    COUNT(DISTINCT ss.student_id) FILTER (WHERE ss.current_streak > 0) as students_with_streak,
    SUM(dls.problems_attempted) as total_problems_attempted,
    SUM(dls.reviews_completed) as total_reviews_completed,
    AVG(dls.accuracy_rate) as avg_system_accuracy,
    AVG(dls.efficiency_score) as avg_system_efficiency,
    MAX(dls.streak_count) as max_streak_today,
    AVG(ss.current_streak) FILTER (WHERE ss.current_streak > 0) as avg_active_streak,
    COUNT(DISTINCT ss.student_id) FILTER (
      WHERE ss.current_streak > 0 AND ss.last_study_date = target_date - INTERVAL '1 day'
    ) as students_at_risk,
    AVG(dls.avg_response_time_ms)::INTEGER as avg_response_time_ms
    
  FROM aggregates.daily_learning_stats dls
  LEFT JOIN profiles p ON dls.student_id = p.id
  LEFT JOIN progress.study_streaks ss ON dls.student_id = ss.student_id
  WHERE dls.date_recorded = target_date
  
  ON CONFLICT (date_recorded) DO UPDATE SET
    total_active_students = EXCLUDED.total_active_students,
    new_students_today = EXCLUDED.new_students_today,
    students_with_streak = EXCLUDED.students_with_streak,
    total_problems_attempted = EXCLUDED.total_problems_attempted,
    total_reviews_completed = EXCLUDED.total_reviews_completed,
    avg_system_accuracy = EXCLUDED.avg_system_accuracy,
    avg_system_efficiency = EXCLUDED.avg_system_efficiency,
    max_streak_today = EXCLUDED.max_streak_today,
    avg_active_streak = EXCLUDED.avg_active_streak,
    students_at_risk = EXCLUDED.students_at_risk,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    created_at = NOW();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 8. 자동 업데이트 트리거 설정
CREATE TRIGGER update_daily_learning_stats_updated_at 
  BEFORE UPDATE ON aggregates.daily_learning_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_learning_stats_updated_at 
  BEFORE UPDATE ON aggregates.weekly_learning_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problem_set_stats_updated_at 
  BEFORE UPDATE ON aggregates.problem_set_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 코멘트 추가
COMMENT ON SCHEMA aggregates IS '집계 데이터 및 배치 작업을 위한 스키마';
COMMENT ON TABLE aggregates.daily_learning_stats IS '일별 학습 통계 집계 테이블';
COMMENT ON TABLE aggregates.weekly_learning_stats IS '주별 학습 통계 집계 테이블';
COMMENT ON TABLE aggregates.problem_set_stats IS '문제집별 통계 집계 테이블';
COMMENT ON TABLE aggregates.system_stats IS '전체 시스템 통계 집계 테이블';

-- 10. 통계 수집
ANALYZE aggregates.daily_learning_stats;
ANALYZE aggregates.weekly_learning_stats;
ANALYZE aggregates.problem_set_stats;
ANALYZE aggregates.system_stats;