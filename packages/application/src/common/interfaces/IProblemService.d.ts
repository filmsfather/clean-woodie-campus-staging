import { UniqueEntityID } from '@woodie/domain';
import { Result } from '@woodie/domain';
/**
 * 문제 서비스 인터페이스
 * Application 레이어에서 정의하고 Infrastructure에서 구현
 */
export interface IProblemService {
    getProblem(problemId: UniqueEntityID): Promise<Result<any>>;
    getTeacherProblems(teacherId: string): Promise<Result<any[]>>;
    searchProblems(query: string, filters?: any): Promise<Result<any[]>>;
    createProblem(data: any): Promise<Result<UniqueEntityID>>;
    updateProblem(problemId: UniqueEntityID, data: any): Promise<Result<void>>;
    deleteProblem(problemId: UniqueEntityID): Promise<Result<void>>;
    getPopularProblems(limit?: number): Promise<Result<any[]>>;
    getProblemsByTeacher(teacherId: string): Promise<Result<any[]>>;
}
//# sourceMappingURL=IProblemService.d.ts.map