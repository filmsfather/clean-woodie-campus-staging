import { SupabaseClient } from '@supabase/supabase-js';
import { IFileService, FileUploadOptions, FileDownloadOptions, FileMetadata, FileProcessingResult } from '@woodie/application/common/interfaces/IFileService';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
export interface SupabaseFileConfig {
    bucketName: string;
    maxFileSize?: number;
    allowedTypes?: string[];
    urlExpirationTime?: number;
    enableVersioning?: boolean;
}
export declare class SupabaseFileService implements IFileService {
    private readonly supabase;
    private readonly logger;
    private readonly config;
    constructor(supabase: SupabaseClient, logger: ILogger, config: SupabaseFileConfig);
    uploadFile(file: Buffer | Blob | File, fileName: string, options?: FileUploadOptions): Promise<Result<FileMetadata>>;
    uploadFiles(files: Array<{
        file: Buffer | Blob | File;
        fileName: string;
    }>, options?: FileUploadOptions): Promise<Result<FileProcessingResult>>;
    getDownloadUrl(fileId: string, options?: FileDownloadOptions): Promise<Result<string>>;
    getFileMetadata(fileId: string): Promise<Result<FileMetadata>>;
    deleteFile(fileId: string): Promise<Result<void>>;
    fileExists(fileId: string): Promise<Result<boolean>>;
    readFile(fileId: string): Promise<Result<Buffer>>;
    readTextFile(fileId: string, encoding?: string): Promise<Result<string>>;
    readJsonFile<T>(fileId: string): Promise<Result<T>>;
    saveJsonFile<T>(data: T, fileName: string, options?: FileUploadOptions): Promise<Result<FileMetadata>>;
    cleanupTempFiles(olderThanHours?: number): Promise<Result<number>>;
    private validateFile;
    private generateFileName;
    private generateFilePath;
    private getFileSize;
    private getMimeType;
    private saveFileMetadata;
    private mapToFileMetadata;
}
//# sourceMappingURL=SupabaseFileService.d.ts.map