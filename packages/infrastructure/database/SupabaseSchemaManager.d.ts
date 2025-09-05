import { SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
export interface SchemaOptimizationConfig {
    enableIndexOptimization?: boolean;
    enablePartitioning?: boolean;
    enableVacuumScheduling?: boolean;
    enableStatisticsUpdates?: boolean;
    connectionPoolSize?: number;
    queryTimeout?: number;
}
export interface IndexInfo {
    indexName: string;
    tableName: string;
    columnNames: string[];
    indexType: 'btree' | 'gin' | 'gist' | 'hash' | 'spgist' | 'brin';
    isUnique: boolean;
    isPartial: boolean;
    condition?: string;
}
export interface TableStats {
    tableName: string;
    rowCount: number;
    tableSize: string;
    indexSize: string;
    totalSize: string;
    lastVacuum?: Date;
    lastAnalyze?: Date;
}
export declare class SupabaseSchemaManager {
    private readonly supabase;
    private readonly logger;
    private readonly config;
    constructor(supabase: SupabaseClient, logger: ILogger, config?: SchemaOptimizationConfig);
    createOptimizedIndexes(): Promise<Result<void>>;
    collectTableStatistics(): Promise<Result<TableStats[]>>;
    analyzeIndexPerformance(): Promise<Result<{
        unusedIndexes: IndexInfo[];
        duplicateIndexes: IndexInfo[][];
        missingIndexes: string[];
        recommendations: string[];
    }>>;
    optimizeDatabase(): Promise<Result<void>>;
    optimizeConnectionPool(): Promise<Result<void>>;
    private getProblemTableIndexes;
    private createIndexIfNotExists;
    private buildCreateIndexSQL;
    private getTableStatistics;
    private findUnusedIndexes;
    private findDuplicateIndexes;
    private suggestMissingIndexes;
    private generateIndexRecommendations;
    private performVacuumAnalyze;
    private updateTableStatistics;
    private reindexLargeTables;
}
//# sourceMappingURL=SupabaseSchemaManager.d.ts.map