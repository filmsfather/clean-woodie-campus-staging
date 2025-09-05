import { IEmailAdapter, EmailRequest, EmailResult } from '../services/EmailNotificationService';
import { Result } from '@woodie/domain';
export declare class NodemailerEmailAdapter implements IEmailAdapter {
    private config;
    private fromEmail;
    private fromName;
    constructor(config: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    }, fromEmail: string, fromName?: string);
    sendEmail(request: EmailRequest): Promise<Result<EmailResult>>;
}
//# sourceMappingURL=NodemailerEmailAdapter.d.ts.map