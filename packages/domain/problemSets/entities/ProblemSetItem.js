import { Entity } from '../../entities/Entity';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
export class ProblemSetItem extends Entity {
    _problemSetId;
    _problemId;
    _orderIndex;
    _points;
    _estimatedTimeMinutes;
    _settings;
    constructor(props, id) {
        super(id || new UniqueEntityID());
        this._problemSetId = props.problemSetId;
        this._problemId = props.problemId;
        this._orderIndex = props.orderIndex;
        this._points = props.points ?? 10;
        this._estimatedTimeMinutes = props.estimatedTimeMinutes ?? 3;
        this._settings = props.settings ?? {};
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
    get points() {
        return this._points;
    }
    get estimatedTimeMinutes() {
        return this._estimatedTimeMinutes;
    }
    get settings() {
        return { ...this._settings };
    }
    // Business Logic Methods
    updateOrderIndex(newOrderIndex) {
        if (newOrderIndex < 0) {
            throw new Error('Order index cannot be negative');
        }
        this._orderIndex = newOrderIndex;
    }
    updatePoints(points) {
        if (points < 0) {
            throw new Error('Points cannot be negative');
        }
        this._points = points;
    }
    updateEstimatedTime(minutes) {
        if (minutes < 0) {
            throw new Error('Estimated time cannot be negative');
        }
        this._estimatedTimeMinutes = minutes;
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