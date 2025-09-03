import { BaseDomainEvent } from '../../events/DomainEvent'
import { UniqueEntityID } from '../../common/Identifier'

/**
 * 통계 업데이트 이벤트
 * 학생의 문제집별 학습 통계가 업데이트되었을 때 발생
 * 
 * 사용 시나리오:
 * - 실시간 대시보드 업데이트
 * - 학습 분석 시스템 연동
 * - 진도율 알림 발송
 */
export class StatisticsUpdatedEvent extends BaseDomainEvent {
  public readonly eventType = 'StatisticsUpdated'

  constructor(
    public readonly studentId: UniqueEntityID,
    public readonly problemSetId: UniqueEntityID,
    public readonly previousStats: {
      completedProblems: number
      correctAnswers: number
      completionRate: number
      accuracyRate: number
    },
    public readonly currentStats: {
      completedProblems: number
      correctAnswers: number
      completionRate: number
      accuracyRate: number
    },
    public readonly isCompleted: boolean, // 문제집을 완료했는지
    public readonly performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  ) {
    super()
  }

  /**
   * 문제집을 방금 완료했는지 확인
   */
  public wasJustCompleted(): boolean {
    return this.isCompleted && this.previousStats.completionRate < 1.0
  }

  /**
   * 성취도가 향상되었는지 확인
   */
  public hasImprovedPerformance(): boolean {
    return this.currentStats.accuracyRate > this.previousStats.accuracyRate
  }

  /**
   * 완료한 문제 수 증가량
   */
  public getCompletedProblemsIncrease(): number {
    return this.currentStats.completedProblems - this.previousStats.completedProblems
  }

  /**
   * 완료율 증가량
   */
  public getCompletionRateIncrease(): number {
    return this.currentStats.completionRate - this.previousStats.completionRate
  }

  /**
   * 정답률 변화량 (음수일 수 있음)
   */
  public getAccuracyRateChange(): number {
    return this.currentStats.accuracyRate - this.previousStats.accuracyRate
  }

  /**
   * 중요한 이정표인지 확인 (50%, 75%, 90%, 100% 완료)
   */
  public isSignificantProgressMilestone(): boolean {
    const currentRate = this.currentStats.completionRate
    const previousRate = this.previousStats.completionRate
    
    const milestones = [0.5, 0.75, 0.9, 1.0]
    
    return milestones.some(milestone => 
      previousRate < milestone && currentRate >= milestone
    )
  }

  /**
   * 우수한 성과인지 확인 (A 또는 B 등급)
   */
  public isExcellentPerformance(): boolean {
    return this.performanceGrade === 'A' || this.performanceGrade === 'B'
  }
}