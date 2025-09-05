import { IEmailAdapter, EmailRequest, EmailResult } from '../services/EmailNotificationService';
import { Result } from '@woodie/domain';
export declare class ConsoleEmailAdapter implements IEmailAdapter {
    sendEmail(request: EmailRequest): Promise<Result<EmailResult>>;
}
//# sourceMappingURL=ConsoleEmailAdapter.d.ts.map