import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
const DIFFICULTY_LEVELS = {
    VERY_EASY: 1,
    EASY: 2,
    MEDIUM: 3,
    HARD: 4,
    VERY_HARD: 5
};
export class Difficulty extends ValueObject {
    constructor(props) {
        super(props);
    }
    get level() {
        return this.props.level;
    }
    // 타입 가드
    static isDifficultyLevel(value) {
        return Number.isInteger(value) && value >= 1 && value <= 5;
    }
    // 주 생성자
    static create(level) {
        if (!this.isDifficultyLevel(level)) {
            return Result.fail(`Invalid difficulty level: ${level}. Must be integer between 1 and 5`);
        }
        return Result.ok(new Difficulty({ level }));
    }
    // 안전한 내부 생성자
    static createUnsafe(level) {
        return new Difficulty({ level });
    }
    // 편의 생성자들
    static veryEasy() {
        return this.createUnsafe(DIFFICULTY_LEVELS.VERY_EASY);
    }
    static easy() {
        return this.createUnsafe(DIFFICULTY_LEVELS.EASY);
    }
    static medium() {
        return this.createUnsafe(DIFFICULTY_LEVELS.MEDIUM);
    }
    static hard() {
        return this.createUnsafe(DIFFICULTY_LEVELS.HARD);
    }
    static veryHard() {
        return this.createUnsafe(DIFFICULTY_LEVELS.VERY_HARD);
    }
    // 비교 메서드
    isEasierThan(other) {
        return this.props.level < other.props.level;
    }
    isHarderThan(other) {
        return this.props.level > other.props.level;
    }
    isSameDifficulty(other) {
        return this.props.level === other.props.level;
    }
    // 직렬화/역직렬화
    toJSON() {
        return {
            type: 'Difficulty',
            level: this.props.level
        };
    }
    toString() {
        return this.props.level.toString();
    }
    toPrimitive() {
        return this.props.level;
    }
    static fromJSON(json) {
        return this.create(json.level);
    }
    static fromString(value) {
        const numValue = parseInt(value, 10);
        return this.create(numValue);
    }
    static fromPrimitive(level) {
        return this.create(level);
    }
    // 상수 접근
    static LEVELS = DIFFICULTY_LEVELS;
}
//# sourceMappingURL=Difficulty.js.map