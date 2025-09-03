-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, email, role, school_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role),
        (NEW.raw_user_meta_data->>'school_id')::UUID
    );

    -- Initialize student tokens if user is a student
    IF COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role) = 'student'::user_role THEN
        INSERT INTO student_tokens (student_id, tokens, total_earned)
        VALUES (NEW.id, 0, 0);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to award tokens to students
CREATE OR REPLACE FUNCTION award_tokens(
    p_student_id UUID,
    p_amount INTEGER,
    p_reason TEXT,
    p_related_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Insert transaction record
    INSERT INTO token_transactions (student_id, amount, reason, related_id)
    VALUES (p_student_id, p_amount, p_reason, p_related_id);

    -- Update student tokens
    UPDATE student_tokens
    SET 
        tokens = tokens + p_amount,
        total_earned = total_earned + GREATEST(p_amount, 0),
        updated_at = timezone('utc'::text, now())
    WHERE student_id = p_student_id;

    -- Create record if it doesn't exist
    IF NOT FOUND THEN
        INSERT INTO student_tokens (student_id, tokens, total_earned)
        VALUES (p_student_id, GREATEST(p_amount, 0), GREATEST(p_amount, 0));
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(p_student_id UUID, p_event_type TEXT, p_event_data JSONB DEFAULT '{}')
RETURNS VOID AS $$
DECLARE
    achievement_record RECORD;
    criteria JSONB;
    should_award BOOLEAN;
BEGIN
    FOR achievement_record IN 
        SELECT * FROM achievements 
        WHERE NOT EXISTS (
            SELECT 1 FROM student_achievements 
            WHERE student_id = p_student_id 
            AND achievement_id = achievements.id
        )
    LOOP
        criteria := achievement_record.criteria;
        should_award := FALSE;

        -- Check different achievement types
        CASE criteria->>'type'
            WHEN 'first_submission' THEN
                should_award := (p_event_type = 'submission_completed');
            
            WHEN 'perfect_score' THEN
                should_award := (
                    p_event_type = 'submission_scored' AND
                    (p_event_data->>'score')::INTEGER = (p_event_data->>'max_score')::INTEGER
                );
            
            WHEN 'speed_completion' THEN
                should_award := (
                    p_event_type = 'speed_completion' AND
                    (p_event_data->>'count')::INTEGER >= (criteria->>'count')::INTEGER AND
                    (p_event_data->>'time_taken')::INTEGER <= (criteria->>'time_limit')::INTEGER
                );
            
            WHEN 'streak' THEN
                should_award := (
                    p_event_type = 'daily_streak' AND
                    (p_event_data->>'days')::INTEGER >= (criteria->>'days')::INTEGER
                );
            
            ELSE
                should_award := FALSE;
        END CASE;

        -- Award achievement if criteria met
        IF should_award THEN
            INSERT INTO student_achievements (student_id, achievement_id)
            VALUES (p_student_id, achievement_record.id);

            -- Award tokens if specified
            IF achievement_record.token_reward > 0 THEN
                PERFORM award_tokens(
                    p_student_id,
                    achievement_record.token_reward,
                    'Achievement: ' || achievement_record.name,
                    achievement_record.id
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update SRS intervals based on performance
CREATE OR REPLACE FUNCTION update_srs_interval(
    p_student_id UUID,
    p_problem_id UUID,
    p_quality INTEGER -- 0-5, where 3+ is correct
)
RETURNS VOID AS $$
DECLARE
    current_review RECORD;
    new_interval INTEGER;
    new_ease_factor REAL;
    new_repetitions INTEGER;
BEGIN
    -- Get current SRS record or create new one
    SELECT * INTO current_review
    FROM srs_reviews
    WHERE student_id = p_student_id AND problem_id = p_problem_id;

    IF NOT FOUND THEN
        -- Create new SRS record
        INSERT INTO srs_reviews (
            student_id, 
            problem_id, 
            interval_days, 
            ease_factor, 
            repetitions,
            next_review_date,
            last_reviewed_at
        ) VALUES (
            p_student_id,
            p_problem_id,
            1,
            2.5,
            0,
            timezone('utc'::text, now()) + INTERVAL '1 day',
            timezone('utc'::text, now())
        );
        RETURN;
    END IF;

    -- Update based on SM-2 algorithm
    IF p_quality >= 3 THEN
        -- Correct answer
        new_repetitions := current_review.repetitions + 1;
        
        CASE new_repetitions
            WHEN 1 THEN new_interval := 1;
            WHEN 2 THEN new_interval := 6;
            ELSE new_interval := ROUND(current_review.interval_days * current_review.ease_factor);
        END CASE;

        -- Update ease factor
        new_ease_factor := current_review.ease_factor + (0.1 - (5 - p_quality) * (0.08 + (5 - p_quality) * 0.02));
        new_ease_factor := GREATEST(new_ease_factor, 1.3);
    ELSE
        -- Incorrect answer - reset
        new_repetitions := 0;
        new_interval := 1;
        new_ease_factor := current_review.ease_factor;
    END IF;

    -- Update the SRS record
    UPDATE srs_reviews
    SET
        interval_days = new_interval,
        ease_factor = new_ease_factor,
        repetitions = new_repetitions,
        next_review_date = timezone('utc'::text, now()) + (new_interval || ' days')::INTERVAL,
        last_reviewed_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE student_id = p_student_id AND problem_id = p_problem_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically award tokens and check achievements on submission
CREATE OR REPLACE FUNCTION handle_submission_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when submission is completed or scored
    IF NEW.status = 'submitted'::submission_status AND OLD.status != 'submitted'::submission_status THEN
        -- Award tokens for completion
        PERFORM award_tokens(NEW.student_id, 5, 'Assignment completion', NEW.id);
        
        -- Check for first submission achievement
        PERFORM check_achievements(NEW.student_id, 'submission_completed', '{}');
    END IF;

    -- Process scoring
    IF NEW.score IS NOT NULL AND (OLD.score IS NULL OR OLD.score != NEW.score) THEN
        -- Award tokens based on score percentage
        DECLARE
            score_percentage INTEGER;
            bonus_tokens INTEGER;
        BEGIN
            score_percentage := (NEW.score * 100) / GREATEST(NEW.max_score, 1);
            bonus_tokens := CASE
                WHEN score_percentage = 100 THEN 20
                WHEN score_percentage >= 90 THEN 15
                WHEN score_percentage >= 80 THEN 10
                WHEN score_percentage >= 70 THEN 5
                ELSE 2
            END;

            PERFORM award_tokens(NEW.student_id, bonus_tokens, 'Score bonus (' || score_percentage || '%)', NEW.id);
            
            -- Check for perfect score achievement
            IF score_percentage = 100 THEN
                PERFORM check_achievements(
                    NEW.student_id, 
                    'submission_scored', 
                    jsonb_build_object('score', NEW.score, 'max_score', NEW.max_score)
                );
            END IF;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE OR REPLACE TRIGGER on_submission_update
    AFTER UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION handle_submission_update();