// GetProblemUseCase Storybook - 4가지 상태 (Loading/Empty/Error/OK)
import type { Meta, StoryObj } from '@storybook/react';
import { ProblemDetail } from './ProblemDetail';
import { ProblemDetailState, ProblemDetailDto } from '../../types/problems';

const meta: Meta<typeof ProblemDetail> = {
  title: 'Problems/ProblemDetail',
  component: ProblemDetail,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock 문제 데이터
const mockProblemDetail: ProblemDetailDto = {
  id: '1',
  teacherId: 'teacher-1',
  title: '이차방정식의 해 구하기',
  description: '주어진 이차방정식 ax² + bx + c = 0에서 판별식을 이용하여 해의 개수와 해를 구하는 문제입니다.',
  type: 'multiple_choice',
  difficulty: 5,
  tags: ['수학', '대수', '이차방정식', '판별식'],
  isActive: true,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-16T14:20:00Z',
  content: {
    type: 'multiple_choice',
    title: '이차방정식의 해 구하기',
    description: '주어진 이차방정식 ax² + bx + c = 0에서 판별식을 이용하여 해의 개수와 해를 구하는 문제입니다.',
    instructions: '다음 이차방정식 2x² - 5x + 2 = 0의 해를 구하시오.',
    choices: [
      '1) x = 1/2, x = 2',
      '2) x = 1, x = 3',
      '3) x = -1/2, x = -2',
      '4) x = 2, x = 3',
      '5) 해가 없다'
    ]
  },
  correctAnswer: {
    type: 'multiple_choice',
    points: 10
  }
};

// 1. Loading 상태
export const Loading: Story = {
  args: {
    state: {
      problem: null,
      isLoading: true,
      error: null
    } as ProblemDetailState,
    onEdit: () => console.log('Edit problem'),
    onEditAnswer: () => console.log('Edit answer'),
    onChangeDifficulty: () => console.log('Change difficulty'),
    onManageTags: () => console.log('Manage tags'),
    onActivate: () => console.log('Activate problem'),
    onDeactivate: () => console.log('Deactivate problem'),
    onClone: () => console.log('Clone problem'),
    onDelete: () => console.log('Delete problem'),
    onBack: () => console.log('Go back')
  }
};

// 2. Empty 상태 (문제를 찾을 수 없음)
export const Empty: Story = {
  args: {
    state: {
      problem: null,
      isLoading: false,
      error: null
    } as ProblemDetailState,
    onEdit: () => console.log('Edit problem'),
    onEditAnswer: () => console.log('Edit answer'),
    onChangeDifficulty: () => console.log('Change difficulty'),
    onManageTags: () => console.log('Manage tags'),
    onActivate: () => console.log('Activate problem'),
    onDeactivate: () => console.log('Deactivate problem'),
    onClone: () => console.log('Clone problem'),
    onDelete: () => console.log('Delete problem'),
    onBack: () => console.log('Go back')
  }
};

// 3. Error 상태
export const Error: Story = {
  args: {
    state: {
      problem: null,
      isLoading: false,
      error: '문제를 불러오는 중 오류가 발생했습니다. 권한이 없거나 문제가 삭제되었을 수 있습니다.'
    } as ProblemDetailState,
    onEdit: () => console.log('Edit problem'),
    onEditAnswer: () => console.log('Edit answer'),
    onChangeDifficulty: () => console.log('Change difficulty'),
    onManageTags: () => console.log('Manage tags'),
    onActivate: () => console.log('Activate problem'),
    onDeactivate: () => console.log('Deactivate problem'),
    onClone: () => console.log('Clone problem'),
    onDelete: () => console.log('Delete problem'),
    onBack: () => console.log('Go back')
  }
};

// 4. OK 상태 - 활성 문제
export const OK: Story = {
  args: {
    state: {
      problem: mockProblemDetail,
      isLoading: false,
      error: null
    } as ProblemDetailState,
    onEdit: () => console.log('Edit problem'),
    onEditAnswer: () => console.log('Edit answer'),
    onChangeDifficulty: () => console.log('Change difficulty'),
    onManageTags: () => console.log('Manage tags'),
    onActivate: () => console.log('Activate problem'),
    onDeactivate: () => console.log('Deactivate problem'),
    onClone: () => console.log('Clone problem'),
    onDelete: () => console.log('Delete problem'),
    onBack: () => console.log('Go back')
  }
};

// 5. OK 상태 - 비활성 문제
export const OKInactive: Story = {
  args: {
    state: {
      problem: {
        ...mockProblemDetail,
        isActive: false
      },
      isLoading: false,
      error: null
    } as ProblemDetailState,
    onEdit: () => console.log('Edit problem'),
    onEditAnswer: () => console.log('Edit answer'),
    onChangeDifficulty: () => console.log('Change difficulty'),
    onManageTags: () => console.log('Manage tags'),
    onActivate: () => console.log('Activate problem'),
    onDeactivate: () => console.log('Deactivate problem'),
    onClone: () => console.log('Clone problem'),
    onDelete: () => console.log('Delete problem'),
    onBack: () => console.log('Go back')
  }
};

// 6. OK 상태 - 태그 없는 문제
export const OKNoTags: Story = {
  args: {
    state: {
      problem: {
        ...mockProblemDetail,
        tags: [],
        description: null
      },
      isLoading: false,
      error: null
    } as ProblemDetailState,
    onEdit: () => console.log('Edit problem'),
    onEditAnswer: () => console.log('Edit answer'),
    onChangeDifficulty: () => console.log('Change difficulty'),
    onManageTags: () => console.log('Manage tags'),
    onActivate: () => console.log('Activate problem'),
    onDeactivate: () => console.log('Deactivate problem'),
    onClone: () => console.log('Clone problem'),
    onDelete: () => console.log('Delete problem'),
    onBack: () => console.log('Go back')
  }
};

// 7. OK 상태 - 단답형 문제
export const OKShortAnswer: Story = {
  args: {
    state: {
      problem: {
        ...mockProblemDetail,
        type: 'short_answer',
        content: {
          type: 'short_answer',
          title: '미분의 정의',
          description: '함수의 극한을 이용한 미분의 정의를 설명하시오.',
          instructions: 'f\'(x) = lim(h→0) [f(x+h) - f(x)]/h 에서 시작하여 설명하세요.',
          placeholder: '예시: f\'(x) = lim(h→0) ...'
        },
        correctAnswer: {
          type: 'short_answer',
          points: 15
        }
      },
      isLoading: false,
      error: null
    } as ProblemDetailState,
    onEdit: () => console.log('Edit problem'),
    onEditAnswer: () => console.log('Edit answer'),
    onChangeDifficulty: () => console.log('Change difficulty'),
    onManageTags: () => console.log('Manage tags'),
    onActivate: () => console.log('Activate problem'),
    onDeactivate: () => console.log('Deactivate problem'),
    onClone: () => console.log('Clone problem'),
    onDelete: () => console.log('Delete problem'),
    onBack: () => console.log('Go back')
  }
};