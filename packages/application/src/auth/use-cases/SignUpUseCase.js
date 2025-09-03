import { Result } from '@woodie/domain';
import { Email, Password, User } from '@woodie/domain';
export class SignUpUseCase {
    userRepository;
    authRepository;
    constructor(userRepository, authRepository) {
        this.userRepository = userRepository;
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
        // Create user in auth provider (handles uniqueness)
        const authResult = await this.authRepository.signUp(email, password);
        if (authResult.isFailure) {
            return Result.fail(authResult.error);
        }
        const authData = authResult.value;
        // Create user profile
        const userResult = User.create({
            email: request.email,
            name: request.name,
            role: request.role,
            classId: request.classId
        });
        if (userResult.isFailure) {
            return Result.fail(userResult.error);
        }
        const user = userResult.value;
        await this.userRepository.save(user);
        return Result.ok(authData);
    }
}
//# sourceMappingURL=SignUpUseCase.js.map