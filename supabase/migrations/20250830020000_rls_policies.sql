-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_set_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE srs_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.user_role() RETURNS user_role AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE id = auth.uid()),
    'student'::user_role
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
  SELECT public.user_role() = 'admin'::user_role
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is teacher
CREATE OR REPLACE FUNCTION public.is_teacher() RETURNS boolean AS $$
  SELECT public.user_role() IN ('teacher'::user_role, 'admin'::user_role)
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers and admins can view all profiles" ON profiles
    FOR SELECT USING (public.is_teacher());

-- Organizations RLS policies
CREATE POLICY "Admins can manage organizations" ON organizations
    FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view organizations they belong to" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.school_id = organizations.id::text
        )
    );

-- Classes RLS policies  
CREATE POLICY "Teachers can manage their own classes" ON classes
    FOR ALL USING (
        public.is_teacher() AND (
            teacher_id = auth.uid() OR public.is_admin()
        )
    );

CREATE POLICY "Students can view classes they're enrolled in" ON classes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM class_enrollments 
            WHERE class_enrollments.class_id = classes.id 
            AND class_enrollments.student_id = auth.uid()
        )
    );

-- Class enrollments RLS policies
CREATE POLICY "Teachers can manage enrollments for their classes" ON class_enrollments
    FOR ALL USING (
        public.is_teacher() AND (
            EXISTS (
                SELECT 1 FROM classes 
                WHERE classes.id = class_enrollments.class_id 
                AND (classes.teacher_id = auth.uid() OR public.is_admin())
            )
        )
    );

CREATE POLICY "Students can view their own enrollments" ON class_enrollments
    FOR SELECT USING (student_id = auth.uid());

-- Problems RLS policies
CREATE POLICY "Teachers can manage their own problems" ON problems
    FOR ALL USING (
        public.is_teacher() AND (
            created_by = auth.uid() OR public.is_admin()
        )
    );

CREATE POLICY "Users can view public problems" ON problems
    FOR SELECT USING (is_public = true);

CREATE POLICY "Students can view problems in their assignments" ON problems
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN problem_sets ps ON ps.id = a.problem_set_id
            JOIN problem_set_items psi ON psi.problem_set_id = ps.id
            JOIN class_enrollments ce ON ce.class_id = a.class_id
            WHERE psi.problem_id = problems.id
            AND ce.student_id = auth.uid()
        )
    );

-- Problem sets RLS policies
CREATE POLICY "Teachers can manage their own problem sets" ON problem_sets
    FOR ALL USING (
        public.is_teacher() AND (
            created_by = auth.uid() OR public.is_admin()
        )
    );

CREATE POLICY "Students can view problem sets in their assignments" ON problem_sets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN class_enrollments ce ON ce.class_id = a.class_id
            WHERE a.problem_set_id = problem_sets.id
            AND ce.student_id = auth.uid()
        )
    );

-- Problem set items RLS policies
CREATE POLICY "Teachers can manage problem set items" ON problem_set_items
    FOR ALL USING (
        public.is_teacher() AND (
            EXISTS (
                SELECT 1 FROM problem_sets ps 
                WHERE ps.id = problem_set_items.problem_set_id
                AND (ps.created_by = auth.uid() OR public.is_admin())
            )
        )
    );

CREATE POLICY "Students can view problem set items in their assignments" ON problem_set_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN class_enrollments ce ON ce.class_id = a.class_id
            WHERE a.problem_set_id = problem_set_items.problem_set_id
            AND ce.student_id = auth.uid()
        )
    );

-- Assignments RLS policies
CREATE POLICY "Teachers can manage assignments for their classes" ON assignments
    FOR ALL USING (
        public.is_teacher() AND (
            EXISTS (
                SELECT 1 FROM classes c 
                WHERE c.id = assignments.class_id
                AND (c.teacher_id = auth.uid() OR public.is_admin())
            )
        )
    );

CREATE POLICY "Students can view assignments for their classes" ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM class_enrollments ce
            WHERE ce.class_id = assignments.class_id
            AND ce.student_id = auth.uid()
        )
    );

-- Assignment overrides RLS policies
CREATE POLICY "Teachers can manage assignment overrides" ON assignment_overrides
    FOR ALL USING (
        public.is_teacher() AND (
            EXISTS (
                SELECT 1 FROM assignments a
                JOIN classes c ON c.id = a.class_id
                WHERE a.id = assignment_overrides.assignment_id
                AND (c.teacher_id = auth.uid() OR public.is_admin())
            )
        )
    );

CREATE POLICY "Students can view their own assignment overrides" ON assignment_overrides
    FOR SELECT USING (student_id = auth.uid());

-- Submissions RLS policies
CREATE POLICY "Students can manage their own submissions" ON submissions
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their assignments" ON submissions
    FOR SELECT USING (
        public.is_teacher() AND (
            EXISTS (
                SELECT 1 FROM assignments a
                JOIN classes c ON c.id = a.class_id
                WHERE a.id = submissions.assignment_id
                AND (c.teacher_id = auth.uid() OR public.is_admin())
            )
        )
    );

CREATE POLICY "Teachers can update submissions for review" ON submissions
    FOR UPDATE USING (
        public.is_teacher() AND (
            EXISTS (
                SELECT 1 FROM assignments a
                JOIN classes c ON c.id = a.class_id
                WHERE a.id = submissions.assignment_id
                AND (c.teacher_id = auth.uid() OR public.is_admin())
            )
        )
    );

-- SRS Reviews RLS policies
CREATE POLICY "Students can manage their own SRS reviews" ON srs_reviews
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view SRS reviews for their students" ON srs_reviews
    FOR SELECT USING (
        public.is_teacher() AND (
            EXISTS (
                SELECT 1 FROM class_enrollments ce
                JOIN classes c ON c.id = ce.class_id
                WHERE ce.student_id = srs_reviews.student_id
                AND (c.teacher_id = auth.uid() OR public.is_admin())
            )
        )
    );

-- Student tokens RLS policies
CREATE POLICY "Students can view their own tokens" ON student_tokens
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can update their own tokens" ON student_tokens
    FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "System can insert tokens for students" ON student_tokens
    FOR INSERT WITH CHECK (true); -- Will be handled by application logic

CREATE POLICY "Teachers can view student tokens" ON student_tokens
    FOR SELECT USING (
        public.is_teacher() AND (
            EXISTS (
                SELECT 1 FROM class_enrollments ce
                JOIN classes c ON c.id = ce.class_id
                WHERE ce.student_id = student_tokens.student_id
                AND (c.teacher_id = auth.uid() OR public.is_admin())
            )
        )
    );

-- Token transactions RLS policies
CREATE POLICY "Students can view their own token transactions" ON token_transactions
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "System can insert token transactions" ON token_transactions
    FOR INSERT WITH CHECK (true); -- Will be handled by application logic

CREATE POLICY "Teachers can view student token transactions" ON token_transactions
    FOR SELECT USING (
        public.is_teacher() AND (
            EXISTS (
                SELECT 1 FROM class_enrollments ce
                JOIN classes c ON c.id = ce.class_id
                WHERE ce.student_id = token_transactions.student_id
                AND (c.teacher_id = auth.uid() OR public.is_admin())
            )
        )
    );

-- Achievements RLS policies
CREATE POLICY "Everyone can view achievements" ON achievements
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage achievements" ON achievements
    FOR ALL USING (public.is_admin());

-- Student achievements RLS policies
CREATE POLICY "Students can view their own achievements" ON student_achievements
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "System can insert student achievements" ON student_achievements
    FOR INSERT WITH CHECK (true); -- Will be handled by application logic

CREATE POLICY "Teachers can view student achievements" ON student_achievements
    FOR SELECT USING (
        public.is_teacher() AND (
            EXISTS (
                SELECT 1 FROM class_enrollments ce
                JOIN classes c ON c.id = ce.class_id
                WHERE ce.student_id = student_achievements.student_id
                AND (c.teacher_id = auth.uid() OR public.is_admin())
            )
        )
    );