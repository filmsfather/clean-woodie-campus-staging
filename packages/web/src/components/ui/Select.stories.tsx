/**
 * Select 컴포넌트 스토리
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Select } from './Select'
import { useState } from 'react'

const meta = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '검색 기능과 클리어 기능을 지원하는 선택 드롭다운 컴포넌트입니다.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '300px', height: '300px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const sampleOptions = [
  { value: 'apple', label: '사과' },
  { value: 'banana', label: '바나나' },
  { value: 'orange', label: '오렌지' },
  { value: 'grape', label: '포도' },
  { value: 'strawberry', label: '딸기' },
]

export const Default: Story = {
  args: {
    options: sampleOptions,
    placeholder: '과일을 선택하세요',
  },
}

export const Searchable: Story = {
  args: {
    options: sampleOptions,
    placeholder: '검색하여 선택하세요',
    searchable: true,
  },
}

export const Clearable: Story = {
  args: {
    options: sampleOptions,
    placeholder: '선택하세요',
    clearable: true,
    value: 'apple',
  },
}

export const WithError: Story = {
  args: {
    options: sampleOptions,
    placeholder: '필수 선택',
    error: '항목을 선택해주세요',
    variant: 'error',
  },
}

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('')
    
    return (
      <Select
        options={sampleOptions}
        placeholder="과일을 선택하세요"
        searchable
        clearable
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onClear={() => setValue('')}
        helperText={`선택된 값: ${value || '없음'}`}
      />
    )
  },
}