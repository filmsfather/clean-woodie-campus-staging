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
export declare class ProblemSetItem extends Entity<UniqueEntityID> {
    private _problemSetId;
    private _problemId;
    private _orderIndex;
    private _points;
    private _estimatedTimeMinutes;
    private _settings;
    constructor(props: ProblemSetItemProps, id?: UniqueEntityID);
    get problemSetId(): UniqueEntityID;
    get problemId(): UniqueEntityID;
    get orderIndex(): number;
    get points(): number;
    get estimatedTimeMinutes(): number;
    get settings(): Record<string, any>;
    updateOrderIndex(newOrderIndex: number): void;
    updatePoints(points: number): void;
    updateEstimatedTime(minutes: number): void;
    isAtPosition(position: number): boolean;
    isBefore(otherItem: ProblemSetItem): boolean;
    isAfter(otherItem: ProblemSetItem): boolean;
    moveToPosition(newPosition: number): void;
    static create(props: ProblemSetItemProps, id?: UniqueEntityID): Result<ProblemSetItem>;
    equals(item: ProblemSetItem): boolean;
    belongsToSameProblemSet(otherItem: ProblemSetItem): boolean;
    hasSameProblem(otherItem: ProblemSetItem): boolean;
}
export {};
//# sourceMappingURL=ProblemSetItem.d.ts.map