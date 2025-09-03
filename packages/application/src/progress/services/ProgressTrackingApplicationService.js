import { Result } from '@woodie/domain';
import { UniqueEntityID } from '@woodie/domain';
/**
 * 진도 추적 애플리케이션 서비스
 * 도메인 서비스를 활용하여 애플리케이션 레벨의 진도 추적 기능을 제공
 *
 * 주요 책임:
 * - StudyRecord 기반 자동 진도 업데이트
 * - 학생/교사 대시보드 데이터 제공
 * - 통계 및 순위 계산
 * - DTO 변환 처리
 */
export class ProgressTrackingApplicationService {
    progressTrackingService;
    studyStreakRepository;
    statisticsRepository;
    constructor(progressTrackingService, studyStreakRepository, statisticsRepository) {
        this.progressTrackingService = progressTrackingService;
        this.studyStreakRepository = studyStreakRepository;
        this.statisticsRepository = statisticsRepository;
    }
    /**
     * 학습 활동 기반 진도 업데이트
     * StudyRecord가 생성될 때 자동으로 호출되는 핵심 메서드
     */
    async updateProgressFromStudyRecord(request) {
        try {
            const studentId = new UniqueEntityID(request.studentId);
            const problemId = new UniqueEntityID(request.problemId);
            const problemSetId = new UniqueEntityID(request.problemSetId);
            // 업데이트 이전 상태 저장
            const previousStreakResult = await this.studyStreakRepository.findByStudentId(studentId);
            const previousStatisticsResult = await this.statisticsRepository.findByStudentAndProblemSet(studentId, problemSetId);
            const previousStreak = previousStreakResult.isSuccess ? previousStreakResult.value?.currentStreak || 0 : 0;
            const previousStats = previousStatisticsResult.isSuccess ? previousStatisticsResult.value : null;
            // 도메인 서비스를 통한 진도 업데이트
            const updateResult = await this.progressTrackingService.updateProgressFromStudyRecord({
                studentId,
                problemId,
                isCorrect: request.isCorrect,
                responseTime: request.responseTime,
                createdAt: request.studyDate || new Date()
            }, problemSetId, request.totalProblemsInSet);
            if (updateResult.isFailure) {
                return Result.fail(`Failed to update progress: ${updateResult.error}`);
            }
            // 업데이트 후 상태 조회
            const updatedStreakResult = await this.studyStreakRepository.findByStudentId(studentId);
            const updatedStatisticsResult = await this.statisticsRepository.findByStudentAndProblemSet(studentId, problemSetId);
            const updatedStreak = updatedStreakResult.isSuccess ? updatedStreakResult.value : null;
            const updatedStats = updatedStatisticsResult.isSuccess ? updatedStatisticsResult.value : null;
            // 응답 구성
            const response = {
                success: true,
                streakUpdated: this.buildStreakUpdateInfo(previousStreak, updatedStreak),
                statisticsUpdated: this.buildStatisticsUpdateInfo(previousStats, updatedStats)
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error updating progress: ${error}`);
        }
    }
    /**
     * 학생의 전체 진도 현황 조회
     */
    async getStudentProgress(studentId) {
        try {
            const studentUniqueId = new UniqueEntityID(studentId);
            const progressResult = await this.progressTrackingService.getStudentProgress(studentUniqueId);
            if (progressResult.isFailure) {
                return Result.fail(progressResult.error);
            }
            const progress = progressResult.value;
            // DTO 변환
            const dto = {
                studentId,
                studyStreak: progress.studyStreak ? this.toStudyStreakDto(progress.studyStreak) : null,
                statistics: progress.statistics.map(stat => this.toStatisticsDto(stat)),
                overallMetrics: {
                    ...progress.overallMetrics,
                    totalStudyTimeInMinutes: Math.round(progress.overallMetrics.totalStudyTime / (1000 * 60)),
                    efficiencyScore: await this.calculateEfficiencyScore(studentUniqueId)
                }
            };
            return Result.ok(dto);
        }
        catch (error) {
            return Result.fail(`Failed to get student progress: ${error}`);
        }
    }
    /**
     * 클래스 전체 진도 현황 조회
     */
    async getClassProgress(classId, problemSetId) {
        try {
            const problemSetUniqueId = problemSetId ? new UniqueEntityID(problemSetId) : undefined;
            const progressResult = await this.progressTrackingService.getClassProgress(classId, problemSetUniqueId);
            if (progressResult.isFailure) {
                return Result.fail(progressResult.error);
            }
            const progress = progressResult.value;
            // DTO 변환
            const dto = {
                classId,
                teacherId: '', // TODO: 클래스 정보에서 가져오기
                streaks: progress.streaks.map(streak => this.toStudyStreakDto(streak)),
                statistics: progress.statistics.map(stat => this.toStatisticsDto(stat)),
                classMetrics: {
                    ...progress.classMetrics,
                    studentsWithStreak: progress.streaks.filter(s => s.currentStreak > 0).length,
                    studiedToday: progress.streaks.filter(s => {
                        const today = new Date().toDateString();
                        return s.lastStudyDate.toDateString() === today;
                    }).length,
                    atRiskStudents: progress.streaks.filter(s => s.isAtRisk()).length
                }
            };
            return Result.ok(dto);
        }
        catch (error) {
            return Result.fail(`Failed to get class progress: ${error}`);
        }
    }
    /**
     * 스트릭 순위 조회
     */
    async getStreakRankings(limit = 10, studentId) {
        try {
            const topStreaksResult = await this.studyStreakRepository.findTopStreaks(limit);
            if (topStreaksResult.isFailure) {
                return Result.fail(topStreaksResult.error);
            }
            const rankings = topStreaksResult.value.map((streak, index) => ({
                rank: index + 1,
                studentId: streak.studentId.toString(),
                currentStreak: streak.currentStreak,
                longestStreak: streak.longestStreak,
                lastStudyDate: streak.lastStudyDate,
                isActive: streak.isActiveStreak()
            }));
            let myRanking = undefined;
            if (studentId) {
                const myStreakResult = await this.studyStreakRepository.findByStudentId(new UniqueEntityID(studentId));
                if (myStreakResult.isSuccess && myStreakResult.value) {
                    const myStreak = myStreakResult.value;
                    const myRank = rankings.findIndex(r => r.studentId === studentId) + 1;
                    myRanking = {
                        rank: myRank > 0 ? myRank : rankings.length + 1,
                        currentStreak: myStreak.currentStreak,
                        longestStreak: myStreak.longestStreak
                    };
                }
            }
            const dto = {
                rankings,
                myRanking
            };
            return Result.ok(dto);
        }
        catch (error) {
            return Result.fail(`Failed to get streak rankings: ${error}`);
        }
    }
    /**
     * 문제집별 통계 요약 조회
     */
    async getProblemSetStatsSummary(problemSetId) {
        try {
            const problemSetUniqueId = new UniqueEntityID(problemSetId);
            const statisticsResult = await this.statisticsRepository.findByProblemSetId(problemSetUniqueId);
            if (statisticsResult.isFailure) {
                return Result.fail(statisticsResult.error);
            }
            const statistics = statisticsResult.value;
            const averageResult = await this.statisticsRepository.calculateAverageStatistics(problemSetUniqueId);
            if (averageResult.isFailure) {
                return Result.fail(averageResult.error);
            }
            const averageStats = averageResult.value;
            // 상위 성과자 추출 (상위 5명)
            const topPerformers = statistics
                .sort((a, b) => b.getEfficiencyScore() - a.getEfficiencyScore())
                .slice(0, 5)
                .map(stat => ({
                studentId: stat.studentId.toString(),
                completionRate: stat.getCompletionRate(),
                accuracyRate: stat.getAccuracyRate(),
                efficiencyScore: stat.getEfficiencyScore()
            }));
            const dto = {
                problemSetId,
                teacherId: '', // TODO: 문제집 정보에서 가져오기
                totalStudents: averageStats.totalStudents,
                averageCompletionRate: averageStats.averageCompletionRate,
                averageAccuracyRate: averageStats.averageAccuracyRate,
                averageResponseTime: averageStats.averageResponseTime,
                completedStudentCount: statistics.filter(stat => stat.isCompleted()).length,
                topPerformers
            };
            return Result.ok(dto);
        }
        catch (error) {
            return Result.fail(`Failed to get problem set stats summary: ${error}`);
        }
    }
    /**
     * StudyStreak 엔티티를 DTO로 변환
     */
    toStudyStreakDto(streak) {
        return {
            id: streak.id.toString(),
            studentId: streak.studentId.toString(),
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            lastStudyDate: streak.lastStudyDate,
            isActive: streak.isActiveStreak(),
            isAtRisk: streak.isAtRisk(),
            isPersonalRecord: streak.isPersonalRecord(),
            createdAt: streak.createdAt,
            updatedAt: streak.updatedAt
        };
    }
    /**
     * Statistics 엔티티를 DTO로 변환
     */
    toStatisticsDto(stats) {
        return {
            id: stats.id.toString(),
            studentId: stats.studentId.toString(),
            problemSetId: stats.problemSetId.toString(),
            totalProblems: stats.totalProblems,
            completedProblems: stats.completedProblems,
            correctAnswers: stats.correctAnswers,
            completionRate: stats.getCompletionRate(),
            accuracyRate: stats.getAccuracyRate(),
            overallAccuracyRate: stats.getOverallAccuracyRate(),
            totalTimeSpent: stats.totalTimeSpent,
            averageResponseTime: stats.averageResponseTime,
            averageResponseTimeInSeconds: stats.getAverageResponseTimeInSeconds(),
            totalTimeInMinutes: stats.getTotalTimeInMinutes(),
            isCompleted: stats.isCompleted(),
            progressStatus: stats.getProgressStatus(),
            performanceGrade: stats.getPerformanceGrade(),
            efficiencyScore: stats.getEfficiencyScore(),
            createdAt: stats.createdAt,
            updatedAt: stats.updatedAt
        };
    }
    /**
     * 스트릭 업데이트 정보 구성
     */
    buildStreakUpdateInfo(previousStreak, updatedStreak) {
        const currentStreak = updatedStreak?.currentStreak || 0;
        const isNewRecord = updatedStreak?.isPersonalRecord() || false;
        let streakStatus = 'started';
        if (previousStreak > 0 && currentStreak > previousStreak) {
            streakStatus = 'continued';
        }
        else if (previousStreak > 0 && currentStreak === 1) {
            streakStatus = 'broken';
        }
        // 이정표 확인 (7, 14, 30, 50, 100, 200, 365일)
        const milestones = [7, 14, 30, 50, 100, 200, 365];
        const achievedMilestone = milestones.includes(currentStreak) ? currentStreak : undefined;
        return {
            previousStreak,
            currentStreak,
            isNewRecord,
            achievedMilestone,
            streakStatus
        };
    }
    /**
     * 통계 업데이트 정보 구성
     */
    buildStatisticsUpdateInfo(previousStats, updatedStats) {
        const currentCompletionRate = updatedStats?.getCompletionRate() || 0;
        const currentAccuracyRate = updatedStats?.getAccuracyRate() || 0;
        const previousCompletionRate = previousStats?.getCompletionRate() || 0;
        const previousAccuracyRate = previousStats?.getAccuracyRate() || 0;
        const isCompleted = updatedStats?.isCompleted() || false;
        const wasJustCompleted = !previousStats?.isCompleted() && isCompleted;
        return {
            previousCompletionRate,
            currentCompletionRate,
            previousAccuracyRate,
            currentAccuracyRate,
            isCompleted,
            wasJustCompleted,
            performanceGrade: updatedStats?.getPerformanceGrade() || 'F',
            efficiencyScore: updatedStats?.getEfficiencyScore() || 0
        };
    }
    /**
     * 학생의 전체 효율성 점수 계산
     */
    async calculateEfficiencyScore(studentId) {
        try {
            // 간단한 구현 - 실제로는 더 복잡한 로직이 필요할 수 있음
            const statisticsResult = await this.statisticsRepository.findByStudentId(studentId);
            if (statisticsResult.isFailure || statisticsResult.value.length === 0) {
                return 0;
            }
            const statistics = statisticsResult.value;
            const avgEfficiency = statistics.reduce((sum, stat) => sum + stat.getEfficiencyScore(), 0) / statistics.length;
            // 스트릭 보너스 추가
            const streakResult = await this.studyStreakRepository.findByStudentId(studentId);
            let bonus = 0;
            if (streakResult.isSuccess && streakResult.value) {
                const streak = streakResult.value.currentStreak;
                if (streak >= 30)
                    bonus = 10;
                else if (streak >= 14)
                    bonus = 7;
                else if (streak >= 7)
                    bonus = 5;
                else if (streak >= 3)
                    bonus = 3;
            }
            return Math.min(100, Math.round(avgEfficiency + bonus));
        }
        catch {
            return 0;
        }
    }
}
//# sourceMappingURL=ProgressTrackingApplicationService.js.map