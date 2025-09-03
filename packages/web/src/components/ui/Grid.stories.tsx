/**
 * Grid 컴포넌트 스토리
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Grid, GridItem, Flex } from './Grid'
import { Card } from './Card'

const meta = {
  title: 'UI/Grid',
  component: Grid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '반응형 그리드 시스템을 제공하는 컴포넌트입니다. Grid, GridItem, Flex 컴포넌트를 포함합니다.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Grid>

export default meta
type Story = StoryObj<typeof meta>

const DemoCard = ({ children }: { children: React.ReactNode }) => (
  <Card className="p-4 text-center bg-brand-50 dark:bg-brand-950">
    {children}
  </Card>
)

export const BasicGrid: Story = {
  render: () => (
    <div className="p-4">
      <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={4}>
        <DemoCard>아이템 1</DemoCard>
        <DemoCard>아이템 2</DemoCard>
        <DemoCard>아이템 3</DemoCard>
        <DemoCard>아이템 4</DemoCard>
        <DemoCard>아이템 5</DemoCard>
        <DemoCard>아이템 6</DemoCard>
      </Grid>
    </div>
  ),
}

export const ResponsiveGrid: Story = {
  render: () => (
    <div className="p-4">
      <h3 className="mb-4 text-lg font-semibold">반응형 그리드 (1 → 2 → 3 → 4 컬럼)</h3>
      <Grid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
        {Array.from({ length: 8 }, (_, i) => (
          <DemoCard key={i}>아이템 {i + 1}</DemoCard>
        ))}
      </Grid>
    </div>
  ),
}

export const GridWithSpanning: Story = {
  render: () => (
    <div className="p-4">
      <h3 className="mb-4 text-lg font-semibold">그리드 스팬 예제</h3>
      <Grid cols={{ base: 1, md: 4 }} gap={4}>
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <DemoCard>2 컬럼 스팬</DemoCard>
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <DemoCard>2 컬럼 스팬</DemoCard>
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 4 }}>
          <DemoCard>전체 너비</DemoCard>
        </GridItem>
        <DemoCard>일반</DemoCard>
        <DemoCard>일반</DemoCard>
        <DemoCard>일반</DemoCard>
        <DemoCard>일반</DemoCard>
      </Grid>
    </div>
  ),
}

export const FlexLayouts: Story = {
  render: () => (
    <div className="p-4 space-y-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Flex - 중앙 정렬</h3>
        <Flex justify="center" align="center" className="h-24 bg-surface-secondary rounded">
          <DemoCard>중앙 정렬</DemoCard>
        </Flex>
      </div>
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">Flex - 공간 분배</h3>
        <Flex justify="between" gap={4}>
          <DemoCard>왼쪽</DemoCard>
          <DemoCard>가운데</DemoCard>
          <DemoCard>오른쪽</DemoCard>
        </Flex>
      </div>
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">Flex - 세로 방향</h3>
        <Flex direction="col" gap={4} className="h-48">
          <DemoCard>위</DemoCard>
          <DemoCard>가운데</DemoCard>
          <DemoCard>아래</DemoCard>
        </Flex>
      </div>
    </div>
  ),
}

export const RealWorldExample: Story = {
  render: () => (
    <div className="p-4">
      <h3 className="mb-6 text-xl font-bold">실제 레이아웃 예제</h3>
      
      {/* 헤더 */}
      <Flex justify="between" align="center" className="mb-6 p-4 bg-surface-secondary rounded">
        <h2 className="text-lg font-semibold">대시보드</h2>
        <Flex gap={2}>
          <button className="px-3 py-1 text-sm bg-brand-500 text-white rounded">설정</button>
          <button className="px-3 py-1 text-sm bg-surface-primary border rounded">로그아웃</button>
        </Flex>
      </Flex>
      
      {/* 통계 카드들 */}
      <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap={4} className="mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold text-brand-600">1,234</div>
          <div className="text-sm text-text-secondary">총 사용자</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-success">+12%</div>
          <div className="text-sm text-text-secondary">증가율</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-warning">567</div>
          <div className="text-sm text-text-secondary">대기중</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-error">23</div>
          <div className="text-sm text-text-secondary">오류</div>
        </Card>
      </Grid>
      
      {/* 메인 콘텐츠 */}
      <Grid cols={{ base: 1, lg: 3 }} gap={6}>
        <GridItem colSpan={{ base: 1, lg: 2 }}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">차트 영역</h3>
            <div className="h-64 bg-surface-secondary rounded flex items-center justify-center">
              <div className="text-text-tertiary">차트가 여기에 표시됩니다</div>
            </div>
          </Card>
        </GridItem>
        <GridItem>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
            <div className="space-y-3">
              {['사용자 A가 로그인했습니다', '새 주문이 접수되었습니다', '시스템 업데이트 완료'].map((item, i) => (
                <div key={i} className="p-2 bg-surface-secondary rounded text-sm">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </GridItem>
      </Grid>
    </div>
  ),
}