import { UniqueEntityID, Result } from '@woodie/domain'

export interface NotificationSendRequest {
  notificationId: UniqueEntityID
  studentId: UniqueEntityID
  type: string
  title: string
  message: string
  deliveryMethod: 'push' | 'email' | 'in_app'
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: any
}

export interface INotificationSender {
  send(request: NotificationSendRequest): Promise<Result<void>>
}

export interface INotificationChannel {
  send(request: NotificationSendRequest): Promise<Result<void>>
  isAvailable(): Promise<boolean>
  getChannelType(): 'push' | 'email' | 'in_app'
}

/**
 * 푸시 알림 채널
 */
export class PushNotificationChannel implements INotificationChannel {
  getChannelType(): 'push' {
    return 'push'
  }

  async isAvailable(): Promise<boolean> {
    // FCM이나 APNS 서비스 상태 확인
    // 실제 구현에서는 Firebase Admin SDK 등을 사용
    return true
  }

  async send(request: NotificationSendRequest): Promise<Result<void>> {
    try {
      // Firebase Cloud Messaging 또는 APNS를 통한 푸시 알림 발송
      console.log(`Sending push notification to ${request.studentId.toString()}:`, {
        title: request.title,
        message: request.message,
        priority: request.priority,
        metadata: request.metadata
      })

      // 실제 구현 예시:
      // const admin = require('firebase-admin');
      // const message = {
      //   notification: {
      //     title: request.title,
      //     body: request.message
      //   },
      //   data: {
      //     notificationId: request.notificationId.toString(),
      //     type: request.type,
      //     priority: request.priority,
      //     ...request.metadata
      //   },
      //   token: userDeviceToken
      // };
      // await admin.messaging().send(message);

      // 현재는 Mock 구현
      await this.simulateNetworkDelay()

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(`Push notification failed: ${error}`)
    }
  }

  private async simulateNetworkDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
  }
}

/**
 * 이메일 알림 채널
 */
export class EmailNotificationChannel implements INotificationChannel {
  getChannelType(): 'email' {
    return 'email'
  }

  async isAvailable(): Promise<boolean> {
    // SMTP 서버나 이메일 서비스 상태 확인
    return true
  }

  async send(request: NotificationSendRequest): Promise<Result<void>> {
    try {
      // Nodemailer, SendGrid 등을 통한 이메일 발송
      console.log(`Sending email notification to ${request.studentId.toString()}:`, {
        subject: request.title,
        body: request.message,
        priority: request.priority,
        metadata: request.metadata
      })

      // 실제 구현 예시:
      // const sgMail = require('@sendgrid/mail');
      // const msg = {
      //   to: userEmail,
      //   from: 'noreply@woodie.com',
      //   subject: request.title,
      //   html: this.generateEmailTemplate(request)
      // };
      // await sgMail.send(msg);

      // 현재는 Mock 구현
      await this.simulateNetworkDelay()

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(`Email notification failed: ${error}`)
    }
  }

  private async simulateNetworkDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
  }
}

/**
 * 인앱 알림 채널
 */
export class InAppNotificationChannel implements INotificationChannel {
  getChannelType(): 'in_app' {
    return 'in_app'
  }

  async isAvailable(): Promise<boolean> {
    // WebSocket 연결 상태나 실시간 알림 시스템 확인
    return true
  }

  async send(request: NotificationSendRequest): Promise<Result<void>> {
    try {
      // WebSocket, Server-Sent Events 등을 통한 실시간 알림
      console.log(`Sending in-app notification to ${request.studentId.toString()}:`, {
        title: request.title,
        message: request.message,
        priority: request.priority,
        metadata: request.metadata
      })

      // 실제 구현 예시:
      // const socketService = this.getSocketService();
      // socketService.emit(`user_${request.studentId.toString()}`, {
      //   type: 'notification',
      //   data: {
      //     id: request.notificationId.toString(),
      //     title: request.title,
      //     message: request.message,
      //     timestamp: new Date().toISOString(),
      //     priority: request.priority,
      //     metadata: request.metadata
      //   }
      // });

      // 현재는 Mock 구현
      await this.simulateNetworkDelay()

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(`In-app notification failed: ${error}`)
    }
  }

  private async simulateNetworkDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
  }
}

/**
 * 알림 발송 서비스
 * 여러 채널을 관리하고 적절한 채널로 알림을 발송
 */
export class NotificationSenderService implements INotificationSender {
  private channels: Map<string, INotificationChannel>

  constructor() {
    this.channels = new Map<string, INotificationChannel>([
      ['push', new PushNotificationChannel()],
      ['email', new EmailNotificationChannel()],
      ['in_app', new InAppNotificationChannel()]
    ])
  }

  async send(request: NotificationSendRequest): Promise<Result<void>> {
    const startTime = Date.now()
    
    try {
      const channel = this.channels.get(request.deliveryMethod)
      if (!channel) {
        return Result.fail<void>(`Unsupported delivery method: ${request.deliveryMethod}`)
      }

      // 채널 가용성 확인
      const isAvailable = await channel.isAvailable()
      if (!isAvailable) {
        return Result.fail<void>(`Channel ${request.deliveryMethod} is not available`)
      }

      // 알림 발송
      const result = await channel.send(request)
      
      const processingTime = Date.now() - startTime
      console.log(`Notification ${request.notificationId.toString()} sent via ${request.deliveryMethod} in ${processingTime}ms`)

      return result
    } catch (error) {
      const processingTime = Date.now() - startTime
      console.error(`Notification sending failed after ${processingTime}ms:`, error)
      return Result.fail<void>(`Notification sending failed: ${error}`)
    }
  }

  /**
   * 특정 채널 교체 (테스트나 설정 변경 시 사용)
   */
  replaceChannel(channelType: 'push' | 'email' | 'in_app', channel: INotificationChannel): void {
    this.channels.set(channelType, channel)
  }

  /**
   * 채널 상태 조회
   */
  async getChannelStatuses(): Promise<Record<string, boolean>> {
    const statuses: Record<string, boolean> = {}
    
    for (const [type, channel] of this.channels) {
      try {
        statuses[type] = await channel.isAvailable()
      } catch (error) {
        statuses[type] = false
      }
    }
    
    return statuses
  }
}

/**
 * 테스트용 Mock Notification Sender
 */
export class MockNotificationSenderService implements INotificationSender {
  private sentNotifications: NotificationSendRequest[] = []
  private shouldFail: boolean = false

  async send(request: NotificationSendRequest): Promise<Result<void>> {
    await new Promise(resolve => setTimeout(resolve, 10)) // 짧은 지연

    if (this.shouldFail) {
      return Result.fail<void>('Mock failure')
    }

    this.sentNotifications.push(request)
    return Result.ok<void>()
  }

  // 테스트 헬퍼 메서드들
  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail
  }

  getSentNotifications(): NotificationSendRequest[] {
    return [...this.sentNotifications]
  }

  clearSentNotifications(): void {
    this.sentNotifications = []
  }
}