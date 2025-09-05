import { Result } from '@woodie/domain/common/Result';
import { randomUUID } from 'crypto';
import path from 'path';
export class SupabaseFileService {
    supabase;
    logger;
    config;
    constructor(supabase, logger, config) {
        this.supabase = supabase;
        this.logger = logger;
        this.config = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['application/json', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            urlExpirationTime: 3600, // 1 hour
            ...config
        };
    }
    async uploadFile(file, fileName, options) {
        const correlationId = randomUUID();
        try {
            this.logger.info('Starting file upload', {
                fileName,
                correlationId,
                options
            });
            // 파일 검증
            const validationResult = this.validateFile(file, fileName, options);
            if (validationResult.isFailure) {
                return Result.fail(`File validation failed: ${validationResult.error}`);
            }
            // 파일명 생성
            const finalFileName = this.generateFileName(fileName, options);
            const filePath = this.generateFilePath(finalFileName);
            // 파일 업로드
            const { data, error } = await this.supabase.storage
                .from(this.config.bucketName)
                .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });
            if (error) {
                this.logger.error('File upload failed', {
                    error: error.message,
                    fileName,
                    correlationId
                });
                return Result.fail(`File upload failed: ${error.message}`);
            }
            // 메타데이터 저장
            const fileMetadata = {
                id: randomUUID(),
                originalName: fileName,
                fileName: finalFileName,
                mimeType: this.getMimeType(file, fileName),
                size: this.getFileSize(file),
                path: data.path,
                uploadedAt: new Date(),
                metadata: options?.metadata
            };
            const metadataResult = await this.saveFileMetadata(fileMetadata);
            if (metadataResult.isFailure) {
                // 업로드된 파일 삭제 (롤백)
                await this.supabase.storage
                    .from(this.config.bucketName)
                    .remove([data.path]);
                return Result.fail(`Failed to save file metadata: ${metadataResult.error}`);
            }
            this.logger.info('File upload completed', {
                fileId: fileMetadata.id,
                fileName: finalFileName,
                size: fileMetadata.size,
                correlationId
            });
            return Result.ok(fileMetadata);
        }
        catch (error) {
            this.logger.error('Unexpected file upload error', {
                error: error instanceof Error ? error.message : String(error),
                fileName,
                correlationId
            });
            return Result.fail(`File upload error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async uploadFiles(files, options) {
        const correlationId = randomUUID();
        try {
            this.logger.info('Starting multiple file upload', {
                fileCount: files.length,
                correlationId
            });
            const results = {
                success: true,
                processed: 0,
                failed: 0,
                errors: [],
                results: []
            };
            for (const { file, fileName } of files) {
                const uploadResult = await this.uploadFile(file, fileName, options);
                if (uploadResult.isSuccess) {
                    results.processed++;
                    results.results.push(uploadResult.value);
                }
                else {
                    results.failed++;
                    results.errors.push(`${fileName}: ${uploadResult.error}`);
                }
            }
            results.success = results.failed === 0;
            this.logger.info('Multiple file upload completed', {
                processed: results.processed,
                failed: results.failed,
                correlationId
            });
            return Result.ok(results);
        }
        catch (error) {
            return Result.fail(`Multiple file upload error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getDownloadUrl(fileId, options) {
        try {
            // 파일 메타데이터 조회
            const metadataResult = await this.getFileMetadata(fileId);
            if (metadataResult.isFailure) {
                return Result.fail(`Failed to get file metadata: ${metadataResult.error}`);
            }
            const metadata = metadataResult.value;
            const expiresIn = options?.expiresIn || this.config.urlExpirationTime;
            // 서명된 URL 생성
            const { data, error } = await this.supabase.storage
                .from(this.config.bucketName)
                .createSignedUrl(metadata.path, expiresIn, {
                download: options?.filename || metadata.originalName
            });
            if (error) {
                return Result.fail(`Failed to generate download URL: ${error.message}`);
            }
            return Result.ok(data.signedUrl);
        }
        catch (error) {
            return Result.fail(`Download URL generation error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getFileMetadata(fileId) {
        try {
            const { data, error } = await this.supabase
                .from('file_metadata')
                .select('*')
                .eq('id', fileId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return Result.fail(`File not found: ${fileId}`);
                }
                return Result.fail(`Failed to get file metadata: ${error.message}`);
            }
            return Result.ok(this.mapToFileMetadata(data));
        }
        catch (error) {
            return Result.fail(`File metadata error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async deleteFile(fileId) {
        try {
            // 파일 메타데이터 조회
            const metadataResult = await this.getFileMetadata(fileId);
            if (metadataResult.isFailure) {
                return Result.fail(`Failed to get file metadata for deletion: ${metadataResult.error}`);
            }
            const metadata = metadataResult.value;
            // 스토리지에서 파일 삭제
            const { error: storageError } = await this.supabase.storage
                .from(this.config.bucketName)
                .remove([metadata.path]);
            if (storageError) {
                return Result.fail(`Failed to delete file from storage: ${storageError.message}`);
            }
            // 메타데이터 삭제
            const { error: dbError } = await this.supabase
                .from('file_metadata')
                .delete()
                .eq('id', fileId);
            if (dbError) {
                return Result.fail(`Failed to delete file metadata: ${dbError.message}`);
            }
            this.logger.info('File deleted successfully', {
                fileId,
                fileName: metadata.originalName
            });
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`File deletion error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async fileExists(fileId) {
        try {
            const metadataResult = await this.getFileMetadata(fileId);
            return Result.ok(metadataResult.isSuccess);
        }
        catch (error) {
            return Result.fail(`File existence check error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async readFile(fileId) {
        try {
            const metadataResult = await this.getFileMetadata(fileId);
            if (metadataResult.isFailure) {
                return Result.fail(`Failed to get file metadata for reading: ${metadataResult.error}`);
            }
            const metadata = metadataResult.value;
            const { data, error } = await this.supabase.storage
                .from(this.config.bucketName)
                .download(metadata.path);
            if (error) {
                return Result.fail(`Failed to read file: ${error.message}`);
            }
            const buffer = Buffer.from(await data.arrayBuffer());
            return Result.ok(buffer);
        }
        catch (error) {
            return Result.fail(`File read error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async readTextFile(fileId, encoding = 'utf-8') {
        try {
            const bufferResult = await this.readFile(fileId);
            if (bufferResult.isFailure) {
                return Result.fail(bufferResult.error);
            }
            const text = bufferResult.value.toString(encoding);
            return Result.ok(text);
        }
        catch (error) {
            return Result.fail(`Text file read error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async readJsonFile(fileId) {
        try {
            const textResult = await this.readTextFile(fileId);
            if (textResult.isFailure) {
                return Result.fail(textResult.error);
            }
            const data = JSON.parse(textResult.value);
            return Result.ok(data);
        }
        catch (error) {
            return Result.fail(`JSON file read error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async saveJsonFile(data, fileName, options) {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            const buffer = Buffer.from(jsonString, 'utf-8');
            return await this.uploadFile(buffer, fileName, {
                ...options,
                allowedTypes: ['application/json']
            });
        }
        catch (error) {
            return Result.fail(`JSON file save error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async cleanupTempFiles(olderThanHours = 24) {
        try {
            const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
            const { data, error } = await this.supabase
                .from('file_metadata')
                .select('*')
                .lt('uploaded_at', cutoffDate.toISOString())
                .eq('is_temporary', true);
            if (error) {
                return Result.fail(`Failed to query temp files: ${error.message}`);
            }
            let deletedCount = 0;
            for (const file of data || []) {
                const deleteResult = await this.deleteFile(file.id);
                if (deleteResult.isSuccess) {
                    deletedCount++;
                }
            }
            this.logger.info('Temp file cleanup completed', {
                deletedCount,
                olderThanHours
            });
            return Result.ok(deletedCount);
        }
        catch (error) {
            return Result.fail(`Temp file cleanup error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    validateFile(file, fileName, options) {
        const fileSize = this.getFileSize(file);
        const maxSize = options?.maxSize || this.config.maxFileSize;
        if (fileSize > maxSize) {
            return Result.fail(`File size (${fileSize}) exceeds maximum allowed size (${maxSize})`);
        }
        const mimeType = this.getMimeType(file, fileName);
        const allowedTypes = options?.allowedTypes || this.config.allowedTypes;
        if (!allowedTypes.includes(mimeType)) {
            return Result.fail(`File type (${mimeType}) is not allowed`);
        }
        return Result.ok();
    }
    generateFileName(originalName, options) {
        if (options?.preserveOriginalName && !options.generateUniqueFileName) {
            return originalName;
        }
        const ext = path.extname(originalName);
        const baseName = path.basename(originalName, ext);
        if (options?.generateUniqueFileName !== false) {
            const timestamp = Date.now();
            const uniqueId = randomUUID().slice(0, 8);
            return `${baseName}_${timestamp}_${uniqueId}${ext}`;
        }
        return originalName;
    }
    generateFilePath(fileName) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `uploads/${year}/${month}/${day}/${fileName}`;
    }
    getFileSize(file) {
        if (Buffer.isBuffer(file)) {
            return file.length;
        }
        if (typeof Blob !== 'undefined' && file instanceof Blob) {
            return file.size;
        }
        if (typeof File !== 'undefined' && file instanceof File) {
            return file.size;
        }
        // 기타 경우에 대한 fallback
        if (file && typeof file === 'object' && 'size' in file) {
            return file.size;
        }
        return 0;
    }
    getMimeType(file, fileName) {
        if (typeof File !== 'undefined' && file instanceof File) {
            return file.type;
        }
        if (typeof Blob !== 'undefined' && file instanceof Blob) {
            return file.type;
        }
        // Buffer인 경우 파일 확장자로 추정
        const ext = path.extname(fileName).toLowerCase();
        const mimeTypes = {
            '.json': 'application/json',
            '.csv': 'text/csv',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.txt': 'text/plain'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
    async saveFileMetadata(metadata) {
        try {
            const { error } = await this.supabase
                .from('file_metadata')
                .insert({
                id: metadata.id,
                original_name: metadata.originalName,
                file_name: metadata.fileName,
                mime_type: metadata.mimeType,
                size: metadata.size,
                path: metadata.path,
                uploaded_at: metadata.uploadedAt.toISOString(),
                uploaded_by: metadata.uploadedBy,
                metadata: metadata.metadata
            });
            if (error) {
                return Result.fail(`Failed to save file metadata: ${error.message}`);
            }
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`File metadata save error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    mapToFileMetadata(data) {
        return {
            id: data.id,
            originalName: data.original_name,
            fileName: data.file_name,
            mimeType: data.mime_type,
            size: data.size,
            path: data.path,
            uploadedAt: new Date(data.uploaded_at),
            uploadedBy: data.uploaded_by,
            metadata: data.metadata
        };
    }
}
//# sourceMappingURL=SupabaseFileService.js.map