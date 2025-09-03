import { describe, it, expect, beforeEach } from 'vitest';
import { Assignment, AssignmentStatus } from '../../assignments/entities/Assignment';
import { UniqueEntityID } from '../../common/Identifier';

describe('Assignment', () => {
  let teacherId: string;
  let problemSetId: UniqueEntityID;
  let validTitle: string;
  let validDescription: string;
  let futureDate: Date;
  let pastDate: Date;

  beforeEach(() => {
    teacherId = 'teacher-123';
    problemSetId = new UniqueEntityID('problemset-456');
    validTitle = '중간고사 수학 과제';
    validDescription = '1학기 중간고사 대비 수학 문제 풀이 과제';
    
    futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7일 후
    
    pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // 1일 전
  });

  describe('생성', () => {
    it('유효한 정보로 과제를 생성할 수 있다', () => {
      const result = Assignment.create({
        teacherId,
        problemSetId,
        title: validTitle,
        description: validDescription,
        dueDate: futureDate,
        maxAttempts: 3
      });

      expect(result.isSuccess).toBe(true);
      const assignment = result.value;
      expect(assignment.teacherId).toBe(teacherId);
      expect(assignment.problemSetId).toBe(problemSetId);
      expect(assignment.title).toBe(validTitle);
      expect(assignment.description).toBe(validDescription);
      expect(assignment.dueDate).toBe(futureDate);
      expect(assignment.maxAttempts).toBe(3);
      expect(assignment.status).toBe(AssignmentStatus.DRAFT);
    });

    it('설명과 최대 시도 횟수 없이도 과제를 생성할 수 있다', () => {
      const result = Assignment.create({
        teacherId,
        problemSetId,
        title: validTitle,
        dueDate: futureDate
      });

      expect(result.isSuccess).toBe(true);
      const assignment = result.value;
      expect(assignment.description).toBeUndefined();
      expect(assignment.maxAttempts).toBeUndefined();
      expect(assignment.hasAttemptLimit()).toBe(false);
    });

    it('활성 상태로 과제를 생성할 수 있다', () => {
      const result = Assignment.createActive({
        teacherId,
        problemSetId,
        title: validTitle,
        dueDate: futureDate
      });

      expect(result.isSuccess).toBe(true);
      const assignment = result.value;
      expect(assignment.status).toBe(AssignmentStatus.ACTIVE);
      expect(assignment.isActive()).toBe(true);
    });

    it('교사 ID가 비어있으면 생성에 실패한다', () => {
      const result = Assignment.create({
        teacherId: '',
        problemSetId,
        title: validTitle,
        dueDate: futureDate
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Teacher ID is required');
    });

    it('제목이 비어있으면 생성에 실패한다', () => {
      const result = Assignment.create({
        teacherId,
        problemSetId,
        title: '',
        dueDate: futureDate
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Assignment title is required');
    });

    it('과거 날짜로 마감일을 설정하면 생성에 실패한다', () => {
      const result = Assignment.create({
        teacherId,
        problemSetId,
        title: validTitle,
        dueDate: pastDate
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Due date must be in the future');
    });

    it('최대 시도 횟수가 범위를 벗어나면 생성에 실패한다', () => {
      const result1 = Assignment.create({
        teacherId,
        problemSetId,
        title: validTitle,
        dueDate: futureDate,
        maxAttempts: 0
      });

      const result2 = Assignment.create({
        teacherId,
        problemSetId,
        title: validTitle,
        dueDate: futureDate,
        maxAttempts: 15
      });

      expect(result1.isFailure).toBe(true);
      expect(result2.isFailure).toBe(true);
      expect(result1.error).toContain('Max attempts must be between 1 and 10');
      expect(result2.error).toContain('Max attempts must be between 1 and 10');
    });
  });

  describe('과제 정보 수정', () => {
    let assignment: Assignment;

    beforeEach(() => {
      const result = Assignment.create({
        teacherId,
        problemSetId,
        title: validTitle,
        dueDate: futureDate
      });
      assignment = result.value;
    });

    it('과제 제목을 수정할 수 있다', () => {
      const newTitle = '기말고사 수학 과제';
      const result = assignment.updateTitle(newTitle);

      expect(result.isSuccess).toBe(true);
      expect(assignment.title).toBe(newTitle);
    });

    it('빈 제목으로 수정할 수 없다', () => {
      const result = assignment.updateTitle('');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Assignment title cannot be empty');
      expect(assignment.title).toBe(validTitle); // 변경되지 않음
    });

    it('과제 설명을 수정할 수 있다', () => {
      const newDescription = '기말고사 대비 심화 문제 풀이';
      const result = assignment.updateDescription(newDescription);

      expect(result.isSuccess).toBe(true);
      expect(assignment.description).toBe(newDescription);
    });

    it('과제 마감일을 수정할 수 있다', () => {
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 14);
      
      const result = assignment.updateDueDate(newDueDate);

      expect(result.isSuccess).toBe(true);
      expect(assignment.dueDate).toBe(newDueDate);
    });

    it('과거 날짜로 마감일을 수정할 수 없다', () => {
      const result = assignment.updateDueDate(pastDate);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Due date must be in the future');
    });
  });

  describe('시도 횟수 관리', () => {
    let assignment: Assignment;

    beforeEach(() => {
      const result = Assignment.create({
        teacherId,
        problemSetId,
        title: validTitle,
        dueDate: futureDate
      });
      assignment = result.value;
    });

    it('최대 시도 횟수를 설정할 수 있다', () => {
      const result = assignment.setMaxAttempts(5);

      expect(result.isSuccess).toBe(true);
      expect(assignment.maxAttempts).toBe(5);
      expect(assignment.hasAttemptLimit()).toBe(true);
    });

    it('무제한 시도로 설정할 수 있다', () => {
      assignment.setMaxAttempts(3); // 먼저 제한 설정
      assignment.setUnlimitedAttempts();

      expect(assignment.maxAttempts).toBeUndefined();
      expect(assignment.hasAttemptLimit()).toBe(false);
    });

    it('잘못된 시도 횟수는 설정할 수 없다', () => {
      const result1 = assignment.setMaxAttempts(0);
      const result2 = assignment.setMaxAttempts(15);

      expect(result1.isFailure).toBe(true);
      expect(result2.isFailure).toBe(true);
    });
  });

  describe('과제 상태 관리', () => {
    let assignment: Assignment;

    beforeEach(() => {
      const result = Assignment.create({
        teacherId,
        problemSetId,
        title: validTitle,
        dueDate: futureDate
      });
      assignment = result.value;
    });

    it('과제를 활성화할 수 있다', () => {
      const result = assignment.activate();

      expect(result.isSuccess).toBe(true);
      expect(assignment.status).toBe(AssignmentStatus.ACTIVE);
      expect(assignment.isActive()).toBe(true);
    });

    it('과제를 비활성화할 수 있다', () => {
      assignment.activate();
      assignment.deactivate();

      expect(assignment.status).toBe(AssignmentStatus.DRAFT);
      expect(assignment.isActive()).toBe(false);
    });

    it('활성 과제를 마감할 수 있다', () => {
      assignment.activate();
      const result = assignment.close();

      expect(result.isSuccess).toBe(true);
      expect(assignment.status).toBe(AssignmentStatus.CLOSED);
    });

    it('비활성 과제는 마감할 수 없다', () => {
      const result = assignment.close();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Only active assignments can be closed');
    });

    it('과제를 보관할 수 있다', () => {
      assignment.archive();

      expect(assignment.status).toBe(AssignmentStatus.ARCHIVED);
    });

    it('보관된 과제는 활성화할 수 없다', () => {
      assignment.archive();
      const result = assignment.activate();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Cannot activate archived assignment');
    });
  });

  describe('쿼리 메서드', () => {
    let assignment: Assignment;

    beforeEach(() => {
      const result = Assignment.create({
        teacherId,
        problemSetId,
        title: validTitle,
        dueDate: futureDate
      });
      assignment = result.value;
    });

    it('과제 소유자를 확인할 수 있다', () => {
      expect(assignment.isOwnedBy(teacherId)).toBe(true);
      expect(assignment.isOwnedBy('other-teacher')).toBe(false);
    });

    it('마감 여부를 확인할 수 있다', () => {
      expect(assignment.isOverdue()).toBe(false);

      // 과거 날짜로 만든 과제 (직접 생성자 사용)
      const overdueAssignment = new Assignment({
        teacherId,
        problemSetId,
        title: validTitle,
        dueDate: pastDate,
        isActive: false
      });

      expect(overdueAssignment.isOverdue()).toBe(true);
    });

    it('학생 접근 가능 여부를 확인할 수 있다', () => {
      // 초안 상태 - 접근 불가
      expect(assignment.isAccessibleToStudents()).toBe(false);

      // 활성화 - 접근 가능
      assignment.activate();
      expect(assignment.isAccessibleToStudents()).toBe(true);

      // 마감 - 접근 불가
      assignment.close();
      expect(assignment.isAccessibleToStudents()).toBe(false);
    });
  });

  describe('경계 조건', () => {
    it('제목 길이 제한을 확인한다', () => {
      const longTitle = 'a'.repeat(201); // 200자 초과
      const result = Assignment.create({
        teacherId,
        problemSetId,
        title: longTitle,
        dueDate: futureDate
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Assignment title cannot exceed 200 characters');
    });

    it('설명 길이 제한을 확인한다', () => {
      const longDescription = 'a'.repeat(1001); // 1000자 초과
      const result = Assignment.create({
        teacherId,
        problemSetId,
        title: validTitle,
        description: longDescription,
        dueDate: futureDate
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Assignment description cannot exceed 1000 characters');
    });
  });
});