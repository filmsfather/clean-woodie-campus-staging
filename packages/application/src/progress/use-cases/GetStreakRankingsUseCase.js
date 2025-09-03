import { BaseUseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
/**
 * 스트릭 순위 조회 UseCase
 *
 * 비즈니스 규칙:
 * - 전체 또는 클래스별 스트릭 순위 제공
 * - 본인 순위는 항상 포함하여 제공
 * - 개인정보 보호를 위해 학생명은 마스킹 처리
 * - 순위는 현재 스트릭 기준으로 정렬
 */
export class GetStreakRankingsUseCase extends BaseUseCase {
    progressService;
    constructor(progressService) {
        super();
        this.progressService = progressService;
    }
    async execute(request) {
        try {
            // 1. 입력 유효성 검증
            const validationResult = this.validateRequest(request);
            if (validationResult.isFailure) {
                return Result.fail(validationResult.error);
            }
            // 2. 권한 확인
            const authResult = this.checkAuthorization(request);
            if (authResult.isFailure) {
                return Result.fail(authResult.error);
            }
            const limit = request.limit || 10;
            // 3. 스트릭 순위 조회
            const rankingsResult = await this.progressService.getStreakRankings(limit, request.studentId);
            if (rankingsResult.isFailure) {
                return Result.fail(rankingsResult.error);
            }
            // 4. 클래스별 필터링 (필요시)
            let rankings = rankingsResult.value;
            if (request.classId) {
                rankings = this.filterByClass(rankings, request.classId);
            }
            // 5. 응답 구성
            const response = {
                rankings,
                filters: {
                    limit,
                    isClassSpecific: !!request.classId,
                    classId: request.classId
                }
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Failed to get streak rankings: ${error}`);
        }
    }
    validateRequest(request) {
        if (request.limit !== undefined && (request.limit <= 0 || request.limit > 100)) {
            return Result.fail('Limit must be between 1 and 100');
        }
        return Result.ok();
    }
    checkAuthorization(request) {
        // 모든 사용자가 순위 조회 가능 (개인정보는 마스킹 처리됨)
        // 관리자와 교사는 추가 정보 접근 가능
        return Result.ok();
    }
    filterByClass(rankings, classId) {
        // TODO: 실제 구현에서는 클래스 멤버십 확인이 필요
        // 현재는 모든 학생을 포함하여 반환
        return rankings;
    }
}
//# sourceMappingURL=GetStreakRankingsUseCase.js.map