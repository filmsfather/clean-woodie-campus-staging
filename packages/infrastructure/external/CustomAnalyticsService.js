import { Result } from '@woodie/domain/common/Result';
import { AnalyticsService } from './AnalyticsService';
export class CustomAnalyticsService extends AnalyticsService {
    analyticsEvents = [];
    userProfiles = new Map();
    constructor(logger, config) {
        super(logger, config);
        this.logger.info('Custom analytics service initialized', {
            batchSize: config.batchSize,
            flushInterval: config.flushIntervalMs,
            debugMode: config.enableDebugMode
        });
    }
    async track(eventName, properties, context = {}) {
        try {
            const event = {
                eventName,
                userId: properties.user_id || properties.userId,
                sessionId: properties.session_id || properties.sessionId,
                properties,
                timestamp: new Date(),
                context: {
                    userAgent: context.userAgent,
                    ipAddress: context.ipAddress,
                    referrer: context.referrer,
                    page: context.page,
                    platform: context.platform || 'web',
                    version: context.version || '1.0.0'
                }
            };
            // 로컬 저장소에 이벤트 추가
            this.analyticsEvents.push(event);
            this.addToBuffer(event);
            if (this.config.enableDebugMode) {
                this.logger.debug('Analytics event tracked', {
                    eventName,
                    userId: event.userId,
                    propertiesCount: Object.keys(properties).length
                });
            }
            return Result.ok();
        }
        catch (error) {
            this.logger.error('Failed to track analytics event', {
                error: error instanceof Error ? error.message : String(error),
                eventName
            });
            return Result.fail('Failed to track analytics event');
        }
    }
    async identify(userId, traits) {
        try {
            // 사용자 프로필 업데이트
            const existingProfile = this.userProfiles.get(userId) || {};
            const updatedProfile = {
                ...existingProfile,
                ...traits,
                userId,
                lastUpdated: new Date().toISOString()
            };
            this.userProfiles.set(userId, updatedProfile);
            // identify 이벤트로도 추가 추적
            await this.track('user_identified', {
                user_id: userId,
                traits
            });
            this.logger.debug('User identified', {
                userId,
                traitsCount: Object.keys(traits).length
            });
            return Result.ok();
        }
        catch (error) {
            this.logger.error('Failed to identify user', {
                error: error instanceof Error ? error.message : String(error),
                userId
            });
            return Result.fail('Failed to identify user');
        }
    }
    async page(userId, pageName, properties) {
        return this.track('page_view', {
            user_id: userId,
            page_name: pageName,
            ...properties
        });
    }
    async flush() {
        if (this.eventBuffer.length === 0) {
            return Result.ok();
        }
        try {
            const eventsToFlush = [...this.eventBuffer];
            this.eventBuffer.length = 0; // 버퍼 초기화
            // 실제 분석 서비스가 있다면 여기서 전송
            if (this.config.apiEndpoint) {
                await this.sendToAnalyticsAPI(eventsToFlush);
            }
            this.logger.info('Analytics events flushed', {
                eventCount: eventsToFlush.length,
                provider: this.config.provider
            });
            return Result.ok();
        }
        catch (error) {
            this.logger.error('Failed to flush analytics events', {
                error: error instanceof Error ? error.message : String(error),
                eventCount: this.eventBuffer.length
            });
            return Result.fail('Failed to flush analytics events');
        }
    }
    async query(query) {
        try {
            // 쿼리 조건에 따라 이벤트 필터링
            const filteredEvents = this.analyticsEvents.filter(event => {
                // 날짜 범위 확인
                if (event.timestamp < query.fromDate || event.timestamp > query.toDate) {
                    return false;
                }
                // 이벤트명 필터
                if (query.eventName && event.eventName !== query.eventName) {
                    return false;
                }
                // 사용자 ID 필터
                if (query.userId && event.userId !== query.userId) {
                    return false;
                }
                // 속성 필터
                if (query.properties) {
                    for (const [key, value] of Object.entries(query.properties)) {
                        if (event.properties[key] !== value) {
                            return false;
                        }
                    }
                }
                return true;
            });
            // 그룹화 및 집계
            const groupedData = this.groupAndAggregate(filteredEvents, query);
            const result = {
                data: groupedData,
                totalCount: filteredEvents.length,
                period: { start: query.fromDate, end: query.toDate }
            };
            this.logger.debug('Analytics query executed', {
                queryType: query.eventName || 'all_events',
                filteredEventsCount: filteredEvents.length,
                resultCount: groupedData.length
            });
            return Result.ok(result);
        }
        catch (error) {
            this.logger.error('Failed to execute analytics query', {
                error: error instanceof Error ? error.message : String(error),
                query
            });
            return Result.fail('Failed to execute analytics query');
        }
    }
    async analyzeFunnel(steps, fromDate, toDate, userSegment) {
        try {
            // 각 단계별 사용자 추적
            const stepResults = [];
            let previousStepUsers = new Set();
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                // 해당 단계의 이벤트를 수행한 사용자들 찾기
                const stepEvents = this.analyticsEvents.filter(event => {
                    if (event.timestamp < fromDate || event.timestamp > toDate)
                        return false;
                    if (event.eventName !== step.eventName)
                        return false;
                    if (!event.userId)
                        return false;
                    // 첫 번째 단계가 아니라면 이전 단계를 완료한 사용자만
                    if (i > 0 && !previousStepUsers.has(event.userId))
                        return false;
                    // 속성 조건 확인
                    if (step.properties) {
                        for (const [key, value] of Object.entries(step.properties)) {
                            if (event.properties[key] !== value)
                                return false;
                        }
                    }
                    // 사용자 세그먼트 확인
                    if (userSegment) {
                        const userProfile = this.userProfiles.get(event.userId);
                        if (!userProfile)
                            return false;
                        for (const [key, value] of Object.entries(userSegment)) {
                            if (userProfile[key] !== value)
                                return false;
                        }
                    }
                    return true;
                });
                const stepUsers = new Set(stepEvents.map(e => e.userId));
                const userCount = stepUsers.size;
                let conversionRate = 0;
                let dropoffRate = 0;
                if (i === 0) {
                    // 첫 번째 단계
                    conversionRate = 100;
                }
                else {
                    // 이전 단계 대비 전환율
                    const previousUserCount = previousStepUsers.size;
                    conversionRate = previousUserCount > 0 ? (userCount / previousUserCount) * 100 : 0;
                    dropoffRate = 100 - conversionRate;
                }
                stepResults.push({
                    stepName: step.stepName,
                    userCount,
                    conversionRate,
                    dropoffRate
                });
                previousStepUsers = stepUsers;
            }
            // 전체 전환율 계산
            const totalUsers = stepResults[0]?.userCount || 0;
            const finalUsers = stepResults[stepResults.length - 1]?.userCount || 0;
            const overallConversionRate = totalUsers > 0 ? (finalUsers / totalUsers) * 100 : 0;
            const funnelResult = {
                steps: stepResults,
                totalUsers,
                overallConversionRate
            };
            this.logger.info('Funnel analysis completed', {
                stepCount: steps.length,
                totalUsers,
                overallConversionRate: overallConversionRate.toFixed(2) + '%'
            });
            return Result.ok(funnelResult);
        }
        catch (error) {
            this.logger.error('Failed to analyze funnel', {
                error: error instanceof Error ? error.message : String(error),
                stepCount: steps.length
            });
            return Result.fail('Failed to analyze funnel');
        }
    }
    async analyzeCohort(cohortPeriod, retentionEvent, fromDate, toDate) {
        try {
            // 코호트 분석 구현
            const cohorts = [];
            // 코호트 기간에 따른 그룹화
            const cohortGroups = this.groupUsersByCohort(cohortPeriod, fromDate, toDate);
            for (const [cohortKey, users] of cohortGroups.entries()) {
                const cohortStart = new Date(cohortKey);
                const retentionRates = this.calculateRetentionRates(users, retentionEvent, cohortStart, cohortPeriod);
                cohorts.push({
                    cohortName: cohortKey,
                    cohortStart,
                    userCount: users.size,
                    retentionRates
                });
            }
            const retentionPeriods = this.getRetentionPeriods(cohortPeriod);
            const cohortAnalysis = {
                cohortPeriod,
                retentionPeriods,
                cohorts
            };
            this.logger.info('Cohort analysis completed', {
                cohortPeriod,
                cohortCount: cohorts.length,
                retentionEvent
            });
            return Result.ok(cohortAnalysis);
        }
        catch (error) {
            this.logger.error('Failed to analyze cohort', {
                error: error instanceof Error ? error.message : String(error),
                cohortPeriod,
                retentionEvent
            });
            return Result.fail('Failed to analyze cohort');
        }
    }
    // 실시간 분석 대시보드 데이터
    async getRealTimeAnalytics() {
        try {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            // 현재 활성 사용자 (최근 5분 이내)
            const activeUsers = new Set(this.analyticsEvents
                .filter(e => e.timestamp > fiveMinutesAgo && e.userId)
                .map(e => e.userId));
            // 지난 1시간 이벤트 수
            const recentEvents = this.analyticsEvents.filter(e => e.timestamp > oneHourAgo);
            // 상위 이벤트
            const eventCounts = new Map();
            recentEvents.forEach(event => {
                eventCounts.set(event.eventName, (eventCounts.get(event.eventName) || 0) + 1);
            });
            const topEvents = Array.from(eventCounts.entries())
                .map(([eventName, count]) => ({ eventName, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
            // 사용자 플로우 (간단한 버전)
            const userFlow = this.calculateUserFlow(recentEvents);
            const realTimeData = {
                currentActiveUsers: activeUsers.size,
                eventsInLastHour: recentEvents.length,
                topEvents,
                userFlow
            };
            return Result.ok(realTimeData);
        }
        catch (error) {
            this.logger.error('Failed to get real-time analytics', {
                error: error instanceof Error ? error.message : String(error)
            });
            return Result.fail('Failed to get real-time analytics');
        }
    }
    async sendToAnalyticsAPI(events) {
        if (!this.config.apiEndpoint)
            return;
        try {
            // HTTP 요청으로 외부 분석 서비스에 전송
            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({ events })
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            this.logger.debug('Events sent to analytics API', {
                eventCount: events.length,
                endpoint: this.config.apiEndpoint
            });
        }
        catch (error) {
            this.logger.error('Failed to send events to analytics API', {
                error: error instanceof Error ? error.message : String(error),
                eventCount: events.length
            });
            throw error;
        }
    }
    groupAndAggregate(events, query) {
        const groups = new Map();
        // 그룹화
        events.forEach(event => {
            let groupKey = 'all';
            if (query.groupBy && query.groupBy.length > 0) {
                const keyParts = query.groupBy.map(field => {
                    if (field === 'date') {
                        return event.timestamp.toISOString().split('T')[0];
                    }
                    else if (field === 'hour') {
                        return event.timestamp.getHours().toString();
                    }
                    else {
                        return event.properties[field] || 'unknown';
                    }
                });
                groupKey = keyParts.join('|');
            }
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(event);
        });
        // 집계
        const results = Array.from(groups.entries()).map(([groupKey, groupEvents]) => {
            const dimensions = {};
            if (query.groupBy && query.groupBy.length > 0) {
                const keyParts = groupKey.split('|');
                query.groupBy.forEach((field, index) => {
                    dimensions[field] = keyParts[index] || 'unknown';
                });
            }
            const metrics = {};
            switch (query.aggregation) {
                case 'count':
                    metrics.count = groupEvents.length;
                    break;
                case 'unique':
                    metrics.unique = new Set(groupEvents.map(e => e.userId).filter(Boolean)).size;
                    break;
                case 'sum':
                    metrics.sum = groupEvents.reduce((sum, e) => sum + (typeof e.properties.value === 'number' ? e.properties.value : 0), 0);
                    break;
                case 'avg':
                    const values = groupEvents
                        .map(e => typeof e.properties.value === 'number' ? e.properties.value : 0)
                        .filter(v => v > 0);
                    metrics.avg = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
                    break;
                default:
                    metrics.count = groupEvents.length;
            }
            return { dimensions, metrics, timestamp: groupEvents[0]?.timestamp };
        });
        // 제한 적용
        if (query.limit) {
            return results.slice(0, query.limit);
        }
        return results;
    }
    groupUsersByCohort(cohortPeriod, fromDate, toDate) {
        const cohorts = new Map();
        // 사용자 첫 접속 이벤트 기준으로 코호트 분류
        const userFirstSeen = new Map();
        this.analyticsEvents
            .filter(e => e.userId && e.timestamp >= fromDate && e.timestamp <= toDate)
            .forEach(event => {
            if (!userFirstSeen.has(event.userId) || event.timestamp < userFirstSeen.get(event.userId)) {
                userFirstSeen.set(event.userId, event.timestamp);
            }
        });
        userFirstSeen.forEach((firstSeenDate, userId) => {
            const cohortKey = this.getCohortKey(firstSeenDate, cohortPeriod);
            if (!cohorts.has(cohortKey)) {
                cohorts.set(cohortKey, new Set());
            }
            cohorts.get(cohortKey).add(userId);
        });
        return cohorts;
    }
    calculateRetentionRates(cohortUsers, retentionEvent, cohortStart, cohortPeriod) {
        const retentionRates = [];
        const periodMs = this.getPeriodMilliseconds(cohortPeriod);
        // 최대 12개 기간까지 추적 (12일/주/월)
        for (let period = 1; period <= 12; period++) {
            const periodStart = new Date(cohortStart.getTime() + (period - 1) * periodMs);
            const periodEnd = new Date(cohortStart.getTime() + period * periodMs);
            const retainedUsers = new Set();
            this.analyticsEvents
                .filter(e => e.eventName === retentionEvent &&
                e.timestamp >= periodStart &&
                e.timestamp < periodEnd &&
                e.userId &&
                cohortUsers.has(e.userId))
                .forEach(e => retainedUsers.add(e.userId));
            const retentionRate = cohortUsers.size > 0
                ? (retainedUsers.size / cohortUsers.size) * 100
                : 0;
            retentionRates.push(retentionRate);
        }
        return retentionRates;
    }
    calculateUserFlow(events) {
        const transitions = new Map();
        // 사용자별 이벤트 시퀀스 생성
        const userEventSequences = new Map();
        events
            .filter(e => e.userId)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            .forEach(event => {
            if (!userEventSequences.has(event.userId)) {
                userEventSequences.set(event.userId, []);
            }
            userEventSequences.get(event.userId).push(event.eventName);
        });
        // 전환 패턴 계산
        userEventSequences.forEach(sequence => {
            for (let i = 0; i < sequence.length - 1; i++) {
                const from = sequence[i];
                const to = sequence[i + 1];
                const transitionKey = `${from} -> ${to}`;
                transitions.set(transitionKey, (transitions.get(transitionKey) || 0) + 1);
            }
        });
        return Array.from(transitions.entries())
            .map(([transition, count]) => {
            const [from, to] = transition.split(' -> ');
            return { from, to, count };
        })
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // 상위 20개 전환 패턴
    }
    getCohortKey(date, period) {
        switch (period) {
            case 'daily':
                return date.toISOString().split('T')[0];
            case 'weekly':
                const week = new Date(date);
                week.setDate(date.getDate() - date.getDay()); // 주의 시작일 (일요일)
                return week.toISOString().split('T')[0];
            case 'monthly':
                return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            default:
                return date.toISOString().split('T')[0];
        }
    }
    getPeriodMilliseconds(period) {
        switch (period) {
            case 'daily':
                return 24 * 60 * 60 * 1000;
            case 'weekly':
                return 7 * 24 * 60 * 60 * 1000;
            case 'monthly':
                return 30 * 24 * 60 * 60 * 1000; // 근사치
            default:
                return 24 * 60 * 60 * 1000;
        }
    }
    getRetentionPeriods(period) {
        return Array.from({ length: 12 }, (_, i) => i + 1);
    }
}
//# sourceMappingURL=CustomAnalyticsService.js.map