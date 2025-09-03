import { Request, Response } from 'express'

/**
 * 기본 컨트롤러 클래스
 * 공통 응답 메서드들을 제공하여 일관된 API 응답 형식 유지
 */
export abstract class BaseController {
  
  /**
   * 성공 응답 (200 OK)
   */
  protected ok<T>(res: Response, data?: T): void {
    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 생성 성공 응답 (201 Created)
   */
  protected created<T>(res: Response, data?: T): void {
    res.status(201).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 클라이언트 에러 응답 (400 Bad Request)
   */
  protected clientError(res: Response, message: string = 'Bad Request'): void {
    res.status(400).json({
      success: false,
      error: {
        message,
        type: 'ClientError'
      },
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 인증 에러 응답 (401 Unauthorized)
   */
  protected unauthorized(res: Response, message: string = 'Unauthorized'): void {
    res.status(401).json({
      success: false,
      error: {
        message,
        type: 'Unauthorized'
      },
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 권한 에러 응답 (403 Forbidden)
   */
  protected forbidden(res: Response, message: string = 'Forbidden'): void {
    res.status(403).json({
      success: false,
      error: {
        message,
        type: 'Forbidden'
      },
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 리소스 없음 응답 (404 Not Found)
   */
  protected notFound(res: Response, message: string = 'Not Found'): void {
    res.status(404).json({
      success: false,
      error: {
        message,
        type: 'NotFound'
      },
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 서버 에러 응답 (500 Internal Server Error)
   */
  protected fail(res: Response, message: string = 'Internal Server Error'): void {
    res.status(500).json({
      success: false,
      error: {
        message,
        type: 'InternalServerError'
      },
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 유효성 검증 에러 응답 (422 Unprocessable Entity)
   */
  protected unprocessable(res: Response, errors: any[]): void {
    res.status(422).json({
      success: false,
      error: {
        message: 'Validation failed',
        type: 'ValidationError',
        details: errors
      },
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 너무 많은 요청 에러 응답 (429 Too Many Requests)
   */
  protected tooManyRequests(res: Response, message: string = 'Too Many Requests'): void {
    res.status(429).json({
      success: false,
      error: {
        message,
        type: 'TooManyRequests'
      },
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 페이지네이션된 응답 (200 OK)
   */
  protected paginated<T>(
    res: Response, 
    data: T[], 
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  ): void {
    res.status(200).json({
      success: true,
      data,
      pagination,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 커스텀 상태 코드 응답
   */
  protected custom<T>(
    res: Response, 
    statusCode: number, 
    success: boolean, 
    data?: T, 
    error?: { message: string; type: string }
  ): void {
    res.status(statusCode).json({
      success,
      data: success ? data : undefined,
      error: !success ? error : undefined,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 요청에서 페이지네이션 파라미터 추출
   */
  protected getPaginationParams(req: Request): { page: number; limit: number; offset: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
    const offset = (page - 1) * limit

    return { page, limit, offset }
  }

  /**
   * 요청에서 정렬 파라미터 추출
   */
  protected getSortParams(req: Request, allowedFields: string[] = []): { 
    sortBy?: string; 
    sortOrder: 'ASC' | 'DESC' 
  } {
    const sortBy = req.query.sortBy as string
    const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

    // 허용된 필드인지 검증
    if (sortBy && allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
      return { sortOrder }
    }

    return { sortBy, sortOrder }
  }

  /**
   * 요청에서 필터 파라미터 추출
   */
  protected getFilterParams(req: Request, allowedFilters: string[] = []): Record<string, any> {
    const filters: Record<string, any> = {}

    for (const [key, value] of Object.entries(req.query)) {
      if (allowedFilters.includes(key) && value !== undefined && value !== '') {
        filters[key] = value
      }
    }

    return filters
  }
}