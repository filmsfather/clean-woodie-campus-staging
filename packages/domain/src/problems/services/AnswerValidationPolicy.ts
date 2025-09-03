import { Result } from '../../common/Result';

// 중복/공백 검증 보강 - 통일된 검증 정책

export interface TextNormalizationOptions {
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
  removeExtraSpaces?: boolean;
  normalizeUnicode?: boolean;
}

export class AnswerValidationPolicy {
  
  // 텍스트 정규화 - 일관된 처리
  public static normalizeText(
    text: string,
    options: TextNormalizationOptions = {}
  ): string {
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
  public static normalizeTextArray(
    texts: string[],
    options: TextNormalizationOptions = {}
  ): string[] {
    return texts.map(text => this.normalizeText(text, options));
  }

  // 중복 검증 강화 - 제네릭 방식
  public static validateUniqueness<T>(
    items: T[],
    getKey: (item: T) => string,
    errorMessage: string,
    normalizeKey?: (key: string) => string
  ): Result<void> {
    if (!Array.isArray(items)) {
      return Result.fail<void>('Items must be an array');
    }

    const keys = items.map(getKey);
    const normalizedKeys = normalizeKey 
      ? keys.map(normalizeKey)
      : keys;
    
    const uniqueKeys = new Set(normalizedKeys);
    
    if (uniqueKeys.size !== keys.length) {
      return Result.fail<void>(errorMessage);
    }
    
    return Result.ok<void>();
  }

  // 빈 값 검증
  public static validateNonEmpty(
    value: string | undefined | null,
    fieldName: string
  ): Result<void> {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return Result.fail<void>(`${fieldName} cannot be empty`);
    }
    return Result.ok<void>();
  }

  // 배열 길이 검증
  public static validateArrayLength<T>(
    items: T[] | undefined,
    minLength: number,
    maxLength?: number,
    errorMessage?: string
  ): Result<void> {
    if (!items || !Array.isArray(items)) {
      return Result.fail<void>(errorMessage || 'Invalid array');
    }

    if (items.length < minLength) {
      return Result.fail<void>(
        errorMessage || `Array must have at least ${minLength} items`
      );
    }

    if (maxLength !== undefined && items.length > maxLength) {
      return Result.fail<void>(
        errorMessage || `Array cannot have more than ${maxLength} items`
      );
    }

    return Result.ok<void>();
  }

  // ID 유효성 검증
  public static validateId(id: string, fieldName: string): Result<void> {
    if (!id || typeof id !== 'string') {
      return Result.fail<void>(`${fieldName} must be a string`);
    }

    const trimmedId = id.trim();
    if (trimmedId.length === 0) {
      return Result.fail<void>(`${fieldName} cannot be empty`);
    }

    // ID 패턴 검증 (영숫자, 하이픈, 언더스코어만 허용)
    const idPattern = /^[a-zA-Z0-9_-]+$/;
    if (!idPattern.test(trimmedId)) {
      return Result.fail<void>(
        `${fieldName} can only contain letters, numbers, hyphens, and underscores`
      );
    }

    return Result.ok<void>();
  }

  // 텍스트 길이 검증
  public static validateTextLength(
    text: string,
    minLength: number = 0,
    maxLength?: number,
    fieldName: string = 'Text'
  ): Result<void> {
    if (typeof text !== 'string') {
      return Result.fail<void>(`${fieldName} must be a string`);
    }

    const trimmedText = text.trim();
    
    if (trimmedText.length < minLength) {
      return Result.fail<void>(
        `${fieldName} must be at least ${minLength} characters`
      );
    }

    if (maxLength !== undefined && trimmedText.length > maxLength) {
      return Result.fail<void>(
        `${fieldName} cannot exceed ${maxLength} characters`
      );
    }

    return Result.ok<void>();
  }

  // 선택지 텍스트 유효성 검증
  public static validateChoiceTexts(
    choices: Array<{ id: string; text: string }>,
    maxChoices: number = 10
  ): Result<void> {
    // 배열 길이 검증
    const lengthValidation = this.validateArrayLength(
      choices,
      2,
      maxChoices,
      `Choices must have 2-${maxChoices} options`
    );
    if (lengthValidation.isFailure) return lengthValidation;

    // 각 선택지 검증
    for (const choice of choices) {
      const idValidation = this.validateId(choice.id, 'Choice ID');
      if (idValidation.isFailure) return idValidation;

      const textValidation = this.validateNonEmpty(choice.text, 'Choice text');
      if (textValidation.isFailure) return textValidation;
    }

    // ID 중복 검증
    const idUniquenessValidation = this.validateUniqueness(
      choices,
      choice => choice.id,
      'Choice IDs must be unique'
    );
    if (idUniquenessValidation.isFailure) return idUniquenessValidation;

    // 텍스트 중복 검증 (정규화된 텍스트로)
    const textUniquenessValidation = this.validateUniqueness(
      choices,
      choice => choice.text,
      'Choice texts must be unique',
      text => this.normalizeText(text, { caseSensitive: false, trimWhitespace: true })
    );
    
    return textUniquenessValidation;
  }

  // 매칭 쌍 검증
  public static validateMatchingPairs(
    matches: Array<{ leftId: string; rightId: string }>
  ): Result<void> {
    const lengthValidation = this.validateArrayLength(
      matches,
      1,
      undefined,
      'Must have at least one matching pair'
    );
    if (lengthValidation.isFailure) return lengthValidation;

    // 각 매칭 쌍 검증
    for (const match of matches) {
      const leftIdValidation = this.validateId(match.leftId, 'Left ID');
      if (leftIdValidation.isFailure) return leftIdValidation;

      const rightIdValidation = this.validateId(match.rightId, 'Right ID');
      if (rightIdValidation.isFailure) return rightIdValidation;
    }

    // leftId 중복 검증 (한 left 아이템은 하나의 right와만 매칭)
    return this.validateUniqueness(
      matches,
      match => match.leftId,
      'Each left item can only match once'
    );
  }

  // URL 유효성 검증 (첨부파일용)
  public static validateUrl(url: string): Result<void> {
    if (!url || typeof url !== 'string') {
      return Result.fail<void>('URL must be a string');
    }

    try {
      new URL(url);
      return Result.ok<void>();
    } catch {
      return Result.fail<void>('Invalid URL format');
    }
  }

  // URL 배열 검증
  public static validateUrls(urls: string[]): Result<void> {
    if (!Array.isArray(urls)) {
      return Result.fail<void>('URLs must be an array');
    }

    for (const url of urls) {
      const urlValidation = this.validateUrl(url);
      if (urlValidation.isFailure) return urlValidation;
    }

    return Result.ok<void>();
  }
}