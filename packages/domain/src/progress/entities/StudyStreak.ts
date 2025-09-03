import { AggregateRoot } from '../../aggregates/AggregateRoot'
import { UniqueEntityID } from '../../common/Identifier'
import { Result } from '../../common/Result'
import { Guard } from '../../common/Guard'
import { StreakAchievedEvent } from '../events/StreakAchievedEvent'
import { StreakLostEvent } from '../events/StreakLostEvent'

interface StudyStreakProps {
  studentId: UniqueEntityID
  currentStreak: number
  longestStreak: number
  lastStudyDate: Date
  createdAt: Date
  updatedAt: Date
}

interface StreakUpdateProps {
  currentStreak: number
  longestStreak?: number
  lastStudyDate: Date
}

/**
 * 학습 스트릭 엔티티
 * 학생의 연속 학습일을 추적하고 관리하는 도메인 엔티티
 * 
 * 비즈니스 규칙:
 * - 연속 학습일은 하루 건너뛰면 리셋됨
 * - 최장 스트릭은 현재 스트릭보다 작을 수 없음
 * - 같은 날에 여러 번 학습해도 스트릭은 1일로 계산
 */
export class StudyStreak extends AggregateRoot<UniqueEntityID> {
  private constructor(private props: StudyStreakProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID())
  }

  get studentId(): UniqueEntityID {
    return this.props.studentId
  }

  get currentStreak(): number {
    return this.props.currentStreak
  }

  get longestStreak(): number {
    return this.props.longestStreak
  }

  get lastStudyDate(): Date {
    return this.props.lastStudyDate
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  /**
   * 스트릭 정보 업데이트
   * 내부적으로 사용되는 메서드로 외부에서 직접 호출하지 않음
   */
  private updateStreakInternal(updateProps: StreakUpdateProps): void {
    this.props.currentStreak = updateProps.currentStreak
    this.props.longestStreak = updateProps.longestStreak ?? Math.max(this.props.longestStreak, updateProps.currentStreak)
    this.props.lastStudyDate = updateProps.lastStudyDate
    this.props.updatedAt = new Date()
  }

  /**
   * 학습 활동 기록
   * 새로운 학습 활동이 발생했을 때 스트릭을 업데이트함
   * 
   * @param studyDate 학습한 날짜
   */
  public recordStudy(studyDate: Date): void {
    const studyDateOnly = this.getDateOnly(studyDate)
    const lastStudyDateOnly = this.getDateOnly(this.props.lastStudyDate)
    
    // 이미 오늘 학습 기록이 있으면 업데이트하지 않음
    if (studyDateOnly.getTime() === lastStudyDateOnly.getTime()) {
      return
    }

    const yesterday = new Date(studyDateOnly)
    yesterday.setDate(yesterday.getDate() - 1)
    const previousStreak = this.props.currentStreak

    if (lastStudyDateOnly.getTime() === yesterday.getTime()) {
      // 연속 학습: 스트릭 증가
      const newCurrentStreak = this.props.currentStreak + 1
      const newLongestStreak = Math.max(this.props.longestStreak, newCurrentStreak)
      
      this.updateStreakInternal({
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastStudyDate: studyDateOnly,
      })

      // 스트릭 달성 이벤트 발행
      this.addDomainEvent(new StreakAchievedEvent(
        this.props.studentId,
        previousStreak,
        newCurrentStreak,
        newCurrentStreak === newLongestStreak,
        this.getStreakMilestone(newCurrentStreak)
      ))
    } else if (lastStudyDateOnly.getTime() < yesterday.getTime()) {
      // 스트릭 끊김: 기존 스트릭이 있었다면 스트릭 잃음 이벤트 발행
      if (this.props.currentStreak > 0) {
        const daysSinceLastStudy = Math.floor(
          (studyDateOnly.getTime() - lastStudyDateOnly.getTime()) / (24 * 60 * 60 * 1000)
        )
        
        this.addDomainEvent(new StreakLostEvent(
          this.props.studentId,
          this.props.currentStreak,
          this.props.longestStreak,
          this.props.lastStudyDate,
          daysSinceLastStudy
        ))
      }
      
      // 새로 시작 (1일부터)
      this.updateStreakInternal({
        currentStreak: 1,
        lastStudyDate: studyDateOnly,
      })

      // 새로운 스트릭 시작 이벤트 발행
      this.addDomainEvent(new StreakAchievedEvent(
        this.props.studentId,
        0,
        1,
        false
      ))
    }
  }

  /**
   * 스트릭 리셋
   * 관리자나 시스템에 의해 스트릭을 초기화할 때 사용
   */
  public resetStreak(): void {
    this.updateStreakInternal({
      currentStreak: 0,
      lastStudyDate: this.props.lastStudyDate,
    })
  }

  /**
   * 스트릭이 활성 상태인지 확인
   * 마지막 학습일이 어제 또는 오늘인 경우 활성으로 간주
   */
  public isActiveStreak(): boolean {
    const today = this.getDateOnly(new Date())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const lastStudyDateOnly = this.getDateOnly(this.props.lastStudyDate)
    
    return lastStudyDateOnly.getTime() === today.getTime() || 
           lastStudyDateOnly.getTime() === yesterday.getTime()
  }

  /**
   * 스트릭이 위험 상태인지 확인 (끊어질 위험)
   * 마지막 학습일이 어제인 경우 위험으로 간주
   */
  public isAtRisk(): boolean {
    const today = this.getDateOnly(new Date())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const lastStudyDateOnly = this.getDateOnly(this.props.lastStudyDate)
    
    return lastStudyDateOnly.getTime() === yesterday.getTime()
  }

  /**
   * 개인 기록 달성 여부 확인
   * 현재 스트릭이 최장 스트릭과 같은지 확인
   */
  public isPersonalRecord(): boolean {
    return this.props.currentStreak === this.props.longestStreak && this.props.currentStreak > 0
  }

  /**
   * 날짜에서 시간을 제거하여 날짜만 반환
   * 스트릭 계산 시 시간을 고려하지 않기 위함
   */
  private getDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }

  /**
   * 스트릭 이정표 확인
   * 특별한 이정표 스트릭인 경우 해당 값을 반환
   */
  private getStreakMilestone(streak: number): number | undefined {
    const milestones = [7, 14, 30, 50, 100, 200, 365]
    return milestones.includes(streak) ? streak : undefined
  }

  /**
   * StudyStreak 엔티티 생성
   * 
   * @param props 스트릭 속성
   * @param id 엔티티 ID (선택적)
   * @returns Result<StudyStreak>
   */
  public static create(props: {
    studentId: UniqueEntityID
    currentStreak: number
    longestStreak: number
    lastStudyDate: Date
  }, id?: UniqueEntityID): Result<StudyStreak> {
    // 필수 속성 검증
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.studentId, argumentName: 'studentId' },
      { argument: props.currentStreak, argumentName: 'currentStreak' },
      { argument: props.longestStreak, argumentName: 'longestStreak' },
      { argument: props.lastStudyDate, argumentName: 'lastStudyDate' }
    ])

    if (guardResult.isFailure) {
      return Result.fail<StudyStreak>(guardResult.error)
    }

    // 비즈니스 규칙 검증
    if (props.currentStreak < 0) {
      return Result.fail<StudyStreak>('현재 스트릭은 음수가 될 수 없습니다')
    }

    if (props.longestStreak < 0) {
      return Result.fail<StudyStreak>('최장 스트릭은 음수가 될 수 없습니다')
    }

    if (props.longestStreak < props.currentStreak) {
      return Result.fail<StudyStreak>('최장 스트릭은 현재 스트릭보다 작을 수 없습니다')
    }

    const now = new Date()

    const studyStreak = new StudyStreak({
      studentId: props.studentId,
      currentStreak: props.currentStreak,
      longestStreak: props.longestStreak,
      lastStudyDate: props.lastStudyDate,
      createdAt: now,
      updatedAt: now
    }, id)

    return Result.ok<StudyStreak>(studyStreak)
  }

  /**
   * 재구성 팩토리 메서드 (DB에서 복원할 때 사용)
   * 
   * @param props 전체 속성
   * @param id 엔티티 ID
   * @returns StudyStreak
   */
  public static reconstitute(
    props: StudyStreakProps,
    id: UniqueEntityID
  ): StudyStreak {
    return new StudyStreak(props, id)
  }
}