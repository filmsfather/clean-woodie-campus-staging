-- SRS (Spaced Repetition System) 스키마
-- 에빙하우스 망각곡선 기반 복습 시스템

-- 리뷰 피드백 타입
CREATE TYPE review_feedback AS ENUM ('AGAIN', 'HARD', 'GOOD', 'EASY');

-- 복습 일정 테이블 (SRS 핵심)
CREATE TABLE learning.review_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES learning.problems(id) ON DELETE CASCADE,
    
    -- SRS 상태
    current_interval REAL NOT NULL DEFAULT 1.0, -- 일 단위
    ease_factor REAL NOT NULL DEFAULT 2.5,
    review_count INTEGER NOT NULL DEFAULT 0,
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    
    -- 시간 정보
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 제약조건
    UNIQUE(student_id, problem_id),
    CHECK (current_interval > 0),
    CHECK (ease_factor BETWEEN 1.3 AND 4.0),
    CHECK (review_count >= 0),
    CHECK (consecutive_failures >= 0)
);

-- 학습 기록 테이블 (로그용)
CREATE TABLE learning.study_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES learning.problems(id) ON DELETE CASCADE,
    feedback review_feedback NOT NULL,
    is_correct BOOLEAN NOT NULL,
    response_time INTEGER, -- 초 단위
    answer_content JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 핵심 인덱스만
CREATE INDEX idx_review_schedules_student_due 
    ON learning.review_schedules(student_id, next_review_at);

CREATE INDEX idx_review_schedules_due_priority 
    ON learning.review_schedules(next_review_at, ease_factor);

CREATE INDEX idx_study_records_student 
    ON learning.study_records(student_id, created_at DESC);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거
CREATE TRIGGER set_updated_at_review_schedules
    BEFORE UPDATE ON learning.review_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 유용한 뷰
CREATE VIEW learning.due_reviews AS
SELECT 
    rs.id,
    rs.student_id,
    rs.problem_id,
    rs.current_interval,
    rs.ease_factor,
    rs.review_count,
    rs.consecutive_failures,
    rs.next_review_at,
    p.content as problem_content,
    p.type as problem_type,
    p.difficulty as problem_difficulty
FROM learning.review_schedules rs
JOIN learning.problems p ON rs.problem_id = p.id
WHERE rs.next_review_at <= NOW()
ORDER BY rs.next_review_at ASC, rs.ease_factor ASC;

-- 테이블 코멘트
COMMENT ON TABLE learning.review_schedules IS 'SRS 복습 일정 - 에빙하우스 망각곡선 기반';
COMMENT ON TABLE learning.study_records IS '학습 세션 기록 로그';
COMMENT ON COLUMN learning.review_schedules.current_interval IS '복습 간격 (일 단위)';
COMMENT ON COLUMN learning.review_schedules.ease_factor IS '난이도 계수 (1.3~4.0)';
COMMENT ON COLUMN learning.review_schedules.consecutive_failures IS '연속 실패 횟수';