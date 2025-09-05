import { IProblemRepository } from '@woodie/domain/problems/repositories/IProblemRepository';
import { Result } from '@woodie/domain/common/Result';
import { ILogger } from '../../common/interfaces/ILogger';
import { ICacheService } from '../../common/interfaces/ICacheService';
import { ProblemCloneRequestDto, ProblemCloneResponseDto, BulkOperationRequestDto, BulkUpdateTagsRequestDto, BulkUpdateStatusRequestDto, BulkOperationResponseDto, ValidationResultDto, BulkPermissionCheckDto } from '../dto/ProblemDto';
export declare class ProblemBankManagementService {
    private problemRepository;
    private logger;
    private cacheService?;
    constructor(problemRepository: IProblemRepository, logger: ILogger, cacheService?: ICacheService | undefined);
    cloneProblems(request: ProblemCloneRequestDto): Promise<Result<ProblemCloneResponseDto>>;
    bulkUpdateActiveStatus(request: BulkUpdateStatusRequestDto): Promise<Result<BulkOperationResponseDto>>;
    bulkUpdateTags(request: BulkUpdateTagsRequestDto): Promise<Result<BulkOperationResponseDto>>;
    checkBulkPermissions(problemIds: string[], teacherId: string): Promise<Result<BulkPermissionCheckDto>>;
    validateBulkOperation(request: BulkOperationRequestDto): Promise<Result<ValidationResultDto>>;
    private validateCloneRequest;
    private bulkVerifyOwnership;
    private mapProblemToDto;
    private invalidateTeacherCaches;
    private generateCorrelationId;
}
//# sourceMappingURL=ProblemBankManagementService.d.ts.map