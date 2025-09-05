import { UniqueEntityID, Result, NotificationSettings, NotificationType } from '@woodie/domain'

// Use Case 입력 DTO
export interface NotificationSettingsDTO {
  enableReviewReminders: boolean
  enableOverdueAlerts: boolean
  enableStreakNotifications: boolean
  enableAchievementNotifications: boolean
  reminderMinutesBefore: number
  overdueThresholdHours: number
  quietHoursStart?: string // "22:00" 형태
  quietHoursEnd?: string   // "08:00" 형태
  preferredDeliveryMethods: ('push' | 'email' | 'in_app')[]
}

export interface ManageNotificationSettingsRequest {
  studentId: string
  settings: NotificationSettingsDTO
}

export interface ManageNotificationSettingsResponse {
  studentId: string
  updatedAt: Date
  settings: NotificationSettingsDTO
  validationWarnings?: string[]
  optimizationSuggestions?: string[]
}

/**
 * 알림 설정 관리 Use Case
 * 
 * 비즈니스 규칙:
 * - 인증된 사용자만 자신의 알림 설정을 변경할 수 있음
 * - 알림 빈도와 시간대를 개인화하여 설정
 * - 학습 패턴에 맞는 최적화 제안 제공
 * - 과도한 알림 방지를 위한 유효성 검증
 */
export class ManageNotificationSettingsUseCase {
  constructor(
    private notificationSettingsRepository: INotificationSettingsRepository
  ) {}

  async execute(request: ManageNotificationSettingsRequest): Promise<Result<ManageNotificationSettingsResponse>> {
    try {
      // 1. 입력 유효성 검증
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure) {
        return Result.fail<ManageNotificationSettingsResponse>(validationResult.error)
      }

      const studentId = new UniqueEntityID(request.studentId)

      // 2. 도메인 객체 생성
      const notificationSettingsResult = NotificationSettings.create({
        enabled: true,
        reviewReminders: request.settings.enableReviewReminders,
        overdueReminders: request.settings.enableOverdueAlerts,
        dailySummary: true, // 기본값
        milestoneAlerts: true, // 기본값
        quietHours: {
          start: request.settings.quietHoursStart || '22:00',
          end: request.settings.quietHoursEnd || '08:00'
        },
        timezone: 'Asia/Seoul' // 기본값
      })

      if (notificationSettingsResult.isFailure) {
        return Result.fail<ManageNotificationSettingsResponse>(notificationSettingsResult.error)
      }

      const notificationSettings = notificationSettingsResult.getValue()

      // 3. 기존 설정 조회 (있다면)
      const existingSettingsResult = await this.notificationSettingsRepository.findByStudentId(studentId)
      let isUpdate = false
      
      if (existingSettingsResult.isSuccess && existingSettingsResult.getValue()) {
        isUpdate = true
      }

      // 4. 설정 저장
      const saveResult = await this.notificationSettingsRepository.save(studentId, notificationSettings)
      if (saveResult.isFailure) {
        return Result.fail<ManageNotificationSettingsResponse>(saveResult.error)
      }

      // 5. 유효성 경고 생성
      const validationWarnings = this.generateValidationWarnings(request.settings)

      // 6. 최적화 제안 생성
      const optimizationSuggestions = await this.generateOptimizationSuggestions(
        studentId,
        request.settings
      )

      // 7. 응답 구성
      const response: ManageNotificationSettingsResponse = {
        studentId: request.studentId,
        updatedAt: new Date(),
        settings: request.settings,
        validationWarnings: validationWarnings.length > 0 ? validationWarnings : undefined,
        optimizationSuggestions: optimizationSuggestions.length > 0 ? optimizationSuggestions : undefined
      }

      return Result.ok<ManageNotificationSettingsResponse>(response)

    } catch (error) {
      return Result.fail<ManageNotificationSettingsResponse>(`Failed to manage notification settings: ${error}`)
    }
  }

  /**
   * 입력 요청 유효성 검증
   */
  private validateRequest(request: ManageNotificationSettingsRequest): Result<void> {
    if (!request.studentId || request.studentId.trim() === '') {
      return Result.fail<void>('Student ID is required')
    }

    const settings = request.settings

    // 리마인더 시간 유효성
    if (settings.reminderMinutesBefore < 5 || settings.reminderMinutesBefore > 1440) {
      return Result.fail<void>('Reminder minutes must be between 5 and 1440 (24 hours)')
    }

    // 연체 임계값 유효성
    if (settings.overdueThresholdHours < 1 || settings.overdueThresholdHours > 168) {
      return Result.fail<void>('Overdue threshold must be between 1 and 168 hours (7 days)')
    }

    // 조용한 시간 형식 검증
    if (settings.quietHoursStart && !this.isValidTimeFormat(settings.quietHoursStart)) {
      return Result.fail<void>('Invalid quiet hours start format. Use HH:MM format')
    }

    if (settings.quietHoursEnd && !this.isValidTimeFormat(settings.quietHoursEnd)) {
      return Result.fail<void>('Invalid quiet hours end format. Use HH:MM format')
    }

    // 전달 방법 유효성
    if (settings.preferredDeliveryMethods.length === 0) {
      return Result.fail<void>('At least one delivery method must be selected')
    }

    const validMethods = ['push', 'email', 'in_app']
    const invalidMethods = settings.preferredDeliveryMethods.filter(method => !validMethods.includes(method))
    if (invalidMethods.length > 0) {
      return Result.fail<void>(`Invalid delivery methods: ${invalidMethods.join(', ')}`)
    }

    return Result.ok<void>()
  }

  /**
   * 시간 형식 유효성 검증 (HH:MM)
   */
  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  /**
   * 유효성 경고 생성
   */
  private generateValidationWarnings(settings: NotificationSettingsDTO): string[] {
    const warnings: string[] = []

    // 너무 빈번한 리마인더 경고
    if (settings.reminderMinutesBefore < 30 && settings.enableReviewReminders) {
      warnings.push('리마인더가 너무 빈번할 수 있습니다. 30분 이상 간격을 권장합니다.')
    }

    // 너무 긴 연체 임계값 경고
    if (settings.overdueThresholdHours > 48 && settings.enableOverdueAlerts) {
      warnings.push('연체 알림 임계값이 너무 깁니다. 48시간 이내를 권장합니다.')
    }

    // 조용한 시간 설정 검증
    if (settings.quietHoursStart && settings.quietHoursEnd) {
      const startTime = this.parseTime(settings.quietHoursStart)
      const endTime = this.parseTime(settings.quietHoursEnd)
      
      if (startTime && endTime) {
        let quietDuration: number
        if (endTime > startTime) {
          quietDuration = endTime - startTime
        } else {
          // 다음 날로 넘어가는 경우
          quietDuration = (24 * 60 - startTime) + endTime
        }

        if (quietDuration > 12 * 60) { // 12시간 이상
          warnings.push('조용한 시간이 너무 깁니다. 12시간 이내를 권장합니다.')
        }
      }
    }

    // 모든 알림 비활성화 경고
    const allNotificationsDisabled = !settings.enableReviewReminders && 
                                   !settings.enableOverdueAlerts && 
                                   !settings.enableStreakNotifications && 
                                   !settings.enableAchievementNotifications

    if (allNotificationsDisabled) {
      warnings.push('모든 알림이 비활성화되었습니다. 학습 진행에 도움이 되지 않을 수 있습니다.')
    }

    return warnings
  }

  /**
   * 최적화 제안 생성
   */
  private async generateOptimizationSuggestions(
    studentId: UniqueEntityID,
    settings: NotificationSettingsDTO
  ): Promise<string[]> {
    const suggestions: string[] = []

    try {
      // 학습자의 활동 패턴 분석 (간단한 버전)
      const activityPattern = await this.analyzeStudentActivityPattern(studentId)

      // 활동 패턴 기반 제안
      if (activityPattern.mostActiveHours.length > 0) {
        const activeHours = activityPattern.mostActiveHours.join(', ')
        suggestions.push(`주로 ${activeHours}시에 활동하시네요. 이 시간대에 맞춘 리마인더 설정을 고려해보세요.`)
      }

      if (activityPattern.averageStudyDuration > 0) {
        if (activityPattern.averageStudyDuration < 15 && settings.reminderMinutesBefore > 60) {
          suggestions.push('짧은 학습 세션을 선호하시는 것 같습니다. 리마인더를 더 자주 설정해보세요.')
        } else if (activityPattern.averageStudyDuration > 60 && settings.reminderMinutesBefore < 30) {
          suggestions.push('긴 학습 세션을 선호하시는 것 같습니다. 리마인더 간격을 늘려보세요.')
        }
      }

      // 성과 기반 제안
      if (activityPattern.strugglingWithDeadlines && !settings.enableOverdueAlerts) {
        suggestions.push('복습 마감일을 놓치는 경우가 있어 보입니다. 연체 알림을 활성화해보세요.')
      }

      if (activityPattern.consistentLearner && settings.enableStreakNotifications) {
        suggestions.push('꾸준한 학습자시네요! 연속 학습 알림이 동기부여에 도움이 될 것입니다.')
      }

      // 일반적인 최적화 제안
      if (settings.preferredDeliveryMethods.includes('email') && settings.preferredDeliveryMethods.includes('push')) {
        suggestions.push('이메일과 푸시 알림을 모두 사용하면 중복될 수 있습니다. 상황에 맞게 선택해보세요.')
      }

      if (!settings.quietHoursStart && !settings.quietHoursEnd) {
        suggestions.push('수면 시간대에 조용한 시간을 설정하면 더 나은 학습 환경을 만들 수 있습니다.')
      }

    } catch (error) {
      // 분석 실패 시에도 기본 제안은 제공
      suggestions.push('개인 학습 패턴에 맞게 알림 설정을 조정해보세요.')
    }

    return suggestions
  }

  /**
   * 학생 활동 패턴 분석 (간단한 버전)
   */
  private async analyzeStudentActivityPattern(studentId: UniqueEntityID): Promise<{
    mostActiveHours: number[]
    averageStudyDuration: number
    strugglingWithDeadlines: boolean
    consistentLearner: boolean
  }> {
    // 실제 구현에서는 StudyRecord와 ReviewSchedule 데이터를 분석
    // 여기서는 간단한 더미 데이터로 대체
    return {
      mostActiveHours: [19, 20, 21], // 저녁 7-9시
      averageStudyDuration: 45, // 45분
      strugglingWithDeadlines: false,
      consistentLearner: true
    }
  }

  /**
   * 시간 문자열을 분 단위로 파싱
   */
  private parseTime(timeStr: string): number | null {
    const [hours, minutes] = timeStr.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) return null
    return hours * 60 + minutes
  }
}

// 알림 설정 레포지토리 인터페이스 (Domain 레이어에 정의되어야 함)
interface INotificationSettingsRepository {
  findByStudentId(studentId: UniqueEntityID): Promise<Result<NotificationSettings | null>>
  save(studentId: UniqueEntityID, settings: NotificationSettings): Promise<Result<void>>
  delete(studentId: UniqueEntityID): Promise<Result<void>>
}