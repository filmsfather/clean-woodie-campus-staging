/**
 * 정적 자산 관리 시스템
 * CDN 최적화, 이미지 압축, 파일 버전 관리 등을 담당
 */

import { IAssetManager, AssetMetadata, AssetUploadResult, ResponsiveImage, ImageTransformation, AssetUsageStats, CacheInvalidationResult, AssetCleanupResult } from '@woodie/application/infrastructure/interfaces/IAssetManager'

export interface CDNConfig {
  baseUrl: string
  regions: string[]
  cacheHeaders: {
    images: string // 'public, max-age=31536000' 등
    scripts: string
    styles: string
    fonts: string
  }
  imageOptimization: {
    enabled: boolean
    formats: ('webp' | 'avif' | 'jpeg' | 'png')[]
    qualities: number[]
    sizes: number[]
  }
}

/**
 * 정적 자산 관리자
 */
export class StaticAssetManager implements IAssetManager {
  private readonly assetCache = new Map<string, AssetMetadata>()

  constructor(
    private readonly config: CDNConfig,
    private readonly logger: any
  ) {}

  /**
   * 파일 업로드 및 최적화
   */
  async uploadAsset(
    file: Buffer | ReadableStream,
    filename: string,
    options?: {
      optimize?: boolean
      generateThumbnails?: boolean
      customCacheControl?: string
    }
  ): Promise<{
    url: string
    hash: string
    metadata: AssetMetadata
  }> {
    try {
      // 1. 파일 해시 생성
      const hash = await this.generateFileHash(file)
      
      // 2. 중복 파일 체크
      const existingAsset = this.assetCache.get(hash)
      if (existingAsset) {
        return {
          url: this.buildCDNUrl(hash, filename),
          hash,
          metadata: existingAsset
        }
      }

      // 3. 메타데이터 추출
      const metadata = await this.extractMetadata(file, filename)
      metadata.hash = hash

      // 4. 이미지 최적화 (이미지 파일인 경우)
      if (this.isImageFile(filename) && options?.optimize && this.config.imageOptimization.enabled) {
        const optimizedVersions = await this.optimizeImage(file, metadata)
        metadata.optimizedVersions = optimizedVersions
      }

      // 5. CDN에 업로드
      await this.uploadToCDN(file, hash, filename, options?.customCacheControl)

      // 6. 메타데이터 캐시에 저장
      this.assetCache.set(hash, metadata)

      // 7. 데이터베이스에 메타데이터 저장 (영구 저장)
      await this.saveAssetMetadata(metadata)

      return {
        url: this.buildCDNUrl(hash, filename),
        hash,
        metadata
      }

    } catch (error) {
      this.logger.error('Asset upload failed', { filename, error })
      throw new Error(`파일 업로드 실패: ${error}`)
    }
  }

  /**
   * 반응형 이미지 URL 생성
   */
  getResponsiveImageUrls(
    hash: string, 
    filename: string, 
    sizes: number[] = [320, 640, 1024, 1920]
  ): Array<{
    url: string
    size: number
    format: string
  }> {
    const metadata = this.assetCache.get(hash)
    if (!metadata || !this.isImageFile(filename)) {
      return [{
        url: this.buildCDNUrl(hash, filename),
        size: metadata?.width || 0,
        format: this.getFileExtension(filename)
      }]
    }

    const urls: Array<{ url: string; size: number; format: string }> = []

    // 원본 이미지
    urls.push({
      url: this.buildCDNUrl(hash, filename),
      size: metadata.width || 0,
      format: this.getFileExtension(filename)
    })

    // 최적화된 버전들
    if (metadata.optimizedVersions) {
      for (const optimized of metadata.optimizedVersions) {
        urls.push({
          url: optimized.url,
          size: optimized.size,
          format: optimized.format
        })
      }
    }

    return urls.sort((a, b) => a.size - b.size)
  }

  /**
   * 이미지 변환 및 리사이징
   */
  async transformImage(
    hash: string,
    transformations: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'avif' | 'jpeg' | 'png'
      crop?: 'fill' | 'fit' | 'crop'
    }
  ): Promise<string> {
    const transformKey = this.generateTransformKey(hash, transformations)
    
    // 1. 기존 변환 결과 확인
    const existingUrl = await this.getTransformedImageUrl(transformKey)
    if (existingUrl) {
      return existingUrl
    }

    // 2. 원본 이미지 다운로드
    const originalImage = await this.downloadFromCDN(hash)
    if (!originalImage) {
      throw new Error('원본 이미지를 찾을 수 없습니다')
    }

    // 3. 이미지 변환 (실제로는 Sharp, ImageMagick 등 사용)
    const transformedImage = await this.performImageTransformation(originalImage, transformations)

    // 4. 변환된 이미지 업로드
    const transformedHash = await this.generateFileHash(transformedImage)
    const transformedFilename = `${hash}_${transformKey}.${transformations.format || 'jpeg'}`
    
    await this.uploadToCDN(transformedImage, transformedHash, transformedFilename)

    // 5. 변환 결과 캐싱
    const transformedUrl = this.buildCDNUrl(transformedHash, transformedFilename)
    await this.cacheTransformResult(transformKey, transformedUrl)

    return transformedUrl
  }

  /**
   * 사용 통계 업데이트
   */
  async recordAssetAccess(hash: string): Promise<void> {
    const metadata = this.assetCache.get(hash)
    if (metadata) {
      metadata.lastAccessed = new Date()
      metadata.accessCount++
      
      // 데이터베이스 업데이트 (비동기)
      setImmediate(() => this.updateAssetStats(hash, metadata))
    }
  }

  /**
   * 사용하지 않는 자산 정리
   */
  async cleanupUnusedAssets(olderThanDays: number = 90): Promise<{
    deletedCount: number
    freedSpace: number
  }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    let deletedCount = 0
    let freedSpace = 0

    for (const [hash, metadata] of this.assetCache) {
      if (metadata.lastAccessed < cutoffDate && metadata.accessCount < 10) {
        try {
          await this.deleteFromCDN(hash)
          await this.deleteAssetMetadata(hash)
          
          this.assetCache.delete(hash)
          deletedCount++
          freedSpace += metadata.size
          
          this.logger.info('Unused asset deleted', { hash, filename: metadata.originalName })
        } catch (error) {
          this.logger.error('Failed to delete unused asset', { hash, error })
        }
      }
    }

    return { deletedCount, freedSpace }
  }

  /**
   * CDN 캐시 무효화
   */
  async invalidateCDNCache(paths: string[]): Promise<{
    success: boolean
    invalidatedPaths: string[]
    failedPaths: string[]
  }> {
    const invalidatedPaths: string[] = []
    const failedPaths: string[] = []

    for (const path of paths) {
      try {
        // 실제로는 CloudFlare, AWS CloudFront 등의 API 호출
        await this.performCDNInvalidation(path)
        invalidatedPaths.push(path)
      } catch (error) {
        failedPaths.push(path)
        this.logger.error('CDN cache invalidation failed', { path, error })
      }
    }

    return {
      success: failedPaths.length === 0,
      invalidatedPaths,
      failedPaths
    }
  }

  /**
   * 자산 사용 통계 조회
   */
  async getAssetUsageStats(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalAssets: number
    totalSize: number
    topAssets: Array<{
      hash: string
      filename: string
      accessCount: number
      size: number
    }>
    sizeByType: Record<string, number>
    accessesByType: Record<string, number>
  }> {
    const stats = {
      totalAssets: this.assetCache.size,
      totalSize: 0,
      topAssets: [] as any[],
      sizeByType: {} as Record<string, number>,
      accessesByType: {} as Record<string, number>
    }

    const assetArray = Array.from(this.assetCache.values())
    
    // 전체 크기 계산
    stats.totalSize = assetArray.reduce((sum, asset) => sum + asset.size, 0)
    
    // 상위 자산 (접근 횟수 기준)
    stats.topAssets = assetArray
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 20)
      .map(asset => ({
        hash: asset.hash,
        filename: asset.originalName,
        accessCount: asset.accessCount,
        size: asset.size
      }))

    // 타입별 통계
    for (const asset of assetArray) {
      const extension = this.getFileExtension(asset.originalName)
      
      stats.sizeByType[extension] = (stats.sizeByType[extension] || 0) + asset.size
      stats.accessesByType[extension] = (stats.accessesByType[extension] || 0) + asset.accessCount
    }

    return stats
  }

  /**
   * 파일 해시 생성
   */
  private async generateFileHash(file: Buffer | ReadableStream): Promise<string> {
    // 실제로는 crypto 모듈을 사용하여 SHA-256 해시 생성
    const crypto = require('crypto')
    const hash = crypto.createHash('sha256')
    
    if (Buffer.isBuffer(file)) {
      hash.update(file)
    } else {
      // ReadableStream 처리
      for await (const chunk of file as any) {
        hash.update(chunk)
      }
    }
    
    return hash.digest('hex')
  }

  /**
   * 메타데이터 추출
   */
  private async extractMetadata(file: Buffer | ReadableStream, filename: string): Promise<AssetMetadata> {
    const stats = Buffer.isBuffer(file) ? { size: file.length } : { size: 0 }
    
    const metadata: AssetMetadata = {
      originalName: filename,
      hash: '',
      size: stats.size,
      mimeType: this.getMimeType(filename),
      uploadedAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0
    }

    // 이미지 파일인 경우 차원 정보 추출
    if (this.isImageFile(filename) && Buffer.isBuffer(file)) {
      const dimensions = await this.getImageDimensions(file)
      metadata.width = dimensions.width
      metadata.height = dimensions.height
    }

    return metadata
  }

  /**
   * 이미지 최적화
   */
  private async optimizeImage(file: Buffer, metadata: AssetMetadata): Promise<AssetMetadata['optimizedVersions']> {
    const optimizedVersions: AssetMetadata['optimizedVersions'] = []

    for (const format of this.config.imageOptimization.formats) {
      for (const quality of this.config.imageOptimization.qualities) {
        try {
          // 실제로는 Sharp 등을 사용한 이미지 최적화
          const optimized = await this.performImageOptimization(file, format, quality)
          const optimizedHash = await this.generateFileHash(optimized)
          const optimizedFilename = `${metadata.hash}_${format}_q${quality}.${format}`
          
          await this.uploadToCDN(optimized, optimizedHash, optimizedFilename)
          
          optimizedVersions.push({
            format,
            quality,
            size: optimized.length,
            url: this.buildCDNUrl(optimizedHash, optimizedFilename)
          })
        } catch (error) {
          this.logger.warn('Image optimization failed', { format, quality, error })
        }
      }
    }

    return optimizedVersions
  }

  /**
   * CDN URL 생성
   */
  private buildCDNUrl(hash: string, filename: string): string {
    const extension = this.getFileExtension(filename)
    const folder = this.getCDNFolder(extension)
    return `${this.config.baseUrl}/${folder}/${hash}.${extension}`
  }

  /**
   * 파일 확장자 추출
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  /**
   * MIME 타입 추출
   */
  private getMimeType(filename: string): string {
    const extension = this.getFileExtension(filename)
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      svg: 'image/svg+xml',
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json',
      pdf: 'application/pdf'
    }
    return mimeTypes[extension] || 'application/octet-stream'
  }

  /**
   * 이미지 파일 여부 확인
   */
  private isImageFile(filename: string): boolean {
    const extension = this.getFileExtension(filename)
    return ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg', 'gif'].includes(extension)
  }

  /**
   * CDN 폴더 결정
   */
  private getCDNFolder(extension: string): string {
    if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg', 'gif'].includes(extension)) {
      return 'images'
    }
    if (['js'].includes(extension)) {
      return 'scripts'
    }
    if (['css'].includes(extension)) {
      return 'styles'
    }
    if (['woff', 'woff2', 'ttf', 'otf'].includes(extension)) {
      return 'fonts'
    }
    return 'assets'
  }

  /**
   * 실제 CDN 업로드 (구현체 의존적)
   */
  private async uploadToCDN(
    file: Buffer, 
    hash: string, 
    filename: string, 
    customCacheControl?: string
  ): Promise<void> {
    // 실제로는 AWS S3, CloudFlare R2, Google Cloud Storage 등에 업로드
    // 여기서는 모의 구현
    console.log(`Uploading ${filename} with hash ${hash} to CDN`)
  }

  /**
   * 이미지 차원 정보 추출 (모의 구현)
   */
  private async getImageDimensions(file: Buffer): Promise<{ width: number; height: number }> {
    // 실제로는 Sharp, image-size 등 사용
    return { width: 1920, height: 1080 }
  }

  /**
   * 이미지 최적화 수행 (모의 구현)
   */
  private async performImageOptimization(
    file: Buffer, 
    format: string, 
    quality: number
  ): Promise<Buffer> {
    // 실제로는 Sharp 등을 사용한 이미지 변환
    return file
  }

  /**
   * 기타 헬퍼 메서드들 (모의 구현)
   */
  private async saveAssetMetadata(metadata: AssetMetadata): Promise<void> {
    // 데이터베이스에 저장
  }

  private async updateAssetStats(hash: string, metadata: AssetMetadata): Promise<void> {
    // 데이터베이스 업데이트
  }

  private async deleteFromCDN(hash: string): Promise<void> {
    // CDN에서 삭제
  }

  private async deleteAssetMetadata(hash: string): Promise<void> {
    // 데이터베이스에서 삭제
  }

  private async performCDNInvalidation(path: string): Promise<void> {
    // CDN 캐시 무효화
  }

  private generateTransformKey(hash: string, transformations: any): string {
    return `${hash}_${JSON.stringify(transformations)}`
  }

  private async getTransformedImageUrl(transformKey: string): Promise<string | null> {
    // 변환된 이미지 URL 조회
    return null
  }

  private async downloadFromCDN(hash: string): Promise<Buffer | null> {
    // CDN에서 파일 다운로드
    return null
  }

  private async performImageTransformation(
    image: Buffer, 
    transformations: any
  ): Promise<Buffer> {
    // 이미지 변환
    return image
  }

  private async cacheTransformResult(transformKey: string, url: string): Promise<void> {
    // 변환 결과 캐싱
  }
}