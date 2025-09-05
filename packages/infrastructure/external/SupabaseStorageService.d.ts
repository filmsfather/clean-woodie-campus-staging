import { SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
import { CloudStorageService, StorageConfig, FileMetadata, UploadOptions, DownloadOptions, ListOptions, ListResult } from './CloudStorageService';
export declare class SupabaseStorageService extends CloudStorageService {
    private readonly supabase;
    constructor(logger: ILogger, config: StorageConfig, supabaseClient: SupabaseClient);
    uploadFile(key: string, fileBuffer: Buffer, options?: UploadOptions): Promise<Result<{
        url: string;
        metadata: FileMetadata;
    }>>;
    downloadFile(key: string, options?: DownloadOptions): Promise<Result<{
        data: Buffer;
        metadata: FileMetadata;
    }>>;
    deleteFile(key: string): Promise<Result<void>>;
    listFiles(options?: ListOptions): Promise<Result<ListResult>>;
    fileExists(key: string): Promise<Result<boolean>>;
    getFileMetadata(key: string): Promise<Result<FileMetadata>>;
    generateSignedUrl(key: string, expirationSeconds: number, method?: 'GET' | 'PUT' | 'DELETE'): Promise<Result<string>>;
    initiateMultipartUpload(key: string, options?: UploadOptions): Promise<Result<string>>;
    completeMultipartUpload(key: string, uploadId: string, parts: Array<{
        partNumber: number;
        etag: string;
    }>): Promise<Result<{
        url: string;
        metadata: FileMetadata;
    }>>;
    copyFile(sourceKey: string, destinationKey: string, options?: UploadOptions): Promise<Result<void>>;
    getBucketInfo(): Promise<Result<{
        name: string;
        createdAt: Date;
        public: boolean;
        allowedMimeTypes?: string[];
        fileSizeLimit?: number;
    }>>;
    getTransformedUrl(key: string, transformations: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'webp' | 'png' | 'jpg';
    }): Promise<Result<string>>;
}
//# sourceMappingURL=SupabaseStorageService.d.ts.map