import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'

/**
 * 요청 유효성 검증 미들웨어
 * express-validator로 검증한 결과를 확인하고 에러가 있으면 422 응답 반환
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      error: {
        message: 'Validation failed',
        type: 'ValidationError',
        details: errors.array().map(error => ({
          field: error.type === 'field' ? (error as any).path : error.type,
          message: error.msg,
          value: error.type === 'field' ? (error as any).value : undefined
        }))
      },
      timestamp: new Date().toISOString()
    })
    return
  }
  
  next()
}