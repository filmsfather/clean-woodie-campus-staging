import { Request, Response } from 'express';
import { AuthenticatedRequest, HTTP_STATUS } from '../interfaces/ProblemApiTypes';
import { BaseController } from '../../common/controllers/BaseController';
import * as crypto from 'crypto';

// Use Case Interfaces (Input Ports)
import {
  ICreateProblemUseCase,
  IGetProblemUseCase,
  IGetProblemListUseCase,
  IUpdateProblemContentUseCase,
  IUpdateProblemAnswerUseCase,
  IChangeProblemDifficultyUseCase,
  IManageProblemTagsUseCase,
  IActivateProblemUseCase,
  IDeactivateProblemUseCase,
  IDeleteProblemUseCase,
  ISearchProblemsUseCase,
  ICloneProblemUseCase,
  CreateProblemInput,
  GetProblemInput,
  UpdateProblemContentInput,
  UpdateProblemAnswerInput,
  ChangeProblemDifficultyInput,
  ManageProblemTagsInput,
  ActivateProblemInput,
  DeactivateProblemInput,
  DeleteProblemInput,
  SearchProblemsInput,
  CloneProblemInput,
  GetProblemListInput
} from '@woodie/application/problems/interfaces/IProblemUseCases';


// 문제 유스케이스들을 위한 컨트롤러 (Clean Architecture - Interface Adapter Layer)
export class ProblemUseCaseController extends BaseController {
  constructor(
    // 의존성 역전: 구체 클래스가 아닌 인터페이스에 의존
    private createProblemUseCase: ICreateProblemUseCase,
    private getProblemUseCase: IGetProblemUseCase,
    private getProblemListUseCase: IGetProblemListUseCase,
    private updateProblemContentUseCase: IUpdateProblemContentUseCase,
    private updateProblemAnswerUseCase: IUpdateProblemAnswerUseCase,
    private changeProblemDifficultyUseCase: IChangeProblemDifficultyUseCase,
    private manageProblemTagsUseCase: IManageProblemTagsUseCase,
    private activateProblemUseCase: IActivateProblemUseCase,
    private deactivateProblemUseCase: IDeactivateProblemUseCase,
    private deleteProblemUseCase: IDeleteProblemUseCase,
    private searchProblemsUseCase: ISearchProblemsUseCase,
    private cloneProblemUseCase: ICloneProblemUseCase
  ) {
    super();
  }

  // === CRUD 작업 ===

  async createProblem(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      
      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }
      
      const createRequest: CreateProblemInput = {
        teacherId: user.teacherId,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        correctAnswerValue: req.body.correctAnswerValue,
        difficultyLevel: req.body.difficultyLevel,
        tags: req.body.tags
      };

      const result = await this.createProblemUseCase.execute(createRequest);
      
      if (result.isFailure) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: 'PROBLEM_CREATE_FAILED',
          message: result.errorValue
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.CREATED, {
        problem: result.value.problem,
        message: 'Problem created successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  async getProblem(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      
      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }
      
      const { id: problemId } = req.params;
      
      const getRequest: GetProblemInput = {
        problemId,
        requesterId: user.teacherId
      };

      const result = await this.getProblemUseCase.execute(getRequest);
      
      if (result.isFailure) {
        const statusCode = result.errorValue.includes('not found') ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
        this.sendErrorResponse(res, statusCode, {
          code: 'PROBLEM_NOT_FOUND',
          message: result.errorValue
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, result.value, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  async getProblemList(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      
      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const listRequest: GetProblemListInput = {
        teacherId: user.teacherId,
        includeInactive: req.query.includeInactive === 'true',
        tags: req.query.tags ? String(req.query.tags).split(',') : undefined,
        difficultyRange: req.query.minDifficulty && req.query.maxDifficulty ? {
          min: parseInt(String(req.query.minDifficulty)),
          max: parseInt(String(req.query.maxDifficulty))
        } : undefined,
        page: req.query.page ? parseInt(String(req.query.page)) : undefined,
        limit: req.query.limit ? parseInt(String(req.query.limit)) : undefined
      };

      const result = await this.getProblemListUseCase.execute(listRequest);
      
      if (result.isFailure) {
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'PROBLEM_LIST_FAILED',
          message: result.errorValue
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, result.value, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // === 문제 내용 업데이트 ===

  async updateProblemContent(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      
      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }
      
      const { id: problemId } = req.params;
      
      const updateRequest: UpdateProblemContentInput = {
        problemId,
        teacherId: user.teacherId,
        title: req.body.title,
        description: req.body.description
      };

      const result = await this.updateProblemContentUseCase.execute(updateRequest);
      
      if (result.isFailure) {
        const statusCode = result.errorValue.includes('not found') ? HTTP_STATUS.NOT_FOUND :
                          result.errorValue.includes('denied') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
        this.sendErrorResponse(res, statusCode, {
          code: 'PROBLEM_UPDATE_FAILED',
          message: result.errorValue
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        problem: result.value,
        message: 'Problem content updated successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  async updateProblemAnswer(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      
      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }
      
      const { id: problemId } = req.params;
      
      const updateRequest: UpdateProblemAnswerInput = {
        problemId,
        teacherId: user.teacherId,
        correctAnswerValue: req.body.correctAnswerValue
      };

      const result = await this.updateProblemAnswerUseCase.execute(updateRequest);
      
      if (result.isFailure) {
        const statusCode = result.errorValue.includes('not found') ? HTTP_STATUS.NOT_FOUND :
                          result.errorValue.includes('denied') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
        this.sendErrorResponse(res, statusCode, {
          code: 'PROBLEM_UPDATE_FAILED',
          message: result.errorValue
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        problem: result.value,
        message: 'Problem answer updated successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  async changeProblemDifficulty(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      
      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }
      
      const { id: problemId } = req.params;
      
      const changeRequest: ChangeProblemDifficultyInput = {
        problemId,
        teacherId: user.teacherId,
        difficultyLevel: req.body.difficultyLevel
      };

      const result = await this.changeProblemDifficultyUseCase.execute(changeRequest);
      
      if (result.isFailure) {
        const statusCode = result.errorValue.includes('not found') ? HTTP_STATUS.NOT_FOUND :
                          result.errorValue.includes('denied') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
        this.sendErrorResponse(res, statusCode, {
          code: 'PROBLEM_UPDATE_FAILED',
          message: result.errorValue
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        problem: result.value,
        message: 'Problem difficulty updated successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  async manageProblemTags(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      
      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }
      
      const { id: problemId } = req.params;
      
      const manageRequest: ManageProblemTagsInput = {
        problemId,
        teacherId: user.teacherId,
        operation: req.body.operation || 'update',
        tagNames: req.body.tags || []
      };

      const result = await this.manageProblemTagsUseCase.execute(manageRequest);
      
      if (result.isFailure) {
        const statusCode = result.errorValue.includes('not found') ? HTTP_STATUS.NOT_FOUND :
                          result.errorValue.includes('denied') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
        this.sendErrorResponse(res, statusCode, {
          code: 'PROBLEM_UPDATE_FAILED',
          message: result.errorValue
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        problem: result.value,
        message: 'Problem tags updated successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // === 활성화/비활성화 ===

  async activateProblem(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      
      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }
      
      const { id: problemId } = req.params;
      
      const activateRequest: ActivateProblemInput = {
        problemId,
        teacherId: user.teacherId
      };

      const result = await this.activateProblemUseCase.execute(activateRequest);
      
      if (result.isFailure) {
        const statusCode = result.errorValue.includes('not found') ? HTTP_STATUS.NOT_FOUND :
                          result.errorValue.includes('denied') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
        this.sendErrorResponse(res, statusCode, {
          code: 'PROBLEM_ACTIVATION_FAILED',
          message: result.errorValue
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        problem: result.value,
        message: 'Problem activated successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  async deactivateProblem(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      
      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }
      
      const { id: problemId } = req.params;
      
      const deactivateRequest: DeactivateProblemInput = {
        problemId,
        teacherId: user.teacherId
      };

      const result = await this.deactivateProblemUseCase.execute(deactivateRequest);
      
      if (result.isFailure) {
        const statusCode = result.errorValue.includes('not found') ? HTTP_STATUS.NOT_FOUND :
                          result.errorValue.includes('denied') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
        this.sendErrorResponse(res, statusCode, {
          code: 'PROBLEM_DEACTIVATION_FAILED',
          message: result.errorValue
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        problem: result.value,
        message: 'Problem deactivated successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // === 삭제 ===

  async deleteProblem(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      
      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }
      
      const { id: problemId } = req.params;
      
      const deleteRequest: DeleteProblemInput = {
        problemId,
        teacherId: user.teacherId
      };

      const result = await this.deleteProblemUseCase.execute(deleteRequest);
      
      if (result.isFailure) {
        const statusCode = result.errorValue.includes('not found') ? HTTP_STATUS.NOT_FOUND :
                          result.errorValue.includes('denied') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
        this.sendErrorResponse(res, statusCode, {
          code: 'PROBLEM_DELETE_FAILED',
          message: result.errorValue
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.NO_CONTENT, null, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // === 검색 ===

  async searchProblems(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      
      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const searchRequest: SearchProblemsInput = {
        searchTerm: req.query.searchTerm ? String(req.query.searchTerm) : undefined,
        tags: req.query.tags ? String(req.query.tags).split(',') : undefined,
        difficultyLevel: req.query.difficultyLevel ? parseInt(String(req.query.difficultyLevel)) : undefined,
        difficultyRange: req.query.minDifficulty && req.query.maxDifficulty ? {
          min: parseInt(String(req.query.minDifficulty)),
          max: parseInt(String(req.query.maxDifficulty))
        } : undefined,
        teacherId: user.teacherId,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        createdAfter: req.query.createdAfter ? new Date(String(req.query.createdAfter)) : undefined,
        createdBefore: req.query.createdBefore ? new Date(String(req.query.createdBefore)) : undefined,
        page: req.query.page ? parseInt(String(req.query.page)) : undefined,
        limit: req.query.limit ? parseInt(String(req.query.limit)) : undefined
      };

      const result = await this.searchProblemsUseCase.execute(searchRequest);
      
      if (result.isFailure) {
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'SEARCH_FAILED',
          message: result.errorValue
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, result.value, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // === 복제 ===

  async cloneProblem(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      
      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }
      
      const { id: problemId } = req.params;
      
      const cloneRequest: CloneProblemInput = {
        sourceProblemId: problemId,
        requesterId: user.teacherId,
        newTeacherId: req.body.targetTeacherId || user.teacherId
      };

      const result = await this.cloneProblemUseCase.execute(cloneRequest);
      
      if (result.isFailure) {
        const statusCode = result.errorValue.includes('not found') ? HTTP_STATUS.NOT_FOUND :
                          result.errorValue.includes('denied') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
        this.sendErrorResponse(res, statusCode, {
          code: 'PROBLEM_CLONE_FAILED',
          message: result.errorValue
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.CREATED, {
        problem: result.value,
        message: 'Problem cloned successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }
}