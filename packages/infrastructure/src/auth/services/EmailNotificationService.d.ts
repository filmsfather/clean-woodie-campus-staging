import { INotificationService } from '@woodie/domain';
import { Invite } from '@woodie/domain';
import { Result } from '@woodie/domain';
export interface EmailRequest {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export interface EmailResult {
    messageId: string;
    status: 'sent' | 'queued' | 'failed';
}
export interface IEmailAdapter {
    sendEmail(request: EmailRequest): Promise<Result<EmailResult>>;
}
export declare class EmailNotificationService implements INotificationService {
    private emailAdapter;
    private baseUrl;
    constructor(emailAdapter: IEmailAdapter, baseUrl: string);
    notifyInviteCreated(invite: Invite): Promise<Result<void>>;
    notifyInviteUsed(invite: Invite): Promise<Result<void>>;
    notifyInviteExpired(invite: Invite): Promise<Result<void>>;
    private generateInviteEmailContent;
    private getRoleDisplayText;
}
//# sourceMappingURL=EmailNotificationService.d.ts.map