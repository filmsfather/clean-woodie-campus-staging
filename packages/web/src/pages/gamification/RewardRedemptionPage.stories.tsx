import type { Meta, StoryObj } from '@storybook/react';
import { RewardRedemptionPage } from './RewardRedemptionPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { http, HttpResponse } from 'msw';

const meta = {
  title: 'Pages/Gamification/RewardRedemptionPage',
  component: RewardRedemptionPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### RedeemRewardUseCase → RewardRedemptionPage

보상 교환 및 토큰 시스템 UI 표면입니다.

**주요 기능:**
- 보상 카탈로그 표시 및 카테고리 필터링
- 토큰 잔액 표시 및 교환 가능 여부 확인
- 보상 교환 확인 모달 및 프로세스 처리
- 최근 교환 내역 표시
- 토큰 획득 방법 안내

**DTO-First 원칙:**
- Application Layer의 RewardDto, RewardRedemptionDto 직접 사용
- UI 상태 모델 대신 GetAvailableRewardsResponse 타입 활용

**Feature Flag:**
- \`rewards\` 플래그로 접근 제어
        `,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity } },
      });

      // Mock user data based on story
      const mockUser = context.args.user || {
        id: 'student-1',
        email: 'student@test.com',
        name: '학생 테스트',
        role: 'student' as const,
      };

      return (
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/gamification/rewards']}>
            <AuthProvider mockUser={mockUser}>
              <Story />
            </AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof RewardRedemptionPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// MSW 핸들러들
const successHandlers = [
  http.get('/api/rewards/available', () => {
    return HttpResponse.json({
      rewards: [
        {
          id: 'reward-1',
          code: 'digital-badge-first-place',
          name: '1등 달성 배지',
          description: '처음으로 1등을 달성한 학생에게 주어지는 특별한 배지입니다.',
          category: 'digital_badge',
          tokenCost: 500,
          currentRedemptions: 12,
          isActive: true,
          iconUrl: '🥇',
          createdAt: new Date().toISOString(),
          isAvailable: true,
          canAfford: true
        },
        {
          id: 'reward-2',
          code: 'feature-unlock-advanced-stats',
          name: '고급 통계 기능 잠금 해제',
          description: '상세한 학습 분석과 개인 맞춤 리포트를 확인할 수 있는 기능을 7일간 이용할 수 있습니다.',
          category: 'feature_unlock',
          tokenCost: 300,
          maxRedemptions: 1,
          currentRedemptions: 0,
          remainingStock: 1,
          isActive: true,
          iconUrl: '📊',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          isAvailable: true,
          canAfford: true
        },
        {
          id: 'reward-3',
          code: 'virtual-item-study-pet',
          name: '공부 펫 (가상 동물)',
          description: '학습을 도와주는 귀여운 가상 펫입니다. 스트릭이 유지될수록 더 건강해집니다.',
          category: 'virtual_item',
          tokenCost: 800,
          currentRedemptions: 5,
          isActive: true,
          iconUrl: '🐾',
          createdAt: new Date().toISOString(),
          isAvailable: true,
          canAfford: true
        },
        {
          id: 'reward-4',
          code: 'special-privilege-hint-pack',
          name: '문제 힌트 팩 (5개)',
          description: '어려운 문제에서 사용할 수 있는 힌트 5개를 제공합니다.',
          category: 'special_privilege',
          tokenCost: 200,
          maxRedemptions: 10,
          currentRedemptions: 3,
          remainingStock: 7,
          isActive: true,
          iconUrl: '💡',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          isAvailable: true,
          canAfford: true
        }
      ],
      categories: [
        {
          category: 'digital_badge',
          displayName: '디지털 배지',
          rewards: [],
          totalCount: 1
        },
        {
          category: 'feature_unlock',
          displayName: '기능 잠금 해제',
          rewards: [],
          totalCount: 1
        },
        {
          category: 'virtual_item',
          displayName: '가상 아이템',
          rewards: [],
          totalCount: 1
        },
        {
          category: 'special_privilege',
          displayName: '특별 혜택',
          rewards: [],
          totalCount: 1
        }
      ],
      studentTokenBalance: 1200,
      recentRedemptions: [
        {
          id: 'redemption-1',
          studentId: 'student-1',
          rewardId: 'reward-4',
          tokenCost: 200,
          status: 'completed',
          redeemedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          processingTimeMinutes: 0
        }
      ]
    });
  }),
  http.post('/api/rewards/redeem', () => {
    return HttpResponse.json({
      id: 'redemption-new',
      studentId: 'student-1',
      rewardId: 'reward-1',
      tokenCost: 500,
      status: 'completed',
      redeemedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      processingTimeMinutes: 0
    });
  }),
];

const emptyHandlers = [
  http.get('/api/rewards/available', () => {
    return HttpResponse.json({
      rewards: [],
      categories: [],
      studentTokenBalance: 50,
      recentRedemptions: []
    });
  }),
];

const errorHandlers = [
  http.get('/api/rewards/available', () => {
    return HttpResponse.json(
      { error: 'Failed to load rewards' },
      { status: 500 }
    );
  }),
];

const loadingHandlers = [
  http.get('/api/rewards/available', async () => {
    await new Promise(resolve => setTimeout(resolve, 100000)); // Never resolves
    return HttpResponse.json({});
  }),
];

// 스토리들
export const Loading: Story = {
  parameters: {
    msw: { handlers: loadingHandlers },
    docs: {
      description: {
        story: '보상 목록을 로딩 중인 상태입니다.',
      },
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: { handlers: emptyHandlers },
    docs: {
      description: {
        story: '사용 가능한 보상이 없는 상태입니다. 토큰이 부족하거나 보상이 품절된 경우입니다.',
      },
    },
  },
};

export const Error: Story = {
  parameters: {
    msw: { handlers: errorHandlers },
    docs: {
      description: {
        story: '보상 목록 로딩에 실패한 상태입니다. 네트워크 오류나 서버 문제가 발생했습니다.',
      },
    },
  },
};

export const OK: Story = {
  parameters: {
    msw: { handlers: successHandlers },
    docs: {
      description: {
        story: '정상적으로 보상 카탈로그가 표시된 상태입니다. 다양한 카테고리의 보상들을 확인하고 교환할 수 있습니다.',
      },
    },
  },
};

export const LowTokens: Story = {
  args: {
    user: {
      id: 'student-poor',
      email: 'poor@test.com',
      name: '토큰부족학생',
      role: 'student' as const,
    },
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rewards/available', () => {
          return HttpResponse.json({
            rewards: [
              {
                id: 'reward-1',
                code: 'digital-badge-first-place',
                name: '1등 달성 배지',
                description: '처음으로 1등을 달성한 학생에게 주어지는 특별한 배지입니다.',
                category: 'digital_badge',
                tokenCost: 500,
                currentRedemptions: 12,
                isActive: true,
                iconUrl: '🥇',
                createdAt: new Date().toISOString(),
                isAvailable: true,
                canAfford: false // 토큰 부족
              },
              {
                id: 'reward-4',
                code: 'special-privilege-hint-pack',
                name: '문제 힌트 팩 (5개)',
                description: '어려운 문제에서 사용할 수 있는 힌트 5개를 제공합니다.',
                category: 'special_privilege',
                tokenCost: 200,
                maxRedemptions: 10,
                currentRedemptions: 3,
                remainingStock: 7,
                isActive: true,
                iconUrl: '💡',
                createdAt: new Date().toISOString(),
                isAvailable: true,
                canAfford: false // 토큰 부족
              }
            ],
            categories: [
              {
                category: 'digital_badge',
                displayName: '디지털 배지',
                rewards: [],
                totalCount: 1
              },
              {
                category: 'special_privilege',
                displayName: '특별 혜택',
                rewards: [],
                totalCount: 1
              }
            ],
            studentTokenBalance: 150, // 낮은 토큰 잔액
            recentRedemptions: []
          });
        }),
      ],
    },
    docs: {
      description: {
        story: '토큰이 부족한 학생의 보상 상점입니다. 대부분의 보상을 교환할 수 없는 상태입니다.',
      },
    },
  },
};

export const NonStudentAccess: Story = {
  args: {
    user: {
      id: 'teacher-1',
      email: 'teacher@test.com',
      name: '선생님',
      role: 'teacher' as const,
    },
  },
  parameters: {
    msw: { handlers: successHandlers },
    docs: {
      description: {
        story: '학생이 아닌 사용자가 접근한 경우입니다. 보상 상점은 학생만 이용할 수 있습니다.',
      },
    },
  },
};