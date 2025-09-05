import { Result } from '../../common/Result';
export interface TextNormalizationOptions {
    caseSensitive?: boolean;
    trimWhitespace?: boolean;
    removeExtraSpaces?: boolean;
    normalizeUnicode?: boolean;
}
export declare class AnswerValidationPolicy {
    static normalizeText(text: string, options?: TextNormalizationOptions): string;
    static normalizeTextArray(texts: string[], options?: TextNormalizationOptions): string[];
    static validateUniqueness<T>(items: T[], getKey: (item: T) => string, errorMessage: string, normalizeKey?: (key: string) => string): Result<void>;
    static validateNonEmpty(value: string | undefined | null, fieldName: string): Result<void>;
    static validateArrayLength<T>(items: T[] | undefined, minLength: number, maxLength?: number, errorMessage?: string): Result<void>;
    static validateId(id: string, fieldName: string): Result<void>;
    static validateTextLength(text: string, minLength?: number, maxLength?: number, fieldName?: string): Result<void>;
    static validateChoiceTexts(choices: Array<{
        id: string;
        text: string;
    }>, maxChoices?: number): Result<void>;
    static validateMatchingPairs(matches: Array<{
        leftId: string;
        rightId: string;
    }>): Result<void>;
    static validateUrl(url: string): Result<void>;
    static validateUrls(urls: string[]): Result<void>;
}
//# sourceMappingURL=AnswerValidationPolicy.d.ts.map