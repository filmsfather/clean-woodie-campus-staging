import { Entity } from '../../entities/Entity';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
export class AssignmentHistory {
    props;
    constructor(props) {
        this.props = props;
    }
    get assignedAt() {
        return this.props.assignedAt;
    }
    get assignedBy() {
        return this.props.assignedBy;
    }
    get revokedAt() {
        return this.props.revokedAt;
    }
    get revokedBy() {
        return this.props.revokedBy;
    }
    isActive() {
        return this.props.revokedAt === undefined;
    }
    revoke(revokedBy) {
        return new AssignmentHistory({
            ...this.props,
            revokedAt: new Date(),
            revokedBy
        });
    }
}
// 과제 배정 대상 엔티티 (Assignment 애그리게이트 내부)
export class AssignmentTarget extends Entity {
    _assignmentId;
    _targetIdentifier;
    _history;
    constructor(props, id) {
        super(id || new UniqueEntityID());
        this._assignmentId = props.assignmentId;
        this._targetIdentifier = props.targetIdentifier;
        this._history = props.history || [];
    }
    // Getter 메서드들
    get assignmentId() {
        return this._assignmentId;
    }
    get targetIdentifier() {
        return this._targetIdentifier;
    }
    get history() {
        return [...this._history];
    }
    // 현재 활성 상태 여부
    isActive() {
        const latestHistory = this.getLatestHistory();
        return latestHistory?.isActive() ?? false;
    }
    // 최근 이력 조회
    getLatestHistory() {
        return this._history
            .sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime())[0];
    }
    // 배정 이력 추가
    addAssignmentHistory(assignedBy) {
        const newHistory = new AssignmentHistory({
            assignedAt: new Date(),
            assignedBy
        });
        this._history.push(newHistory);
    }
    // 배정 취소
    revokeAssignment(revokedBy) {
        const latestHistory = this.getLatestHistory();
        if (!latestHistory || !latestHistory.isActive()) {
            return Result.fail('No active assignment to revoke');
        }
        // 기존 이력을 취소된 상태로 업데이트
        const revokedHistory = latestHistory.revoke(revokedBy);
        const historyIndex = this._history.findIndex(h => h === latestHistory);
        this._history[historyIndex] = revokedHistory;
        return Result.ok();
    }
    // 쿼리 메서드들
    isAssignedTo(targetIdentifier) {
        return this._targetIdentifier.equals(targetIdentifier);
    }
    belongsToAssignment(assignmentId) {
        return this._assignmentId.equals(assignmentId);
    }
    isClassTarget() {
        return this._targetIdentifier.isClassTarget();
    }
    isStudentTarget() {
        return this._targetIdentifier.isStudentTarget();
    }
    getTargetId() {
        return this._targetIdentifier.getTargetId();
    }
    // 팩토리 메서드
    static create(assignmentId, targetIdentifier, assignedBy, id) {
        const initialHistory = new AssignmentHistory({
            assignedAt: new Date(),
            assignedBy
        });
        const target = new AssignmentTarget({
            assignmentId,
            targetIdentifier,
            history: [initialHistory]
        }, id);
        return Result.ok(target);
    }
    // === 영속성 지원 메서드들 ===
    // 복원을 위한 정적 팩토리 메서드
    static restore(props) {
        const history = new AssignmentHistory({
            assignedAt: props.assignedAt,
            assignedBy: props.assignedBy,
            revokedAt: props.revokedAt,
            revokedBy: props.revokedBy
        });
        const target = new AssignmentTarget({
            assignmentId: new UniqueEntityID(props.assignmentId),
            targetIdentifier: props.targetIdentifier,
            history: [history]
        }, new UniqueEntityID(props.id));
        return Result.ok(target);
    }
    // 편의 속성들 (infrastructure에서 사용)
    get assignedBy() {
        const latestHistory = this.getLatestHistory();
        return latestHistory?.assignedBy || '';
    }
    get assignedAt() {
        const latestHistory = this.getLatestHistory();
        return latestHistory?.assignedAt || new Date();
    }
    get revokedBy() {
        const latestHistory = this.getLatestHistory();
        return latestHistory?.revokedBy;
    }
    get revokedAt() {
        const latestHistory = this.getLatestHistory();
        return latestHistory?.revokedAt;
    }
}
//# sourceMappingURL=AssignmentTarget.js.map