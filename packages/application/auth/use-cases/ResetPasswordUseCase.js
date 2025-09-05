import { Result } from '@woodie/domain';
import { Email } from '@woodie/domain';
export class ResetPasswordUseCase {
    authRepository;
    constructor(authRepository) {
        this.authRepository = authRepository;
    }
    async execute(request) {
        const emailResult = Email.create(request.email);
        if (emailResult.isFailure) {
            return Result.fail(emailResult.error);
        }
        const email = emailResult.value;
        const result = await this.authRepository.resetPassword(email);
        if (result.isFailure) {
            return Result.fail(result.error);
        }
        return Result.ok();
    }
}
//# sourceMappingURL=ResetPasswordUseCase.js.map