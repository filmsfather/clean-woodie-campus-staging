import { Response } from 'express';
import {
  AuthenticatedRequest,
  TagRecommendationRequest,
  TagRecommendationResponse,
  SimilarTagsQuery,
  SimilarTagsResponse,
  ValidateTagsRequest,
  ValidateTagsResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  HTTP_STATUS
} from '../interfaces/ProblemApiTypes';

import { TagRecommendationService } from '@woodie/application/problems/services/TagRecommendationService';
import { ProblemBankError, ProblemBankErrorCode } from '@woodie/application/problems/errors/ProblemBankErrors';

import * as crypto from 'crypto';

// 태그 관리 컨트롤러
export class TagController {
  constructor(
    private tagService: TagRecommendationService
  ) {}

  // 태그 추천
  async getRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const recommendationRequest: TagRecommendationRequest = req.body;

      // 입력 검증
      if (!recommendationRequest.title && !recommendationRequest.description) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.RECOMMENDATION_FAILED,
          message: 'Either title or description is required for tag recommendation'
        }, requestId);
        return;
      }

      const maxRecommendations = recommendationRequest.maxRecommendations || 5;
      if (maxRecommendations < 1 || maxRecommendations > 10) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.RECOMMENDATION_FAILED,
          message: 'maxRecommendations must be between 1 and 10'
        }, requestId);
        return;
      }

      const result = await this.tagService.getRecommendedTags(
        recommendationRequest.title || '',
        recommendationRequest.description || '',
        user.teacherId,
        maxRecommendations
      );

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      const response: TagRecommendationResponse = {
        recommendation: result.value,
        message: 'Tag recommendations generated successfully'
      };

      this.sendSuccessResponse(res, HTTP_STATUS.OK, response, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'getRecommendations');
    }
  }

  // 유사한 태그 찾기
  async getSimilarTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const query: SimilarTagsQuery = req.query as any;

      if (!query.inputTag || query.inputTag.trim().length === 0) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.TAG_MANAGEMENT_ERROR,
          message: 'inputTag parameter is required'
        }, requestId);
        return;
      }

      const maxSuggestions = query.maxSuggestions ? parseInt(query.maxSuggestions) : 5;
      if (isNaN(maxSuggestions) || maxSuggestions < 1 || maxSuggestions > 10) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.TAG_MANAGEMENT_ERROR,
          message: 'maxSuggestions must be a number between 1 and 10'
        }, requestId);
        return;
      }

      const result = await this.tagService.findSimilarTags(
        query.inputTag,
        user.teacherId,
        maxSuggestions
      );

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      const response: SimilarTagsResponse = {
        similarTags: result.value,
        inputTag: query.inputTag,
        message: `Found ${result.value.length} similar tags`
      };

      this.sendSuccessResponse(res, HTTP_STATUS.OK, response, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'getSimilarTags');
    }
  }

  // 태그 유효성 검증
  async validateTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const validateRequest: ValidateTagsRequest = req.body;

      if (!validateRequest.tags || !Array.isArray(validateRequest.tags)) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.TAG_MANAGEMENT_ERROR,
          message: 'tags array is required'
        }, requestId);
        return;
      }

      if (validateRequest.tags.length === 0) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.TAG_MANAGEMENT_ERROR,
          message: 'tags array cannot be empty'
        }, requestId);
        return;
      }

      if (validateRequest.tags.length > 20) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.TAG_MANAGEMENT_ERROR,
          message: 'Cannot validate more than 20 tags at once'
        }, requestId);
        return;
      }

      const result = await this.tagService.validateTagSet(
        validateRequest.tags,
        user.teacherId
      );

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      const validation = result.value;
      const response: ValidateTagsResponse = {
        validTags: validation.validTags,
        invalidTags: validation.invalidTags,
        suggestions: validation.suggestions,
        message: `Validated ${validateRequest.tags.length} tags: ${validation.validTags.length} valid, ${validation.invalidTags.length} invalid`
      };

      this.sendSuccessResponse(res, HTTP_STATUS.OK, response, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'validateTags');
    }
  }

  // 태그 사용 통계
  async getTagUsage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const { includeInactive } = req.query;

      const includeInactiveProblems = includeInactive === 'true';

      const result = await this.tagService.analyzeTagUsage(
        user.teacherId,
        includeInactiveProblems
      );

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        tagUsage: result.value,
        totalUniqueTags: result.value.length,
        includeInactive: includeInactiveProblems,
        message: 'Tag usage analysis completed successfully'
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'getTagUsage');
    }
  }

  // 태그 분포 정보
  async getTagDistribution(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const { tags } = req.query;

      const tagFilter = tags ? (tags as string).split(',').map(t => t.trim()).filter(t => t.length > 0) : undefined;

      const result = await this.tagService.getTagDistribution(
        user.teacherId,
        tagFilter
      );

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      const distribution = result.value;
      const totalProblems = distribution.reduce((sum, item) => sum + item.count, 0);

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        distribution,
        summary: {
          totalTags: distribution.length,
          totalProblems,
          averageProblemsPerTag: distribution.length > 0 ? totalProblems / distribution.length : 0
        },
        filter: tagFilter || [],
        message: 'Tag distribution retrieved successfully'
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'getTagDistribution');
    }
  }

  // 태그 자동완성 (검색)
  async searchTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const { q, limit } = req.query;

      if (!q || (q as string).trim().length === 0) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.TAG_MANAGEMENT_ERROR,
          message: 'Query parameter "q" is required'
        }, requestId);
        return;
      }

      const query = (q as string).trim();
      const maxResults = limit ? parseInt(limit as string) : 10;

      if (isNaN(maxResults) || maxResults < 1 || maxResults > 50) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.TAG_MANAGEMENT_ERROR,
          message: 'limit must be a number between 1 and 50'
        }, requestId);
        return;
      }

      // 유사 태그 검색으로 자동완성 구현
      const result = await this.tagService.findSimilarTags(
        query,
        user.teacherId,
        maxResults
      );

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        suggestions: result.value,
        query,
        count: result.value.length,
        message: `Found ${result.value.length} tag suggestions`
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'searchTags');
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