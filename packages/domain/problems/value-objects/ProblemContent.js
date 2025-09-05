import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
import { ProblemType } from './ProblemType';
export class ProblemContent extends ValueObject {
    constructor(props) {
        super(props);
    }
    get data() {
        return this.props.data;
    }
    get type() {
        return ProblemType.fromString(this.props.data.type).value; // 이미 검증된 값이므로 안전
    }
    get title() {
        return this.props.data.title;
    }
    get description() {
        return this.props.data.description;
    }
    get instructions() {
        return this.props.data.instructions;
    }
    get attachments() {
        return this.props.data.attachments || [];
    }
    // 주 생성자
    static create(data) {
        const validationResult = this.validateContent(data);
        if (validationResult.isFailure) {
            return Result.fail(validationResult.error);
        }
        return Result.ok(new ProblemContent({ data }));
    }
    // 콘텐츠 유효성 검증
    static validateContent(data) {
        // 기본 필드 검증
        if (!data.title || data.title.trim().length === 0) {
            return Result.fail('Problem title is required');
        }
        if (data.title.trim().length > 200) {
            return Result.fail('Problem title cannot exceed 200 characters');
        }
        // 타입별 특화 검증
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
                return Result.fail(`Unsupported problem type: ${data.type}`);
        }
    }
    static validateMultipleChoice(data) {
        if (!data.choices || data.choices.length < 2) {
            return Result.fail('Multiple choice must have at least 2 choices');
        }
        if (data.choices.length > 10) {
            return Result.fail('Multiple choice cannot have more than 10 choices');
        }
        // 선택지 중복 검증
        const choiceTexts = data.choices.map(c => c.text.trim());
        const uniqueTexts = new Set(choiceTexts);
        if (uniqueTexts.size !== choiceTexts.length) {
            return Result.fail('Choice options must be unique');
        }
        return Result.ok();
    }
    static validateShortAnswer(data) {
        if (data.maxLength && data.maxLength > 1000) {
            return Result.fail('Short answer max length cannot exceed 1000 characters');
        }
        return Result.ok();
    }
    static validateLongAnswer(data) {
        if (data.minLength && data.maxLength && data.minLength > data.maxLength) {
            return Result.fail('Long answer min length cannot be greater than max length');
        }
        return Result.ok();
    }
    static validateTrueFalse(data) {
        if (!data.statement || data.statement.trim().length === 0) {
            return Result.fail('True/false statement is required');
        }
        return Result.ok();
    }
    static validateMatching(data) {
        if (!data.leftItems || data.leftItems.length < 2) {
            return Result.fail('Matching must have at least 2 left items');
        }
        if (!data.rightItems || data.rightItems.length < 2) {
            return Result.fail('Matching must have at least 2 right items');
        }
        return Result.ok();
    }
    static validateFillBlank(data) {
        if (!data.text || data.text.trim().length === 0) {
            return Result.fail('Fill blank text is required');
        }
        // 빈칸이 하나 이상 있는지 확인
        const blankCount = (data.text.match(/__blank__/g) || []).length;
        if (blankCount === 0) {
            return Result.fail('Fill blank must contain at least one __blank__ placeholder');
        }
        if (!data.blanks || data.blanks.length !== blankCount) {
            return Result.fail('Number of blanks must match blank placeholders in text');
        }
        return Result.ok();
    }
    static validateOrdering(data) {
        if (!data.items || data.items.length < 2) {
            return Result.fail('Ordering must have at least 2 items');
        }
        return Result.ok();
    }
    // 직렬화/역직렬화
    toJSON() {
        return {
            type: 'ProblemContent',
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
    // 콘텐츠 업데이트
    updateTitle(title) {
        const updatedData = { ...this.props.data, title };
        return ProblemContent.create(updatedData);
    }
    updateDescription(description) {
        const updatedData = { ...this.props.data, description };
        return ProblemContent.create(updatedData);
    }
}
//# sourceMappingURL=ProblemContent.js.map