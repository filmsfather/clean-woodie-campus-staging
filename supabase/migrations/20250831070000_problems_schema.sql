-- 문제 관리 시스템을 위한 데이터베이스 스키마
-- JSONB 기반 유연한 콘텐츠 구조 설계

-- 1. learning 스키마 생성 (아직 없는 경우)
CREATE SCHEMA IF NOT EXISTS learning;

-- 2. 문제 테이블 생성
CREATE TABLE learning.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- JSONB 기반 유연한 콘텐츠 구조
  content JSONB NOT NULL,
  correct_answer JSONB NOT NULL,
  
  -- 문제 메타데이터
  type VARCHAR(50) NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 제약 조건
  CONSTRAINT valid_problem_type CHECK (
    type IN (
      'multiple_choice',
      'short_answer', 
      'long_answer',
      'true_false',
      'matching',
      'fill_blank',
      'ordering'
    )
  ),
  
  -- JSONB 콘텐츠 기본 구조 검증
  CONSTRAINT valid_content_structure CHECK (
    content ? 'type' AND 
    content ? 'title' AND
    content->>'type' = type
  ),
  
  -- JSONB 답안 기본 구조 검증  
  CONSTRAINT valid_answer_structure CHECK (
    correct_answer ? 'type' AND
    correct_answer ? 'points' AND
    correct_answer->>'type' = type AND
    (correct_answer->>'points')::numeric >= 0
  )
);

-- 3. 인덱스 최적화
-- 기본 검색 인덱스
CREATE INDEX idx_problems_teacher_id ON learning.problems(teacher_id);
CREATE INDEX idx_problems_type ON learning.problems(type);
CREATE INDEX idx_problems_difficulty ON learning.problems(difficulty);
CREATE INDEX idx_problems_is_active ON learning.problems(is_active);
CREATE INDEX idx_problems_created_at ON learning.problems(created_at DESC);
CREATE INDEX idx_problems_updated_at ON learning.problems(updated_at DESC);

-- 태그 기반 검색을 위한 GIN 인덱스
CREATE INDEX idx_problems_tags ON learning.problems USING gin(tags);

-- JSONB 콘텐츠 검색을 위한 GIN 인덱스
CREATE INDEX idx_problems_content ON learning.problems USING gin(content);
CREATE INDEX idx_problems_answer ON learning.problems USING gin(correct_answer);

-- 복합 인덱스 (자주 사용되는 쿼리 패턴)
CREATE INDEX idx_problems_teacher_active ON learning.problems(teacher_id, is_active);
CREATE INDEX idx_problems_teacher_type ON learning.problems(teacher_id, type);
CREATE INDEX idx_problems_teacher_difficulty ON learning.problems(teacher_id, difficulty);

-- 전문 검색을 위한 tsvector 컬럼 및 인덱스
ALTER TABLE learning.problems ADD COLUMN search_vector tsvector;

CREATE INDEX idx_problems_search ON learning.problems USING gin(search_vector);

-- 4. 검색 벡터 업데이트 함수
CREATE OR REPLACE FUNCTION learning.update_problem_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.content->>'title', '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content->>'description', '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content->>'instructions', '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 자동 업데이트 트리거
CREATE TRIGGER trigger_update_problem_search_vector
  BEFORE INSERT OR UPDATE OF content, tags
  ON learning.problems
  FOR EACH ROW
  EXECUTE FUNCTION learning.update_problem_search_vector();

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER trigger_update_problems_updated_at
  BEFORE UPDATE ON learning.problems
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 6. JSONB 스키마 검증 함수들 (각 문제 유형별)

-- 객관식 문제 검증
CREATE OR REPLACE FUNCTION learning.validate_multiple_choice_content(content JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    content ? 'choices' AND
    jsonb_typeof(content->'choices') = 'array' AND
    jsonb_array_length(content->'choices') >= 2 AND
    jsonb_array_length(content->'choices') <= 10
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 객관식 답안 검증  
CREATE OR REPLACE FUNCTION learning.validate_multiple_choice_answer(answer JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    answer ? 'correctChoices' AND
    jsonb_typeof(answer->'correctChoices') = 'array' AND
    jsonb_array_length(answer->'correctChoices') >= 1
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 단답형 답안 검증
CREATE OR REPLACE FUNCTION learning.validate_short_answer(answer JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    answer ? 'acceptedAnswers' AND
    jsonb_typeof(answer->'acceptedAnswers') = 'array' AND
    jsonb_array_length(answer->'acceptedAnswers') >= 1
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 참/거짓 답안 검증
CREATE OR REPLACE FUNCTION learning.validate_true_false_answer(answer JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    answer ? 'isTrue' AND
    jsonb_typeof(answer->'isTrue') = 'boolean'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 매칭 문제 검증
CREATE OR REPLACE FUNCTION learning.validate_matching_content(content JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    content ? 'leftItems' AND content ? 'rightItems' AND
    jsonb_typeof(content->'leftItems') = 'array' AND
    jsonb_typeof(content->'rightItems') = 'array' AND
    jsonb_array_length(content->'leftItems') >= 2 AND
    jsonb_array_length(content->'rightItems') >= 2
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 매칭 답안 검증
CREATE OR REPLACE FUNCTION learning.validate_matching_answer(answer JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    answer ? 'correctMatches' AND
    jsonb_typeof(answer->'correctMatches') = 'array' AND
    jsonb_array_length(answer->'correctMatches') >= 1
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 빈칸 채우기 검증
CREATE OR REPLACE FUNCTION learning.validate_fill_blank_content(content JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    content ? 'text' AND content ? 'blanks' AND
    jsonb_typeof(content->'blanks') = 'array' AND
    jsonb_array_length(content->'blanks') >= 1 AND
    -- 텍스트에 __blank__ 패턴이 있는지 확인
    content->>'text' LIKE '%__blank__%'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 순서 배열 검증
CREATE OR REPLACE FUNCTION learning.validate_ordering_content(content JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    content ? 'items' AND
    jsonb_typeof(content->'items') = 'array' AND
    jsonb_array_length(content->'items') >= 2
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. 문제 유형별 검증 제약 조건 추가
ALTER TABLE learning.problems ADD CONSTRAINT valid_multiple_choice_content
  CHECK (
    type != 'multiple_choice' OR 
    learning.validate_multiple_choice_content(content)
  );

ALTER TABLE learning.problems ADD CONSTRAINT valid_multiple_choice_answer  
  CHECK (
    type != 'multiple_choice' OR
    learning.validate_multiple_choice_answer(correct_answer)
  );

ALTER TABLE learning.problems ADD CONSTRAINT valid_short_answer_answer
  CHECK (
    type != 'short_answer' OR
    learning.validate_short_answer(correct_answer)
  );

ALTER TABLE learning.problems ADD CONSTRAINT valid_true_false_answer
  CHECK (
    type != 'true_false' OR
    learning.validate_true_false_answer(correct_answer)  
  );

ALTER TABLE learning.problems ADD CONSTRAINT valid_matching_content
  CHECK (
    type != 'matching' OR
    learning.validate_matching_content(content)
  );

ALTER TABLE learning.problems ADD CONSTRAINT valid_matching_answer
  CHECK (
    type != 'matching' OR
    learning.validate_matching_answer(correct_answer)
  );

ALTER TABLE learning.problems ADD CONSTRAINT valid_fill_blank_content
  CHECK (
    type != 'fill_blank' OR
    learning.validate_fill_blank_content(content)
  );

ALTER TABLE learning.problems ADD CONSTRAINT valid_ordering_content
  CHECK (
    type != 'ordering' OR
    learning.validate_ordering_content(content)
  );

-- 8. 통계 및 분석을 위한 뷰
CREATE VIEW learning.problem_stats AS
SELECT 
  teacher_id,
  type,
  difficulty,
  COUNT(*) as problem_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count,
  AVG(array_length(COALESCE(tags, '{}'), 1)) as avg_tags,
  MIN(created_at) as first_created,
  MAX(updated_at) as last_updated
FROM learning.problems
GROUP BY teacher_id, type, difficulty;

-- 9. 샘플 데이터 삽입 함수 (테스트용)
CREATE OR REPLACE FUNCTION learning.create_sample_multiple_choice_problem(
  p_teacher_id UUID,
  p_title TEXT,
  p_choices JSONB,
  p_correct_choices JSONB,
  p_difficulty INTEGER DEFAULT 3,
  p_tags TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  problem_id UUID;
BEGIN
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
      'title', p_title,
      'choices', p_choices
    ),
    jsonb_build_object(
      'type', 'multiple_choice',
      'correctChoices', p_correct_choices,
      'points', 10
    ),
    'multiple_choice',
    p_difficulty,
    p_tags
  )
  RETURNING id INTO problem_id;
  
  RETURN problem_id;
END;
$$ LANGUAGE plpgsql;

-- 10. 문제 복제 함수
CREATE OR REPLACE FUNCTION learning.clone_problem(
  p_problem_id UUID,
  p_new_teacher_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_problem_id UUID;
  original_teacher_id UUID;
BEGIN
  -- 원본 문제의 teacher_id 조회
  SELECT teacher_id INTO original_teacher_id
  FROM learning.problems
  WHERE id = p_problem_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Problem not found: %', p_problem_id;
  END IF;
  
  -- 문제 복제
  INSERT INTO learning.problems (
    teacher_id,
    content,
    correct_answer,
    type,
    difficulty,
    tags,
    is_active
  )
  SELECT 
    COALESCE(p_new_teacher_id, original_teacher_id),
    content,
    correct_answer,
    type,
    difficulty,
    tags,
    true -- 복제된 문제는 기본적으로 활성화
  FROM learning.problems
  WHERE id = p_problem_id
  RETURNING id INTO new_problem_id;
  
  RETURN new_problem_id;
END;
$$ LANGUAGE plpgsql;

-- 11. 인덱스 사용 최적화를 위한 통계 수집
ANALYZE learning.problems;