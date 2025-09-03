import { Response } from 'express';
import {
  AuthenticatedRequest,
  TagRecommendationRequest,
  TagRecommendationResponse,
  SimilarTagsQuery,
  SimilarTagsResponse,
  ValidateTagsRequest,
  ValidateTagsResponse,
  HTTP_STATUS
} from '../interfaces/ProblemApiTypes';

import { BaseController } from '../../common/controllers/BaseController';
import { TagRecommendationService } from '@woodie/application/problems/services/TagRecommendationService';

import * as crypto from 'crypto';

/**
 * 태그 관리 컨트롤러
 * DDD 원칙에 따라 BaseController를 상속받아 공통 기능 활용
 */
export class TagController extends BaseController {
  constructor(
    private tagService: TagRecommendationService
  ) {
    super();
  }

  // 태그 추천
  async getRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const recommendationRequest: TagRecommendationRequest = req.body;

      // 입력 검증
      if (!recommendationRequest.title && !recommendationRequest.description) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: 'RECOMMENDATION_FAILED',
          message: 'Either title or description is required for tag recommendation'
        }, requestId);
        return;
      }

      const maxRecommendations = recommendationRequest.maxRecommendations || 5;
      if (maxRecommendations < 1 || maxRecommendations > 10) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: 'RECOMMENDATION_FAILED',
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
        const error = result.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'RECOMMENDATION_FAILED',
          message: typeof error === 'string' ? error : 'Failed to get tag recommendations'
        }, requestId);
        return;
      }

      const response: TagRecommendationResponse = {
        recommendation: result.value,
        message: 'Tag recommendations generated successfully'
      };

      this.sendSuccessResponse(res, HTTP_STATUS.OK, response, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // 유사한 태그 조회
  async getSimilarTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const query: SimilarTagsQuery = req.query as any;

      if (!query.inputTag) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: 'INVALID_TAG_QUERY',
          message: 'Tag parameter is required'
        }, requestId);
        return;
      }

      const maxResults = Math.min(parseInt(query.maxSuggestions as string) || 5, 10);

      const result = await this.tagService.findSimilarTags(query.inputTag, user.teacherId, maxResults);

      if (result.isFailure) {
        const error = result.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'SIMILAR_TAGS_ERROR',
          message: typeof error === 'string' ? error : 'Failed to find similar tags'
        }, requestId);
        return;
      }

      const response: SimilarTagsResponse = {
        inputTag: query.inputTag,
        similarTags: result.value,
        message: 'Similar tags retrieved successfully'
      };

      this.sendSuccessResponse(res, HTTP_STATUS.OK, response, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // 태그 유효성 검증
  async validateTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const validationRequest: ValidateTagsRequest = req.body;

      if (!Array.isArray(validationRequest.tags) || validationRequest.tags.length === 0) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: 'INVALID_TAGS',
          message: 'Tags array is required and must not be empty'
        }, requestId);
        return;
      }

      const result = await this.tagService.validateTagSet(validationRequest.tags, user.teacherId);

      if (result.isFailure) {
        const error = result.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'TAG_VALIDATION_ERROR',
          message: typeof error === 'string' ? error : 'Failed to validate tags'
        }, requestId);
        return;
      }

      const response: ValidateTagsResponse = {
        validTags: result.value.validTags || [],
        invalidTags: result.value.invalidTags || [],
        suggestions: result.value.suggestions || [],
        message: 'Tag validation completed'
      };

      this.sendSuccessResponse(res, HTTP_STATUS.OK, response, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // 태그 사용 통계 - 라우트에서 호출되는 메소드
  async getTagUsage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      // 실제 TagRecommendationService에서 지원하는 메소드 사용
      const result = await this.tagService.analyzeTagUsage(user.teacherId);

      if (result.isFailure) {
        const error = result.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'TAG_USAGE_ERROR',
          message: typeof error === 'string' ? error : 'Failed to get tag usage'
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        tagUsage: result.value,
        message: 'Tag usage retrieved successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // 태그 분포 - 라우트에서 호출되는 메소드
  async getTagDistribution(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      // 실제 TagRecommendationService에서 지원하는 메소드 사용
      const result = await this.tagService.getTagDistribution(user.teacherId);

      if (result.isFailure) {
        const error = result.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'TAG_DISTRIBUTION_ERROR',
          message: typeof error === 'string' ? error : 'Failed to get tag distribution'
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        tagDistribution: result.value,
        message: 'Tag distribution retrieved successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // 태그 검색 - 라우트에서 호출되는 메소드
  async searchTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const { query } = req.query as { query?: string };
      
      if (!query || query.length < 2) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: 'INVALID_SEARCH_QUERY',
          message: 'Search query must be at least 2 characters long'
        }, requestId);
        return;
      }

      // findSimilarTags를 사용하여 검색 기능 구현
      const result = await this.tagService.findSimilarTags(query, user.teacherId, 20);

      if (result.isFailure) {
        const error = result.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'TAG_SEARCH_ERROR',
          message: typeof error === 'string' ? error : 'Failed to search tags'
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        tags: result.value,
        query: query,
        message: 'Tag search completed successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }
}