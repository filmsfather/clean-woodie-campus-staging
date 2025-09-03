import { Request, Response } from 'express';
import {
  AuthenticatedRequest,
  CreateProblemRequest,
  CreateProblemResponse,
  UpdateProblemRequest,
  UpdateProblemResponse,
  SearchProblemsQuery,
  SearchProblemsResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  HTTP_STATUS
} from '../interfaces/ProblemApiTypes';

// Application Services
import { ProblemSearchService } from '@woodie/application/problems/services/ProblemSearchService';
import { ProblemAnalyticsService } from '@woodie/application/problems/services/ProblemAnalyticsService';
import { ProblemBankManagementService } from '@woodie/application/problems/services/ProblemBankManagementService';
import { TagRecommendationService } from '@woodie/application/problems/services/TagRecommendationService';

// Domain
import { Problem } from '@woodie/domain/problems/entities/Problem';
import { ProblemContent } from '@woodie/domain/problems/value-objects/ProblemContent';
import { AnswerContent } from '@woodie/domain/problems/value-objects/AnswerContent';
import { Difficulty } from '@woodie/domain/problems/value-objects/Difficulty';
import { Tag } from '@woodie/domain/problems/value-objects/Tag';

// Infrastructure
import { IProblemRepository } from '@woodie/domain/problems/repositories/IProblemRepository';

// Errors
import { ProblemBankError, ProblemBankErrorCode } from '@woodie/application/problems/errors/ProblemBankErrors';

import * as crypto from 'crypto';

// 문제 관리 메인 컨트롤러
export class ProblemController {
  constructor(
    private problemRepository: IProblemRepository,
    private searchService: ProblemSearchService,
    private analyticsService: ProblemAnalyticsService,
    private managementService: ProblemBankManagementService,
    private tagService: TagRecommendationService
  ) {}

  // === 기본 CRUD 작업 ===

  async createProblem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const createRequest: CreateProblemRequest = req.body;

      // Domain Value Objects 생성
      const contentResult = ProblemContent.fromPrimitive({
        type: createRequest.type,
        ...createRequest.content
      });

      if (contentResult.isFailure) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.PROBLEM_CREATE_FAILED,
          message: `Invalid problem content: ${contentResult.error}`
        }, requestId);
        return;
      }

      const answerResult = AnswerContent.fromPrimitive({
        type: createRequest.type,
        ...createRequest.correctAnswer
      });

      if (answerResult.isFailure) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.PROBLEM_CREATE_FAILED,
          message: `Invalid answer content: ${answerResult.error}`
        }, requestId);
        return;
      }

      const difficultyResult = Difficulty.create(createRequest.difficulty);
      if (difficultyResult.isFailure) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.PROBLEM_CREATE_FAILED,
          message: `Invalid difficulty: ${difficultyResult.error}`
        }, requestId);
        return;
      }

      // 태그 처리
      const tags: Tag[] = [];
      if (createRequest.tags) {
        for (const tagName of createRequest.tags) {
          const tagResult = Tag.create(tagName);
          if (tagResult.isSuccess) {
            tags.push(tagResult.value);
          }
        }
      }

      // Problem Entity 생성
      const problemResult = Problem.create({
        teacherId: user.teacherId,
        content: contentResult.value,
        correctAnswer: answerResult.value,
        difficulty: difficultyResult.value,
        tags
      });

      if (problemResult.isFailure) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.PROBLEM_CREATE_FAILED,
          message: problemResult.error
        }, requestId);
        return;
      }

      const problem = problemResult.value;

      // 활성 상태 설정
      if (createRequest.isActive === false) {
        problem.deactivate();
      }

      // 저장
      const saveResult = await this.problemRepository.save(problem);
      if (saveResult.isFailure) {
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: ProblemBankErrorCode.PROBLEM_CREATE_FAILED,
          message: 'Failed to save problem'
        }, requestId);
        return;
      }

      // 응답 생성
      const response: CreateProblemResponse = {
        problem: this.mapToDetailDto(problem),
        message: 'Problem created successfully'
      };

      this.sendSuccessResponse(res, HTTP_STATUS.CREATED, response, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'createProblem');
    }
  }

  async getProblemById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const { id: problemId } = req.params;

      const result = await this.searchService.findProblemById(problemId, user.teacherId);

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, result.value, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'getProblemById');
    }
  }

  async updateProblem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const { id: problemId } = req.params;
      const updateRequest: UpdateProblemRequest = req.body;

      // 기존 문제 조회
      const existingResult = await this.problemRepository.findById({ toString: () => problemId } as any);
      if (existingResult.isFailure) {
        this.sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, {
          code: ProblemBankErrorCode.PROBLEM_NOT_FOUND,
          message: 'Problem not found'
        }, requestId);
        return;
      }

      const problem = existingResult.value;

      // 소유권 확인
      if (!problem.isOwnedBy(user.teacherId) && user.role !== 'admin') {
        this.sendErrorResponse(res, HTTP_STATUS.FORBIDDEN, {
          code: ProblemBankErrorCode.UNAUTHORIZED_ACCESS,
          message: 'Access denied'
        }, requestId);
        return;
      }

      // 내용 업데이트
      if (updateRequest.content) {
        const currentContent = problem.content.toPrimitive();
        const newContent = { ...currentContent, ...updateRequest.content };
        
        const contentResult = ProblemContent.fromPrimitive(newContent);
        if (contentResult.isFailure) {
          this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
            code: ProblemBankErrorCode.PROBLEM_UPDATE_FAILED,
            message: `Invalid content: ${contentResult.error}`
          }, requestId);
          return;
        }

        const updateContentResult = problem.updateContent(contentResult.value);
        if (updateContentResult.isFailure) {
          this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
            code: ProblemBankErrorCode.PROBLEM_UPDATE_FAILED,
            message: updateContentResult.error
          }, requestId);
          return;
        }
      }

      // 답안 업데이트
      if (updateRequest.correctAnswer) {
        const currentAnswer = problem.correctAnswer.toPrimitive();
        const newAnswer = { ...currentAnswer, ...updateRequest.correctAnswer };
        
        const answerResult = AnswerContent.fromPrimitive(newAnswer);
        if (answerResult.isFailure) {
          this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
            code: ProblemBankErrorCode.PROBLEM_UPDATE_FAILED,
            message: `Invalid answer: ${answerResult.error}`
          }, requestId);
          return;
        }

        const updateAnswerResult = problem.updateCorrectAnswer(answerResult.value);
        if (updateAnswerResult.isFailure) {
          this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
            code: ProblemBankErrorCode.PROBLEM_UPDATE_FAILED,
            message: updateAnswerResult.error
          }, requestId);
          return;
        }
      }

      // 난이도 업데이트
      if (updateRequest.difficulty) {
        const difficultyResult = Difficulty.create(updateRequest.difficulty);
        if (difficultyResult.isFailure) {
          this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
            code: ProblemBankErrorCode.PROBLEM_UPDATE_FAILED,
            message: `Invalid difficulty: ${difficultyResult.error}`
          }, requestId);
          return;
        }

        problem.changeDifficulty(difficultyResult.value);
      }

      // 태그 업데이트
      if (updateRequest.tags) {
        const tags: Tag[] = [];
        for (const tagName of updateRequest.tags) {
          const tagResult = Tag.create(tagName);
          if (tagResult.isSuccess) {
            tags.push(tagResult.value);
          }
        }

        const updateTagsResult = problem.updateTags(tags);
        if (updateTagsResult.isFailure) {
          this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
            code: ProblemBankErrorCode.PROBLEM_UPDATE_FAILED,
            message: updateTagsResult.error
          }, requestId);
          return;
        }
      }

      // 활성 상태 업데이트
      if (updateRequest.isActive !== undefined) {
        if (updateRequest.isActive) {
          problem.activate();
        } else {
          problem.deactivate();
        }
      }

      // 저장
      const saveResult = await this.problemRepository.save(problem);
      if (saveResult.isFailure) {
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: ProblemBankErrorCode.PROBLEM_UPDATE_FAILED,
          message: 'Failed to save problem'
        }, requestId);
        return;
      }

      // 응답 생성
      const response: UpdateProblemResponse = {
        problem: this.mapToDetailDto(problem),
        message: 'Problem updated successfully'
      };

      this.sendSuccessResponse(res, HTTP_STATUS.OK, response, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'updateProblem');
    }
  }

  async deleteProblem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const { id: problemId } = req.params;

      // 소유권 확인은 미들웨어에서 처리됨

      const deleteResult = await this.problemRepository.delete({ toString: () => problemId } as any);
      
      if (deleteResult.isFailure) {
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: ProblemBankErrorCode.PROBLEM_DELETE_FAILED,
          message: 'Failed to delete problem'
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.NO_CONTENT, null, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'deleteProblem');
    }
  }

  // === 검색 및 조회 ===

  async searchProblems(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const query: SearchProblemsQuery = req.query as any;

      // 쿼리 파라미터를 DTO로 변환
      const searchDto = this.mapSearchQueryToDto(query, user.teacherId);
      const paginationDto = this.mapPaginationQueryToDto(query);
      const sortDto = this.mapSortQueryToDto(query);

      const result = await this.searchService.searchProblems(searchDto, paginationDto, sortDto);

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      const response: SearchProblemsResponse = {
        ...result.value,
        query: {
          filter: searchDto,
          pagination: paginationDto,
          sort: sortDto
        }
      };

      this.sendSuccessResponse(res, HTTP_STATUS.OK, response, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'searchProblems');
    }
  }

  async getMyProblems(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      // 교사의 모든 문제 조회
      const result = await this.problemRepository.findByTeacherId(user.teacherId);

      if (result.isFailure) {
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: ProblemBankErrorCode.SEARCH_FAILED,
          message: 'Failed to retrieve problems'
        }, requestId);
        return;
      }

      const problems = result.value.map(problem => this.mapToProblemDto(problem));

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        problems,
        count: problems.length,
        message: 'Problems retrieved successfully'
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'getMyProblems');
    }
  }

  // === Private 헬퍼 메서드들 ===

  private mapToDetailDto(problem: Problem): any {
    return {
      id: problem.id.toString(),
      teacherId: problem.teacherId,
      type: problem.type.value,
      title: problem.content.title,
      difficulty: problem.difficulty.level,
      tags: problem.tags.map(tag => tag.name),
      isActive: problem.isActive,
      createdAt: problem.createdAt.toISOString(),
      updatedAt: problem.updatedAt.toISOString(),
      content: problem.content.toPrimitive(),
      correctAnswer: problem.correctAnswer.toPrimitive()
    };
  }

  private mapToProblemDto(problem: Problem): any {
    return {
      id: problem.id.toString(),
      teacherId: problem.teacherId,
      type: problem.type.value,
      title: problem.content.title,
      difficulty: problem.difficulty.level,
      tags: problem.tags.map(tag => tag.name),
      isActive: problem.isActive,
      createdAt: problem.createdAt.toISOString(),
      updatedAt: problem.updatedAt.toISOString()
    };
  }

  private mapSearchQueryToDto(query: SearchProblemsQuery, teacherId: string): any {
    return {
      teacherId,
      types: query.types?.split(',').map(t => t.trim()),
      difficulties: query.difficulties?.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d)),
      tags: query.tags?.split(',').map(t => t.trim()),
      isActive: query.isActive ? query.isActive === 'true' : undefined,
      searchQuery: query.searchQuery,
      createdAfter: query.createdAfter,
      createdBefore: query.createdBefore
    };
  }

  private mapPaginationQueryToDto(query: SearchProblemsQuery): any {
    if (!query.limit) return undefined;

    return {
      limit: parseInt(query.limit),
      page: query.page ? parseInt(query.page) : undefined,
      strategy: query.strategy || 'offset',
      cursor: query.cursor ? {
        field: query.cursorField || 'id',
        value: query.cursor,
        direction: query.cursorDirection || 'after'
      } : undefined
    };
  }

  private mapSortQueryToDto(query: SearchProblemsQuery): any {
    if (!query.sortField) return undefined;

    return {
      field: query.sortField,
      direction: query.sortDirection || 'DESC'
    };
  }

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