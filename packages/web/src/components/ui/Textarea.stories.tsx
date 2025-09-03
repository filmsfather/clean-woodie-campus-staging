/**
 * Textarea 컴포넌트 스토리
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from './Textarea'

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '글자 수 카운터와 다양한 리사이즈 옵션을 지원하는 텍스트 영역 컴포넌트입니다.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: '내용을 입력하세요...',
  },
}

export const WithCharCount: Story = {
  args: {
    placeholder: '최대 200자까지 입력 가능합니다',
    maxLength: 200,
    showCharCount: true,
    defaultValue: '현재 입력된 텍스트입니다.',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Textarea size="sm" placeholder="Small textarea" />
      <Textarea size="default" placeholder="Default textarea" />
      <Textarea size="lg" placeholder="Large textarea" />
    </div>
  ),
}

export const ResizeOptions: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">리사이즈 없음</label>
        <Textarea resize="none" placeholder="크기 조절 불가" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">세로만 리사이즈</label>
        <Textarea resize="vertical" placeholder="세로로만 크기 조절 가능" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">가로만 리사이즈</label>
        <Textarea resize="horizontal" placeholder="가로로만 크기 조절 가능" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">모든 방향 리사이즈</label>
        <Textarea resize="both" placeholder="모든 방향으로 크기 조절 가능" />
      </div>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <Textarea placeholder="기본 상태" />
      <Textarea 
        variant="error" 
        error="내용을 입력해주세요" 
        placeholder="에러 상태" 
      />
      <Textarea 
        variant="success" 
        placeholder="성공 상태" 
      />
      <Textarea 
        disabled 
        placeholder="비활성화 상태" 
        defaultValue="수정할 수 없습니다"
      />
    </div>
  ),
}