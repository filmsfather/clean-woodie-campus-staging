-- SRS 테이블 RLS 정책

-- Row Level Security 활성화
ALTER TABLE learning.review_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.study_records ENABLE ROW LEVEL SECURITY;

-- review_schedules 정책
CREATE POLICY "Students can view own review schedules"
ON learning.review_schedules FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can update own review schedules"
ON learning.review_schedules FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view students' review schedules"
ON learning.review_schedules FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'teacher'
    )
);

CREATE POLICY "System can insert review schedules"
ON learning.review_schedules FOR INSERT
WITH CHECK (true); -- Application layer에서 권한 체크

-- study_records 정책
CREATE POLICY "Students can view own study records"
ON learning.study_records FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own study records"
ON learning.study_records FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can view students' study records"
ON learning.study_records FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'teacher'
    )
);

-- 관리자는 모든 접근 가능
CREATE POLICY "Admins have full access to review schedules"
ON learning.review_schedules FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

CREATE POLICY "Admins have full access to study records"
ON learning.study_records FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);