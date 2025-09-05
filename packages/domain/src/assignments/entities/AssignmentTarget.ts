import { Entity } from '../../entities/Entity';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { AssignmentTargetIdentifier } from '../value-objects/AssignmentTargetIdentifier';

// 배정 이력 값 객체
interface AssignmentHistoryProps {
  assignedAt: Date;
  assignedBy: string;
  revokedAt?: Date;
  revokedBy?: string;
}

export class AssignmentHistory {
  constructor(private props: AssignmentHistoryProps) {}

  get assignedAt(): Date {
    return this.props.assignedAt;
  }

  get assignedBy(): string {
    return this.props.assignedBy;
  }

  get revokedAt(): Date | undefined {
    return this.props.revokedAt;
  }

  get revokedBy(): string | undefined {
    return this.props.revokedBy;
  }

  public isActive(): boolean {
    return this.props.revokedAt === undefined;
  }

  public revoke(revokedBy: string): AssignmentHistory {
    return new AssignmentHistory({
      ...this.props,
      revokedAt: new Date(),
      revokedBy
    });
  }
}

// 배정 대상 생성 속성
interface AssignmentTargetProps {
  assignmentId: UniqueEntityID;
  targetIdentifier: AssignmentTargetIdentifier;
  history: AssignmentHistory[];
}

// 과제 배정 대상 엔티티 (Assignment 애그리게이트 내부)
export class AssignmentTarget extends Entity<UniqueEntityID> {
  private _assignmentId: UniqueEntityID;
  private _targetIdentifier: AssignmentTargetIdentifier;
  private _history: AssignmentHistory[];

  constructor(props: AssignmentTargetProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID());
    this._assignmentId = props.assignmentId;
    this._targetIdentifier = props.targetIdentifier;
    this._history = props.history || [];
  }

  // Getter 메서드들
  get assignmentId(): UniqueEntityID {
    return this._assignmentId;
  }

  get targetIdentifier(): AssignmentTargetIdentifier {
    return this._targetIdentifier;
  }

  get history(): AssignmentHistory[] {
    return [...this._history];
  }

  // 현재 활성 상태 여부
  public isActive(): boolean {
    const latestHistory = this.getLatestHistory();
    return latestHistory?.isActive() ?? false;
  }

  // 최근 이력 조회
  public getLatestHistory(): AssignmentHistory | undefined {
    return this._history
      .sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime())[0];
  }

  // 배정 이력 추가
  public addAssignmentHistory(assignedBy: string): void {
    const newHistory = new AssignmentHistory({
      assignedAt: new Date(),
      assignedBy
    });
    this._history.push(newHistory);
  }

  // 배정 취소
  public revokeAssignment(revokedBy: string): Result<void> {
    const latestHistory = this.getLatestHistory();
    if (!latestHistory || !latestHistory.isActive()) {
      return Result.fail<void>('No active assignment to revoke');
    }

    // 기존 이력을 취소된 상태로 업데이트
    const revokedHistory = latestHistory.revoke(revokedBy);
    const historyIndex = this._history.findIndex(h => h === latestHistory);
    this._history[historyIndex] = revokedHistory;

    return Result.ok<void>();
  }

  // 쿼리 메서드들
  public isAssignedTo(targetIdentifier: AssignmentTargetIdentifier): boolean {
    return this._targetIdentifier.equals(targetIdentifier);
  }

  public belongsToAssignment(assignmentId: UniqueEntityID): boolean {
    return this._assignmentId.equals(assignmentId);
  }

  public isClassTarget(): boolean {
    return this._targetIdentifier.isClassTarget();
  }

  public isStudentTarget(): boolean {
    return this._targetIdentifier.isStudentTarget();
  }

  public getTargetId(): string {
    return this._targetIdentifier.getTargetId();
  }

  // 팩토리 메서드
  public static create(
    assignmentId: UniqueEntityID,
    targetIdentifier: AssignmentTargetIdentifier,
    assignedBy: string,
    id?: UniqueEntityID
  ): Result<AssignmentTarget> {
    const initialHistory = new AssignmentHistory({
      assignedAt: new Date(),
      assignedBy
    });

    const target = new AssignmentTarget({
      assignmentId,
      targetIdentifier,
      history: [initialHistory]
    }, id);

    return Result.ok<AssignmentTarget>(target);
  }

  // === 영속성 지원 메서드들 ===

  // 복원을 위한 정적 팩토리 메서드
  public static restore(props: {
    id: string;
    assignmentId: string;
    targetIdentifier: AssignmentTargetIdentifier;
    assignedBy: string;
    assignedAt: Date;
    revokedBy?: string;
    revokedAt?: Date;
    isActive: boolean;
  }): Result<AssignmentTarget> {
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

    return Result.ok<AssignmentTarget>(target);
  }

  // 편의 속성들 (infrastructure에서 사용)
  get assignedBy(): string {
    const latestHistory = this.getLatestHistory();
    return latestHistory?.assignedBy || '';
  }

  get assignedAt(): Date {
    const latestHistory = this.getLatestHistory();
    return latestHistory?.assignedAt || new Date();
  }

  get revokedBy(): string | undefined {
    const latestHistory = this.getLatestHistory();
    return latestHistory?.revokedBy;
  }

  get revokedAt(): Date | undefined {
    const latestHistory = this.getLatestHistory();
    return latestHistory?.revokedAt;
  }
}