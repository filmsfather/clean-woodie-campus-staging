import { ValueObject } from '../../value-objects/ValueObject';
import { Guard } from '../../common/Guard';
import { Result } from '../../common/Result';
export class FullName extends ValueObject {
    constructor(props) {
        super(props);
    }
    get value() {
        return this.props.value;
    }
    static create(name) {
        // null/undefined 검증
        const guardResult = Guard.againstNullOrUndefined(name, 'name');
        if (guardResult.isFailure) {
            return Result.fail(guardResult.errorValue);
        }
        // 공백 제거 후 빈 문자열 검증
        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            return Result.fail('Name cannot be empty');
        }
        // 길이 검증 (1-100자)
        if (trimmedName.length > 100) {
            return Result.fail('Name cannot be longer than 100 characters');
        }
        // 최소 길이 검증 (1자 이상)
        if (trimmedName.length < 1) {
            return Result.fail('Name must be at least 1 character long');
        }
        // 특수 문자 검증 (기본적인 이름 패턴만 허용)
        const namePattern = /^[a-zA-Z가-힣\s\-'.]{1,100}$/;
        if (!namePattern.test(trimmedName)) {
            return Result.fail('Name contains invalid characters');
        }
        return Result.ok(new FullName({ value: trimmedName }));
    }
    // 표시용 형식 (첫 글자 대문자)
    getDisplayName() {
        return this.props.value
            .split(' ')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
    }
    // 이니셜 추출 (프로필 아바타용)
    getInitials() {
        return this.props.value
            .split(' ')
            .map(part => part.charAt(0).toUpperCase())
            .slice(0, 2) // 최대 2글자
            .join('');
    }
}
//# sourceMappingURL=FullName.js.map