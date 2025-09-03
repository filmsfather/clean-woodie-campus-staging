/**
 * GetTodayReviewsUseCase & SubmitReviewFeedbackUseCase 기반 Storybook 스토리
 * L/Empty/Error/OK 4가지 상태를 모두 다루는 UseCase-First 접근
 */
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { TodayReviewsPage } from './TodayReviewsPage';
import { AuthContext } from '../../contexts/AuthContext';
import type { GetTodayReviewsResponse, ReviewQueueItem } from './TodayReviewsPage';

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

const meta: Meta<typeof TodayReviewsPage> = {
  title: 'SRS/TodayReviews/GetTodayReviewsUseCase',
  component: TodayReviewsPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# GetTodayReviewsUseCase UI 표면

**UseCase → UI 매핑**: \`GetTodayReviewsUseCase\` + \`SubmitReviewFeedbackUseCase\` → \`TodayReviewsPage\`

## 4가지 상태 스토리
- **Loading**: 복습 목록 로딩 중 상태 (Skeleton UI)
- **Empty**: 복습할 항목이 없는 상태 (모든 복습 완료)
- **Error**: API 호출 실패 상태 (네트워크 오류 등)
- **OK**: 복습 목록이 있는 정상 상태 (우선순위별 정렬)

## Application DTO 기반
복습 데이터는 \`GetTodayReviewsResponse\` 및 \`ReviewQueueItem\` DTO를 직접 사용 (DTO-First 원칙)

## 복습 세션 플로우
1. 복습 목록 조회 → 2. 복습 세션 시작 → 3. 문제별 피드백 제출 → 4. 다음 문제 또는 완료
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
            <Story />
          </AuthContext.Provider>
        </QueryClientProvider>
      </BrowserRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock 데이터: Application DTO 형태 그대로 사용
const mockReviewsHigh: GetTodayReviewsResponse = {
  reviews: [
    {
      scheduleId: 'sched-1',
      studentId: 'student-1',
      problemId: 'prob-math-001',
      nextReviewAt: new Date(Date.now() - 30 * 60 * 1000), // 30분 지남
      currentInterval: 1,
      easeFactor: 2.5,
      reviewCount: 3,
      consecutiveFailures: 2,
      priority: 'high',
      isOverdue: true,
      minutesUntilDue: -30,
      difficultyLevel: 'intermediate',
      retentionProbability: 0.45
    },
    {
      scheduleId: 'sched-2',
      studentId: 'student-1',
      problemId: 'prob-eng-002',
      nextReviewAt: new Date(Date.now() + 15 * 60 * 1000), // 15분 후
      currentInterval: 4,
      easeFactor: 2.8,
      reviewCount: 8,
      consecutiveFailures: 0,
      priority: 'medium',
      isOverdue: false,
      minutesUntilDue: 15,
      difficultyLevel: 'beginner',
      retentionProbability: 0.85
    },
    {
      scheduleId: 'sched-3',
      studentId: 'student-1',
      problemId: 'prob-sci-003',
      nextReviewAt: new Date(Date.now() + 120 * 60 * 1000), // 2시간 후
      currentInterval: 10,
      easeFactor: 3.2,
      reviewCount: 15,
      consecutiveFailures: 0,
      priority: 'low',
      isOverdue: false,
      minutesUntilDue: 120,
      difficultyLevel: 'advanced',
      retentionProbability: 0.92
    }
  ],
  totalCount: 3,
  highPriorityCount: 1,
  overdueCount: 1,
  upcomingCount: 1
};

const mockReviewsEmpty: GetTodayReviewsResponse = {
  reviews: [],
  totalCount: 0,
  highPriorityCount: 0,
  overdueCount: 0,
  upcomingCount: 0
};

/**
 * 🔄 Loading State
 * GetTodayReviewsUseCase 호출 중인 상태
 * Skeleton UI 표시
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/srs/today-reviews/:studentId', () => {
          return new Promise(() => {}); // 무한 로딩
        }),
      ],
    },
  },
};

/**
 * 📭 Empty State  
 * 오늘 복습할 항목이 없는 상태
 * "모든 복습을 완료했어요!" 메시지 표시
 */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/srs/today-reviews/:studentId', () => {
          return HttpResponse.json(mockReviewsEmpty);
        }),
      ],
    },
  },
};

/**
 * ❌ Error State
 * API 호출 실패, 네트워크 오류 등
 * 에러 메시지 및 "다시 시도" 버튼 표시
 */
export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/srs/today-reviews/:studentId', () => {
          return HttpResponse.json(
            { error: 'Failed to load reviews' },
            { status: 500 }
          );
        }),
      ],
    },
  },
};

/**
 * ✅ OK State
 * 정상적인 복습 목록 상태
 * 우선순위별로 정렬된 복습 항목들 표시
 */
export const OK: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/srs/today-reviews/:studentId', () => {
          return HttpResponse.json(mockReviewsHigh);
        }),
        http.post('/api/srs/review-feedback', () => {
          return HttpResponse.json({ success: true });
        }),
      ],
    },
  },
};

/**
 * 🚨 High Priority Reviews
 * 연체 및 높은 우선순위 복습 항목들
 * 긴급하게 처리해야 할 복습들 강조 표시
 */
export const HighPriorityReviews: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/srs/today-reviews/:studentId', () => {
          const highPriorityReviews: GetTodayReviewsResponse = {
            reviews: [
              {
                ...mockReviewsHigh.reviews[0],
                isOverdue: true,
                minutesUntilDue: -120, // 2시간 지남
                consecutiveFailures: 3,
                retentionProbability: 0.25
              },
              {
                ...mockReviewsHigh.reviews[1],
                priority: 'high',
                minutesUntilDue: 5, // 5분 후 만료
                consecutiveFailures: 1
              }
            ],
            totalCount: 2,
            highPriorityCount: 2,
            overdueCount: 1,
            upcomingCount: 1
          };
          return HttpResponse.json(highPriorityReviews);
        }),
      ],
    },
  },
};

/**
 * 🎯 Review Session In Progress
 * 복습 세션이 진행 중인 상태
 * 문제 표시 → 답안 보기 → 피드백 제출 플로우
 */
export const ReviewSessionInProgress: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/srs/today-reviews/:studentId', () => {
          return HttpResponse.json(mockReviewsHigh);
        }),
        http.post('/api/srs/review-feedback', () => {
          // 피드백 제출 시뮬레이션
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(HttpResponse.json({ success: true }));
            }, 1000);
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    // 복습 시작 버튼 자동 클릭하여 세션 시작
    const canvas = canvasElement;
    const startButton = canvas.querySelector('button:contains("복습 시작")') as HTMLButtonElement;
    
    if (startButton) {
      setTimeout(() => startButton.click(), 1000);
    }
  },
};

/**
 * 📱 Mobile View
 * 모바일 뷰포트에서의 복습 인터페이스
 * 터치 친화적 UI 확인
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    msw: {
      handlers: [
        http.get('/api/srs/today-reviews/:studentId', () => {
          return HttpResponse.json(mockReviewsHigh);
        }),
      ],
    },
  },
};