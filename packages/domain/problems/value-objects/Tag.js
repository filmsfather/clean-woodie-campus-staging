import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
export class Tag extends ValueObject {
    constructor(props) {
        super(props);
    }
    get name() {
        return this.props.name;
    }
    // Alias for name (used in some cached services)
    get value() {
        return this.props.name;
    }
    // 주 생성자
    static create(name) {
        if (!name || typeof name !== 'string') {
            return Result.fail('Tag name is required');
        }
        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            return Result.fail('Tag name cannot be empty');
        }
        if (trimmedName.length > 50) {
            return Result.fail('Tag name cannot exceed 50 characters');
        }
        // 태그명 유효성 검증 - 영문, 한글, 숫자, 하이픈, 언더스코어만 허용
        const validTagPattern = /^[a-zA-Z0-9가-힣_-]+$/;
        if (!validTagPattern.test(trimmedName)) {
            return Result.fail('Tag name can only contain letters, numbers, hyphens, and underscores');
        }
        return Result.ok(new Tag({ name: trimmedName.toLowerCase() })); // 소문자로 정규화
    }
    // 태그 정규화를 위한 유틸리티
    static normalize(name) {
        return name.trim().toLowerCase();
    }
    // 여러 태그 생성
    static createMany(names) {
        const tags = [];
        const errors = [];
        for (const name of names) {
            const tagResult = this.create(name);
            if (tagResult.isFailure) {
                errors.push(`${name}: ${tagResult.error}`);
            }
            else {
                tags.push(tagResult.value);
            }
        }
        if (errors.length > 0) {
            return Result.fail(`Failed to create tags: ${errors.join(', ')}`);
        }
        return Result.ok(tags);
    }
    // 중복 제거
    static removeDuplicates(tags) {
        const seen = new Set();
        return tags.filter(tag => {
            const name = tag.name;
            if (seen.has(name)) {
                return false;
            }
            seen.add(name);
            return true;
        });
    }
    // 직렬화/역직렬화
    toJSON() {
        return {
            type: 'Tag',
            name: this.props.name
        };
    }
    toString() {
        return this.props.name;
    }
    toPrimitive() {
        return this.props.name;
    }
    static fromJSON(json) {
        return this.create(json.name);
    }
    static fromString(value) {
        return this.create(value);
    }
    static fromPrimitive(name) {
        return this.create(name);
    }
    // 배열 직렬화/역직렬화
    static toStringArray(tags) {
        return tags.map(tag => tag.toPrimitive());
    }
    static fromStringArray(names) {
        return this.createMany(names);
    }
}
//# sourceMappingURL=Tag.js.map