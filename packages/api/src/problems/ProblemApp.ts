import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

// 미들웨어
import { ErrorHandlerMiddleware } from './middleware/ErrorHandlerMiddleware';
import { RateLimitMiddleware } from './middleware/RateLimitMiddleware';

// 라우터
import { ProblemRoutes } from './routes/ProblemRoutes';

// 컨트롤러들
import { ProblemController } from './controllers/ProblemController';
import { AnalyticsController } from './controllers/AnalyticsController';
import { BulkOperationsController } from './controllers/BulkOperationsController';
import { TagController } from './controllers/TagController';

// 서비스들 (DI를 위한 인터페이스들)
import { ProblemSearchService } from '@woodie/application/problems/services/ProblemSearchService';
import { ProblemAnalyticsService } from '@woodie/application/problems/services/ProblemAnalyticsService';
import { ProblemBankManagementService } from '@woodie/application/problems/services/ProblemBankManagementService';
import { TagRecommendationService } from '@woodie/application/problems/services/TagRecommendationService';

// Repository
import { IProblemRepository } from '@woodie/domain/problems/repositories/IProblemRepository';

// 인프라스트럭처
import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { ICacheService } from '@woodie/application/common/interfaces/ICacheService';
import { ITagManagementService } from '@woodie/domain/problems/services/ITagManagementService';

// 타입
import { ApiSuccessResponse, HTTP_STATUS } from './interfaces/ProblemApiTypes';

// 문제 관리 API 애플리케이션 클래스
export class ProblemApp {
  private app: Express;
  private problemRoutes: ProblemRoutes;

  constructor(
    private problemRepository: IProblemRepository,
    private logger: ILogger,
    private cacheService?: ICacheService,
    private tagManagementService?: ITagManagementService
  ) {
    this.app = express();
    this.setupMiddleware();
    this.setupServices();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  public getApp(): Express {
    return this.app;
  }

  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      this.logger.info(`Problem Management API server started on port ${port}`, {
        port,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    });
  }

  // === Private 설정 메서드들 ===

  private setupMiddleware(): void {
    // 보안 미들웨어
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS 설정
    this.app.use(cors({
      origin: this.getAllowedOrigins(),
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Correlation-ID'
      ]
    }));

    // 압축
    this.app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
      threshold: 1024 // 1KB 이상만 압축
    }));

    // 요청 파싱
    this.app.use(express.json({ 
      limit: '10mb',
      type: ['application/json', 'text/plain']
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // 로깅
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => {
            this.logger.info(message.trim(), { source: 'morgan' });
          }
        }
      }));
    }

    // 기본 Rate Limiting (전역)
    this.app.use('/api/problems', RateLimitMiddleware.perTeacherLimit());

    // 할당량 정보 헤더 추가
    this.app.use(RateLimitMiddleware.addQuotaHeaders());

    // 상태 확인용 미들웨어
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      // 요청 시작 시간 기록
      (req as any).startTime = Date.now();
      
      // 응답 완료 시 메트릭 수집
      res.on('finish', () => {
        const duration = Date.now() - (req as any).startTime;
        this.logger.info('Request completed', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });

      next();
    });
  }

  private setupServices(): void {
    // 서비스 인스턴스 생성
    const searchService = new ProblemSearchService(
      this.problemRepository,
      this.logger,
      this.cacheService
    );

    const analyticsService = new ProblemAnalyticsService(
      this.problemRepository,
      this.logger,
      this.cacheService
    );

    const managementService = new ProblemBankManagementService(
      this.problemRepository,
      this.logger,
      this.cacheService
    );

    const tagService = new TagRecommendationService(
      this.problemRepository,
      this.tagManagementService!, // TODO: 기본 구현체 제공
      this.logger,
      this.cacheService
    );

    // 컨트롤러 인스턴스 생성
    const problemController = new ProblemController(
      this.problemRepository,
      searchService,
      analyticsService,
      managementService,
      tagService
    );

    const analyticsController = new AnalyticsController(analyticsService);
    const bulkController = new BulkOperationsController(managementService);
    const tagController = new TagController(tagService);

    // 라우터 생성
    this.problemRoutes = new ProblemRoutes(
      problemController,
      analyticsController,
      bulkController,
      tagController
    );
  }

  private setupRoutes(): void {
    // 헬스체크 엔드포인트 (인증 불필요)
    this.app.get('/health', (req: Request, res: Response) => {
      const response: ApiSuccessResponse = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          services: {
            database: 'connected', // TODO: 실제 상태 확인
            cache: this.cacheService ? 'connected' : 'disabled',
            logger: 'active'
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || 'health-check',
          version: '1.0.0'
        }
      };

      res.json(response);
    });

    // API 정보 엔드포인트
    this.app.get('/api', (req: Request, res: Response) => {
      const response: ApiSuccessResponse = {
        success: true,
        data: {
          name: 'Clean Woodie Campus - Problem Management API',
          version: '1.0.0',
          description: 'RESTful API for educational problem management system',
          documentation: '/api/docs',
          endpoints: {
            problems: '/api/problems',
            search: '/api/problems/search',
            analytics: '/api/problems/analytics',
            tags: '/api/problems/tags',
            bulk: '/api/problems/bulk'
          },
          features: [
            'CRUD operations for educational problems',
            'Advanced search and filtering',
            'Analytics and statistics',
            'Tag management and recommendations',
            'Bulk operations',
            'Role-based access control',
            'Rate limiting and caching'
          ],
          authentication: 'Bearer JWT token required',
          rateLimit: 'Per-user quotas applied'
        }
      };

      res.json(response);
    });

    // 문제 관리 라우트 등록
    this.app.use('/api/problems', this.problemRoutes.getRouter());
  }

  private setupErrorHandling(): void {
    // 404 핸들러 (라우트가 없는 경우)
    this.app.use('*', ErrorHandlerMiddleware.handleNotFound());

    // Method Not Allowed 핸들러
    this.app.use(ErrorHandlerMiddleware.handleMethodNotAllowed());

    // 글로벌 에러 핸들러 (반드시 마지막에 등록)
    this.app.use(ErrorHandlerMiddleware.handle());

    // Graceful shutdown 처리
    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      this.logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      // 서버 종료 로직
      process.exit(0);
    };

    // 시그널 핸들러 등록
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 예상치 못한 에러 처리
    process.on('uncaughtException', (error: Error) => {
      this.logger.error('Uncaught Exception', { 
        error: error.message,
        stack: error.stack 
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      this.logger.error('Unhandled Rejection', { 
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined
      });
      process.exit(1);
    });
  }

  // === 유틸리티 메서드들 ===

  private getAllowedOrigins(): string[] {
    const origins = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001';
    return origins.split(',').map(origin => origin.trim());
  }

  // 개발 환경용 미들웨어 추가
  public enableDevMiddleware(): void {
    if (process.env.NODE_ENV === 'development') {
      // API 문서 라우트 (개발 환경에서만)
      this.app.get('/api/docs', (req: Request, res: Response) => {
        res.json({
          message: 'API Documentation',
          swagger: '/api/swagger.json',
          postman: '/api/postman-collection.json'
        });
      });

      // 상세한 에러 정보 활성화
      this.app.locals.isDevelopment = true;
    }
  }

  // 프로덕션 환경용 설정
  public enableProductionMode(): void {
    if (process.env.NODE_ENV === 'production') {
      // Trust proxy 설정 (로드 밸런서 뒤에서 실행 시)
      this.app.set('trust proxy', true);
      
      // 추가적인 보안 헤더
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        res.set({
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        });
        next();
      });
    }
  }

  // 메트릭 수집 활성화
  public enableMetrics(): void {
    // TODO: Prometheus, StatsD 등 메트릭 수집 도구 연동
    this.logger.info('Metrics collection enabled');
  }
}