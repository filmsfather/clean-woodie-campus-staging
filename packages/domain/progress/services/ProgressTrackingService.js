import { Result } from '../../common/Result';
import { StudyStreak } from '../entities/StudyStreak';
import { Statistics } from '../entities/Statistics';
/**
 * 진도 추적 도메인 서비스
 * StudyRecord를 기반으로 학습 스트릭과 통계를 자동으로 업데이트하는 핵심 서비스
 *
 * 주요 책임:
 * - StudyRecord로부터 학습 활동 기록 처리
 * - StudyStreak 자동 업데이트
 * - Statistics 실시간 갱신
 * - 트랜잭션 단위로 일관성 보장
 */
export class ProgressTrackingService {
    studyStreakRepository;
    statisticsRepository;
    constructor(studyStreakRepository, statisticsRepository) {
        this.studyStreakRepository = studyStreakRepository;
        this.statisticsRepository = statisticsRepository;
    }
    /**
     * 학습 기록으로부터 진도 추적 정보 업데이트
     * StudyRecord가 생성될 때마다 호출되어 스트릭과 통계를 자동 갱신
     *
     * @param studyRecord 학습 기록
     * @param problemSetId 문제집 ID
     * @param totalProblemsInSet 문제집 내 총 문제 수
     * @returns 업데이트 결과
     */
    async updateProgressFromStudyRecord(studyRecord, problemSetId, totalProblemsInSet) {
        try {
            // 1. 스트릭 업데이트
            const streakUpdateResult = await this.updateStudyStreak(studyRecord.studentId, studyRecord.createdAt);
            if (streakUpdateResult.isFailure) {
                return Result.fail(`스트릭 업데이트 실패: ${streakUpdateResult.error}`);
            }
            // 2. 통계 업데이트
            const statisticsUpdateResult = await this.updateStatistics(studyRecord.studentId, problemSetId, studyRecord.isCorrect, studyRecord.responseTime || 0, totalProblemsInSet);
            if (statisticsUpdateResult.isFailure) {
                return Result.fail(`통계 업데이트 실패: ${statisticsUpdateResult.error}`);
            }
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`진도 추적 업데이트 중 오류 발생: ${error}`);
        }
    }
    /**
     * 학습 스트릭 업데이트
     * 학생의 스트릭을 조회하고 새로운 학습 활동을 반영
     *
     * @param studentId 학생 ID
     * @param studyDate 학습 날짜
     * @returns 업데이트 결과
     */
    async updateStudyStreak(studentId, studyDate) {
        // 기존 스트릭 조회
        const streakResult = await this.studyStreakRepository.findByStudentId(studentId);
        if (streakResult.isFailure) {
            return Result.fail(streakResult.error);
        }
        let studyStreak = streakResult.value;
        if (!studyStreak) {
            // 새로운 스트릭 생성
            const newStreakResult = StudyStreak.create({
                studentId,
                currentStreak: 0,
                longestStreak: 0,
                lastStudyDate: studyDate
            });
            if (newStreakResult.isFailure) {
                return Result.fail(newStreakResult.error);
            }
            studyStreak = newStreakResult.value;
        }
        // 스트릭 업데이트
        studyStreak.recordStudy(studyDate);
        // 저장
        const saveResult = await this.studyStreakRepository.save(studyStreak);
        if (saveResult.isFailure) {
            return Result.fail(saveResult.error);
        }
        return Result.ok();
    }
    /**
     * 학습 통계 업데이트
     * 문제집별 학습 통계를 조회하고 새로운 학습 결과를 반영
     *
     * @param studentId 학생 ID
     * @param problemSetId 문제집 ID
     * @param isCorrect 정답 여부
     * @param responseTime 응답 시간 (밀리초)
     * @param totalProblemsInSet 문제집 내 총 문제 수
     * @returns 업데이트 결과
     */
    async updateStatistics(studentId, problemSetId, isCorrect, responseTime, totalProblemsInSet) {
        // 기존 통계 조회
        const statisticsResult = await this.statisticsRepository.findByStudentAndProblemSet(studentId, problemSetId);
        if (statisticsResult.isFailure) {
            return Result.fail(statisticsResult.error);
        }
        let statistics = statisticsResult.value;
        if (!statistics) {
            // 새로운 통계 생성
            const newStatisticsResult = Statistics.create({
                studentId,
                problemSetId,
                totalProblems: totalProblemsInSet,
                completedProblems: 0,
                correctAnswers: 0,
                totalTimeSpent: 0,
                averageResponseTime: 0
            });
            if (newStatisticsResult.isFailure) {
                return Result.fail(newStatisticsResult.error);
            }
            statistics = newStatisticsResult.value;
        }
        // 통계 업데이트
        statistics.recordStudyResult(isCorrect, responseTime);
        // 저장
        const saveResult = await this.statisticsRepository.save(statistics);
        if (saveResult.isFailure) {
            return Result.fail(saveResult.error);
        }
        return Result.ok();
    }
    /**
     * 학생의 전체 진도 현황 조회
     * 스트릭과 모든 문제집 통계를 종합적으로 제공
     *
     * @param studentId 학생 ID
     * @returns 진도 현황 정보
     */
    async getStudentProgress(studentId) {
        try {
            // 스트릭 조회
            const streakResult = await this.studyStreakRepository.findByStudentId(studentId);
            if (streakResult.isFailure) {
                return Result.fail(streakResult.error);
            }
            // 통계 조회
            const statisticsResult = await this.statisticsRepository.findByStudentId(studentId);
            if (statisticsResult.isFailure) {
                return Result.fail(statisticsResult.error);
            }
            const statistics = statisticsResult.value;
            // 전체 지표 계산
            const overallMetrics = this.calculateOverallMetrics(statistics);
            return Result.ok({
                studyStreak: streakResult.value,
                statistics,
                overallMetrics
            });
        }
        catch (error) {
            return Result.fail(`진도 현황 조회 중 오류 발생: ${error}`);
        }
    }
    /**
     * 전체 지표 계산
     * 여러 문제집 통계를 종합하여 전체적인 학습 현황 계산
     *
     * @param statistics 문제집별 통계 리스트
     * @returns 전체 지표
     */
    calculateOverallMetrics(statistics) {
        if (statistics.length === 0) {
            return {
                totalProblemSets: 0,
                completedProblemSets: 0,
                averageCompletionRate: 0,
                averageAccuracyRate: 0,
                totalStudyTime: 0
            };
        }
        const completedProblemSets = statistics.filter(s => s.isCompleted()).length;
        const totalCompletionRate = statistics.reduce((sum, s) => sum + s.getCompletionRate(), 0);
        const totalAccuracyRate = statistics.reduce((sum, s) => sum + s.getAccuracyRate(), 0);
        const totalStudyTime = statistics.reduce((sum, s) => sum + s.totalTimeSpent, 0);
        return {
            totalProblemSets: statistics.length,
            completedProblemSets,
            averageCompletionRate: totalCompletionRate / statistics.length,
            averageAccuracyRate: totalAccuracyRate / statistics.length,
            totalStudyTime
        };
    }
    /**
     * 클래스 전체 진도 현황 조회
     * 교사가 담당 클래스의 전체적인 학습 현황을 파악할 때 사용
     *
     * @param classId 클래스 ID
     * @param problemSetId 특정 문제집 ID (선택적)
     * @returns 클래스 진도 현황
     */
    async getClassProgress(classId, problemSetId) {
        try {
            // 클래스 스트릭 조회
            const streaksResult = await this.studyStreakRepository.findByClassId(classId);
            if (streaksResult.isFailure) {
                return Result.fail(streaksResult.error);
            }
            // 클래스 통계 조회
            const statisticsResult = await this.statisticsRepository.findByClassId(classId, problemSetId);
            if (statisticsResult.isFailure) {
                return Result.fail(statisticsResult.error);
            }
            const streaks = streaksResult.value;
            const statistics = statisticsResult.value;
            // 클래스 지표 계산
            const classMetrics = this.calculateClassMetrics(streaks, statistics);
            return Result.ok({
                streaks,
                statistics,
                classMetrics
            });
        }
        catch (error) {
            return Result.fail(`클래스 진도 현황 조회 중 오류 발생: ${error}`);
        }
    }
    /**
     * 클래스 지표 계산
     * 클래스 내 모든 학생들의 스트릭과 통계를 종합하여 클래스 지표 계산
     */
    calculateClassMetrics(streaks, statistics) {
        const activeStreakCount = streaks.filter(s => s.isActiveStreak()).length;
        const averageCurrentStreak = streaks.length > 0
            ? streaks.reduce((sum, s) => sum + s.currentStreak, 0) / streaks.length
            : 0;
        const averageCompletionRate = statistics.length > 0
            ? statistics.reduce((sum, s) => sum + s.getCompletionRate(), 0) / statistics.length
            : 0;
        const averageAccuracyRate = statistics.length > 0
            ? statistics.reduce((sum, s) => sum + s.getAccuracyRate(), 0) / statistics.length
            : 0;
        return {
            totalStudents: Math.max(streaks.length, statistics.length),
            activeStreakCount,
            averageCurrentStreak,
            averageCompletionRate,
            averageAccuracyRate
        };
    }
}
//# sourceMappingURL=ProgressTrackingService.js.map