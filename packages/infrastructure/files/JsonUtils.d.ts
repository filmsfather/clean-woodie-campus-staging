import { Result } from '@woodie/domain/common/Result';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
export interface JsonParseOptions {
    reviver?: (key: string, value: any) => any;
    strict?: boolean;
    maxDepth?: number;
    allowComments?: boolean;
    dateFields?: string[];
}
export interface JsonStringifyOptions {
    replacer?: (key: string, value: any) => any;
    space?: number | string;
    dateFormat?: 'iso' | 'timestamp' | 'locale';
    excludeFields?: string[];
    includeFields?: string[];
    prettyPrint?: boolean;
    sortKeys?: boolean;
}
export interface ValidationRule {
    field: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    pattern?: RegExp;
    min?: number;
    max?: number;
    allowedValues?: any[];
    customValidator?: (value: any) => boolean;
}
export interface JsonValidationOptions {
    rules: ValidationRule[];
    allowAdditionalFields?: boolean;
    strictTypeChecking?: boolean;
}
export interface JsonValidationResult {
    isValid: boolean;
    errors: Array<{
        field: string;
        message: string;
        value?: any;
    }>;
    warnings: string[];
}
export declare class JsonUtils {
    private readonly logger?;
    constructor(logger?: ILogger);
    /**
     * 안전한 JSON 파싱
     */
    static safeParse<T = any>(jsonString: string, options?: JsonParseOptions): Result<T>;
    /**
     * 안전한 JSON 직렬화
     */
    static safeStringify(data: any, options?: JsonStringifyOptions): Result<string>;
    /**
     * JSON 데이터 검증
     */
    static validate(data: any, validationOptions: JsonValidationOptions): JsonValidationResult;
    private static removeJsonComments;
    private static validateJsonStructure;
    private static convertDateFields;
    private static filterFields;
    private static convertDateFormat;
    private static sortObjectKeys;
    private static createReplacer;
    private static validateField;
    private static getNestedValue;
    private static setNestedValue;
    private static calculateDepth;
    private static hasCircularReference;
}
export declare class CsvUtils {
    static parse(csvString: string, options?: {
        delimiter?: string;
        quote?: string;
        headers?: boolean;
        skipEmptyLines?: boolean;
    }): Result<any[]>;
    static stringify(data: any[], options?: {
        delimiter?: string;
        quote?: string;
        headers?: boolean;
        headerRow?: string[];
    }): Result<string>;
    private static parseCsvLine;
    private static escapeCsvValue;
}
//# sourceMappingURL=JsonUtils.d.ts.map