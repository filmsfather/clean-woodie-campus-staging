/**
 * ClassManagement 컴포넌트 - 관리자 반 관리
 * 
 * 기능:
 * - 반 목록 조회 및 관리 (생성/편집/삭제)
 * - N:N 학생-반 배정 관리
 * - 교사-반 배정 관리  
 * - 반별 배정 현황 및 통계
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Modal, Select } from '../ui'

// 타입 정의
interface ClassInfo {
  id: string
  name: string
  description: string
  studentCount: number
  teacherCount: number
  createdAt: Date
  updatedAt: Date
}

interface StudentAssignment {
  studentId: string
  studentName: string
  studentEmail: string
  classIds: string[]
  classNames: string[]
  isActive: boolean
}

interface TeacherAssignment {
  teacherId: string
  teacherName: string
  teacherEmail: string
  classIds: string[]
  classNames: string[]
  isActive: boolean
}

// Type guards
const isStudentAssignment = (assignment: StudentAssignment | TeacherAssignment): assignment is StudentAssignment => {
  return 'studentId' in assignment;
}

const isTeacherAssignment = (assignment: StudentAssignment | TeacherAssignment): assignment is TeacherAssignment => {
  return 'teacherId' in assignment;
}


interface ClassStats {
  totalClasses: number
  totalStudents: number
  totalTeachers: number
  averageStudentsPerClass: number
  averageTeachersPerClass: number
  unassignedStudents: number
}

interface ClassFilters {
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

// Mock 데이터
const mockClasses: ClassInfo[] = [
  {
    id: 'class-101',
    name: '수학 기초반',
    description: '중학교 수학 기초 과정',
    studentCount: 15,
    teacherCount: 2,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-09-01')
  },
  {
    id: 'class-102', 
    name: '과학 실험반',
    description: '물리/화학 실험 중심 반',
    studentCount: 12,
    teacherCount: 1,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-08-30')
  },
  {
    id: 'class-103',
    name: '영어 회화반',
    description: '원어민 선생님과 함께하는 회화',
    studentCount: 8,
    teacherCount: 1,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-09-02')
  }
]

const mockStudentAssignments: StudentAssignment[] = [
  {
    studentId: 'student-1',
    studentName: '김학생',
    studentEmail: 'student1@school.ac.kr',
    classIds: ['class-101', 'class-102'],
    classNames: ['수학 기초반', '과학 실험반'],
    isActive: true
  },
  {
    studentId: 'student-2',
    studentName: '이학생',
    studentEmail: 'student2@school.ac.kr',
    classIds: ['class-101'],
    classNames: ['수학 기초반'],
    isActive: true
  },
  {
    studentId: 'student-3',
    studentName: '박학생',
    studentEmail: 'student3@school.ac.kr',
    classIds: [],
    classNames: [],
    isActive: true
  }
]

const mockTeacherAssignments: TeacherAssignment[] = [
  {
    teacherId: 'teacher-1',
    teacherName: '이선생',
    teacherEmail: 'teacher1@school.ac.kr',
    classIds: ['class-101', 'class-102'],
    classNames: ['수학 기초반', '과학 실험반'],
    isActive: true
  },
  {
    teacherId: 'teacher-2',
    teacherName: '최선생',
    teacherEmail: 'teacher2@school.ac.kr',
    classIds: ['class-101'],
    classNames: ['수학 기초반'],
    isActive: true
  },
  {
    teacherId: 'teacher-3',
    teacherName: '김선생',
    teacherEmail: 'teacher3@school.ac.kr',
    classIds: ['class-103'],
    classNames: ['영어 회화반'],
    isActive: true
  }
]

const mockStats: ClassStats = {
  totalClasses: 3,
  totalStudents: 25,
  totalTeachers: 8,
  averageStudentsPerClass: 11.7,
  averageTeachersPerClass: 1.3,
  unassignedStudents: 5
}

export const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>(mockClasses)
  const [filteredClasses, setFilteredClasses] = useState<ClassInfo[]>(mockClasses)
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>(mockStudentAssignments)
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>(mockTeacherAssignments)
  const [stats, setStats] = useState<ClassStats>(mockStats)
  const [filters, setFilters] = useState<ClassFilters>({
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  
  // 모달 상태
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assignmentType, setAssignmentType] = useState<'student' | 'teacher'>('student')
  const [isLoading, setIsLoading] = useState(false)

  // 필터링 및 정렬 로직
  useEffect(() => {
    let filtered = [...classes]

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(classInfo =>
        classInfo.name.toLowerCase().includes(searchTerm) ||
        classInfo.description.toLowerCase().includes(searchTerm)
      )
    }

    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof ClassInfo]
      let bValue: any = b[filters.sortBy as keyof ClassInfo]

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

    setFilteredClasses(filtered)
  }, [classes, filters])

  const handleFilterChange = (key: keyof ClassFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleCreateClass = async (classData: { name: string; description: string }) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    const newClass: ClassInfo = {
      id: `class-${Date.now()}`,
      name: classData.name,
      description: classData.description,
      studentCount: 0,
      teacherCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setClasses(prev => [...prev, newClass])
    setStats(prev => ({ ...prev, totalClasses: prev.totalClasses + 1 }))
    setIsCreateModalOpen(false)
    setIsLoading(false)
  }

  const handleEditClass = async (classData: Partial<ClassInfo>) => {
    if (!selectedClass) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    setClasses(prev => prev.map(c =>
      c.id === selectedClass.id
        ? { ...c, ...classData, updatedAt: new Date() }
        : c
    ))
    setIsEditModalOpen(false)
    setSelectedClass(null)
    setIsLoading(false)
  }

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('정말로 이 반을 삭제하시겠습니까?')) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    // 반 삭제 시 모든 배정도 제거
    setStudentAssignments(prev => prev.map(assignment => ({
      ...assignment,
      classIds: assignment.classIds.filter(id => id !== classId),
      classNames: assignment.classNames.filter((_, index) => 
        assignment.classIds[index] !== classId
      )
    })))

    setTeacherAssignments(prev => prev.map(assignment => ({
      ...assignment,
      classIds: assignment.classIds.filter(id => id !== classId),
      classNames: assignment.classNames.filter((_, index) =>
        assignment.classIds[index] !== classId
      )
    })))

    setClasses(prev => prev.filter(c => c.id !== classId))
    setStats(prev => ({ ...prev, totalClasses: prev.totalClasses - 1 }))
    setIsLoading(false)
  }

  const openAssignModal = (classInfo: ClassInfo, type: 'student' | 'teacher') => {
    setSelectedClass(classInfo)
    setAssignmentType(type)
    setIsAssignModalOpen(true)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">반 관리</h1>
          <p className="text-text-secondary mt-1">반을 관리하고 학생/교사 배정을 조율합니다</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsCreateModalOpen(true)}
          >
            새 반 만들기
          </Button>
          <Button onClick={() => window.location.reload()}>
            새로고침
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-text-secondary">총 반 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
            <p className="text-xs text-text-secondary">총 학생</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.totalTeachers}</div>
            <p className="text-xs text-text-secondary">총 교사</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.averageStudentsPerClass.toFixed(1)}</div>
            <p className="text-xs text-text-secondary">평균 학생/반</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-indigo-600">{stats.averageTeachersPerClass.toFixed(1)}</div>
            <p className="text-xs text-text-secondary">평균 교사/반</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.unassignedStudents}</div>
            <p className="text-xs text-text-secondary">미배정 학생</p>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="반 이름 또는 설명 검색..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Select
              value={filters.sortBy}
              onValueChange={(value) => handleFilterChange('sortBy', value)}
              options={[
                { value: 'createdAt', label: '생성일' },
                { value: 'name', label: '반 이름' },
                { value: 'studentCount', label: '학생 수' },
                { value: 'teacherCount', label: '교사 수' }
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

      {/* 반 목록 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((classInfo) => (
          <Card key={classInfo.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{classInfo.name}</CardTitle>
                  <p className="text-sm text-text-secondary mt-1">{classInfo.description}</p>
                </div>
                <div className="flex space-x-1">
                  <Badge variant="default">{classInfo.studentCount}명</Badge>
                  <Badge variant="secondary">{classInfo.teacherCount}교사</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">생성일</span>
                  <span className="text-sm">{formatDate(classInfo.createdAt)}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAssignModal(classInfo, 'student')}
                  >
                    학생 배정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAssignModal(classInfo, 'teacher')}
                  >
                    교사 배정
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedClass(classInfo)
                      setIsEditModalOpen(true)
                    }}
                  >
                    편집
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClass(classInfo.id)}
                    disabled={isLoading}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <span className="text-4xl">🏫</span>
              <p className="mt-4 text-text-secondary">검색 조건에 맞는 반을 찾을 수 없습니다</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 생성 모달 */}
      {isCreateModalOpen && (
        <ClassCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateClass}
          isLoading={isLoading}
        />
      )}

      {/* 편집 모달 */}
      {isEditModalOpen && selectedClass && (
        <ClassEditModal
          classInfo={selectedClass}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEditClass}
          isLoading={isLoading}
        />
      )}

      {/* 배정 관리 모달 */}
      {isAssignModalOpen && selectedClass && (
        <AssignmentModal
          classInfo={selectedClass}
          type={assignmentType}
          studentAssignments={studentAssignments}
          teacherAssignments={teacherAssignments}
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onUpdate={(assignments) => {
            if (assignmentType === 'student') {
              setStudentAssignments(assignments as StudentAssignment[])
            } else {
              setTeacherAssignments(assignments as TeacherAssignment[])
            }
          }}
        />
      )}
    </div>
  )
}

// 반 생성 모달
interface ClassCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: { name: string; description: string }) => Promise<void>
  isLoading: boolean
}

const ClassCreateModal: React.FC<ClassCreateModalProps> = ({ isOpen, onClose, onCreate, isLoading }) => {
  const [formData, setFormData] = useState({ name: '', description: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 반 만들기">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">반 이름</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="예: 수학 기초반"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">반 설명</label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="예: 중학교 수학 기초 과정"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '생성 중...' : '생성'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// 반 편집 모달
interface ClassEditModalProps {
  classInfo: ClassInfo
  isOpen: boolean
  onClose: () => void
  onSave: (classData: Partial<ClassInfo>) => Promise<void>
  isLoading: boolean
}

const ClassEditModal: React.FC<ClassEditModalProps> = ({ classInfo, isOpen, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    name: classInfo.name,
    description: classInfo.description
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="반 정보 편집">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">반 이름</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">반 설명</label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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

// 배정 관리 모달  
interface AssignmentModalProps {
  classInfo: ClassInfo
  type: 'student' | 'teacher'
  studentAssignments: StudentAssignment[]
  teacherAssignments: TeacherAssignment[]
  isOpen: boolean
  onClose: () => void
  onUpdate: (assignments: StudentAssignment[] | TeacherAssignment[]) => void
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({ 
  classInfo, type, studentAssignments, teacherAssignments, isOpen, onClose, onUpdate 
}) => {
  const assignments = type === 'student' ? studentAssignments : teacherAssignments
  const title = type === 'student' ? '학생 배정 관리' : '교사 배정 관리'

  const handleToggleAssignment = (userId: string) => {
    if (type === 'student') {
      const updated = studentAssignments.map(assignment => {
        if (assignment.studentId === userId) {
          const isAssigned = assignment.classIds.includes(classInfo.id)
          if (isAssigned) {
            // 배정 해제
            const classIndex = assignment.classIds.indexOf(classInfo.id)
            return {
              ...assignment,
              classIds: assignment.classIds.filter(id => id !== classInfo.id),
              classNames: assignment.classNames.filter((_, index) => index !== classIndex)
            }
          } else {
            // 배정 추가
            return {
              ...assignment,
              classIds: [...assignment.classIds, classInfo.id],
              classNames: [...assignment.classNames, classInfo.name]
            }
          }
        }
        return assignment
      })
      onUpdate(updated)
    } else {
      const updated = teacherAssignments.map(assignment => {
        if (assignment.teacherId === userId) {
          const isAssigned = assignment.classIds.includes(classInfo.id)
          if (isAssigned) {
            // 배정 해제
            const classIndex = assignment.classIds.indexOf(classInfo.id)
            return {
              ...assignment,
              classIds: assignment.classIds.filter(id => id !== classInfo.id),
              classNames: assignment.classNames.filter((_, index) => index !== classIndex)
            }
          } else {
            // 배정 추가
            return {
              ...assignment,
              classIds: [...assignment.classIds, classInfo.id],
              classNames: [...assignment.classNames, classInfo.name]
            }
          }
        }
        return assignment
      })
      onUpdate(updated)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${classInfo.name} - ${title}`}>
      <div className="space-y-4">
        <div className="text-sm text-text-secondary">
          현재 배정 현황을 확인하고 배정/해제할 수 있습니다.
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {assignments.map((assignment) => {
            const userId = type === 'student' && isStudentAssignment(assignment) 
              ? assignment.studentId 
              : type === 'teacher' && isTeacherAssignment(assignment)
              ? assignment.teacherId
              : '';
            
            const userName = type === 'student' && isStudentAssignment(assignment) 
              ? assignment.studentName 
              : type === 'teacher' && isTeacherAssignment(assignment)
              ? assignment.teacherName
              : '';
              
            const userEmail = type === 'student' && isStudentAssignment(assignment) 
              ? assignment.studentEmail 
              : type === 'teacher' && isTeacherAssignment(assignment)
              ? assignment.teacherEmail
              : '';
            const isAssigned = assignment.classIds.includes(classInfo.id)
            const otherClasses = assignment.classNames.filter(name => name !== classInfo.name)

            return (
              <div key={userId} className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="font-medium">{userName}</div>
                      <div className="text-sm text-text-secondary">{userEmail}</div>
                      {otherClasses.length > 0 && (
                        <div className="text-xs text-text-secondary">
                          다른 반: {otherClasses.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={isAssigned ? 'default' : 'secondary'}>
                    {isAssigned ? '배정됨' : '미배정'}
                  </Badge>
                  <Button
                    variant={isAssigned ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => handleToggleAssignment(userId)}
                  >
                    {isAssigned ? '해제' : '배정'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>완료</Button>
        </div>
      </div>
    </Modal>
  )
}