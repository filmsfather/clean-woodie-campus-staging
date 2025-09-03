import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // 서버에서는 service role key 사용

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * JWT 토큰 기반 인증 미들웨어
 * Authorization 헤더에서 Bearer 토큰을 추출하여 검증
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authorization token required',
          type: 'Unauthorized'
        },
        timestamp: new Date().toISOString()
      })
      return
    }

    const token = authHeader.substring(7) // 'Bearer ' 제거

    // Supabase JWT 토큰 검증
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired token',
          type: 'Unauthorized'
        },
        timestamp: new Date().toISOString()
      })
      return
    }

    // 요청 객체에 사용자 정보 추가
    (req as any).user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'user'
    }

    // 추가 보안 헤더 설정
    res.setHeader('X-Authenticated', 'true')
    res.setHeader('X-User-ID', user.id)

    next()

  } catch (error) {
    console.error('Auth middleware error:', error)
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication service error',
        type: 'InternalServerError'
      },
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * 역할 기반 권한 검사 미들웨어 팩토리
 * @param allowedRoles 허용된 역할 목록
 * @returns Express 미들웨어 함수
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          type: 'Unauthorized'
        },
        timestamp: new Date().toISOString()
      })
      return
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          type: 'Forbidden'
        },
        timestamp: new Date().toISOString()
      })
      return
    }

    next()
  }
}

/**
 * 선택적 인증 미들웨어 (토큰이 있으면 검증, 없어도 통과)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 토큰이 없어도 계속 진행
      next()
      return
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (!error && user) {
      // 유효한 토큰이면 사용자 정보 추가
      (req as any).user = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'user'
      }
    }

    next()

  } catch (error) {
    console.error('Optional auth middleware error:', error)
    // 에러가 발생해도 계속 진행
    next()
  }
}