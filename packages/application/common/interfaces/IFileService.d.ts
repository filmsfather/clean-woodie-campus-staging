import { Result } from '@woodie/domain/common/Result';
export interface FileUploadOptions {
    maxSize?: number;
    allowedTypes?: string[];
    generateUniqueFileName?: boolean;
    preserveOriginalName?: boolean;
    metadata?: Record<string, any>;
}
export interface FileDownloadOptions {
    inline?: boolean;
    filename?: string;
    expiresIn?: number;
}
export interface FileMetadata {
    id: string;
    originalName: string;
    fileName: string;
    mimeType: string;
    size: number;
    path: string;
    url?: string;
    uploadedAt: Date;
    uploadedBy?: string;
    metadata?: Record<string, any>;
}
export interface FileProcessingResult {
    success: boolean;
    processed: number;
    failed: number;
    errors: string[];
    results?: any[];
}
export interface IFileService {
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
}
//# sourceMappingURL=IFileService.d.ts.map