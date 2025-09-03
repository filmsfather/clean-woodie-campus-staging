import { Result } from '../../common/Result'
import { ValueObject } from '../../value-objects/ValueObject'

interface NotificationSettingsProps {
  enabled: boolean
  reviewReminders: boolean
  overdueReminders: boolean  
  dailySummary: boolean
  milestoneAlerts: boolean
  quietHours: {
    start: string // HH:MM 형식
    end: string   // HH:MM 형식
  }
  timezone: string
}

/**
 * 사용자 알림 설정 값 객체
 * 개별 사용자의 알림 선호도와 설정을 관리
 */
export class NotificationSettings extends ValueObject<NotificationSettingsProps> {

  private constructor(props: NotificationSettingsProps) {
    super(props)
  }

  get enabled(): boolean {
    return this.props.enabled
  }

  get reviewReminders(): boolean {
    return this.props.reviewReminders
  }

  get overdueReminders(): boolean {
    return this.props.overdueReminders
  }

  get dailySummary(): boolean {
    return this.props.dailySummary
  }

  get milestoneAlerts(): boolean {
    return this.props.milestoneAlerts
  }

  get quietHours(): { start: string; end: string } {
    return this.props.quietHours
  }

  get timezone(): string {
    return this.props.timezone
  }

  /**
   * 알림 설정 생성
   */
  public static create(props: NotificationSettingsProps): Result<NotificationSettings> {
    // 시간 형식 검증 (HH:MM)
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    
    if (!timePattern.test(props.quietHours.start)) {
      return Result.fail<NotificationSettings>('Invalid quiet hours start time format')
    }

    if (!timePattern.test(props.quietHours.end)) {
      return Result.fail<NotificationSettings>('Invalid quiet hours end time format')  
    }

    // 타임존 기본 검증
    if (!props.timezone || props.timezone.trim().length === 0) {
      return Result.fail<NotificationSettings>('Timezone cannot be empty')
    }

    return Result.ok<NotificationSettings>(new NotificationSettings(props))
  }

  /**
   * 기본 알림 설정 생성
   */
  public static createDefault(timezone = 'Asia/Seoul'): NotificationSettings {
    return new NotificationSettings({
      enabled: true,
      reviewReminders: true,
      overdueReminders: true,
      dailySummary: true,
      milestoneAlerts: true,
      quietHours: {
        start: '22:00', // 오후 10시부터
        end: '08:00'    // 오전 8시까지
      },
      timezone
    })
  }

  /**
   * 현재 시간이 조용한 시간(quiet hours) 범위에 있는지 확인
   */
  public isQuietTime(currentTime: Date): boolean {
    if (!this.props.enabled) return true // 알림이 비활성화되면 항상 조용한 시간

    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()
    const currentTotalMinutes = currentHour * 60 + currentMinute

    const [startHour, startMinute] = this.props.quietHours.start.split(':').map(Number)
    const [endHour, endMinute] = this.props.quietHours.end.split(':').map(Number)
    
    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute

    // 하루를 넘나드는 경우 처리 (예: 22:00 ~ 08:00)
    if (startTotalMinutes > endTotalMinutes) {
      return currentTotalMinutes >= startTotalMinutes || currentTotalMinutes <= endTotalMinutes
    }

    // 같은 날 내에서 처리 (예: 13:00 ~ 18:00)
    return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes
  }

  /**
   * 특정 알림 타입이 활성화되었는지 확인
   */
  public isNotificationTypeEnabled(type: 'review' | 'overdue' | 'summary' | 'milestone'): boolean {
    if (!this.props.enabled) return false

    switch (type) {
      case 'review':
        return this.props.reviewReminders
      case 'overdue':
        return this.props.overdueReminders
      case 'summary':
        return this.props.dailySummary
      case 'milestone':
        return this.props.milestoneAlerts
      default:
        return false
    }
  }

  /**
   * 알림 설정 업데이트 (불변성 유지)
   */
  public updateSettings(updates: Partial<NotificationSettingsProps>): Result<NotificationSettings> {
    const newProps = {
      ...this.props,
      ...updates
    }

    return NotificationSettings.create(newProps)
  }

  /**
   * 알림 완전 비활성화
   */
  public disable(): NotificationSettings {
    return new NotificationSettings({
      ...this.props,
      enabled: false
    })
  }

  /**
   * 알림 완전 활성화  
   */
  public enable(): NotificationSettings {
    return new NotificationSettings({
      ...this.props,
      enabled: true
    })
  }
}