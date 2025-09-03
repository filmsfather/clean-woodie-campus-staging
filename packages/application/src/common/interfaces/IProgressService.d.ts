import { UniqueEntityID } from '@woodie/domain';
import { Result } from '@woodie/domain';
/**
 * 진도 서비스 인터페이스
 * Application 레이어에서 정의하고 Infrastructure에서 구현
 */
export interface IProgressService {
    getStudentProgress(studentId: UniqueEntityID, problemSetId?: UniqueEntityID): Promise<Result<any>>;
    getClassProgress(classId: string): Promise<Result<any[]>>;
    updateProgress(studentId: UniqueEntityID, problemId: UniqueEntityID, isCorrect: boolean): Promise<Result<void>>;
    getStatistics(studentId: UniqueEntityID, timeRange?: {
        from: Date;
        to: Date;
    }): Promise<Result<any>>;
    getTopStreaks(limit?: number): Promise<Result<any[]>>;
    getAtRiskStudents(): Promise<Result<any[]>>;
    getSystemProgressStats(): Promise<Result<any>>;
    getStudentStreak(studentId: UniqueEntityID): Promise<Result<any>>;
    getStudentStatistics(studentId: UniqueEntityID): Promise<Result<any>>;
}
//# sourceMappingURL=IProgressService.d.ts.map