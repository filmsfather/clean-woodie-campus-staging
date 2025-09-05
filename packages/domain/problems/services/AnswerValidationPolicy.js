import { Result } from '../../common/Result';
export class AnswerValidationPolicy {
    // 텍스트 정규화 - 일관된 처리
    static normalizeText(text, options = {}) {
        let normalized = text;
        // 기본값 설정
        const opts = {
            caseSensitive: options.caseSensitive || false,
            trimWhitespace: options.trimWhitespace !== false, // 기본 true
            removeExtraSpaces: options.removeExtraSpaces !== false, // 기본 true
            normalizeUnicode: options.normalizeUnicode !== false // 기본 true
        };
        // 유니코드 정규화 (NFD -> NFC)
        if (opts.normalizeUnicode) {
            normalized = normalized.normalize('NFC');
        }
        // 공백 처리
        if (opts.trimWhitespace) {
            normalized = normalized.trim();
        }
        // 연속된 공백 제거
        if (opts.removeExtraSpaces) {
            normalized = normalized.replace(/\s+/g, ' ');
        }
        // 대소문자 처리
        if (!opts.caseSensitive) {
            normalized = normalized.toLowerCase();
        }
        return normalized;
    }
    // 배열 요소 정규화
    static normalizeTextArray(texts, options = {}) {
        return texts.map(text => this.normalizeText(text, options));
    }
    // 중복 검증 강화 - 제네릭 방식
    static validateUniqueness(items, getKey, errorMessage, normalizeKey) {
        if (!Array.isArray(items)) {
            return Result.fail('Items must be an array');
        }
        const keys = items.map(getKey);
        const normalizedKeys = normalizeKey
            ? keys.map(normalizeKey)
            : keys;
        const uniqueKeys = new Set(normalizedKeys);
        if (uniqueKeys.size !== keys.length) {
            return Result.fail(errorMessage);
        }
        return Result.ok();
    }
    // 빈 값 검증
    static validateNonEmpty(value, fieldName) {
        if (!value || typeof value !== 'string' || value.trim().length === 0) {
            return Result.fail(`${fieldName} cannot be empty`);
        }
        return Result.ok();
    }
    // 배열 길이 검증
    static validateArrayLength(items, minLength, maxLength, errorMessage) {
        if (!items || !Array.isArray(items)) {
            return Result.fail(errorMessage || 'Invalid array');
        }
        if (items.length < minLength) {
            return Result.fail(errorMessage || `Array must have at least ${minLength} items`);
        }
        if (maxLength !== undefined && items.length > maxLength) {
            return Result.fail(errorMessage || `Array cannot have more than ${maxLength} items`);
        }
        return Result.ok();
    }
    // ID 유효성 검증
    static validateId(id, fieldName) {
        if (!id || typeof id !== 'string') {
            return Result.fail(`${fieldName} must be a string`);
        }
        const trimmedId = id.trim();
        if (trimmedId.length === 0) {
            return Result.fail(`${fieldName} cannot be empty`);
        }
        // ID 패턴 검증 (영숫자, 하이픈, 언더스코어만 허용)
        const idPattern = /^[a-zA-Z0-9_-]+$/;
        if (!idPattern.test(trimmedId)) {
            return Result.fail(`${fieldName} can only contain letters, numbers, hyphens, and underscores`);
        }
        return Result.ok();
    }
    // 텍스트 길이 검증
    static validateTextLength(text, minLength = 0, maxLength, fieldName = 'Text') {
        if (typeof text !== 'string') {
            return Result.fail(`${fieldName} must be a string`);
        }
        const trimmedText = text.trim();
        if (trimmedText.length < minLength) {
            return Result.fail(`${fieldName} must be at least ${minLength} characters`);
        }
        if (maxLength !== undefined && trimmedText.length > maxLength) {
            return Result.fail(`${fieldName} cannot exceed ${maxLength} characters`);
        }
        return Result.ok();
    }
    // 선택지 텍스트 유효성 검증
    static validateChoiceTexts(choices, maxChoices = 10) {
        // 배열 길이 검증
        const lengthValidation = this.validateArrayLength(choices, 2, maxChoices, `Choices must have 2-${maxChoices} options`);
        if (lengthValidation.isFailure)
            return lengthValidation;
        // 각 선택지 검증
        for (const choice of choices) {
            const idValidation = this.validateId(choice.id, 'Choice ID');
            if (idValidation.isFailure)
                return idValidation;
            const textValidation = this.validateNonEmpty(choice.text, 'Choice text');
            if (textValidation.isFailure)
                return textValidation;
        }
        // ID 중복 검증
        const idUniquenessValidation = this.validateUniqueness(choices, choice => choice.id, 'Choice IDs must be unique');
        if (idUniquenessValidation.isFailure)
            return idUniquenessValidation;
        // 텍스트 중복 검증 (정규화된 텍스트로)
        const textUniquenessValidation = this.validateUniqueness(choices, choice => choice.text, 'Choice texts must be unique', text => this.normalizeText(text, { caseSensitive: false, trimWhitespace: true }));
        return textUniquenessValidation;
    }
    // 매칭 쌍 검증
    static validateMatchingPairs(matches) {
        const lengthValidation = this.validateArrayLength(matches, 1, undefined, 'Must have at least one matching pair');
        if (lengthValidation.isFailure)
            return lengthValidation;
        // 각 매칭 쌍 검증
        for (const match of matches) {
            const leftIdValidation = this.validateId(match.leftId, 'Left ID');
            if (leftIdValidation.isFailure)
                return leftIdValidation;
            const rightIdValidation = this.validateId(match.rightId, 'Right ID');
            if (rightIdValidation.isFailure)
                return rightIdValidation;
        }
        // leftId 중복 검증 (한 left 아이템은 하나의 right와만 매칭)
        return this.validateUniqueness(matches, match => match.leftId, 'Each left item can only match once');
    }
    // URL 유효성 검증 (첨부파일용)
    static validateUrl(url) {
        if (!url || typeof url !== 'string') {
            return Result.fail('URL must be a string');
        }
        try {
            new URL(url);
            return Result.ok();
        }
        catch {
            return Result.fail('Invalid URL format');
        }
    }
    // URL 배열 검증
    static validateUrls(urls) {
        if (!Array.isArray(urls)) {
            return Result.fail('URLs must be an array');
        }
        for (const url of urls) {
            const urlValidation = this.validateUrl(url);
            if (urlValidation.isFailure)
                return urlValidation;
        }
        return Result.ok();
    }
}
//# sourceMappingURL=AnswerValidationPolicy.js.map