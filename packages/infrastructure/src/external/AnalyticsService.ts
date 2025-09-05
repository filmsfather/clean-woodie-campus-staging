import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';

export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, any>;
  timestamp: Date;
  context: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    page?: string;
    platform?: string;
    version?: string;
  };
}

export interface UserProfile {
  userId: string;
  traits: Record<string, any>;
  createdAt: Date;
  lastSeenAt: Date;
}

export interface AnalyticsConfig {
  provider: 'mixpanel' | 'google_analytics' | 'amplitude' | 'segment' | 'custom';
  apiKey: string;
  projectId?: string;
  enableDebugMode?: boolean;
  batchSize?: number;
  flushIntervalMs?: number;
  enableUserTracking?: boolean;
  enableAutoCapture?: boolean;
  apiEndpoint?: string;
}

export interface AnalyticsQuery {
  eventName?: string;
  userId?: string;
  properties?: Record<string, any>;
  fromDate: Date;
  toDate: Date;
  groupBy?: string[];
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'unique';
  limit?: number;
}

export interface AnalyticsResult {
  data: Array<{
    dimensions: Record<string, string>;
    metrics: Record<string, number>;
    timestamp?: Date;
  }>;
  totalCount: number;
  period: { start: Date; end: Date };
}

export interface FunnelStep {
  eventName: string;
  properties?: Record<string, any>;
  stepName: string;
}

export interface FunnelResult {
  steps: Array<{
    stepName: string;
    userCount: number;
    conversionRate: number;
    dropoffRate: number;
  }>;
  totalUsers: number;
  overallConversionRate: number;
}

export interface CohortAnalysis {
  cohortPeriod: 'daily' | 'weekly' | 'monthly';
  retentionPeriods: number[];
  cohorts: Array<{
    cohortName: string;
    cohortStart: Date;
    userCount: number;
    retentionRates: number[];
  }>;
}

export abstract class AnalyticsService {
  protected readonly logger: ILogger;
  protected readonly config: AnalyticsConfig;
  protected readonly eventBuffer: AnalyticsEvent[] = [];
  protected flushTimer?: NodeJS.Timeout;

  constructor(logger: ILogger, config: AnalyticsConfig) {
    this.logger = logger;
    this.config = {
      batchSize: 100,
      flushIntervalMs: 30000, // 30초
      enableDebugMode: false,
      enableUserTracking: true,
      enableAutoCapture: false,
      ...config
    };

    this.startFlushTimer();
  }

  // 이벤트 추적
  abstract track(
    eventName: string,
    properties: Record<string, any>,
    context?: Partial<AnalyticsEvent['context']>
  ): Promise<Result<void>>;

  // 사용자 식별
  abstract identify(
    userId: string,
    traits: Record<string, any>
  ): Promise<Result<void>>;

  // 페이지 조회 추적
  abstract page(
    userId: string,
    pageName: string,
    properties: Record<string, any>
  ): Promise<Result<void>>;

  // 배치 이벤트 전송
  abstract flush(): Promise<Result<void>>;

  // 분석 쿼리 실행
  abstract query(query: AnalyticsQuery): Promise<Result<AnalyticsResult>>;

  // 퍼널 분석
  abstract analyzeFunnel(
    steps: FunnelStep[],
    fromDate: Date,
    toDate: Date,
    userSegment?: Record<string, any>
  ): Promise<Result<FunnelResult>>;

  // 코호트 분석
  abstract analyzeCohort(
    cohortPeriod: 'daily' | 'weekly' | 'monthly',
    retentionEvent: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Result<CohortAnalysis>>;

  // 교육 플랫폼 특화 메서드들

  // 학습 진도 추적
  async trackLearningProgress(
    studentId: string,
    courseId: string,
    lessonId: string,
    progressPercentage: number,
    timeSpent: number,
    context?: Record<string, any>
  ): Promise<Result<void>> {
    return this.track('learning_progress', {
      student_id: studentId,
      course_id: courseId,
      lesson_id: lessonId,
      progress_percentage: progressPercentage,
      time_spent_minutes: Math.round(timeSpent / 60),
      completion_status: progressPercentage >= 100 ? 'completed' : 'in_progress',
      ...context
    });
  }

  // 문제 풀이 추적
  async trackProblemAttempt(
    studentId: string,
    problemId: string,
    attempt: {
      isCorrect: boolean;
      timeSpent: number;
      attempts: number;
      score?: number;
      difficulty: string;
      subject: string;
    },
    context?: Record<string, any>
  ): Promise<Result<void>> {
    return this.track('problem_attempt', {
      student_id: studentId,
      problem_id: problemId,
      is_correct: attempt.isCorrect,
      time_spent_seconds: attempt.timeSpent,
      attempt_number: attempt.attempts,
      score: attempt.score,
      difficulty_level: attempt.difficulty,
      subject: attempt.subject,
      result: attempt.isCorrect ? 'correct' : 'incorrect',
      ...context
    });
  }

  // 교사 활동 추적
  async trackTeacherActivity(
    teacherId: string,
    activity: string,
    details: Record<string, any>,
    context?: Record<string, any>
  ): Promise<Result<void>> {
    return this.track('teacher_activity', {
      teacher_id: teacherId,
      activity_type: activity,
      ...details,
      ...context
    });
  }

  // 학습 세션 시작
  async startLearningSession(
    studentId: string,
    sessionData: {
      courseId?: string;
      lessonId?: string;
      studyMode: string;
      deviceType: string;
    }
  ): Promise<Result<void>> {
    return this.track('learning_session_start', {
      student_id: studentId,
      session_id: `session_${Date.now()}_${studentId}`,
      course_id: sessionData.courseId,
      lesson_id: sessionData.lessonId,
      study_mode: sessionData.studyMode,
      device_type: sessionData.deviceType,
      session_start_time: new Date().toISOString()
    });
  }

  // 학습 세션 종료
  async endLearningSession(
    studentId: string,
    sessionId: string,
    sessionSummary: {
      duration: number;
      problemsSolved: number;
      correctAnswers: number;
      completedLessons: number;
    }
  ): Promise<Result<void>> {
    return this.track('learning_session_end', {
      student_id: studentId,
      session_id: sessionId,
      session_duration_minutes: Math.round(sessionSummary.duration / 60),
      problems_solved: sessionSummary.problemsSolved,
      correct_answers: sessionSummary.correctAnswers,
      accuracy_rate: sessionSummary.problemsSolved > 0 
        ? (sessionSummary.correctAnswers / sessionSummary.problemsSolved) * 100 
        : 0,
      completed_lessons: sessionSummary.completedLessons,
      session_end_time: new Date().toISOString()
    });
  }

  // 학습 성과 분석
  async analyzeLearningPerformance(
    studentId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Result<{
    totalStudyTime: number;
    problemsSolved: number;
    accuracyRate: number;
    strongSubjects: string[];
    weakSubjects: string[];
    progressTrend: 'improving' | 'declining' | 'stable';
  }>> {
    try {
      // 학습 진도 쿼리
      const progressQuery: AnalyticsQuery = {
        eventName: 'learning_progress',
        userId: studentId,
        fromDate,
        toDate,
        groupBy: ['lesson_id'],
        aggregation: 'count'
      };

      const progressResult = await this.query(progressQuery);
      if (progressResult.isFailure) {
        return Result.fail('Failed to query learning progress');
      }

      // 문제 풀이 쿼리
      const problemQuery: AnalyticsQuery = {
        eventName: 'problem_attempt',
        userId: studentId,
        fromDate,
        toDate,
        groupBy: ['subject'],
        aggregation: 'count'
      };

      const problemResult = await this.query(problemQuery);
      if (problemResult.isFailure) {
        return Result.fail('Failed to query problem attempts');
      }

      // 세션 쿼리
      const sessionQuery: AnalyticsQuery = {
        eventName: 'learning_session_end',
        userId: studentId,
        fromDate,
        toDate,
        aggregation: 'sum'
      };

      const sessionResult = await this.query(sessionQuery);
      if (sessionResult.isFailure) {
        return Result.fail('Failed to query learning sessions');
      }

      // 분석 결과 계산
      const progressData = progressResult.getValue().data;
      const problemData = problemResult.getValue().data;
      const sessionData = sessionResult.getValue().data;

      const totalStudyTime = sessionData.reduce((sum, session) => 
        sum + (session.metrics.session_duration_minutes || 0), 0
      );

      const problemsSolved = problemData.reduce((sum, problem) => 
        sum + (problem.metrics.count || 0), 0
      );

      const accuracyRate = this.calculateAccuracyRate(problemData);
      const { strongSubjects, weakSubjects } = this.analyzeSubjectPerformance(problemData);
      const progressTrend = this.calculateProgressTrend(progressData);

      const analysis = {
        totalStudyTime,
        problemsSolved,
        accuracyRate,
        strongSubjects,
        weakSubjects,
        progressTrend
      };

      return Result.ok(analysis);

    } catch (error) {
      this.logger.error('Failed to analyze learning performance', {
        error: error instanceof Error ? error.message : String(error),
        studentId
      });
      return Result.fail('Failed to analyze learning performance');
    }
  }

  // 교사 대시보드 분석
  async analyzeTeacherDashboard(
    teacherId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Result<{
    studentsCount: number;
    problemsCreated: number;
    averageStudentProgress: number;
    classEngagement: number;
    topPerformingStudents: Array<{ studentId: string; score: number }>;
    strugglingStudents: Array<{ studentId: string; score: number }>;
  }>> {
    try {
      // 교사 활동 쿼리
      const teacherQuery: AnalyticsQuery = {
        eventName: 'teacher_activity',
        userId: teacherId,
        fromDate,
        toDate,
        groupBy: ['activity_type'],
        aggregation: 'count'
      };

      const teacherResult = await this.query(teacherQuery);
      if (teacherResult.isFailure) {
        return Result.fail('Failed to query teacher activities');
      }

      // 학생 진도 쿼리 (교사 관련)
      const studentProgressQuery: AnalyticsQuery = {
        eventName: 'learning_progress',
        properties: { teacher_id: teacherId },
        fromDate,
        toDate,
        groupBy: ['student_id'],
        aggregation: 'avg'
      };

      const studentProgressResult = await this.query(studentProgressQuery);
      if (studentProgressResult.isFailure) {
        return Result.fail('Failed to query student progress');
      }

      const teacherData = teacherResult.getValue().data;
      const studentData = studentProgressResult.getValue().data;

      // 분석 결과 계산
      const studentsCount = new Set(studentData.map(s => s.dimensions.student_id)).size;
      const problemsCreated = teacherData.find(d => d.dimensions.activity_type === 'create_problem')?.metrics.count || 0;
      
      const averageStudentProgress = studentData.length > 0
        ? studentData.reduce((sum, s) => sum + (s.metrics.avg || 0), 0) / studentData.length
        : 0;

      const classEngagement = this.calculateClassEngagement(studentData);
      const { topPerformingStudents, strugglingStudents } = this.categorizeStudents(studentData);

      const dashboard = {
        studentsCount,
        problemsCreated,
        averageStudentProgress,
        classEngagement,
        topPerformingStudents,
        strugglingStudents
      };

      return Result.ok(dashboard);

    } catch (error) {
      this.logger.error('Failed to analyze teacher dashboard', {
        error: error instanceof Error ? error.message : String(error),
        teacherId
      });
      return Result.fail('Failed to analyze teacher dashboard');
    }
  }

  // 시스템 사용량 분석
  async analyzeSystemUsage(
    fromDate: Date,
    toDate: Date
  ): Promise<Result<{
    dailyActiveUsers: Array<{ date: string; count: number }>;
    featureUsage: Array<{ feature: string; usage: number }>;
    peakHours: Array<{ hour: number; userCount: number }>;
    deviceBreakdown: Record<string, number>;
    platformMetrics: {
      totalSessions: number;
      averageSessionDuration: number;
      bounceRate: number;
    };
  }>> {
    try {
      // 일별 활성 사용자 쿼리
      const dauQuery: AnalyticsQuery = {
        fromDate,
        toDate,
        groupBy: ['date'],
        aggregation: 'unique'
      };

      const dauResult = await this.query(dauQuery);
      if (dauResult.isFailure) {
        return Result.fail('Failed to query daily active users');
      }

      // 기능 사용량 쿼리
      const featureQuery: AnalyticsQuery = {
        fromDate,
        toDate,
        groupBy: ['event_name'],
        aggregation: 'count'
      };

      const featureResult = await this.query(featureQuery);
      if (featureResult.isFailure) {
        return Result.fail('Failed to query feature usage');
      }

      const dauData = dauResult.getValue().data;
      const featureData = featureResult.getValue().data;

      const dailyActiveUsers = dauData.map(d => ({
        date: d.dimensions.date,
        count: d.metrics.unique || 0
      }));

      const featureUsage = featureData.map(d => ({
        feature: d.dimensions.event_name,
        usage: d.metrics.count || 0
      }));

      // 피크 시간대, 디바이스 분석 등은 실제 데이터에 따라 계산
      const peakHours: Array<{ hour: number; userCount: number }> = [];
      const deviceBreakdown: Record<string, number> = {};
      
      const platformMetrics = {
        totalSessions: dauData.length,
        averageSessionDuration: 0,
        bounceRate: 0
      };

      const usage = {
        dailyActiveUsers,
        featureUsage,
        peakHours,
        deviceBreakdown,
        platformMetrics
      };

      return Result.ok(usage);

    } catch (error) {
      this.logger.error('Failed to analyze system usage', {
        error: error instanceof Error ? error.message : String(error)
      });
      return Result.fail('Failed to analyze system usage');
    }
  }

  protected addToBuffer(event: AnalyticsEvent): void {
    this.eventBuffer.push(event);

    if (this.config.enableDebugMode) {
      this.logger.debug('Analytics event added to buffer', {
        eventName: event.eventName,
        bufferSize: this.eventBuffer.length
      });
    }

    // 배치 크기에 도달하면 즉시 전송
    if (this.eventBuffer.length >= this.config.batchSize!) {
      this.flush();
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.flush();
      }
    }, this.config.flushIntervalMs);
  }

  private calculateAccuracyRate(problemData: any[]): number {
    const totalAttempts = problemData.reduce((sum, p) => sum + (p.metrics.count || 0), 0);
    const correctAttempts = problemData.reduce((sum, p) => 
      sum + (p.metrics.correct_answers || 0), 0
    );

    return totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  }

  private analyzeSubjectPerformance(problemData: any[]): {
    strongSubjects: string[];
    weakSubjects: string[];
  } {
    const subjectPerformance = problemData.map(p => ({
      subject: p.dimensions.subject,
      accuracy: this.calculateAccuracyRate([p])
    })).sort((a, b) => b.accuracy - a.accuracy);

    const strongSubjects = subjectPerformance
      .filter(s => s.accuracy > 80)
      .map(s => s.subject)
      .slice(0, 3);

    const weakSubjects = subjectPerformance
      .filter(s => s.accuracy < 60)
      .map(s => s.subject)
      .slice(0, 3);

    return { strongSubjects, weakSubjects };
  }

  private calculateProgressTrend(progressData: any[]): 'improving' | 'declining' | 'stable' {
    if (progressData.length < 2) return 'stable';

    // 최근 절반과 이전 절반 비교
    const midPoint = Math.floor(progressData.length / 2);
    const firstHalf = progressData.slice(0, midPoint);
    const secondHalf = progressData.slice(midPoint);

    const firstHalfAvg = firstHalf.reduce((sum, p) => 
      sum + (p.metrics.avg || 0), 0
    ) / firstHalf.length;

    const secondHalfAvg = secondHalf.reduce((sum, p) => 
      sum + (p.metrics.avg || 0), 0
    ) / secondHalf.length;

    const improvement = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    if (improvement > 10) return 'improving';
    if (improvement < -10) return 'declining';
    return 'stable';
  }

  private calculateClassEngagement(studentData: any[]): number {
    // 참여도는 활성 학생 비율과 평균 진도를 기반으로 계산
    const activeStudents = studentData.filter(s => s.metrics.avg > 0).length;
    const totalStudents = studentData.length;
    
    const averageProgress = studentData.length > 0
      ? studentData.reduce((sum, s) => sum + (s.metrics.avg || 0), 0) / studentData.length
      : 0;

    const participationRate = totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0;
    
    return (participationRate * 0.6 + averageProgress * 0.4);
  }

  private categorizeStudents(studentData: any[]): {
    topPerformingStudents: Array<{ studentId: string; score: number }>;
    strugglingStudents: Array<{ studentId: string; score: number }>;
  } {
    const studentsWithScores = studentData.map(s => ({
      studentId: s.dimensions.student_id,
      score: s.metrics.avg || 0
    })).sort((a, b) => b.score - a.score);

    const topPerformingStudents = studentsWithScores
      .filter(s => s.score > 80)
      .slice(0, 5);

    const strugglingStudents = studentsWithScores
      .filter(s => s.score < 60)
      .slice(-5)
      .reverse();

    return { topPerformingStudents, strugglingStudents };
  }

  // 정리 메서드
  cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    // 버퍼의 남은 이벤트들 전송
    if (this.eventBuffer.length > 0) {
      this.flush();
    }
  }
}