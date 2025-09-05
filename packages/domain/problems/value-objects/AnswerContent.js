import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
export class AnswerContent extends ValueObject {
    constructor(props) {
        super(props);
    }
    // 순수한 데이터 접근만 제공 - 비즈니스 로직 제거
    get data() {
        return this.props.data;
    }
    get type() {
        return this.props.data.type;
    }
    get explanation() {
        return this.props.data.explanation;
    }
    get points() {
        return this.props.data.points;
    }
    // 부분 점수 허용 여부 (타입 안전한 방식)
    get allowsPartialCredit() {
        const data = this.props.data;
        if ('allowsPartialCredit' in data) {
            return data.allowsPartialCredit || false;
        }
        return false;
    }
    // 정답 데이터 접근 (채점 서비스에서 사용)
    getCorrectAnswers() {
        const data = this.props.data;
        switch (data.type) {
            case 'multiple_choice':
                return data.correctChoices;
            case 'short_answer':
                return data.acceptedAnswers;
            case 'true_false':
                return data.isTrue;
            case 'matching':
                return data.correctMatches;
            case 'fill_blank':
                return data.blanks;
            case 'ordering':
                return data.correctOrder;
            case 'long_answer':
                return data.sampleAnswer;
            default:
                return null;
        }
    }
    // 옵션 접근자들 (채점 정책에서 사용)
    getCaseSensitive() {
        const data = this.props.data;
        if ('caseSensitive' in data) {
            return data.caseSensitive;
        }
        return undefined;
    }
    getTrimWhitespace() {
        const data = this.props.data;
        if ('trimWhitespace' in data) {
            return data.trimWhitespace;
        }
        return undefined;
    }
    // 주 생성자 - 검증만 담당
    static create(data) {
        const validationResult = this.validateAnswerData(data);
        if (validationResult.isFailure) {
            return Result.fail(validationResult.error);
        }
        return Result.ok(new AnswerContent({ data }));
    }
    // 중복/공백 검증 보강 - 통일된 검증 로직
    static validateAnswerData(data) {
        // 점수 정책 일관화 - 별도 정책 클래스 사용
        const pointsValidation = this.validatePoints(data.points);
        if (pointsValidation.isFailure) {
            return pointsValidation;
        }
        // 타입별 검증
        switch (data.type) {
            case 'multiple_choice':
                return this.validateMultipleChoice(data);
            case 'short_answer':
                return this.validateShortAnswer(data);
            case 'long_answer':
                return this.validateLongAnswer(data);
            case 'true_false':
                return this.validateTrueFalse(data);
            case 'matching':
                return this.validateMatching(data);
            case 'fill_blank':
                return this.validateFillBlank(data);
            case 'ordering':
                return this.validateOrdering(data);
            default:
                return Result.fail(`Unsupported answer type: ${data.type}`);
        }
    }
    // 점수 정책 일관화
    static validatePoints(points) {
        if (typeof points !== 'number' || !Number.isFinite(points)) {
            return Result.fail('Points must be a finite number');
        }
        if (points < 0) {
            return Result.fail('Points cannot be negative');
        }
        if (points > 1000) {
            return Result.fail('Points cannot exceed 1000');
        }
        return Result.ok();
    }
    // 중복 검증 보강 - 공통 유틸리티 사용
    static validateUniqueness(items, getKey, errorMessage) {
        const keys = items.map(getKey);
        const uniqueKeys = new Set(keys);
        if (uniqueKeys.size !== keys.length) {
            return Result.fail(errorMessage);
        }
        return Result.ok();
    }
    static validateNonEmptyArray(items, minLength, errorMessage) {
        if (!items || !Array.isArray(items) || items.length < minLength) {
            return Result.fail(errorMessage);
        }
        return Result.ok();
    }
    static validateMultipleChoice(data) {
        const arrayValidation = this.validateNonEmptyArray(data.correctChoices, 1, 'Multiple choice must have at least one correct answer');
        if (arrayValidation.isFailure)
            return arrayValidation;
        return this.validateUniqueness(data.correctChoices, choice => choice, 'Correct choices must be unique');
    }
    static validateShortAnswer(data) {
        const arrayValidation = this.validateNonEmptyArray(data.acceptedAnswers, 1, 'Short answer must have at least one accepted answer');
        if (arrayValidation.isFailure)
            return arrayValidation;
        // 빈 답안 검증 보강
        const hasEmptyAnswer = data.acceptedAnswers.some(answer => !answer || typeof answer !== 'string' || answer.trim().length === 0);
        if (hasEmptyAnswer) {
            return Result.fail('Accepted answers cannot be empty');
        }
        return Result.ok();
    }
    static validateLongAnswer(data) {
        // 서술형은 특별한 검증 없음 (모든 필드가 선택사항)
        return Result.ok();
    }
    static validateTrueFalse(data) {
        if (typeof data.isTrue !== 'boolean') {
            return Result.fail('True/false answer must be boolean');
        }
        return Result.ok();
    }
    static validateMatching(data) {
        const arrayValidation = this.validateNonEmptyArray(data.correctMatches, 1, 'Matching must have at least one correct match');
        if (arrayValidation.isFailure)
            return arrayValidation;
        return this.validateUniqueness(data.correctMatches, match => match.leftId, 'Each left item can only match once');
    }
    static validateFillBlank(data) {
        const arrayValidation = this.validateNonEmptyArray(data.blanks, 1, 'Fill blank must have at least one blank answer');
        if (arrayValidation.isFailure)
            return arrayValidation;
        // 각 빈칸 검증
        for (const blank of data.blanks) {
            if (!blank.id || blank.id.trim().length === 0) {
                return Result.fail('Each blank must have a valid ID');
            }
            const blankAnswerValidation = this.validateNonEmptyArray(blank.acceptedAnswers, 1, `Blank ${blank.id} must have at least one accepted answer`);
            if (blankAnswerValidation.isFailure)
                return blankAnswerValidation;
        }
        // 빈칸 ID 중복 검증
        return this.validateUniqueness(data.blanks, blank => blank.id, 'Blank IDs must be unique');
    }
    static validateOrdering(data) {
        const arrayValidation = this.validateNonEmptyArray(data.correctOrder, 2, 'Ordering must have at least 2 items');
        if (arrayValidation.isFailure)
            return arrayValidation;
        return this.validateUniqueness(data.correctOrder, item => item, 'Order items must be unique');
    }
    // 직렬화/역직렬화
    toJSON() {
        return {
            type: 'AnswerContent',
            data: this.props.data
        };
    }
    toPrimitive() {
        return this.props.data;
    }
    static fromJSON(json) {
        return this.create(json.data);
    }
    static fromPrimitive(data) {
        return this.create(data);
    }
}
//# sourceMappingURL=AnswerContent.js.map