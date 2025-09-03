import React, { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './components'
import { AuthProvider } from './contexts/AuthContext'
import { MainLayout } from './components/layout/MainLayout'
import { ProblemSetList } from './components/problemsets/ProblemSetList'
import { DesignSystemDemo } from './components/DesignSystemDemo'
import { StudentDashboard } from './components/dashboard/student'
import { TodayStudyPage } from './components/dashboard/student/pages/TodayStudyPage'
import { ReviewPage } from './components/dashboard/student/pages/ReviewPage'
import { ProblemSolvingPage } from './components/dashboard/student/pages/ProblemSolvingPage'
import { MyProgressPage } from './components/dashboard/student/pages/MyProgressPage'
import { TeacherDashboard } from './components/dashboard/teacher'
import { AdminDashboard } from './components/dashboard/admin'
import { UserManagement } from './components/admin/UserManagement'
import { ClassManagement } from './components/admin/ClassManagement'
import { Unauthorized } from './components/auth/Unauthorized'
import { SignInPage, SignUpPage, ProfilePage } from './pages/auth'
import { TodayReviewsPage, ReviewStatisticsPage } from './pages/srs'
import { ClassProgressPage, StreakLeaderboardPage } from './pages/progress'
import { RewardRedemptionPage, LeaderboardPage } from './pages/gamification'
import { ProblemBankBrowser, GradingWorkflow, AnalyticsDashboard } from './components/problems'

// React Query client 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5분
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system">
          <AuthProvider>
            <Routes>
              {/* 인증 라우트 - Layout 밖에서 독립적으로 */}
              <Route path="/auth/signin" element={<SignInPage />} />
              <Route path="/auth/signup" element={<SignUpPage />} />
              
              <Route path="/" element={<MainLayout />}>
                {/* 학생 전용 라우트 */}
                <Route index element={<StudentDashboard />} />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="study/today" element={<TodayStudyPage />} />
                <Route path="study/reviews" element={<TodayReviewsPage />} />
                <Route path="study/stats" element={<ReviewStatisticsPage />} />
                <Route path="study/review" element={<ReviewPage />} />
                <Route path="study/solve" element={<ProblemSolvingPage />} />
                <Route path="study/progress" element={<MyProgressPage />} />
                
                {/* 진도 관리 라우트 */}
                <Route path="progress/class" element={<ClassProgressPage />} />
                <Route path="progress/streaks" element={<StreakLeaderboardPage />} />
                
                {/* 게임화 시스템 라우트 */}
                <Route path="gamification/rewards" element={<RewardRedemptionPage />} />
                <Route path="gamification/leaderboard" element={<LeaderboardPage />} />
                
                {/* 교사 전용 라우트 */}
                <Route path="teacher" element={<TeacherDashboard />} />
                <Route path="teacher/dashboard" element={<TeacherDashboard />} />
                <Route path="manage/students" element={<GradingWorkflow assignment={{
                  id: '1', 
                  title: '학생 과제 관리', 
                  description: '학생들의 과제 제출 및 채점 관리',
                  dueDate: new Date(),
                  problems: [],
                  totalPoints: 100,
                  submissionCount: 0,
                  gradedCount: 0
                }} submissions={[]} onUpdateSubmission={async () => {}} onBulkGrade={async () => {}} onPublishGrades={async () => {}} onExportGrades={async () => {}} />} />
                <Route path="manage/problem-sets" element={<ProblemSetList />} />
                <Route path="manage/problems" element={<ProblemBankBrowser mode="manage" />} />
                <Route path="manage/analytics" element={<AnalyticsDashboard isAdminView={false} />} />
                
                {/* 관리자 전용 라우트 */}
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="admin/users" element={<UserManagement />} />
                <Route path="admin/classes" element={<ClassManagement />} />
                <Route path="admin/content" element={<ProblemBankBrowser mode="manage" />} />
                <Route path="admin/system" element={<div className="p-6"><h2 className="text-2xl font-bold mb-4">시스템 설정</h2><p>시스템 설정 페이지를 준비 중입니다.</p></div>} />
                <Route path="admin/analytics" element={<AnalyticsDashboard isAdminView={true} />} />
                
                {/* 개발용 페이지들 */}
                <Route path="design" element={<DesignSystemDemo />} />
              </Route>
              
              {/* 에러 페이지 */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<div>404 - 페이지를 찾을 수 없습니다</div>} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App