/**
 * GetStudentDashboardUseCase 기반 Storybook 스토리
 * L/Empty/Error/OK 4가지 상태를 모두 다루는 UseCase-First 접근
 */
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { StudentDashboard } from './StudentDashboard';
import { AuthContext } from '../../../contexts/AuthContext';
import type { GetStudentDashboardResponse } from '@woodie/application';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockUser = {
  id: 'student-1',
  email: 'student@test.com',
  role: 'student' as const,
  name: '김학생',
};

const meta: Meta<typeof StudentDashboard> = {
  title: 'Dashboard/Student/GetStudentDashboardUseCase',
  component: StudentDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# GetStudentDashboardUseCase UI 표면

**UseCase → UI 매핑**: \`GetStudentDashboardUseCase\` → \`StudentDashboard\`

## 4가지 상태 스토리
- **Loading**: 데이터 로딩 중 상태 (Skeleton UI)
- **Empty**: 데이터가 없는 상태 (첫 사용자)
- **Error**: 에러 발생 상태 (재시도 버튼 포함)  
- **OK**: 정상 데이터 상태 (완전한 대시보드)

## Application DTO 기반
UI 상태는 \`GetStudentDashboardResponse\` DTO를 직접 사용 (DTO-First 원칙)
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={{
            user: mockUser,
            loading: false,
            signIn: async () => {},
            signOut: async () => {},
            signUp: async () => {},
          }}>
            <div className="min-h-screen bg-gray-50 p-6">
              <Story />
            </div>
          </AuthContext.Provider>
        </QueryClientProvider>
      </BrowserRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock 데이터: Application DTO 형태 그대로 사용
const mockStudentDashboardOK: GetStudentDashboardResponse = {
  dashboard: {
    studentId: 'student-1',
    todayTasks: [
      {
        problemId: 'prob-1',
        title: '복습 문제 15개',
        difficulty: 'medium',
        estimatedTime: 20
      },
      {
        problemId: 'prob-2', 
        title: '수학 1학년 - 방정식',
        difficulty: 'easy',
        estimatedTime: 30
      },
    ],
    reviewCount: 45,
    currentStreak: 7,
    longestStreak: 28,
    progressData: [
      { date: '2025-08-26', problemsSolved: 12, timeSpent: 45 },
      { date: '2025-08-27', problemsSolved: 8, timeSpent: 30 },
      { date: '2025-08-28', problemsSolved: 15, timeSpent: 60 },
    ],
    upcomingDeadlines: [
      {
        title: '중학교 수학 1학년',
        dueDate: '2025-09-15',
        type: 'assignment'
      },
    ],
    lastUpdated: new Date().toISOString()
  },
  fromCache: false
};

const mockStudentDashboardEmpty: GetStudentDashboardResponse = {
  dashboard: {
    studentId: 'student-1',
    todayTasks: [],
    reviewCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    progressData: [],
    upcomingDeadlines: [],
    lastUpdated: new Date().toISOString()
  },
  fromCache: false
};

/**
 * 🔄 Loading State
 * GetStudentDashboardUseCase 호출 중인 상태
 * Skeleton UI 표시
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/dashboard/student/:studentId', () => {
          return new Promise(() => {}); // 무한 로딩
        }),
      ],
    },
  },
};

/**
 * 📭 Empty State  
 * 신규 사용자, 아직 학습 데이터가 없음
 * "첫 학습 시작하기" CTA 표시
 */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/dashboard/student/:studentId', () => {
          return HttpResponse.json(mockStudentDashboardEmpty);
        }),
      ],
    },
  },
};

/**
 * ❌ Error State
 * API 호출 실패, 네트워크 오류 등
 * "다시 시도" 버튼 포함
 */
export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/dashboard/student/:studentId', () => {
          return HttpResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          );
        }),
      ],
    },
  },
};

/**
 * ✅ OK State
 * 정상적인 학생 대시보드 데이터
 * 모든 섹션이 데이터와 함께 표시됨
 */
export const OK: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/dashboard/student/:studentId', () => {
          return HttpResponse.json(mockStudentDashboardOK);
        }),
      ],
    },
  },
};

/**
 * 🎯 Feature Flags Test
 * 각 섹션별 Feature Flag 동작 확인
 */
export const FeatureFlagsDisabled: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/dashboard/student/:studentId', () => {
          return HttpResponse.json(mockStudentDashboardOK);
        }),
      ],
    },
  },
  // TODO: Feature Flag를 props나 context로 override하는 방법 구현
};