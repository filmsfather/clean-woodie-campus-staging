import React, { useState } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Badge,
  Progress,
  CircularProgress,
  Grid,
  GridItem,
  Flex,
} from './ui'

export function DesignSystemDemo() {
  const [inputValue, setInputValue] = useState('')
  const [progressValue, setProgressValue] = useState(65)
  const [loading, setLoading] = useState(false)

  const handleButtonClick = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gradient">
          Woodie Design System
        </h1>
        <p className="text-text-secondary max-w-2xl mx-auto">
          재사용 가능한 컴포넌트들로 구성된 일관된 디자인 시스템입니다.
          다크모드와 라이트모드를 지원하며, 반응형 레이아웃을 제공합니다.
        </p>
      </div>

      {/* Grid Layout Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Grid System</CardTitle>
        </CardHeader>
        <CardContent>
          <Grid
            cols={{ base: 1, md: 2, lg: 4 }}
            gap={4}
          >
            <GridItem>
              <Card variant="outlined" size="sm">
                <CardContent>Grid Item 1</CardContent>
              </Card>
            </GridItem>
            <GridItem colSpan={{ lg: 2 }}>
              <Card variant="outlined" size="sm">
                <CardContent>Grid Item 2 (spans 2 columns on lg+)</CardContent>
              </Card>
            </GridItem>
            <GridItem>
              <Card variant="outlined" size="sm">
                <CardContent>Grid Item 3</CardContent>
              </Card>
            </GridItem>
          </Grid>
        </CardContent>
      </Card>

      {/* Components Demo Grid */}
      <Grid cols={{ base: 1, lg: 2 }} gap={6}>
        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Flex direction="col" gap={3}>
              <Flex gap={2} wrap="wrap">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </Flex>
              
              <Flex gap={2} wrap="wrap">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
              </Flex>

              <div>
                <Button
                  loading={loading}
                  onClick={handleButtonClick}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  }
                >
                  {loading ? 'Loading...' : 'With Icon'}
                </Button>
              </div>
            </Flex>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs & Forms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Default input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            
            <Input
              placeholder="With left icon"
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
            
            <Input
              placeholder="With error"
              variant="error"
              error="This field is required"
            />

            <Input
              placeholder="With helper text"
              helperText="This is some helpful information"
            />
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <Flex gap={2} wrap="wrap">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="outline">Outline</Badge>
            </Flex>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Linear Progress</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setProgressValue(Math.random() * 100)}
                >
                  Randomize
                </Button>
              </div>
              <Progress
                value={progressValue}
                showPercentage
                variant="default"
              />
              <Progress
                value={progressValue * 0.8}
                showPercentage
                variant="success"
                size="sm"
              />
            </div>

            <div className="space-y-3">
              <span className="text-sm text-text-secondary">Circular Progress</span>
              <Flex gap={4}>
                <CircularProgress value={progressValue} showValue />
                <CircularProgress value={progressValue * 0.7} variant="success" showValue />
                <CircularProgress value={progressValue * 0.5} variant="warning" showValue />
              </Flex>
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Interactive Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-text-primary">Interactive Cards</h2>
        <Grid cols={{ base: 1, md: 3 }} gap={4}>
          <Card interactive>
            <CardHeader>
              <CardTitle>학습 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">완료율</span>
                  <Badge variant="success">85%</Badge>
                </div>
                <Progress value={85} variant="success" />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm">
                자세히 보기
              </Button>
            </CardFooter>
          </Card>

          <Card interactive variant="elevated">
            <CardHeader>
              <CardTitle>스트릭</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-text-primary">14일</div>
                <div className="text-sm text-text-secondary">연속 학습</div>
                <CircularProgress value={70} size={60} strokeWidth={6} />
              </div>
            </CardContent>
            <CardFooter>
              <Badge variant="warning" size="sm">
                목표: 30일
              </Badge>
            </CardFooter>
          </Card>

          <Card interactive>
            <CardHeader>
              <CardTitle>최근 활동</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>수학 문제집 완료</span>
                  <Badge size="sm">2시간 전</Badge>
                </div>
                <div className="flex justify-between">
                  <span>영어 단어 학습</span>
                  <Badge size="sm" variant="secondary">5시간 전</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="link" size="sm">
                모든 활동 보기
              </Button>
            </CardFooter>
          </Card>
        </Grid>
      </div>
    </div>
  )
}