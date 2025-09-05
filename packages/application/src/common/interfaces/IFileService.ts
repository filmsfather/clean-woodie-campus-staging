import { Result } from '@woodie/domain/common/Result';

export interface FileUploadOptions {
  maxSize?: number; // bytes
  allowedTypes?: string[]; // MIME types
  generateUniqueFileName?: boolean;
  preserveOriginalName?: boolean;
  metadata?: Record<string, any>;
}

export interface FileDownloadOptions {
  inline?: boolean; // true: 브라우저에서 바로 열기, false: 다운로드
  filename?: string; // 다운로드 시 파일명 지정
  expiresIn?: number; // 서명된 URL 만료 시간 (초)
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
  // 파일 업로드
  uploadFile(
    file: Buffer | Blob | File,
    fileName: string,
    options?: FileUploadOptions
  ): Promise<Result<FileMetadata>>;

  // 다중 파일 업로드
  uploadFiles(
    files: Array<{ file: Buffer | Blob | File; fileName: string }>,
    options?: FileUploadOptions
  ): Promise<Result<FileProcessingResult>>;

  // 파일 다운로드 URL 생성
  getDownloadUrl(
    fileId: string,
    options?: FileDownloadOptions
  ): Promise<Result<string>>;

  // 파일 메타데이터 조회
  getFileMetadata(fileId: string): Promise<Result<FileMetadata>>;

  // 파일 삭제
  deleteFile(fileId: string): Promise<Result<void>>;

  // 파일 존재 여부 확인
  fileExists(fileId: string): Promise<Result<boolean>>;

  // 파일 내용 읽기
  readFile(fileId: string): Promise<Result<Buffer>>;

  // 텍스트 파일 읽기
  readTextFile(fileId: string, encoding?: string): Promise<Result<string>>;

  // JSON 파일 파싱
  readJsonFile<T>(fileId: string): Promise<Result<T>>;

  // JSON 파일 저장
  saveJsonFile<T>(
    data: T,
    fileName: string,
    options?: FileUploadOptions
  ): Promise<Result<FileMetadata>>;

  // 임시 파일 정리
  cleanupTempFiles(olderThanHours?: number): Promise<Result<number>>;
}