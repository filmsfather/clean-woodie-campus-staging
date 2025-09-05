import { IEmailAdapter, EmailRequest, EmailResult } from '../services/EmailNotificationService';
import { Result } from '@woodie/domain';
export declare class SendGridEmailAdapter implements IEmailAdapter {
    private apiKey;
    private fromEmail;
    private fromName;
    constructor(apiKey: string, fromEmail: string, fromName?: string);
    sendEmail(request: EmailRequest): Promise<Result<EmailResult>>;
}
//# sourceMappingURL=SendGridEmailAdapter.d.ts.map