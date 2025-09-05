import { Problem } from '@woodie/domain/problems/entities/Problem';
import { ProblemOutput } from '../interfaces/IProblemUseCases';
/**
 * 도메인 엔티티와 외부 계층 간의 데이터 변환을 담당하는 Mapper
 * Clean Architecture의 의존성 규칙을 준수하여 도메인 레이어의 격리를 보장
 */
export declare class ProblemMapper {
    /**
     * 도메인 Problem 엔티티를 Application Layer Output DTO로 변환
     *
     * @param problem - 도메인 Problem 엔티티
     * @returns ProblemOutput DTO
     */
    static toOutput(problem: Problem): ProblemOutput;
    /**
     * 도메인 Problem 엔티티 배열을 Output DTO 배열로 변환
     *
     * @param problems - 도메인 Problem 엔티티 배열
     * @returns ProblemOutput DTO 배열
     */
    static toOutputList(problems: Problem[]): ProblemOutput[];
    /**
     * 도메인 엔티티를 상세 정보가 포함된 Output DTO로 변환
     * (미래 확장을 위한 메서드 - 현재는 기본 toOutput과 동일)
     *
     * @param problem - 도메인 Problem 엔티티
     * @returns 상세 ProblemOutput DTO
     */
    static toDetailOutput(problem: Problem): ProblemOutput;
}
//# sourceMappingURL=ProblemMapper.d.ts.map