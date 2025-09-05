import { BaseDomainEvent } from '../../events/DomainEvent'
import { UniqueEntityID } from '../../common/Identifier'
import { ReviewFeedbackType } from '../value-objects/ReviewFeedback'

interface ReviewCompletedEventProps {
  aggregateId: UniqueEntityID
  studentId: string
  problemId: string
  feedback: ReviewFeedbackType
  previousInterval: number
  newInterval: number
  previousEaseFactor: number
  newEaseFactor: number
  reviewCount: number
  nextReviewAt: Date
  occurredAt: Date
  // StudyRecord 생성을 위한 추가 정보
  isCorrect: boolean
  responseTime?: number
  answerContent?: any
}

export class ReviewCompletedEvent extends BaseDomainEvent {
  public readonly eventType = 'ReviewCompleted'
  public readonly studentId: string
  public readonly problemId: string
  public readonly feedback: ReviewFeedbackType
  public readonly previousInterval: number
  public readonly newInterval: number
  public readonly previousEaseFactor: number
  public readonly newEaseFactor: number
  public readonly reviewCount: number
  public readonly nextReviewAt: Date
  public readonly reviewOccurredAt: Date
  // StudyRecord 생성을 위한 추가 정보
  public readonly isCorrect: boolean
  public readonly responseTime?: number
  public readonly answerContent?: any

  constructor(props: ReviewCompletedEventProps) {
    super(props.aggregateId)
    this.studentId = props.studentId
    this.problemId = props.problemId
    this.feedback = props.feedback
    this.previousInterval = props.previousInterval
    this.newInterval = props.newInterval
    this.previousEaseFactor = props.previousEaseFactor
    this.newEaseFactor = props.newEaseFactor
    this.reviewCount = props.reviewCount
    this.nextReviewAt = props.nextReviewAt
    this.reviewOccurredAt = props.occurredAt
    this.isCorrect = props.isCorrect
    this.responseTime = props.responseTime
    this.answerContent = props.answerContent
  }

  /**
   * 간격이 증가했는지 확인
   */
  public hasIntervalIncreased(): boolean {
    return this.newInterval > this.previousInterval
  }

  /**
   * 난이도 계수가 개선되었는지 확인
   */
  public hasEaseFactorImproved(): boolean {
    return this.newEaseFactor > this.previousEaseFactor
  }

  /**
   * 첫 번째 복습인지 확인
   */
  public isFirstReview(): boolean {
    return this.reviewCount === 1
  }

  /**
   * 실패한 복습인지 확인
   */
  public isFailedReview(): boolean {
    return this.feedback === 'AGAIN'
  }

  /**
   * 완벽한 복습인지 확인 (쉬움 응답)
   */
  public isPerfectReview(): boolean {
    return this.feedback === 'EASY'
  }
}