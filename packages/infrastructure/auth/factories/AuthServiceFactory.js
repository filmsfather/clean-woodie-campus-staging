import { SupabaseAuthRepository, SupabaseUserRepository, SupabaseInviteRepository, SupabaseProfileRepository, EmailNotificationService, ConsoleEmailAdapter, SendGridEmailAdapter, NodemailerEmailAdapter } from '../index';
export class AuthServiceFactory {
    static create(config) {
        // Repository 인스턴스 생성
        const authRepository = new SupabaseAuthRepository(config.supabase.url, config.supabase.key);
        const userRepository = new SupabaseUserRepository(config.supabase.url, config.supabase.key);
        const inviteRepository = new SupabaseInviteRepository(config.supabase.url, config.supabase.key);
        const profileRepository = new SupabaseProfileRepository(config.supabase.url, config.supabase.key);
        // Email Adapter 선택
        let emailAdapter;
        switch (config.email.provider) {
            case 'sendgrid':
                if (!config.email.config?.apiKey || !config.email.config?.fromEmail) {
                    throw new Error('SendGrid requires apiKey and fromEmail');
                }
                emailAdapter = new SendGridEmailAdapter(config.email.config.apiKey, config.email.config.fromEmail, config.email.config.fromName);
                break;
            case 'nodemailer':
                if (!config.email.config?.host || !config.email.config?.user || !config.email.config?.pass) {
                    throw new Error('Nodemailer requires host, user, and pass');
                }
                emailAdapter = new NodemailerEmailAdapter({
                    host: config.email.config.host,
                    port: config.email.config.port || 587,
                    secure: config.email.config.secure || false,
                    auth: {
                        user: config.email.config.user,
                        pass: config.email.config.pass
                    }
                }, config.email.config.fromEmail || config.email.config.user, config.email.config.fromName);
                break;
            case 'console':
            default:
                emailAdapter = new ConsoleEmailAdapter();
                break;
        }
        // Notification Service 생성
        const notificationService = new EmailNotificationService(emailAdapter, config.app.baseUrl);
        return {
            authRepository,
            userRepository,
            inviteRepository,
            profileRepository,
            notificationService
        };
    }
}
//# sourceMappingURL=AuthServiceFactory.js.map