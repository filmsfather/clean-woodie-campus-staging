import React, { useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Grid,
  Input,
} from '../ui'

interface Student {
  id: string
  name: string
  email: string
  isSelected: boolean
}

interface Class {
  id: string
  name: string
  studentCount: number
  isSelected: boolean
}

// Mock data
const mockClasses: Class[] = [
  { id: '1', name: '1학년 1반', studentCount: 28, isSelected: false },
  { id: '2', name: '1학년 2반', studentCount: 30, isSelected: false },
  { id: '3', name: '1학년 3반', studentCount: 27, isSelected: true },
  { id: '4', name: '2학년 1반', studentCount: 29, isSelected: false },
]

const mockStudents: Student[] = [
  { id: '1', name: '김학생', email: 'kim@example.com', isSelected: true },
  { id: '2', name: '이학생', email: 'lee@example.com', isSelected: false },
  { id: '3', name: '박학생', email: 'park@example.com', isSelected: true },
  { id: '4', name: '최학생', email: 'choi@example.com', isSelected: false },
  { id: '5', name: '정학생', email: 'jung@example.com', isSelected: false },
]

interface ProblemSetAssignmentProps {
  problemSetId: string
  problemSetTitle: string
  onClose: () => void
}

export function ProblemSetAssignment({ 
  problemSetId, 
  problemSetTitle, 
  onClose 
}: ProblemSetAssignmentProps) {
  const [assignmentType, setAssignmentType] = useState<'class' | 'individual'>('class')
  const [selectedClasses, setSelectedClasses] = useState<Class[]>(mockClasses)
  const [selectedStudents, setSelectedStudents] = useState<Student[]>(mockStudents)
  const [dueDate, setDueDate] = useState('')
  const [instructions, setInstructions] = useState('')

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev =>
      prev.map(cls =>
        cls.id === classId
          ? { ...cls, isSelected: !cls.isSelected }
          : cls
      )
    )
  }

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.map(student =>
        student.id === studentId
          ? { ...student, isSelected: !student.isSelected }
          : student
      )
    )
  }

  const handleSelectAllClasses = () => {
    const allSelected = selectedClasses.every(cls => cls.isSelected)
    setSelectedClasses(prev =>
      prev.map(cls => ({ ...cls, isSelected: !allSelected }))
    )
  }

  const handleSelectAllStudents = () => {
    const allSelected = selectedStudents.every(student => student.isSelected)
    setSelectedStudents(prev =>
      prev.map(student => ({ ...student, isSelected: !allSelected }))
    )
  }

  const getSelectedCount = () => {
    if (assignmentType === 'class') {
      return selectedClasses
        .filter(cls => cls.isSelected)
        .reduce((total, cls) => total + cls.studentCount, 0)
    } else {
      return selectedStudents.filter(student => student.isSelected).length
    }
  }

  const handleAssign = () => {
    const assignmentData = {
      problemSetId,
      type: assignmentType,
      dueDate,
      instructions,
      ...(assignmentType === 'class' 
        ? { classIds: selectedClasses.filter(cls => cls.isSelected).map(cls => cls.id) }
        : { studentIds: selectedStudents.filter(student => student.isSelected).map(student => student.id) }
      )
    }

    console.log('배정 데이터:', assignmentData)
    // API 호출로 배정 실행
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>문제집 배정</CardTitle>
              <p className="text-text-secondary mt-1">{problemSetTitle}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto space-y-6">
          {/* Assignment Type Selection */}
          <div>
            <h3 className="font-semibold text-text-primary mb-3">배정 방식</h3>
            <div className="flex gap-4">
              <Button
                variant={assignmentType === 'class' ? 'default' : 'outline'}
                onClick={() => setAssignmentType('class')}
              >
                반별 배정
              </Button>
              <Button
                variant={assignmentType === 'individual' ? 'default' : 'outline'}
                onClick={() => setAssignmentType('individual')}
              >
                개별 배정
              </Button>
            </div>
          </div>

          {/* Class Selection */}
          {assignmentType === 'class' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-text-primary">반 선택</h3>
                <Button variant="outline" size="sm" onClick={handleSelectAllClasses}>
                  {selectedClasses.every(cls => cls.isSelected) ? '전체 해제' : '전체 선택'}
                </Button>
              </div>
              <Grid cols={{ base: 1, sm: 2 }} gap={3}>
                {selectedClasses.map((cls) => (
                  <Card
                    key={cls.id}
                    className={`cursor-pointer transition-colors ${
                      cls.isSelected ? 'ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-950' : ''
                    }`}
                    onClick={() => handleClassToggle(cls.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-text-primary">{cls.name}</h4>
                          <p className="text-sm text-text-secondary">{cls.studentCount}명</p>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          cls.isSelected 
                            ? 'bg-brand-500 border-brand-500 text-white' 
                            : 'border-border-primary'
                        }`}>
                          {cls.isSelected && <span className="text-xs">✓</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </Grid>
            </div>
          )}

          {/* Individual Student Selection */}
          {assignmentType === 'individual' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-text-primary">학생 선택</h3>
                <Button variant="outline" size="sm" onClick={handleSelectAllStudents}>
                  {selectedStudents.every(student => student.isSelected) ? '전체 해제' : '전체 선택'}
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedStudents.map((student) => (
                  <Card
                    key={student.id}
                    className={`cursor-pointer transition-colors ${
                      student.isSelected ? 'ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-950' : ''
                    }`}
                    onClick={() => handleStudentToggle(student.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-text-primary">{student.name}</h4>
                          <p className="text-sm text-text-secondary">{student.email}</p>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          student.isSelected 
                            ? 'bg-brand-500 border-brand-500 text-white' 
                            : 'border-border-primary'
                        }`}>
                          {student.isSelected && <span className="text-xs">✓</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Due Date and Instructions */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-primary block mb-2">
                마감일 (선택사항)
              </label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary block mb-2">
                특별 지시사항 (선택사항)
              </label>
              <textarea
                className="w-full p-3 text-sm border border-border-primary rounded-lg bg-surface-primary text-text-primary placeholder-text-tertiary resize-none"
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="학생들에게 전달할 특별한 지시사항이 있다면 입력하세요"
              />
            </div>
          </div>

          {/* Summary */}
          <Card className="bg-surface-secondary">
            <CardContent className="p-4">
              <h4 className="font-semibold text-text-primary mb-2">배정 요약</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">배정 대상:</span>
                  <span className="font-medium text-text-primary">
                    {getSelectedCount()}명의 학생
                  </span>
                </div>
                {dueDate && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">마감일:</span>
                    <span className="font-medium text-text-primary">
                      {new Date(dueDate).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button 
            variant="default" 
            onClick={handleAssign}
            disabled={getSelectedCount() === 0}
          >
            {getSelectedCount()}명에게 배정하기
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}