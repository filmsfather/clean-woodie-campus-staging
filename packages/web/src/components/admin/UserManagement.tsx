/**
 * UserManagement 컴포넌트 - 관리자 사용자 관리
 * 
 * 기능:
 * - 사용자 목록 조회 및 필터링
 * - 사용자 상세 정보 보기/편집
 * - 사용자 활성화/비활성화
 * - 사용자 역할 관리
 * - 새 사용자 초대
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Select, Modal } from '../ui'
import { cn } from '../../utils/cn'

// 타입 정의
interface User {
  id: string
  email: string
  name: string
  role: 'student' | 'teacher' | 'admin'
  classId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface UserStats {
  total: number
  active: number
  students: number
  teachers: number
  admins: number
  newThisWeek: number
}

interface UserFilters {
  search: string
  role: string
  status: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

// Mock 데이터
const mockUsers: User[] = [
  {
    id: '1',
    email: 'student1@school.ac.kr',
    name: '김학생',
    role: 'student',
    classId: 'class-101',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-09-01')
  },
  {
    id: '2',
    email: 'teacher1@school.ac.kr',
    name: '이선생',
    role: 'teacher',
    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-08-30')
  },
  {
    id: '3',
    email: 'admin@school.ac.kr',
    name: '박관리자',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-09-02')
  },
  {
    id: '4',
    email: 'student2@school.ac.kr',
    name: '정학생',
    role: 'student',
    classId: 'class-102',
    isActive: false,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-08-25')
  },
  {
    id: '5',
    email: 'teacher2@school.ac.kr',
    name: '최선생',
    role: 'teacher',
    isActive: true,
    createdAt: new Date('2024-08-30'),
    updatedAt: new Date('2024-09-01')
  }
]

const mockStats: UserStats = {
  total: 1247,
  active: 1198,
  students: 1050,
  teachers: 197,
  admins: 3,
  newThisWeek: 23
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [filteredUsers, setFilteredUsers] = useState<User[]>(mockUsers)
  const [stats, setStats] = useState<UserStats>(mockStats)
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 필터링 및 정렬 로직
  useEffect(() => {
    let filtered = [...users]

    // 검색 필터
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      )
    }

    // 역할 필터
    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role)
    }

    // 상태 필터
    if (filters.status !== 'all') {
      const isActive = filters.status === 'active'
      filtered = filtered.filter(user => user.isActive === isActive)
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof User]
      let bValue: any = b[filters.sortBy as keyof User]

      if (aValue instanceof Date) {
        aValue = aValue.getTime()
        bValue = bValue.getTime()
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredUsers(filtered)
  }, [users, filters])

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'edit') => {
    setIsLoading(true)
    
    // 실제 API 호출을 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500))

    if (action === 'activate' || action === 'deactivate') {
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, isActive: action === 'activate', updatedAt: new Date() }
          : user
      ))
      
      // 통계 업데이트
      setStats(prev => ({
        ...prev,
        active: action === 'activate' ? prev.active + 1 : prev.active - 1
      }))
    } else if (action === 'edit') {
      const user = users.find(u => u.id === userId)
      if (user) {
        setSelectedUser(user)
        setIsEditModalOpen(true)
      }
    }

    setIsLoading(false)
  }

  const handleSaveUser = async (userData: Partial<User>) => {
    setIsLoading(true)
    
    // 실제 API 호출을 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500))

    if (selectedUser) {
      setUsers(prev => prev.map(user =>
        user.id === selectedUser.id
          ? { ...user, ...userData, updatedAt: new Date() }
          : user
      ))
      setIsEditModalOpen(false)
      setSelectedUser(null)
    }

    setIsLoading(false)
  }

  const handleInviteUser = async (inviteData: { email: string; role: string; classId?: string }) => {
    setIsLoading(true)
    
    // 실제 API 호출을 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500))

    // 새 사용자 추가 (실제로는 초대 이메일 발송)
    const newUser: User = {
      id: `temp-${Date.now()}`,
      email: inviteData.email,
      name: '초대 대기 중...',
      role: inviteData.role as any,
      classId: inviteData.classId,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setUsers(prev => [...prev, newUser])
    setStats(prev => ({ ...prev, total: prev.total + 1 }))
    setIsInviteModalOpen(false)
    setIsLoading(false)
  }

  const getRoleBadgeVariant = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'destructive'
      case 'teacher': return 'default'
      case 'student': return 'secondary'
      default: return 'secondary'
    }
  }

  const getRoleLabel = (role: User['role']) => {
    switch (role) {
      case 'admin': return '관리자'
      case 'teacher': return '교사'
      case 'student': return '학생'
      default: return '알 수 없음'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">사용자 관리</h1>
          <p className="text-text-secondary mt-1">시스템 사용자를 관리하고 권한을 설정합니다</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsInviteModalOpen(true)}
          >
            사용자 초대
          </Button>
          <Button onClick={() => window.location.reload()}>
            새로고침
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-text-secondary">총 사용자</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active.toLocaleString()}</div>
            <p className="text-xs text-text-secondary">활성 사용자</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.students.toLocaleString()}</div>
            <p className="text-xs text-text-secondary">학생</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.teachers}</div>
            <p className="text-xs text-text-secondary">교사</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">+{stats.newThisWeek}</div>
            <p className="text-xs text-text-secondary">이번 주 신규</p>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="이름 또는 이메일 검색..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Select
              value={filters.role}
              onValueChange={(value) => handleFilterChange('role', value)}
              options={[
                { value: 'all', label: '모든 역할' },
                { value: 'student', label: '학생' },
                { value: 'teacher', label: '교사' },
                { value: 'admin', label: '관리자' }
              ]}
            />
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
              options={[
                { value: 'all', label: '모든 상태' },
                { value: 'active', label: '활성' },
                { value: 'inactive', label: '비활성' }
              ]}
            />
            <Select
              value={filters.sortBy}
              onValueChange={(value) => handleFilterChange('sortBy', value)}
              options={[
                { value: 'createdAt', label: '가입일' },
                { value: 'name', label: '이름' },
                { value: 'email', label: '이메일' },
                { value: 'role', label: '역할' }
              ]}
            />
            <Select
              value={filters.sortOrder}
              onValueChange={(value) => handleFilterChange('sortOrder', value)}
              options={[
                { value: 'desc', label: '내림차순' },
                { value: 'asc', label: '오름차순' }
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* 사용자 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            사용자 목록
            <span className="text-sm font-normal text-text-secondary">
              총 {filteredUsers.length}명
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">사용자</th>
                  <th className="text-left p-3 font-medium">역할</th>
                  <th className="text-left p-3 font-medium">상태</th>
                  <th className="text-left p-3 font-medium">반</th>
                  <th className="text-left p-3 font-medium">가입일</th>
                  <th className="text-left p-3 font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-surface-secondary transition-colors">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-text-secondary">{user.email}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? '활성' : '비활성'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{user.classId || '-'}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'edit')}
                        >
                          편집
                        </Button>
                        <Button
                          variant={user.isActive ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleUserAction(user.id, user.isActive ? 'deactivate' : 'activate')}
                          disabled={isLoading}
                        >
                          {user.isActive ? '비활성화' : '활성화'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 편집 모달 */}
      {isEditModalOpen && selectedUser && (
        <UserEditModal
          user={selectedUser}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveUser}
          isLoading={isLoading}
        />
      )}

      {/* 초대 모달 */}
      {isInviteModalOpen && (
        <UserInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onInvite={handleInviteUser}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

// 사용자 편집 모달 컴포넌트
interface UserEditModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onSave: (userData: Partial<User>) => Promise<void>
  isLoading: boolean
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, isOpen, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    classId: user.classId || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="사용자 정보 편집">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">이름</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">역할</label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as User['role'] }))}
            options={[
              { value: 'student', label: '학생' },
              { value: 'teacher', label: '교사' },
              { value: 'admin', label: '관리자' }
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">반 ID (선택사항)</label>
          <Input
            value={formData.classId}
            onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
            placeholder="class-101"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// 사용자 초대 모달 컴포넌트
interface UserInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onInvite: (data: { email: string; role: string; classId?: string }) => Promise<void>
  isLoading: boolean
}

const UserInviteModal: React.FC<UserInviteModalProps> = ({ isOpen, onClose, onInvite, isLoading }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'student',
    classId: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onInvite({
      email: formData.email,
      role: formData.role,
      classId: formData.classId || undefined
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 사용자 초대">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="user@school.ac.kr"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">역할</label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
            options={[
              { value: 'student', label: '학생' },
              { value: 'teacher', label: '교사' },
              { value: 'admin', label: '관리자' }
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">반 ID (선택사항)</label>
          <Input
            value={formData.classId}
            onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
            placeholder="class-101"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '초대 중...' : '초대 보내기'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}