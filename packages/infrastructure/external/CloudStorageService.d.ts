import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
export interface FileMetadata {
    filename: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
    uploadedBy: string;
    tags?: string[];
    customMetadata?: Record<string, string>;
}
export interface StorageConfig {
    provider: 'aws_s3' | 'google_cloud' | 'azure_blob' | 'supabase';
    bucketName: string;
    region?: string;
    publicUrl?: string;
    enableVersioning?: boolean;
    enableEncryption?: boolean;
    retentionPeriodDays?: number;
    accessKey?: string;
    secretKey?: string;
    projectId?: string;
}
export interface UploadOptions {
    contentType?: string;
    cacheControl?: string;
    metadata?: Record<string, string>;
    tags?: Record<string, string>;
    storageClass?: 'standard' | 'cold' | 'archive';
    enablePublicAccess?: boolean;
    generateThumbnail?: boolean;
    compressionLevel?: number;
}
export interface DownloadOptions {
    responseContentType?: string;
    responseContentDisposition?: string;
    versionId?: string;
    byteRange?: {
        start: number;
        end: number;
    };
}
export interface ListOptions {
    prefix?: string;
    delimiter?: string;
    maxKeys?: number;
    continuationToken?: string;
    includeMetadata?: boolean;
}
export interface StorageObject {
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
    storageClass?: string;
    metadata?: FileMetadata;
    url?: string;
}
export interface ListResult {
    objects: StorageObject[];
    continuationToken?: string;
    hasMore: boolean;
    totalCount?: number;
}
export declare abstract class CloudStorageService {
    protected readonly logger: ILogger;
    protected readonly config: StorageConfig;
    constructor(logger: ILogger, config: StorageConfig);
    abstract uploadFile(key: string, fileBuffer: Buffer, options?: UploadOptions): Promise<Result<{
        url: string;
        metadata: FileMetadata;
    }>>;
    abstract downloadFile(key: string, options?: DownloadOptions): Promise<Result<{
        data: Buffer;
        metadata: FileMetadata;
    }>>;
    abstract deleteFile(key: string): Promise<Result<void>>;
    abstract listFiles(options?: ListOptions): Promise<Result<ListResult>>;
    abstract fileExists(key: string): Promise<Result<boolean>>;
    abstract getFileMetadata(key: string): Promise<Result<FileMetadata>>;
    abstract generateSignedUrl(key: string, expirationSeconds: number, method?: 'GET' | 'PUT' | 'DELETE'): Promise<Result<string>>;
    abstract initiateMultipartUpload(key: string, options?: UploadOptions): Promise<Result<string>>;
    abstract completeMultipartUpload(key: string, uploadId: string, parts: Array<{
        partNumber: number;
        etag: string;
    }>): Promise<Result<{
        url: string;
        metadata: FileMetadata;
    }>>;
    abstract copyFile(sourceKey: string, destinationKey: string, options?: UploadOptions): Promise<Result<void>>;
    createFolder(folderPath: string): Promise<Result<void>>;
    deleteFolder(folderPath: string): Promise<Result<{
        deletedCount: number;
        failedDeletes: string[];
    }>>;
    getStorageStatistics(): Promise<Result<{
        totalFiles: number;
        totalSize: number;
        averageFileSize: number;
        filesByType: Record<string, number>;
        sizeByType: Record<string, number>;
        oldestFile?: {
            key: string;
            lastModified: Date;
        };
        newestFile?: {
            key: string;
            lastModified: Date;
        };
    }>>;
    searchFiles(query: {
        filename?: string;
        contentType?: string;
        tags?: string[];
        uploadedBy?: string;
        uploadedAfter?: Date;
        uploadedBefore?: Date;
        sizeMin?: number;
        sizeMax?: number;
    }): Promise<Result<StorageObject[]>>;
    batchOperation(operations: Array<{
        type: 'upload' | 'download' | 'delete' | 'copy';
        key: string;
        data?: Buffer;
        destinationKey?: string;
        options?: UploadOptions | DownloadOptions;
    }>): Promise<Result<Array<{
        operation: any;
        success: boolean;
        error?: string;
        result?: any;
    }>>>;
    backupFile(key: string, backupStorageService: CloudStorageService, backupKey?: string): Promise<Result<void>>;
    protected normalizeKey(key: string): string;
    protected inferContentType(filename: string): string;
    protected formatFileSize(bytes: number): string;
}
//# sourceMappingURL=CloudStorageService.d.ts.map