import { Result } from '../../common/Result';
import { Tag } from '../value-objects/Tag';

// 태그 관리 옵션
export interface TagManagementOptions {
  maxSuggestions?: number;
  similarityThreshold?: number;
  maxRecommendations?: number;
  minWordLengthForAnalysis?: number;
  enableHierarchyAnalysis?: boolean;
  enableClustering?: boolean;
  caseSensitive?: boolean;
}

// 태그 관리 도메인 서비스 인터페이스 (DI를 위한 추상화)
export interface ITagManagementService {
  
  // 태그 자동 완성을 위한 유사도 계산
  findSimilarTags(
    inputTag: string,
    existingTags: Tag[],
    options?: TagManagementOptions
  ): Promise<Result<Tag[]>>;
  
  // 태그 사용 빈도 분석
  analyzeTagUsage(
    problemTags: Tag[][],
    options?: TagManagementOptions
  ): Promise<Result<Array<{ tag: Tag; count: number; percentage: number }>>>;
  
  // 태그 추천 (문제 내용 기반)
  recommendTags(
    problemTitle: string,
    problemDescription: string,
    existingTags: Tag[],
    options?: TagManagementOptions
  ): Promise<Result<Tag[]>>;
  
  // 태그 정규화 및 정리
  normalizeTagSet(
    tags: Tag[],
    options?: TagManagementOptions
  ): Promise<Result<Tag[]>>;
  
  // 태그 검색 (전문 검색)
  searchTags(
    query: string,
    availableTags: Tag[],
    options?: TagManagementOptions
  ): Promise<Result<Tag[]>>;
  
  // 태그 클러스터링
  clusterSimilarTags(
    tags: Tag[],
    options?: TagManagementOptions
  ): Promise<Result<Tag[][]>>;
  
  // 태그 계층구조 분석
  analyzeTagHierarchy(
    tags: Tag[],
    options?: TagManagementOptions
  ): Promise<Result<Map<string, Tag[]>>>;
}

// 기본 구현체 어댑터 (Static → Instance 변환)
export class TagManagementServiceAdapter implements ITagManagementService {
  
  async findSimilarTags(
    inputTag: string,
    existingTags: Tag[],
    options?: TagManagementOptions
  ): Promise<Result<Tag[]>> {
    try {
      // 동적 import로 순환 의존성 방지
      const { TagManagementService } = await import('./TagManagementService');
      const result = TagManagementService.findSimilarTags(inputTag, existingTags, options);
      return Result.ok(result);
    } catch (error) {
      return Result.fail(`Failed to find similar tags: ${error}`);
    }
  }
  
  async analyzeTagUsage(
    problemTags: Tag[][],
    options?: TagManagementOptions
  ): Promise<Result<Array<{ tag: Tag; count: number; percentage: number }>>> {
    try {
      const { TagManagementService } = await import('./TagManagementService');
      const result = TagManagementService.analyzeTagUsage(problemTags, options);
      return Result.ok(result);
    } catch (error) {
      return Result.fail(`Failed to analyze tag usage: ${error}`);
    }
  }
  
  async recommendTags(
    problemTitle: string,
    problemDescription: string,
    existingTags: Tag[],
    options?: TagManagementOptions
  ): Promise<Result<Tag[]>> {
    try {
      const { TagManagementService } = await import('./TagManagementService');
      const result = TagManagementService.recommendTags(
        problemTitle,
        problemDescription,
        existingTags,
        options
      );
      return Result.ok(result);
    } catch (error) {
      return Result.fail(`Failed to recommend tags: ${error}`);
    }
  }
  
  async normalizeTagSet(
    tags: Tag[],
    options?: TagManagementOptions
  ): Promise<Result<Tag[]>> {
    try {
      const { TagManagementService } = await import('./TagManagementService');
      const result = TagManagementService.normalizeTagSet(tags, options);
      return result;
    } catch (error) {
      return Result.fail(`Failed to normalize tag set: ${error}`);
    }
  }
  
  async searchTags(
    query: string,
    availableTags: Tag[],
    options?: TagManagementOptions
  ): Promise<Result<Tag[]>> {
    try {
      const { TagManagementService } = await import('./TagManagementService');
      const result = TagManagementService.searchTags(query, availableTags, options);
      return Result.ok(result);
    } catch (error) {
      return Result.fail(`Failed to search tags: ${error}`);
    }
  }
  
  async clusterSimilarTags(
    tags: Tag[],
    options?: TagManagementOptions
  ): Promise<Result<Tag[][]>> {
    try {
      const { TagManagementService } = await import('./TagManagementService');
      const result = TagManagementService.clusterSimilarTags(tags, options);
      return Result.ok(result);
    } catch (error) {
      return Result.fail(`Failed to cluster tags: ${error}`);
    }
  }
  
  async analyzeTagHierarchy(
    tags: Tag[],
    options?: TagManagementOptions
  ): Promise<Result<Map<string, Tag[]>>> {
    try {
      const { TagManagementService } = await import('./TagManagementService');
      const result = TagManagementService.analyzeTagHierarchy(tags, options);
      return Result.ok(result);
    } catch (error) {
      return Result.fail(`Failed to analyze tag hierarchy: ${error}`);
    }
  }
}