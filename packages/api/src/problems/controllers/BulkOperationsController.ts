import { Response } from 'express';
import {
  AuthenticatedRequest,
  BulkUpdateStatusRequest,
  BulkUpdateTagsRequest,
  BulkCloneRequest,
  BulkPermissionCheckQuery,
  ApiSuccessResponse,
  ApiErrorResponse,
  HTTP_STATUS
} from '../interfaces/ProblemApiTypes';

import { ProblemBankManagementService } from '@woodie/application/problems/services/ProblemBankManagementService';
import { ProblemBankError, ProblemBankErrorCode } from '@woodie/application/problems/errors/ProblemBankErrors';

import * as crypto from 'crypto';

// 일괄 작업 컨트롤러
export class BulkOperationsController {
  constructor(
    private managementService: ProblemBankManagementService
  ) {}

  // 문제 일괄 복제
  async cloneProblems(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const cloneRequest: BulkCloneRequest = req.body;

      // 요청 유효성 검증
      if (!cloneRequest.targetTeacherId) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.CLONE_VALIDATION_FAILED,
          message: 'Target teacher ID is required'
        }, requestId);
        return;
      }

      // 본인 또는 관리자만 복제 작업 가능 (추가 검증)
      if (user.role !== 'admin' && user.teacherId !== cloneRequest.targetTeacherId) {
        // 다른 교사에게 복제하는 경우 특별한 권한 필요
        this.sendErrorResponse(res, HTTP_STATUS.FORBIDDEN, {
          code: ProblemBankErrorCode.CLONE_PERMISSION_DENIED,
          message: 'Cannot clone problems to another teacher without admin rights'
        }, requestId);
        return;
      }

      const result = await this.managementService.cloneProblems(cloneRequest);

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message,
          details: error.context
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        ...result.value,
        message: `Successfully cloned ${result.value.successCount} problems`
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'cloneProblems');
    }
  }

  // 문제 활성 상태 일괄 업데이트
  async updateActiveStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const updateRequest: BulkUpdateStatusRequest = req.body;

      // 교사 ID 검증 (본인 문제만 수정 가능)
      if (user.role !== 'admin' && user.teacherId !== updateRequest.teacherId) {
        this.sendErrorResponse(res, HTTP_STATUS.FORBIDDEN, {
          code: ProblemBankErrorCode.UNAUTHORIZED_ACCESS,
          message: 'Can only update your own problems'
        }, requestId);
        return;
      }

      const result = await this.managementService.bulkUpdateActiveStatus(updateRequest);

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message,
          details: error.context
        }, requestId);
        return;
      }

      const statusText = updateRequest.isActive ? 'activated' : 'deactivated';
      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        ...result.value,
        message: `Successfully ${statusText} ${result.value.successCount} problems`
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'updateActiveStatus');
    }
  }

  // 문제 태그 일괄 업데이트
  async updateTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const updateRequest: BulkUpdateTagsRequest = req.body;

      // 교사 ID 검증
      if (user.role !== 'admin' && user.teacherId !== updateRequest.teacherId) {
        this.sendErrorResponse(res, HTTP_STATUS.FORBIDDEN, {
          code: ProblemBankErrorCode.UNAUTHORIZED_ACCESS,
          message: 'Can only update your own problems'
        }, requestId);
        return;
      }

      const result = await this.managementService.bulkUpdateTags(updateRequest);

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message,
          details: error.context
        }, requestId);
        return;
      }

      const operationText = {
        add: 'added to',
        remove: 'removed from',
        replace: 'replaced in'
      }[updateRequest.operation];

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        ...result.value,
        message: `Successfully ${operationText} ${result.value.successCount} problems`
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'updateTags');
    }
  }

  // 일괄 권한 확인
  async checkPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const query: BulkPermissionCheckQuery = req.query as any;

      if (!query.problemIds) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.BULK_VALIDATION_FAILED,
          message: 'Problem IDs parameter is required'
        }, requestId);
        return;
      }

      const problemIds = query.problemIds.split(',').map(id => id.trim()).filter(id => id.length > 0);

      if (problemIds.length === 0) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.BULK_VALIDATION_FAILED,
          message: 'At least one problem ID is required'
        }, requestId);
        return;
      }

      if (problemIds.length > 100) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: ProblemBankErrorCode.BULK_VALIDATION_FAILED,
          message: 'Cannot check more than 100 problems at once'
        }, requestId);
        return;
      }

      const result = await this.managementService.checkBulkPermissions(problemIds, user.teacherId);

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        ...result.value,
        message: `Permission check completed for ${problemIds.length} problems`
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'checkPermissions');
    }
  }

  // 일괄 작업 검증
  async validateOperation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;
      const operationRequest = req.body;

      // 교사 ID 설정
      if (!operationRequest.teacherId) {
        operationRequest.teacherId = user.teacherId;
      }

      // 권한 확인
      if (user.role !== 'admin' && user.teacherId !== operationRequest.teacherId) {
        this.sendErrorResponse(res, HTTP_STATUS.FORBIDDEN, {
          code: ProblemBankErrorCode.UNAUTHORIZED_ACCESS,
          message: 'Can only validate operations on your own problems'
        }, requestId);
        return;
      }

      const result = await this.managementService.validateBulkOperation(operationRequest);

      if (result.isFailure) {
        const error = result.error as ProblemBankError;
        this.sendErrorResponse(res, error.toHttpStatus(), {
          code: error.code,
          message: error.message
        }, requestId);
        return;
      }

      const validation = result.value;
      const statusCode = validation.valid ? HTTP_STATUS.OK : HTTP_STATUS.UNPROCESSABLE_ENTITY;

      this.sendSuccessResponse(res, statusCode, {
        validation,
        message: validation.valid ? 'Validation passed' : 'Validation failed'
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'validateOperation');
    }
  }

  // 일괄 작업 진행 상황 확인 (미래 확장용)
  async getOperationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { operationId } = req.params;

      // TODO: 실제 구현에서는 Redis나 DB에서 작업 상태 조회
      // 현재는 Mock 응답
      const mockStatus = {
        operationId,
        status: 'completed', // 'pending', 'in_progress', 'completed', 'failed'
        progress: {
          total: 50,
          processed: 50,
          succeeded: 48,
          failed: 2
        },
        startedAt: new Date(Date.now() - 30000).toISOString(),
        completedAt: new Date().toISOString(),
        errors: [
          { problemId: 'prob-123', error: 'Permission denied' },
          { problemId: 'prob-456', error: 'Problem not found' }
        ]
      };

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        operationStatus: mockStatus,
        message: 'Operation status retrieved successfully'
      }, requestId);

    } catch (error) {
      this.handleUnexpectedError(res, error as Error, 'getOperationStatus');
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