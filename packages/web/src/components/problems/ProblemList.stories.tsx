// GetProblemListUseCase Storybook - 4가지 상태 (Loading/Empty/Error/OK)
import type { Meta, StoryObj } from '@storybook/react';
import { ProblemList } from './ProblemList';
import { ProblemListState } from '../../types/problems';

const meta: Meta<typeof ProblemList> = {
  title: 'Problems/ProblemList',
  component: ProblemList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock 데이터
const mockProblems = [
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
    title: '미적분 기본 정리',
    description: '미적분의 기본 정리를 적용하여 문제를 해결하세요.',
    type: 'short_answer',
    difficulty: 8,
    tags: ['수학', '미적분'],
    isActive: false,
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-16T09:15:00Z'
  },
  {
    id: '3',
    teacherId: 'teacher-1',
    title: '물리 운동법칙',
    description: null,
    type: 'essay',
    difficulty: 6,
    tags: ['물리', '운동', '법칙'],
    isActive: true,
    createdAt: '2024-01-13T16:45:00Z',
    updatedAt: '2024-01-13T16:45:00Z'
  }
];

// 1. Loading 상태
export const Loading: Story = {
  args: {
    state: {
      problems: [],
      totalCount: 0,
      page: 1,
      limit: 20,
      hasNext: false,
      isLoading: true,
      error: null
    } as ProblemListState,
    onProblemSelect: (id: string) => console.log('Selected problem:', id),
    onCreateNew: () => console.log('Create new problem'),
    onClone: (id: string) => console.log('Clone problem:', id),
    onActivate: (id: string) => console.log('Activate problem:', id),
    onDeactivate: (id: string) => console.log('Deactivate problem:', id),
    onDelete: (id: string) => console.log('Delete problem:', id),
    onLoadMore: () => console.log('Load more problems')
  }
};

// 2. Empty 상태 (데이터 없음)
export const Empty: Story = {
  args: {
    state: {
      problems: [],
      totalCount: 0,
      page: 1,
      limit: 20,
      hasNext: false,
      isLoading: false,
      error: null
    } as ProblemListState,
    onProblemSelect: (id: string) => console.log('Selected problem:', id),
    onCreateNew: () => console.log('Create new problem'),
    onClone: (id: string) => console.log('Clone problem:', id),
    onActivate: (id: string) => console.log('Activate problem:', id),
    onDeactivate: (id: string) => console.log('Deactivate problem:', id),
    onDelete: (id: string) => console.log('Delete problem:', id),
    onLoadMore: () => console.log('Load more problems')
  }
};

// 3. Error 상태
export const Error: Story = {
  args: {
    state: {
      problems: [],
      totalCount: 0,
      page: 1,
      limit: 20,
      hasNext: false,
      isLoading: false,
      error: '서버와의 연결에 실패했습니다. 네트워크 상태를 확인하고 다시 시도해주세요.'
    } as ProblemListState,
    onProblemSelect: (id: string) => console.log('Selected problem:', id),
    onCreateNew: () => console.log('Create new problem'),
    onClone: (id: string) => console.log('Clone problem:', id),
    onActivate: (id: string) => console.log('Activate problem:', id),
    onDeactivate: (id: string) => console.log('Deactivate problem:', id),
    onDelete: (id: string) => console.log('Delete problem:', id),
    onLoadMore: () => console.log('Load more problems')
  }
};

// 4. OK 상태 (정상 데이터)
export const OK: Story = {
  args: {
    state: {
      problems: mockProblems,
      totalCount: 15,
      page: 1,
      limit: 20,
      hasNext: false,
      isLoading: false,
      error: null
    } as ProblemListState,
    onProblemSelect: (id: string) => console.log('Selected problem:', id),
    onCreateNew: () => console.log('Create new problem'),
    onClone: (id: string) => console.log('Clone problem:', id),
    onActivate: (id: string) => console.log('Activate problem:', id),
    onDeactivate: (id: string) => console.log('Deactivate problem:', id),
    onDelete: (id: string) => console.log('Delete problem:', id),
    onLoadMore: () => console.log('Load more problems')
  }
};

// 5. OK with More Data (페이지네이션 포함)
export const OKWithMore: Story = {
  args: {
    state: {
      problems: mockProblems,
      totalCount: 45,
      page: 1,
      limit: 3,
      hasNext: true,
      isLoading: false,
      error: null
    } as ProblemListState,
    onProblemSelect: (id: string) => console.log('Selected problem:', id),
    onCreateNew: () => console.log('Create new problem'),
    onClone: (id: string) => console.log('Clone problem:', id),
    onActivate: (id: string) => console.log('Activate problem:', id),
    onDeactivate: (id: string) => console.log('Deactivate problem:', id),
    onDelete: (id: string) => console.log('Delete problem:', id),
    onLoadMore: () => console.log('Load more problems')
  }
};

// 6. Loading More (추가 로딩 중)
export const LoadingMore: Story = {
  args: {
    state: {
      problems: mockProblems,
      totalCount: 45,
      page: 1,
      limit: 3,
      hasNext: true,
      isLoading: true, // 추가 로딩 중
      error: null
    } as ProblemListState,
    onProblemSelect: (id: string) => console.log('Selected problem:', id),
    onCreateNew: () => console.log('Create new problem'),
    onClone: (id: string) => console.log('Clone problem:', id),
    onActivate: (id: string) => console.log('Activate problem:', id),
    onDeactivate: (id: string) => console.log('Deactivate problem:', id),
    onDelete: (id: string) => console.log('Delete problem:', id),
    onLoadMore: () => console.log('Load more problems')
  }
};