import { Request, Response } from 'express';
import {
  AuthenticatedRequest,
  BulkUpdateStatusRequest,
  BulkUpdateTagsRequest,
  BulkCloneRequest,
  BulkPermissionCheckQuery,
  HTTP_STATUS
} from '../interfaces/ProblemApiTypes';

import { BaseController } from '../../common/controllers/BaseController';
import { ProblemBankManagementService } from '@woodie/application/problems/services/ProblemBankManagementService';
import { BatchJobExecutorService } from '@woodie/application/batch/services/BatchJobExecutorService';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';

import * as crypto from 'crypto';

/**
 * 일괄 작업 컨트롤러
 * DDD 원칙에 따라 BaseController를 상속받아 공통 기능 활용
 */
export class BulkOperationsController extends BaseController {
  constructor(
    private managementService: ProblemBankManagementService,
    private batchJobExecutorService: BatchJobExecutorService
  ) {
    super();
  }

  // 문제 일괄 복제
  async cloneProblems(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const cloneRequest: BulkCloneRequest = req.body;

      // 요청 유효성 검증
      if (!cloneRequest.targetTeacherId) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: 'CLONE_VALIDATION_FAILED',
          message: 'Target teacher ID is required'
        }, requestId);
        return;
      }

      // 본인 또는 관리자만 복제 작업 가능
      if (user.role !== 'admin' && user.teacherId !== cloneRequest.targetTeacherId) {
        this.sendErrorResponse(res, HTTP_STATUS.FORBIDDEN, {
          code: 'CLONE_PERMISSION_DENIED',
          message: 'Cannot clone problems to another teacher without admin rights'
        }, requestId);
        return;
      }

      const result = await this.managementService.cloneProblems(cloneRequest);

      if (result.isFailure) {
        const error = result.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'CLONE_OPERATION_FAILED',
          message: typeof error === 'string' ? error : 'Failed to clone problems'
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        cloneResults: result.value,
        message: 'Problems cloned successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // 상태 일괄 업데이트
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const updateRequest: BulkUpdateStatusRequest = req.body;

      const result = await this.managementService.bulkUpdateActiveStatus(updateRequest);

      if (result.isFailure) {
        const error = result.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'BULK_UPDATE_FAILED',
          message: typeof error === 'string' ? error : 'Failed to update problem status'
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        updateResults: result.value,
        message: 'Problem status updated successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // 태그 일괄 업데이트
  async updateTags(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const updateRequest: BulkUpdateTagsRequest = req.body;

      const result = await this.managementService.bulkUpdateTags(updateRequest);

      if (result.isFailure) {
        const error = result.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'BULK_TAG_UPDATE_FAILED',
          message: typeof error === 'string' ? error : 'Failed to update tags'
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        updateResults: result.value,
        message: 'Tags updated successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // 권한 확인
  async checkPermissions(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const query: BulkPermissionCheckQuery = req.query as any;

      const result = await this.managementService.checkBulkPermissions(
        query.problemIds?.split(',') || [],
        user.teacherId
      );

      if (result.isFailure) {
        const error = result.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'PERMISSION_CHECK_FAILED',
          message: typeof error === 'string' ? error : 'Failed to check permissions'
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        permissions: result.value,
        message: 'Permission check completed'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // 일괄 작업 검증 (라우트에서 호출)
  async validateOperation(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const validationRequest = req.body;

      const result = await this.managementService.validateBulkOperation(validationRequest);

      if (result.isFailure) {
        const error = result.error;
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'BULK_VALIDATION_FAILED',
          message: typeof error === 'string' ? error : 'Failed to validate bulk operation'
        }, requestId);
        return;
      }

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        validation: result.value,
        message: 'Bulk operation validation completed'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }

  // 일괄 작업 상태 확인 (라우트에서 호출)
  async getOperationStatus(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      const { user } = req;

      if (!this.requireAuthentication(res, user, requestId)) {
        return;
      }

      const { operationId } = req.params;

      if (!operationId || operationId.trim().length === 0) {
        this.sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, {
          code: 'OPERATION_ID_REQUIRED',
          message: 'Operation ID is required'
        }, requestId);
        return;
      }

      // DDD 원칙에 따라 Application Service를 통해 배치 작업 상태 조회
      const jobId = new UniqueEntityID(operationId);
      const batchJobRepository = this.batchJobExecutorService['batchJobRepository'] as any;
      
      if (!batchJobRepository) {
        this.sendErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
          code: 'BATCH_SYSTEM_UNAVAILABLE',
          message: 'Batch job system is not available'
        }, requestId);
        return;
      }

      // 배치 작업 조회
      const jobResult = await batchJobRepository.findById(jobId);
      
      if (jobResult.isFailure || !jobResult.value) {
        this.sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, {
          code: 'OPERATION_NOT_FOUND',
          message: 'Bulk operation not found'
        }, requestId);
        return;
      }

      const batchJob = jobResult.value;
      
      // 배치 작업 상태를 API 응답 형태로 변환
      const operationStatus = {
        operationId,
        status: batchJob.status,
        progress: {
          total: batchJob.result?.recordsProcessed || 0,
          completed: batchJob.result?.recordsSucceeded || 0,
          failed: batchJob.result?.recordsFailed || 0
        },
        startedAt: batchJob.startedAt?.toISOString(),
        completedAt: batchJob.completedAt?.toISOString(),
        duration: batchJob.calculateDuration(),
        successRate: batchJob.getSuccessRate(),
        errorMessage: batchJob.result?.errorMessage,
        additionalInfo: batchJob.result?.additionalInfo
      };

      this.sendSuccessResponse(res, HTTP_STATUS.OK, {
        operation: operationStatus,
        message: 'Operation status retrieved successfully'
      }, requestId);

    } catch (error) {
      const requestId = req.requestContext?.requestId || crypto.randomUUID();
      this.handleError(res, error, requestId);
    }
  }
}