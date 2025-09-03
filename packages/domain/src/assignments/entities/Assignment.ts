import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { AssignmentTarget } from './AssignmentTarget';
import { AssignmentTargetIdentifier } from '../value-objects/AssignmentTargetIdentifier';
import { ClassId } from '../value-objects/ClassId';
import { StudentId } from '../value-objects/StudentId';
import { DueDate } from '../value-objects/DueDate';
import { AssignmentTargetAddedEvent } from '../events/AssignmentTargetAddedEvent';
import { AssignmentTargetRevokedEvent } from '../events/AssignmentTargetRevokedEvent';
import { AssignmentDueDateExtendedEvent } from '../events/AssignmentDueDateExtendedEvent';
import { AssignmentDueDateChangedEvent } from '../events/AssignmentDueDateChangedEvent';

// Assignment 생성을 위한 속성 인터페이스
interface AssignmentProps {
  teacherId: string; // 과제를 생성한 교사 ID
  problemSetId: UniqueEntityID; // 연결된 문제집 ID
  title: string; // 과제 제목
  description?: string; // 과제 설명 (선택적)
  dueDate: DueDate; // 제출 마감일
  maxAttempts?: number; // 최대 시도 횟수 (선택적, 기본값: 무제한)
  isActive: boolean; // 과제 활성 상태
  targets?: AssignmentTarget[]; // 배정 대상들 (선택적)
  createdAt?: Date; // 생성 시각
  updatedAt?: Date; // 수정 시각
}

// 과제 상태 열거형
export enum AssignmentStatus {
  DRAFT = 'DRAFT', // 초안 상태 (학생에게 공개되지 않음)
  ACTIVE = 'ACTIVE', // 활성 상태 (학생이 접근 가능)
  CLOSED = 'CLOSED', // 마감된 상태 (새로운 제출 불가)
  ARCHIVED = 'ARCHIVED' // 보관된 상태 (비활성)
}

// 과제 애그리게이트 루트
// 교사가 문제집을 기반으로 학생들에게 부여하는 과제를 관리
export class Assignment extends AggregateRoot<UniqueEntityID> {
  private _teacherId: string;
  private _problemSetId: UniqueEntityID;
  private _title: string;
  private _description?: string;
  private _dueDate: DueDate;
  private _maxAttempts?: number;
  private _status: AssignmentStatus;
  private _targets: AssignmentTarget[];
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: AssignmentProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID());
    this._teacherId = props.teacherId;
    this._problemSetId = props.problemSetId;
    this._title = props.title;
    this._description = props.description;
    this._dueDate = props.dueDate;
    this._maxAttempts = props.maxAttempts;
    this._status = props.isActive ? AssignmentStatus.ACTIVE : AssignmentStatus.DRAFT;
    this._targets = props.targets || [];
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getter 메서드들 - 내부 상태에 대한 읽기 전용 접근
  get teacherId(): string {
    return this._teacherId;
  }

  get problemSetId(): UniqueEntityID {
    return this._problemSetId;
  }

  get title(): string {
    return this._title;
  }

  get description(): string | undefined {
    return this._description;
  }

  get dueDate(): DueDate {
    return this._dueDate;
  }

  get maxAttempts(): number | undefined {
    return this._maxAttempts;
  }

  get status(): AssignmentStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get targets(): AssignmentTarget[] {
    return [...this._targets];
  }

  get activeTargets(): AssignmentTarget[] {
    return this._targets.filter(target => target.isActive());
  }

  // 비즈니스 로직 메서드들 - 과제의 핵심 도메인 행위

  // 과제 제목 수정
  public updateTitle(title: string): Result<void> {
    if (!title || title.trim().length === 0) {
      return Result.fail<void>('Assignment title cannot be empty');
    }

    if (title.trim().length > 200) {
      return Result.fail<void>('Assignment title cannot exceed 200 characters');
    }

    this._title = title.trim();
    this._updatedAt = new Date();
    return Result.ok<void>();
  }

  // 과제 설명 수정
  public updateDescription(description: string): Result<void> {
    if (description && description.length > 1000) {
      return Result.fail<void>('Assignment description cannot exceed 1000 characters');
    }

    this._description = description?.trim() || undefined;
    this._updatedAt = new Date();
    return Result.ok<void>();
  }

  // 과제 마감일 수정
  public updateDueDate(dueDate: DueDate): Result<void> {
    if (dueDate.isOverdue()) {
      return Result.fail<void>('Due date cannot be in the past');
    }

    this._dueDate = dueDate;
    this._updatedAt = new Date();
    return Result.ok<void>();
  }

  // 마감일 연장
  public extendDueDate(additionalHours: number, extendedBy?: string): Result<void> {
    if (this._status === AssignmentStatus.CLOSED || this._status === AssignmentStatus.ARCHIVED) {
      return Result.fail<void>('Cannot extend due date for closed or archived assignments');
    }

    const previousDueDate = this._dueDate.value;
    const extendedDueDateResult = this._dueDate.extend(additionalHours);
    if (extendedDueDateResult.isFailure) {
      return Result.fail<void>(extendedDueDateResult.error);
    }

    this._dueDate = extendedDueDateResult.value;
    this._updatedAt = new Date();

    // 도메인 이벤트 발생
    if (extendedBy) {
      this.addDomainEvent(new AssignmentDueDateExtendedEvent(
        this.id,
        previousDueDate,
        this._dueDate.value,
        additionalHours,
        extendedBy
      ));
    }

    return Result.ok<void>();
  }

  // 마감일을 특정 날짜로 변경
  public changeDueDateTo(newDueDate: Date, timezone?: string, changedBy?: string, reason?: string): Result<void> {
    if (this._status === AssignmentStatus.CLOSED || this._status === AssignmentStatus.ARCHIVED) {
      return Result.fail<void>('Cannot change due date for closed or archived assignments');
    }

    const dueDateResult = DueDate.create(newDueDate, timezone);
    if (dueDateResult.isFailure) {
      return Result.fail<void>(dueDateResult.error);
    }

    const previousDueDate = this._dueDate.value;
    this._dueDate = dueDateResult.value;
    this._updatedAt = new Date();

    // 도메인 이벤트 발생
    if (changedBy) {
      this.addDomainEvent(new AssignmentDueDateChangedEvent(
        this.id,
        previousDueDate,
        this._dueDate.value,
        changedBy,
        reason
      ));
    }

    return Result.ok<void>();
  }

  // 최대 시도 횟수 설정
  public setMaxAttempts(maxAttempts: number): Result<void> {
    if (maxAttempts < 1) {
      return Result.fail<void>('Max attempts must be at least 1');
    }

    if (maxAttempts > 10) {
      return Result.fail<void>('Max attempts cannot exceed 10');
    }

    this._maxAttempts = maxAttempts;
    this._updatedAt = new Date();
    return Result.ok<void>();
  }

  // 무제한 시도로 설정
  public setUnlimitedAttempts(): void {
    this._maxAttempts = undefined;
    this._updatedAt = new Date();
  }

  // 과제 활성화
  public activate(): Result<void> {
    if (this._status === AssignmentStatus.ARCHIVED) {
      return Result.fail<void>('Cannot activate archived assignment');
    }

    if (this._dueDate.isOverdue()) {
      return Result.fail<void>('Cannot activate assignment with past due date');
    }

    this._status = AssignmentStatus.ACTIVE;
    this._updatedAt = new Date();
    return Result.ok<void>();
  }

  // 과제 비활성화 (초안으로 변경)
  public deactivate(): void {
    this._status = AssignmentStatus.DRAFT;
    this._updatedAt = new Date();
  }

  // 과제 마감
  public close(): Result<void> {
    if (this._status !== AssignmentStatus.ACTIVE) {
      return Result.fail<void>('Only active assignments can be closed');
    }

    this._status = AssignmentStatus.CLOSED;
    this._updatedAt = new Date();
    return Result.ok<void>();
  }

  // 과제 보관
  public archive(): void {
    this._status = AssignmentStatus.ARCHIVED;
    this._updatedAt = new Date();
  }

  // 쿼리 메서드들 - 상태 조회 및 검증

  // 과제가 활성 상태인지 확인
  public isActive(): boolean {
    return this._status === AssignmentStatus.ACTIVE;
  }

  // 과제가 마감되었는지 확인
  public isOverdue(): boolean {
    return this._dueDate.isOverdue();
  }

  // 마감이 임박했는지 확인
  public isDueSoon(hoursThreshold: number = 24): boolean {
    return this._dueDate.isDueSoon(hoursThreshold);
  }

  // 마감까지 남은 시간 (시간 단위)
  public getHoursUntilDue(): number {
    return this._dueDate.getHoursUntilDue();
  }

  // 마감까지 남은 시간 (일 단위)
  public getDaysUntilDue(): number {
    return this._dueDate.getDaysUntilDue();
  }

  // 마감일 상태 메시지
  public getDueDateStatus(): string {
    return this._dueDate.getStatusMessage();
  }

  // 학생이 접근 가능한 상태인지 확인
  public isAccessibleToStudents(): boolean {
    return this._status === AssignmentStatus.ACTIVE && !this.isOverdue();
  }

  // 과제 소유자 확인
  public isOwnedBy(teacherId: string): boolean {
    return this._teacherId === teacherId;
  }

  // 시도 횟수 제한이 있는지 확인
  public hasAttemptLimit(): boolean {
    return this._maxAttempts !== undefined;
  }

  // 배정 관련 비즈니스 로직 메서드들

  // 반에 과제 배정
  public assignToClass(classId: ClassId, assignedBy: string): Result<void> {
    // 타입 안전성 검증
    const targetIdentifierResult = AssignmentTargetIdentifier.createForClass(classId);
    if (targetIdentifierResult.isFailure) {
      return Result.fail<void>(targetIdentifierResult.error);
    }

    const targetIdentifier = targetIdentifierResult.value;

    // 중복 배정 검사
    if (this.isAlreadyAssignedTo(targetIdentifier)) {
      return Result.fail<void>('Assignment is already assigned to this class');
    }

    // 새로운 배정 대상 생성
    const targetResult = AssignmentTarget.create(this.id, targetIdentifier, assignedBy);
    if (targetResult.isFailure) {
      return Result.fail<void>(targetResult.error);
    }

    this._targets.push(targetResult.value);
    this._updatedAt = new Date();

    // 도메인 이벤트 발생
    this.addDomainEvent(new AssignmentTargetAddedEvent(
      this.id,
      targetIdentifier.type,
      targetIdentifier.getTargetId(),
      assignedBy
    ));

    return Result.ok<void>();
  }

  // 개별 학생에게 과제 배정
  public assignToStudent(studentId: StudentId, assignedBy: string): Result<void> {
    // 타입 안전성 검증
    const targetIdentifierResult = AssignmentTargetIdentifier.createForStudent(studentId);
    if (targetIdentifierResult.isFailure) {
      return Result.fail<void>(targetIdentifierResult.error);
    }

    const targetIdentifier = targetIdentifierResult.value;

    // 중복 배정 검사
    if (this.isAlreadyAssignedTo(targetIdentifier)) {
      return Result.fail<void>('Assignment is already assigned to this student');
    }

    // 새로운 배정 대상 생성
    const targetResult = AssignmentTarget.create(this.id, targetIdentifier, assignedBy);
    if (targetResult.isFailure) {
      return Result.fail<void>(targetResult.error);
    }

    this._targets.push(targetResult.value);
    this._updatedAt = new Date();

    // 도메인 이벤트 발생
    this.addDomainEvent(new AssignmentTargetAddedEvent(
      this.id,
      targetIdentifier.type,
      targetIdentifier.getTargetId(),
      assignedBy
    ));

    return Result.ok<void>();
  }

  // 여러 대상에게 동시 배정
  public assignToMultipleTargets(
    targetIdentifiers: AssignmentTargetIdentifier[], 
    assignedBy: string
  ): Result<void> {
    // 중복 배정 검사
    for (const identifier of targetIdentifiers) {
      if (this.isAlreadyAssignedTo(identifier)) {
        return Result.fail<void>(`Assignment is already assigned to ${identifier.toString()}`);
      }
    }

    // 모든 대상에 배정
    const newTargets: AssignmentTarget[] = [];
    for (const identifier of targetIdentifiers) {
      const targetResult = AssignmentTarget.create(this.id, identifier, assignedBy);
      if (targetResult.isFailure) {
        return Result.fail<void>(targetResult.error);
      }
      newTargets.push(targetResult.value);
    }

    this._targets.push(...newTargets);
    this._updatedAt = new Date();

    return Result.ok<void>();
  }

  // 배정 취소
  public revokeAssignment(targetIdentifier: AssignmentTargetIdentifier, revokedBy: string): Result<void> {
    const target = this._targets.find(t => 
      t.isActive() && t.isAssignedTo(targetIdentifier)
    );

    if (!target) {
      return Result.fail<void>('No active assignment found for the specified target');
    }

    const revokeResult = target.revokeAssignment(revokedBy);
    if (revokeResult.isFailure) {
      return Result.fail<void>(revokeResult.error);
    }

    this._updatedAt = new Date();

    // 도메인 이벤트 발생
    this.addDomainEvent(new AssignmentTargetRevokedEvent(
      this.id,
      target.targetIdentifier.type,
      target.targetIdentifier.getTargetId(),
      revokedBy
    ));

    return Result.ok<void>();
  }

  // 모든 배정 취소
  public revokeAllAssignments(revokedBy: string): Result<void> {
    const activeTargets = this._targets.filter(t => t.isActive());
    
    if (activeTargets.length === 0) {
      return Result.fail<void>('No active assignments to revoke');
    }

    for (const target of activeTargets) {
      const revokeResult = target.revokeAssignment(revokedBy);
      if (revokeResult.isFailure) {
        return Result.fail<void>(`Failed to revoke assignment: ${revokeResult.error}`);
      }
    }

    this._updatedAt = new Date();
    return Result.ok<void>();
  }

  // 배정 관련 쿼리 메서드들

  // 특정 대상에게 이미 배정되었는지 확인
  public isAlreadyAssignedTo(targetIdentifier: AssignmentTargetIdentifier): boolean {
    return this._targets.some(target => 
      target.isActive() && target.isAssignedTo(targetIdentifier)
    );
  }

  // 반에 배정되었는지 확인
  public isAssignedToClass(classId: ClassId): boolean {
    const targetIdentifierResult = AssignmentTargetIdentifier.createForClass(classId);
    if (targetIdentifierResult.isFailure) {
      return false;
    }
    return this.isAlreadyAssignedTo(targetIdentifierResult.value);
  }

  // 개별 학생에게 배정되었는지 확인
  public isAssignedToStudent(studentId: StudentId): boolean {
    const targetIdentifierResult = AssignmentTargetIdentifier.createForStudent(studentId);
    if (targetIdentifierResult.isFailure) {
      return false;
    }
    return this.isAlreadyAssignedTo(targetIdentifierResult.value);
  }

  // 배정된 반 목록 조회
  public getAssignedClasses(): ClassId[] {
    return this._targets
      .filter(target => target.isActive() && target.isClassTarget())
      .map(target => target.targetIdentifier.classId!)
      .filter(classId => classId !== undefined);
  }

  // 배정된 학생 목록 조회
  public getAssignedStudents(): StudentId[] {
    return this._targets
      .filter(target => target.isActive() && target.isStudentTarget())
      .map(target => target.targetIdentifier.studentId!)
      .filter(studentId => studentId !== undefined);
  }

  // 배정이 있는지 확인
  public hasActiveAssignments(): boolean {
    return this._targets.some(target => target.isActive());
  }

  // 활성 배정 수 조회
  public getActiveAssignmentCount(): number {
    return this._targets.filter(target => target.isActive()).length;
  }

  // 팩토리 메서드들 - 안전한 인스턴스 생성

  // 새 과제 생성
  public static create(props: Omit<AssignmentProps, 'isActive'>, id?: UniqueEntityID): Result<Assignment> {
    // 교사 ID 검증
    if (!props.teacherId || props.teacherId.trim().length === 0) {
      return Result.fail<Assignment>('Teacher ID is required');
    }

    // 제목 검증
    if (!props.title || props.title.trim().length === 0) {
      return Result.fail<Assignment>('Assignment title is required');
    }

    if (props.title.trim().length > 200) {
      return Result.fail<Assignment>('Assignment title cannot exceed 200 characters');
    }

    // 설명 검증
    if (props.description && props.description.length > 1000) {
      return Result.fail<Assignment>('Assignment description cannot exceed 1000 characters');
    }

    // 마감일 검증 (DueDate 값 객체에서 이미 검증됨)
    if (props.dueDate.isOverdue()) {
      return Result.fail<Assignment>('Due date cannot be in the past');
    }

    // 최대 시도 횟수 검증
    if (props.maxAttempts !== undefined) {
      if (props.maxAttempts < 1 || props.maxAttempts > 10) {
        return Result.fail<Assignment>('Max attempts must be between 1 and 10');
      }
    }

    const assignmentProps: AssignmentProps = {
      ...props,
      isActive: false // 새로 생성된 과제는 기본적으로 초안 상태
    };

    const assignment = new Assignment(assignmentProps, id);
    
    return Result.ok<Assignment>(assignment);
  }

  // 활성 상태로 과제 생성
  public static createActive(props: Omit<AssignmentProps, 'isActive'>, id?: UniqueEntityID): Result<Assignment> {
    const createResult = Assignment.create(props, id);
    if (createResult.isFailure) {
      return createResult;
    }

    const assignment = createResult.value;
    const activateResult = assignment.activate();
    if (activateResult.isFailure) {
      return Result.fail<Assignment>(activateResult.error);
    }

    return Result.ok<Assignment>(assignment);
  }
}