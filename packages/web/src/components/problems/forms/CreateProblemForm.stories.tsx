// CreateProblemUseCase Form Storybook - 4가지 상태 (Loading/Empty/Error/OK)
import type { Meta, StoryObj } from '@storybook/react';
import { CreateProblemForm } from './CreateProblemForm';
import { ProblemFormState } from '../../../types/problems';

const meta: Meta<typeof CreateProblemForm> = {
  title: 'Problems/Forms/CreateProblemForm',
  component: CreateProblemForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 1. Loading 상태 (제출 중)
export const Loading: Story = {
  args: {
    state: {
      isSubmitting: true,
      error: null,
      success: false
    } as ProblemFormState,
    onSubmit: (input) => console.log('Submit:', input),
    onCancel: () => console.log('Cancel'),
    initialData: {
      teacherId: 'teacher-1',
      title: '새로운 수학 문제',
      description: '이차방정식을 풀어보세요',
      type: 'multiple_choice',
      correctAnswerValue: '1',
      difficultyLevel: 5,
      tags: ['수학', '이차방정식']
    }
  }
};

// 2. Empty 상태 (초기 빈 폼)
export const Empty: Story = {
  args: {
    state: {
      isSubmitting: false,
      error: null,
      success: false
    } as ProblemFormState,
    onSubmit: (input) => console.log('Submit:', input),
    onCancel: () => console.log('Cancel'),
    initialData: {
      teacherId: 'teacher-1'
    }
  }
};

// 3. Error 상태 (제출 오류)
export const Error: Story = {
  args: {
    state: {
      isSubmitting: false,
      error: '문제 생성 중 오류가 발생했습니다. 제목과 정답을 확인하고 다시 시도해주세요.',
      success: false
    } as ProblemFormState,
    onSubmit: (input) => console.log('Submit:', input),
    onCancel: () => console.log('Cancel'),
    initialData: {
      teacherId: 'teacher-1',
      title: '잘못된 문제',
      description: '오류가 발생할 예정인 문제',
      type: 'multiple_choice',
      correctAnswerValue: 'invalid_answer',
      difficultyLevel: 5
    }
  }
};

// 4. OK 상태 (정상 폼)
export const OK: Story = {
  args: {
    state: {
      isSubmitting: false,
      error: null,
      success: false
    } as ProblemFormState,
    onSubmit: (input) => console.log('Submit:', input),
    onCancel: () => console.log('Cancel'),
    initialData: {
      teacherId: 'teacher-1'
    }
  }
};

// 5. Success 상태 (생성 성공)
export const Success: Story = {
  args: {
    state: {
      isSubmitting: false,
      error: null,
      success: true
    } as ProblemFormState,
    onSubmit: (input) => console.log('Submit:', input),
    onCancel: () => console.log('Cancel'),
    initialData: {
      teacherId: 'teacher-1',
      title: '성공적으로 생성된 문제',
      description: '이 문제는 성공적으로 생성되었습니다',
      type: 'short_answer',
      correctAnswerValue: '정답',
      difficultyLevel: 4,
      tags: ['수학', '성공']
    }
  }
};

// 6. Pre-filled 상태 (미리 입력된 데이터)
export const PreFilled: Story = {
  args: {
    state: {
      isSubmitting: false,
      error: null,
      success: false
    } as ProblemFormState,
    onSubmit: (input) => console.log('Submit:', input),
    onCancel: () => console.log('Cancel'),
    initialData: {
      teacherId: 'teacher-1',
      title: '미리 입력된 문제',
      description: '이 폼은 초기값이 설정되어 있습니다.',
      type: 'multiple_choice',
      correctAnswerValue: '2',
      difficultyLevel: 6,
      tags: ['수학', '물리', '화학']
    }
  }
};

// 7. Essay Type 상태 (서술형 문제)
export const EssayType: Story = {
  args: {
    state: {
      isSubmitting: false,
      error: null,
      success: false
    } as ProblemFormState,
    onSubmit: (input) => console.log('Submit:', input),
    onCancel: () => console.log('Cancel'),
    initialData: {
      teacherId: 'teacher-1',
      title: '서술형 문제 예시',
      description: '자세한 설명이 필요한 문제입니다.',
      type: 'essay',
      correctAnswerValue: '모범 답안: 상세한 설명과 논리적 전개가 포함된 답변',
      difficultyLevel: 8,
      tags: ['논술', '서술', '사고력']
    }
  }
};