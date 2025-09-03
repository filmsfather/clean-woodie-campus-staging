import { Response } from 'express';
import {
  AuthenticatedRequest,
  GetAnalyticsQuery,
  ProblemAnalyticsResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  HTTP_STATUS
} from '../interfaces/ProblemApiTypes';

import { ProblemAnalyticsService } from '@woodie/application/problems/services/ProblemAnalyticsService';
import { ProblemBankError, ProblemBankErrorCode } from '@woodie/application/problems/errors/ProblemBankErrors';

import * as crypto from 'crypto';

// 문제 분석 및 통계 컨트롤러
export class AnalyticsController {
  constructor(
    private analyticsService: ProblemAnalyticsService
  ) {}

  // 종합 분석 정보 조회
  async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const query: GetAnalyticsQuery = req.query as any;

      // 요약 정보와 태그 분석을 병렬로 실행
      const [summaryResult, tagAnalyticsResult] = await Promise.all([
        this.analyticsService.getProblemBankSummary(user.teacherId),
        this.analyticsService.getTagAnalytics(user.teacherId)
      ]);

      if (summaryResult.isFailure) {
        const error = summaryResult.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      if (tagAnalyticsResult.isFailure) {
        const error = tagAnalyticsResult.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      const response: ProblemAnalyticsResponse = {
        summary: summaryResult.value,
        tagAnalytics: tagAnalyticsResult.value,
        message: 'Analytics retrieved successfully'
      };

      this.sendSuccessResponse(res, HTTP_STATUS.OK, response, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'getAnalytics');
    }
  }

  // 문제 뱅크 요약 정보
  async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      const result = await this.analyticsService.getProblemBankSummary(user.teacherId);

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        summary: result.value,
        message: 'Summary retrieved successfully'
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'getSummary');
    }
  }

  // 태그 분석 정보
  async getTagAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      const result = await this.analyticsService.getTagAnalytics(user.teacherId);

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        tagAnalytics: result.value,
        message: 'Tag analytics retrieved successfully'
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'getTagAnalytics');
    }
  }

  // 난이도 분석 정보
  async getDifficultyAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      const result = await this.analyticsService.getDifficultyAnalysis(user.teacherId);

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        difficultyAnalysis: result.value,
        message: 'Difficulty analysis retrieved successfully'
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'getDifficultyAnalysis');
    }
  }

  // 문제 유형 분포
  async getTypeDistribution(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      const result = await this.analyticsService.getTypeDistribution(user.teacherId);

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        typeDistribution: result.value,
        message: 'Type distribution retrieved successfully'
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'getTypeDistribution');
    }
  }

  // 캐시 무효화 (관리자 또는 문제 수정 후)
  async invalidateCache(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      // 관리자만 수동으로 캐시 무효화 가능
      if (user.role !== 'admin') {
        this.sendErrorResponse(res, HTTP_STATUS.FORBIDDEN, {
          code: ProblemBankErrorCode.INSUFFICIENT_PERMISSIONS,
          message: 'Only administrators can invalidate cache'
        }, requestId);
        return;
      }

      const { teacherId } = req.query;
      const targetTeacherId = (teacherId as string) || user.teacherId;

      await this.analyticsService.invalidateTeacherCache(targetTeacherId);

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        message: `Cache invalidated for teacher: ${targetTeacherId}`
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'invalidateCache');
    }
  }

  // === Private 헬퍼 메서드들 ===

  private sendSuccessResponse<T>(
    res: Response,
    statusCode: number,
    data: T,
    requestId: string
  ): void {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0.0'
      }
    };

    res.status(statusCode).json(response);
  }

  private sendErrorResponse(
    res: Response,
    statusCode: number,
    error: { code: string; message: string; details?: any },
    requestId: string
  ): void {
    const response: ApiErrorResponse = {
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0.0'
      }
    };

    res.status(statusCode).json(response);
  }

  private handleUnexpectedError(res: Response, error: Error, operation: string): void {
    console.error(`Unexpected error in ${operation}:`, error);
    
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: ProblemBankErrorCode.UNEXPECTED_ERROR,
        message: 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: '1.0.0'
      }
    };

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }
}