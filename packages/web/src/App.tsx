import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './components'
import { AuthProvider } from './contexts/AuthContext'
import { MainLayout } from './components/layout/MainLayout'
import { DesignSystemDemo } from './components/DesignSystemDemo'
import { StudentDashboard } from './components/dashboard/student'
import { TodayStudyPage } from './components/dashboard/student/pages/TodayStudyPage'
import { ReviewPage } from './components/dashboard/student/pages/ReviewPage'
import { ProblemSolvingPage } from './components/dashboard/student/pages/ProblemSolvingPage'
import { MyProgressPage } from './components/dashboard/student/pages/MyProgressPage'
import { TeacherDashboard } from './components/dashboard/teacher'
import { AdminDashboard } from './components/dashboard/admin'
import { ClassManagement } from './components/admin/ClassManagement'
import { Unauthorized } from './components/auth/Unauthorized'
import { AdminGuard, TeacherGuard } from './components/auth'
import { SignInPage, SignUpPage, ProfilePage, InviteManagementPage, UserManagementPage, AdminProfilePage } from './pages/auth'
import { ReviewPage as SRSReviewPage, StatisticsPage, SettingsPage } from './pages/srs'
import { ClassProgressPage, StreakLeaderboardPage } from './pages/progress'
import { RewardRedemptionPage, LeaderboardPage } from './pages/gamification'
import { ProblemSetsPage, ProblemSetDetailPage, CreateProblemSetPage, EditProblemSetPage } from './pages/problemsets'
import { ProblemList } from './components/problems'
import { AnalyticsDashboard } from './components/problems/analytics'

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
                <Route path="srs/review" element={<SRSReviewPage />} />
                <Route path="srs/statistics" element={<StatisticsPage />} />
                <Route path="srs/settings" element={<SettingsPage />} />
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
                <Route path="teacher" element={<TeacherGuard><TeacherDashboard /></TeacherGuard>} />
                <Route path="teacher/dashboard" element={<TeacherGuard><TeacherDashboard /></TeacherGuard>} />
                <Route path="manage/students" element={<TeacherGuard><UserManagementPage /></TeacherGuard>} />
                <Route path="manage/problem-sets" element={<TeacherGuard><ProblemSetsPage /></TeacherGuard>} />
                <Route path="manage/problems" element={<TeacherGuard><ProblemList problems={[]} loading={false} totalCount={0} currentPage={1} hasNext={false} /></TeacherGuard>} />
                <Route path="manage/analytics" element={<TeacherGuard><div className="p-6"><AnalyticsDashboard isAdminView={false} /></div></TeacherGuard>} />
                
                {/* 문제집 관련 라우트 */}
                <Route path="problemsets" element={<ProblemSetsPage />} />
                <Route path="problemsets/create" element={<CreateProblemSetPage />} />
                <Route path="problemsets/:id" element={<ProblemSetDetailPage />} />
                <Route path="problemsets/:id/edit" element={<EditProblemSetPage />} />
                
                {/* 관리자 전용 라우트 */}
                <Route path="admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
                <Route path="admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
                <Route path="admin/users" element={<AdminGuard><UserManagementPage /></AdminGuard>} />
                <Route path="admin/invites" element={<AdminGuard><InviteManagementPage /></AdminGuard>} />
                <Route path="admin/profile" element={<AdminGuard><AdminProfilePage /></AdminGuard>} />
                <Route path="admin/classes" element={<AdminGuard><ClassManagement /></AdminGuard>} />
                <Route path="admin/problem-sets" element={<AdminGuard><ProblemSetsPage defaultFilter="all" /></AdminGuard>} />
                <Route path="admin/content" element={<AdminGuard><ProblemList problems={[]} loading={false} totalCount={0} currentPage={1} hasNext={false} /></AdminGuard>} />
                <Route path="admin/system" element={<AdminGuard><div className="p-6"><h2 className="text-2xl font-bold mb-4">시스템 설정</h2><p>시스템 설정 페이지를 준비 중입니다.</p></div></AdminGuard>} />
                <Route path="admin/analytics" element={<AdminGuard><div className="p-6"><AnalyticsDashboard isAdminView={true} /></div></AdminGuard>} />
                
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