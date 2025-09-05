import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse, ValidationSchema, HTTP_STATUS } from '../interfaces/ProblemApiTypes';
import { ProblemBankErrorCode } from '@woodie/application/problems/errors/ProblemBankErrors';
import * as crypto from 'crypto';

// 유효성 검증 결과
interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

// 유효성 검증 미들웨어
export class ValidationMiddleware {
  
  // 요청 본문 검증
  static validateBody(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const result = this.validateObject(req.body, schema, 'body');
      
      if (!result.isValid) {
        this.sendValidationErrorResponse(res, result.errors);
        return;
      }
      
      next();
    };
  }

  // 쿼리 파라미터 검증
  static validateQuery(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const result = this.validateObject(req.query, schema, 'query');
      
      if (!result.isValid) {
        this.sendValidationErrorResponse(res, result.errors);
        return;
      }
      
      next();
    };
  }

  // URL 파라미터 검증
  static validateParams(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const result = this.validateObject(req.params, schema, 'params');
      
      if (!result.isValid) {
        this.sendValidationErrorResponse(res, result.errors);
        return;
      }
      
      next();
    };
  }

  // 문제 생성 요청 검증
  static validateCreateProblem() {
    return this.validateBody({
      type: {
        required: true,
        type: 'string',
        enum: ['multiple_choice', 'short_answer', 'long_answer', 'true_false', 'matching', 'fill_blank', 'ordering']
      },
      content: {
        required: true,
        type: 'object',
        custom: (value: any) => {
          if (!value.title || typeof value.title !== 'string' || value.title.trim().length === 0) {
            return 'Content title is required and must be a non-empty string';
          }
          if (value.title.length > 500) {
            return 'Content title must be less than 500 characters';
          }
          return true;
        }
      },
      correctAnswer: {
        required: true,
        type: 'object',
        custom: (value: any) => {
          if (typeof value.points !== 'number' || value.points < 0) {
            return 'Correct answer points must be a non-negative number';
          }
          if (value.points > 1000) {
            return 'Points cannot exceed 1000';
          }
          return true;
        }
      },
      difficulty: {
        required: true,
        type: 'number',
        min: 1,
        max: 5
      },
      tags: {
        required: false,
        type: 'array',
        custom: (value: any) => {
          if (value && Array.isArray(value)) {
            if (value.length > 10) {
              return 'Cannot have more than 10 tags';
            }
            for (const tag of value) {
              if (typeof tag !== 'string' || tag.trim().length === 0) {
                return 'All tags must be non-empty strings';
              }
              if (tag.length > 50) {
                return 'Each tag must be less than 50 characters';
              }
            }
          }
          return true;
        }
      },
      isActive: {
        required: false,
        type: 'boolean'
      }
    });
  }

  // 문제 업데이트 요청 검증
  static validateUpdateProblem() {
    return this.validateBody({
      content: {
        required: false,
        type: 'object',
        custom: (value: any) => {
          if (value && value.title && typeof value.title === 'string' && value.title.length > 500) {
            return 'Content title must be less than 500 characters';
          }
          return true;
        }
      },
      correctAnswer: {
        required: false,
        type: 'object',
        custom: (value: any) => {
          if (value && value.points !== undefined) {
            if (typeof value.points !== 'number' || value.points < 0 || value.points > 1000) {
              return 'Points must be a number between 0 and 1000';
            }
          }
          return true;
        }
      },
      difficulty: {
        required: false,
        type: 'number',
        min: 1,
        max: 5
      },
      tags: {
        required: false,
        type: 'array',
        custom: (value: any) => {
          if (value && Array.isArray(value)) {
            if (value.length > 10) return 'Cannot have more than 10 tags';
            for (const tag of value) {
              if (typeof tag !== 'string' || tag.trim().length === 0) {
                return 'All tags must be non-empty strings';
              }
              if (tag.length > 50) return 'Each tag must be less than 50 characters';
            }
          }
          return true;
        }
      },
      isActive: {
        required: false,
        type: 'boolean'
      }
    });
  }

  // 검색 쿼리 검증
  static validateSearchQuery() {
    return this.validateQuery({
      types: {
        required: false,
        type: 'string',
        custom: (value: string) => {
          if (value) {
            const types = value.split(',').map(t => t.trim());
            const validTypes = ['multiple_choice', 'short_answer', 'long_answer', 'true_false', 'matching', 'fill_blank', 'ordering'];
            const invalidTypes = types.filter(t => !validTypes.includes(t));
            if (invalidTypes.length > 0) {
              return `Invalid problem types: ${invalidTypes.join(', ')}`;
            }
          }
          return true;
        }
      },
      difficulties: {
        required: false,
        type: 'string',
        custom: (value: string) => {
          if (value) {
            const difficulties = value.split(',').map(d => parseInt(d.trim()));
            const invalidDifficulties = difficulties.filter(d => isNaN(d) || d < 1 || d > 5);
            if (invalidDifficulties.length > 0) {
              return 'Difficulty values must be numbers between 1 and 5';
            }
          }
          return true;
        }
      },
      tags: {
        required: false,
        type: 'string'
      },
      isActive: {
        required: false,
        type: 'string',
        enum: ['true', 'false']
      },
      searchQuery: {
        required: false,
        type: 'string',
        max: 200
      },
      page: {
        required: false,
        type: 'string',
        custom: (value: string) => {
          if (value) {
            const pageNum = parseInt(value);
            if (isNaN(pageNum) || pageNum < 1) {
              return 'Page must be a positive integer';
            }
            if (pageNum > 1000) {
              return 'Page number too large (max: 1000)';
            }
          }
          return true;
        }
      },
      limit: {
        required: false,
        type: 'string',
        custom: (value: string) => {
          if (value) {
            const limitNum = parseInt(value);
            if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
              return 'Limit must be a number between 1 and 100';
            }
          }
          return true;
        }
      },
      strategy: {
        required: false,
        type: 'string',
        enum: ['offset', 'cursor']
      },
      sortField: {
        required: false,
        type: 'string',
        enum: ['createdAt', 'updatedAt', 'difficulty', 'title']
      },
      sortDirection: {
        required: false,
        type: 'string',
        enum: ['ASC', 'DESC']
      }
    });
  }

  // 일괄 작업 요청 검증
  static validateBulkOperation() {
    return this.validateBody({
      problemIds: {
        required: true,
        type: 'array',
        custom: (value: any) => {
          if (!Array.isArray(value) || value.length === 0) {
            return 'Problem IDs array cannot be empty';
          }
          if (value.length > 100) {
            return 'Cannot process more than 100 problems at once';
          }
          for (const id of value) {
            if (typeof id !== 'string' || id.trim().length === 0) {
              return 'All problem IDs must be non-empty strings';
            }
          }
          return true;
        }
      },
      teacherId: {
        required: true,
        type: 'string',
        custom: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'Teacher ID is required';
          }
          // UUID 형식 검증 (간단한 버전)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(value)) {
            return 'Teacher ID must be a valid UUID';
          }
          return true;
        }
      }
    });
  }

  // 태그 업데이트 요청 검증
  static validateBulkUpdateTags() {
    return this.validateBody({
      problemIds: {
        required: true,
        type: 'array'
      },
      teacherId: {
        required: true,
        type: 'string'
      },
      tags: {
        required: true,
        type: 'array',
        custom: (value: any) => {
          if (!Array.isArray(value) || value.length === 0) {
            return 'Tags array cannot be empty';
          }
          if (value.length > 10) {
            return 'Cannot have more than 10 tags';
          }
          for (const tag of value) {
            if (typeof tag !== 'string' || tag.trim().length === 0) {
              return 'All tags must be non-empty strings';
            }
            if (tag.length > 50) {
              return 'Each tag must be less than 50 characters';
            }
          }
          return true;
        }
      },
      operation: {
        required: true,
        type: 'string',
        enum: ['add', 'remove', 'replace']
      }
    });
  }

  // URL 파라미터 ID 검증
  static validateProblemId() {
    return this.validateParams({
      id: {
        required: true,
        type: 'string',
        custom: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'Problem ID is required';
          }
          // UUID 형식 검증
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(value)) {
            return 'Problem ID must be a valid UUID';
          }
          return true;
        }
      }
    });
  }

  // === Use Case 전용 검증 메서드들 ===

  // 문제 내용 업데이트 검증
  static validateUpdateProblemContent() {
    return this.validateBody({
      title: {
        required: true,
        type: 'string',
        min: 1,
        max: 500,
        custom: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'Title is required';
          }
          return true;
        }
      },
      description: {
        required: false,
        type: 'string',
        max: 2000
      }
    });
  }

  // 문제 답안 업데이트 검증
  static validateUpdateProblemAnswer() {
    return this.validateBody({
      correctAnswerValue: {
        required: true,
        type: 'string',
        min: 1,
        max: 1000,
        custom: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'Correct answer value is required';
          }
          return true;
        }
      }
    });
  }

  // 난이도 변경 검증
  static validateChangeDifficulty() {
    return this.validateBody({
      difficultyLevel: {
        required: true,
        type: 'number',
        min: 1,
        max: 5
      }
    });
  }

  // 태그 관리 검증
  static validateManageTags() {
    return this.validateBody({
      tags: {
        required: true,
        type: 'array',
        custom: (value: any) => {
          if (!Array.isArray(value)) {
            return 'Tags must be an array';
          }
          if (value.length > 10) {
            return 'Cannot have more than 10 tags';
          }
          for (const tag of value) {
            if (typeof tag !== 'string' || tag.trim().length === 0) {
              return 'All tags must be non-empty strings';
            }
            if (tag.length > 50) {
              return 'Each tag must be less than 50 characters';
            }
          }
          return true;
        }
      }
    });
  }

  // 문제 복제 검증
  static validateCloneProblem() {
    return this.validateBody({
      targetTeacherId: {
        required: false,
        type: 'string',
        custom: (value: string) => {
          if (value) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(value)) {
              return 'Target teacher ID must be a valid UUID';
            }
          }
          return true;
        }
      },
      preserveOriginalTags: {
        required: false,
        type: 'boolean'
      }
    });
  }

  // === Private 헬퍼 메서드들 ===

  private static validateObject(
    obj: any,
    schema: ValidationSchema,
    context: string = 'object'
  ): ValidationResult {
    const errors: Array<{ field: string; message: string; value?: any }> = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = obj[field];
      const fieldPath = `${context}.${field}`;

      // 필수 필드 검증
      if (rules.required && (value === undefined || value === null)) {
        errors.push({
          field: fieldPath,
          message: `${field} is required`,
          value
        });
        continue;
      }

      // 값이 없으면 나머지 검증 스킵
      if (value === undefined || value === null) {
        continue;
      }

      // 타입 검증
      if (rules.type && !this.validateType(value, rules.type)) {
        errors.push({
          field: fieldPath,
          message: `${field} must be of type ${rules.type}`,
          value
        });
        continue;
      }

      // 최솟값 검증
      if (rules.min !== undefined) {
        if ((typeof value === 'number' && value < rules.min) ||
            (typeof value === 'string' && value.length < rules.min) ||
            (Array.isArray(value) && value.length < rules.min)) {
          errors.push({
            field: fieldPath,
            message: `${field} must be at least ${rules.min}`,
            value
          });
        }
      }

      // 최댓값 검증
      if (rules.max !== undefined) {
        if ((typeof value === 'number' && value > rules.max) ||
            (typeof value === 'string' && value.length > rules.max) ||
            (Array.isArray(value) && value.length > rules.max)) {
          errors.push({
            field: fieldPath,
            message: `${field} must be at most ${rules.max}`,
            value
          });
        }
      }

      // Enum 검증
      if (rules.enum && Array.isArray(rules.enum) && !(rules.enum as any[]).includes(value)) {
        errors.push({
          field: fieldPath,
          message: `${field} must be one of: ${rules.enum.join(', ')}`,
          value
        });
      }

      // 정규식 검증
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push({
          field: fieldPath,
          message: `${field} format is invalid`,
          value
        });
      }

      // 커스텀 검증
      if (rules.custom) {
        const customResult = rules.custom(value);
        if (typeof customResult === 'string') {
          errors.push({
            field: fieldPath,
            message: customResult,
            value
          });
        } else if (customResult === false) {
          errors.push({
            field: fieldPath,
            message: `${field} is invalid`,
            value
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  private static sendValidationErrorResponse(
    res: Response,
    errors: Array<{ field: string; message: string; value?: any }>
  ): void {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: ProblemBankErrorCode.BULK_VALIDATION_FAILED,
        message: 'Validation failed',
        details: {
          validationErrors: errors.map(err => ({
            field: err.field,
            message: err.message
          }))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: '1.0.0'
      }
    };

    res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(errorResponse);
  }
}