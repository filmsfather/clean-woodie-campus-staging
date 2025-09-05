import { Request, Response } from 'express';
import {
  AuthenticatedRequest,
  GetAnalyticsQuery,
  ProblemAnalyticsResponse,
  HTTP_STATUS
} from '../interfaces/ProblemApiTypes';

import { BaseController } from '../../common/controllers/BaseController';
import { ProblemAnalyticsService } from '@woodie/application/problems/services/ProblemAnalyticsService';

import * as crypto from 'crypto';

/**
 * 문제 분석 및 통계 컨트롤러
 * DDD 원칙에 따라 BaseController를 상속받아 공통 기능 활용
 */
export class AnalyticsController extends BaseController {
  constructor(
    private analyticsService: ProblemAnalyticsService
  ) {
    super();
  }

  // 종합 분석 정보 조회
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const query: GetAnalyticsQuery = req.query as any;

      // 사용자 인증 확인
      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      // 요약 정보와 태그 분석을 병렬로 실행
      const [summaryResult, tagAnalyticsResult] = await Promise.all([
        this.analyticsService.getProblemBankSummary(user.teacherId),
        this.analyticsService.getTagAnalytics(user.teacherId)
      ]);

      if (summaryResult.isFailure) {
        const error = summaryResult.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'ANALYTICS_ERROR',
          message: typeof error === 'string' ? error : 'Failed to get summary'
        }, requestId);
        return;
      }

      if (tagAnalyticsResult.isFailure) {
        const error = tagAnalyticsResult.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'ANALYTICS_ERROR',
          message: typeof error === 'string' ? error : 'Failed to get tag analytics'
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
      this.handleError(res, error, req.requestContext?.requestId || crypto.randomUUID());
    }
  }

  // 문제 뱅크 요약 정보
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const result = await this.analyticsService.getProblemBankSummary(user.teacherId);

      if (result.isFailure) {
        const error = result.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'ANALYTICS_ERROR',
          message: typeof error === 'string' ? error : 'Failed to get summary'
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        summary: result.value,
        message: 'Summary retrieved successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // 태그 분석 정보
  async getTagAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const result = await this.analyticsService.getTagAnalytics(user.teacherId);

      if (result.isFailure) {
        const error = result.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'ANALYTICS_ERROR',
          message: typeof error === 'string' ? error : 'Failed to get tag analytics'
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        tagAnalytics: result.value
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // 난이도별 분석 정보
  async getDifficultyAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const result = await this.analyticsService.getDifficultyAnalysis(user.teacherId);

      if (result.isFailure) {
        const error = result.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'ANALYTICS_ERROR',
          message: typeof error === 'string' ? error : 'Failed to get difficulty analysis'
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        difficultyAnalysis: result.value
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // 캐시 무효화 (관리자 전용)
  async invalidateCache(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      // 관리자만 수동으로 캐시 무효화 가능
      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      if (user.role !== 'admin') {
        this.sendErrorResponse(res, HTTP_STATUS.FORBIDDEN, {
          code: 'INSUFFICIENT_PERMISSIONS',
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
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }
}