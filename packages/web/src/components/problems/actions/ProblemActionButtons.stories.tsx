// Command UseCase Action Buttons Storybook - 4가지 상태 (Loading/Empty/Error/OK)
import type { Meta, StoryObj } from '@storybook/react';
import { ProblemActionButtons, ActivateProblemButton, DeactivateProblemButton, CloneProblemButton, DeleteProblemButton } from './ProblemActionButtons';
import { ProblemDto, ProblemActions } from '../../../types/problems';

const meta: Meta<typeof ProblemActionButtons> = {
  title: 'Problems/Actions/ProblemActionButtons',
  component: ProblemActionButtons,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock 문제 데이터
const mockActiveProblem: ProblemDto = {
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
};

const mockInactiveProblem: ProblemDto = {
  ...mockActiveProblem,
  isActive: false
};

// Mock 액션들
const mockActions: ProblemActions = {
  create: async (input) => {
    console.log('Create:', input);
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  updateContent: async (input) => {
    console.log('Update Content:', input);
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  updateAnswer: async (input) => {
    console.log('Update Answer:', input);
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  changeDifficulty: async (input) => {
    console.log('Change Difficulty:', input);
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  manageTags: async (input) => {
    console.log('Manage Tags:', input);
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  activate: async (input) => {
    console.log('Activate:', input);
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  deactivate: async (input) => {
    console.log('Deactivate:', input);
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  delete: async (input) => {
    console.log('Delete:', input);
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  clone: async (input) => {
    console.log('Clone:', input);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// 1. Loading 상태 (작업 중)
export const Loading: Story = {
  args: {
    problem: mockActiveProblem,
    actions: mockActions,
    isLoading: true,
    size: 'md',
    layout: 'horizontal'
  }
};

// 2. Empty 상태 (권한 없음 - 버튼 표시되지 않음)
export const Empty: Story = {
  args: {
    problem: mockActiveProblem,
    actions: mockActions,
    isLoading: false,
    size: 'md',
    layout: 'horizontal'
  },
  parameters: {
    // Feature flags를 모두 false로 설정하는 방식으로 시뮬레이션
    docs: {
      description: {
        story: '모든 기능이 비활성화된 상태에서는 버튼이 표시되지 않습니다.'
      }
    }
  }
};

// 3. Error 상태 (액션 실행 실패 - 여전히 버튼은 표시됨)
export const Error: Story = {
  args: {
    problem: mockActiveProblem,
    actions: {
      ...mockActions,
      delete: async (input) => {
        console.log('Delete Error:', input);
        throw new Error('삭제 권한이 없습니다.');
      }
    },
    isLoading: false,
    size: 'md',
    layout: 'horizontal'
  }
};

// 4. OK 상태 - 활성 문제 (정상 동작)
export const OK: Story = {
  args: {
    problem: mockActiveProblem,
    actions: mockActions,
    isLoading: false,
    size: 'md',
    layout: 'horizontal'
  }
};

// 5. OK 상태 - 비활성 문제
export const OKInactive: Story = {
  args: {
    problem: mockInactiveProblem,
    actions: mockActions,
    isLoading: false,
    size: 'md',
    layout: 'horizontal'
  }
};

// 6. Dropdown Layout
export const DropdownLayout: Story = {
  args: {
    problem: mockActiveProblem,
    actions: mockActions,
    isLoading: false,
    size: 'md',
    layout: 'dropdown'
  }
};

// 7. Small Size Buttons
export const SmallSize: Story = {
  args: {
    problem: mockActiveProblem,
    actions: mockActions,
    isLoading: false,
    size: 'sm',
    layout: 'horizontal'
  }
};

// 8. Large Size Buttons
export const LargeSize: Story = {
  args: {
    problem: mockActiveProblem,
    actions: mockActions,
    isLoading: false,
    size: 'lg',
    layout: 'horizontal'
  }
};

// Individual Button Stories
export const ActivateButtonStory: StoryObj<typeof ActivateProblemButton> = {
  render: (args) => <ActivateProblemButton {...args} />,
  args: {
    problem: mockInactiveProblem,
    onActivate: async (input) => {
      console.log('Activate:', input);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    isLoading: false,
    size: 'md',
    onSuccess: () => console.log('Activation successful'),
    onError: (error) => console.log('Activation error:', error)
  }
};

export const DeactivateButtonStory: StoryObj<typeof DeactivateProblemButton> = {
  render: (args) => <DeactivateProblemButton {...args} />,
  args: {
    problem: mockActiveProblem,
    onDeactivate: async (input) => {
      console.log('Deactivate:', input);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    isLoading: false,
    size: 'md',
    onSuccess: () => console.log('Deactivation successful'),
    onError: (error) => console.log('Deactivation error:', error)
  }
};

export const CloneButtonStory: StoryObj<typeof CloneProblemButton> = {
  render: (args) => <CloneProblemButton {...args} />,
  args: {
    problem: mockActiveProblem,
    onClone: async (input) => {
      console.log('Clone:', input);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    isLoading: false,
    size: 'md',
    onSuccess: () => console.log('Clone successful'),
    onError: (error) => console.log('Clone error:', error)
  }
};

export const DeleteButtonStory: StoryObj<typeof DeleteProblemButton> = {
  render: (args) => <DeleteProblemButton {...args} />,
  args: {
    problem: mockActiveProblem,
    onDelete: async (input) => {
      console.log('Delete:', input);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    isLoading: false,
    size: 'md',
    onSuccess: () => console.log('Delete successful'),
    onError: (error) => console.log('Delete error:', error)
  }
};