import { SupabaseClient } from '@supabase/supabase-js';
import { DomainEvent } from '@woodie/domain/events';
import { IEventStore } from '@woodie/domain/events';
import { UniqueEntityID } from '@woodie/domain/common/Identifier';
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
export interface EventStoreConfig {
    tableName?: string;
    enableSnapshots?: boolean;
    snapshotFrequency?: number;
    maxEventsPerQuery?: number;
    enableCompression?: boolean;
}
export declare class SupabaseEventStore implements IEventStore {
    private readonly supabase;
    private readonly logger;
    private readonly config;
    constructor(supabase: SupabaseClient, logger: ILogger, config?: EventStoreConfig);
    saveEvent(event: DomainEvent): Promise<void>;
    saveEvents(events: DomainEvent[]): Promise<void>;
    getEvents(aggregateId: UniqueEntityID, fromVersion?: number): Promise<DomainEvent[]>;
    getAllEvents(fromEventId?: UniqueEntityID, limit?: number): Promise<DomainEvent[]>;
    getEventsByType(eventType: string, limit?: number, fromDate?: Date): Promise<DomainEvent[]>;
    getEventStream(options?: {
        fromEventId?: string;
        toEventId?: string;
        eventTypes?: string[];
        aggregateIds?: string[];
        fromDate?: Date;
        toDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        events: DomainEvent[];
        hasMore: boolean;
        nextOffset?: number;
    }>;
    getEventStatistics(options?: {
        fromDate?: Date;
        toDate?: Date;
        eventTypes?: string[];
        aggregateIds?: string[];
    }): Promise<{
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsByDay: Record<string, number>;
        uniqueAggregates: number;
    }>;
    private mapToEventRecord;
    private mapToDomainEvent;
    private considerSnapshot;
    private createSnapshot;
}
//# sourceMappingURL=SupabaseEventStore.d.ts.map