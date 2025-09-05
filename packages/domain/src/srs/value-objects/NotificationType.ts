import { Result } from '../../common/Result'
import { ValueObject } from '../../value-objects/ValueObject'

// 알림 타입 열거형
export type NotificationTypeValue = 
  | 'overdue'            // 연체 복습 알림  
  | 'review'             // 복습 시간 알림
  | 'summary'            // 일일 요약 알림
  | 'milestone'          // 마일스톤 알림
  | 'streak'             // 연속 학습 알림
  | 'achievement'        // 성취 알림

interface NotificationTypeProps {
  value: NotificationTypeValue
}

/**
 * 알림 타입 값 객체
 * 도메인에서 지원하는 알림 타입들을 정의
 */
export class NotificationType extends ValueObject<NotificationTypeProps> {
  
  private constructor(props: NotificationTypeProps) {
    super(props)
  }

  get value(): NotificationTypeValue {
    return this.props.value
  }

  /**
   * 알림 타입 생성
   */
  public static create(type: NotificationTypeValue): Result<NotificationType> {
    const validTypes: NotificationTypeValue[] = [
      'overdue', 
      'review', 
      'summary', 
      'milestone',
      'streak',
      'achievement'
    ]

    if (!validTypes.includes(type)) {
      return Result.fail<NotificationType>(`Invalid notification type: ${type}`)
    }

    return Result.ok<NotificationType>(new NotificationType({ value: type }))
  }

  /**
   * 기본 복습 알림 타입
   */
  public static review(): NotificationType {
    return new NotificationType({ value: 'review' })
  }

  /**
   * 연체 복습 알림 타입
   */
  public static overdue(): NotificationType {
    return new NotificationType({ value: 'overdue' })
  }

  /**
   * 일일 요약 알림 타입
   */
  public static summary(): NotificationType {
    return new NotificationType({ value: 'summary' })
  }

  /**
   * 마일스톤 알림 타입
   */
  public static milestone(): NotificationType {
    return new NotificationType({ value: 'milestone' })
  }

  /**
   * 연속 학습 알림 타입
   */
  public static streak(): NotificationType {
    return new NotificationType({ value: 'streak' })
  }

  /**
   * 성취 알림 타입
   */
  public static achievement(): NotificationType {
    return new NotificationType({ value: 'achievement' })
  }

  /**
   * 복습 관련 알림인지 확인
   */
  public isReview(): boolean {
    return this.props.value === 'review'
  }

  /**
   * 연체 알림인지 확인
   */
  public isOverdue(): boolean {
    return this.props.value === 'overdue'
  }

  /**
   * 연속 학습 알림인지 확인
   */
  public isStreak(): boolean {
    return this.props.value === 'streak'
  }

  /**
   * 성취 알림인지 확인
   */
  public isAchievement(): boolean {
    return this.props.value === 'achievement'
  }

  /**
   * 긴급도 확인 (연체 알림이 가장 긴급)
   */
  public isUrgent(): boolean {
    return this.props.value === 'overdue'
  }

  /**
   * 알림 우선순위 (숫자가 낮을수록 우선순위 높음)
   */
  public getPriority(): number {
    const priorityMap: Record<NotificationTypeValue, number> = {
      'overdue': 1,      // 최고 우선순위
      'review': 2,
      'streak': 3,
      'achievement': 4,
      'milestone': 5,
      'summary': 6       // 최저 우선순위
    }
    
    return priorityMap[this.props.value]
  }

  /**
   * 알림 카테고리 반환 (UI 분류용)
   */
  public getCategory(): NotificationTypeValue {
    return this.props.value
  }
}