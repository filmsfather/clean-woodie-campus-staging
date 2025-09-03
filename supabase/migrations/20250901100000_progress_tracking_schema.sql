-- 진도 추적 시스템 스키마
-- 학습 스트릭과 통계를 관리하는 테이블들

-- 1. progress 스키마 생성
CREATE SCHEMA IF NOT EXISTS progress;

-- 2. 학습 스트릭 테이블
CREATE TABLE IF NOT EXISTS progress.study_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_study_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  
  -- 비즈니스 제약조건
  CONSTRAINT streak_consistency CHECK (longest_streak >= current_streak),
  
  -- 학생당 하나의 스트릭만 허용
  UNIQUE(student_id)
);

-- 3. 학습 통계 테이블
CREATE TABLE IF NOT EXISTS progress.statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  problem_set_id UUID NOT NULL REFERENCES problem_sets(id) ON DELETE CASCADE,
  total_problems INTEGER NOT NULL DEFAULT 0 CHECK (total_problems >= 0),
  completed_problems INTEGER NOT NULL DEFAULT 0 CHECK (completed_problems >= 0),
  correct_answers INTEGER NOT NULL DEFAULT 0 CHECK (correct_answers >= 0),
  total_time_spent BIGINT NOT NULL DEFAULT 0 CHECK (total_time_spent >= 0), -- 밀리초 단위
  average_response_time BIGINT NOT NULL DEFAULT 0 CHECK (average_response_time >= 0), -- 밀리초 단위
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  
  -- 비즈니스 제약조건
  CONSTRAINT completion_bounds CHECK (completed_problems <= total_problems),
  CONSTRAINT accuracy_bounds CHECK (correct_answers <= completed_problems),
  
  -- 학생-문제집 조합은 유일해야 함
  UNIQUE(student_id, problem_set_id)
);

-- 4. 인덱스 생성
-- study_streaks 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_study_streaks_student_id ON progress.study_streaks(student_id);
CREATE INDEX IF NOT EXISTS idx_study_streaks_last_study_date ON progress.study_streaks(last_study_date);
CREATE INDEX IF NOT EXISTS idx_study_streaks_current_streak ON progress.study_streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_study_streaks_longest_streak ON progress.study_streaks(longest_streak DESC);

-- statistics 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_statistics_student_id ON progress.statistics(student_id);
CREATE INDEX IF NOT EXISTS idx_statistics_problem_set_id ON progress.statistics(problem_set_id);
CREATE INDEX IF NOT EXISTS idx_statistics_completed_problems ON progress.statistics(completed_problems DESC);
CREATE INDEX IF NOT EXISTS idx_statistics_correct_answers ON progress.statistics(correct_answers DESC);
CREATE INDEX IF NOT EXISTS idx_statistics_created_at ON progress.statistics(created_at);

-- 복합 인덱스 (자주 사용되는 쿼리 패턴)
CREATE INDEX IF NOT EXISTS idx_study_streaks_student_streak ON progress.study_streaks(student_id, current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_statistics_student_set ON progress.statistics(student_id, problem_set_id);

-- 5. 업데이트 시 updated_at 자동 갱신 트리거 적용 (기존 함수 재사용)
CREATE TRIGGER update_study_streaks_updated_at 
  BEFORE UPDATE ON progress.study_streaks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_statistics_updated_at 
  BEFORE UPDATE ON progress.statistics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 유용한 뷰 생성
-- 활성 스트릭 뷰 (마지막 학습일이 최근 2일 이내)
CREATE OR REPLACE VIEW progress.active_streaks AS
SELECT 
  ss.*,
  p.full_name as student_name,
  p.email as student_email,
  p.school_id,
  CASE 
    WHEN ss.last_study_date = CURRENT_DATE THEN 'today'
    WHEN ss.last_study_date = CURRENT_DATE - INTERVAL '1 day' THEN 'at_risk'
    ELSE 'lost'
  END as streak_status
FROM progress.study_streaks ss
JOIN profiles p ON ss.student_id = p.id
WHERE ss.current_streak > 0
  AND ss.last_study_date >= CURRENT_DATE - INTERVAL '2 days';

-- 문제집별 통계 요약 뷰
CREATE OR REPLACE VIEW progress.problem_set_summary AS
SELECT 
  s.problem_set_id,
  ps.title as problem_set_title,
  ps.created_by as teacher_id,
  COUNT(s.id) as total_students,
  AVG(
    CASE 
      WHEN s.total_problems > 0 THEN s.completed_problems::float / s.total_problems::float
      ELSE 0 
    END
  ) as avg_completion_rate,
  AVG(
    CASE 
      WHEN s.completed_problems > 0 THEN s.correct_answers::float / s.completed_problems::float
      ELSE 0 
    END
  ) as avg_accuracy_rate,
  AVG(s.average_response_time) as avg_response_time_ms,
  COUNT(CASE WHEN s.completed_problems = s.total_problems THEN 1 END) as completed_count
FROM progress.statistics s
JOIN problem_sets ps ON s.problem_set_id = ps.id
GROUP BY s.problem_set_id, ps.title, ps.created_by;

-- 학생 진도 요약 뷰
CREATE OR REPLACE VIEW progress.student_progress_summary AS
SELECT 
  s.student_id,
  p.full_name as student_name,
  p.email as student_email,
  p.school_id,
  ss.current_streak,
  ss.longest_streak,
  ss.last_study_date,
  COUNT(s.id) as total_problem_sets,
  COUNT(CASE WHEN s.completed_problems = s.total_problems THEN 1 END) as completed_problem_sets,
  AVG(
    CASE 
      WHEN s.total_problems > 0 THEN s.completed_problems::float / s.total_problems::float
      ELSE 0 
    END
  ) as avg_completion_rate,
  AVG(
    CASE 
      WHEN s.completed_problems > 0 THEN s.correct_answers::float / s.completed_problems::float
      ELSE 0 
    END
  ) as avg_accuracy_rate,
  SUM(s.total_time_spent) as total_study_time_ms
FROM progress.statistics s
JOIN profiles p ON s.student_id = p.id
LEFT JOIN progress.study_streaks ss ON s.student_id = ss.student_id
GROUP BY s.student_id, p.full_name, p.email, p.school_id, ss.current_streak, ss.longest_streak, ss.last_study_date;

-- 클래스별 진도 요약 뷰 (클래스 시스템이 있는 경우)
CREATE OR REPLACE VIEW progress.class_progress_summary AS
SELECT 
  ce.class_id,
  c.name as class_name,
  c.teacher_id,
  COUNT(DISTINCT ss.student_id) as total_students,
  COUNT(DISTINCT CASE WHEN ss.current_streak > 0 THEN ss.student_id END) as students_with_streak,
  AVG(ss.current_streak) as avg_current_streak,
  MAX(ss.current_streak) as max_current_streak,
  AVG(ss.longest_streak) as avg_longest_streak,
  MAX(ss.longest_streak) as max_longest_streak,
  COUNT(DISTINCT CASE WHEN ss.last_study_date = CURRENT_DATE THEN ss.student_id END) as studied_today,
  COUNT(DISTINCT CASE WHEN ss.last_study_date = CURRENT_DATE - INTERVAL '1 day' THEN ss.student_id END) as at_risk_students
FROM class_enrollments ce
JOIN classes c ON ce.class_id = c.id
LEFT JOIN progress.study_streaks ss ON ce.student_id = ss.student_id
GROUP BY ce.class_id, c.name, c.teacher_id;

-- 7. 통계 계산 헬퍼 함수들
-- 학생의 전체 학습 효율성 점수 계산
CREATE OR REPLACE FUNCTION progress.calculate_student_efficiency_score(p_student_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  efficiency_score NUMERIC := 0;
  avg_accuracy NUMERIC;
  avg_response_time NUMERIC;
  streak_bonus NUMERIC := 0;
BEGIN
  -- 평균 정답률과 응답 시간 계산
  SELECT 
    AVG(CASE WHEN completed_problems > 0 THEN correct_answers::float / completed_problems::float ELSE 0 END),
    AVG(average_response_time)
  INTO avg_accuracy, avg_response_time
  FROM progress.statistics 
  WHERE student_id = p_student_id;
  
  -- 기본 점수 (정답률 기반)
  efficiency_score := COALESCE(avg_accuracy * 70, 0);
  
  -- 응답 시간 보너스/페널티
  IF avg_response_time <= 5000 THEN -- 5초 이하
    efficiency_score := efficiency_score + 30;
  ELSIF avg_response_time <= 15000 THEN -- 15초 이하
    efficiency_score := efficiency_score + 20;
  ELSIF avg_response_time <= 30000 THEN -- 30초 이하
    efficiency_score := efficiency_score + 10;
  END IF;
  
  -- 스트릭 보너스
  SELECT 
    CASE 
      WHEN current_streak >= 30 THEN 10
      WHEN current_streak >= 14 THEN 7
      WHEN current_streak >= 7 THEN 5
      WHEN current_streak >= 3 THEN 3
      ELSE 0
    END
  INTO streak_bonus
  FROM progress.study_streaks 
  WHERE student_id = p_student_id;
  
  efficiency_score := efficiency_score + COALESCE(streak_bonus, 0);
  
  -- 0-100 범위로 제한
  RETURN GREATEST(0, LEAST(100, efficiency_score));
END;
$$ LANGUAGE plpgsql;

-- 8. 코멘트 추가
COMMENT ON SCHEMA progress IS '학습 진도 추적 시스템 스키마';

COMMENT ON TABLE progress.study_streaks IS '학생별 학습 스트릭을 추적하는 테이블';
COMMENT ON COLUMN progress.study_streaks.current_streak IS '현재 연속 학습일수';
COMMENT ON COLUMN progress.study_streaks.longest_streak IS '최장 연속 학습일수 (개인 기록)';
COMMENT ON COLUMN progress.study_streaks.last_study_date IS '마지막 학습일 (날짜만, 시간 제외)';

COMMENT ON TABLE progress.statistics IS '학생별 문제집별 학습 통계를 저장하는 테이블';
COMMENT ON COLUMN progress.statistics.total_problems IS '문제집 내 총 문제 수';
COMMENT ON COLUMN progress.statistics.completed_problems IS '완료한 문제 수';
COMMENT ON COLUMN progress.statistics.correct_answers IS '정답 수';
COMMENT ON COLUMN progress.statistics.total_time_spent IS '총 소요 시간(밀리초)';
COMMENT ON COLUMN progress.statistics.average_response_time IS '평균 응답 시간(밀리초)';

COMMENT ON VIEW progress.active_streaks IS '활성 상태의 학습 스트릭 조회용 뷰 (최근 2일 이내 학습한 학생들)';
COMMENT ON VIEW progress.problem_set_summary IS '문제집별 학습 통계 요약 뷰';
COMMENT ON VIEW progress.student_progress_summary IS '학생별 전체 학습 진도 요약 뷰';
COMMENT ON VIEW progress.class_progress_summary IS '클래스별 학습 진도 및 스트릭 현황 요약 뷰';

COMMENT ON FUNCTION progress.calculate_student_efficiency_score(UUID) IS '학생의 전체 학습 효율성 점수 계산 (0-100점)';

-- 9. 통계 수집 (성능 최적화)
ANALYZE progress.study_streaks;
ANALYZE progress.statistics;