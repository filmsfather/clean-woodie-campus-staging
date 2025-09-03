/**
 * Button 컴포넌트 스토리
 * 
 * 다양한 Button 컴포넌트의 변형과 상태를 보여주는 Storybook 스토리
 */

import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Button } from './Button'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '다양한 변형과 크기를 지원하는 버튼 컴포넌트입니다. 로딩 상태와 아이콘도 지원합니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'outline', 'ghost', 'link', 'destructive'],
      description: '버튼의 시각적 스타일 변형',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg', 'xl', 'icon'],
      description: '버튼의 크기',
    },
    loading: {
      control: 'boolean',
      description: '로딩 상태 표시 여부',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
    children: {
      control: 'text',
      description: '버튼 내부 텍스트',
    },
  },
  args: {
    onClick: fn(),
    children: '버튼',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// 기본 버튼
export const Default: Story = {
  args: {
    children: '기본 버튼',
  },
}

// 모든 변형들
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '버튼 컴포넌트의 모든 변형을 보여줍니다.',
      },
    },
  },
}

// 모든 크기들
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '버튼 컴포넌트의 모든 크기를 보여줍니다.',
      },
    },
  },
}

// 로딩 상태
export const Loading: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button loading>로딩 중...</Button>
      <Button variant="secondary" loading>저장 중...</Button>
      <Button variant="outline" loading>처리 중...</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '로딩 상태의 버튼들을 보여줍니다. 스피너 아이콘이 표시됩니다.',
      },
    },
  },
}

// 비활성화 상태
export const Disabled: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button disabled>비활성화</Button>
      <Button variant="secondary" disabled>비활성화</Button>
      <Button variant="outline" disabled>비활성화</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '비활성화된 버튼들을 보여줍니다.',
      },
    },
  },
}

// 아이콘과 함께
export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button 
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        }
      >
        추가
      </Button>
      <Button 
        variant="secondary"
        rightIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        }
      >
        다음
      </Button>
      <Button 
        size="icon"
        variant="outline"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '아이콘을 포함한 버튼들을 보여줍니다. 왼쪽 아이콘, 오른쪽 아이콘, 아이콘만 표시하는 버튼을 확인할 수 있습니다.',
      },
    },
  },
}

// 대화형 예제
export const Interactive: Story = {
  args: {
    variant: 'default',
    size: 'default',
    children: '대화형 버튼',
    loading: false,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: '컨트롤 패널에서 다양한 props를 조정하여 버튼의 모든 상태를 테스트할 수 있습니다.',
      },
    },
  },
}