import { AggregateRoot } from '../../aggregates/AggregateRoot';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { AssignmentTarget } from './AssignmentTarget';
import { AssignmentTargetIdentifier } from '../value-objects/AssignmentTargetIdentifier';
import { DueDate } from '../value-objects/DueDate';
import { AssignmentTargetAddedEvent } from '../events/AssignmentTargetAddedEvent';
import { AssignmentTargetRevokedEvent } from '../events/AssignmentTargetRevokedEvent';
import { AssignmentDueDateExtendedEvent } from '../events/AssignmentDueDateExtendedEvent';
import { AssignmentDueDateChangedEvent } from '../events/AssignmentDueDateChangedEvent';
// 과제 상태 열거형
export var AssignmentStatus;
(function (AssignmentStatus) {
    AssignmentStatus["DRAFT"] = "DRAFT";
    AssignmentStatus["ACTIVE"] = "ACTIVE";
    AssignmentStatus["CLOSED"] = "CLOSED";
    AssignmentStatus["ARCHIVED"] = "ARCHIVED"; // 보관된 상태 (비활성)
})(AssignmentStatus || (AssignmentStatus = {}));
// 과제 애그리게이트 루트
// 교사가 문제집을 기반으로 학생들에게 부여하는 과제를 관리
export class Assignment extends AggregateRoot {
    _teacherId;
    _problemSetId;
    _title;
    _description;
    _dueDate;
    _maxAttempts;
    _status;
    _targets;
    _createdAt;
    _updatedAt;
    constructor(props, id) {
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
    get teacherId() {
        return this._teacherId;
    }
    get problemSetId() {
        return this._problemSetId;
    }
    get title() {
        return this._title;
    }
    get description() {
        return this._description;
    }
    get dueDate() {
        return this._dueDate;
    }
    get maxAttempts() {
        return this._maxAttempts;
    }
    get status() {
        return this._status;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    get targets() {
        return [...this._targets];
    }
    get activeTargets() {
        return this._targets.filter(target => target.isActive());
    }
    // 비즈니스 로직 메서드들 - 과제의 핵심 도메인 행위
    // 과제 제목 수정
    updateTitle(title) {
        if (!title || title.trim().length === 0) {
            return Result.fail('Assignment title cannot be empty');
        }
        if (title.trim().length > 200) {
            return Result.fail('Assignment title cannot exceed 200 characters');
        }
        this._title = title.trim();
        this._updatedAt = new Date();
        return Result.ok();
    }
    // 과제 설명 수정
    updateDescription(description) {
        if (description && description.length > 1000) {
            return Result.fail('Assignment description cannot exceed 1000 characters');
        }
        this._description = description?.trim() || undefined;
        this._updatedAt = new Date();
        return Result.ok();
    }
    // 과제 마감일 수정
    updateDueDate(dueDate) {
        if (dueDate.isOverdue()) {
            return Result.fail('Due date cannot be in the past');
        }
        this._dueDate = dueDate;
        this._updatedAt = new Date();
        return Result.ok();
    }
    // 마감일 연장
    extendDueDate(additionalHours, extendedBy) {
        if (this._status === AssignmentStatus.CLOSED || this._status === AssignmentStatus.ARCHIVED) {
            return Result.fail('Cannot extend due date for closed or archived assignments');
        }
        const previousDueDate = this._dueDate.value;
        const extendedDueDateResult = this._dueDate.extend(additionalHours);
        if (extendedDueDateResult.isFailure) {
            return Result.fail(extendedDueDateResult.error);
        }
        this._dueDate = extendedDueDateResult.value;
        this._updatedAt = new Date();
        // 도메인 이벤트 발생
        if (extendedBy) {
            this.addDomainEvent(new AssignmentDueDateExtendedEvent(this.id, previousDueDate, this._dueDate.value, additionalHours, extendedBy));
        }
        return Result.ok();
    }
    // 마감일을 특정 날짜로 변경
    changeDueDateTo(newDueDate, timezone, changedBy, reason) {
        if (this._status === AssignmentStatus.CLOSED || this._status === AssignmentStatus.ARCHIVED) {
            return Result.fail('Cannot change due date for closed or archived assignments');
        }
        const dueDateResult = DueDate.create(newDueDate, timezone);
        if (dueDateResult.isFailure) {
            return Result.fail(dueDateResult.error);
        }
        const previousDueDate = this._dueDate.value;
        this._dueDate = dueDateResult.value;
        this._updatedAt = new Date();
        // 도메인 이벤트 발생
        if (changedBy) {
            this.addDomainEvent(new AssignmentDueDateChangedEvent(this.id, previousDueDate, this._dueDate.value, changedBy, reason));
        }
        return Result.ok();
    }
    // 최대 시도 횟수 설정
    setMaxAttempts(maxAttempts) {
        if (maxAttempts < 1) {
            return Result.fail('Max attempts must be at least 1');
        }
        if (maxAttempts > 10) {
            return Result.fail('Max attempts cannot exceed 10');
        }
        this._maxAttempts = maxAttempts;
        this._updatedAt = new Date();
        return Result.ok();
    }
    // 무제한 시도로 설정
    setUnlimitedAttempts() {
        this._maxAttempts = undefined;
        this._updatedAt = new Date();
    }
    // 과제 활성화
    activate() {
        if (this._status === AssignmentStatus.ARCHIVED) {
            return Result.fail('Cannot activate archived assignment');
        }
        if (this._dueDate.isOverdue()) {
            return Result.fail('Cannot activate assignment with past due date');
        }
        this._status = AssignmentStatus.ACTIVE;
        this._updatedAt = new Date();
        return Result.ok();
    }
    // 과제 비활성화 (초안으로 변경)
    deactivate() {
        this._status = AssignmentStatus.DRAFT;
        this._updatedAt = new Date();
    }
    // 과제 마감
    close() {
        if (this._status !== AssignmentStatus.ACTIVE) {
            return Result.fail('Only active assignments can be closed');
        }
        this._status = AssignmentStatus.CLOSED;
        this._updatedAt = new Date();
        return Result.ok();
    }
    // 과제 보관
    archive() {
        this._status = AssignmentStatus.ARCHIVED;
        this._updatedAt = new Date();
    }
    // 쿼리 메서드들 - 상태 조회 및 검증
    // 과제가 활성 상태인지 확인
    isActive() {
        return this._status === AssignmentStatus.ACTIVE;
    }
    // 과제가 마감되었는지 확인
    isOverdue() {
        return this._dueDate.isOverdue();
    }
    // 마감이 임박했는지 확인
    isDueSoon(hoursThreshold = 24) {
        return this._dueDate.isDueSoon(hoursThreshold);
    }
    // 마감까지 남은 시간 (시간 단위)
    getHoursUntilDue() {
        return this._dueDate.getHoursUntilDue();
    }
    // 마감까지 남은 시간 (일 단위)
    getDaysUntilDue() {
        return this._dueDate.getDaysUntilDue();
    }
    // 마감일 상태 메시지
    getDueDateStatus() {
        return this._dueDate.getStatusMessage();
    }
    // 학생이 접근 가능한 상태인지 확인
    isAccessibleToStudents() {
        return this._status === AssignmentStatus.ACTIVE && !this.isOverdue();
    }
    // 과제 소유자 확인
    isOwnedBy(teacherId) {
        return this._teacherId === teacherId;
    }
    // 시도 횟수 제한이 있는지 확인
    hasAttemptLimit() {
        return this._maxAttempts !== undefined;
    }
    // 배정 관련 비즈니스 로직 메서드들
    // 반에 과제 배정
    assignToClass(classId, assignedBy) {
        // 타입 안전성 검증
        const targetIdentifierResult = AssignmentTargetIdentifier.createForClass(classId);
        if (targetIdentifierResult.isFailure) {
            return Result.fail(targetIdentifierResult.error);
        }
        const targetIdentifier = targetIdentifierResult.value;
        // 중복 배정 검사
        if (this.isAlreadyAssignedTo(targetIdentifier)) {
            return Result.fail('Assignment is already assigned to this class');
        }
        // 새로운 배정 대상 생성
        const targetResult = AssignmentTarget.create(this.id, targetIdentifier, assignedBy);
        if (targetResult.isFailure) {
            return Result.fail(targetResult.error);
        }
        this._targets.push(targetResult.value);
        this._updatedAt = new Date();
        // 도메인 이벤트 발생
        this.addDomainEvent(new AssignmentTargetAddedEvent(this.id, targetIdentifier.type, targetIdentifier.getTargetId(), assignedBy));
        return Result.ok();
    }
    // 개별 학생에게 과제 배정
    assignToStudent(studentId, assignedBy) {
        // 타입 안전성 검증
        const targetIdentifierResult = AssignmentTargetIdentifier.createForStudent(studentId);
        if (targetIdentifierResult.isFailure) {
            return Result.fail(targetIdentifierResult.error);
        }
        const targetIdentifier = targetIdentifierResult.value;
        // 중복 배정 검사
        if (this.isAlreadyAssignedTo(targetIdentifier)) {
            return Result.fail('Assignment is already assigned to this student');
        }
        // 새로운 배정 대상 생성
        const targetResult = AssignmentTarget.create(this.id, targetIdentifier, assignedBy);
        if (targetResult.isFailure) {
            return Result.fail(targetResult.error);
        }
        this._targets.push(targetResult.value);
        this._updatedAt = new Date();
        // 도메인 이벤트 발생
        this.addDomainEvent(new AssignmentTargetAddedEvent(this.id, targetIdentifier.type, targetIdentifier.getTargetId(), assignedBy));
        return Result.ok();
    }
    // 여러 대상에게 동시 배정
    assignToMultipleTargets(targetIdentifiers, assignedBy) {
        // 중복 배정 검사
        for (const identifier of targetIdentifiers) {
            if (this.isAlreadyAssignedTo(identifier)) {
                return Result.fail(`Assignment is already assigned to ${identifier.toString()}`);
            }
        }
        // 모든 대상에 배정
        const newTargets = [];
        for (const identifier of targetIdentifiers) {
            const targetResult = AssignmentTarget.create(this.id, identifier, assignedBy);
            if (targetResult.isFailure) {
                return Result.fail(targetResult.error);
            }
            newTargets.push(targetResult.value);
        }
        this._targets.push(...newTargets);
        this._updatedAt = new Date();
        return Result.ok();
    }
    // 배정 취소
    revokeAssignment(targetIdentifier, revokedBy) {
        const target = this._targets.find(t => t.isActive() && t.isAssignedTo(targetIdentifier));
        if (!target) {
            return Result.fail('No active assignment found for the specified target');
        }
        const revokeResult = target.revokeAssignment(revokedBy);
        if (revokeResult.isFailure) {
            return Result.fail(revokeResult.error);
        }
        this._updatedAt = new Date();
        // 도메인 이벤트 발생
        this.addDomainEvent(new AssignmentTargetRevokedEvent(this.id, target.targetIdentifier.type, target.targetIdentifier.getTargetId(), revokedBy));
        return Result.ok();
    }
    // 모든 배정 취소
    revokeAllAssignments(revokedBy) {
        const activeTargets = this._targets.filter(t => t.isActive());
        if (activeTargets.length === 0) {
            return Result.fail('No active assignments to revoke');
        }
        for (const target of activeTargets) {
            const revokeResult = target.revokeAssignment(revokedBy);
            if (revokeResult.isFailure) {
                return Result.fail(`Failed to revoke assignment: ${revokeResult.error}`);
            }
        }
        this._updatedAt = new Date();
        return Result.ok();
    }
    // 배정 관련 쿼리 메서드들
    // 특정 대상에게 이미 배정되었는지 확인
    isAlreadyAssignedTo(targetIdentifier) {
        return this._targets.some(target => target.isActive() && target.isAssignedTo(targetIdentifier));
    }
    // 반에 배정되었는지 확인
    isAssignedToClass(classId) {
        const targetIdentifierResult = AssignmentTargetIdentifier.createForClass(classId);
        if (targetIdentifierResult.isFailure) {
            return false;
        }
        return this.isAlreadyAssignedTo(targetIdentifierResult.value);
    }
    // 개별 학생에게 배정되었는지 확인
    isAssignedToStudent(studentId) {
        const targetIdentifierResult = AssignmentTargetIdentifier.createForStudent(studentId);
        if (targetIdentifierResult.isFailure) {
            return false;
        }
        return this.isAlreadyAssignedTo(targetIdentifierResult.value);
    }
    // 배정된 반 목록 조회
    getAssignedClasses() {
        return this._targets
            .filter(target => target.isActive() && target.isClassTarget())
            .map(target => target.targetIdentifier.classId)
            .filter(classId => classId !== undefined);
    }
    // 배정된 학생 목록 조회
    getAssignedStudents() {
        return this._targets
            .filter(target => target.isActive() && target.isStudentTarget())
            .map(target => target.targetIdentifier.studentId)
            .filter(studentId => studentId !== undefined);
    }
    // 배정이 있는지 확인
    hasActiveAssignments() {
        return this._targets.some(target => target.isActive());
    }
    // 활성 배정 수 조회
    getActiveAssignmentCount() {
        return this._targets.filter(target => target.isActive()).length;
    }
    // 팩토리 메서드들 - 안전한 인스턴스 생성
    // 새 과제 생성
    static create(props, id) {
        // 교사 ID 검증
        if (!props.teacherId || props.teacherId.trim().length === 0) {
            return Result.fail('Teacher ID is required');
        }
        // 제목 검증
        if (!props.title || props.title.trim().length === 0) {
            return Result.fail('Assignment title is required');
        }
        if (props.title.trim().length > 200) {
            return Result.fail('Assignment title cannot exceed 200 characters');
        }
        // 설명 검증
        if (props.description && props.description.length > 1000) {
            return Result.fail('Assignment description cannot exceed 1000 characters');
        }
        // 마감일 검증 (DueDate 값 객체에서 이미 검증됨)
        if (props.dueDate.isOverdue()) {
            return Result.fail('Due date cannot be in the past');
        }
        // 최대 시도 횟수 검증
        if (props.maxAttempts !== undefined) {
            if (props.maxAttempts < 1 || props.maxAttempts > 10) {
                return Result.fail('Max attempts must be between 1 and 10');
            }
        }
        const assignmentProps = {
            ...props,
            isActive: false // 새로 생성된 과제는 기본적으로 초안 상태
        };
        const assignment = new Assignment(assignmentProps, id);
        return Result.ok(assignment);
    }
    // 활성 상태로 과제 생성
    static createActive(props, id) {
        const createResult = Assignment.create(props, id);
        if (createResult.isFailure) {
            return createResult;
        }
        const assignment = createResult.value;
        const activateResult = assignment.activate();
        if (activateResult.isFailure) {
            return Result.fail(activateResult.error);
        }
        return Result.ok(assignment);
    }
}
//# sourceMappingURL=Assignment.js.map