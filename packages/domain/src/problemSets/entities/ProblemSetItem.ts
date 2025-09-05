import { Entity } from '../../entities/Entity';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';

interface ProblemSetItemProps {
  problemSetId: UniqueEntityID;
  problemId: UniqueEntityID;
  orderIndex: number;
  points?: number;
  estimatedTimeMinutes?: number;
  settings?: Record<string, any>;
}

export class ProblemSetItem extends Entity<UniqueEntityID> {
  private _problemSetId: UniqueEntityID;
  private _problemId: UniqueEntityID;
  private _orderIndex: number;
  private _points: number;
  private _estimatedTimeMinutes: number;
  private _settings: Record<string, any>;

  constructor(props: ProblemSetItemProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID());
    this._problemSetId = props.problemSetId;
    this._problemId = props.problemId;
    this._orderIndex = props.orderIndex;
    this._points = props.points ?? 10;
    this._estimatedTimeMinutes = props.estimatedTimeMinutes ?? 3;
    this._settings = props.settings ?? {};
  }

  // Getters
  get problemSetId(): UniqueEntityID {
    return this._problemSetId;
  }

  get problemId(): UniqueEntityID {
    return this._problemId;
  }

  get orderIndex(): number {
    return this._orderIndex;
  }

  get points(): number {
    return this._points;
  }

  get estimatedTimeMinutes(): number {
    return this._estimatedTimeMinutes;
  }

  get settings(): Record<string, any> {
    return { ...this._settings };
  }

  // Business Logic Methods
  public updateOrderIndex(newOrderIndex: number): void {
    if (newOrderIndex < 0) {
      throw new Error('Order index cannot be negative');
    }
    this._orderIndex = newOrderIndex;
  }

  public updatePoints(points: number): void {
    if (points < 0) {
      throw new Error('Points cannot be negative');
    }
    this._points = points;
  }

  public updateEstimatedTime(minutes: number): void {
    if (minutes < 0) {
      throw new Error('Estimated time cannot be negative');
    }
    this._estimatedTimeMinutes = minutes;
  }

  public isAtPosition(position: number): boolean {
    return this._orderIndex === position;
  }

  public isBefore(otherItem: ProblemSetItem): boolean {
    return this._orderIndex < otherItem._orderIndex;
  }

  public isAfter(otherItem: ProblemSetItem): boolean {
    return this._orderIndex > otherItem._orderIndex;
  }

  public moveToPosition(newPosition: number): void {
    if (newPosition < 0) {
      throw new Error('Position cannot be negative');
    }
    this._orderIndex = newPosition;
  }

  // Factory Methods
  public static create(props: ProblemSetItemProps, id?: UniqueEntityID): Result<ProblemSetItem> {
    // 유효성 검증
    if (props.orderIndex < 0) {
      return Result.fail<ProblemSetItem>('Order index cannot be negative');
    }

    if (props.problemSetId.equals(props.problemId)) {
      return Result.fail<ProblemSetItem>('Problem set ID and problem ID cannot be the same');
    }

    const problemSetItem = new ProblemSetItem(props, id);
    return Result.ok<ProblemSetItem>(problemSetItem);
  }

  // Equality
  public equals(item: ProblemSetItem): boolean {
    if (!item) return false;
    if (this === item) return true;
    
    return this._problemSetId.equals(item._problemSetId) && 
           this._problemId.equals(item._problemId);
  }

  // Domain Methods
  public belongsToSameProblemSet(otherItem: ProblemSetItem): boolean {
    return this._problemSetId.equals(otherItem._problemSetId);
  }

  public hasSameProblem(otherItem: ProblemSetItem): boolean {
    return this._problemId.equals(otherItem._problemId);
  }
}