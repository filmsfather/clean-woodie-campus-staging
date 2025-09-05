// SearchProblemsUseCase Storybook - 4가지 상태 (Loading/Empty/Error/OK)
import type { Meta, StoryObj } from '@storybook/react';
import { ProblemSearch } from './ProblemSearch';
import { ProblemSearchState } from '../../types/problems';

const meta: Meta<typeof ProblemSearch> = {
  title: 'Problems/ProblemSearch',
  component: ProblemSearch,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 1. Loading 상태 (검색 중)
export const Loading: Story = {
  args: {
    state: {
      searchRequest: {
        searchQuery: '이차방정식',
        types: ['multiple_choice'],
        difficulties: [5],
        tags: ['수학'],
        isActive: true
      },
      results: null,
      isLoading: true,
      error: null
    } as ProblemSearchState,
    onSearch: (request) => console.log('Search request:', request),
    onClearSearch: () => console.log('Clear search')
  }
};

// 2. Empty 상태 (검색 결과 없음)
export const Empty: Story = {
  args: {
    state: {
      searchRequest: {
        searchQuery: '존재하지않는문제',
        types: ['multiple_choice'],
        difficulties: [10],
        tags: ['없는태그'],
        isActive: true
      },
      results: {
        problems: [],
        totalCount: 0,
        metadata: {
          hasNextPage: false,
          hasPreviousPage: false,
          appliedFilters: ['searchQuery', 'types', 'difficulties', 'tags', 'isActive'],
          searchDurationMs: 45
        }
      },
      isLoading: false,
      error: null
    } as ProblemSearchState,
    onSearch: (request) => console.log('Search request:', request),
    onClearSearch: () => console.log('Clear search')
  }
};

// 3. Error 상태 (검색 오류)
export const Error: Story = {
  args: {
    state: {
      searchRequest: {
        searchQuery: '수학',
        types: ['multiple_choice']
      },
      results: null,
      isLoading: false,
      error: '검색 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
    } as ProblemSearchState,
    onSearch: (request) => console.log('Search request:', request),
    onClearSearch: () => console.log('Clear search')
  }
};

// 4. OK 상태 (검색 결과 있음)
export const OK: Story = {
  args: {
    state: {
      searchRequest: {
        searchQuery: '수학',
        types: ['multiple_choice', 'short_answer'],
        difficulties: [3, 4, 5],
        tags: ['수학', '대수'],
        isActive: true
      },
      results: {
        problems: [
          {
            id: '1',
            teacherId: 'teacher-1',
            title: '이차방정식의 해 구하기',
            description: '주어진 이차방정식의 해를 구하는 문제입니다.',
            type: 'multiple_choice',
            difficulty: 5,
            tags: ['수학', '대수', '이차방정식'],
            isActive: true,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            teacherId: 'teacher-1',
            title: '연립방정식 풀이',
            description: '두 개의 일차방정식으로 이루어진 연립방정식을 해결하세요.',
            type: 'short_answer',
            difficulty: 4,
            tags: ['수학', '대수', '연립방정식'],
            isActive: true,
            createdAt: '2024-01-14T14:20:00Z',
            updatedAt: '2024-01-16T09:15:00Z'
          },
          {
            id: '3',
            teacherId: 'teacher-2',
            title: '부등식의 해 구간',
            description: '주어진 부등식의 해를 구간으로 나타내시오.',
            type: 'multiple_choice',
            difficulty: 3,
            tags: ['수학', '대수', '부등식'],
            isActive: true,
            createdAt: '2024-01-13T16:45:00Z',
            updatedAt: '2024-01-13T16:45:00Z'
          }
        ],
        totalCount: 12,
        metadata: {
          hasNextPage: true,
          hasPreviousPage: false,
          appliedFilters: ['searchQuery', 'types', 'difficulties', 'tags', 'isActive'],
          searchDurationMs: 127
        }
      },
      isLoading: false,
      error: null
    } as ProblemSearchState,
    onSearch: (request) => console.log('Search request:', request),
    onClearSearch: () => console.log('Clear search')
  }
};

// 5. OK 상태 - 필터 없이 검색
export const OKSimpleSearch: Story = {
  args: {
    state: {
      searchRequest: {
        searchQuery: '미적분'
      },
      results: {
        problems: [
          {
            id: '4',
            teacherId: 'teacher-1',
            title: '미적분 기본 정리',
            description: '미적분의 기본 정리를 적용하여 문제를 해결하세요.',
            type: 'short_answer',
            difficulty: 8,
            tags: ['수학', '미적분'],
            isActive: true,
            createdAt: '2024-01-14T14:20:00Z',
            updatedAt: '2024-01-16T09:15:00Z'
          }
        ],
        totalCount: 1,
        metadata: {
          hasNextPage: false,
          hasPreviousPage: false,
          appliedFilters: ['searchQuery'],
          searchDurationMs: 89
        }
      },
      isLoading: false,
      error: null
    } as ProblemSearchState,
    onSearch: (request) => console.log('Search request:', request),
    onClearSearch: () => console.log('Clear search')
  }
};

// 6. Initial 상태 (아직 검색하지 않음)
export const Initial: Story = {
  args: {
    state: {
      searchRequest: {},
      results: null,
      isLoading: false,
      error: null
    } as ProblemSearchState,
    onSearch: (request) => console.log('Search request:', request),
    onClearSearch: () => console.log('Clear search')
  }
};