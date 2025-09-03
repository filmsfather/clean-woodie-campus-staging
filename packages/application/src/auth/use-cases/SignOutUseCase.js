import { Result } from '@woodie/domain';
export class SignOutUseCase {
    authRepository;
    constructor(authRepository) {
        this.authRepository = authRepository;
    }
    async execute(request) {
        const result = await this.authRepository.signOut(request.accessToken);
        if (result.isFailure) {
            return Result.fail(result.error);
        }
        return Result.ok();
    }
}
//# sourceMappingURL=SignOutUseCase.js.map