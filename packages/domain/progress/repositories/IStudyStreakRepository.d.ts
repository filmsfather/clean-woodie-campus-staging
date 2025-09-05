import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import { StudyStreak } from '../entities/StudyStreak';
/**
 * 학습 스트릭 리포지토리 인터페이스
 * 학습 스트릭 데이터의 영속성을 관리하는 계약을 정의
 */
export interface IStudyStreakRepository {
    /**
     * 학생 ID로 스트릭 조회
     * @param studentId 학생 ID
     * @returns 학습 스트릭 또는 null
     */
    findByStudentId(studentId: UniqueEntityID): Promise<Result<StudyStreak | null>>;
    /**
     * 스트릭 저장 (생성 또는 업데이트)
     * @param studyStreak 저장할 스트릭 엔티티
     * @returns 저장 결과
     */
    save(studyStreak: StudyStreak): Promise<Result<void>>;
    /**
     * 스트릭 삭제
     * @param studyStreakId 삭제할 스트릭 ID
     * @returns 삭제 결과
     */
    delete(studyStreakId: UniqueEntityID): Promise<Result<void>>;
    /**
     * 활성 스트릭을 가진 학생들 조회
     * 현재 스트릭이 0보다 크고 마지막 학습일이 최근인 학생들
     * @param daysThreshold 활성으로 간주할 일수 (기본: 2일)
     * @returns 활성 스트릭을 가진 학생들의 스트릭 리스트
     */
    findActiveStreaks(daysThreshold?: number): Promise<Result<StudyStreak[]>>;
    /**
     * 위험 상태의 스트릭들 조회 (끊어질 위험이 있는)
     * 마지막 학습일이 어제인 학생들
     * @returns 위험 상태의 스트릭 리스트
     */
    findAtRiskStreaks(): Promise<Result<StudyStreak[]>>;
    /**
     * 최장 스트릭 순위 조회
     * @param limit 조회할 개수 (기본: 10)
     * @returns 최장 스트릭 순위 리스트
     */
    findTopStreaks(limit?: number): Promise<Result<StudyStreak[]>>;
    /**
     * 클래스별 스트릭 통계 조회
     * @param classId 클래스 ID
     * @returns 클래스 내 학생들의 스트릭 리스트
     */
    findByClassId(classId: string): Promise<Result<StudyStreak[]>>;
}
//# sourceMappingURL=IStudyStreakRepository.d.ts.map