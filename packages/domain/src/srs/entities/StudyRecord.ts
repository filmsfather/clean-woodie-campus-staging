import { Entity } from '../../entities/Entity'
import { UniqueEntityID } from '../../common/Identifier'
import { Result } from '../../common/Result'
import { Guard } from '../../common/Guard'
import { ReviewFeedback } from '../value-objects/ReviewFeedback'

interface StudyRecordProps {
  studentId: UniqueEntityID
  problemId: UniqueEntityID
  feedback: ReviewFeedback
  isCorrect: boolean
  responseTime?: number
  answerContent?: any
  createdAt: Date
}

/**
 * 학습 기록 엔티티
 * 개별 복습 세션의 결과를 기록하는 불변 객체
 */
export class StudyRecord extends Entity<StudyRecordProps> {
  private constructor(props: StudyRecordProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get studentId(): UniqueEntityID {
    return this.props.studentId
  }

  get problemId(): UniqueEntityID {
    return this.props.problemId
  }

  get feedback(): ReviewFeedback {
    return this.props.feedback
  }

  get isCorrect(): boolean {
    return this.props.isCorrect
  }

  get responseTime(): number | undefined {
    return this.props.responseTime
  }

  get answerContent(): any {
    return this.props.answerContent
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  /**
   * 새로운 StudyRecord 생성
   */
  public static create(props: {
    studentId: UniqueEntityID
    problemId: UniqueEntityID
    feedback: ReviewFeedback
    isCorrect: boolean
    responseTime?: number
    answerContent?: any
  }, id?: UniqueEntityID): Result<StudyRecord> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.studentId, argumentName: 'studentId' },
      { argument: props.problemId, argumentName: 'problemId' },
      { argument: props.feedback, argumentName: 'feedback' },
      { argument: props.isCorrect, argumentName: 'isCorrect' }
    ])

    if (guardResult.isFailure) {
      return Result.fail<StudyRecord>(guardResult.error)
    }

    const studyRecord = new StudyRecord({
      studentId: props.studentId,
      problemId: props.problemId,
      feedback: props.feedback,
      isCorrect: props.isCorrect,
      responseTime: props.responseTime,
      answerContent: props.answerContent,
      createdAt: new Date()
    }, id)

    return Result.ok<StudyRecord>(studyRecord)
  }

  /**
   * 재구성 팩토리 메서드 (DB에서 복원할 때 사용)
   */
  public static reconstitute(
    props: StudyRecordProps,
    id: UniqueEntityID
  ): StudyRecord {
    return new StudyRecord(props, id)
  }

  /**
   * 응답 시간이 정상 범위인지 확인 (통계적 이상치 탐지용)
   */
  public hasNormalResponseTime(): boolean {
    if (!this.responseTime) return true
    
    // 30초 이내 응답을 정상으로 간주
    const MAX_NORMAL_RESPONSE_TIME = 30 * 1000 // 30초 (밀리초)
    return this.responseTime <= MAX_NORMAL_RESPONSE_TIME
  }

  /**
   * 즉답 여부 확인 (3초 이내)
   */
  public isInstantResponse(): boolean {
    if (!this.responseTime) return false
    return this.responseTime <= 3000 // 3초
  }

  /**
   * 어려워했는지 여부 (응답 시간 기준)
   */
  public appearsToStruggle(): boolean {
    if (!this.responseTime) return false
    return this.responseTime >= 15000 // 15초 이상
  }

  /**
   * 성과 점수 계산 (0-100)
   * 정답 여부와 응답 시간을 종합적으로 고려
   */
  public calculatePerformanceScore(): number {
    let baseScore = this.isCorrect ? 100 : 0
    
    if (!this.responseTime) return baseScore
    
    // 응답 시간에 따른 보정
    if (this.isCorrect) {
      if (this.isInstantResponse()) {
        baseScore = 100 // 즉답 정답은 만점 유지
      } else if (this.appearsToStruggle()) {
        baseScore = 75 // 오래 걸린 정답은 감점
      } else {
        baseScore = 90 // 적당한 시간의 정답
      }
    } else {
      // 오답일 때 응답 시간을 고려한 부분 점수
      if (this.isInstantResponse()) {
        baseScore = 10 // 즉답 오답은 실수 가능성
      } else {
        baseScore = 0 // 오래 생각한 오답은 0점
      }
    }
    
    return Math.max(0, Math.min(100, baseScore))
  }

  /**
   * 학습 패턴 분석용 메타데이터
   */
  public getStudyPattern(): {
    pattern: 'quick_correct' | 'slow_correct' | 'quick_incorrect' | 'slow_incorrect'
    confidence: number
  } {
    const isQuick = this.responseTime && this.responseTime <= 5000
    
    if (this.isCorrect && isQuick) {
      return { pattern: 'quick_correct', confidence: 0.9 }
    } else if (this.isCorrect && !isQuick) {
      return { pattern: 'slow_correct', confidence: 0.7 }
    } else if (!this.isCorrect && isQuick) {
      return { pattern: 'quick_incorrect', confidence: 0.8 }
    } else {
      return { pattern: 'slow_incorrect', confidence: 0.9 }
    }
  }
}