/**
 * 자산 관리자 인터페이스
 * CDN 구현 세부사항을 숨기는 추상화 레이어
 */
export interface AssetMetadata {
    originalName: string;
    hash: string;
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
    uploadedAt: Date;
    lastAccessed: Date;
    accessCount: number;
}
export interface AssetUploadResult {
    url: string;
    hash: string;
    metadata: AssetMetadata;
}
export interface ResponsiveImage {
    url: string;
    size: number;
    format: string;
}
export interface ImageTransformation {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    crop?: 'fill' | 'fit' | 'crop';
}
export interface AssetUsageStats {
    totalAssets: number;
    totalSize: number;
    topAssets: Array<{
        hash: string;
        filename: string;
        accessCount: number;
        size: number;
    }>;
    sizeByType: Record<string, number>;
    accessesByType: Record<string, number>;
}
export interface CacheInvalidationResult {
    success: boolean;
    invalidatedPaths: string[];
    failedPaths: string[];
}
export interface AssetCleanupResult {
    deletedCount: number;
    freedSpace: number;
}
export interface IAssetManager {
    /**
     * 파일 업로드 및 최적화
     */
    uploadAsset(file: Buffer | ReadableStream, filename: string, options?: {
        optimize?: boolean;
        generateThumbnails?: boolean;
        customCacheControl?: string;
    }): Promise<AssetUploadResult>;
    /**
     * 반응형 이미지 URL 생성
     */
    getResponsiveImageUrls(hash: string, filename: string, sizes?: number[]): ResponsiveImage[];
    /**
     * 이미지 변환 및 리사이징
     */
    transformImage(hash: string, transformations: ImageTransformation): Promise<string>;
    /**
     * 사용 통계 업데이트
     */
    recordAssetAccess(hash: string): Promise<void>;
    /**
     * 사용하지 않는 자산 정리
     */
    cleanupUnusedAssets(olderThanDays?: number): Promise<AssetCleanupResult>;
    /**
     * 캐시 무효화
     */
    invalidateCache(paths: string[]): Promise<CacheInvalidationResult>;
    /**
     * 자산 사용 통계 조회
     */
    getUsageStats(timeframe?: 'day' | 'week' | 'month'): Promise<AssetUsageStats>;
}
//# sourceMappingURL=IAssetManager.d.ts.map