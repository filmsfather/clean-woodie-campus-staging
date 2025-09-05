-- Supabase 데이터베이스 최적화 SQL 스크립트
-- 문제 관리 시스템을 위한 스키마 최적화

-- ===========================
-- 1. 테이블 생성 및 기본 구조
-- ===========================

-- 문제 테이블 (이미 존재할 수 있으므로 IF NOT EXISTS 사용)
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'short_answer', 'essay', 'coding')),
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    tags JSONB DEFAULT '[]',
    content JSONB NOT NULL DEFAULT '{}',
    correct_answer JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 문제집 테이블
CREATE TABLE IF NOT EXISTS problem_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 문제집 항목 테이블 (문제와 문제집의 관계)
CREATE TABLE IF NOT EXISTS problem_set_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_set_id UUID NOT NULL REFERENCES problem_sets(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    points INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 학생 답안 테이블
CREATE TABLE IF NOT EXISTS student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    problem_set_id UUID REFERENCES problem_sets(id) ON DELETE SET NULL,
    answer_content JSONB NOT NULL,
    is_correct BOOLEAN,
    score NUMERIC(5,2),
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    graded_at TIMESTAMPTZ
);

-- 도메인 이벤트 테이블
CREATE TABLE IF NOT EXISTS domain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    aggregate_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    event_version INTEGER DEFAULT 1,
    event_data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    occurred_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    correlation_id TEXT,
    causation_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 2. 인덱스 최적화
-- ===========================

-- Problems 테이블 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_teacher_id_active 
    ON problems (teacher_id, is_active) 
    WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_difficulty_type 
    ON problems (difficulty, type);

-- 풀텍스트 검색을 위한 GIN 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_fulltext_search 
    ON problems USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_created_at 
    ON problems (created_at DESC);

-- JSON 배열 태그 검색을 위한 GIN 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_tags_gin 
    ON problems USING gin(tags);

-- Problem Sets 테이블 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problem_sets_teacher_id_active 
    ON problem_sets (teacher_id, is_active) 
    WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problem_sets_created_at 
    ON problem_sets (created_at DESC);

-- Problem Set Items 테이블 인덱스
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_problem_set_items_set_id_order 
    ON problem_set_items (problem_set_id, order_index);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problem_set_items_problem_id 
    ON problem_set_items (problem_id);

-- Student Answers 테이블 인덱스 (성능 집약적)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_answers_student_problem 
    ON student_answers (student_id, problem_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_answers_submitted_at 
    ON student_answers (submitted_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_answers_is_correct 
    ON student_answers (is_correct);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_answers_problem_set_id 
    ON student_answers (problem_set_id) 
    WHERE problem_set_id IS NOT NULL;

-- Domain Events 테이블 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_domain_events_aggregate_id_version 
    ON domain_events (aggregate_id, event_version);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_domain_events_event_type_occurred 
    ON domain_events (event_type, occurred_on DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_domain_events_correlation_id 
    ON domain_events (correlation_id) 
    WHERE correlation_id IS NOT NULL;

-- ===========================
-- 3. 제약 조건 최적화
-- ===========================

-- 문제집 항목의 순서 중복 방지
ALTER TABLE problem_set_items 
    DROP CONSTRAINT IF EXISTS unique_problem_set_order;

ALTER TABLE problem_set_items 
    ADD CONSTRAINT unique_problem_set_order 
    UNIQUE (problem_set_id, order_index);

-- 학생이 같은 문제에 대해 중복 답안 방지 (최신 답안만 유효)
-- 실제로는 중복을 허용하되, 애플리케이션에서 최신 것만 조회하도록 함

-- ===========================
-- 4. 파티셔닝 (대용량 데이터 처리)
-- ===========================

-- 학생 답안 테이블을 월별로 파티셔닝 (선택적)
-- 주석 처리: 필요시 활성화
/*
-- 기존 테이블을 파티션 테이블로 변환
CREATE TABLE student_answers_partitioned (
    LIKE student_answers INCLUDING ALL
) PARTITION BY RANGE (submitted_at);

-- 월별 파티션 생성 함수
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
RETURNS void AS $$
DECLARE
    partition_name text;
    end_date date;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + interval '1 month';
    
    EXECUTE format('CREATE TABLE %I PARTITION OF %I 
                   FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);
    
    -- 파티션별 인덱스 생성
    EXECUTE format('CREATE INDEX %I ON %I (student_id, problem_id)',
                   'idx_' || partition_name || '_student_problem', partition_name);
END;
$$ LANGUAGE plpgsql;
*/

-- ===========================
-- 5. 통계 정보 업데이트
-- ===========================

-- 테이블 통계 정보 업데이트
ANALYZE problems;
ANALYZE problem_sets;
ANALYZE problem_set_items;
ANALYZE student_answers;
ANALYZE domain_events;

-- ===========================
-- 6. 유틸리티 함수들
-- ===========================

-- 헬스 체크 함수
CREATE OR REPLACE FUNCTION health_check()
RETURNS TABLE(status text, timestamp timestamptz) AS $$
BEGIN
    RETURN QUERY SELECT 'ok'::text, now();
END;
$$ LANGUAGE plpgsql;

-- 인덱스 존재 확인 함수
CREATE OR REPLACE FUNCTION check_index_exists(index_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = index_name
    );
END;
$$ LANGUAGE plpgsql;

-- SQL 실행 함수 (관리자용)
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS void AS $$
BEGIN
    EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 테이블 통계 조회 함수
CREATE OR REPLACE FUNCTION get_table_statistics(table_name text)
RETURNS TABLE(
    row_count bigint,
    table_size text,
    index_size text,
    total_size text,
    last_vacuum timestamptz,
    last_analyze timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.reltuples::bigint as row_count,
        pg_size_pretty(pg_relation_size(c.oid)) as table_size,
        pg_size_pretty(pg_total_relation_size(c.oid) - pg_relation_size(c.oid)) as index_size,
        pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
        s.last_vacuum,
        s.last_analyze
    FROM pg_class c
    LEFT JOIN pg_stat_user_tables s ON s.relname = c.relname
    WHERE c.relname = table_name;
END;
$$ LANGUAGE plpgsql;

-- 사용하지 않는 인덱스 조회 함수
CREATE OR REPLACE FUNCTION find_unused_indexes()
RETURNS TABLE(
    index_name text,
    table_name text,
    index_size text,
    index_scans bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.indexrelname::text,
        i.relname::text,
        pg_size_pretty(pg_relation_size(s.indexrelid))::text,
        s.idx_scan
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON i.indexrelid = s.indexrelid
    WHERE s.idx_scan = 0
    AND i.indisunique = false
    AND i.indisprimary = false
    ORDER BY pg_relation_size(s.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- 중복 인덱스 조회 함수
CREATE OR REPLACE FUNCTION find_duplicate_indexes()
RETURNS TABLE(
    index_name text,
    table_name text,
    column_names text,
    index_size text
) AS $$
BEGIN
    RETURN QUERY
    WITH index_info AS (
        SELECT 
            i.relname as index_name,
            t.relname as table_name,
            array_to_string(array_agg(a.attname ORDER BY a.attnum), ',') as columns,
            pg_relation_size(i.oid) as size
        FROM pg_class i
        JOIN pg_index idx ON idx.indexrelid = i.oid
        JOIN pg_class t ON t.oid = idx.indrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(idx.indkey)
        WHERE i.relkind = 'i'
        GROUP BY i.relname, t.relname, i.oid
    )
    SELECT 
        ii.index_name::text,
        ii.table_name::text,
        ii.columns::text,
        pg_size_pretty(ii.size)::text
    FROM index_info ii
    WHERE EXISTS (
        SELECT 1 FROM index_info ii2 
        WHERE ii2.table_name = ii.table_name 
        AND ii2.columns = ii.columns 
        AND ii2.index_name != ii.index_name
    )
    ORDER BY ii.table_name, ii.columns;
END;
$$ LANGUAGE plpgsql;

-- VACUUM ANALYZE 실행 함수
CREATE OR REPLACE FUNCTION vacuum_analyze_table(table_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('VACUUM ANALYZE %I', table_name);
END;
$$ LANGUAGE plpgsql;

-- 테이블 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_table_statistics(table_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('ANALYZE %I', table_name);
END;
$$ LANGUAGE plpgsql;

-- 테이블 REINDEX 함수
CREATE OR REPLACE FUNCTION reindex_table(table_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('REINDEX TABLE %I', table_name);
END;
$$ LANGUAGE plpgsql;

-- 트랜잭션 관련 함수들
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void AS $$
BEGIN
    -- PostgreSQL에서는 함수 내부에서 트랜잭션 제어가 제한적
    -- 실제 트랜잭션은 애플리케이션 레벨에서 관리
    RAISE NOTICE 'Transaction should be managed at application level';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void AS $$
BEGIN
    RAISE NOTICE 'Transaction should be managed at application level';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void AS $$
BEGIN
    RAISE NOTICE 'Transaction should be managed at application level';
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- 7. 권한 설정
-- ===========================

-- 읽기 전용 역할 생성 (선택적)
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'readonly_user') THEN
--         CREATE ROLE readonly_user;
--     END IF;
-- END
-- $$;

-- 테이블 권한 부여
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
-- GRANT USAGE ON SCHEMA public TO readonly_user;

-- ===========================
-- 8. 모니터링 뷰
-- ===========================

-- 시스템 성능 모니터링 뷰
CREATE OR REPLACE VIEW performance_monitor AS
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation,
    most_common_vals[1:5] as top_values
FROM pg_stats
WHERE schemaname = 'public'
AND tablename IN ('problems', 'problem_sets', 'problem_set_items', 'student_answers')
ORDER BY schemaname, tablename, attname;

-- 인덱스 사용량 모니터링 뷰
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 테이블 크기 모니터링 뷰
CREATE OR REPLACE VIEW table_size_stats AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - 
                   pg_relation_size(schemaname||'.'||tablename)) as index_size,
    n_tup_ins + n_tup_upd + n_tup_del as total_operations
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ===========================
-- 완료 메시지
-- ===========================

DO $$
BEGIN
    RAISE NOTICE 'Supabase schema optimization completed successfully!';
    RAISE NOTICE 'Created optimized indexes, utility functions, and monitoring views.';
    RAISE NOTICE 'Run ANALYZE on your tables to update statistics after data load.';
END
$$;