import { Request, Response, NextFunction } from 'express'
import * as crypto from 'crypto'

// 유효성 검증 결과
interface ValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    value?: any
  }>
}

// 검증 규칙 스키마
interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
  min?: number
  max?: number
  enum?: any[]
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

interface ValidationSchema {
  [field: string]: ValidationRule
}

/**
 * 문제집 API를 위한 유효성 검증 미들웨어
 * 요청 데이터의 유효성을 검증하고 오류 시 적절한 응답을 반환
 */
export class ProblemSetValidationMiddleware {

  // === 기본 검증 메서드들 ===

  // 요청 본문 검증
  static validateBody(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const result = this.validateObject(req.body, schema, 'body')
      
      if (!result.isValid) {
        this.sendValidationErrorResponse(res, result.errors)
        return
      }
      
      next()
    }
  }

  // 쿼리 파라미터 검증
  static validateQuery(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const result = this.validateObject(req.query, schema, 'query')
      
      if (!result.isValid) {
        this.sendValidationErrorResponse(res, result.errors)
        return
      }
      
      next()
    }
  }

  // URL 파라미터 검증
  static validateParams(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const result = this.validateObject(req.params, schema, 'params')
      
      if (!result.isValid) {
        this.sendValidationErrorResponse(res, result.errors)
        return
      }
      
      next()
    }
  }

  // === 문제집 관련 검증 메서드들 ===

  // 문제집 생성 요청 검증
  static validateCreateProblemSet() {
    return this.validateBody({
      title: {
        required: true,
        type: 'string',
        min: 1,
        max: 255,
        custom: (value: string) => {
          if (!value || value.trim().length === 0) {
            return '문제집 제목은 필수입니다'
          }
          return true
        }
      },
      description: {
        required: false,
        type: 'string',
        max: 1000
      },
      isPublic: {
        required: false,
        type: 'boolean'
      },
      isShared: {
        required: false,
        type: 'boolean'
      },
      initialProblems: {
        required: false,
        type: 'array',
        max: 50,
        custom: (value: any) => {
          if (value && Array.isArray(value)) {
            // 초기 문제 목록 유효성 검증
            const orderIndices = value.map((p: any) => p.orderIndex)
            const uniqueIndices = new Set(orderIndices)
            
            if (uniqueIndices.size !== orderIndices.length) {
              return '문제 순서 인덱스는 중복될 수 없습니다'
            }

            for (const problem of value) {
              if (!problem.problemId || typeof problem.problemId !== 'string') {
                return '모든 초기 문제에는 유효한 problemId가 필요합니다'
              }
              
              if (typeof problem.orderIndex !== 'number' || problem.orderIndex < 0) {
                return '순서 인덱스는 0 이상의 숫자여야 합니다'
              }

              if (problem.points !== undefined && (typeof problem.points !== 'number' || problem.points < 1 || problem.points > 100)) {
                return '점수는 1-100 사이의 숫자여야 합니다'
              }
            }
          }
          return true
        }
      }
    })
  }

  // 문제집 수정 요청 검증
  static validateUpdateProblemSet() {
    return this.validateBody({
      title: {
        required: false,
        type: 'string',
        min: 1,
        max: 255,
        custom: (value: string) => {
          if (value !== undefined && (!value || value.trim().length === 0)) {
            return '문제집 제목이 제공된 경우 비어있을 수 없습니다'
          }
          return true
        }
      },
      description: {
        required: false,
        type: 'string',
        max: 1000
      },
      isPublic: {
        required: false,
        type: 'boolean'
      },
      isShared: {
        required: false,
        type: 'boolean'
      }
    })
  }

  // 문제집 삭제 요청 검증
  static validateDeleteProblemSet() {
    return this.validateQuery({
      force: {
        required: false,
        type: 'string',
        enum: ['true', 'false']
      }
    })
  }

  // 문제집 목록 조회 요청 검증
  static validateGetProblemSetList() {
    return this.validateQuery({
      page: {
        required: false,
        type: 'string',
        custom: (value: string) => {
          if (value) {
            const pageNum = parseInt(value)
            if (isNaN(pageNum) || pageNum < 1) {
              return '페이지 번호는 1 이상의 정수여야 합니다'
            }
            if (pageNum > 1000) {
              return '페이지 번호가 너무 큽니다 (최대: 1000)'
            }
          }
          return true
        }
      },
      limit: {
        required: false,
        type: 'string',
        custom: (value: string) => {
          if (value) {
            const limitNum = parseInt(value)
            if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
              return '페이지 크기는 1-100 사이여야 합니다'
            }
          }
          return true
        }
      },
      teacherId: {
        required: false,
        type: 'string',
        custom: (value: string) => {
          if (value && !this.isValidUUID(value)) {
            return '교사 ID는 유효한 UUID 형식이어야 합니다'
          }
          return true
        }
      },
      isPublic: {
        required: false,
        type: 'string',
        enum: ['true', 'false']
      },
      isShared: {
        required: false,
        type: 'string',
        enum: ['true', 'false']
      },
      search: {
        required: false,
        type: 'string',
        max: 200
      },
      sortBy: {
        required: false,
        type: 'string',
        enum: ['title', 'createdAt', 'updatedAt', 'itemCount']
      },
      sortOrder: {
        required: false,
        type: 'string',
        enum: ['ASC', 'DESC', 'asc', 'desc']
      },
      includeItems: {
        required: false,
        type: 'string',
        enum: ['true', 'false']
      }
    })
  }

  // 문제집에 문제 추가 요청 검증
  static validateAddProblemToProblemSet() {
    return this.validateBody({
      problemId: {
        required: true,
        type: 'string',
        custom: (value: string) => {
          if (!value || value.trim().length === 0) {
            return '문제 ID는 필수입니다'
          }
          if (!this.isValidUUID(value)) {
            return '문제 ID는 유효한 UUID 형식이어야 합니다'
          }
          return true
        }
      },
      orderIndex: {
        required: false,
        type: 'number',
        min: 0,
        max: 1000
      },
      points: {
        required: false,
        type: 'number',
        min: 1,
        max: 100
      }
    })
  }

  // 문제집 내 문제 순서 재정렬 요청 검증
  static validateReorderProblemSetItems() {
    return this.validateBody({
      orderedProblemIds: {
        required: true,
        type: 'array',
        min: 1,
        max: 50,
        custom: (value: any) => {
          if (!Array.isArray(value)) {
            return '정렬된 문제 ID 목록은 배열이어야 합니다'
          }

          if (value.length === 0) {
            return '정렬된 문제 ID 목록이 비어있을 수 없습니다'
          }

          // 중복 확인
          const uniqueIds = new Set(value)
          if (uniqueIds.size !== value.length) {
            return '문제 ID 목록에 중복이 있습니다'
          }

          // 각 ID 형식 검증
          for (const id of value) {
            if (typeof id !== 'string' || !id.trim()) {
              return '모든 문제 ID는 비어있지 않은 문자열이어야 합니다'
            }
            if (!this.isValidUUID(id)) {
              return '모든 문제 ID는 유효한 UUID 형식이어야 합니다'
            }
          }

          return true
        }
      }
    })
  }

  // === URL 파라미터 검증 메서드들 ===

  // 문제집 ID 검증
  static validateProblemSetId() {
    return this.validateParams({
      id: {
        required: true,
        type: 'string',
        custom: (value: string) => {
          if (!value || value.trim().length === 0) {
            return '문제집 ID는 필수입니다'
          }
          if (!this.isValidUUID(value)) {
            return '문제집 ID는 유효한 UUID 형식이어야 합니다'
          }
          return true
        }
      }
    })
  }

  // 문제 ID 검증 (문제집에서 문제 제거 시 사용)
  static validateProblemId() {
    return this.validateParams({
      problemId: {
        required: true,
        type: 'string',
        custom: (value: string) => {
          if (!value || value.trim().length === 0) {
            return '문제 ID는 필수입니다'
          }
          if (!this.isValidUUID(value)) {
            return '문제 ID는 유효한 UUID 형식이어야 합니다'
          }
          return true
        }
      }
    })
  }

  // === Private 헬퍼 메서드들 ===

  private static validateObject(
    obj: any,
    schema: ValidationSchema,
    context: string = 'object'
  ): ValidationResult {
    const errors: Array<{ field: string; message: string; value?: any }> = []

    for (const [field, rules] of Object.entries(schema)) {
      const value = obj[field]
      const fieldPath = `${context}.${field}`

      // 필수 필드 검증
      if (rules.required && (value === undefined || value === null)) {
        errors.push({
          field: fieldPath,
          message: `${field}은(는) 필수 항목입니다`,
          value
        })
        continue
      }

      // 값이 없으면 나머지 검증 스킵
      if (value === undefined || value === null) {
        continue
      }

      // 타입 검증
      if (rules.type && !this.validateType(value, rules.type)) {
        errors.push({
          field: fieldPath,
          message: `${field}은(는) ${rules.type} 타입이어야 합니다`,
          value
        })
        continue
      }

      // 최솟값 검증
      if (rules.min !== undefined) {
        if ((typeof value === 'number' && value < rules.min) ||
            (typeof value === 'string' && value.length < rules.min) ||
            (Array.isArray(value) && value.length < rules.min)) {
          errors.push({
            field: fieldPath,
            message: `${field}은(는) 최소 ${rules.min}이어야 합니다`,
            value
          })
        }
      }

      // 최댓값 검증
      if (rules.max !== undefined) {
        if ((typeof value === 'number' && value > rules.max) ||
            (typeof value === 'string' && value.length > rules.max) ||
            (Array.isArray(value) && value.length > rules.max)) {
          errors.push({
            field: fieldPath,
            message: `${field}은(는) 최대 ${rules.max}이어야 합니다`,
            value
          })
        }
      }

      // Enum 검증
      if (rules.enum && Array.isArray(rules.enum) && !(rules.enum as any[]).includes(value)) {
        errors.push({
          field: fieldPath,
          message: `${field}은(는) 다음 중 하나여야 합니다: ${rules.enum.join(', ')}`,
          value
        })
      }

      // 정규식 검증
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push({
          field: fieldPath,
          message: `${field}의 형식이 올바르지 않습니다`,
          value
        })
      }

      // 커스텀 검증
      if (rules.custom) {
        const customResult = rules.custom(value)
        if (typeof customResult === 'string') {
          errors.push({
            field: fieldPath,
            message: customResult,
            value
          })
        } else if (customResult === false) {
          errors.push({
            field: fieldPath,
            message: `${field}이(가) 올바르지 않습니다`,
            value
          })
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private static validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number' && !isNaN(value)
      case 'boolean':
        return typeof value === 'boolean'
      case 'array':
        return Array.isArray(value)
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value)
      default:
        return true
    }
  }

  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  private static sendValidationErrorResponse(
    res: Response,
    errors: Array<{ field: string; message: string; value?: any }>
  ): void {
    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: '요청 데이터 검증에 실패했습니다',
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
    }

    res.status(422).json(errorResponse)
  }
}