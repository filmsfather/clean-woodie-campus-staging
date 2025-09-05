import { Result } from '../../common/Result';
import { Assignment } from '../entities/Assignment';
import { AssignmentTargetIdentifier } from '../value-objects/AssignmentTargetIdentifier';
import { ClassId } from '../value-objects/ClassId';
import { StudentId } from '../value-objects/StudentId';
import { DueDate } from '../value-objects/DueDate';
// Assignment 도메인 서비스
// 복잡한 배정 로직과 비즈니스 규칙을 처리
export class AssignmentService {
    assignmentRepository;
    constructor(assignmentRepository) {
        this.assignmentRepository = assignmentRepository;
    }
    // 과제 생성 및 배정
    async createAssignmentWithTargets(request, createdBy) {
        // 1. DueDate 값 객체 생성
        const dueDateResult = DueDate.create(request.dueDate, request.timezone);
        if (dueDateResult.isFailure) {
            return Result.fail(`Invalid due date: ${dueDateResult.error}`);
        }
        // 2. 기본 과제 생성
        const assignmentResult = Assignment.create({
            teacherId: request.teacherId,
            problemSetId: request.problemSetId,
            title: request.title,
            description: request.description,
            dueDate: dueDateResult.value,
            maxAttempts: request.maxAttempts
        });
        if (assignmentResult.isFailure) {
            return Result.fail(assignmentResult.error);
        }
        const assignment = assignmentResult.value;
        // 2. 배정 대상 처리
        if (request.classIds?.length || request.studentIds?.length) {
            const assignResult = await this.assignTargets(assignment, {
                classIds: request.classIds,
                studentIds: request.studentIds
            }, createdBy);
            if (assignResult.isFailure) {
                return Result.fail(assignResult.error);
            }
        }
        // 3. 저장
        const saveResult = await this.assignmentRepository.save(assignment);
        if (saveResult.isFailure) {
            return Result.fail(`Failed to save assignment: ${saveResult.error}`);
        }
        return Result.ok(assignment);
    }
    // 기존 과제에 배정 대상 추가
    async assignTargets(assignment, targets, assignedBy) {
        const targetIdentifiers = [];
        // 반 ID들을 배정 대상으로 변환
        if (targets.classIds) {
            for (const classIdStr of targets.classIds) {
                const classIdResult = ClassId.create(classIdStr);
                if (classIdResult.isFailure) {
                    return Result.fail(`Invalid class ID '${classIdStr}': ${classIdResult.error}`);
                }
                const identifierResult = AssignmentTargetIdentifier.createForClass(classIdResult.value);
                if (identifierResult.isFailure) {
                    return Result.fail(identifierResult.error);
                }
                targetIdentifiers.push(identifierResult.value);
            }
        }
        // 학생 ID들을 배정 대상으로 변환
        if (targets.studentIds) {
            for (const studentIdStr of targets.studentIds) {
                const studentIdResult = StudentId.create(studentIdStr);
                if (studentIdResult.isFailure) {
                    return Result.fail(`Invalid student ID '${studentIdStr}': ${studentIdResult.error}`);
                }
                const identifierResult = AssignmentTargetIdentifier.createForStudent(studentIdResult.value);
                if (identifierResult.isFailure) {
                    return Result.fail(identifierResult.error);
                }
                targetIdentifiers.push(identifierResult.value);
            }
        }
        // 비즈니스 규칙 검증 (반과 개별 학생 배정 충돌 검사)
        const validationResult = await this.validateAssignmentTargets(assignment, targetIdentifiers);
        if (validationResult.isFailure) {
            return Result.fail(validationResult.error);
        }
        // 과제에 대상들 배정
        if (targetIdentifiers.length > 0) {
            const assignResult = assignment.assignToMultipleTargets(targetIdentifiers, assignedBy);
            if (assignResult.isFailure) {
                return Result.fail(assignResult.error);
            }
        }
        return Result.ok();
    }
    // 과제 배정 취소
    async revokeAssignmentTargets(assignmentId, targets, revokedBy) {
        // 과제 조회
        const assignmentResult = await this.assignmentRepository.findById(assignmentId);
        if (assignmentResult.isFailure) {
            return Result.fail(`Assignment not found: ${assignmentResult.error}`);
        }
        const assignment = assignmentResult.value;
        // 권한 검증
        if (!assignment.isOwnedBy(revokedBy)) {
            return Result.fail('Only the assignment owner can revoke assignments');
        }
        // 대상별 취소 처리
        if (targets.classIds) {
            for (const classIdStr of targets.classIds) {
                const classIdResult = ClassId.create(classIdStr);
                if (classIdResult.isSuccess) {
                    const identifierResult = AssignmentTargetIdentifier.createForClass(classIdResult.value);
                    if (identifierResult.isSuccess) {
                        assignment.revokeAssignment(identifierResult.value, revokedBy);
                    }
                }
            }
        }
        if (targets.studentIds) {
            for (const studentIdStr of targets.studentIds) {
                const studentIdResult = StudentId.create(studentIdStr);
                if (studentIdResult.isSuccess) {
                    const identifierResult = AssignmentTargetIdentifier.createForStudent(studentIdResult.value);
                    if (identifierResult.isSuccess) {
                        assignment.revokeAssignment(identifierResult.value, revokedBy);
                    }
                }
            }
        }
        // 저장
        const saveResult = await this.assignmentRepository.save(assignment);
        if (saveResult.isFailure) {
            return Result.fail(`Failed to save assignment: ${saveResult.error}`);
        }
        return Result.ok();
    }
    // 과제 활성화 (배정이 있는 경우에만)
    async activateAssignment(assignmentId, teacherId) {
        const assignmentResult = await this.assignmentRepository.findById(assignmentId);
        if (assignmentResult.isFailure) {
            return Result.fail(`Assignment not found: ${assignmentResult.error}`);
        }
        const assignment = assignmentResult.value;
        // 권한 검증
        if (!assignment.isOwnedBy(teacherId)) {
            return Result.fail('Only the assignment owner can activate assignments');
        }
        // 배정이 있는지 확인
        if (!assignment.hasActiveAssignments()) {
            return Result.fail('Cannot activate assignment without any assigned targets');
        }
        // 활성화
        const activateResult = assignment.activate();
        if (activateResult.isFailure) {
            return Result.fail(activateResult.error);
        }
        // 저장
        const saveResult = await this.assignmentRepository.save(assignment);
        if (saveResult.isFailure) {
            return Result.fail(`Failed to save assignment: ${saveResult.error}`);
        }
        return Result.ok();
    }
    // 학생이 접근 가능한 과제 목록 조회
    async getAccessibleAssignmentsForStudent(studentId) {
        const studentIdResult = StudentId.create(studentId);
        if (studentIdResult.isFailure) {
            return Result.fail(studentIdResult.error);
        }
        // 활성 과제 조회
        const assignmentsResult = await this.assignmentRepository.findActiveAssignments();
        if (assignmentsResult.isFailure) {
            return Result.fail(assignmentsResult.error);
        }
        // 해당 학생이 접근 가능한 과제들 필터링
        const accessibleAssignments = assignmentsResult.value.filter(assignment => {
            return assignment.isAccessibleToStudents() &&
                assignment.isAssignedToStudent(studentIdResult.value);
        });
        return Result.ok(accessibleAssignments);
    }
    // 반에 배정된 과제 목록 조회
    async getAssignmentsForClass(classId) {
        const classIdResult = ClassId.create(classId);
        if (classIdResult.isFailure) {
            return Result.fail(classIdResult.error);
        }
        // 활성 과제 조회
        const assignmentsResult = await this.assignmentRepository.findActiveAssignments();
        if (assignmentsResult.isFailure) {
            return Result.fail(assignmentsResult.error);
        }
        // 해당 반에 배정된 과제들 필터링
        const classAssignments = assignmentsResult.value.filter(assignment => {
            return assignment.isAssignedToClass(classIdResult.value);
        });
        return Result.ok(classAssignments);
    }
    // 마감일 관리 메서드들
    // 과제 마감일 연장
    async extendAssignmentDueDate(assignmentId, additionalHours, teacherId) {
        const assignmentResult = await this.assignmentRepository.findById(assignmentId);
        if (assignmentResult.isFailure) {
            return Result.fail(`Assignment not found: ${assignmentResult.error}`);
        }
        const assignment = assignmentResult.value;
        // 권한 검증
        if (!assignment.isOwnedBy(teacherId)) {
            return Result.fail('Only the assignment owner can extend due dates');
        }
        // 마감일 연장
        const extendResult = assignment.extendDueDate(additionalHours, teacherId);
        if (extendResult.isFailure) {
            return Result.fail(extendResult.error);
        }
        // 저장
        const saveResult = await this.assignmentRepository.save(assignment);
        if (saveResult.isFailure) {
            return Result.fail(`Failed to save assignment: ${saveResult.error}`);
        }
        return Result.ok();
    }
    // 과제 마감일 변경
    async changeAssignmentDueDate(assignmentId, newDueDate, teacherId, timezone) {
        const assignmentResult = await this.assignmentRepository.findById(assignmentId);
        if (assignmentResult.isFailure) {
            return Result.fail(`Assignment not found: ${assignmentResult.error}`);
        }
        const assignment = assignmentResult.value;
        // 권한 검증
        if (!assignment.isOwnedBy(teacherId)) {
            return Result.fail('Only the assignment owner can change due dates');
        }
        // 마감일 변경
        const changeResult = assignment.changeDueDateTo(newDueDate, timezone, teacherId);
        if (changeResult.isFailure) {
            return Result.fail(changeResult.error);
        }
        // 저장
        const saveResult = await this.assignmentRepository.save(assignment);
        if (saveResult.isFailure) {
            return Result.fail(`Failed to save assignment: ${saveResult.error}`);
        }
        return Result.ok();
    }
    // 마감 임박한 과제 목록 조회
    async getAssignmentsDueSoon(hoursThreshold = 24) {
        const assignmentsResult = await this.assignmentRepository.findActiveAssignments();
        if (assignmentsResult.isFailure) {
            return Result.fail(assignmentsResult.error);
        }
        const dueSoonAssignments = assignmentsResult.value.filter(assignment => assignment.isDueSoon(hoursThreshold));
        return Result.ok(dueSoonAssignments);
    }
    // 마감된 과제 목록 조회
    async getOverdueAssignments() {
        const assignmentsResult = await this.assignmentRepository.findActiveAssignments();
        if (assignmentsResult.isFailure) {
            return Result.fail(assignmentsResult.error);
        }
        const overdueAssignments = assignmentsResult.value.filter(assignment => assignment.isOverdue());
        return Result.ok(overdueAssignments);
    }
    // 교사의 과제별 마감일 현황 조회
    async getTeacherAssignmentsDueDateStatus(teacherId) {
        const assignmentsResult = await this.assignmentRepository.findByTeacherId(teacherId);
        if (assignmentsResult.isFailure) {
            return Result.fail(assignmentsResult.error);
        }
        const statusList = assignmentsResult.value.map(assignment => ({
            assignmentId: assignment.id.toString(),
            title: assignment.title,
            dueDate: assignment.dueDate.value,
            status: assignment.getDueDateStatus(),
            isOverdue: assignment.isOverdue(),
            isDueSoon: assignment.isDueSoon(),
            hoursUntilDue: assignment.getHoursUntilDue(),
            daysUntilDue: assignment.getDaysUntilDue(),
            assignmentStatus: assignment.status,
            activeTargetCount: assignment.getActiveAssignmentCount()
        }));
        return Result.ok(statusList);
    }
    // 마감일 기반 자동 과제 마감 처리
    async processOverdueAssignments() {
        const overdueAssignmentsResult = await this.getOverdueAssignments();
        if (overdueAssignmentsResult.isFailure) {
            return Result.fail(overdueAssignmentsResult.error);
        }
        const overdueAssignments = overdueAssignmentsResult.value;
        let closedCount = 0;
        for (const assignment of overdueAssignments) {
            if (assignment.isActive()) {
                const closeResult = assignment.close();
                if (closeResult.isSuccess) {
                    const saveResult = await this.assignmentRepository.save(assignment);
                    if (saveResult.isSuccess) {
                        closedCount++;
                    }
                }
            }
        }
        return Result.ok(closedCount);
    }
    // 배정 대상 유효성 검증
    async validateAssignmentTargets(assignment, targetIdentifiers) {
        // 중복 검사는 Assignment 애그리게이트에서 처리되므로
        // 여기서는 추가적인 비즈니스 규칙만 검증
        // 예: 학생이 속한 반에 이미 배정된 경우 개별 배정 제한
        const classTargets = targetIdentifiers.filter(id => id.isClassTarget());
        const studentTargets = targetIdentifiers.filter(id => id.isStudentTarget());
        if (classTargets.length > 0 && studentTargets.length > 0) {
            // 실제 환경에서는 학생-반 관계를 확인하는 도메인 서비스나 리포지터리가 필요
            // 여기서는 기본적인 규칙만 적용
            return Result.fail('Cannot assign to both class and individual students in the same operation. ' +
                'Please assign to class first, then add individual students if needed.');
        }
        return Result.ok();
    }
}
//# sourceMappingURL=AssignmentService.js.map