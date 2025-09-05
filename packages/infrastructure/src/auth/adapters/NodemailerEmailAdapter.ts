import { IEmailAdapter, EmailRequest, EmailResult } from '../services/EmailNotificationService';
import { Result } from '@woodie/domain';

// Nodemailer를 사용한 SMTP 이메일 발송 어댑터
export class NodemailerEmailAdapter implements IEmailAdapter {
  constructor(
    private config: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    },
    private fromEmail: string,
    private fromName: string = 'WoodieCampus'
  ) {}

  async sendEmail(request: EmailRequest): Promise<Result<EmailResult>> {
    try {
      // 실제 구현에서는 nodemailer를 import해서 사용
      // 여기서는 인터페이스 구현만 보여줌
      
      // const nodemailer = require('nodemailer');
      // const transporter = nodemailer.createTransporter(this.config);

      // 가상의 nodemailer 전송
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: request.to,
        subject: request.subject,
        html: request.html,
        text: request.text
      };

      // const info = await transporter.sendMail(mailOptions);
      
      // 현재는 mock 결과 반환
      const result: EmailResult = {
        messageId: `nodemailer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'sent'
      };

      return Result.ok<EmailResult>(result);

    } catch (error) {
      return Result.fail<EmailResult>(`Nodemailer adapter error: ${error}`);
    }
  }
}