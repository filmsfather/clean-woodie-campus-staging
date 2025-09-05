import { Result } from '@woodie/domain/common/Result';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';

export interface JsonParseOptions {
  reviver?: (key: string, value: any) => any;
  strict?: boolean; // 엄격 모드 (추가 검증)
  maxDepth?: number;
  allowComments?: boolean;
  dateFields?: string[]; // 자동으로 Date로 변환할 필드들
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

export class JsonUtils {
  private readonly logger?: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  /**
   * 안전한 JSON 파싱
   */
  static safeParse<T = any>(
    jsonString: string,
    options: JsonParseOptions = {}
  ): Result<T> {
    try {
      // 주석 제거 (allowComments가 true인 경우)
      let processedString = jsonString;
      if (options.allowComments) {
        processedString = this.removeJsonComments(jsonString);
      }

      // 기본 파싱
      const parsed = JSON.parse(processedString, options.reviver);

      // 추가 검증
      if (options.strict) {
        const validationResult = this.validateJsonStructure(parsed, options);
        if (!validationResult.isValid) {
          return Result.fail(
            `JSON validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`
          );
        }
      }

      // 날짜 필드 자동 변환
      if (options.dateFields) {
        this.convertDateFields(parsed, options.dateFields);
      }

      return Result.ok<T>(parsed);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown JSON parse error';
      return Result.fail(`JSON parse error: ${errorMessage}`);
    }
  }

  /**
   * 안전한 JSON 직렬화
   */
  static safeStringify(
    data: any,
    options: JsonStringifyOptions = {}
  ): Result<string> {
    try {
      let processedData = data;

      // 필드 필터링
      if (options.includeFields || options.excludeFields) {
        processedData = this.filterFields(data, options);
      }

      // 날짜 형식 변환
      if (options.dateFormat && options.dateFormat !== 'iso') {
        processedData = this.convertDateFormat(processedData, options.dateFormat);
      }

      // 키 정렬
      if (options.sortKeys) {
        processedData = this.sortObjectKeys(processedData);
      }

      // 커스텀 replacer 함수 생성
      const replacer = this.createReplacer(options);

      // 공백 설정
      const space = options.prettyPrint ? 2 : options.space;

      const result = JSON.stringify(processedData, replacer, space);
      return Result.ok(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown JSON stringify error';
      return Result.fail(`JSON stringify error: ${errorMessage}`);
    }
  }

  /**
   * JSON 데이터 검증
   */
  static validate(
    data: any,
    validationOptions: JsonValidationOptions
  ): JsonValidationResult {
    const errors: Array<{ field: string; message: string; value?: any }> = [];
    const warnings: string[] = [];

    // 규칙 기반 검증
    for (const rule of validationOptions.rules) {
      const value = this.getNestedValue(data, rule.field);
      const validationError = this.validateField(value, rule);
      
      if (validationError) {
        errors.push({
          field: rule.field,
          message: validationError,
          value
        });
      }
    }

    // 추가 필드 검증
    if (!validationOptions.allowAdditionalFields) {
      const allowedFields = new Set(validationOptions.rules.map(r => r.field.split('.')[0]));
      const actualFields = Object.keys(data || {});
      
      for (const field of actualFields) {
        if (!allowedFields.has(field)) {
          warnings.push(`Unexpected field: ${field}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // === Private Helper Methods ===

  private static removeJsonComments(jsonString: string): string {
    // 간단한 주석 제거 (정교하지 않음)
    return jsonString
      .replace(/\/\*[\s\S]*?\*\//g, '') // 블록 주석
      .replace(/\/\/.*$/gm, ''); // 라인 주석
  }

  private static validateJsonStructure(
    data: any,
    options: JsonParseOptions
  ): JsonValidationResult {
    const errors: any[] = [];
    const warnings: string[] = [];

    // 최대 깊이 검증
    if (options.maxDepth) {
      const actualDepth = this.calculateDepth(data);
      if (actualDepth > options.maxDepth) {
        errors.push({
          field: 'root',
          message: `JSON depth (${actualDepth}) exceeds maximum allowed depth (${options.maxDepth})`
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static convertDateFields(data: any, dateFields: string[]): void {
    for (const field of dateFields) {
      const value = this.getNestedValue(data, field);
      if (value && typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          this.setNestedValue(data, field, date);
        }
      }
    }
  }

  private static filterFields(
    data: any,
    options: JsonStringifyOptions
  ): any {
    if (Array.isArray(data)) {
      return data.map(item => this.filterFields(item, options));
    }

    if (data && typeof data === 'object') {
      const filtered: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        const shouldInclude = 
          (!options.includeFields || options.includeFields.includes(key)) &&
          (!options.excludeFields || !options.excludeFields.includes(key));
        
        if (shouldInclude) {
          filtered[key] = this.filterFields(value, options);
        }
      }
      
      return filtered;
    }

    return data;
  }

  private static convertDateFormat(data: any, format: 'timestamp' | 'locale'): any {
    if (data instanceof Date) {
      switch (format) {
        case 'timestamp':
          return data.getTime();
        case 'locale':
          return data.toLocaleString();
        default:
          return data;
      }
    }

    if (Array.isArray(data)) {
      return data.map(item => this.convertDateFormat(item, format));
    }

    if (data && typeof data === 'object') {
      const converted: any = {};
      for (const [key, value] of Object.entries(data)) {
        converted[key] = this.convertDateFormat(value, format);
      }
      return converted;
    }

    return data;
  }

  private static sortObjectKeys(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.sortObjectKeys(item));
    }

    if (data && typeof data === 'object') {
      const sorted: any = {};
      const keys = Object.keys(data).sort();
      
      for (const key of keys) {
        sorted[key] = this.sortObjectKeys(data[key]);
      }
      
      return sorted;
    }

    return data;
  }

  private static createReplacer(options: JsonStringifyOptions) {
    return (key: string, value: any) => {
      // 기본 replacer 적용
      let processedValue = options.replacer ? options.replacer(key, value) : value;

      // 순환 참조 방지
      if (typeof processedValue === 'object' && processedValue !== null) {
        if (this.hasCircularReference(processedValue)) {
          return '[Circular Reference]';
        }
      }

      return processedValue;
    };
  }

  private static validateField(value: any, rule: ValidationRule): string | null {
    // Required 검증
    if (rule.required && (value === undefined || value === null)) {
      return `Field '${rule.field}' is required`;
    }

    if (value === undefined || value === null) {
      return null; // 옵셔널 필드
    }

    // Type 검증
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (rule.type !== actualType) {
      return `Field '${rule.field}' expected type ${rule.type}, got ${actualType}`;
    }

    // Pattern 검증 (문자열)
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return `Field '${rule.field}' does not match required pattern`;
    }

    // 범위 검증 (숫자)
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `Field '${rule.field}' value ${value} is less than minimum ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `Field '${rule.field}' value ${value} is greater than maximum ${rule.max}`;
      }
    }

    // 허용값 검증
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      return `Field '${rule.field}' value '${value}' is not in allowed values`;
    }

    // 커스텀 검증
    if (rule.customValidator && !rule.customValidator(value)) {
      return `Field '${rule.field}' failed custom validation`;
    }

    return null;
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    let current = obj;
    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }

  private static calculateDepth(data: any, current = 0): number {
    if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        return Math.max(current, ...data.map(item => this.calculateDepth(item, current + 1)));
      } else {
        return Math.max(current, ...Object.values(data).map(value => this.calculateDepth(value, current + 1)));
      }
    }
    return current;
  }

  private static hasCircularReference(obj: any, seen = new WeakSet()): boolean {
    if (obj && typeof obj === 'object') {
      if (seen.has(obj)) {
        return true;
      }
      seen.add(obj);
      
      for (const value of Object.values(obj)) {
        if (this.hasCircularReference(value, seen)) {
          return true;
        }
      }
    }
    return false;
  }
}

// CSV 파싱 유틸리티
export class CsvUtils {
  static parse(
    csvString: string,
    options: {
      delimiter?: string;
      quote?: string;
      headers?: boolean;
      skipEmptyLines?: boolean;
    } = {}
  ): Result<any[]> {
    try {
      const {
        delimiter = ',',
        quote = '"',
        headers = true,
        skipEmptyLines = true
      } = options;

      const lines = csvString.split('\n');
      const result: any[] = [];
      let headerRow: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (skipEmptyLines && !line) {
          continue;
        }

        const values = this.parseCsvLine(line, delimiter, quote);
        
        if (i === 0 && headers) {
          headerRow = values;
          continue;
        }

        if (headers && headerRow.length > 0) {
          const obj: any = {};
          headerRow.forEach((header, index) => {
            obj[header] = values[index] || null;
          });
          result.push(obj);
        } else {
          result.push(values);
        }
      }

      return Result.ok(result);

    } catch (error) {
      return Result.fail(`CSV parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static stringify(
    data: any[],
    options: {
      delimiter?: string;
      quote?: string;
      headers?: boolean;
      headerRow?: string[];
    } = {}
  ): Result<string> {
    try {
      const {
        delimiter = ',',
        quote = '"',
        headers = true,
        headerRow
      } = options;

      const lines: string[] = [];

      if (data.length === 0) {
        return Result.ok('');
      }

      // 헤더 행 처리
      if (headers) {
        const keys = headerRow || Object.keys(data[0]);
        lines.push(keys.map(key => this.escapeCsvValue(key, delimiter, quote)).join(delimiter));
      }

      // 데이터 행 처리
      for (const item of data) {
        const values = Array.isArray(item) 
          ? item 
          : Object.values(item);
        
        const escapedValues = values.map(value => 
          this.escapeCsvValue(String(value || ''), delimiter, quote)
        );
        
        lines.push(escapedValues.join(delimiter));
      }

      return Result.ok(lines.join('\n'));

    } catch (error) {
      return Result.fail(`CSV stringify error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static parseCsvLine(line: string, delimiter: string, quote: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === quote) {
        if (inQuotes && nextChar === quote) {
          current += quote;
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    values.push(current);
    return values;
  }

  private static escapeCsvValue(value: string, delimiter: string, quote: string): string {
    if (value.includes(delimiter) || value.includes(quote) || value.includes('\n') || value.includes('\r')) {
      return quote + value.replace(new RegExp(quote, 'g'), quote + quote) + quote;
    }
    return value;
  }
}