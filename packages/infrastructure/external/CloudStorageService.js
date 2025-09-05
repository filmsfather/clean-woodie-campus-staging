import { Result } from '@woodie/domain/common/Result';
export class CloudStorageService {
    logger;
    config;
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
    }
    // 폴더 생성 (논리적)
    async createFolder(folderPath) {
        const folderKey = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
        const emptyBuffer = Buffer.alloc(0);
        const result = await this.uploadFile(folderKey, emptyBuffer, {
            contentType: 'application/x-directory'
        });
        if (result.isFailure) {
            return Result.fail(result.getErrorValue());
        }
        return Result.ok();
    }
    // 폴더 내 모든 파일 삭제
    async deleteFolder(folderPath) {
        try {
            const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
            const listResult = await this.listFiles({ prefix, maxKeys: 1000 });
            if (listResult.isFailure) {
                return Result.fail('Failed to list files for deletion');
            }
            const files = listResult.getValue().objects;
            let deletedCount = 0;
            const failedDeletes = [];
            // 병렬 삭제 (최대 10개씩)
            const batchSize = 10;
            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize);
                const deletePromises = batch.map(async (file) => {
                    const deleteResult = await this.deleteFile(file.key);
                    if (deleteResult.isSuccess) {
                        deletedCount++;
                    }
                    else {
                        failedDeletes.push(file.key);
                    }
                });
                await Promise.all(deletePromises);
            }
            this.logger.info('Folder deletion completed', {
                folderPath,
                deletedCount,
                failedCount: failedDeletes.length
            });
            return Result.ok({ deletedCount, failedDeletes });
        }
        catch (error) {
            this.logger.error('Failed to delete folder', {
                error: error instanceof Error ? error.message : String(error),
                folderPath
            });
            return Result.fail('Failed to delete folder');
        }
    }
    // 파일 크기 및 스토리지 사용량 통계
    async getStorageStatistics() {
        try {
            const listResult = await this.listFiles({ maxKeys: 10000, includeMetadata: true });
            if (listResult.isFailure) {
                return Result.fail('Failed to retrieve storage statistics');
            }
            const files = listResult.getValue().objects;
            if (files.length === 0) {
                return Result.ok({
                    totalFiles: 0,
                    totalSize: 0,
                    averageFileSize: 0,
                    filesByType: {},
                    sizeByType: {}
                });
            }
            let totalSize = 0;
            const filesByType = {};
            const sizeByType = {};
            let oldestFile = files[0];
            let newestFile = files[0];
            files.forEach(file => {
                totalSize += file.size;
                // 파일 타입 추출 (확장자 기준)
                const extension = file.key.split('.').pop()?.toLowerCase() || 'unknown';
                filesByType[extension] = (filesByType[extension] || 0) + 1;
                sizeByType[extension] = (sizeByType[extension] || 0) + file.size;
                // 가장 오래된/새로운 파일 찾기
                if (file.lastModified < oldestFile.lastModified) {
                    oldestFile = file;
                }
                if (file.lastModified > newestFile.lastModified) {
                    newestFile = file;
                }
            });
            const statistics = {
                totalFiles: files.length,
                totalSize,
                averageFileSize: totalSize / files.length,
                filesByType,
                sizeByType,
                oldestFile: { key: oldestFile.key, lastModified: oldestFile.lastModified },
                newestFile: { key: newestFile.key, lastModified: newestFile.lastModified }
            };
            return Result.ok(statistics);
        }
        catch (error) {
            this.logger.error('Failed to get storage statistics', {
                error: error instanceof Error ? error.message : String(error)
            });
            return Result.fail('Failed to get storage statistics');
        }
    }
    // 파일 검색 (메타데이터 기반)
    async searchFiles(query) {
        try {
            const listResult = await this.listFiles({ includeMetadata: true, maxKeys: 10000 });
            if (listResult.isFailure) {
                return Result.fail('Failed to search files');
            }
            const allFiles = listResult.getValue().objects;
            const filteredFiles = allFiles.filter(file => {
                // 파일명 필터
                if (query.filename && !file.key.toLowerCase().includes(query.filename.toLowerCase())) {
                    return false;
                }
                // 크기 필터
                if (query.sizeMin && file.size < query.sizeMin) {
                    return false;
                }
                if (query.sizeMax && file.size > query.sizeMax) {
                    return false;
                }
                // 날짜 필터
                if (query.uploadedAfter && file.lastModified < query.uploadedAfter) {
                    return false;
                }
                if (query.uploadedBefore && file.lastModified > query.uploadedBefore) {
                    return false;
                }
                // 메타데이터 필터 (있는 경우에만)
                if (file.metadata) {
                    if (query.contentType && file.metadata.mimeType !== query.contentType) {
                        return false;
                    }
                    if (query.uploadedBy && file.metadata.uploadedBy !== query.uploadedBy) {
                        return false;
                    }
                    if (query.tags && query.tags.length > 0) {
                        const fileTags = file.metadata.tags || [];
                        if (!query.tags.every(tag => fileTags.includes(tag))) {
                            return false;
                        }
                    }
                }
                return true;
            });
            this.logger.info('File search completed', {
                totalFiles: allFiles.length,
                matchedFiles: filteredFiles.length,
                query
            });
            return Result.ok(filteredFiles);
        }
        catch (error) {
            this.logger.error('File search failed', {
                error: error instanceof Error ? error.message : String(error),
                query
            });
            return Result.fail('File search failed');
        }
    }
    // 배치 파일 작업
    async batchOperation(operations) {
        try {
            this.logger.info('Starting batch operation', {
                operationCount: operations.length,
                operationTypes: operations.reduce((acc, op) => {
                    acc[op.type] = (acc[op.type] || 0) + 1;
                    return acc;
                }, {})
            });
            const results = await Promise.allSettled(operations.map(async (operation) => {
                switch (operation.type) {
                    case 'upload':
                        if (!operation.data) {
                            throw new Error('Upload operation requires data');
                        }
                        return await this.uploadFile(operation.key, operation.data, operation.options);
                    case 'download':
                        return await this.downloadFile(operation.key, operation.options);
                    case 'delete':
                        return await this.deleteFile(operation.key);
                    case 'copy':
                        if (!operation.destinationKey) {
                            throw new Error('Copy operation requires destinationKey');
                        }
                        return await this.copyFile(operation.key, operation.destinationKey, operation.options);
                    default:
                        throw new Error(`Unknown operation type: ${operation.type}`);
                }
            }));
            const processedResults = results.map((result, index) => {
                const operation = operations[index];
                if (result.status === 'fulfilled') {
                    const operationResult = result.value;
                    return {
                        operation,
                        success: operationResult.isSuccess,
                        error: operationResult.isFailure ? operationResult.getErrorValue() : undefined,
                        result: operationResult.isSuccess ? operationResult.getValue() : undefined
                    };
                }
                else {
                    return {
                        operation,
                        success: false,
                        error: result.reason instanceof Error ? result.reason.message : String(result.reason)
                    };
                }
            });
            const successCount = processedResults.filter(r => r.success).length;
            const failureCount = processedResults.filter(r => !r.success).length;
            this.logger.info('Batch operation completed', {
                totalOperations: operations.length,
                successCount,
                failureCount
            });
            return Result.ok(processedResults);
        }
        catch (error) {
            this.logger.error('Batch operation failed', {
                error: error instanceof Error ? error.message : String(error),
                operationCount: operations.length
            });
            return Result.fail('Batch operation failed');
        }
    }
    // 파일 백업 (다른 버킷이나 스토리지로 복사)
    async backupFile(key, backupStorageService, backupKey) {
        try {
            // 원본 파일 다운로드
            const downloadResult = await this.downloadFile(key);
            if (downloadResult.isFailure) {
                return Result.fail(`Failed to download source file: ${downloadResult.getErrorValue()}`);
            }
            const { data, metadata } = downloadResult.getValue();
            const targetKey = backupKey || key;
            // 백업 스토리지에 업로드
            const uploadResult = await backupStorageService.uploadFile(targetKey, data, {
                contentType: metadata.mimeType,
                metadata: {
                    originalKey: key,
                    backupTimestamp: new Date().toISOString(),
                    originalUploadedBy: metadata.uploadedBy
                }
            });
            if (uploadResult.isFailure) {
                return Result.fail(`Failed to upload backup file: ${uploadResult.getErrorValue()}`);
            }
            this.logger.info('File backup completed', {
                sourceKey: key,
                targetKey,
                fileSize: data.length
            });
            return Result.ok();
        }
        catch (error) {
            this.logger.error('File backup failed', {
                error: error instanceof Error ? error.message : String(error),
                sourceKey: key
            });
            return Result.fail('File backup failed');
        }
    }
    // 유틸리티: 파일 경로 정규화
    normalizeKey(key) {
        return key.replace(/\/+/g, '/').replace(/^\//, '');
    }
    // 유틸리티: MIME 타입 추론
    inferContentType(filename) {
        const extension = filename.split('.').pop()?.toLowerCase();
        const mimeTypes = {
            // 이미지
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            // 문서
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            // 텍스트
            'txt': 'text/plain',
            'html': 'text/html',
            'css': 'text/css',
            'js': 'application/javascript',
            'json': 'application/json',
            'xml': 'application/xml',
            // 압축
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed',
            // 비디오
            'mp4': 'video/mp4',
            'avi': 'video/x-msvideo',
            'mov': 'video/quicktime',
            // 오디오
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'flac': 'audio/flac'
        };
        return mimeTypes[extension || ''] || 'application/octet-stream';
    }
    // 유틸리티: 파일 크기 포맷팅
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}
//# sourceMappingURL=CloudStorageService.js.map