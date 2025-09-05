import { Result } from '@woodie/domain';
// SendGrid를 사용한 실제 이메일 발송 어댑터
export class SendGridEmailAdapter {
    apiKey;
    fromEmail;
    fromName;
    constructor(apiKey, fromEmail, fromName = 'WoodieCampus') {
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
    }
    async sendEmail(request) {
        try {
            // SendGrid API 호출
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    personalizations: [{
                            to: [{ email: request.to }],
                            subject: request.subject
                        }],
                    from: {
                        email: this.fromEmail,
                        name: this.fromName
                    },
                    content: [
                        {
                            type: 'text/html',
                            value: request.html
                        },
                        ...(request.text ? [{
                                type: 'text/plain',
                                value: request.text
                            }] : [])
                    ]
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                return Result.fail(`SendGrid API error: ${response.status} ${errorText}`);
            }
            // SendGrid는 성공시 202 반환하고 메시지 ID를 헤더에 포함
            const messageId = response.headers.get('X-Message-Id') || `sendgrid-${Date.now()}`;
            const result = {
                messageId,
                status: response.status === 202 ? 'sent' : 'queued'
            };
            return Result.ok(result);
        }
        catch (error) {
            return Result.fail(`SendGrid adapter error: ${error}`);
        }
    }
}
//# sourceMappingURL=SendGridEmailAdapter.js.map