import { SupabaseClient } from '@supabase/supabase-js';
import { IProblemBankExportService, ProblemBankExportOptions, ProblemBankImportOptions, ExportResult, ImportResult, ImportValidationResult } from '@woodie/application/problems/interfaces/IProblemBankExportService';
import { IFileService } from '@woodie/application/common/interfaces/IFileService';
import { ICacheService } from '@woodie/application/common/interfaces/ICacheService';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { IProblemRepository } from '@woodie/domain/problems/repositories/IProblemRepository';
import { ProblemSearchFilter } from '@woodie/domain/problems/repositories/IProblemRepository';
import { Result } from '@woodie/domain/common/Result';
export declare class ProblemBankExportService implements IProblemBankExportService {
    private readonly supabase;
    private readonly problemRepository;
    private readonly fileService;
    private readonly cache?;
    private readonly logger;
    private readonly exportJobs;
    private readonly importJobs;
    constructor(supabase: SupabaseClient, problemRepository: IProblemRepository, fileService: IFileService, logger: ILogger, cache?: ICacheService);
    exportProblemBank(teacherId: string, filter?: ProblemSearchFilter, options?: ProblemBankExportOptions): Promise<Result<ExportResult>>;
    importProblemBank(teacherId: string, fileId: string, options?: ProblemBankImportOptions): Promise<Result<ImportResult>>;
    validateImportFile(fileId: string, format?: 'json' | 'csv' | 'xlsx'): Promise<Result<ImportValidationResult>>;
    generateExportTemplate(format: 'json' | 'csv' | 'xlsx', includeExamples?: boolean): Promise<Result<ExportResult>>;
    getExportStatus(exportId: string): Promise<Result<any>>;
    getImportStatus(importId: string): Promise<Result<any>>;
    getExportHistory(teacherId: string, limit?: number): Promise<Result<ExportResult[]>>;
    getImportHistory(teacherId: string, limit?: number): Promise<Result<ImportResult[]>>;
    private performExport;
    private performImport;
    private importSingleProblem;
    private detectFormat;
    private parseCsvFile;
    private parseXlsxFile;
    private validateImportData;
    private generateCsvBuffer;
    private generateXlsxBuffer;
    private calculateEstimatedTime;
    private mapToExportResult;
    private mapToImportResult;
}
//# sourceMappingURL=ProblemBankExportService.d.ts.map