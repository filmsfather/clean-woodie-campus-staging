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

export class SupabaseSchemaManager {
  private readonly supabase: SupabaseClient;
  private readonly logger: ILogger;
  private readonly config: SchemaOptimizationConfig;

  constructor(
    supabase: SupabaseClient,
    logger: ILogger,
    config: SchemaOptimizationConfig = {}
  ) {
    this.supabase = supabase;
    this.logger = logger;
    this.config = {
      enableIndexOptimization: true,
      enablePartitioning: false,
      enableVacuumScheduling: true,
      enableStatisticsUpdates: true,
      connectionPoolSize: 10,
      queryTimeout: 30000,
      ...config
    };
  }

  // 문제 관련 테이블 최적화 인덱스 생성
  async createOptimizedIndexes(): Promise<Result<void>> {
    try {
      this.logger.info('Creating optimized indexes for problem tables');

      const indexes = await this.getProblemTableIndexes();
      
      for (const index of indexes) {
        await this.createIndexIfNotExists(index);
      }

      this.logger.info('All optimized indexes created successfully', {
        indexCount: indexes.length
      });

      return Result.ok<void>();

    } catch (error) {
      this.logger.error('Failed to create optimized indexes', {
        error: error instanceof Error ? error.message : String(error)
      });
      return Result.fail<void>('Failed to create optimized indexes');
    }
  }

  // 테이블 통계 수집
  async collectTableStatistics(): Promise<Result<TableStats[]>> {
    try {
      this.logger.info('Collecting table statistics');

      const tableNames = ['problems', 'problem_sets', 'problem_set_items', 'student_answers', 'teacher_profiles'];
      const statistics: TableStats[] = [];

      for (const tableName of tableNames) {
        const stats = await this.getTableStatistics(tableName);
        if (stats) {
          statistics.push(stats);
        }
      }

      this.logger.info('Table statistics collected', {
        tableCount: statistics.length,
        totalRows: statistics.reduce((sum, stat) => sum + stat.rowCount, 0)
      });

      return Result.ok(statistics);

    } catch (error) {
      this.logger.error('Failed to collect table statistics', {
        error: error instanceof Error ? error.message : String(error)
      });
      return Result.fail<TableStats[]>('Failed to collect table statistics');
    }
  }

  // 인덱스 성능 분석
  async analyzeIndexPerformance(): Promise<Result<{
    unusedIndexes: IndexInfo[];
    duplicateIndexes: IndexInfo[][];
    missingIndexes: string[];
    recommendations: string[];
  }>> {
    try {
      this.logger.info('Analyzing index performance');

      const [unusedIndexes, duplicateIndexes, missingIndexes] = await Promise.all([
        this.findUnusedIndexes(),
        this.findDuplicateIndexes(),
        this.suggestMissingIndexes()
      ]);

      const recommendations = this.generateIndexRecommendations(
        unusedIndexes,
        duplicateIndexes,
        missingIndexes
      );

      this.logger.info('Index performance analysis completed', {
        unusedCount: unusedIndexes.length,
        duplicateCount: duplicateIndexes.length,
        missingCount: missingIndexes.length,
        recommendationCount: recommendations.length
      });

      return Result.ok({
        unusedIndexes,
        duplicateIndexes,
        missingIndexes,
        recommendations
      });

    } catch (error) {
      this.logger.error('Failed to analyze index performance', {
        error: error instanceof Error ? error.message : String(error)
      });
      return Result.fail('Failed to analyze index performance');
    }
  }

  // 데이터베이스 정리 및 최적화
  async optimizeDatabase(): Promise<Result<void>> {
    try {
      this.logger.info('Starting database optimization');

      if (this.config.enableVacuumScheduling) {
        await this.performVacuumAnalyze();
      }

      if (this.config.enableStatisticsUpdates) {
        await this.updateTableStatistics();
      }

      if (this.config.enableIndexOptimization) {
        await this.reindexLargeTables();
      }

      this.logger.info('Database optimization completed successfully');
      return Result.ok<void>();

    } catch (error) {
      this.logger.error('Failed to optimize database', {
        error: error instanceof Error ? error.message : String(error)
      });
      return Result.fail<void>('Failed to optimize database');
    }
  }

  // 연결 풀 최적화
  async optimizeConnectionPool(): Promise<Result<void>> {
    try {
      this.logger.info('Optimizing connection pool settings', {
        poolSize: this.config.connectionPoolSize,
        queryTimeout: this.config.queryTimeout
      });

      // Supabase 클라이언트의 연결 설정은 초기화 시에만 가능
      // 런타임에서는 쿼리 타임아웃만 조정 가능
      this.logger.info('Connection pool optimization noted - requires client restart for full effect');
      
      return Result.ok<void>();

    } catch (error) {
      this.logger.error('Failed to optimize connection pool', {
        error: error instanceof Error ? error.message : String(error)
      });
      return Result.fail<void>('Failed to optimize connection pool');
    }
  }

  private getProblemTableIndexes(): IndexInfo[] {
    return [
      // problems 테이블 인덱스
      {
        indexName: 'idx_problems_teacher_id_active',
        tableName: 'problems',
        columnNames: ['teacher_id', 'is_active'],
        indexType: 'btree',
        isUnique: false,
        isPartial: true,
        condition: 'is_active = true'
      },
      {
        indexName: 'idx_problems_difficulty_type',
        tableName: 'problems',
        columnNames: ['difficulty', 'type'],
        indexType: 'btree',
        isUnique: false,
        isPartial: false
      },
      {
        indexName: 'idx_problems_fulltext_search',
        tableName: 'problems',
        columnNames: ['title', 'description'],
        indexType: 'gin',
        isUnique: false,
        isPartial: false
      },
      {
        indexName: 'idx_problems_created_at',
        tableName: 'problems',
        columnNames: ['created_at'],
        indexType: 'btree',
        isUnique: false,
        isPartial: false
      },
      {
        indexName: 'idx_problems_tags_gin',
        tableName: 'problems',
        columnNames: ['tags'],
        indexType: 'gin',
        isUnique: false,
        isPartial: false
      },

      // problem_sets 테이블 인덱스  
      {
        indexName: 'idx_problem_sets_teacher_id_active',
        tableName: 'problem_sets',
        columnNames: ['teacher_id', 'is_active'],
        indexType: 'btree',
        isUnique: false,
        isPartial: true,
        condition: 'is_active = true'
      },
      {
        indexName: 'idx_problem_sets_created_at',
        tableName: 'problem_sets',
        columnNames: ['created_at'],
        indexType: 'btree',
        isUnique: false,
        isPartial: false
      },

      // problem_set_items 테이블 인덱스
      {
        indexName: 'idx_problem_set_items_set_id_order',
        tableName: 'problem_set_items',
        columnNames: ['problem_set_id', 'order_index'],
        indexType: 'btree',
        isUnique: true,
        isPartial: false
      },
      {
        indexName: 'idx_problem_set_items_problem_id',
        tableName: 'problem_set_items',
        columnNames: ['problem_id'],
        indexType: 'btree',
        isUnique: false,
        isPartial: false
      },

      // student_answers 테이블 인덱스
      {
        indexName: 'idx_student_answers_student_problem',
        tableName: 'student_answers',
        columnNames: ['student_id', 'problem_id'],
        indexType: 'btree',
        isUnique: false,
        isPartial: false
      },
      {
        indexName: 'idx_student_answers_submitted_at',
        tableName: 'student_answers',
        columnNames: ['submitted_at'],
        indexType: 'btree',
        isUnique: false,
        isPartial: false
      },
      {
        indexName: 'idx_student_answers_is_correct',
        tableName: 'student_answers',
        columnNames: ['is_correct'],
        indexType: 'btree',
        isUnique: false,
        isPartial: false
      }
    ];
  }

  private async createIndexIfNotExists(indexInfo: IndexInfo): Promise<void> {
    try {
      // 인덱스 존재 여부 확인
      const { data: existingIndex } = await this.supabase
        .rpc('check_index_exists', { index_name: indexInfo.indexName });

      if (existingIndex) {
        this.logger.debug('Index already exists, skipping', {
          indexName: indexInfo.indexName
        });
        return;
      }

      // 인덱스 생성 SQL 구성
      const sql = this.buildCreateIndexSQL(indexInfo);
      
      // 인덱스 생성 실행
      const { error } = await this.supabase.rpc('execute_sql', { sql_query: sql });
      
      if (error) {
        throw new Error(`Failed to create index: ${error.message}`);
      }

      this.logger.info('Index created successfully', {
        indexName: indexInfo.indexName,
        tableName: indexInfo.tableName,
        columns: indexInfo.columnNames
      });

    } catch (error) {
      this.logger.error('Failed to create index', {
        indexName: indexInfo.indexName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private buildCreateIndexSQL(indexInfo: IndexInfo): string {
    const uniqueKeyword = indexInfo.isUnique ? 'UNIQUE' : '';
    const indexType = indexInfo.indexType.toUpperCase();
    
    let columns: string;
    if (indexInfo.indexType === 'gin' && indexInfo.columnNames.length > 1) {
      // GIN 인덱스의 경우 풀텍스트 검색을 위한 특별 처리
      columns = `(to_tsvector('english', ${indexInfo.columnNames.join(" || ' ' || ")}))`;
    } else if (indexInfo.indexType === 'gin' && indexInfo.columnNames.includes('tags')) {
      // JSON 배열 컬럼용 GIN 인덱스
      columns = indexInfo.columnNames.join(', ');
    } else {
      columns = indexInfo.columnNames.join(', ');
    }

    let sql = `CREATE ${uniqueKeyword} INDEX CONCURRENTLY IF NOT EXISTS ${indexInfo.indexName}`;
    sql += ` ON ${indexInfo.tableName}`;
    
    if (indexInfo.indexType !== 'btree') {
      sql += ` USING ${indexType}`;
    }
    
    sql += ` (${columns})`;
    
    if (indexInfo.isPartial && indexInfo.condition) {
      sql += ` WHERE ${indexInfo.condition}`;
    }

    return sql;
  }

  private async getTableStatistics(tableName: string): Promise<TableStats | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_table_statistics', { table_name: tableName });

      if (error) {
        throw new Error(`Failed to get statistics for ${tableName}: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return null;
      }

      const stat = data[0];
      return {
        tableName,
        rowCount: stat.row_count || 0,
        tableSize: stat.table_size || '0 bytes',
        indexSize: stat.index_size || '0 bytes',
        totalSize: stat.total_size || '0 bytes',
        lastVacuum: stat.last_vacuum ? new Date(stat.last_vacuum) : undefined,
        lastAnalyze: stat.last_analyze ? new Date(stat.last_analyze) : undefined
      };

    } catch (error) {
      this.logger.error('Failed to get table statistics', {
        tableName,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  private async findUnusedIndexes(): Promise<IndexInfo[]> {
    try {
      const { data, error } = await this.supabase.rpc('find_unused_indexes');
      
      if (error) {
        throw new Error(`Failed to find unused indexes: ${error.message}`);
      }

      return (data || []).map((row: any) => ({
        indexName: row.index_name,
        tableName: row.table_name,
        columnNames: row.column_names ? row.column_names.split(',') : [],
        indexType: row.index_type || 'btree',
        isUnique: row.is_unique || false,
        isPartial: row.is_partial || false
      }));

    } catch (error) {
      this.logger.warn('Could not find unused indexes', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  private async findDuplicateIndexes(): Promise<IndexInfo[][]> {
    try {
      const { data, error } = await this.supabase.rpc('find_duplicate_indexes');
      
      if (error) {
        throw new Error(`Failed to find duplicate indexes: ${error.message}`);
      }

      // 중복 인덱스 그룹화 처리
      const groups: Record<string, IndexInfo[]> = {};
      
      (data || []).forEach((row: any) => {
        const key = `${row.table_name}:${row.column_names}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        
        groups[key].push({
          indexName: row.index_name,
          tableName: row.table_name,
          columnNames: row.column_names ? row.column_names.split(',') : [],
          indexType: row.index_type || 'btree',
          isUnique: row.is_unique || false,
          isPartial: row.is_partial || false
        });
      });

      return Object.values(groups).filter(group => group.length > 1);

    } catch (error) {
      this.logger.warn('Could not find duplicate indexes', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  private async suggestMissingIndexes(): Promise<string[]> {
    // 느린 쿼리 분석을 통한 인덱스 추천
    const suggestions: string[] = [];

    try {
      const { data, error } = await this.supabase.rpc('analyze_slow_queries');
      
      if (error || !data) {
        return [];
      }

      // 분석 결과를 바탕으로 인덱스 제안
      data.forEach((query: any) => {
        if (query.table_name && query.column_name) {
          suggestions.push(
            `Consider adding index on ${query.table_name}(${query.column_name}) - used in slow queries`
          );
        }
      });

    } catch (error) {
      this.logger.warn('Could not analyze slow queries for index suggestions', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return suggestions;
  }

  private generateIndexRecommendations(
    unusedIndexes: IndexInfo[],
    duplicateIndexes: IndexInfo[][],
    missingIndexes: string[]
  ): string[] {
    const recommendations: string[] = [];

    // 사용하지 않는 인덱스 제거 권장
    unusedIndexes.forEach(index => {
      recommendations.push(
        `DROP unused index: ${index.indexName} on ${index.tableName} - no recent usage detected`
      );
    });

    // 중복 인덱스 정리 권장
    duplicateIndexes.forEach(group => {
      if (group.length > 1) {
        const keep = group[0];
        const drop = group.slice(1);
        
        recommendations.push(
          `Keep ${keep.indexName}, DROP duplicate indexes: ${drop.map(i => i.indexName).join(', ')}`
        );
      }
    });

    // 새로운 인덱스 생성 권장
    missingIndexes.forEach(suggestion => {
      recommendations.push(`CREATE ${suggestion}`);
    });

    return recommendations;
  }

  private async performVacuumAnalyze(): Promise<void> {
    const tables = ['problems', 'problem_sets', 'problem_set_items', 'student_answers'];
    
    for (const table of tables) {
      try {
        const { error } = await this.supabase
          .rpc('vacuum_analyze_table', { table_name: table });
        
        if (error) {
          throw new Error(`VACUUM ANALYZE failed for ${table}: ${error.message}`);
        }

        this.logger.debug('VACUUM ANALYZE completed', { tableName: table });

      } catch (error) {
        this.logger.warn('VACUUM ANALYZE failed', {
          tableName: table,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async updateTableStatistics(): Promise<void> {
    const tables = ['problems', 'problem_sets', 'problem_set_items', 'student_answers'];
    
    for (const table of tables) {
      try {
        const { error } = await this.supabase
          .rpc('update_table_statistics', { table_name: table });
        
        if (error) {
          throw new Error(`Statistics update failed for ${table}: ${error.message}`);
        }

        this.logger.debug('Table statistics updated', { tableName: table });

      } catch (error) {
        this.logger.warn('Table statistics update failed', {
          tableName: table,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async reindexLargeTables(): Promise<void> {
    const largeTableThreshold = 100000; // 10만 행 이상의 테이블
    
    const stats = await this.collectTableStatistics();
    if (stats.isFailure) {
      return;
    }

    const largeTables = stats.getValue().filter(stat => stat.rowCount > largeTableThreshold);
    
    for (const table of largeTables) {
      try {
        const { error } = await this.supabase
          .rpc('reindex_table', { table_name: table.tableName });
        
        if (error) {
          throw new Error(`REINDEX failed for ${table.tableName}: ${error.message}`);
        }

        this.logger.info('Table reindexed', { 
          tableName: table.tableName,
          rowCount: table.rowCount 
        });

      } catch (error) {
        this.logger.warn('REINDEX failed', {
          tableName: table.tableName,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }
}