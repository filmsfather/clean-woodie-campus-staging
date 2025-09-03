/**
 * Card 컴포넌트 스토리
 * 
 * Card 컴포넌트와 서브컴포넌트들의 다양한 조합을 보여주는 Storybook 스토리
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card'
import { Button } from './Button'

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '다양한 크기와 변형을 지원하는 카드 컴포넌트입니다. Header, Title, Description, Content, Footer 서브컴포넌트를 제공합니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg', 'xl'],
      description: '카드의 패딩 크기',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'elevated', 'outlined', 'ghost'],
      description: '카드의 시각적 스타일 변형',
    },
    interactive: {
      control: 'boolean',
      description: '호버 효과 및 커서 포인터 활성화',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

// 기본 카드
export const Default: Story = {
  render: () => (
    <Card>
      <CardContent>
        <p>기본 카드 컴포넌트입니다.</p>
      </CardContent>
    </Card>
  ),
}

// 완전한 카드 구조
export const Complete: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>카드 제목</CardTitle>
        <CardDescription>
          이것은 카드에 대한 설명입니다. 카드의 내용을 간단히 요약합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-text-secondary">
          여기에 카드의 주요 내용이 들어갑니다. 다양한 형태의 콘텐츠를 포함할 수 있습니다.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">확인</Button>
        <Button size="sm" variant="outline">취소</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: '헤더, 콘텐츠, 푸터를 모두 포함한 완전한 카드 구조를 보여줍니다.',
      },
    },
  },
}

// 다양한 크기
export const Sizes: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle as="h4">Small</CardTitle>
        </CardHeader>
        <CardContent>
          <p>작은 크기의 카드입니다.</p>
        </CardContent>
      </Card>
      
      <Card size="default">
        <CardHeader>
          <CardTitle as="h4">Default</CardTitle>
        </CardHeader>
        <CardContent>
          <p>기본 크기의 카드입니다.</p>
        </CardContent>
      </Card>
      
      <Card size="lg">
        <CardHeader>
          <CardTitle as="h4">Large</CardTitle>
        </CardHeader>
        <CardContent>
          <p>큰 크기의 카드입니다.</p>
        </CardContent>
      </Card>
      
      <Card size="xl">
        <CardHeader>
          <CardTitle as="h4">Extra Large</CardTitle>
        </CardHeader>
        <CardContent>
          <p>매우 큰 크기의 카드입니다.</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '카드 컴포넌트의 모든 크기를 보여줍니다.',
      },
    },
  },
}

// 다양한 변형
export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card variant="default">
        <CardHeader>
          <CardTitle as="h4">Default</CardTitle>
        </CardHeader>
        <CardContent>
          <p>기본 스타일의 카드입니다.</p>
        </CardContent>
      </Card>
      
      <Card variant="elevated">
        <CardHeader>
          <CardTitle as="h4">Elevated</CardTitle>
        </CardHeader>
        <CardContent>
          <p>그림자가 강조된 카드입니다.</p>
        </CardContent>
      </Card>
      
      <Card variant="outlined">
        <CardHeader>
          <CardTitle as="h4">Outlined</CardTitle>
        </CardHeader>
        <CardContent>
          <p>테두리가 강조된 카드입니다.</p>
        </CardContent>
      </Card>
      
      <Card variant="ghost">
        <CardHeader>
          <CardTitle as="h4">Ghost</CardTitle>
        </CardHeader>
        <CardContent>
          <p>투명한 배경의 카드입니다.</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '카드 컴포넌트의 모든 시각적 변형을 보여줍니다.',
      },
    },
  },
}

// 대화형 카드
export const Interactive: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card interactive>
        <CardHeader>
          <CardTitle as="h4">일반 카드</CardTitle>
          <CardDescription>클릭할 수 없는 카드입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>이 카드는 상호작용하지 않습니다.</p>
        </CardContent>
      </Card>
      
      <Card interactive onClick={() => alert('카드가 클릭되었습니다!')}>
        <CardHeader>
          <CardTitle as="h4">대화형 카드</CardTitle>
          <CardDescription>클릭해보세요!</CardDescription>
        </CardHeader>
        <CardContent>
          <p>이 카드는 클릭할 수 있습니다. 호버 효과도 있습니다.</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '대화형 카드와 일반 카드의 차이를 보여줍니다. 대화형 카드는 호버 효과와 클릭 이벤트를 지원합니다.',
      },
    },
  },
}

// 실제 사용 예제
export const RealWorldExamples: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 프로필 카드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">김</span>
            </div>
            <div>
              <CardTitle as="h4">김철수</CardTitle>
              <CardDescription>프론트엔드 개발자</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary">
            React와 TypeScript를 주로 다루며, 사용자 경험을 중시하는 개발자입니다.
          </p>
        </CardContent>
        <CardFooter>
          <Button size="sm" variant="outline">프로필 보기</Button>
        </CardFooter>
      </Card>

      {/* 통계 카드 */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle as="h4">이번 달 성과</CardTitle>
          <CardDescription>2024년 9월</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>완료한 작업</span>
              <span className="font-medium">24개</span>
            </div>
            <div className="flex justify-between">
              <span>진행 중인 작업</span>
              <span className="font-medium">8개</span>
            </div>
            <div className="flex justify-between">
              <span>성공률</span>
              <span className="font-medium text-success">96%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 알림 카드 */}
      <Card variant="outlined" className="border-warning">
        <CardHeader>
          <CardTitle as="h4" className="text-warning">주의 사항</CardTitle>
        </CardHeader>
        <CardContent>
          <p>시스템 점검이 예정되어 있습니다. 2024년 9월 15일 오전 2시부터 4시까지 서비스가 중단될 예정입니다.</p>
        </CardContent>
        <CardFooter>
          <Button size="sm" variant="outline">확인했습니다</Button>
        </CardFooter>
      </Card>

      {/* 액션 카드 */}
      <Card interactive variant="ghost" className="border-2 border-dashed border-border-secondary">
        <CardContent className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 bg-surface-secondary rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <CardTitle as="h4" className="text-text-secondary">새 항목 추가</CardTitle>
          <CardDescription>클릭하여 새로운 항목을 만드세요</CardDescription>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '실제 애플리케이션에서 사용될 수 있는 카드 컴포넌트의 다양한 예제들을 보여줍니다.',
      },
    },
  },
}

// 대화형 예제
export const Playground: Story = {
  args: {
    size: 'default',
    variant: 'default',
    interactive: false,
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>테스트 카드</CardTitle>
        <CardDescription>
          컨트롤 패널에서 다양한 설정을 조정해보세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>카드의 다양한 속성을 실시간으로 확인할 수 있습니다.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">액션</Button>
        <Button size="sm" variant="outline">취소</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: '컨트롤 패널에서 카드의 다양한 속성을 조정하여 실시간으로 확인할 수 있습니다.',
      },
    },
  },
}