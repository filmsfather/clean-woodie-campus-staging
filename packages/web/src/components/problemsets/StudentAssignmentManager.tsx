import React, { useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Checkbox,
  Badge,
  Grid,
} from '../ui';

export interface Student {
  id: string;
  name: string;
  email: string;
  classId: string;
  className: string;
  isActive: boolean;
}

export interface ClassGroup {
  id: string;
  name: string;
  studentCount: number;
  students: Student[];
}

export interface AssignmentSettings {
  dueDate?: Date;
  allowLateSubmission: boolean;
  showResults: boolean;
  shuffleQuestions: boolean;
  timeLimit?: number; // 분 단위
  maxAttempts: number;
  instructions?: string;
}

interface StudentAssignmentManagerProps {
  problemSetId: string;
  problemSetTitle: string;
  onAssign?: (studentIds: string[], settings: AssignmentSettings) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

// Mock 데이터
const MOCK_CLASSES: ClassGroup[] = [
  {
    id: '1',
    name: '1-1반',
    studentCount: 28,
    students: [
      { id: '1', name: '김철수', email: 'kim@school.edu', classId: '1', className: '1-1반', isActive: true },
      { id: '2', name: '이영희', email: 'lee@school.edu', classId: '1', className: '1-1반', isActive: true },
      { id: '3', name: '박민수', email: 'park@school.edu', classId: '1', className: '1-1반', isActive: false },
      // ... 더 많은 학생들
    ]
  },
  {
    id: '2',
    name: '1-2반',
    studentCount: 30,
    students: [
      { id: '4', name: '최지은', email: 'choi@school.edu', classId: '2', className: '1-2반', isActive: true },
      { id: '5', name: '정현우', email: 'jung@school.edu', classId: '2', className: '1-2반', isActive: true },
      // ... 더 많은 학생들
    ]
  },
];

export function StudentAssignmentManager({
  problemSetId,
  problemSetTitle,
  onAssign,
  onCancel,
  isLoading = false,
}: StudentAssignmentManagerProps) {
  const [classes] = useState(MOCK_CLASSES);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [showInactiveStudents, setShowInactiveStudents] = useState(false);

  const [assignmentSettings, setAssignmentSettings] = useState<AssignmentSettings>({
    allowLateSubmission: false,
    showResults: true,
    shuffleQuestions: false,
    maxAttempts: 1,
  });

  // 모든 학생 목록
  const allStudents = classes.flatMap(cls => cls.students);

  // 필터링된 학생 목록
  const filteredStudents = allStudents.filter(student => {
    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (!student.name.toLowerCase().includes(query) && 
          !student.email.toLowerCase().includes(query)) {
        return false;
      }
    }

    // 반 필터
    if (selectedClassId !== 'all' && student.classId !== selectedClassId) {
      return false;
    }

    // 활성 상태 필터
    if (!showInactiveStudents && !student.isActive) {
      return false;
    }

    return true;
  });

  const handleStudentToggle = useCallback((studentId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  }, []);

  const handleClassToggle = useCallback((classId: string, isSelected: boolean) => {
    const classStudents = classes.find(cls => cls.id === classId)?.students || [];
    const activeStudents = showInactiveStudents 
      ? classStudents 
      : classStudents.filter(s => s.isActive);
    
    const studentIds = activeStudents.map(s => s.id);

    if (isSelected) {
      setSelectedStudents(prev => [...new Set([...prev, ...studentIds])]);
    } else {
      setSelectedStudents(prev => prev.filter(id => !studentIds.includes(id)));
    }
  }, [classes, showInactiveStudents]);

  const handleSelectAll = useCallback(() => {
    const activeStudents = showInactiveStudents 
      ? filteredStudents 
      : filteredStudents.filter(s => s.isActive);
    setSelectedStudents(activeStudents.map(s => s.id));
  }, [filteredStudents, showInactiveStudents]);

  const handleDeselectAll = useCallback(() => {
    setSelectedStudents([]);
  }, []);

  const handleSettingChange = useCallback(<K extends keyof AssignmentSettings>(
    key: K,
    value: AssignmentSettings[K]
  ) => {
    setAssignmentSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleAssign = useCallback(async () => {
    if (selectedStudents.length === 0) {
      alert('배정할 학생을 선택해주세요.');
      return;
    }

    try {
      await onAssign?.(selectedStudents, assignmentSettings);
    } catch (error) {
      console.error('배정 중 오류:', error);
      alert('배정 중 오류가 발생했습니다.');
    }
  }, [selectedStudents, assignmentSettings, onAssign]);

  const formatDateTime = (date: Date) => {
    return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  };

  const parseDateTime = (value: string): Date => {
    return new Date(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">학생 배정</h1>
          <p className="text-text-secondary">
            "{problemSetTitle}" 문제집을 학생들에게 배정합니다.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            취소
          </Button>
          <Button 
            variant="default" 
            onClick={handleAssign} 
            disabled={isLoading || selectedStudents.length === 0}
          >
            {isLoading ? '배정 중...' : `${selectedStudents.length}명에게 배정`}
          </Button>
        </div>
      </div>

      <Grid cols={{ base: 1, lg: 3 }} gap={6}>
        {/* 학생 선택 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 검색 및 필터 */}
          <Card>
            <CardHeader>
              <CardTitle>학생 선택</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="학생 이름이나 이메일로 검색..."
                  className="flex-1"
                />
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-text-primary"
                >
                  <option value="all">전체 반</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.studentCount}명)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={showInactiveStudents}
                    onChange={setShowInactiveStudents}
                  />
                  비활성 학생 포함
                </label>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                    disabled={filteredStudents.length === 0}
                  >
                    전체 선택
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeselectAll}
                    disabled={selectedStudents.length === 0}
                  >
                    선택 해제
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 반별 선택 */}
          <Card>
            <CardHeader>
              <CardTitle>반별 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {classes.map(cls => {
                  const classStudents = cls.students.filter(s => 
                    showInactiveStudents || s.isActive
                  );
                  const selectedCount = classStudents.filter(s => 
                    selectedStudents.includes(s.id)
                  ).length;
                  const isAllSelected = classStudents.length > 0 && 
                    selectedCount === classStudents.length;
                  const isPartiallySelected = selectedCount > 0 && selectedCount < classStudents.length;

                  return (
                    <label
                      key={cls.id}
                      className={`
                        flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                        ${isAllSelected 
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                          : 'border-border-primary hover:bg-surface-secondary'
                        }
                      `}
                    >
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isPartiallySelected}
                        onChange={(checked) => handleClassToggle(cls.id, checked)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{cls.name}</div>
                        <div className="text-sm text-text-secondary">
                          {selectedCount}/{classStudents.length}명 선택됨
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 학생 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>
                학생 목록 ({filteredStudents.length}명)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">👥</div>
                  <p className="text-text-secondary">
                    조건에 맞는 학생이 없습니다.
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {filteredStudents.map(student => {
                      const isSelected = selectedStudents.includes(student.id);
                      
                      return (
                        <label
                          key={student.id}
                          className={`
                            flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                            ${isSelected 
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                              : 'border-border-primary hover:bg-surface-secondary'
                            }
                            ${!student.isActive ? 'opacity-60' : ''}
                          `}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={(checked) => handleStudentToggle(student.id, checked)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{student.name}</span>
                              {!student.isActive && (
                                <Badge variant="outline" size="sm">비활성</Badge>
                              )}
                            </div>
                            <div className="text-sm text-text-secondary">
                              {student.email} • {student.className}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 배정 설정 */}
        <div className="space-y-6">
          {/* 선택 요약 */}
          <Card className="bg-surface-secondary">
            <CardHeader>
              <CardTitle>선택 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">선택된 학생:</span>
                  <span className="font-medium">{selectedStudents.length}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">전체 학생:</span>
                  <span className="font-medium">{allStudents.filter(s => s.isActive).length}명</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 배정 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>배정 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  마감일 (선택사항)
                </label>
                <input
                  type="datetime-local"
                  value={assignmentSettings.dueDate ? formatDateTime(assignmentSettings.dueDate) : ''}
                  onChange={(e) => handleSettingChange('dueDate', e.target.value ? parseDateTime(e.target.value) : undefined)}
                  className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-text-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  제한 시간 (분, 선택사항)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="300"
                  value={assignmentSettings.timeLimit || ''}
                  onChange={(e) => handleSettingChange('timeLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="예: 60"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  최대 시도 횟수
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={assignmentSettings.maxAttempts}
                  onChange={(e) => handleSettingChange('maxAttempts', parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={assignmentSettings.allowLateSubmission}
                    onChange={(checked) => handleSettingChange('allowLateSubmission', checked)}
                  />
                  늦은 제출 허용
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={assignmentSettings.showResults}
                    onChange={(checked) => handleSettingChange('showResults', checked)}
                  />
                  결과 즉시 공개
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={assignmentSettings.shuffleQuestions}
                    onChange={(checked) => handleSettingChange('shuffleQuestions', checked)}
                  />
                  문제 순서 랜덤 배치
                </label>
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">
                  안내사항 (선택사항)
                </label>
                <textarea
                  className="w-full p-3 text-sm border border-border-primary rounded-lg bg-surface-primary text-text-primary placeholder-text-tertiary resize-none"
                  rows={4}
                  value={assignmentSettings.instructions || ''}
                  onChange={(e) => handleSettingChange('instructions', e.target.value)}
                  placeholder="학생들에게 전달할 안내사항을 입력하세요..."
                />
              </div>
            </CardContent>
          </Card>

          {/* 미리보기 */}
          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="py-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                📋 배정 미리보기
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <div>• {selectedStudents.length}명의 학생에게 배정</div>
                {assignmentSettings.dueDate && (
                  <div>• 마감일: {assignmentSettings.dueDate.toLocaleDateString('ko-KR')}</div>
                )}
                {assignmentSettings.timeLimit && (
                  <div>• 제한시간: {assignmentSettings.timeLimit}분</div>
                )}
                <div>• 최대 {assignmentSettings.maxAttempts}회 시도 가능</div>
                {assignmentSettings.allowLateSubmission && (
                  <div>• 늦은 제출 허용</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Grid>
    </div>
  );
}