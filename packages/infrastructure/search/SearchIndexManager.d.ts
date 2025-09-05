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
export declare class SearchIndexManager {
    private readonly supabase;
    private readonly logger;
    private readonly config;
    constructor(supabase: SupabaseClient, logger: ILogger, config?: SearchIndexConfig);
    /**
     * 검색 인덱스 생성 또는 업데이트
     */
    createOrUpdateSearchIndex(): Promise<Result<void>>;
    /**
     * 인덱스 통계 조회
     */
    getIndexStats(): Promise<Result<IndexStats[]>>;
    /**
     * 인덱스 최적화 실행
     */
    optimizeIndex(): Promise<Result<void>>;
    /**
     * 검색 성능 분석
     */
    analyzeSearchPerformance(sampleQueries: string[]): Promise<Result<{
        query: string;
        executionTime: number;
        planCost: number;
    }[]>>;
    /**
     * 인덱스 무결성 검사
     */
    validateIndexIntegrity(): Promise<Result<{
        isValid: boolean;
        issues: string[];
    }>>;
    /**
     * 사용자 정의 검색 설정 적용
     */
    applyCustomSearchConfig(config: Partial<SearchIndexConfig>): Promise<Result<void>>;
    private ensureSearchVectorColumn;
    private createSearchVectorUpdateFunction;
    private createSearchVectorTrigger;
    private createGINIndex;
    private updateExistingSearchVectors;
    private updateIndexStatistics;
    private updateSynonymDictionary;
    private updateStopWords;
    private updateLanguageConfig;
}
//# sourceMappingURL=SearchIndexManager.d.ts.map