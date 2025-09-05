/**
 * 정적 자산 관리 시스템
 * CDN 최적화, 이미지 압축, 파일 버전 관리 등을 담당
 */
export interface AssetMetadata {
    id: string;
    originalName: string;
    fileName: string;
    mimeType: string;
    size: number;
    url: string;
    cdnUrl?: string;
    uploadedBy: string;
    uploadedAt: Date;
    lastAccessedAt?: Date;
    accessCount: number;
    tags: string[];
    isPublic: boolean;
    expiresAt?: Date;
    hash?: string;
    optimizedVersions?: {
        format: string;
        size: number;
        url: string;
    }[];
    width?: number;
    height?: number;
}
export interface AssetUploadResult {
    success: boolean;
    asset?: AssetMetadata;
    error?: string;
    warnings?: string[];
}
export interface ResponsiveImage {
    originalUrl: string;
    variants: {
        size: number;
        url: string;
        format: string;
        quality: number;
    }[];
}
export interface ImageTransformation {
    width?: number;
    height?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    quality?: number;
    crop?: 'fill' | 'fit' | 'scale';
    blur?: number;
    sharpen?: boolean;
}
export interface AssetUsageStats {
    totalAssets: number;
    totalSize: number;
    byType: Record<string, {
        count: number;
        size: number;
    }>;
    mostAccessed: AssetMetadata[];
    recentlyUploaded: AssetMetadata[];
    expiringSoon: AssetMetadata[];
}
export interface CacheInvalidationResult {
    success: boolean;
    invalidatedUrls: string[];
    failedUrls: string[];
    totalProcessed: number;
}
export interface AssetCleanupResult {
    success: boolean;
    deletedAssets: number;
    freedSpace: number;
    errors: string[];
}
export interface IAssetManager {
    uploadAsset(file: Buffer, metadata: Partial<AssetMetadata>): Promise<AssetUploadResult>;
    getAsset(id: string): Promise<AssetMetadata | null>;
    deleteAsset(id: string): Promise<boolean>;
    listAssets(filters?: {
        userId?: string;
        mimeType?: string;
        tags?: string[];
        isPublic?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<AssetMetadata[]>;
    generateResponsiveImages(assetId: string, sizes: number[]): Promise<ResponsiveImage>;
    transformImage(assetId: string, transformation: ImageTransformation): Promise<string>;
    getUsageStats(userId?: string): Promise<AssetUsageStats>;
    invalidateCache(pattern: string): Promise<CacheInvalidationResult>;
    cleanupExpiredAssets(): Promise<AssetCleanupResult>;
    updateAssetMetadata(id: string, updates: Partial<AssetMetadata>): Promise<boolean>;
}
export interface CDNConfig {
    baseUrl: string;
    regions: string[];
    cacheHeaders: {
        images: string;
        scripts: string;
        styles: string;
        fonts: string;
    };
    imageOptimization: {
        enabled: boolean;
        formats: ('webp' | 'avif' | 'jpeg' | 'png')[];
        qualities: number[];
        sizes: number[];
    };
}
/**
 * 정적 자산 관리자
 */
export declare class StaticAssetManager implements IAssetManager {
    private readonly config;
    private readonly logger;
    private readonly assetCache;
    constructor(config: CDNConfig, logger: any);
    /**
     * 파일 업로드 및 최적화
     */
    uploadAsset(file: Buffer, metadata: Partial<AssetMetadata>): Promise<AssetUploadResult>;
    /**
     * 반응형 이미지 URL 생성
     */
    getResponsiveImageUrls(hash: string, filename: string, sizes?: number[]): Array<{
        url: string;
        size: number;
        format: string;
    }>;
    /**
     * 이미지 변환 및 리사이징
     */
    transformImage(assetId: string, transformation: ImageTransformation): Promise<string>;
    /**
     * 사용 통계 업데이트
     */
    recordAssetAccess(hash: string): Promise<void>;
    /**
     * 사용하지 않는 자산 정리
     */
    cleanupUnusedAssets(olderThanDays?: number): Promise<{
        deletedCount: number;
        freedSpace: number;
    }>;
    /**
     * CDN 캐시 무효화
     */
    invalidateCDNCache(paths: string[]): Promise<{
        success: boolean;
        invalidatedPaths: string[];
        failedPaths: string[];
    }>;
    /**
     * 자산 사용 통계 조회
     */
    getAssetUsageStats(timeframe?: 'day' | 'week' | 'month'): Promise<{
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
    }>;
    /**
     * 파일 해시 생성
     */
    private generateFileHash;
    /**
     * 메타데이터 추출
     */
    private extractMetadata;
    /**
     * 이미지 최적화
     */
    private optimizeImage;
    /**
     * CDN URL 생성
     */
    private buildCDNUrl;
    /**
     * 파일 확장자 추출
     */
    private getFileExtension;
    /**
     * MIME 타입 추출
     */
    private getMimeType;
    /**
     * 이미지 파일 여부 확인
     */
    private isImageFile;
    /**
     * CDN 폴더 결정
     */
    private getCDNFolder;
    /**
     * 실제 CDN 업로드 (구현체 의존적)
     */
    private uploadToCDN;
    /**
     * 이미지 차원 정보 추출 (모의 구현)
     */
    private getImageDimensions;
    /**
     * 이미지 최적화 수행 (모의 구현)
     */
    private performImageOptimization;
    /**
     * 기타 헬퍼 메서드들 (모의 구현)
     */
    private saveAssetMetadata;
    private updateAssetStats;
    private deleteFromCDN;
    private deleteAssetMetadata;
    private performCDNInvalidation;
    private generateTransformKey;
    private getTransformedImageUrl;
    private downloadFromCDN;
    private performImageTransformation;
    private cacheTransformResult;
    getAsset(id: string): Promise<AssetMetadata | null>;
    deleteAsset(id: string): Promise<boolean>;
    listAssets(filters?: {
        userId?: string;
        mimeType?: string;
        tags?: string[];
        isPublic?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<AssetMetadata[]>;
    generateResponsiveImages(assetId: string, sizes: number[]): Promise<ResponsiveImage>;
    getUsageStats(userId?: string): Promise<AssetUsageStats>;
    invalidateCache(pattern: string): Promise<CacheInvalidationResult>;
    cleanupExpiredAssets(): Promise<AssetCleanupResult>;
    updateAssetMetadata(id: string, updates: Partial<AssetMetadata>): Promise<boolean>;
}
//# sourceMappingURL=StaticAssetManager.d.ts.map