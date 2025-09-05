/**
 * AdminDashboard 컴포넌트 - 관리자 대시보드
 * 
 * 기능:
 * - 시스템 상태 모니터링
 * - 사용자 관리 (학생, 교사)
 * - 콘텐츠 관리 (문제, 문제집)
 * - 시스템 설정
 * - 실시간 알림 및 통계
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress, Modal } from '../../ui'
import { useAuth } from '../../../hooks/useAuth'
import { Unauthorized } from '../../auth/Unauthorized'
import { RoleStatisticsDashboard } from '../../auth'
import UserManagementContainer from '../../../containers/auth/UserManagementContainer'
import InviteManagementContainer from '../../../containers/auth/InviteManagementContainer'
import { ProblemList } from '../../problems'

// 타입 정의
interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalProblems: number
  totalClasses: number
  systemLoad: number
  memoryUsage: number
  diskUsage: number
  uptime: string
}

interface UserStats {
  students: {
    total: number
    active: number
    newThisWeek: number
  }
  teachers: {
    total: number
    active: number
    pendingApproval: number
  }
}

interface ContentStats {
  problems: {
    total: number
    published: number
    draft: number
    pendingReview: number
  }
  problemSets: {
    total: number
    active: number
  }
}

interface SystemAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  resolved: boolean
}

interface RecentActivity {
  id: string
  type: 'user_registration' | 'problem_created' | 'class_created' | 'system_update'
  description: string
  user: string
  timestamp: Date
}

// Mock 데이터
const mockSystemStats: SystemStats = {
  totalUsers: 1247,
  activeUsers: 892,
  totalProblems: 3456,
  totalClasses: 45,
  systemLoad: 72,
  memoryUsage: 68,
  diskUsage: 45,
  uptime: '15일 3시간 22분'
}

const mockUserStats: UserStats = {
  students: {
    total: 1050,
    active: 823,
    newThisWeek: 23
  },
  teachers: {
    total: 197,
    active: 156,
    pendingApproval: 5
  }
}

const mockContentStats: ContentStats = {
  problems: {
    total: 3456,
    published: 3102,
    draft: 234,
    pendingReview: 120
  },
  problemSets: {
    total: 245,
    active: 198
  }
}

const mockAlerts: SystemAlert[] = [
  {
    id: '1',
    type: 'critical',
    title: '데이터베이스 연결 지연',
    message: '평균 응답시간이 5초를 초과했습니다.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    resolved: false
  },
  {
    id: '2',
    type: 'warning',
    title: '디스크 사용량 증가',
    message: '디스크 사용량이 80%를 초과했습니다.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    resolved: false
  },
  {
    id: '3',
    type: 'info',
    title: '새로운 교사 승인 대기',
    message: '5명의 교사가 승인을 대기하고 있습니다.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    resolved: false
  }
]

const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'user_registration',
    description: '새로운 학생이 등록했습니다',
    user: '김학생 (student@school.ac.kr)',
    timestamp: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    id: '2',
    type: 'problem_created',
    description: '새로운 수학 문제가 생성되었습니다',
    user: '이선생 (teacher@school.ac.kr)',
    timestamp: new Date(Date.now() - 25 * 60 * 1000)
  },
  {
    id: '3',
    type: 'class_created',
    description: '새로운 반이 생성되었습니다: 3학년 1반',
    user: '박관리자 (admin@school.ac.kr)',
    timestamp: new Date(Date.now() - 45 * 60 * 1000)
  }
]

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [systemStats, setSystemStats] = useState<SystemStats>(mockSystemStats)
  const [userStats] = useState<UserStats>(mockUserStats)
  const [contentStats] = useState<ContentStats>(mockContentStats)
  const [alerts, setAlerts] = useState<SystemAlert[]>(mockAlerts)
  const [recentActivity] = useState<RecentActivity[]>(mockRecentActivity)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateInvite, setShowCreateInvite] = useState(false)
  const [showUserDirectory, setShowUserDirectory] = useState(false)
  const [showRoleStats, setShowRoleStats] = useState(false)
  const [showInviteList, setShowInviteList] = useState(false)

  // 실시간 데이터 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5),
        systemLoad: Math.max(0, Math.min(100, prev.systemLoad + Math.floor(Math.random() * 10 - 5)))
      }))
    }, 30000) // 30초마다 업데이트

    return () => clearInterval(interval)
  }, [])

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    )
  }

  const handleNavigateToManagement = (section: string) => {
    navigate(`/admin/${section}`)
  }

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'critical': return '🚨'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📢'
    }
  }

  const getAlertBadgeVariant = (type: SystemAlert['type']) => {
    switch (type) {
      case 'critical': return 'error'
      case 'warning': return 'warning'
      case 'info': return 'default'
      default: return 'secondary'
    }
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_registration': return '👤'
      case 'problem_created': return '📝'
      case 'class_created': return '🏫'
      case 'system_update': return '⚙️'
      default: return '📋'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${diffDays}일 전`
  }

  // 권한 체크 - 관리자만 접근 가능
  if (!user || user.role !== 'admin') {
    return <Unauthorized message="관리자만 접근할 수 있는 페이지입니다." />;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">관리자 대시보드</h1>
          <p className="text-text-secondary mt-1">시스템 전반적인 상황을 모니터링하고 관리합니다</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setIsLoading(!isLoading)}
            disabled={isLoading}
          >
            {isLoading ? '새로고침 중...' : '새로고침'}
          </Button>
          <Button onClick={() => navigate('/admin/system')}>
            시스템 설정
          </Button>
        </div>
      </div>

      {/* 시스템 상태 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-text-secondary">
              <span className="text-green-600">활성: {systemStats.activeUsers}</span>
              <span className="ml-2">({Math.round(systemStats.activeUsers / systemStats.totalUsers * 100)}%)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 문제 수</CardTitle>
            <span className="text-2xl">📝</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalProblems.toLocaleString()}</div>
            <div className="flex items-center text-xs text-text-secondary">
              <span className="text-blue-600">발행: {contentStats.problems.published}</span>
              <span className="ml-2 text-orange-600">대기: {contentStats.problems.pendingReview}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 반 수</CardTitle>
            <span className="text-2xl">🏫</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalClasses}</div>
            <div className="text-xs text-text-secondary">
              활성 문제집: {contentStats.problemSets.active}개
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">시스템 부하</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.systemLoad}%</div>
            <Progress value={systemStats.systemLoad} className="mt-2" />
            <div className="text-xs text-text-secondary mt-1">
              가동시간: {systemStats.uptime}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 시스템 알림 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              시스템 알림
              <Badge variant="error">{alerts.filter(a => !a.resolved).length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.filter(a => !a.resolved).slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-surface-secondary">
                <span className="text-lg">{getAlertIcon(alert.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium truncate">{alert.title}</h4>
                    <Badge variant={getAlertBadgeVariant(alert.type) as any} className="ml-2">
                      {alert.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary mb-2">{alert.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      {formatTimeAgo(alert.timestamp)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveAlert(alert.id)}
                      className="text-xs"
                    >
                      해결
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {alerts.filter(a => !a.resolved).length === 0 && (
              <div className="text-center py-8 text-text-secondary">
                <span className="text-4xl">✅</span>
                <p className="mt-2">모든 알림이 해결되었습니다</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 사용자 통계 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>사용자 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleStatisticsDashboard 
              organizationId={user?.organizationId}
              showExportOptions={false}
            />
          </CardContent>
        </Card>
      </div>

      {/* 관리 기능 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 사용자 관리 - 실제 Auth 컴포넌트 통합 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">👥</span>
              <span>사용자 관리</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateInvite(true)}
                  className="flex flex-col items-center space-y-2 h-16"
                >
                  <span>📧</span>
                  <span className="text-sm">사용자 초대</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowUserDirectory(true)}
                  className="flex flex-col items-center space-y-2 h-16"
                >
                  <span>📋</span>
                  <span className="text-sm">사용자 목록</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRoleStats(true)}
                  className="flex flex-col items-center space-y-2 h-16"
                >
                  <span>📊</span>
                  <span className="text-sm">역할 통계</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowInviteList(true)}
                  className="flex flex-col items-center space-y-2 h-16"
                >
                  <span>📝</span>
                  <span className="text-sm">초대 현황</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 반 관리 */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavigateToManagement('classes')}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">🏫</span>
              <span>반 관리</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">총 반 수</span>
                <div className="text-right">
                  <div className="font-semibold">{systemStats.totalClasses}</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">활성 학생</span>
                <div className="text-right">
                  <div className="font-semibold">{userStats.students.active.toLocaleString()}</div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                관리하기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 문제 관리 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📚</span>
                <span>문제 관리</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleNavigateToManagement('content')}>
                전체 보기
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProblemList
              problems={[]} // TODO: 최근 문제 데이터 연결
              loading={false}
              compact={true}
              showActions={['edit', 'toggle']}
              limit={5}
              onProblemSelect={(problem) => {
                handleNavigateToManagement('content');
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* 시스템 리소스 모니터링 */}
      <Card>
        <CardHeader>
          <CardTitle>시스템 리소스</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">CPU 사용률</span>
                <span className="text-sm text-text-secondary">{systemStats.systemLoad}%</span>
              </div>
              <Progress value={systemStats.systemLoad} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">메모리 사용률</span>
                <span className="text-sm text-text-secondary">{systemStats.memoryUsage}%</span>
              </div>
              <Progress value={systemStats.memoryUsage} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">디스크 사용률</span>
                <span className="text-sm text-text-secondary">{systemStats.diskUsage}%</span>
              </div>
              <Progress value={systemStats.diskUsage} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 빠른 작업 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => setShowCreateInvite(true)}
            >
              <span className="text-2xl">👤</span>
              <span>사용자 초대</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => navigate('/admin/classes')}
            >
              <span className="text-2xl">🏫</span>
              <span>새 반 만들기</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => navigate('/admin/content')}
            >
              <span className="text-2xl">📝</span>
              <span>문제 검토</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => navigate('/admin/analytics')}
            >
              <span className="text-2xl">📊</span>
              <span>시스템 분석</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => navigate('/admin/system')}
            >
              <span className="text-2xl">⚙️</span>
              <span>시스템 설정</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => window.location.reload()}
            >
              <span className="text-2xl">🔄</span>
              <span>새로고침</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 고급 기능: 실시간 모니터링 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>📊</span>
              <span>실시간 시스템 모니터링</span>
            </div>
            <Badge variant="success" size="sm">
              온라인
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.floor(Math.random() * 100 + 850)}
              </div>
              <div className="text-sm text-text-secondary">현재 접속 사용자</div>
              <div className="text-xs text-green-600 mt-1">
                ↑ 전년 대비 +12%
              </div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.floor(Math.random() * 50 + 200)}
              </div>
              <div className="text-sm text-text-secondary">오늘 새 문제 풀이</div>
              <div className="text-xs text-blue-600 mt-1">
                ↑ 어제 대비 +8%
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {(Math.random() * 2 + 98).toFixed(1)}%
              </div>
              <div className="text-sm text-text-secondary">시스템 가동률</div>
              <div className="text-xs text-purple-600 mt-1">
                ✓ 높음
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auth 컴포넌트 모달들 */}
      <Modal 
        isOpen={showCreateInvite} 
        onClose={() => setShowCreateInvite(false)}
        title="사용자 초대"
        size="lg"
      >
        <InviteManagementContainer 
          organizationId={user?.organizationId || ''}
          showCreateForm={true}
        />
      </Modal>

      <Modal 
        isOpen={showUserDirectory} 
        onClose={() => setShowUserDirectory(false)}
        title="사용자 디렉토리"
        size="xl"
      >
        <UserManagementContainer 
          organizationId={user?.organizationId}
          showStatistics={false}
          showBulkActions={true}
        />
      </Modal>

      <Modal 
        isOpen={showRoleStats} 
        onClose={() => setShowRoleStats(false)}
        title="역할 통계 대시보드"
        size="xl"
      >
        <RoleStatisticsDashboard 
          organizationId={user?.organizationId}
          showExportOptions={true}
        />
      </Modal>

      <Modal 
        isOpen={showInviteList} 
        onClose={() => setShowInviteList(false)}
        title="초대 현황 관리"
        size="xl"
      >
        <InviteManagementContainer 
          organizationId={user?.organizationId || ''}
          showCreateForm={false}
          showAllInvites={true}
        />
      </Modal>
    </div>
  )
}