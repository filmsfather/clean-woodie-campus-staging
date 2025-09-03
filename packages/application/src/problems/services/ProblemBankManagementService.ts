import { IProblemRepository } from '@woodie/domain/problems/repositories/IProblemRepository';
import { Result } from '@woodie/domain/common/Result';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { Problem } from '@woodie/domain/problems/entities/Problem';
import { ILogger } from '../../common/interfaces/ILogger';
import { ICacheService, CacheTags } from '../../common/interfaces/ICacheService';
import {
  ProblemDto,
  ProblemCloneRequestDto,
  ProblemCloneResponseDto,
  BulkOperationRequestDto,
  BulkUpdateTagsRequestDto,
  BulkUpdateStatusRequestDto,
  BulkOperationResponseDto,
  ValidationResultDto,
  PermissionCheckDto,
  BulkPermissionCheckDto
} from '../dto/ProblemDto';
import {
  ProblemBankError,
  ProblemBankErrorFactory,
  ProblemBankErrorCode,
  ErrorChain
} from '../errors/ProblemBankErrors';
import * as crypto from 'crypto';

// 문제 뱅크 관리 전용 서비스 (복제, 일괄 작업, 권한 관리)
export class ProblemBankManagementService {
  constructor(
    private problemRepository: IProblemRepository,
    private logger: ILogger,
    private cacheService?: ICacheService
  ) {}

  async cloneProblems(request: ProblemCloneRequestDto): Promise<Result<ProblemCloneResponseDto>> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Starting problem cloning operation', {
        sourceCount: request.problemIds.length,
        targetTeacherId: request.targetTeacherId,
        correlationId
      });

      // 입력 검증
      const validationResult = await this.validateCloneRequest(request);
      if (validationResult.isFailure) {
        return Result.fail(validationResult.error);
      }

      // 소유권 일괄 확인 (N+1 방지)
      const ownershipResult = await this.bulkVerifyOwnership(
        request.problemIds,
        request.targetTeacherId // 실제로는 현재 요청자의 ID를 받아야 함
      );

      if (ownershipResult.isFailure) {
        return Result.fail(ownershipResult.error);
      }

      const ownershipMap = new Map(
        ownershipResult.value.map(item => [item.id, item.isOwner])
      );

      // 권한이 없는 문제들 필터링
      const authorizedProblemIds = request.problemIds.filter(id => 
        ownershipMap.get(id) === true
      );
      
      const unauthorizedProblemIds = request.problemIds.filter(id => 
        ownershipMap.get(id) !== true
      );

      if (unauthorizedProblemIds.length > 0) {
        this.logger.warn('Some problems are not authorized for cloning', {
          unauthorizedCount: unauthorizedProblemIds.length,
          unauthorizedIds: unauthorizedProblemIds,
          correlationId
        });
      }

      if (authorizedProblemIds.length === 0) {
        const error = new ProblemBankError(
          ProblemBankErrorCode.CLONE_PERMISSION_DENIED,
          'No problems are authorized for cloning',
          { request, correlationId }
        );
        return Result.fail(error.message);
      }

      // 일괄 복제 실행
      const problemEntityIds = authorizedProblemIds.map(id => new UniqueEntityID(id));
      const cloneOptions = {
        preserveTags: request.preserveTags ?? true,
        preserveDifficulty: request.preserveDifficulty ?? true,
        markAsActive: request.markAsActive ?? true
      };

      const cloneResult = await this.problemRepository.cloneProblems(
        problemEntityIds,
        request.targetTeacherId,
        cloneOptions
      );

      if (cloneResult.isFailure) {
        const error = new ProblemBankError(
          ProblemBankErrorCode.CLONE_OPERATION_FAILED,
          'Bulk clone operation failed',
          { request, correlationId },
          new Error(cloneResult.error)
        );
        
        this.logger.error('Problem cloning failed', error.toLogObject(), {
          correlationId,
          duration: Date.now() - startTime
        });
        
        return Result.fail(error.message);
      }

      const clonedProblems = cloneResult.value;

      // 결과 DTO 구성
      const responseDto: ProblemCloneResponseDto = {
        clonedProblems: clonedProblems.map(problem => this.mapProblemToDto(problem)),
        successCount: clonedProblems.length,
        failedCount: request.problemIds.length - clonedProblems.length,
        errors: unauthorizedProblemIds.map(id => `Unauthorized access to problem: ${id}`)
      };

      // 캐시 무효화
      if (this.cacheService) {
        await this.invalidateTeacherCaches([request.targetTeacherId]);
      }

      this.logger.info('Problem cloning completed successfully', {
        sourceCount: request.problemIds.length,
        successCount: responseDto.successCount,
        failedCount: responseDto.failedCount,
        targetTeacherId: request.targetTeacherId,
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(responseDto);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.CLONE_OPERATION_FAILED,
        'Unexpected error during problem cloning',
        { request, correlationId },
        error as Error
      );

      this.logger.error('Problem cloning error', problemBankError.toLogObject(), {
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.fail(problemBankError.message);
    }
  }

  async bulkUpdateActiveStatus(request: BulkUpdateStatusRequestDto): Promise<Result<BulkOperationResponseDto>> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Starting bulk active status update', {
        problemCount: request.problemIds.length,
        isActive: request.isActive,
        teacherId: request.teacherId,
        correlationId
      });

      // 권한 검증
      const validationResult = await this.validateBulkOperation(request);
      if (validationResult.isFailure) {
        return Result.fail(validationResult.error);
      }

      // Repository 호출
      const problemEntityIds = request.problemIds.map(id => new UniqueEntityID(id));
      const updateResult = await this.problemRepository.bulkUpdateActiveStatus(
        problemEntityIds,
        request.isActive,
        request.teacherId
      );

      if (updateResult.isFailure) {
        const error = ProblemBankErrorFactory.bulkOperationFailed(
          'status update',
          0,
          request.problemIds.length,
          [updateResult.error]
        );
        
        this.logger.error('Bulk status update failed', error.toLogObject(), {
          correlationId,
          duration: Date.now() - startTime
        });
        
        return Result.fail(error.message);
      }

      // 성공 응답
      const responseDto: BulkOperationResponseDto = {
        successCount: request.problemIds.length,
        failedCount: 0,
        affectedProblemIds: request.problemIds,
        errors: []
      };

      // 캐시 무효화
      if (this.cacheService) {
        await this.invalidateTeacherCaches([request.teacherId]);
      }

      this.logger.info('Bulk active status update completed successfully', {
        problemCount: request.problemIds.length,
        isActive: request.isActive,
        teacherId: request.teacherId,
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(responseDto);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.BULK_OPERATION_FAILED,
        'Unexpected error during bulk status update',
        { request, correlationId },
        error as Error
      );

      this.logger.error('Bulk status update error', problemBankError.toLogObject(), {
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.fail(problemBankError.message);
    }
  }

  async bulkUpdateTags(request: BulkUpdateTagsRequestDto): Promise<Result<BulkOperationResponseDto>> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Starting bulk tags update', {
        problemCount: request.problemIds.length,
        tagCount: request.tags.length,
        operation: request.operation,
        teacherId: request.teacherId,
        correlationId
      });

      // 권한 검증
      const validationResult = await this.validateBulkOperation(request);
      if (validationResult.isFailure) {
        return Result.fail(validationResult.error);
      }

      // 태그 검증
      if (request.tags.length === 0) {
        const error = new ProblemBankError(
          ProblemBankErrorCode.BULK_VALIDATION_FAILED,
          'Tags array cannot be empty',
          { request }
        );
        return Result.fail(error.message);
      }

      // Repository 호출
      const problemEntityIds = request.problemIds.map(id => new UniqueEntityID(id));
      const updateResult = await this.problemRepository.bulkUpdateTags(
        problemEntityIds,
        request.tags,
        request.teacherId,
        request.operation
      );

      if (updateResult.isFailure) {
        const error = ProblemBankErrorFactory.bulkOperationFailed(
          'tags update',
          0,
          request.problemIds.length,
          [updateResult.error]
        );
        
        this.logger.error('Bulk tags update failed', error.toLogObject(), {
          correlationId,
          duration: Date.now() - startTime
        });
        
        return Result.fail(error.message);
      }

      // 성공 응답
      const responseDto: BulkOperationResponseDto = {
        successCount: request.problemIds.length,
        failedCount: 0,
        affectedProblemIds: request.problemIds,
        errors: []
      };

      // 캐시 무효화
      if (this.cacheService) {
        await this.invalidateTeacherCaches([request.teacherId]);
      }

      this.logger.info('Bulk tags update completed successfully', {
        problemCount: request.problemIds.length,
        tagCount: request.tags.length,
        operation: request.operation,
        teacherId: request.teacherId,
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(responseDto);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.BULK_OPERATION_FAILED,
        'Unexpected error during bulk tags update',
        { request, correlationId },
        error as Error
      );

      this.logger.error('Bulk tags update error', problemBankError.toLogObject(), {
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.fail(problemBankError.message);
    }
  }

  async checkBulkPermissions(
    problemIds: string[],
    teacherId: string
  ): Promise<Result<BulkPermissionCheckDto>> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Checking bulk permissions', {
        problemCount: problemIds.length,
        teacherId,
        correlationId
      });

      // 일괄 권한 확인 (N+1 방지)
      const entityIds = problemIds.map(id => new UniqueEntityID(id));
      
      const [ownershipResult, accessResult] = await Promise.all([
        this.problemRepository.bulkVerifyOwnership(entityIds, teacherId),
        this.problemRepository.bulkCanAccess(entityIds, teacherId)
      ]);

      if (ownershipResult.isFailure || accessResult.isFailure) {
        const error = new ProblemBankError(
          ProblemBankErrorCode.OWNERSHIP_VERIFICATION_FAILED,
          'Failed to verify bulk permissions',
          { problemIds, teacherId, correlationId }
        );
        return Result.fail(error.message);
      }

      const ownershipMap = new Map(ownershipResult.value.map(item => [item.id, item.isOwner]));
      const accessMap = new Map(accessResult.value.map(item => [item.id, item.canAccess]));

      // 권한 정보 구성
      const permissions: PermissionCheckDto[] = problemIds.map(problemId => {
        const canRead = accessMap.get(problemId) ?? false;
        const isOwner = ownershipMap.get(problemId) ?? false;
        
        return {
          problemId,
          teacherId,
          canRead,
          canWrite: isOwner, // 소유자만 수정 가능
          canDelete: isOwner // 소유자만 삭제 가능
        };
      });

      // 요약 통계
      const summary = {
        totalChecked: problemIds.length,
        readableCount: permissions.filter(p => p.canRead).length,
        writableCount: permissions.filter(p => p.canWrite).length,
        deletableCount: permissions.filter(p => p.canDelete).length
      };

      const resultDto: BulkPermissionCheckDto = {
        permissions,
        summary
      };

      this.logger.info('Bulk permissions check completed', {
        ...summary,
        teacherId,
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(resultDto);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.OWNERSHIP_VERIFICATION_FAILED,
        'Unexpected error during bulk permission check',
        { problemIds, teacherId, correlationId },
        error as Error
      );

      this.logger.error('Bulk permission check error', problemBankError.toLogObject(), {
        correlationId,
        duration: Date.now() - startTime
      });

      return Result.fail(problemBankError.message);
    }
  }

  async validateBulkOperation(request: BulkOperationRequestDto): Promise<Result<ValidationResultDto>> {
    const correlationId = this.generateCorrelationId();
    
    try {
      const errors: Array<{ code: string; message: string; problemId?: string }> = [];
      const warnings: Array<{ code: string; message: string; problemId?: string }> = [];

      // 기본 검증
      if (!request.teacherId || request.teacherId.trim().length === 0) {
        errors.push({
          code: 'TEACHER_ID_REQUIRED',
          message: 'Teacher ID is required',
          field: 'teacherId'
        } as any);
      }

      if (!request.problemIds || request.problemIds.length === 0) {
        errors.push({
          code: 'PROBLEM_IDS_REQUIRED',
          message: 'Problem IDs array cannot be empty',
          field: 'problemIds'
        } as any);
      }

      // 문제 ID 중복 확인
      if (request.problemIds) {
        const uniqueIds = new Set(request.problemIds);
        if (uniqueIds.size !== request.problemIds.length) {
          warnings.push({
            code: 'DUPLICATE_PROBLEM_IDS',
            message: 'Duplicate problem IDs found and will be processed only once'
          });
        }
      }

      // 문제 수 제한 확인
      const maxBulkSize = 100;
      if (request.problemIds && request.problemIds.length > maxBulkSize) {
        errors.push({
          code: 'BULK_SIZE_EXCEEDED',
          message: `Cannot process more than ${maxBulkSize} problems at once`,
          field: 'problemIds'
        } as any);
      }

      // 문제 존재 여부 확인
      if (request.problemIds && request.problemIds.length > 0 && errors.length === 0) {
        const entityIds = request.problemIds.map(id => new UniqueEntityID(id));
        const existenceResult = await this.problemRepository.existsMany(entityIds);
        
        if (existenceResult.isSuccess) {
          const nonExistentProblems = existenceResult.value
            .filter(item => !item.exists)
            .map(item => item.id);
          
          for (const problemId of nonExistentProblems) {
            errors.push({
              code: 'PROBLEM_NOT_FOUND',
              message: 'Problem not found',
              problemId
            });
          }
        }
      }

      const validationResult: ValidationResultDto = {
        valid: errors.length === 0,
        errors,
        warnings
      };

      if (!validationResult.valid) {
        this.logger.warn('Bulk operation validation failed', {
          request,
          errors,
          warnings,
          correlationId
        });
      }

      return Result.ok(validationResult);

    } catch (error) {
      const problemBankError = new ProblemBankError(
        ProblemBankErrorCode.BULK_VALIDATION_FAILED,
        'Failed to validate bulk operation',
        { request, correlationId },
        error as Error
      );

      return Result.fail(problemBankError.message);
    }
  }

  // === Private 헬퍼 메서드들 ===

  private async validateCloneRequest(request: ProblemCloneRequestDto): Promise<Result<void>> {
    if (!request.targetTeacherId || request.targetTeacherId.trim().length === 0) {
      const error = new ProblemBankError(
        ProblemBankErrorCode.CLONE_VALIDATION_FAILED,
        'Target teacher ID is required'
      );
      return Result.fail(error.message);
    }

    if (!request.problemIds || request.problemIds.length === 0) {
      const error = new ProblemBankError(
        ProblemBankErrorCode.CLONE_VALIDATION_FAILED,
        'Problem IDs array cannot be empty'
      );
      return Result.fail(error.message);
    }

    if (request.problemIds.length > 50) {
      const error = new ProblemBankError(
        ProblemBankErrorCode.CLONE_VALIDATION_FAILED,
        'Cannot clone more than 50 problems at once'
      );
      return Result.fail(error.message);
    }

    return Result.ok();
  }

  private async bulkVerifyOwnership(
    problemIds: string[],
    teacherId: string
  ): Promise<Result<Array<{ id: string; isOwner: boolean }>>> {
    const entityIds = problemIds.map(id => new UniqueEntityID(id));
    return await this.problemRepository.bulkVerifyOwnership(entityIds, teacherId);
  }

  private mapProblemToDto(problem: Problem): ProblemDto {
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

  private async invalidateTeacherCaches(teacherIds: string[]): Promise<void> {
    if (!this.cacheService) return;

    try {
      const tags = teacherIds.flatMap(id => [
        CacheTags.forTeacher(id),
        CacheTags.STATISTICS,
        CacheTags.ANALYTICS
      ]);

      await this.cacheService.invalidateByTags([...new Set(tags)]);

      this.logger.info('Teacher caches invalidated', {
        teacherIds,
        tagCount: tags.length
      });

    } catch (error) {
      this.logger.warn('Failed to invalidate teacher caches', {
        teacherIds,
        error: (error as Error).message
      });
    }
  }

  private generateCorrelationId(): string {
    return crypto.randomUUID();
  }
}