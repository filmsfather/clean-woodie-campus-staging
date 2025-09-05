import { SupabaseClient } from '@supabase/supabase-js';
import { DomainEvent } from '@woodie/domain/events';
import { IEventStore } from '@woodie/domain/events';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';

interface EventRecord {
  id: string;
  event_id: string;
  aggregate_id: string;
  event_type: string;
  event_version: number;
  event_data: any;
  metadata: any;
  occurred_on: string;
  correlation_id?: string;
  causation_id?: string;
  created_at: string;
}

export interface EventStoreConfig {
  tableName?: string;
  enableSnapshots?: boolean;
  snapshotFrequency?: number; // 이벤트 N개마다 스냅샷
  maxEventsPerQuery?: number;
  enableCompression?: boolean;
}

export class SupabaseEventStore implements IEventStore {
  private readonly supabase: SupabaseClient;
  private readonly logger: ILogger;
  private readonly config: EventStoreConfig;

  constructor(
    supabase: SupabaseClient,
    logger: ILogger,
    config: EventStoreConfig = {}
  ) {
    this.supabase = supabase;
    this.logger = logger;
    this.config = {
      tableName: 'domain_events',
      enableSnapshots: false,
      snapshotFrequency: 100,
      maxEventsPerQuery: 1000,
      enableCompression: false,
      ...config
    };
  }

  async saveEvent(event: DomainEvent): Promise<void> {
    try {
      const eventRecord = this.mapToEventRecord(event);
      
      const { error } = await this.supabase
        .from(this.config.tableName!)
        .insert(eventRecord);

      if (error) {
        throw new Error(`Failed to save event: ${error.message}`);
      }

      this.logger.debug('Event saved to store', {
        eventId: event.eventId.toString(),
        eventType: event.eventType,
        aggregateId: event.aggregateId.toString()
      });

      // 스냅샷 생성 확인
      if (this.config.enableSnapshots) {
        await this.considerSnapshot(event.aggregateId);
      }

    } catch (error) {
      this.logger.error('Failed to save event to store', {
        eventId: event.eventId.toString(),
        eventType: event.eventType,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async saveEvents(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    try {
      const eventRecords = events.map(event => this.mapToEventRecord(event));
      
      // 배치 크기로 나누어 처리
      const batchSize = 100;
      for (let i = 0; i < eventRecords.length; i += batchSize) {
        const batch = eventRecords.slice(i, i + batchSize);
        
        const { error } = await this.supabase
          .from(this.config.tableName!)
          .insert(batch);

        if (error) {
          throw new Error(`Failed to save event batch: ${error.message}`);
        }
      }

      this.logger.info('Event batch saved to store', {
        eventCount: events.length,
        batchSize
      });

      // 스냅샷 고려 (첫 번째 이벤트의 집계 ID 기준)
      if (this.config.enableSnapshots && events.length > 0) {
        await this.considerSnapshot(events[0].aggregateId);
      }

    } catch (error) {
      this.logger.error('Failed to save event batch to store', {
        eventCount: events.length,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getEvents(
    aggregateId: UniqueEntityID,
    fromVersion?: number
  ): Promise<DomainEvent[]> {
    try {
      let query = this.supabase
        .from(this.config.tableName!)
        .select('*')
        .eq('aggregate_id', aggregateId.toString())
        .order('event_version', { ascending: true })
        .limit(this.config.maxEventsPerQuery!);

      if (fromVersion !== undefined) {
        query = query.gte('event_version', fromVersion);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get events: ${error.message}`);
      }

      const events = (data || []).map(record => this.mapToDomainEvent(record));
      
      this.logger.debug('Events retrieved from store', {
        aggregateId: aggregateId.toString(),
        fromVersion,
        eventCount: events.length
      });

      return events;

    } catch (error) {
      this.logger.error('Failed to get events from store', {
        aggregateId: aggregateId.toString(),
        fromVersion,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getAllEvents(
    fromEventId?: UniqueEntityID,
    limit: number = 100
  ): Promise<DomainEvent[]> {
    try {
      let query = this.supabase
        .from(this.config.tableName!)
        .select('*')
        .order('created_at', { ascending: true })
        .limit(Math.min(limit, this.config.maxEventsPerQuery!));

      if (fromEventId) {
        query = query.gt('event_id', fromEventId.toString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get all events: ${error.message}`);
      }

      const events = (data || []).map(record => this.mapToDomainEvent(record));
      
      this.logger.debug('All events retrieved from store', {
        fromEventId: fromEventId?.toString(),
        limit,
        eventCount: events.length
      });

      return events;

    } catch (error) {
      this.logger.error('Failed to get all events from store', {
        fromEventId: fromEventId?.toString(),
        limit,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  // 이벤트 타입별 조회
  async getEventsByType(
    eventType: string,
    limit: number = 100,
    fromDate?: Date
  ): Promise<DomainEvent[]> {
    try {
      let query = this.supabase
        .from(this.config.tableName!)
        .select('*')
        .eq('event_type', eventType)
        .order('occurred_on', { ascending: true })
        .limit(Math.min(limit, this.config.maxEventsPerQuery!));

      if (fromDate) {
        query = query.gte('occurred_on', fromDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get events by type: ${error.message}`);
      }

      const events = (data || []).map(record => this.mapToDomainEvent(record));
      
      this.logger.debug('Events retrieved by type', {
        eventType,
        fromDate: fromDate?.toISOString(),
        limit,
        eventCount: events.length
      });

      return events;

    } catch (error) {
      this.logger.error('Failed to get events by type', {
        eventType,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  // 이벤트 스트림 조회 (페이지네이션 지원)
  async getEventStream(
    options: {
      fromEventId?: string;
      toEventId?: string;
      eventTypes?: string[];
      aggregateIds?: string[];
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    events: DomainEvent[];
    hasMore: boolean;
    nextOffset?: number;
  }> {
    try {
      const {
        fromEventId,
        toEventId,
        eventTypes,
        aggregateIds,
        fromDate,
        toDate,
        limit = 100,
        offset = 0
      } = options;

      let query = this.supabase
        .from(this.config.tableName!)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (fromEventId) {
        query = query.gte('event_id', fromEventId);
      }

      if (toEventId) {
        query = query.lte('event_id', toEventId);
      }

      if (eventTypes && eventTypes.length > 0) {
        query = query.in('event_type', eventTypes);
      }

      if (aggregateIds && aggregateIds.length > 0) {
        query = query.in('aggregate_id', aggregateIds);
      }

      if (fromDate) {
        query = query.gte('occurred_on', fromDate.toISOString());
      }

      if (toDate) {
        query = query.lte('occurred_on', toDate.toISOString());
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to get event stream: ${error.message}`);
      }

      const events = (data || []).map(record => this.mapToDomainEvent(record));
      const hasMore = (count || 0) > offset + limit;
      const nextOffset = hasMore ? offset + limit : undefined;

      this.logger.debug('Event stream retrieved', {
        eventCount: events.length,
        totalCount: count,
        hasMore,
        nextOffset
      });

      return {
        events,
        hasMore,
        nextOffset
      };

    } catch (error) {
      this.logger.error('Failed to get event stream', {
        options,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  // 이벤트 통계
  async getEventStatistics(
    options: {
      fromDate?: Date;
      toDate?: Date;
      eventTypes?: string[];
      aggregateIds?: string[];
    } = {}
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByDay: Record<string, number>;
    uniqueAggregates: number;
  }> {
    try {
      const {
        fromDate,
        toDate,
        eventTypes,
        aggregateIds
      } = options;

      let query = this.supabase
        .from(this.config.tableName!)
        .select('event_type, aggregate_id, occurred_on', { count: 'exact' });

      if (fromDate) {
        query = query.gte('occurred_on', fromDate.toISOString());
      }

      if (toDate) {
        query = query.lte('occurred_on', toDate.toISOString());
      }

      if (eventTypes && eventTypes.length > 0) {
        query = query.in('event_type', eventTypes);
      }

      if (aggregateIds && aggregateIds.length > 0) {
        query = query.in('aggregate_id', aggregateIds);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to get event statistics: ${error.message}`);
      }

      // 통계 계산
      const eventsByType: Record<string, number> = {};
      const eventsByDay: Record<string, number> = {};
      const uniqueAggregates = new Set<string>();

      (data || []).forEach(record => {
        // 타입별 집계
        eventsByType[record.event_type] = (eventsByType[record.event_type] || 0) + 1;

        // 일별 집계
        const day = record.occurred_on.split('T')[0];
        eventsByDay[day] = (eventsByDay[day] || 0) + 1;

        // 고유 집계 추적
        uniqueAggregates.add(record.aggregate_id);
      });

      return {
        totalEvents: count || 0,
        eventsByType,
        eventsByDay,
        uniqueAggregates: uniqueAggregates.size
      };

    } catch (error) {
      this.logger.error('Failed to get event statistics', {
        options,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private mapToEventRecord(event: DomainEvent): EventRecord {
    return {
      id: event.eventId.toString(),
      event_id: event.eventId.toString(),
      aggregate_id: event.aggregateId.toString(),
      event_type: event.eventType,
      event_version: event.eventVersion,
      event_data: {},
      metadata: event.metadata || {},
      occurred_on: event.occurredOn.toISOString(),
      correlation_id: event.correlationId,
      causation_id: event.causationId,
      created_at: new Date().toISOString()
    };
  }

  private mapToDomainEvent(record: EventRecord): DomainEvent {
    return {
      eventId: new UniqueEntityID(record.event_id),
      aggregateId: new UniqueEntityID(record.aggregate_id),
      eventType: record.event_type,
      eventVersion: record.event_version,
      occurredOn: new Date(record.occurred_on),
      correlationId: record.correlation_id,
      causationId: record.causation_id,
      metadata: record.metadata
    };
  }

  private async considerSnapshot(aggregateId: UniqueEntityID): Promise<void> {
    if (!this.config.enableSnapshots) {
      return;
    }

    try {
      // 이벤트 수 확인
      const { count, error } = await this.supabase
        .from(this.config.tableName!)
        .select('*', { count: 'exact', head: true })
        .eq('aggregate_id', aggregateId.toString());

      if (error) {
        throw new Error(`Failed to count events for snapshot: ${error.message}`);
      }

      // 스냅샷 생성 조건 확인
      if ((count || 0) % this.config.snapshotFrequency! === 0) {
        await this.createSnapshot(aggregateId);
      }

    } catch (error) {
      this.logger.error('Snapshot consideration failed', {
        aggregateId: aggregateId.toString(),
        error: error instanceof Error ? error.message : String(error)
      });
      // 스냅샷 실패는 이벤트 저장을 방해하지 않음
    }
  }

  private async createSnapshot(aggregateId: UniqueEntityID): Promise<void> {
    // 스냅샷 생성 로직 구현
    // 현재는 로깅만 수행
    this.logger.info('Snapshot creation triggered', {
      aggregateId: aggregateId.toString(),
      frequency: this.config.snapshotFrequency
    });
  }
}