/**
 * Radio 컴포넌트 스토리
 */

import type { Meta, StoryObj } from '@storybook/react'
import { RadioGroup } from './Radio'
import { useState } from 'react'

const meta = {
  title: 'UI/Radio',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '라디오 버튼 그룹 컴포넌트입니다. 수직/수평 배치를 지원합니다.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

const sampleOptions = [
  { value: 'option1', label: '옵션 1' },
  { value: 'option2', label: '옵션 2' },
  { value: 'option3', label: '옵션 3' },
]

export const Default: Story = {
  args: {
    name: 'default-radio',
    options: sampleOptions,
  },
}

export const Horizontal: Story = {
  args: {
    name: 'horizontal-radio',
    options: sampleOptions,
    direction: 'horizontal',
  },
}

export const WithDescription: Story = {
  args: {
    name: 'description-radio',
    options: [
      { value: 'basic', label: '기본 플랜', description: '개인 사용자를 위한 기본 기능' },
      { value: 'pro', label: '프로 플랜', description: '고급 기능과 우선 지원' },
      { value: 'enterprise', label: '엔터프라이즈', description: '대규모 조직을 위한 맞춤형 솔루션' },
    ],
  },
}

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('option1')
    
    return (
      <div className="space-y-4">
        <RadioGroup
          name="interactive-radio"
          options={sampleOptions}
          value={value}
          onChange={setValue}
          helperText={`선택된 값: ${value}`}
        />
      </div>
    )
  },
}