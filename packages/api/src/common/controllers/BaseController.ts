import { Response } from 'express';
import { HTTP_STATUS } from '../../problems/interfaces/ProblemApiTypes';
import * as crypto from 'crypto';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

/**
 * 모든 컨트롤러가 상속받을 기본 컨트롤러 클래스
 * DDD 원칙에 따라 응답 포맷을 표준화하고 에러 처리를 중앙화
 */
export abstract class BaseController {
  
  protected sendSuccessResponse<T>(
    res: Response,
    statusCode: number = HTTP_STATUS.OK,
    data: T,
    requestId?: string
  ): void {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestId || crypto.randomUUID(),
        version: '1.0.0'
      }
    };

    res.status(statusCode).json(response);
  }

  protected sendErrorResponse(
    res: Response,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    error: { code: string; message: string; details?: any },
    requestId?: string
  ): void {
    const response: ApiErrorResponse = {
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestId || crypto.randomUUID(),
        version: '1.0.0'
      }
    };

    res.status(statusCode).json(response);
  }

  protected handleError(res: Response, error: any, requestId?: string): void {
    console.error('Controller Error:', error);

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An internal server error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestId || crypto.randomUUID(),
        version: '1.0.0'
      }
    };

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }

  protected validateUser(user: any): user is { id: string; teacherId: string; role: string; email: string } {
    return user && user.id && user.teacherId;
  }

  protected requireAuthentication(
    res: Response,
    user: any,
    requestId?: string
  ): user is { id: string; teacherId: string; role: string; email: string } {
    if (!this.validateUser(user)) {
      this.sendErrorResponse(res, HTTP_STATUS.UNAUTHORIZED, {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, requestId);
      return false;
    }
    return true;
  }
}