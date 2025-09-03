/**
 * Checkbox 컴포넌트 스토리
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Checkbox } from './Checkbox'
import { useState } from 'react'

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '라벨, 설명, 중간 상태를 지원하는 체크박스 컴포넌트입니다.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: '기본 체크박스',
  },
}

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox label="체크됨" checked />
      <Checkbox label="체크 안됨" />
      <Checkbox label="중간 상태" indeterminate />
      <Checkbox label="비활성화" disabled />
      <Checkbox label="체크됨 + 비활성화" checked disabled />
    </div>
  ),
}

export const WithDescription: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox
        label="이용약관 동의"
        description="서비스 이용을 위해 약관에 동의해주세요"
      />
      <Checkbox
        label="마케팅 정보 수신 동의"
        description="새로운 서비스나 이벤트 정보를 이메일로 받아보실 수 있습니다"
      />
    </div>
  ),
}

export const Interactive: Story = {
  render: () => {
    const [items, setItems] = useState([
      { id: 1, label: '항목 1', checked: false },
      { id: 2, label: '항목 2', checked: true },
      { id: 3, label: '항목 3', checked: false },
    ])
    
    const allChecked = items.every(item => item.checked)
    const someChecked = items.some(item => item.checked)
    
    return (
      <div className="space-y-4">
        <Checkbox
          label="전체 선택"
          checked={allChecked}
          indeterminate={someChecked && !allChecked}
          onChange={(e) => {
            const checked = e.target.checked
            setItems(items.map(item => ({ ...item, checked })))
          }}
        />
        <hr />
        {items.map(item => (
          <Checkbox
            key={item.id}
            label={item.label}
            checked={item.checked}
            onChange={(e) => {
              setItems(items.map(i => 
                i.id === item.id ? { ...i, checked: e.target.checked } : i
              ))
            }}
          />
        ))}
      </div>
    )
  },
}