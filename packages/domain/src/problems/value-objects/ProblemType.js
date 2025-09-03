import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
// 타입 안정성 보강 - const assertion 사용
const PROBLEM_TYPES = {
    MULTIPLE_CHOICE: 'multiple_choice',
    SHORT_ANSWER: 'short_answer',
    LONG_ANSWER: 'long_answer',
    TRUE_FALSE: 'true_false',
    MATCHING: 'matching',
    FILL_BLANK: 'fill_blank',
    ORDERING: 'ordering'
};
export class ProblemType extends ValueObject {
    constructor(props) {
        super(props);
    }
    get value() {
        return this.props.value;
    }
    // 타입 가드
    static isProblemType(value) {
        return Object.values(PROBLEM_TYPES).includes(value);
    }
    // 주 생성자 - 유효성 검증 포함
    static create(value) {
        if (!this.isProblemType(value)) {
            return Result.fail(`Invalid problem type: ${value}. Valid types: ${Object.values(PROBLEM_TYPES).join(', ')}`);
        }
        return Result.ok(new ProblemType({ value }));
    }
    // 안전한 내부 생성자 - 편의 메서드용
    static createUnsafe(value) {
        return new ProblemType({ value });
    }
    // 정적 생성자 일관성 - 모두 안전한 인스턴스 반환
    static multipleChoice() {
        return this.createUnsafe(PROBLEM_TYPES.MULTIPLE_CHOICE);
    }
    static shortAnswer() {
        return this.createUnsafe(PROBLEM_TYPES.SHORT_ANSWER);
    }
    static longAnswer() {
        return this.createUnsafe(PROBLEM_TYPES.LONG_ANSWER);
    }
    static trueFalse() {
        return this.createUnsafe(PROBLEM_TYPES.TRUE_FALSE);
    }
    static matching() {
        return this.createUnsafe(PROBLEM_TYPES.MATCHING);
    }
    static fillBlank() {
        return this.createUnsafe(PROBLEM_TYPES.FILL_BLANK);
    }
    static ordering() {
        return this.createUnsafe(PROBLEM_TYPES.ORDERING);
    }
    // 직렬화/역직렬화 경로 확보
    toJSON() {
        return {
            type: 'ProblemType',
            value: this.props.value
        };
    }
    toString() {
        return this.props.value;
    }
    toPrimitive() {
        return this.props.value;
    }
    static fromJSON(json) {
        return this.create(json.value);
    }
    static fromString(value) {
        return this.create(value);
    }
    static fromPrimitive(value) {
        return this.create(value);
    }
    // 상수 접근을 위한 정적 속성
    static TYPES = PROBLEM_TYPES;
}
//# sourceMappingURL=ProblemType.js.map