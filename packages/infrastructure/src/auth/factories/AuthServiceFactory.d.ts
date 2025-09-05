import { IAuthRepository, IUserRepository, IInviteRepository, IProfileRepository, IAuthNotificationService } from '@woodie/domain';
export interface AuthServiceConfig {
    supabase: {
        url: string;
        key: string;
    };
    email: {
        provider: 'console' | 'sendgrid' | 'nodemailer';
        config?: {
            apiKey?: string;
            fromEmail?: string;
            fromName?: string;
            host?: string;
            port?: number;
            secure?: boolean;
            user?: string;
            pass?: string;
        };
    };
    app: {
        baseUrl: string;
    };
}
export declare class AuthServiceFactory {
    static create(config: AuthServiceConfig): {
        authRepository: IAuthRepository;
        userRepository: IUserRepository;
        inviteRepository: IInviteRepository;
        profileRepository: IProfileRepository;
        notificationService: IAuthNotificationService;
    };
}
//# sourceMappingURL=AuthServiceFactory.d.ts.map