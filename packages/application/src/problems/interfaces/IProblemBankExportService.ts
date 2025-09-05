import { Result } from '@woodie/domain/common/Result';
import { Problem } from '@woodie/domain/problems/entities/Problem';
import { ProblemSearchFilter } from '@woodie/domain/problems/repositories/IProblemRepository';

export interface ProblemBankExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  includeInactiveProblems?: boolean;
  includeAnswers?: boolean;
  includeStatistics?: boolean;
  customFields?: string[];
  compressionLevel?: 'none' | 'low' | 'medium' | 'high';
}

export interface ProblemBankImportOptions {
  skipDuplicates?: boolean;
  overwriteExisting?: boolean;
  preserveIds?: boolean;
  markAsActive?: boolean;
  validateOnly?: boolean; // 검증만 수행
  batchSize?: number;
}

export interface ExportResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  exportedCount: number;
  format: string;
  expiresAt: Date;
  metadata: {
    exportedAt: Date;
    exportedBy: string;
    filter?: ProblemSearchFilter;
    options: ProblemBankExportOptions;
  };
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  totalCount: number;
  importedIds: string[];
  skippedIds: string[];
  errors: Array<{
    row: number;
    field?: string;
    message: string;
    data?: any;
  }>;
  warnings: string[];
}

export interface ImportValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
    data?: any;
  }>;
  warnings: string[];
  preview: any[]; // 처음 몇 개 행의 미리보기
}

export interface IProblemBankExportService {
  /**
   * 문제 뱅크 내보내기
   */
  exportProblemBank(
    teacherId: string,
    filter?: ProblemSearchFilter,
    options?: ProblemBankExportOptions
  ): Promise<Result<ExportResult>>;

  /**
   * 문제 뱅크 가져오기
   */
  importProblemBank(
    teacherId: string,
    fileId: string,
    options?: ProblemBankImportOptions
  ): Promise<Result<ImportResult>>;

  /**
   * 가져오기 파일 유효성 검사
   */
  validateImportFile(
    fileId: string,
    format?: 'json' | 'csv' | 'xlsx'
  ): Promise<Result<ImportValidationResult>>;

  /**
   * 내보내기 템플릿 생성
   */
  generateExportTemplate(
    format: 'json' | 'csv' | 'xlsx',
    includeExamples?: boolean
  ): Promise<Result<ExportResult>>;

  /**
   * 내보내기 상태 조회
   */
  getExportStatus(exportId: string): Promise<Result<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number; // 0-100
    estimatedTimeRemaining?: number; // seconds
    error?: string;
  }>>;

  /**
   * 가져오기 상태 조회
   */
  getImportStatus(importId: string): Promise<Result<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number; // 0-100
    processedRows: number;
    totalRows: number;
    estimatedTimeRemaining?: number; // seconds
    error?: string;
  }>>;

  /**
   * 내보내기 기록 조회
   */
  getExportHistory(
    teacherId: string,
    limit?: number
  ): Promise<Result<ExportResult[]>>;

  /**
   * 가져오기 기록 조회
   */
  getImportHistory(
    teacherId: string,
    limit?: number
  ): Promise<Result<ImportResult[]>>;
}