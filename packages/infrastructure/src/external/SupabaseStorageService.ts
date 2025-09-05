import { SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
import { CloudStorageService, StorageConfig, FileMetadata, UploadOptions, DownloadOptions, ListOptions, StorageObject, ListResult } from './CloudStorageService';

export class SupabaseStorageService extends CloudStorageService {
  private readonly supabase: SupabaseClient;

  constructor(logger: ILogger, config: StorageConfig, supabaseClient: SupabaseClient) {
    super(logger, config);
    this.supabase = supabaseClient;

    this.logger.info('Supabase storage service initialized', {
      bucket: config.bucketName
    });
  }

  async uploadFile(
    key: string,
    fileBuffer: Buffer,
    options: UploadOptions = {}
  ): Promise<Result<{ url: string; metadata: FileMetadata }>> {
    try {
      const normalizedKey = this.normalizeKey(key);
      const contentType = options.contentType || this.inferContentType(normalizedKey);

      // Supabase Storage에 파일 업로드
      const { data, error } = await this.supabase.storage
        .from(this.config.bucketName)
        .upload(normalizedKey, fileBuffer, {
          contentType,
          cacheControl: options.cacheControl || '3600',
          upsert: true,
          metadata: options.metadata
        });

      if (error) {
        throw new Error(`Supabase storage upload error: ${error.message}`);
      }

      // 공개 URL 생성
      const { data: urlData } = this.supabase.storage
        .from(this.config.bucketName)
        .getPublicUrl(normalizedKey);

      // 메타데이터 생성
      const metadata: FileMetadata = {
        filename: normalizedKey.split('/').pop() || normalizedKey,
        mimeType: contentType,
        size: fileBuffer.length,
        uploadedAt: new Date(),
        uploadedBy: options.metadata?.uploadedBy || 'system',
        tags: options.tags ? Object.keys(options.tags) : undefined,
        customMetadata: options.metadata
      };

      this.logger.info('File uploaded to Supabase Storage', {
        key: normalizedKey,
        size: fileBuffer.length,
        contentType,
        path: data.path
      });

      return Result.ok({
        url: urlData.publicUrl,
        metadata
      });

    } catch (error) {
      this.logger.error('Failed to upload file to Supabase Storage', {
        error: error instanceof Error ? error.message : String(error),
        key
      });
      return Result.fail('Failed to upload file to Supabase Storage');
    }
  }

  async downloadFile(
    key: string,
    options: DownloadOptions = {}
  ): Promise<Result<{ data: Buffer; metadata: FileMetadata }>> {
    try {
      const normalizedKey = this.normalizeKey(key);

      // Supabase Storage에서 파일 다운로드
      const { data, error } = await this.supabase.storage
        .from(this.config.bucketName)
        .download(normalizedKey);

      if (error) {
        throw new Error(`Supabase storage download error: ${error.message}`);
      }

      if (!data) {
        return Result.fail('Empty response from Supabase Storage');
      }

      // Blob을 Buffer로 변환
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 메타데이터 조회
      const metadataResult = await this.getFileMetadata(normalizedKey);
      const metadata = metadataResult.isSuccess 
        ? metadataResult.getValue()
        : {
            filename: normalizedKey.split('/').pop() || normalizedKey,
            mimeType: data.type || 'application/octet-stream',
            size: buffer.length,
            uploadedAt: new Date(),
            uploadedBy: 'unknown'
          };

      this.logger.debug('File downloaded from Supabase Storage', {
        key: normalizedKey,
        size: buffer.length,
        contentType: data.type
      });

      return Result.ok({ data: buffer, metadata });

    } catch (error) {
      this.logger.error('Failed to download file from Supabase Storage', {
        error: error instanceof Error ? error.message : String(error),
        key
      });
      return Result.fail('Failed to download file from Supabase Storage');
    }
  }

  async deleteFile(key: string): Promise<Result<void>> {
    try {
      const normalizedKey = this.normalizeKey(key);

      const { error } = await this.supabase.storage
        .from(this.config.bucketName)
        .remove([normalizedKey]);

      if (error) {
        throw new Error(`Supabase storage delete error: ${error.message}`);
      }

      this.logger.info('File deleted from Supabase Storage', { key: normalizedKey });
      return Result.ok<void>();

    } catch (error) {
      this.logger.error('Failed to delete file from Supabase Storage', {
        error: error instanceof Error ? error.message : String(error),
        key
      });
      return Result.fail('Failed to delete file from Supabase Storage');
    }
  }

  async listFiles(options: ListOptions = {}): Promise<Result<ListResult>> {
    try {
      const listOptions: any = {
        limit: options.maxKeys || 1000,
        offset: 0
      };

      if (options.prefix) {
        listOptions.prefix = options.prefix;
      }

      const { data, error } = await this.supabase.storage
        .from(this.config.bucketName)
        .list(options.prefix || '', listOptions);

      if (error) {
        throw new Error(`Supabase storage list error: ${error.message}`);
      }

      if (!data) {
        return Result.ok({
          objects: [],
          hasMore: false
        });
      }

      // 파일 객체 변환
      const objects: StorageObject[] = data
        .filter(item => item.name !== '.emptyFolderPlaceholder') // Supabase의 빈 폴더 플레이스홀더 제외
        .map(item => {
          const fullPath = options.prefix 
            ? `${options.prefix}/${item.name}`.replace(/\/+/g, '/')
            : item.name;

          const { data: urlData } = this.supabase.storage
            .from(this.config.bucketName)
            .getPublicUrl(fullPath);

          return {
            key: fullPath,
            size: item.metadata?.size || 0,
            lastModified: new Date(item.updated_at || item.created_at),
            etag: item.metadata?.eTag || '',
            url: urlData.publicUrl
          };
        });

      // 메타데이터 포함 요청인 경우
      if (options.includeMetadata) {
        for (const obj of objects) {
          const metadataResult = await this.getFileMetadata(obj.key);
          if (metadataResult.isSuccess) {
            obj.metadata = metadataResult.getValue();
          }
        }
      }

      const result: ListResult = {
        objects,
        hasMore: data.length === (options.maxKeys || 1000), // 요청한 만큼 왔으면 더 있을 가능성
        totalCount: data.length
      };

      this.logger.debug('Files listed from Supabase Storage', {
        prefix: options.prefix,
        objectCount: objects.length,
        hasMore: result.hasMore
      });

      return Result.ok(result);

    } catch (error) {
      this.logger.error('Failed to list files from Supabase Storage', {
        error: error instanceof Error ? error.message : String(error),
        options
      });
      return Result.fail('Failed to list files from Supabase Storage');
    }
  }

  async fileExists(key: string): Promise<Result<boolean>> {
    try {
      const normalizedKey = this.normalizeKey(key);

      // Supabase Storage에서는 파일 정보를 조회해서 존재 여부 확인
      const { data, error } = await this.supabase.storage
        .from(this.config.bucketName)
        .list('', {
          limit: 1,
          search: normalizedKey
        });

      if (error) {
        // 에러가 발생하면 존재하지 않는 것으로 간주
        return Result.ok(false);
      }

      const exists = data && data.some(item => {
        const itemPath = item.name;
        return itemPath === normalizedKey || itemPath.endsWith(`/${normalizedKey}`);
      });

      return Result.ok(!!exists);

    } catch (error) {
      this.logger.error('Failed to check file existence in Supabase Storage', {
        error: error instanceof Error ? error.message : String(error),
        key
      });
      return Result.fail('Failed to check file existence');
    }
  }

  async getFileMetadata(key: string): Promise<Result<FileMetadata>> {
    try {
      const normalizedKey = this.normalizeKey(key);

      // 파일 정보 조회를 위해 부모 폴더에서 검색
      const pathParts = normalizedKey.split('/');
      const filename = pathParts.pop() || '';
      const folderPath = pathParts.join('/') || '';

      const { data, error } = await this.supabase.storage
        .from(this.config.bucketName)
        .list(folderPath, {
          limit: 1000 // 충분히 큰 수로 설정
        });

      if (error) {
        throw new Error(`Supabase storage metadata error: ${error.message}`);
      }

      // 해당 파일 찾기
      const fileInfo = data?.find(item => item.name === filename);

      if (!fileInfo) {
        return Result.fail('File not found');
      }

      const metadata: FileMetadata = {
        filename: fileInfo.name,
        mimeType: fileInfo.metadata?.mimetype || this.inferContentType(fileInfo.name),
        size: fileInfo.metadata?.size || 0,
        uploadedAt: new Date(fileInfo.created_at),
        uploadedBy: fileInfo.metadata?.uploadedBy || 'unknown',
        customMetadata: fileInfo.metadata
      };

      return Result.ok(metadata);

    } catch (error) {
      this.logger.error('Failed to get file metadata from Supabase Storage', {
        error: error instanceof Error ? error.message : String(error),
        key
      });
      return Result.fail('Failed to get file metadata');
    }
  }

  async generateSignedUrl(
    key: string,
    expirationSeconds: number,
    method: 'GET' | 'PUT' | 'DELETE' = 'GET'
  ): Promise<Result<string>> {
    try {
      const normalizedKey = this.normalizeKey(key);

      if (method !== 'GET') {
        // Supabase Storage는 GET용 signed URL만 지원
        // PUT, DELETE의 경우 공개 URL 반환
        const { data } = this.supabase.storage
          .from(this.config.bucketName)
          .getPublicUrl(normalizedKey);
        
        return Result.ok(data.publicUrl);
      }

      const { data, error } = await this.supabase.storage
        .from(this.config.bucketName)
        .createSignedUrl(normalizedKey, expirationSeconds);

      if (error) {
        throw new Error(`Supabase storage signed URL error: ${error.message}`);
      }

      if (!data?.signedUrl) {
        return Result.fail('Failed to generate signed URL');
      }

      this.logger.debug('Signed URL generated for Supabase Storage', {
        key: normalizedKey,
        method,
        expirationSeconds
      });

      return Result.ok(data.signedUrl);

    } catch (error) {
      this.logger.error('Failed to generate signed URL for Supabase Storage', {
        error: error instanceof Error ? error.message : String(error),
        key,
        method
      });
      return Result.fail('Failed to generate signed URL');
    }
  }

  async initiateMultipartUpload(
    key: string,
    options: UploadOptions = {}
  ): Promise<Result<string>> {
    // Supabase Storage는 자체적으로 대용량 파일을 처리하므로
    // 일반 업로드와 동일하게 처리하고 임시 ID 반환
    try {
      const uploadId = `supabase_upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.logger.info('Multipart upload initiated for Supabase Storage (simulated)', {
        key,
        uploadId
      });

      return Result.ok(uploadId);

    } catch (error) {
      this.logger.error('Failed to initiate multipart upload for Supabase Storage', {
        error: error instanceof Error ? error.message : String(error),
        key
      });
      return Result.fail('Failed to initiate multipart upload');
    }
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ partNumber: number; etag: string }>
  ): Promise<Result<{ url: string; metadata: FileMetadata }>> {
    // Supabase Storage에서는 멀티파트 업로드가 자동으로 처리되므로
    // 실제로는 일반 업로드 결과를 반환
    try {
      // 이 시점에서는 이미 파일이 업로드된 상태이므로 메타데이터만 조회
      const metadataResult = await this.getFileMetadata(key);
      
      if (metadataResult.isFailure) {
        return Result.fail('Failed to get uploaded file metadata');
      }

      const { data } = this.supabase.storage
        .from(this.config.bucketName)
        .getPublicUrl(key);

      this.logger.info('Multipart upload completed for Supabase Storage', {
        key,
        uploadId
      });

      return Result.ok({
        url: data.publicUrl,
        metadata: metadataResult.getValue()
      });

    } catch (error) {
      this.logger.error('Failed to complete multipart upload for Supabase Storage', {
        error: error instanceof Error ? error.message : String(error),
        key,
        uploadId
      });
      return Result.fail('Failed to complete multipart upload');
    }
  }

  async copyFile(
    sourceKey: string,
    destinationKey: string,
    options: UploadOptions = {}
  ): Promise<Result<void>> {
    try {
      const normalizedSourceKey = this.normalizeKey(sourceKey);
      const normalizedDestinationKey = this.normalizeKey(destinationKey);

      // Supabase Storage는 직접적인 copy 메서드가 없으므로 download 후 upload
      const downloadResult = await this.downloadFile(normalizedSourceKey);
      if (downloadResult.isFailure) {
        return Result.fail(`Failed to download source file: ${downloadResult.getErrorValue()}`);
      }

      const { data } = downloadResult.getValue();
      const uploadResult = await this.uploadFile(normalizedDestinationKey, data, options);
      
      if (uploadResult.isFailure) {
        return Result.fail(`Failed to upload copied file: ${uploadResult.getErrorValue()}`);
      }

      this.logger.info('File copied in Supabase Storage', {
        sourceKey: normalizedSourceKey,
        destinationKey: normalizedDestinationKey
      });

      return Result.ok<void>();

    } catch (error) {
      this.logger.error('Failed to copy file in Supabase Storage', {
        error: error instanceof Error ? error.message : String(error),
        sourceKey,
        destinationKey
      });
      return Result.fail('Failed to copy file');
    }
  }

  // Supabase Storage 특화 메서드들

  // 버킷 정보 조회
  async getBucketInfo(): Promise<Result<{
    name: string;
    createdAt: Date;
    public: boolean;
    allowedMimeTypes?: string[];
    fileSizeLimit?: number;
  }>> {
    try {
      // Supabase 클라이언트를 통해 버킷 정보 조회 (실제 API 호출)
      // 현재는 기본 정보만 반환
      const bucketInfo = {
        name: this.config.bucketName,
        createdAt: new Date(),
        public: true, // 기본적으로 public 버킷으로 가정
        allowedMimeTypes: undefined,
        fileSizeLimit: undefined
      };

      return Result.ok(bucketInfo);

    } catch (error) {
      this.logger.error('Failed to get bucket info from Supabase Storage', {
        error: error instanceof Error ? error.message : String(error)
      });
      return Result.fail('Failed to get bucket info');
    }
  }

  // 파일 변환 (이미지 리사이징 등)
  async getTransformedUrl(
    key: string,
    transformations: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'png' | 'jpg';
    }
  ): Promise<Result<string>> {
    try {
      const normalizedKey = this.normalizeKey(key);
      
      // Supabase Storage의 이미지 변환 기능 사용
      let transformationString = '';
      
      if (transformations.width) {
        transformationString += `width=${transformations.width}&`;
      }
      if (transformations.height) {
        transformationString += `height=${transformations.height}&`;
      }
      if (transformations.quality) {
        transformationString += `quality=${transformations.quality}&`;
      }
      if (transformations.format) {
        transformationString += `format=${transformations.format}&`;
      }

      // 변환 매개변수가 있으면 URL에 추가
      const { data } = this.supabase.storage
        .from(this.config.bucketName)
        .getPublicUrl(normalizedKey, {
          transform: {
            width: transformations.width,
            height: transformations.height,
            quality: transformations.quality,
            format: transformations.format as 'origin' | undefined
          }
        });

      return Result.ok(data.publicUrl);

    } catch (error) {
      this.logger.error('Failed to get transformed URL from Supabase Storage', {
        error: error instanceof Error ? error.message : String(error),
        key,
        transformations
      });
      return Result.fail('Failed to get transformed URL');
    }
  }
}