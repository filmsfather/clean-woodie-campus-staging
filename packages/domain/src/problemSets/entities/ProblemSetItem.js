import { Entity } from '../../entities/Entity';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
export class ProblemSetItem extends Entity {
    _problemSetId;
    _problemId;
    _orderIndex;
    constructor(props, id) {
        super(id || new UniqueEntityID());
        this._problemSetId = props.problemSetId;
        this._problemId = props.problemId;
        this._orderIndex = props.orderIndex;
    }
    // Getters
    get problemSetId() {
        return this._problemSetId;
    }
    get problemId() {
        return this._problemId;
    }
    get orderIndex() {
        return this._orderIndex;
    }
    // Business Logic Methods
    updateOrderIndex(newOrderIndex) {
        if (newOrderIndex < 0) {
            throw new Error('Order index cannot be negative');
        }
        this._orderIndex = newOrderIndex;
    }
    isAtPosition(position) {
        return this._orderIndex === position;
    }
    isBefore(otherItem) {
        return this._orderIndex < otherItem._orderIndex;
    }
    isAfter(otherItem) {
        return this._orderIndex > otherItem._orderIndex;
    }
    moveToPosition(newPosition) {
        if (newPosition < 0) {
            throw new Error('Position cannot be negative');
        }
        this._orderIndex = newPosition;
    }
    // Factory Methods
    static create(props, id) {
        // 유효성 검증
        if (props.orderIndex < 0) {
            return Result.fail('Order index cannot be negative');
        }
        if (props.problemSetId.equals(props.problemId)) {
            return Result.fail('Problem set ID and problem ID cannot be the same');
        }
        const problemSetItem = new ProblemSetItem(props, id);
        return Result.ok(problemSetItem);
    }
    // Equality
    equals(item) {
        if (!item)
            return false;
        if (this === item)
            return true;
        return this._problemSetId.equals(item._problemSetId) &&
            this._problemId.equals(item._problemId);
    }
    // Domain Methods
    belongsToSameProblemSet(otherItem) {
        return this._problemSetId.equals(otherItem._problemSetId);
    }
    hasSameProblem(otherItem) {
        return this._problemId.equals(otherItem._problemId);
    }
}
//# sourceMappingURL=ProblemSetItem.js.map