import { SupabaseClient } from '@supabase/supabase-js';
import { ICacheService } from '@woodie/application/common/interfaces/ICacheService';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
import { Problem } from '@woodie/domain/problems/entities/Problem';
import { 
  ProblemSearchFilter,
  PaginationOptions,
  SortOptions,
  ProblemSearchResult
} from '@woodie/domain/problems/repositories/IProblemRepository';
import { CacheKeys, CacheTTL } from '@woodie/application/common/constants/CacheConstants';
import { ProblemBankErrorFactory } from '@woodie/application/problems/errors/ProblemBankErrors';
import crypto from 'crypto';

export interface SearchConfig {
  enableCaching?: boolean;
  cachePrefix?: string;
  defaultLanguage?: 'korean' | 'english' | 'simple';
  enableFuzzySearch?: boolean;
  maxSearchResults?: number;
}

export interface SearchAnalytics {
  totalQueries: number;
  cacheHitRate: number;
  averageQueryTime: number;
  popularQueries: Array<{ query: string; count: number }>;
  queryPerformanceStats: {
    fastest: number;
    slowest: number;
    median: number;
  };
  searchPatterns: {
    mostFrequentTerms: Array<{ term: string; frequency: number }>;
    searchTimeDistribution: Array<{ timeRange: string; count: number }>;
  };
}

export interface FullTextSearchResult {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  difficulty: number;
  type: string;
  rank: number; // FTS 순위
  headline?: string; // 하이라이트된 텍스트
}

export interface QueryPerformanceData {
  query: string;
  duration: number;
  timestamp: number;
  resultCount: number;
  wasFromCache: boolean;
}

export class PostgreSQLSearchService {
  private readonly supabase: SupabaseClient;
  private readonly cache?: ICacheService;
  private readonly logger: ILogger;
  private readonly config: SearchConfig;
  private readonly analytics: Map<string, number> = new Map();
  private readonly performanceData: QueryPerformanceData[] = [];
  private readonly searchTermFrequency: Map<string, number> = new Map();
  private queryCount = 0;
  private cacheHits = 0;
  private totalQueryTime = 0;

  constructor(
    supabase: SupabaseClient,
    logger: ILogger,
    cache?: ICacheService,
    config: SearchConfig = {}
  ) {
    this.supabase = supabase;
    this.cache = cache;
    this.logger = logger;
    this.config = {
      enableCaching: true,
      cachePrefix: 'search',
      defaultLanguage: 'korean',
      enableFuzzySearch: false,
      maxSearchResults: 100,
      ...config
    };
  }

  /**
   * 전문 검색 실행 (Full-Text Search)
   */
  async executeFullTextSearch(
    query: string,
    filter: ProblemSearchFilter,
    pagination?: PaginationOptions,
    sort?: SortOptions
  ): Promise<Result<ProblemSearchResult>> {
    const startTime = Date.now();
    const correlationId = crypto.randomUUID();
    let wasFromCache = false;
    
    try {
      this.logger.info('Starting full-text search', {
        query,
        filter,
        pagination,
        correlationId
      });

      // 캐시 확인
      const cacheKey = this.generateCacheKey(query, filter, pagination, sort);
      if (this.config.enableCaching && this.cache) {
        const cached = await this.getCachedResult(cacheKey);
        if (cached) {
          this.cacheHits++;
          wasFromCache = true;
          const duration = Date.now() - startTime;
          
          this.updateAnalytics(query, duration, cached.problems.length, wasFromCache);
          
          this.logger.info('Search served from cache', {
            cacheKey,
            correlationId,
            duration
          });
          return Result.ok(cached);
        }
      }

      // 검색 쿼리 구성
      const searchQuery = this.buildFullTextQuery(query, filter, pagination, sort);
      
      // 검색 실행
      const { data, error, count } = await searchQuery;
      
      if (error) {
        const searchError = ProblemBankErrorFactory.searchFailed(filter, new Error(error.message));
        this.logger.error('Full-text search failed', {
          error: error.message,
          query,
          correlationId
        });
        return Result.fail(searchError.message);
      }

      // 결과 변환
      const searchResults = this.transformSearchResults(data || []);
      const result: ProblemSearchResult = {
        problems: searchResults,
        metadata: {
          totalCount: count || 0,
          hasNextPage: pagination ? (pagination.limit < (count || 0)) : false,
          hasPreviousPage: pagination ? (pagination.page || 1) > 1 : false
        }
      };

      // 결과 캐싱
      if (this.config.enableCaching && this.cache && searchResults.length > 0) {
        await this.cacheResult(cacheKey, result);
      }

      // 분석 데이터 업데이트
      const duration = Date.now() - startTime;
      this.updateAnalytics(query, duration, searchResults.length, wasFromCache);

      this.logger.info('Full-text search completed', {
        resultCount: searchResults.length,
        totalCount: count,
        duration,
        correlationId
      });

      return Result.ok(result);

    } catch (error) {
      const searchError = ProblemBankErrorFactory.searchFailed(
        filter, 
        error instanceof Error ? error : new Error(String(error))
      );
      
      const duration = Date.now() - startTime;
      this.logger.error('Unexpected search error', {
        error: error instanceof Error ? error.message : String(error),
        query,
        correlationId,
        duration
      });

      return Result.fail(searchError.message);
    }
  }

  /**
   * 유사 검색 (Similarity Search)
   */
  async executeSimilaritySearch(
    referenceText: string,
    filter: ProblemSearchFilter,
    limit = 10
  ): Promise<Result<Problem[]>> {
    try {
      const cacheKey = `${this.config.cachePrefix}:similarity:${this.hashString(referenceText)}:${limit}`;
      
      // 캐시 확인
      if (this.config.enableCaching && this.cache) {
        const cached = await this.cache.get<Problem[]>(cacheKey);
        if (cached) {
          return Result.ok(cached);
        }
      }

      // 유사성 검색 쿼리 (PostgreSQL similarity 함수 사용)
      let query = this.supabase
        .from('learning.problems')
        .select('*')
        .textSearch('search_vector', referenceText, {
          type: 'websearch',
          config: this.config.defaultLanguage
        })
        .limit(limit);

      // 필터 적용
      query = this.applyFilters(query, filter);

      const { data, error } = await query;
      
      if (error) {
        return Result.fail(`Similarity search failed: ${error.message}`);
      }

      const problems = await this.transformToProblems(data || []);
      
      // 결과 캐싱
      if (this.config.enableCaching && this.cache && problems.length > 0) {
        await this.cache.set(cacheKey, problems, { ttl: CacheTTL.MEDIUM });
      }

      return Result.ok(problems);
    } catch (error) {
      return Result.fail(`Similarity search error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 검색 제안/자동완성
   */
  async getSearchSuggestions(
    partialQuery: string,
    teacherId?: string,
    limit = 10
  ): Promise<Result<string[]>> {
    try {
      const cacheKey = `${this.config.cachePrefix}:suggestions:${this.hashString(partialQuery)}:${teacherId || 'all'}:${limit}`;
      
      if (this.config.enableCaching && this.cache) {
        const cached = await this.cache.get<string[]>(cacheKey);
        if (cached) {
          return Result.ok(cached);
        }
      }

      // 제목과 태그에서 제안 검색
      let query = this.supabase
        .from('learning.problems')
        .select('content->title, tags')
        .ilike('content->title', `%${partialQuery}%`)
        .eq('is_active', true)
        .limit(limit);

      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      const { data, error } = await query;
      
      if (error) {
        return Result.fail(`Suggestion search failed: ${error.message}`);
      }

      // 제안 생성
      const suggestions = new Set<string>();
      
      data?.forEach((row: any) => {
        const title = row.content?.title;
        if (title && title.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.add(title);
        }
        
        // 태그에서도 매칭되는 것들 추가
        row.tags?.forEach((tag: string) => {
          if (tag.toLowerCase().includes(partialQuery.toLowerCase())) {
            suggestions.add(tag);
          }
        });
      });

      const result = Array.from(suggestions).slice(0, limit);
      
      // 결과 캐싱
      if (this.config.enableCaching && this.cache) {
        await this.cache.set(cacheKey, result, { ttl: CacheTTL.SHORT });
      }

      return Result.ok(result);
    } catch (error) {
      return Result.fail(`Suggestion search error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 검색 분석 정보 조회 - 상세 분석 로직 구현
   */
  getSearchAnalytics(): SearchAnalytics {
    const totalQueries = this.queryCount;
    const cacheHitRate = totalQueries > 0 ? (this.cacheHits / totalQueries) * 100 : 0;
    const averageQueryTime = totalQueries > 0 ? this.totalQueryTime / totalQueries : 0;
    
    // 인기 검색어 정렬
    const popularQueries = Array.from(this.analytics.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 성능 통계 계산
    const durations = this.performanceData.map(d => d.duration).sort((a, b) => a - b);
    const queryPerformanceStats = {
      fastest: durations.length > 0 ? durations[0] : 0,
      slowest: durations.length > 0 ? durations[durations.length - 1] : 0,
      median: durations.length > 0 ? durations[Math.floor(durations.length / 2)] : 0
    };

    // 검색 패턴 분석
    const mostFrequentTerms = Array.from(this.searchTermFrequency.entries())
      .map(([term, frequency]) => ({ term, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);

    // 시간대별 검색 분포
    const searchTimeDistribution = this.calculateTimeDistribution();

    const searchPatterns = {
      mostFrequentTerms,
      searchTimeDistribution
    };

    return {
      totalQueries,
      cacheHitRate,
      averageQueryTime,
      popularQueries,
      queryPerformanceStats,
      searchPatterns
    };
  }

  /**
   * 검색 성능 상세 분석
   */
  getDetailedPerformanceAnalytics() {
    const recentQueries = this.performanceData
      .slice(-100) // 최근 100개 쿼리
      .sort((a, b) => b.timestamp - a.timestamp);

    const slowQueries = this.performanceData
      .filter(d => d.duration > 1000) // 1초 이상
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const cacheEffectiveness = this.performanceData.reduce((acc, data) => {
      if (data.wasFromCache) {
        acc.cacheHits++;
        acc.cacheHitTime += data.duration;
      } else {
        acc.cacheMisses++;
        acc.cacheMissTime += data.duration;
      }
      return acc;
    }, { cacheHits: 0, cacheMisses: 0, cacheHitTime: 0, cacheMissTime: 0 });

    const avgCacheHitTime = cacheEffectiveness.cacheHits > 0 
      ? cacheEffectiveness.cacheHitTime / cacheEffectiveness.cacheHits 
      : 0;
    const avgCacheMissTime = cacheEffectiveness.cacheMisses > 0 
      ? cacheEffectiveness.cacheMissTime / cacheEffectiveness.cacheMisses 
      : 0;

    return {
      recentQueries,
      slowQueries,
      cacheEffectiveness: {
        ...cacheEffectiveness,
        avgCacheHitTime,
        avgCacheMissTime,
        timeSaved: avgCacheMissTime - avgCacheHitTime
      },
      queryVolumeByHour: this.getQueryVolumeByHour(),
      searchResultDistribution: this.getSearchResultDistribution()
    };
  }

  /**
   * 검색 트렌드 분석
   */
  getSearchTrends(timeRange: 'hour' | 'day' | 'week' = 'day') {
    const now = Date.now();
    const ranges = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = now - ranges[timeRange];
    const recentData = this.performanceData.filter(d => d.timestamp > cutoff);
    
    const trendData = recentData.reduce((acc, data) => {
      const timeSlot = this.getTimeSlot(data.timestamp, timeRange);
      if (!acc[timeSlot]) {
        acc[timeSlot] = { queries: 0, totalDuration: 0, uniqueQueries: new Set() };
      }
      acc[timeSlot].queries++;
      acc[timeSlot].totalDuration += data.duration;
      acc[timeSlot].uniqueQueries.add(data.query);
      return acc;
    }, {} as Record<string, { queries: number; totalDuration: number; uniqueQueries: Set<string> }>);

    return Object.entries(trendData).map(([timeSlot, data]) => ({
      timeSlot,
      queryCount: data.queries,
      averageDuration: data.totalDuration / data.queries,
      uniqueQueries: data.uniqueQueries.size
    })).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }

  /**
   * 검색 인덱스 최적화
   */
  async optimizeSearchIndex(): Promise<Result<void>> {
    try {
      // PostgreSQL에서 FTS 인덱스 최적화
      const { error } = await this.supabase.rpc('optimize_search_index');
      
      if (error) {
        return Result.fail(`Index optimization failed: ${error.message}`);
      }

      this.logger.info('Search index optimization completed');
      return Result.ok();
    } catch (error) {
      return Result.fail(`Index optimization error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 분석 데이터 리셋
   */
  resetAnalytics(): void {
    this.analytics.clear();
    this.performanceData.length = 0;
    this.searchTermFrequency.clear();
    this.queryCount = 0;
    this.cacheHits = 0;
    this.totalQueryTime = 0;
    
    this.logger.info('Search analytics data reset');
  }

  private buildFullTextQuery(
    query: string,
    filter: ProblemSearchFilter,
    pagination?: PaginationOptions,
    sort?: SortOptions
  ) {
    let searchQuery = this.supabase
      .from('learning.problems')
      .select('*, ts_rank(search_vector, websearch_to_tsquery($1)) as rank', { count: 'exact' })
      .textSearch('search_vector', query, {
        type: 'websearch',
        config: this.config.defaultLanguage
      });

    // 필터 적용
    searchQuery = this.applyFilters(searchQuery, filter);

    // 정렬 적용
    if (sort) {
      const sortField = this.mapSortField(sort.field);
      searchQuery = searchQuery.order(sortField, { ascending: sort.direction === 'ASC' });
    } else {
      // 기본적으로 FTS 랭킹으로 정렬
      searchQuery = searchQuery.order('rank', { ascending: false });
    }

    // 페이지네이션 적용
    if (pagination) {
      const offset = ((pagination.page || 1) - 1) * pagination.limit;
      const limit = Math.min(pagination.limit, this.config.maxSearchResults || 100);
      searchQuery = searchQuery.range(offset, offset + limit - 1);
    }

    return searchQuery;
  }

  private applyFilters(query: any, filter: ProblemSearchFilter) {
    if (filter.teacherId) {
      query = query.eq('teacher_id', filter.teacherId);
    }
    
    if (filter.typeValues?.length) {
      query = query.in('type', filter.typeValues);
    }
    
    if (filter.difficultyLevels?.length) {
      query = query.in('difficulty', filter.difficultyLevels);
    }
    
    if (filter.tagNames?.length) {
      query = query.overlaps('tags', filter.tagNames);
    }
    
    if (filter.isActive !== undefined) {
      query = query.eq('is_active', filter.isActive);
    }

    return query;
  }

  private transformSearchResults(data: any[]): Problem[] {
    // 실제 Problem 엔티티로 변환하는 로직 구현 
    // 현재는 타입 에러 방지를 위해 빈 배열 반환
    // TODO: Problem.restore 또는 다른 팩토리 메서드 사용하여 구현
    return [];
  }

  private async transformToProblems(data: any[]): Promise<Problem[]> {
    // 실제 Problem 엔티티로 변환하는 로직 구현
    return this.transformSearchResults(data);
  }

  private mapSortField(field: string): string {
    const mapping = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'difficulty': 'difficulty',
      'title': 'content->>title'
    };
    return mapping[field as keyof typeof mapping] || 'created_at';
  }

  private generateCacheKey(
    query: string,
    filter: ProblemSearchFilter,
    pagination?: PaginationOptions,
    sort?: SortOptions
  ): string {
    const keyData = { query, filter, pagination, sort };
    const hash = this.hashString(JSON.stringify(keyData));
    return CacheKeys.PROBLEM_SEARCH(query, hash);
  }

  private hashString(str: string): string {
    return crypto.createHash('md5').update(str).digest('hex');
  }

  private async getCachedResult(cacheKey: string): Promise<ProblemSearchResult | null> {
    if (!this.cache) return null;
    
    try {
      return await this.cache.get<ProblemSearchResult>(cacheKey);
    } catch (error) {
      this.logger.warn('Cache read failed', { cacheKey, error });
      return null;
    }
  }

  private async cacheResult(cacheKey: string, result: ProblemSearchResult): Promise<void> {
    if (!this.cache) return;
    
    try {
      await this.cache.set(cacheKey, result, { ttl: CacheTTL.SHORT });
    } catch (error) {
      this.logger.warn('Cache write failed', { cacheKey, error });
    }
  }

  private updateAnalytics(query: string, duration: number, resultCount: number, wasFromCache: boolean): void {
    this.queryCount++;
    this.totalQueryTime += duration;
    
    // 쿼리 빈도 업데이트
    const currentCount = this.analytics.get(query) || 0;
    this.analytics.set(query, currentCount + 1);
    
    // 성능 데이터 저장
    this.performanceData.push({
      query,
      duration,
      timestamp: Date.now(),
      resultCount,
      wasFromCache
    });
    
    // 메모리 사용량 제한 (최근 1000개만 유지)
    if (this.performanceData.length > 1000) {
      this.performanceData.shift();
    }
    
    // 검색어 텀 빈도 분석
    this.analyzeSearchTerms(query);
  }

  private analyzeSearchTerms(query: string): void {
    // 한글/영문 단어 분리
    const terms = query.toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 1); // 1글자 이하 제외
    
    terms.forEach(term => {
      const currentFreq = this.searchTermFrequency.get(term) || 0;
      this.searchTermFrequency.set(term, currentFreq + 1);
    });
  }

  private calculateTimeDistribution(): Array<{ timeRange: string; count: number }> {
    const hourCounts: Record<string, number> = {};
    
    this.performanceData.forEach(data => {
      const hour = new Date(data.timestamp).getHours();
      const timeRange = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
      hourCounts[timeRange] = (hourCounts[timeRange] || 0) + 1;
    });
    
    return Object.entries(hourCounts)
      .map(([timeRange, count]) => ({ timeRange, count }))
      .sort((a, b) => a.timeRange.localeCompare(b.timeRange));
  }

  private getQueryVolumeByHour(): Record<string, number> {
    const hourlyVolume: Record<string, number> = {};
    
    this.performanceData.forEach(data => {
      const hour = new Date(data.timestamp).getHours();
      hourlyVolume[hour.toString()] = (hourlyVolume[hour.toString()] || 0) + 1;
    });
    
    return hourlyVolume;
  }

  private getSearchResultDistribution(): Array<{ range: string; count: number }> {
    const ranges = [
      { min: 0, max: 0, label: '0 results' },
      { min: 1, max: 10, label: '1-10 results' },
      { min: 11, max: 50, label: '11-50 results' },
      { min: 51, max: 100, label: '51-100 results' },
      { min: 101, max: Infinity, label: '100+ results' }
    ];
    
    const distribution = ranges.map(range => ({
      range: range.label,
      count: 0
    }));
    
    this.performanceData.forEach(data => {
      const rangeIndex = ranges.findIndex(r => 
        data.resultCount >= r.min && data.resultCount <= r.max
      );
      if (rangeIndex !== -1) {
        distribution[rangeIndex].count++;
      }
    });
    
    return distribution;
  }

  private getTimeSlot(timestamp: number, timeRange: 'hour' | 'day' | 'week'): string {
    const date = new Date(timestamp);
    
    switch (timeRange) {
      case 'hour':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:00`;
      case 'day':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-${(weekStart.getMonth() + 1).toString().padStart(2, '0')}-${weekStart.getDate().toString().padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }
}