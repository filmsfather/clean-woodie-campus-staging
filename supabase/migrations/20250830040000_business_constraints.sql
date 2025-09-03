-- Business Rules and Data Integrity Constraints

-- First, fix the schema issues
-- 1. Add organization_id to profiles table to fix type mismatch
ALTER TABLE profiles 
ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Update existing profiles to use organization_id instead of school_id
-- (This would need a data migration in production)
-- UPDATE profiles SET organization_id = school_id::uuid WHERE school_id IS NOT NULL;

-- 2. Update all UUID defaults to use gen_random_uuid() instead of uuid_generate_v4()
-- Note: New tables should use gen_random_uuid(), existing data is fine

-- Profile constraints
ALTER TABLE profiles 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

ALTER TABLE profiles 
ADD CONSTRAINT check_grade_level_range 
CHECK (grade_level IS NULL OR (grade_level >= 1 AND grade_level <= 12));

ALTER TABLE profiles 
ADD CONSTRAINT check_full_name_not_empty 
CHECK (length(trim(full_name)) > 0);

-- Problem constraints
ALTER TABLE problems 
ADD CONSTRAINT check_title_not_empty 
CHECK (length(trim(title)) > 0);

ALTER TABLE problems 
ADD CONSTRAINT check_content_not_empty 
CHECK (content IS NOT NULL AND jsonb_typeof(content) = 'object');

ALTER TABLE problems 
ADD CONSTRAINT check_solution_format 
CHECK (solution IS NULL OR jsonb_typeof(solution) = 'object');

-- Tags constraint - limit count only (empty tag check moved to trigger)
ALTER TABLE problems 
ADD CONSTRAINT check_tags_count 
CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 20);

-- Function to validate tags content
CREATE OR REPLACE FUNCTION validate_problem_tags()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for empty tags
    IF EXISTS (
        SELECT 1 FROM unnest(NEW.tags) tag 
        WHERE length(trim(tag)) = 0
    ) THEN
        RAISE EXCEPTION 'Tags cannot be empty or contain only whitespace';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_problem_tags_trigger
    BEFORE INSERT OR UPDATE ON problems
    FOR EACH ROW 
    WHEN (NEW.tags IS NOT NULL)
    EXECUTE FUNCTION validate_problem_tags();

-- Problem set constraints
ALTER TABLE problem_sets 
ADD CONSTRAINT check_problem_set_title_not_empty 
CHECK (length(trim(title)) > 0);

-- Problem set items constraints
ALTER TABLE problem_set_items 
ADD CONSTRAINT check_order_index_positive 
CHECK (order_index >= 0);

ALTER TABLE problem_set_items 
ADD CONSTRAINT check_points_positive 
CHECK (points > 0);

-- Assignment constraints
ALTER TABLE assignments 
ADD CONSTRAINT check_assignment_title_not_empty 
CHECK (length(trim(title)) > 0);

ALTER TABLE assignments 
ADD CONSTRAINT check_due_date_after_available 
CHECK (due_date IS NULL OR available_from IS NULL OR due_date > available_from);

-- Removed hardcoded date, using relative constraint instead
ALTER TABLE assignments 
ADD CONSTRAINT check_available_from_reasonable 
CHECK (
    available_from IS NULL 
    OR available_from >= timezone('utc'::text, now()) - INTERVAL '2 years'
);

-- Submission constraints
ALTER TABLE submissions 
ADD CONSTRAINT check_score_non_negative 
CHECK (score IS NULL OR score >= 0);

ALTER TABLE submissions 
ADD CONSTRAINT check_max_score_positive 
CHECK (max_score IS NULL OR max_score > 0);

ALTER TABLE submissions 
ADD CONSTRAINT check_score_not_exceed_max 
CHECK (score IS NULL OR max_score IS NULL OR score <= max_score);

ALTER TABLE submissions 
ADD CONSTRAINT check_submitted_when_submitted 
CHECK (
    (status != 'submitted'::submission_status AND status != 'reviewed'::submission_status) 
    OR submitted_at IS NOT NULL
);

ALTER TABLE submissions 
ADD CONSTRAINT check_reviewed_when_reviewed 
CHECK (
    status != 'reviewed'::submission_status 
    OR (reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
);

ALTER TABLE submissions 
ADD CONSTRAINT check_submission_timestamp_order 
CHECK (
    submitted_at IS NULL 
    OR reviewed_at IS NULL 
    OR submitted_at <= reviewed_at
);

ALTER TABLE submissions 
ADD CONSTRAINT check_creation_before_submission 
CHECK (
    submitted_at IS NULL 
    OR created_at <= submitted_at
);

-- SRS (Spaced Repetition System) constraints
ALTER TABLE srs_reviews 
ADD CONSTRAINT check_interval_positive 
CHECK (interval_days > 0);

ALTER TABLE srs_reviews 
ADD CONSTRAINT check_ease_factor_reasonable 
CHECK (ease_factor >= 1.0 AND ease_factor <= 5.0);

ALTER TABLE srs_reviews 
ADD CONSTRAINT check_repetitions_non_negative 
CHECK (repetitions >= 0);

ALTER TABLE srs_reviews 
ADD CONSTRAINT check_next_review_after_last 
CHECK (
    last_reviewed_at IS NULL 
    OR next_review_date > last_reviewed_at
);

-- Relative date constraint instead of hardcoded
ALTER TABLE srs_reviews 
ADD CONSTRAINT check_review_date_reasonable 
CHECK (
    next_review_date >= timezone('utc'::text, now()) - INTERVAL '1 year'
    AND next_review_date <= timezone('utc'::text, now()) + INTERVAL '5 years'
);

-- Token system constraints (strengthened)
ALTER TABLE student_tokens 
ADD CONSTRAINT check_tokens_non_negative_strict 
CHECK (tokens >= 0);

ALTER TABLE student_tokens 
ADD CONSTRAINT check_total_earned_non_negative 
CHECK (total_earned >= 0);

ALTER TABLE student_tokens 
ADD CONSTRAINT check_total_earned_reasonable 
CHECK (total_earned >= 0); -- Simplified: total_earned should always be non-negative

ALTER TABLE token_transactions 
ADD CONSTRAINT check_transaction_amount_not_zero 
CHECK (amount != 0);

ALTER TABLE token_transactions 
ADD CONSTRAINT check_reason_not_empty 
CHECK (length(trim(reason)) > 0);

-- Achievement constraints
ALTER TABLE achievements 
ADD CONSTRAINT check_achievement_name_not_empty 
CHECK (length(trim(name)) > 0);

ALTER TABLE achievements 
ADD CONSTRAINT check_criteria_not_empty 
CHECK (criteria IS NOT NULL AND jsonb_typeof(criteria) = 'object');

ALTER TABLE achievements 
ADD CONSTRAINT check_token_reward_non_negative 
CHECK (token_reward >= 0);

-- Business rule: Teachers can only teach classes in their organization
-- 교사는 자신이 속한 조직의 클래스만 가르칠 수 있다는 비즈니스 규칙을 트리거로 구현
CREATE OR REPLACE FUNCTION validate_teacher_organization()
RETURNS TRIGGER AS $$
BEGIN
    -- teacher_id나 organization_id가 NULL이면 검사 스킵
    IF NEW.teacher_id IS NULL OR NEW.organization_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- 교사가 해당 조직에 속하고 올바른 역할을 가지고 있는지 확인
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = NEW.teacher_id 
        AND profiles.organization_id = NEW.organization_id
        AND profiles.role IN ('teacher'::user_role, 'admin'::user_role)
    ) THEN
        RAISE EXCEPTION 'Teacher must belong to the same organization as the class and have teacher or admin role';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 클래스 생성/수정 시 교사-조직 매칭 검증 트리거
CREATE TRIGGER validate_teacher_organization_trigger
    BEFORE INSERT OR UPDATE ON classes
    FOR EACH ROW 
    EXECUTE FUNCTION validate_teacher_organization();

-- Business rule: Assignment due dates should be reasonable for published assignments
CREATE OR REPLACE FUNCTION check_assignment_due_date_reasonable()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published'::assignment_status 
       AND NEW.due_date IS NOT NULL 
       AND NEW.due_date <= timezone('utc'::text, now()) + INTERVAL '1 hour' THEN
        RAISE EXCEPTION 'Published assignments should have due dates at least 1 hour in the future';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_assignment_due_date_trigger
    BEFORE INSERT OR UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION check_assignment_due_date_reasonable();

-- Business rule: Problem set items must maintain order integrity (DEFERRED)
CREATE OR REPLACE FUNCTION check_problem_set_order_integrity_deferred()
RETURNS TRIGGER AS $$
DECLARE
    max_order INTEGER;
    min_order INTEGER;
    count_items INTEGER;
    target_problem_set_id UUID;
BEGIN
    target_problem_set_id := COALESCE(NEW.problem_set_id, OLD.problem_set_id);
    
    -- Get statistics for the problem set at transaction end
    SELECT 
        COALESCE(MAX(order_index), -1),
        COALESCE(MIN(order_index), 0),
        COUNT(*)
    INTO max_order, min_order, count_items
    FROM problem_set_items 
    WHERE problem_set_id = target_problem_set_id;

    -- Check that orders start at 0 and are consecutive (only if items exist)
    IF count_items > 0 AND (min_order != 0 OR max_order != count_items - 1) THEN
        RAISE EXCEPTION 'Problem set % item orders must start at 0 and be consecutive. Found min: %, max: %, count: %', 
            target_problem_set_id, min_order, max_order, count_items;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Use CONSTRAINT TRIGGER for deferred checking
CREATE CONSTRAINT TRIGGER check_problem_set_order_deferred_trigger
    AFTER INSERT OR UPDATE OR DELETE ON problem_set_items
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_problem_set_order_integrity_deferred();

-- Improved token balance management (O(1) performance) - handles INSERT/UPDATE/DELETE
CREATE OR REPLACE FUNCTION handle_token_transaction()
RETURNS TRIGGER AS $$
DECLARE
    amount_delta INTEGER;
    target_student_id UUID;
BEGIN
    -- Calculate the change in amount based on operation
    IF TG_OP = 'INSERT' THEN
        amount_delta := NEW.amount;
        target_student_id := NEW.student_id;
    ELSIF TG_OP = 'UPDATE' THEN
        amount_delta := NEW.amount - OLD.amount;
        target_student_id := NEW.student_id;
    ELSIF TG_OP = 'DELETE' THEN
        amount_delta := -OLD.amount;
        target_student_id := OLD.student_id;
    END IF;

    -- Update balance (O(1) operation)
    UPDATE student_tokens 
    SET 
        tokens = tokens + amount_delta,
        total_earned = CASE 
            WHEN amount_delta > 0 THEN total_earned + amount_delta 
            ELSE total_earned 
        END,
        updated_at = timezone('utc'::text, now())
    WHERE student_id = target_student_id;

    -- Insert initial record if student doesn't exist (only for INSERT/UPDATE)
    IF NOT FOUND AND TG_OP != 'DELETE' THEN
        INSERT INTO student_tokens (student_id, tokens, total_earned)
        VALUES (
            target_student_id, 
            GREATEST(amount_delta, 0), 
            GREATEST(amount_delta, 0)
        );
    END IF;

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_token_transaction_trigger
    AFTER INSERT OR UPDATE OR DELETE ON token_transactions
    FOR EACH ROW EXECUTE FUNCTION handle_token_transaction();

-- Additional validation for token balance
CREATE OR REPLACE FUNCTION validate_token_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tokens < 0 THEN
        RAISE EXCEPTION 'Insufficient tokens. Current balance cannot be negative. Attempted balance: %', NEW.tokens;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_token_balance_trigger
    BEFORE UPDATE ON student_tokens
    FOR EACH ROW EXECUTE FUNCTION validate_token_balance();

-- Business rule: Only students can be enrolled in classes
CREATE OR REPLACE FUNCTION check_student_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = NEW.student_id 
        AND role = 'student'::user_role
    ) THEN
        RAISE EXCEPTION 'Only users with student role can be enrolled in classes';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_student_enrollment_trigger
    BEFORE INSERT OR UPDATE ON class_enrollments
    FOR EACH ROW EXECUTE FUNCTION check_student_enrollment();

-- Indexes to support constraint checking efficiently
CREATE INDEX IF NOT EXISTS idx_profiles_organization_role ON profiles(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_token_transactions_student_amount ON token_transactions(student_id, amount);
CREATE INDEX IF NOT EXISTS idx_problem_set_items_set_order ON problem_set_items(problem_set_id, order_index);
CREATE INDEX IF NOT EXISTS idx_assignments_status_dates ON assignments(status, available_from, due_date);
CREATE INDEX IF NOT EXISTS idx_submissions_timestamps ON submissions(created_at, submitted_at, reviewed_at);

-- Create view for real-time token balance calculation (alternative approach)
CREATE OR REPLACE VIEW student_token_balances AS
SELECT 
    student_id,
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_earned,
    COALESCE(SUM(amount), 0) as current_tokens,
    COUNT(*) as transaction_count,
    MAX(created_at) as last_transaction_date
FROM token_transactions
GROUP BY student_id;

-- Grant appropriate permissions
GRANT SELECT ON student_token_balances TO authenticated;