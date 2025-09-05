import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
import { MetricsCollector } from './MetricsCollector';

export interface UsageEvent {
  userId: string;
  eventType: string;
  resourceType: string;
  resourceId: string;
  action: string;
  metadata: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  userRole?: string;
}

export interface ProblemUsageStats {
  problemId: string;
  teacherId: string;
  title: string;
  totalViews: number;
  totalAttempts: number;
  totalCompletions: number;
  averageScore: number;
  completionRate: number;
  averageTimeSpent: number;
  difficultyRating?: number;
  popularityScore: number;
  lastUsed: Date;
  usageByGrade: Record<string, number>;
  usageByTimeOfDay: Record<string, number>;
  commonMistakes: string[];
}

export interface TeacherUsageStats {
  teacherId: string;
  totalProblems: number;
  totalProblemSets: number;
  totalStudentAttempts: number;
  averageStudentScore: number;
  mostPopularProblem: string;
  mostDifficultProblem: string;
  teachingEffectiveness: number;
  studentEngagement: number;
  contentCreationRate: number;
  lastActive: Date;
  monthlyStats: Array<{
    month: string;
    problemsCreated: number;
    studentInteractions: number;
    averageScore: number;
  }>;
}

export interface StudentUsageStats {
  studentId: string;
  totalAttempts: number;
  totalCompletions: number;
  averageScore: number;
  totalTimeSpent: number;
  streakDays: number;
  favoriteSubjects: string[];
  strongAreas: string[];
  improvementAreas: string[];
  progressTrend: 'improving' | 'declining' | 'stable';
  lastActive: Date;
  weeklyActivity: Array<{
    week: string;
    attempts: number;
    completions: number;
    averageScore: number;
    timeSpent: number;
  }>;
}

export interface SystemUsageStats {
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  totalProblems: number;
  totalProblemSets: number;
  totalAttempts: number;
  averageSessionDuration: number;
  peakUsageHours: Array<{ hour: number; userCount: number }>;
  popularFeatures: Array<{ feature: string; usageCount: number }>;
  systemHealth: {
    uptime: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

export class UsageStatisticsService {
  private readonly logger: ILogger;
  private readonly metricsCollector: MetricsCollector;
  private readonly usageEvents: UsageEvent[] = [];
  private readonly retentionPeriodMs: number;

  constructor(
    logger: ILogger,
    metricsCollector: MetricsCollector,
    retentionPeriodMs: number = 90 * 24 * 60 * 60 * 1000 // 90일
  ) {
    this.logger = logger;
    this.metricsCollector = metricsCollector;
    this.retentionPeriodMs = retentionPeriodMs;
    this.startEventProcessingTimer();
  }

  // 사용 이벤트 기록
  recordUsageEvent(event: Omit<UsageEvent, 'timestamp'>): void {
    const usageEvent: UsageEvent = {
      ...event,
      timestamp: new Date()
    };

    this.usageEvents.push(usageEvent);

    // 메트릭으로도 수집
    this.metricsCollector.incrementCounter('usage_events_total', {
      event_type: event.eventType,
      resource_type: event.resourceType,
      action: event.action,
      user_role: event.userRole || 'unknown'
    });

    this.logger.debug('Usage event recorded', {
      userId: event.userId,
      eventType: event.eventType,
      resourceType: event.resourceType,
      action: event.action
    });
  }

  // 문제 사용 통계
  async getProblemUsageStats(
    problemId?: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<Result<ProblemUsageStats[]>> {
    try {
      const events = this.getFilteredEvents({
        resourceType: 'problem',
        resourceId: problemId,
        fromDate,
        toDate
      });

      const problemStats = new Map<string, Partial<ProblemUsageStats>>();

      // 이벤트 집계
      events.forEach(event => {
        const pid = event.resourceId;
        if (!problemStats.has(pid)) {
          problemStats.set(pid, {
            problemId: pid,
            teacherId: event.metadata.teacherId || 'unknown',
            title: event.metadata.problemTitle || 'Unknown Problem',
            totalViews: 0,
            totalAttempts: 0,
            totalCompletions: 0,
            averageScore: 0,
            averageTimeSpent: 0,
            usageByGrade: {},
            usageByTimeOfDay: {},
            commonMistakes: []
          });
        }

        const stats = problemStats.get(pid)!;

        switch (event.action) {
          case 'view':
            stats.totalViews = (stats.totalViews || 0) + 1;
            break;
          case 'attempt':
            stats.totalAttempts = (stats.totalAttempts || 0) + 1;
            break;
          case 'complete':
            stats.totalCompletions = (stats.totalCompletions || 0) + 1;
            if (event.metadata.score) {
              const currentAvg = stats.averageScore || 0;
              const count = stats.totalCompletions;
              stats.averageScore = (currentAvg * (count - 1) + event.metadata.score) / count;
            }
            break;
        }

        // 시간대별 사용량
        const hour = event.timestamp.getHours().toString();
        stats.usageByTimeOfDay![hour] = (stats.usageByTimeOfDay![hour] || 0) + 1;

        // 학년별 사용량
        if (event.metadata.studentGrade) {
          const grade = event.metadata.studentGrade.toString();
          stats.usageByGrade![grade] = (stats.usageByGrade![grade] || 0) + 1;
        }

        // 시간 소요 기록
        if (event.metadata.timeSpent) {
          const currentAvg = stats.averageTimeSpent || 0;
          const count = (stats.totalAttempts || 0) + (stats.totalCompletions || 0);
          stats.averageTimeSpent = (currentAvg * (count - 1) + event.metadata.timeSpent) / count;
        }

        stats.lastUsed = event.timestamp;
      });

      // 통계 완성
      const completedStats: ProblemUsageStats[] = Array.from(problemStats.values()).map(stats => ({
        ...stats,
        completionRate: stats.totalAttempts! > 0 ? (stats.totalCompletions! / stats.totalAttempts!) * 100 : 0,
        popularityScore: this.calculatePopularityScore(stats as ProblemUsageStats),
        difficultyRating: this.calculateDifficultyRating(stats as ProblemUsageStats)
      })) as ProblemUsageStats[];

      return Result.ok(completedStats);

    } catch (error) {
      this.logger.error('Failed to get problem usage stats', {
        error: error instanceof Error ? error.message : String(error),
        problemId
      });
      return Result.fail<ProblemUsageStats[]>('Failed to get problem usage stats');
    }
  }

  // 교사 사용 통계
  async getTeacherUsageStats(
    teacherId?: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<Result<TeacherUsageStats[]>> {
    try {
      const events = this.getFilteredEvents({
        userId: teacherId,
        userRole: 'teacher',
        fromDate,
        toDate
      });

      const teacherStats = new Map<string, Partial<TeacherUsageStats>>();

      events.forEach(event => {
        const tid = event.userId;
        if (!teacherStats.has(tid)) {
          teacherStats.set(tid, {
            teacherId: tid,
            totalProblems: 0,
            totalProblemSets: 0,
            totalStudentAttempts: 0,
            averageStudentScore: 0,
            monthlyStats: []
          });
        }

        const stats = teacherStats.get(tid)!;

        if (event.eventType === 'create') {
          if (event.resourceType === 'problem') {
            stats.totalProblems = (stats.totalProblems || 0) + 1;
          } else if (event.resourceType === 'problem_set') {
            stats.totalProblemSets = (stats.totalProblemSets || 0) + 1;
          }
        }

        if (event.metadata.studentScore) {
          const currentAvg = stats.averageStudentScore || 0;
          const count = (stats.totalStudentAttempts || 0) + 1;
          stats.averageStudentScore = (currentAvg * (stats.totalStudentAttempts || 0) + event.metadata.studentScore) / count;
          stats.totalStudentAttempts = count;
        }

        stats.lastActive = event.timestamp;
      });

      // 월별 통계 계산
      for (const [teacherId, stats] of teacherStats.entries()) {
        stats.monthlyStats = this.calculateMonthlyStats(teacherId, fromDate, toDate);
        stats.teachingEffectiveness = this.calculateTeachingEffectiveness(stats as TeacherUsageStats);
        stats.studentEngagement = this.calculateStudentEngagement(stats as TeacherUsageStats);
        stats.contentCreationRate = this.calculateContentCreationRate(stats as TeacherUsageStats);
      }

      return Result.ok(Array.from(teacherStats.values()) as TeacherUsageStats[]);

    } catch (error) {
      this.logger.error('Failed to get teacher usage stats', {
        error: error instanceof Error ? error.message : String(error),
        teacherId
      });
      return Result.fail<TeacherUsageStats[]>('Failed to get teacher usage stats');
    }
  }

  // 학생 사용 통계
  async getStudentUsageStats(
    studentId?: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<Result<StudentUsageStats[]>> {
    try {
      const events = this.getFilteredEvents({
        userId: studentId,
        userRole: 'student',
        fromDate,
        toDate
      });

      const studentStats = new Map<string, Partial<StudentUsageStats>>();

      events.forEach(event => {
        const sid = event.userId;
        if (!studentStats.has(sid)) {
          studentStats.set(sid, {
            studentId: sid,
            totalAttempts: 0,
            totalCompletions: 0,
            averageScore: 0,
            totalTimeSpent: 0,
            streakDays: 0,
            favoriteSubjects: [],
            strongAreas: [],
            improvementAreas: [],
            progressTrend: 'stable',
            weeklyActivity: []
          });
        }

        const stats = studentStats.get(sid)!;

        if (event.action === 'attempt') {
          stats.totalAttempts = (stats.totalAttempts || 0) + 1;
        }

        if (event.action === 'complete') {
          stats.totalCompletions = (stats.totalCompletions || 0) + 1;
          
          if (event.metadata.score) {
            const currentAvg = stats.averageScore || 0;
            const count = stats.totalCompletions;
            stats.averageScore = (currentAvg * (count - 1) + event.metadata.score) / count;
          }
        }

        if (event.metadata.timeSpent) {
          stats.totalTimeSpent = (stats.totalTimeSpent || 0) + event.metadata.timeSpent;
        }

        stats.lastActive = event.timestamp;
      });

      // 추가 통계 계산
      for (const [studentId, stats] of studentStats.entries()) {
        stats.weeklyActivity = this.calculateWeeklyActivity(studentId, fromDate, toDate);
        stats.streakDays = this.calculateStreakDays(studentId);
        stats.favoriteSubjects = this.calculateFavoriteSubjects(studentId);
        stats.strongAreas = this.calculateStrongAreas(studentId);
        stats.improvementAreas = this.calculateImprovementAreas(studentId);
        stats.progressTrend = this.calculateProgressTrend(studentId);
      }

      return Result.ok(Array.from(studentStats.values()) as StudentUsageStats[]);

    } catch (error) {
      this.logger.error('Failed to get student usage stats', {
        error: error instanceof Error ? error.message : String(error),
        studentId
      });
      return Result.fail<StudentUsageStats[]>('Failed to get student usage stats');
    }
  }

  // 시스템 전체 사용 통계
  async getSystemUsageStats(fromDate?: Date, toDate?: Date): Promise<Result<SystemUsageStats>> {
    try {
      const now = new Date();
      const from = fromDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30일 전
      const to = toDate || now;

      const events = this.getFilteredEvents({ fromDate: from, toDate: to });

      // 고유 사용자 계산
      const dailyUsers = this.getUniqueUsersByPeriod(events, 'daily');
      const weeklyUsers = this.getUniqueUsersByPeriod(events, 'weekly');  
      const monthlyUsers = this.getUniqueUsersByPeriod(events, 'monthly');

      // 총 리소스 계산
      const problemIds = new Set(
        events
          .filter(e => e.resourceType === 'problem')
          .map(e => e.resourceId)
      );

      const problemSetIds = new Set(
        events
          .filter(e => e.resourceType === 'problem_set')
          .map(e => e.resourceId)
      );

      const totalAttempts = events.filter(e => e.action === 'attempt').length;

      // 세션 지속 시간 계산
      const sessionDurations = this.calculateSessionDurations(events);
      const averageSessionDuration = sessionDurations.length > 0 
        ? sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length
        : 0;

      // 피크 사용 시간 계산
      const peakUsageHours = this.calculatePeakUsageHours(events);

      // 인기 기능 계산
      const popularFeatures = this.calculatePopularFeatures(events);

      // 시스템 건강 상태
      const systemHealth = await this.getSystemHealth();

      const systemStats: SystemUsageStats = {
        totalUsers: new Set(events.map(e => e.userId)).size,
        activeUsers: {
          daily: dailyUsers,
          weekly: weeklyUsers,
          monthly: monthlyUsers
        },
        totalProblems: problemIds.size,
        totalProblemSets: problemSetIds.size,
        totalAttempts,
        averageSessionDuration,
        peakUsageHours,
        popularFeatures,
        systemHealth
      };

      return Result.ok(systemStats);

    } catch (error) {
      this.logger.error('Failed to get system usage stats', {
        error: error instanceof Error ? error.message : String(error)
      });
      return Result.fail<SystemUsageStats>('Failed to get system usage stats');
    }
  }

  // 실시간 사용자 활동 추적
  trackUserActivity(userId: string, activity: string, metadata: Record<string, any> = {}): void {
    this.recordUsageEvent({
      userId,
      eventType: 'activity',
      resourceType: 'user_session',
      resourceId: userId,
      action: activity,
      metadata,
      userRole: metadata.userRole
    });

    // 실시간 메트릭 업데이트
    this.metricsCollector.setGauge('active_users_current', 
      this.getCurrentActiveUsers(), 
      { activity_type: activity }
    );
  }

  // 성능 메트릭 기록
  recordPerformanceMetric(
    operationType: string,
    durationMs: number,
    success: boolean,
    metadata: Record<string, any> = {}
  ): void {
    this.metricsCollector.recordDuration(
      'operation_duration',
      durationMs,
      { 
        operation: operationType,
        success: success.toString(),
        ...metadata 
      }
    );

    if (!success) {
      this.metricsCollector.incrementCounter(
        'operation_errors_total',
        { 
          operation: operationType,
          error_type: metadata.errorType || 'unknown'
        }
      );
    }
  }

  private getFilteredEvents(filters: {
    userId?: string;
    eventType?: string;
    resourceType?: string;
    resourceId?: string;
    action?: string;
    userRole?: string;
    fromDate?: Date;
    toDate?: Date;
  }): UsageEvent[] {
    const now = new Date();
    const from = filters.fromDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const to = filters.toDate || now;

    return this.usageEvents.filter(event => {
      if (event.timestamp < from || event.timestamp > to) return false;
      if (filters.userId && event.userId !== filters.userId) return false;
      if (filters.eventType && event.eventType !== filters.eventType) return false;
      if (filters.resourceType && event.resourceType !== filters.resourceType) return false;
      if (filters.resourceId && event.resourceId !== filters.resourceId) return false;
      if (filters.action && event.action !== filters.action) return false;
      if (filters.userRole && event.userRole !== filters.userRole) return false;
      return true;
    });
  }

  private calculatePopularityScore(stats: ProblemUsageStats): number {
    const viewWeight = 1;
    const attemptWeight = 3;
    const completionWeight = 5;
    
    return (stats.totalViews * viewWeight) + 
           (stats.totalAttempts * attemptWeight) + 
           (stats.totalCompletions * completionWeight);
  }

  private calculateDifficultyRating(stats: ProblemUsageStats): number {
    if (stats.totalAttempts === 0) return 0;
    
    // 완료율이 낮고 평균 점수가 낮을수록 어려운 문제
    const completionRate = stats.completionRate / 100;
    const scoreRate = (stats.averageScore || 0) / 100;
    
    return Math.max(0, Math.min(5, 5 - (completionRate * 2 + scoreRate * 3)));
  }

  private calculateMonthlyStats(teacherId: string, fromDate?: Date, toDate?: Date): Array<{
    month: string;
    problemsCreated: number;
    studentInteractions: number;
    averageScore: number;
  }> {
    // 실제 구현에서는 더 정교한 월별 집계 로직
    return [];
  }

  private calculateTeachingEffectiveness(stats: TeacherUsageStats): number {
    // 학생 평균 점수와 참여도를 기반으로 계산
    return Math.min(100, (stats.averageStudentScore || 0) * 0.7 + (stats.studentEngagement || 0) * 0.3);
  }

  private calculateStudentEngagement(stats: TeacherUsageStats): number {
    // 학생 상호작용 빈도를 기반으로 계산
    return Math.min(100, (stats.totalStudentAttempts || 0) / Math.max(1, stats.totalProblems || 1) * 10);
  }

  private calculateContentCreationRate(stats: TeacherUsageStats): number {
    // 월별 콘텐츠 생성 비율 계산
    const monthlyAvg = stats.monthlyStats.reduce((sum, m) => sum + m.problemsCreated, 0) / 
                      Math.max(1, stats.monthlyStats.length);
    return monthlyAvg;
  }

  private calculateWeeklyActivity(studentId: string, fromDate?: Date, toDate?: Date): Array<{
    week: string;
    attempts: number;
    completions: number;
    averageScore: number;
    timeSpent: number;
  }> {
    // 실제 구현에서는 더 정교한 주별 집계 로직
    return [];
  }

  private calculateStreakDays(studentId: string): number {
    const userEvents = this.usageEvents
      .filter(e => e.userId === studentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    let streak = 0;
    let lastDate: Date | null = null;

    for (const event of userEvents) {
      const eventDate = new Date(event.timestamp.toDateString());
      
      if (!lastDate) {
        lastDate = eventDate;
        streak = 1;
      } else {
        const dayDiff = (lastDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (dayDiff === 1) {
          streak++;
          lastDate = eventDate;
        } else if (dayDiff > 1) {
          break;
        }
      }
    }

    return streak;
  }

  private calculateFavoriteSubjects(studentId: string): string[] {
    const subjectCounts = new Map<string, number>();
    
    this.usageEvents
      .filter(e => e.userId === studentId && e.metadata.subject)
      .forEach(e => {
        const subject = e.metadata.subject;
        subjectCounts.set(subject, (subjectCounts.get(subject) || 0) + 1);
      });

    return Array.from(subjectCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([subject]) => subject);
  }

  private calculateStrongAreas(studentId: string): string[] {
    // 높은 점수를 받은 영역들
    return [];
  }

  private calculateImprovementAreas(studentId: string): string[] {
    // 낮은 점수를 받은 영역들
    return [];
  }

  private calculateProgressTrend(studentId: string): 'improving' | 'declining' | 'stable' {
    // 최근 성과 변화 추이 분석
    return 'stable';
  }

  private getUniqueUsersByPeriod(events: UsageEvent[], period: 'daily' | 'weekly' | 'monthly'): number {
    const now = new Date();
    let cutoffTime: number;

    switch (period) {
      case 'daily':
        cutoffTime = now.getTime() - 24 * 60 * 60 * 1000;
        break;
      case 'weekly':
        cutoffTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'monthly':
        cutoffTime = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        break;
    }

    const activeUsers = new Set(
      events
        .filter(e => e.timestamp.getTime() > cutoffTime)
        .map(e => e.userId)
    );

    return activeUsers.size;
  }

  private calculateSessionDurations(events: UsageEvent[]): number[] {
    const sessionDurations: number[] = [];
    const userSessions = new Map<string, Date[]>();

    // 사용자별 활동 시간 그룹화
    events.forEach(event => {
      if (!userSessions.has(event.userId)) {
        userSessions.set(event.userId, []);
      }
      userSessions.get(event.userId)!.push(event.timestamp);
    });

    // 각 사용자별 세션 지속시간 계산
    userSessions.forEach(timestamps => {
      timestamps.sort((a, b) => a.getTime() - b.getTime());
      
      if (timestamps.length >= 2) {
        const duration = timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime();
        sessionDurations.push(duration);
      }
    });

    return sessionDurations;
  }

  private calculatePeakUsageHours(events: UsageEvent[]): Array<{ hour: number; userCount: number }> {
    const hourCounts = new Map<number, Set<string>>();

    events.forEach(event => {
      const hour = event.timestamp.getHours();
      if (!hourCounts.has(hour)) {
        hourCounts.set(hour, new Set());
      }
      hourCounts.get(hour)!.add(event.userId);
    });

    return Array.from(hourCounts.entries())
      .map(([hour, users]) => ({ hour, userCount: users.size }))
      .sort((a, b) => b.userCount - a.userCount)
      .slice(0, 5);
  }

  private calculatePopularFeatures(events: UsageEvent[]): Array<{ feature: string; usageCount: number }> {
    const featureCounts = new Map<string, number>();

    events.forEach(event => {
      const feature = `${event.resourceType}_${event.action}`;
      featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
    });

    return Array.from(featureCounts.entries())
      .map(([feature, usageCount]) => ({ feature, usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);
  }

  private async getSystemHealth(): Promise<{
    uptime: number;
    averageResponseTime: number;
    errorRate: number;
  }> {
    // 실제 구현에서는 시스템 메트릭에서 조회
    const responseTimeMetrics = this.metricsCollector.getMetrics('operation_duration');
    const errorMetrics = this.metricsCollector.getMetrics('operation_errors_total');

    const averageResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0;

    const totalOperations = responseTimeMetrics.length;
    const errorCount = errorMetrics.reduce((sum, m) => sum + m.value, 0);
    const errorRate = totalOperations > 0 ? (errorCount / totalOperations) * 100 : 0;

    return {
      uptime: process.uptime() * 1000, // ms
      averageResponseTime,
      errorRate
    };
  }

  private getCurrentActiveUsers(): number {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const activeUsers = new Set(
      this.usageEvents
        .filter(e => e.timestamp > fiveMinutesAgo)
        .map(e => e.userId)
    );

    return activeUsers.size;
  }

  private startEventProcessingTimer(): void {
    // 주기적으로 오래된 이벤트 정리
    setInterval(() => {
      const cutoff = new Date(Date.now() - this.retentionPeriodMs);
      const initialCount = this.usageEvents.length;
      
      // 오래된 이벤트 제거
      let i = 0;
      while (i < this.usageEvents.length) {
        if (this.usageEvents[i].timestamp < cutoff) {
          this.usageEvents.splice(i, 1);
        } else {
          i++;
        }
      }

      const deletedCount = initialCount - this.usageEvents.length;
      if (deletedCount > 0) {
        this.logger.info('Usage events cleanup completed', {
          deletedEvents: deletedCount,
          remainingEvents: this.usageEvents.length
        });
      }
    }, 3600000); // 1시간마다
  }
}