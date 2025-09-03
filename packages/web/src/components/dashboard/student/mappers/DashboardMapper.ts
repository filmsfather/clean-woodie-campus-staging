/**
 * Application Layer DTO를 Presentation Layer 타입으로 변환하는 매퍼
 * Clean Architecture의 경계 간 데이터 변환을 담당
 */

import type { StudentDashboardDto } from '@woodie/application';
import type { 
  StudentDashboardData, 
  StudentProfile, 
  StudyStreak,
  StudentStatistics,
  TodayTask,
  ReviewQueue,
  ActiveProblemSet,
  ProgressDataPoint,
  UpcomingDeadline
} from '../types';

export class DashboardMapper {
  /**
   * Application DTO → Presentation 타입 변환
   */
  static toDashboardData(dto: StudentDashboardDto): StudentDashboardData {
    return {
      profile: this.toStudentProfile(dto),
      studyStreak: this.toStudyStreak(dto),
      statistics: this.toStudentStatistics(dto),
      todayTasks: this.toTodayTasks(dto.todayTasks),
      reviewQueue: this.toReviewQueue(dto),
      activeProblemSets: [], // TODO: DTO에서 매핑
      progressData: this.toProgressData(dto.progressData),
      upcomingDeadlines: this.toUpcomingDeadlines(dto.upcomingDeadlines)
    };
  }

  private static toStudentProfile(dto: StudentDashboardDto): StudentProfile {
    // TODO: 실제 사용자 정보는 별도 서비스에서 조회 필요
    return {
      id: dto.studentId,
      name: '김학생', // TODO: 실제 사용자명
      displayName: '김학생',
      gradeLevel: undefined, // TODO: 사용자 프로필에서 조회
      avatarUrl: undefined
    };
  }

  private static toStudyStreak(dto: StudentDashboardDto): StudyStreak {
    return {
      currentStreak: dto.currentStreak,
      longestStreak: dto.longestStreak,
      lastStudyDate: new Date().toISOString(), // TODO: 실제 마지막 학습일
      weeklyPattern: dto.progressData.slice(-7).map(data => ({
        date: data.date,
        studyMinutes: data.timeSpent,
        completed: data.problemsSolved > 0,
        problemsSolved: data.problemsSolved
      }))
    };
  }

  private static toStudentStatistics(dto: StudentDashboardDto): StudentStatistics {
    const totalHours = dto.progressData.reduce((sum, data) => sum + data.timeSpent, 0) / 60;
    const totalProblems = dto.progressData.reduce((sum, data) => sum + data.problemsSolved, 0);
    
    return {
      totalStudyHours: totalHours,
      averageAccuracy: 87, // TODO: 실제 정확도 계산
      problemsSolvedToday: dto.progressData[dto.progressData.length - 1]?.problemsSolved || 0,
      problemsSolvedTotal: totalProblems,
      completedProblemSets: 3, // TODO: 실제 완료 수
      totalActiveProblemSets: 5 // TODO: 실제 활성 수
    };
  }

  private static toTodayTasks(dtoTasks: StudentDashboardDto['todayTasks']): TodayTask[] {
    return dtoTasks.map(task => ({
      id: task.problemId,
      type: this.mapTaskType(task.difficulty), // TODO: 적절한 타입 매핑 로직
      title: task.title,
      description: `${task.difficulty} 난이도 문제`,
      estimatedMinutes: task.estimatedTime,
      priority: this.mapPriority(task.difficulty),
      dueTime: undefined // TODO: 실제 마감 시간
    }));
  }

  private static toReviewQueue(dto: StudentDashboardDto): ReviewQueue {
    return {
      totalCount: dto.reviewCount,
      urgentCount: Math.floor(dto.reviewCount * 0.3), // TODO: 실제 긴급 카운트
      items: [] // TODO: 실제 복습 아이템 매핑
    };
  }

  private static toProgressData(dtoData: StudentDashboardDto['progressData']): ProgressDataPoint[] {
    return dtoData.map((data, index) => ({
      date: data.date,
      studyMinutes: data.timeSpent,
      problemsSolved: data.problemsSolved,
      accuracy: 85, // TODO: 실제 정확도 데이터
      streakDay: index + 1 // TODO: 실제 연속일 계산
    }));
  }

  private static toUpcomingDeadlines(dtoDeadlines: StudentDashboardDto['upcomingDeadlines']): UpcomingDeadline[] {
    return dtoDeadlines.map(deadline => ({
      type: deadline.type === 'assignment' ? 'assignment' : 'problem_set',
      title: deadline.title,
      deadline: deadline.dueDate,
      progress: 0, // TODO: 실제 진행률 계산
      urgent: new Date(deadline.dueDate) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    }));
  }

  private static mapTaskType(difficulty: string): TodayTask['type'] {
    // TODO: 실제 비즈니스 로직에 따른 타입 매핑
    return 'new_problems';
  }

  private static mapPriority(difficulty: string): TodayTask['priority'] {
    switch (difficulty.toLowerCase()) {
      case 'hard': return 'high';
      case 'medium': return 'medium';
      case 'easy': return 'low';
      default: return 'medium';
    }
  }
}