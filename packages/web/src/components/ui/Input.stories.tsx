/**
 * Input 컴포넌트 스토리
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '다양한 상태와 크기를 지원하는 입력 필드 컴포넌트입니다. 아이콘, 에러 상태, 헬퍼 텍스트를 지원합니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg'],
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'error', 'success'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: '텍스트를 입력하세요',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div>
      <label htmlFor="input-with-label" className="block text-sm font-medium text-text-primary mb-1">
        이메일 주소
      </label>
      <Input id="input-with-label" type="email" placeholder="example@example.com" />
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Input size="sm" placeholder="Small input" />
      <Input size="default" placeholder="Default input" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <Input placeholder="기본 상태" />
      <Input variant="error" error="에러가 발생했습니다" placeholder="에러 상태" />
      <Input variant="success" placeholder="성공 상태" />
      <Input disabled placeholder="비활성화 상태" />
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <Input
        placeholder="이메일 주소"
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        }
      />
      <Input
        placeholder="검색어 입력"
        rightIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />
    </div>
  ),
}

export const WithHelperText: Story = {
  render: () => (
    <div className="space-y-4">
      <Input
        placeholder="비밀번호"
        type="password"
        helperText="8자 이상 입력해주세요"
      />
      <Input
        placeholder="잘못된 이메일"
        type="email"
        error="유효한 이메일 주소를 입력해주세요"
        defaultValue="invalid-email"
      />
    </div>
  ),
}