import { Result } from '@woodie/domain';
import { Email, Password } from '@woodie/domain';
export class SignInUseCase {
    authRepository;
    constructor(authRepository) {
        this.authRepository = authRepository;
    }
    async execute(request) {
        const emailResult = Email.create(request.email);
        if (emailResult.isFailure) {
            return Result.fail(emailResult.error);
        }
        const passwordResult = Password.createPlaintext(request.password);
        if (passwordResult.isFailure) {
            return Result.fail(passwordResult.error);
        }
        const email = emailResult.value;
        const password = passwordResult.value;
        const authResult = await this.authRepository.signIn(email, password);
        if (authResult.isFailure) {
            return Result.fail(authResult.error);
        }
        return Result.ok(authResult.value);
    }
}
//# sourceMappingURL=SignInUseCase.js.map