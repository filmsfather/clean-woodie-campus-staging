import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
import { AnalyticsService, AnalyticsEvent, AnalyticsConfig, AnalyticsQuery, AnalyticsResult, FunnelStep, FunnelResult, CohortAnalysis } from './AnalyticsService';
export declare class CustomAnalyticsService extends AnalyticsService {
    private readonly analyticsEvents;
    private readonly userProfiles;
    constructor(logger: ILogger, config: AnalyticsConfig);
    track(eventName: string, properties: Record<string, any>, context?: Partial<AnalyticsEvent['context']>): Promise<Result<void>>;
    identify(userId: string, traits: Record<string, any>): Promise<Result<void>>;
    page(userId: string, pageName: string, properties: Record<string, any>): Promise<Result<void>>;
    flush(): Promise<Result<void>>;
    query(query: AnalyticsQuery): Promise<Result<AnalyticsResult>>;
    analyzeFunnel(steps: FunnelStep[], fromDate: Date, toDate: Date, userSegment?: Record<string, any>): Promise<Result<FunnelResult>>;
    analyzeCohort(cohortPeriod: 'daily' | 'weekly' | 'monthly', retentionEvent: string, fromDate: Date, toDate: Date): Promise<Result<CohortAnalysis>>;
    getRealTimeAnalytics(): Promise<Result<{
        currentActiveUsers: number;
        eventsInLastHour: number;
        topEvents: Array<{
            eventName: string;
            count: number;
        }>;
        userFlow: Array<{
            from: string;
            to: string;
            count: number;
        }>;
    }>>;
    private sendToAnalyticsAPI;
    private groupAndAggregate;
    private groupUsersByCohort;
    private calculateRetentionRates;
    private calculateUserFlow;
    private getCohortKey;
    private getPeriodMilliseconds;
    private getRetentionPeriods;
}
//# sourceMappingURL=CustomAnalyticsService.d.ts.map