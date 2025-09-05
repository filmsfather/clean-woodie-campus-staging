export class MetricsCollector {
    logger;
    metrics = new Map();
    alertRules = new Map();
    alertHistory = [];
    retentionPeriodMs;
    constructor(logger, retentionPeriodMs = 7 * 24 * 60 * 60 * 1000 // 7일
    ) {
        this.logger = logger;
        this.retentionPeriodMs = retentionPeriodMs;
        this.initializeDefaultAlertRules();
        this.startCleanupTimer();
    }
    // 메트릭 수집
    collect(metric) {
        const fullMetric = {
            ...metric,
            timestamp: new Date()
        };
        const key = this.getMetricKey(metric.name, metric.labels);
        const existingMetrics = this.metrics.get(key) || [];
        existingMetrics.push(fullMetric);
        this.metrics.set(key, existingMetrics);
        this.logger.debug('Metric collected', {
            name: metric.name,
            type: metric.type,
            value: metric.value,
            labels: metric.labels
        });
        // 알람 규칙 확인
        this.checkAlertRules([fullMetric]);
    }
    // 카운터 메트릭 증가
    incrementCounter(name, labels = {}, increment = 1) {
        this.collect({
            name,
            type: 'counter',
            value: increment,
            labels,
            unit: 'count'
        });
    }
    // 게이지 메트릭 설정
    setGauge(name, value, labels = {}, unit) {
        this.collect({
            name,
            type: 'gauge',
            value,
            labels,
            unit
        });
    }
    // 히스토그램 메트릭 (지속시간 측정용)
    recordDuration(name, durationMs, labels = {}) {
        this.collect({
            name,
            type: 'histogram',
            value: durationMs,
            labels,
            unit: 'ms'
        });
    }
    // 배치 메트릭 수집
    collectBatch(metrics) {
        const fullMetrics = metrics.map(metric => ({
            ...metric,
            timestamp: new Date()
        }));
        fullMetrics.forEach(metric => {
            const key = this.getMetricKey(metric.name, metric.labels);
            const existingMetrics = this.metrics.get(key) || [];
            existingMetrics.push(metric);
            this.metrics.set(key, existingMetrics);
        });
        this.logger.info('Batch metrics collected', {
            count: metrics.length,
            types: [...new Set(metrics.map(m => m.type))]
        });
        this.checkAlertRules(fullMetrics);
    }
    // 메트릭 조회
    getMetrics(name, labels, fromTime, toTime) {
        const now = new Date();
        const from = fromTime || new Date(now.getTime() - 3600000); // 1시간 전
        const to = toTime || now;
        let allMetrics = [];
        if (name) {
            // 특정 메트릭명으로 필터링
            for (const [key, metrics] of this.metrics.entries()) {
                if (key.startsWith(name)) {
                    allMetrics.push(...metrics);
                }
            }
        }
        else {
            // 모든 메트릭
            for (const metrics of this.metrics.values()) {
                allMetrics.push(...metrics);
            }
        }
        return allMetrics
            .filter(metric => metric.timestamp >= from && metric.timestamp <= to)
            .filter(metric => {
            if (!labels)
                return true;
            return Object.entries(labels).every(([key, value]) => metric.labels[key] === value);
        })
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    // 메트릭 집계
    aggregateMetrics(name, aggregationType, groupBy, fromTime, toTime) {
        const metrics = this.getMetrics(name, undefined, fromTime, toTime);
        if (metrics.length === 0) {
            return [];
        }
        // 그룹화
        const groups = new Map();
        metrics.forEach(metric => {
            const groupKey = groupBy
                ? groupBy.map(key => `${key}:${metric.labels[key] || 'unknown'}`).join('|')
                : 'all';
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(metric);
        });
        // 집계 계산
        const results = [];
        groups.forEach((groupMetrics, groupKey) => {
            const values = groupMetrics.map(m => m.value);
            let aggregatedValue;
            switch (aggregationType) {
                case 'sum':
                    aggregatedValue = values.reduce((sum, val) => sum + val, 0);
                    break;
                case 'avg':
                    aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
                    break;
                case 'min':
                    aggregatedValue = Math.min(...values);
                    break;
                case 'max':
                    aggregatedValue = Math.max(...values);
                    break;
                case 'count':
                    aggregatedValue = values.length;
                    break;
                default:
                    aggregatedValue = 0;
            }
            const labels = {};
            if (groupBy && groupKey !== 'all') {
                groupKey.split('|').forEach(pair => {
                    const [key, value] = pair.split(':');
                    labels[key] = value;
                });
            }
            results.push({ labels, value: aggregatedValue });
        });
        return results.sort((a, b) => b.value - a.value);
    }
    // 메트릭 요약 정보
    getSummary(fromTime, toTime) {
        const metrics = this.getMetrics(undefined, undefined, fromTime, toTime);
        const metricsByType = {};
        metrics.forEach(metric => {
            metricsByType[metric.type] = (metricsByType[metric.type] || 0) + 1;
        });
        const topMetrics = this.aggregateMetrics('', 'sum', undefined, fromTime, toTime).slice(0, 10).map(metric => ({
            name: 'aggregated_metric',
            value: metric.value,
            labels: metric.labels
        }));
        const timestamps = metrics.map(m => m.timestamp.getTime());
        const timeRange = {
            start: new Date(Math.min(...timestamps)),
            end: new Date(Math.max(...timestamps))
        };
        return {
            totalMetrics: metrics.length,
            metricsByType,
            timeRange,
            topMetrics
        };
    }
    // 알람 규칙 추가
    addAlertRule(rule) {
        this.alertRules.set(rule.name, rule);
        this.logger.info('Alert rule added', {
            name: rule.name,
            severity: rule.severity,
            isActive: rule.isActive
        });
    }
    // 알람 규칙 제거
    removeAlertRule(name) {
        this.alertRules.delete(name);
        this.logger.info('Alert rule removed', { name });
    }
    // 알람 이력 조회
    getAlertHistory(severity, fromTime, toTime) {
        const now = new Date();
        const from = fromTime || new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24시간 전
        const to = toTime || now;
        return this.alertHistory
            .filter(alert => {
            if (severity && alert.severity !== severity)
                return false;
            return alert.triggeredAt >= from && alert.triggeredAt <= to;
        })
            .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
    }
    // 메트릭 내보내기 (Prometheus 형식)
    exportPrometheusMetrics() {
        const lines = [];
        const now = Date.now();
        for (const [key, metrics] of this.metrics.entries()) {
            // 최근 메트릭만 내보내기
            const recentMetrics = metrics.filter(m => now - m.timestamp.getTime() < 60000 // 1분 이내
            );
            if (recentMetrics.length === 0)
                continue;
            const latestMetric = recentMetrics[recentMetrics.length - 1];
            const labelStr = Object.entries(latestMetric.labels)
                .map(([key, value]) => `${key}="${value}"`)
                .join(',');
            lines.push(`# HELP ${latestMetric.name} ${latestMetric.type} metric`);
            lines.push(`# TYPE ${latestMetric.name} ${latestMetric.type}`);
            lines.push(`${latestMetric.name}{${labelStr}} ${latestMetric.value} ${latestMetric.timestamp.getTime()}`);
        }
        return lines.join('\n');
    }
    // 메트릭 삭제 (특정 조건)
    deleteMetrics(name, labels) {
        let deletedCount = 0;
        for (const [key, metrics] of this.metrics.entries()) {
            if (key.startsWith(name)) {
                const filteredMetrics = metrics.filter(metric => {
                    if (!labels)
                        return false;
                    return !Object.entries(labels).every(([key, value]) => metric.labels[key] === value);
                });
                deletedCount += metrics.length - filteredMetrics.length;
                if (filteredMetrics.length === 0) {
                    this.metrics.delete(key);
                }
                else {
                    this.metrics.set(key, filteredMetrics);
                }
            }
        }
        this.logger.info('Metrics deleted', { name, labels, deletedCount });
        return deletedCount;
    }
    getMetricKey(name, labels) {
        const labelStr = Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join(',');
        return `${name}{${labelStr}}`;
    }
    checkAlertRules(newMetrics) {
        const now = new Date();
        for (const [ruleName, rule] of this.alertRules.entries()) {
            if (!rule.isActive)
                continue;
            // 쿨다운 체크
            if (rule.lastTriggered &&
                now.getTime() - rule.lastTriggered.getTime() < rule.cooldownMs) {
                continue;
            }
            try {
                if (rule.condition(newMetrics)) {
                    this.triggerAlert(rule, newMetrics);
                }
            }
            catch (error) {
                this.logger.error('Alert rule evaluation failed', {
                    ruleName,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }
    triggerAlert(rule, triggeringMetrics) {
        const alertEvent = {
            rule,
            triggeredAt: new Date(),
            metrics: triggeringMetrics,
            severity: rule.severity,
            message: rule.message
        };
        this.alertHistory.push(alertEvent);
        rule.lastTriggered = alertEvent.triggeredAt;
        this.logger[rule.severity === 'critical' ? 'error' : 'warn']('Alert triggered', {
            ruleName: rule.name,
            severity: rule.severity,
            message: rule.message,
            metricsCount: triggeringMetrics.length
        });
        // 여기서 외부 알림 시스템 호출 가능
        // await this.notificationService.send(alertEvent);
    }
    initializeDefaultAlertRules() {
        const defaultRules = [
            {
                name: 'high_error_rate',
                condition: (metrics) => {
                    const errorMetrics = metrics.filter(m => m.name === 'http_requests_total' &&
                        m.labels.status &&
                        parseInt(m.labels.status) >= 500);
                    return errorMetrics.length > 10; // 10개 이상의 에러
                },
                severity: 'error',
                message: 'High error rate detected',
                isActive: true,
                cooldownMs: 300000 // 5분
            },
            {
                name: 'slow_response_time',
                condition: (metrics) => {
                    const responseTimeMetrics = metrics.filter(m => m.name === 'http_request_duration' &&
                        m.value > 5000 // 5초 초과
                    );
                    return responseTimeMetrics.length > 5;
                },
                severity: 'warning',
                message: 'Slow response time detected',
                isActive: true,
                cooldownMs: 600000 // 10분
            },
            {
                name: 'database_connection_failure',
                condition: (metrics) => {
                    return metrics.some(m => m.name === 'database_errors_total' &&
                        m.labels.type === 'connection_failure');
                },
                severity: 'critical',
                message: 'Database connection failure',
                isActive: true,
                cooldownMs: 60000 // 1분
            }
        ];
        defaultRules.forEach(rule => this.addAlertRule(rule));
    }
    startCleanupTimer() {
        // 주기적으로 오래된 메트릭 정리
        setInterval(() => {
            const cutoff = new Date(Date.now() - this.retentionPeriodMs);
            let totalDeleted = 0;
            for (const [key, metrics] of this.metrics.entries()) {
                const filteredMetrics = metrics.filter(m => m.timestamp > cutoff);
                const deleted = metrics.length - filteredMetrics.length;
                totalDeleted += deleted;
                if (filteredMetrics.length === 0) {
                    this.metrics.delete(key);
                }
                else {
                    this.metrics.set(key, filteredMetrics);
                }
            }
            // 오래된 알림 이력도 정리
            const alertCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30일
            const initialAlertCount = this.alertHistory.length;
            this.alertHistory.splice(0, this.alertHistory.findIndex(a => a.triggeredAt > alertCutoff));
            if (totalDeleted > 0) {
                this.logger.info('Metrics cleanup completed', {
                    deletedMetrics: totalDeleted,
                    deletedAlerts: initialAlertCount - this.alertHistory.length,
                    retentionPeriod: this.retentionPeriodMs
                });
            }
        }, 3600000); // 1시간마다
    }
}
//# sourceMappingURL=MetricsCollector.js.map