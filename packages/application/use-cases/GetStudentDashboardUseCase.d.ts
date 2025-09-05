/**
 * 학생 대시보드 조회 Use Case
 * 캐시를 우선 확인하고, 캐시 미스 시 리포지토리에서 조회하여 캐싱하는 로직 구현
 */
import { Result } from '@woodie/domain';
import { ILogger } from '../common/interfaces/ILogger';
import { CachedStudentDashboardService, StudentDashboardDto } from '../services/CachedDashboardService';
export interface GetStudentDashboardRequest {
    studentId: string;
    forceRefresh?: boolean;
}
export interface GetStudentDashboardResponse {
    dashboard: StudentDashboardDto;
    fromCache: boolean;
}
/**
 * 실제 데이터 조회를 담당하는 리포지토리 인터페이스
 * 도메인 레이어에서 정의되어야 함 (순수한 비즈니스 인터페이스)
 */
export interface IStudentDashboardRepository {
    getDashboardData(studentId: string): Promise<Result<StudentDashboardDto>>;
}
/**
 * 학생 대시보드 조회 Use Case 구현
 * 캐싱 전략: Cache-Aside 패턴
 * 1. 캐시 확인
 * 2. 캐시 미스 시 리포지토리에서 조회
 * 3. 조회 결과를 캐시에 저장
 */
export declare class GetStudentDashboardUseCase {
    private dashboardRepository;
    private cachedDashboardService;
    private logger;
    constructor(dashboardRepository: IStudentDashboardRepository, cachedDashboardService: CachedStudentDashboardService, logger: ILogger);
    execute(request: GetStudentDashboardRequest): Promise<Result<GetStudentDashboardResponse>>;
}
//# sourceMappingURL=GetStudentDashboardUseCase.d.ts.map