import { INotificationService } from '@woodie/domain';
import { Invite } from '@woodie/domain';
import { Result } from '@woodie/domain';

// 이메일 발송 요청 인터페이스 (Infrastructure 레벨)
export interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// 이메일 발송 결과
export interface EmailResult {
  messageId: string;
  status: 'sent' | 'queued' | 'failed';
}

// 실제 이메일 발송을 담당하는 어댑터 인터페이스
export interface IEmailAdapter {
  sendEmail(request: EmailRequest): Promise<Result<EmailResult>>;
}

// 초대 알림을 이메일로 발송하는 서비스 구현체
export class EmailNotificationService implements INotificationService {
  constructor(
    private emailAdapter: IEmailAdapter,
    private baseUrl: string // 프론트엔드 기본 URL (환경변수에서 주입)
  ) {}

  async notifyInviteCreated(invite: Invite): Promise<Result<void>> {
    try {
      // 초대 링크 생성
      const inviteUrl = `${this.baseUrl}/auth/invite?token=${invite.token.value}`;
      
      // 이메일 템플릿 생성
      const emailContent = this.generateInviteEmailContent({
        recipientEmail: invite.email.value,
        recipientRole: invite.role,
        inviteUrl,
        expiresAt: invite.expiresAt,
        organizationId: invite.organizationId,
        classId: invite.classId
      });

      // 이메일 발송
      const emailRequest: EmailRequest = {
        to: invite.email.value,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      };

      const sendResult = await this.emailAdapter.sendEmail(emailRequest);
      
      if (sendResult.isFailure) {
        return Result.fail<void>(`Failed to send invite email: ${sendResult.errorValue}`);
      }

      return Result.ok<void>();

    } catch (error) {
      return Result.fail<void>(`Unexpected error sending invite notification: ${error}`);
    }
  }

  async notifyInviteUsed(invite: Invite): Promise<Result<void>> {
    // 초대 사용 알림 (관리자에게 발송)
    // 현재는 간단히 성공 반환 (YAGNI)
    return Result.ok<void>();
  }

  async notifyInviteExpired(invite: Invite): Promise<Result<void>> {
    // 초대 만료 알림 (배치 작업용)
    // 현재는 간단히 성공 반환 (YAGNI)
    return Result.ok<void>();
  }

  // 초대 이메일 템플릿 생성 (private 메서드)
  private generateInviteEmailContent(data: {
    recipientEmail: string;
    recipientRole: string;
    inviteUrl: string;
    expiresAt: Date;
    organizationId: string;
    classId?: string;
  }) {
    const roleText = this.getRoleDisplayText(data.recipientRole);
    const expiryText = data.expiresAt.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const subject = `[WoodieCampus] ${roleText} 초대장`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>WoodieCampus 초대장</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; margin-bottom: 30px;">WoodieCampus 초대장</h1>
            
            <p>안녕하세요!</p>
            
            <p><strong>${roleText}</strong> 권한으로 WoodieCampus에 초대되셨습니다.</p>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0;"><strong>초대 정보:</strong></p>
              <ul style="margin: 10px 0;">
                <li>이메일: ${data.recipientEmail}</li>
                <li>역할: ${roleText}</li>
                <li>만료 시간: ${expiryText}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.inviteUrl}" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                가입하기
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              이 초대는 <strong>${expiryText}</strong>까지 유효합니다.<br>
              링크가 작동하지 않는 경우, 다음 URL을 복사해서 브라우저에 붙여넣으세요:<br>
              <code style="background: #f1f5f9; padding: 2px 4px; border-radius: 3px;">${data.inviteUrl}</code>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              WoodieCampus | 지능형 학습 관리 플랫폼
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
WoodieCampus 초대장

안녕하세요!

${roleText} 권한으로 WoodieCampus에 초대되셨습니다.

초대 정보:
- 이메일: ${data.recipientEmail}
- 역할: ${roleText}
- 만료 시간: ${expiryText}

가입 링크: ${data.inviteUrl}

이 초대는 ${expiryText}까지 유효합니다.

WoodieCampus | 지능형 학습 관리 플랫폼
    `;

    return { subject, html, text };
  }

  // 역할별 표시 텍스트
  private getRoleDisplayText(role: string): string {
    switch (role) {
      case 'student': return '학생';
      case 'teacher': return '교사';
      case 'admin': return '관리자';
      default: return role;
    }
  }
}