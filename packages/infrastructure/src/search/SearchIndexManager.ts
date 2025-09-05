import { SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';

export interface IndexStats {
  indexName: string;
  tableName: string;
  indexSize: string;
  isValid: boolean;
  lastUpdated?: Date;
  documentsIndexed: number;
}

export interface SearchIndexConfig {
  language: 'korean' | 'english' | 'simple';
  enableStemming: boolean;
  stopWords?: string[];
  synonyms?: Record<string, string[]>;
}

export class SearchIndexManager {
  private readonly supabase: SupabaseClient;
  private readonly logger: ILogger;
  private readonly config: SearchIndexConfig;

  constructor(
    supabase: SupabaseClient,
    logger: ILogger,
    config: SearchIndexConfig = {
      language: 'korean',
      enableStemming: true
    }
  ) {
    this.supabase = supabase;
    this.logger = logger;
    this.config = config;
  }

  /**
   * 검색 인덱스 생성 또는 업데이트
   */
  async createOrUpdateSearchIndex(): Promise<Result<void>> {
    try {
      this.logger.info('Starting search index creation/update');

      // 1. tsvector 컬럼이 없으면 추가
      await this.ensureSearchVectorColumn();

      // 2. 검색 벡터 업데이트 함수 생성
      await this.createSearchVectorUpdateFunction();

      // 3. 트리거 생성 (자동 인덱스 업데이트)
      await this.createSearchVectorTrigger();

      // 4. GIN 인덱스 생성
      await this.createGINIndex();

      // 5. 기존 데이터에 대한 검색 벡터 업데이트
      await this.updateExistingSearchVectors();

      // 6. 인덱스 통계 수집
      await this.updateIndexStatistics();

      this.logger.info('Search index creation/update completed successfully');
      return Result.ok();

    } catch (error) {
      this.logger.error('Search index creation/update failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return Result.fail(`Search index creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 인덱스 통계 조회
   */
  async getIndexStats(): Promise<Result<IndexStats[]>> {
    try {
      const { data, error } = await this.supabase.rpc('get_search_index_stats');
      
      if (error) {
        return Result.fail(`Failed to get index stats: ${error.message}`);
      }

      return Result.ok(data || []);
    } catch (error) {
      return Result.fail(`Index stats query error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 인덱스 최적화 실행
   */
  async optimizeIndex(): Promise<Result<void>> {
    try {
      this.logger.info('Starting index optimization');

      // VACUUM 및 REINDEX 실행
      const { error: vacuumError } = await this.supabase.rpc('vacuum_search_index');
      if (vacuumError) {
        throw new Error(`Vacuum failed: ${vacuumError.message}`);
      }

      const { error: reindexError } = await this.supabase.rpc('reindex_search');
      if (reindexError) {
        throw new Error(`Reindex failed: ${reindexError.message}`);
      }

      // 통계 업데이트
      await this.updateIndexStatistics();

      this.logger.info('Index optimization completed');
      return Result.ok();

    } catch (error) {
      this.logger.error('Index optimization failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return Result.fail(`Index optimization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 검색 성능 분석
   */
  async analyzeSearchPerformance(
    sampleQueries: string[]
  ): Promise<Result<{ query: string; executionTime: number; planCost: number }[]>> {
    try {
      const results = [];

      for (const query of sampleQueries) {
        const startTime = Date.now();
        
        // 쿼리 실행
        const { error } = await this.supabase
          .from('learning.problems')
          .select('id')
          .textSearch('search_vector', query)
          .limit(10);

        if (error) {
          this.logger.warn(`Query performance test failed for: ${query}`, { error: error.message });
          continue;
        }

        const executionTime = Date.now() - startTime;

        // 실행 계획 조회 (예상 비용)
        const { data: planData } = await this.supabase.rpc('explain_search_query', {
          search_query: query
        });

        results.push({
          query,
          executionTime,
          planCost: planData?.[0]?.total_cost || 0
        });
      }

      return Result.ok(results);

    } catch (error) {
      return Result.fail(`Performance analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 인덱스 무결성 검사
   */
  async validateIndexIntegrity(): Promise<Result<{ isValid: boolean; issues: string[] }>> {
    try {
      const issues: string[] = [];

      // 1. 검색 벡터가 비어있는 레코드 확인
      const { data: emptyVectors, error: emptyError } = await this.supabase
        .from('learning.problems')
        .select('id')
        .is('search_vector', null)
        .limit(10);

      if (emptyError) {
        throw new Error(`Empty vector check failed: ${emptyError.message}`);
      }

      if (emptyVectors && emptyVectors.length > 0) {
        issues.push(`Found ${emptyVectors.length} records with empty search vectors`);
      }

      // 2. 인덱스 상태 확인
      const { data: indexStatus, error: indexError } = await this.supabase.rpc('check_index_status');
      
      if (indexError) {
        throw new Error(`Index status check failed: ${indexError.message}`);
      }

      if (indexStatus && !indexStatus.is_valid) {
        issues.push('Search index is marked as invalid');
      }

      // 3. 검색 기능 테스트
      const { error: searchError } = await this.supabase
        .from('learning.problems')
        .select('id')
        .textSearch('search_vector', 'test')
        .limit(1);

      if (searchError) {
        issues.push(`Search functionality test failed: ${searchError.message}`);
      }

      return Result.ok({
        isValid: issues.length === 0,
        issues
      });

    } catch (error) {
      return Result.fail(`Index validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 사용자 정의 검색 설정 적용
   */
  async applyCustomSearchConfig(config: Partial<SearchIndexConfig>): Promise<Result<void>> {
    try {
      this.logger.info('Applying custom search configuration', { config });

      // 설정 병합
      const newConfig = { ...this.config, ...config };

      // 동의어 사전 업데이트
      if (newConfig.synonyms) {
        await this.updateSynonymDictionary(newConfig.synonyms);
      }

      // 불용어 목록 업데이트
      if (newConfig.stopWords) {
        await this.updateStopWords(newConfig.stopWords);
      }

      // 언어 설정 업데이트
      if (config.language && config.language !== this.config.language) {
        await this.updateLanguageConfig(config.language);
      }

      this.logger.info('Custom search configuration applied successfully');
      return Result.ok();

    } catch (error) {
      return Result.fail(`Custom config application failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async ensureSearchVectorColumn(): Promise<void> {
    const { error } = await this.supabase.rpc('ensure_search_vector_column');
    if (error) {
      throw new Error(`Failed to ensure search vector column: ${error.message}`);
    }
  }

  private async createSearchVectorUpdateFunction(): Promise<void> {
    const functionSQL = `
      CREATE OR REPLACE FUNCTION update_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector := 
          setweight(to_tsvector('${this.config.language}', COALESCE(NEW.content->>'title', '')), 'A') ||
          setweight(to_tsvector('${this.config.language}', COALESCE(NEW.content->>'description', '')), 'B') ||
          setweight(to_tsvector('${this.config.language}', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error } = await this.supabase.rpc('execute_sql', { sql: functionSQL });
    if (error) {
      throw new Error(`Failed to create search vector update function: ${error.message}`);
    }
  }

  private async createSearchVectorTrigger(): Promise<void> {
    const triggerSQL = `
      DROP TRIGGER IF EXISTS search_vector_update_trigger ON learning.problems;
      CREATE TRIGGER search_vector_update_trigger
        BEFORE INSERT OR UPDATE ON learning.problems
        FOR EACH ROW EXECUTE FUNCTION update_search_vector();
    `;

    const { error } = await this.supabase.rpc('execute_sql', { sql: triggerSQL });
    if (error) {
      throw new Error(`Failed to create search vector trigger: ${error.message}`);
    }
  }

  private async createGINIndex(): Promise<void> {
    const indexSQL = `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_search_vector 
      ON learning.problems USING GIN (search_vector);
    `;

    const { error } = await this.supabase.rpc('execute_sql', { sql: indexSQL });
    if (error) {
      throw new Error(`Failed to create GIN index: ${error.message}`);
    }
  }

  private async updateExistingSearchVectors(): Promise<void> {
    const { error } = await this.supabase.rpc('update_all_search_vectors');
    if (error) {
      throw new Error(`Failed to update existing search vectors: ${error.message}`);
    }
  }

  private async updateIndexStatistics(): Promise<void> {
    const { error } = await this.supabase.rpc('analyze_search_index');
    if (error) {
      throw new Error(`Failed to update index statistics: ${error.message}`);
    }
  }

  private async updateSynonymDictionary(synonyms: Record<string, string[]>): Promise<void> {
    const { error } = await this.supabase.rpc('update_synonym_dictionary', { synonyms });
    if (error) {
      throw new Error(`Failed to update synonym dictionary: ${error.message}`);
    }
  }

  private async updateStopWords(stopWords: string[]): Promise<void> {
    const { error } = await this.supabase.rpc('update_stop_words', { stop_words: stopWords });
    if (error) {
      throw new Error(`Failed to update stop words: ${error.message}`);
    }
  }

  private async updateLanguageConfig(language: string): Promise<void> {
    const { error } = await this.supabase.rpc('update_search_language', { language });
    if (error) {
      throw new Error(`Failed to update language config: ${error.message}`);
    }
  }
}