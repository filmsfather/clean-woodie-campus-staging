/**
 * Dropdown 컴포넌트 스토리
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Dropdown } from './Dropdown'
import { Button } from './Button'

const meta = {
  title: 'UI/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '키보드 네비게이션을 지원하는 드롭다운 메뉴 컴포넌트입니다.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dropdown>

export default meta
type Story = StoryObj<typeof meta>

const menuItems = [
  {
    key: 'edit',
    label: '편집',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    onClick: () => alert('편집 클릭'),
  },
  {
    key: 'copy',
    label: '복사',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    onClick: () => alert('복사 클릭'),
  },
  {
    key: 'delete',
    label: '삭제',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    danger: true,
    onClick: () => alert('삭제 클릭'),
  },
]

export const Default: Story = {
  args: {
    trigger: <Button variant="outline">메뉴 열기</Button>,
    items: menuItems,
  },
}

export const DifferentPositions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8 p-8">
      <Dropdown
        trigger={<Button variant="outline">Bottom Start</Button>}
        items={menuItems}
        position="bottom-start"
      />
      <Dropdown
        trigger={<Button variant="outline">Bottom End</Button>}
        items={menuItems}
        position="bottom-end"
      />
      <Dropdown
        trigger={<Button variant="outline">Top Start</Button>}
        items={menuItems}
        position="top-start"
      />
      <Dropdown
        trigger={<Button variant="outline">Top End</Button>}
        items={menuItems}
        position="top-end"
      />
    </div>
  ),
}

export const WithSubmenus: Story = {
  args: {
    trigger: <Button variant="outline">서브메뉴 포함</Button>,
    items: [
      ...menuItems.slice(0, 2),
      {
        key: 'settings',
        label: '설정',
        children: [
          { key: 'general', label: '일반', onClick: () => alert('일반 설정') },
          { key: 'security', label: '보안', onClick: () => alert('보안 설정') },
          { key: 'privacy', label: '개인정보', onClick: () => alert('개인정보 설정') },
        ],
      },
      menuItems[2],
    ],
  },
}

export const IconButton: Story = {
  args: {
    trigger: (
      <Button size="icon" variant="ghost">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </Button>
    ),
    items: menuItems,
  },
}