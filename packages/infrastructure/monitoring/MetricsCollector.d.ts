import { ILogger } from '@woodie/application/common/interfaces/ILogger';
export interface Metric {
    name: string;
    type: 'counter' | 'gauge' | 'histogram' | 'summary';
    value: number;
    labels: Record<string, string>;
    timestamp: Date;
    unit?: string;
}
export interface MetricsSummary {
    totalMetrics: number;
    metricsByType: Record<string, number>;
    timeRange: {
        start: Date;
        end: Date;
    };
    topMetrics: Array<{
        name: string;
        value: number;
        labels: Record<string, string>;
    }>;
}
export interface AlertRule {
    name: string;
    condition: (metrics: Metric[]) => boolean;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    isActive: boolean;
    cooldownMs: number;
    lastTriggered?: Date;
}
export interface AlertEvent {
    rule: AlertRule;
    triggeredAt: Date;
    metrics: Metric[];
    severity: string;
    message: string;
}
export declare class MetricsCollector {
    private readonly logger;
    private readonly metrics;
    private readonly alertRules;
    private readonly alertHistory;
    private readonly retentionPeriodMs;
    constructor(logger: ILogger, retentionPeriodMs?: number);
    collect(metric: Omit<Metric, 'timestamp'>): void;
    incrementCounter(name: string, labels?: Record<string, string>, increment?: number): void;
    setGauge(name: string, value: number, labels?: Record<string, string>, unit?: string): void;
    recordDuration(name: string, durationMs: number, labels?: Record<string, string>): void;
    collectBatch(metrics: Array<Omit<Metric, 'timestamp'>>): void;
    getMetrics(name?: string, labels?: Record<string, string>, fromTime?: Date, toTime?: Date): Metric[];
    aggregateMetrics(name: string, aggregationType: 'sum' | 'avg' | 'min' | 'max' | 'count', groupBy?: string[], fromTime?: Date, toTime?: Date): Array<{
        labels: Record<string, string>;
        value: number;
    }>;
    getSummary(fromTime?: Date, toTime?: Date): MetricsSummary;
    addAlertRule(rule: AlertRule): void;
    removeAlertRule(name: string): void;
    getAlertHistory(severity?: string, fromTime?: Date, toTime?: Date): AlertEvent[];
    exportPrometheusMetrics(): string;
    deleteMetrics(name: string, labels?: Record<string, string>): number;
    private getMetricKey;
    private checkAlertRules;
    private triggerAlert;
    private initializeDefaultAlertRules;
    private startCleanupTimer;
}
//# sourceMappingURL=MetricsCollector.d.ts.map