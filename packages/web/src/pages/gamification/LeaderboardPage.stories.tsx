import type { Meta, StoryObj } from '@storybook/react';
import { LeaderboardPage } from './LeaderboardPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { http, HttpResponse } from 'msw';

const meta = {
  title: 'Pages/Gamification/LeaderboardPage',
  component: LeaderboardPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### GetLeaderboardsUseCase → LeaderboardPage

각종 게임화 리더보드 및 순위표 UI 표면입니다.

**주요 기능:**
- 토큰 잔액, 총 획득 토큰, 업적, 주간 토큰 순위 표시
- TOP 3 하이라이트 및 순위 변동 표시
- 개인 순위 카드 및 백분위 정보
- 배지 시스템 및 성과 표시
- 순위 상승 팁 제공

**DTO-First 원칙:**
- Application Layer의 LeaderboardSummaryDto 직접 사용
- UI 상태 모델 대신 GetLeaderboardsResponse 타입 활용

**Feature Flag:**
- \`leaderboards\` 플래그로 접근 제어
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
          <MemoryRouter initialEntries={['/gamification/leaderboard']}>
            <AuthProvider mockUser={mockUser}>
              <Story />
            </AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof LeaderboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// MSW 핸들러들
const successHandlers = [
  http.get('/api/leaderboards', () => {
    return HttpResponse.json({
      tokenBalance: {
        type: 'token_balance',
        displayName: '토큰 잔액',
        entries: [
          {
            id: 'entry-1',
            studentId: 'student-1',
            studentName: '학생 A',
            rank: 1,
            score: 2450,
            rankChange: 2,
            badges: ['🏆', '🔥']
          },
          {
            id: 'entry-2',
            studentId: 'student-2',
            studentName: '학생 B',
            rank: 2,
            score: 1980,
            rankChange: -1,
            badges: ['⭐']
          },
          {
            id: 'entry-3',
            studentId: 'student-3',
            studentName: '학생 C',
            rank: 3,
            score: 1750,
            rankChange: 1,
            badges: ['💎']
          },
          {
            id: 'entry-4',
            studentId: 'student-4',
            studentName: '학생 D',
            rank: 4,
            score: 1620,
            rankChange: 0,
            badges: []
          },
          {
            id: 'entry-5',
            studentId: 'student-5',
            studentName: '학생 E',
            rank: 5,
            score: 1450,
            rankChange: -2,
            badges: ['🎯']
          }
        ],
        totalEntries: 47,
        lastUpdated: new Date().toISOString(),
        currentUserRank: {
          rank: 1,
          score: 2450,
          percentile: 98
        }
      },
      tokenEarned: {
        type: 'token_earned',
        displayName: '총 획득 토큰',
        entries: [
          {
            id: 'entry-1',
            studentId: 'student-2',
            studentName: '학생 B',
            rank: 1,
            score: 5200,
            rankChange: 0,
            badges: ['🏆', '💰']
          },
          {
            id: 'entry-2',
            studentId: 'student-1',
            studentName: '학생 A',
            rank: 2,
            score: 4850,
            rankChange: 1,
            badges: ['🔥', '⚡']
          },
          {
            id: 'entry-3',
            studentId: 'student-3',
            studentName: '학생 C',
            rank: 3,
            score: 4200,
            rankChange: -1,
            badges: ['💎', '🎯']
          }
        ],
        totalEntries: 47,
        lastUpdated: new Date().toISOString(),
        currentUserRank: {
          rank: 2,
          score: 4850,
          percentile: 96
        }
      },
      achievements: {
        type: 'achievements',
        displayName: '업적 개수',
        entries: [
          {
            id: 'entry-1',
            studentId: 'student-3',
            studentName: '학생 C',
            rank: 1,
            score: 28,
            rankChange: 2,
            badges: ['🏆', '🌟', '💫']
          },
          {
            id: 'entry-2',
            studentId: 'student-1',
            studentName: '학생 A',
            rank: 2,
            score: 25,
            rankChange: -1,
            badges: ['🔥', '⚡', '💎']
          },
          {
            id: 'entry-3',
            studentId: 'student-2',
            studentName: '학생 B',
            rank: 3,
            score: 22,
            rankChange: 0,
            badges: ['⭐', '🎯']
          }
        ],
        totalEntries: 47,
        lastUpdated: new Date().toISOString(),
        currentUserRank: {
          rank: 2,
          score: 25,
          percentile: 96
        }
      },
      weeklyTokens: {
        type: 'weekly_tokens',
        displayName: '이번 주 토큰',
        entries: [
          {
            id: 'entry-1',
            studentId: 'student-1',
            studentName: '학생 A',
            rank: 1,
            score: 850,
            rankChange: 3,
            badges: ['🚀', '🔥']
          },
          {
            id: 'entry-2',
            studentId: 'student-3',
            studentName: '학생 C',
            rank: 2,
            score: 720,
            rankChange: 1,
            badges: ['⚡']
          },
          {
            id: 'entry-3',
            studentId: 'student-2',
            studentName: '학생 B',
            rank: 3,
            score: 680,
            rankChange: -2,
            badges: ['💎']
          }
        ],
        totalEntries: 47,
        lastUpdated: new Date().toISOString(),
        periodStart: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        periodEnd: new Date().toISOString(),
        currentUserRank: {
          rank: 1,
          score: 850,
          percentile: 98
        }
      }
    });
  }),
];

const emptyHandlers = [
  http.get('/api/leaderboards', () => {
    return HttpResponse.json({
      tokenBalance: {
        type: 'token_balance',
        displayName: '토큰 잔액',
        entries: [],
        totalEntries: 0,
        lastUpdated: new Date().toISOString(),
        currentUserRank: undefined
      },
      tokenEarned: {
        type: 'token_earned',
        displayName: '총 획득 토큰',
        entries: [],
        totalEntries: 0,
        lastUpdated: new Date().toISOString(),
        currentUserRank: undefined
      },
      achievements: {
        type: 'achievements',
        displayName: '업적 개수',
        entries: [],
        totalEntries: 0,
        lastUpdated: new Date().toISOString(),
        currentUserRank: undefined
      },
      weeklyTokens: {
        type: 'weekly_tokens',
        displayName: '이번 주 토큰',
        entries: [],
        totalEntries: 0,
        lastUpdated: new Date().toISOString(),
        periodStart: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        periodEnd: new Date().toISOString(),
        currentUserRank: undefined
      }
    });
  }),
];

const errorHandlers = [
  http.get('/api/leaderboards', () => {
    return HttpResponse.json(
      { error: 'Failed to load leaderboards' },
      { status: 500 }
    );
  }),
];

const loadingHandlers = [
  http.get('/api/leaderboards', async () => {
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
        story: '리더보드 데이터를 로딩 중인 상태입니다.',
      },
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: { handlers: emptyHandlers },
    docs: {
      description: {
        story: '참가자가 없어서 리더보드가 비어있는 상태입니다.',
      },
    },
  },
};

export const Error: Story = {
  parameters: {
    msw: { handlers: errorHandlers },
    docs: {
      description: {
        story: '리더보드 데이터 로딩에 실패한 상태입니다. 네트워크 오류나 서버 문제가 발생했습니다.',
      },
    },
  },
};

export const OK: Story = {
  parameters: {
    msw: { handlers: successHandlers },
    docs: {
      description: {
        story: '정상적으로 모든 리더보드가 표시된 상태입니다. 1등 학생의 시점으로 보여집니다.',
      },
    },
  },
};

export const MiddleRankStudent: Story = {
  args: {
    user: {
      id: 'student-middle',
      email: 'middle@test.com',
      name: '중간순위학생',
      role: 'student' as const,
    },
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/leaderboards', () => {
          return HttpResponse.json({
            tokenBalance: {
              type: 'token_balance',
              displayName: '토큰 잔액',
              entries: [
                {
                  id: 'entry-1',
                  studentId: 'student-1',
                  studentName: '학생 A',
                  rank: 1,
                  score: 2450,
                  rankChange: 2,
                  badges: ['🏆', '🔥']
                },
                {
                  id: 'entry-2',
                  studentId: 'student-2',
                  studentName: '학생 B',
                  rank: 2,
                  score: 1980,
                  rankChange: -1,
                  badges: ['⭐']
                },
                {
                  id: 'entry-3',
                  studentId: 'student-3',
                  studentName: '학생 C',
                  rank: 3,
                  score: 1750,
                  rankChange: 1,
                  badges: ['💎']
                }
              ],
              totalEntries: 47,
              lastUpdated: new Date().toISOString(),
              currentUserRank: {
                rank: 25,
                score: 420,
                percentile: 47
              }
            },
            tokenEarned: {
              type: 'token_earned',
              displayName: '총 획득 토큰',
              entries: [
                {
                  id: 'entry-1',
                  studentId: 'student-2',
                  studentName: '학생 B',
                  rank: 1,
                  score: 5200,
                  rankChange: 0,
                  badges: ['🏆', '💰']
                },
                {
                  id: 'entry-2',
                  studentId: 'student-1',
                  studentName: '학생 A',
                  rank: 2,
                  score: 4850,
                  rankChange: 1,
                  badges: ['🔥', '⚡']
                }
              ],
              totalEntries: 47,
              lastUpdated: new Date().toISOString(),
              currentUserRank: {
                rank: 28,
                score: 1200,
                percentile: 40
              }
            },
            achievements: {
              type: 'achievements',
              displayName: '업적 개수',
              entries: [
                {
                  id: 'entry-1',
                  studentId: 'student-3',
                  studentName: '학생 C',
                  rank: 1,
                  score: 28,
                  rankChange: 2,
                  badges: ['🏆', '🌟', '💫']
                }
              ],
              totalEntries: 47,
              lastUpdated: new Date().toISOString(),
              currentUserRank: {
                rank: 32,
                score: 8,
                percentile: 32
              }
            },
            weeklyTokens: {
              type: 'weekly_tokens',
              displayName: '이번 주 토큰',
              entries: [
                {
                  id: 'entry-1',
                  studentId: 'student-1',
                  studentName: '학생 A',
                  rank: 1,
                  score: 850,
                  rankChange: 3,
                  badges: ['🚀', '🔥']
                }
              ],
              totalEntries: 47,
              lastUpdated: new Date().toISOString(),
              periodStart: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
              periodEnd: new Date().toISOString(),
              currentUserRank: {
                rank: 20,
                score: 150,
                percentile: 58
              }
            }
          });
        }),
      ],
    },
    docs: {
      description: {
        story: '중간 순위에 있는 학생의 리더보드입니다. 개선할 여지가 많은 순위를 보여줍니다.',
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
        story: '교사나 관리자가 리더보드에 접근한 경우입니다. 개인 순위는 표시되지 않습니다.',
      },
    },
  },
};