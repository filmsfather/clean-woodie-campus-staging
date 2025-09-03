import React, { useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Progress,
  Grid,
  Button,
  FloatingActionButton,
} from '../ui'
import { ProblemSetBuilder } from './ProblemSetBuilder'
import { ProblemSetAssignment } from './ProblemSetAssignment'

interface ProblemSet {
  id: string
  title: string
  description: string
  totalProblems: number
  assignedStudents: number
  completedStudents: number
  averageScore: number
  dueDate?: string
  status: 'draft' | 'active' | 'completed' | 'overdue'
  createdAt: string
  updatedAt: string
}

// Mock data
const mockProblemSets: ProblemSet[] = [
  {
    id: '1',
    title: '중학교 수학 1학년 - 정수와 유리수',
    description: '정수의 개념과 유리수의 사칙연산을 다루는 문제집입니다.',
    totalProblems: 25,
    assignedStudents: 28,
    completedStudents: 18,
    averageScore: 82.5,
    dueDate: '2025-09-15T23:59:59Z',
    status: 'active',
    createdAt: '2025-08-20T09:00:00Z',
    updatedAt: '2025-09-01T14:30:00Z',
  },
  {
    id: '2',
    title: '영어 기초 단어 100선',
    description: '중학교 1학년이 반드시 알아야 할 기초 영단어 문제집입니다.',
    totalProblems: 50,
    assignedStudents: 28,
    completedStudents: 24,
    averageScore: 76.8,
    dueDate: '2025-09-10T23:59:59Z',
    status: 'active',
    createdAt: '2025-08-15T10:00:00Z',
    updatedAt: '2025-08-31T16:45:00Z',
  },
  {
    id: '3',
    title: '과학 실험 이론 - 산과 염기',
    description: '산과 염기의 성질과 중화반응에 대한 이론 문제집입니다.',
    totalProblems: 30,
    assignedStudents: 28,
    completedStudents: 8,
    averageScore: 68.2,
    dueDate: '2025-09-20T23:59:59Z',
    status: 'active',
    createdAt: '2025-08-25T11:00:00Z',
    updatedAt: '2025-09-01T09:15:00Z',
  },
  {
    id: '4',
    title: '국어 문법 기초',
    description: '품사와 문장성분에 대한 기초 문법 문제집입니다.',
    totalProblems: 35,
    assignedStudents: 0,
    completedStudents: 0,
    averageScore: 0,
    status: 'draft',
    createdAt: '2025-09-01T08:00:00Z',
    updatedAt: '2025-09-01T08:00:00Z',
  },
]

type ViewMode = 'list' | 'editor' | 'assignment'

export function ProblemSetList() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'draft' | 'completed' | 'overdue'>('all')
  const [sortBy, setSortBy] = useState<'title' | 'dueDate' | 'progress' | 'score'>('dueDate')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedProblemSetId, setSelectedProblemSetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const filteredProblemSets = mockProblemSets.filter(problemSet => {
    if (selectedFilter === 'all') return true
    return problemSet.status === selectedFilter
  })

  const sortedProblemSets = [...filteredProblemSets].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      case 'progress':
        const progressA = a.assignedStudents > 0 ? a.completedStudents / a.assignedStudents : 0
        const progressB = b.assignedStudents > 0 ? b.completedStudents / b.assignedStudents : 0
        return progressB - progressA
      case 'score':
        return b.averageScore - a.averageScore
      default:
        return 0
    }
  })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success' as const
      case 'draft': return 'outline' as const
      case 'completed': return 'default' as const
      case 'overdue': return 'error' as const
      default: return 'outline' as const
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '진행중'
      case 'draft': return '초안'
      case 'completed': return '완료'
      case 'overdue': return '마감 초과'
      default: return status
    }
  }

  // 핸들러 함수들
  const handleCreateProblemSet = () => {
    setSelectedProblemSetId(null)
    setViewMode('editor')
  }

  const handleEditProblemSet = (problemSetId: string) => {
    setSelectedProblemSetId(problemSetId)
    setViewMode('editor')
  }

  const handleAssignProblemSet = (problemSetId: string) => {
    setSelectedProblemSetId(problemSetId)
    setViewMode('assignment')
  }

  const handleSaveProblemSet = async (data: any) => {
    setIsLoading(true)
    try {
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('문제집 저장:', data)
      setViewMode('list')
      setSelectedProblemSetId(null)
    } catch (error) {
      console.error('저장 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setViewMode('list')
    setSelectedProblemSetId(null)
  }

  const handleAssignmentComplete = () => {
    setViewMode('list')
    setSelectedProblemSetId(null)
  }

  const fabActions = [
    {
      id: 'create',
      label: '새 문제집',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      onClick: handleCreateProblemSet,
      variant: 'default' as const,
    },
    {
      id: 'import',
      label: '문제집 가져오기',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      ),
      onClick: () => console.log('Import problem set'),
      variant: 'secondary' as const,
    },
  ]

  const selectedProblemSet = mockProblemSets.find(ps => ps.id === selectedProblemSetId)

  // 편집기나 배정 모드일 때는 다른 컴포넌트 렌더링
  if (viewMode === 'editor') {
    return (
      <ProblemSetBuilder
        initialData={{
          id: selectedProblemSetId || undefined,
          title: selectedProblemSet?.title || '',
          description: selectedProblemSet?.description || '',
          problems: [],
          totalPoints: 0,
          estimatedTime: 0,
        }}
        onSave={async (data) => {
          await handleSaveProblemSet(data);
        }}
        onCancel={handleCancelEdit}
        isLoading={isLoading}
        mode={selectedProblemSetId ? 'edit' : 'create'}
      />
    )
  }

  if (viewMode === 'assignment' && selectedProblemSet) {
    return (
      <ProblemSetAssignment
        problemSetId={selectedProblemSet.id}
        problemSetTitle={selectedProblemSet.title}
        onClose={handleAssignmentComplete}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">📚 문제집 관리</h1>
          <p className="text-text-secondary">문제집을 생성하고 학생들에게 배정하세요.</p>
        </div>
        <Button variant="default" onClick={handleCreateProblemSet}>
          새 문제집 만들기
        </Button>
      </div>

      {/* Filters and Sort */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <span className="text-sm font-medium text-text-secondary">필터:</span>
              {(['all', 'active', 'draft', 'completed', 'overdue'] as const).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={selectedFilter === filter ? 'default' : 'ghost'}
                  onClick={() => setSelectedFilter(filter)}
                >
                  {filter === 'all' ? '전체' :
                   filter === 'active' ? '진행중' :
                   filter === 'draft' ? '초안' :
                   filter === 'completed' ? '완료' : '마감초과'}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-text-secondary">정렬:</span>
              <select 
                className="px-3 py-1 text-sm border border-border-primary rounded-md bg-surface-primary text-text-primary"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="dueDate">마감일순</option>
                <option value="title">제목순</option>
                <option value="progress">진행률순</option>
                <option value="score">평균점수순</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Problem Sets Grid */}
      <Grid cols={{ base: 1, md: 2, xl: 3 }} gap={6}>
        {sortedProblemSets.map((problemSet) => (
          <Card key={problemSet.id} interactive>
            <CardHeader>
              <div className="flex justify-between items-start gap-3">
                <CardTitle className="text-lg">{problemSet.title}</CardTitle>
                <Badge variant={getStatusVariant(problemSet.status)} size="sm">
                  {getStatusLabel(problemSet.status)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary line-clamp-2">
                {problemSet.description}
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center p-2 bg-surface-secondary rounded-lg">
                  <div className="font-semibold text-text-primary">{problemSet.totalProblems}</div>
                  <div className="text-xs text-text-secondary">문제 수</div>
                </div>
                <div className="text-center p-2 bg-surface-secondary rounded-lg">
                  <div className="font-semibold text-text-primary">{problemSet.assignedStudents}</div>
                  <div className="text-xs text-text-secondary">배정 학생</div>
                </div>
              </div>

              {problemSet.assignedStudents > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">완료율</span>
                    <span className="font-medium">
                      {problemSet.completedStudents}/{problemSet.assignedStudents}
                      ({Math.round((problemSet.completedStudents / problemSet.assignedStudents) * 100)}%)
                    </span>
                  </div>
                  <Progress 
                    value={(problemSet.completedStudents / problemSet.assignedStudents) * 100}
                    variant={(problemSet.completedStudents / problemSet.assignedStudents) >= 0.8 ? 'success' : 'default'}
                  />
                </div>
              )}

              {problemSet.averageScore > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">평균 점수</span>
                  <Badge variant={problemSet.averageScore >= 80 ? 'success' : problemSet.averageScore >= 60 ? 'warning' : 'error'}>
                    {problemSet.averageScore.toFixed(1)}점
                  </Badge>
                </div>
              )}

              {problemSet.dueDate && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">마감일</span>
                  <span className="font-medium text-text-primary">
                    {new Date(problemSet.dueDate).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleEditProblemSet(problemSet.id)}
              >
                편집
              </Button>
              {problemSet.status === 'draft' ? (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleAssignProblemSet(problemSet.id)}
                >
                  배정하기
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => console.log('상세보기:', problemSet.id)}
                >
                  상세보기
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </Grid>

      {/* Empty State */}
      {sortedProblemSets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {selectedFilter === 'all' ? '문제집이 없습니다' : `${getStatusLabel(selectedFilter)} 문제집이 없습니다`}
            </h3>
            <p className="text-text-secondary mb-4">
              새로운 문제집을 만들어 학생들에게 배정해보세요.
            </p>
            <Button variant="default" onClick={handleCreateProblemSet}>
              첫 번째 문제집 만들기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton actions={fabActions} />
    </div>
  )
}