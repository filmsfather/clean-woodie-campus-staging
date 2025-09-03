import { Result } from '@woodie/domain';
export class RefreshTokenUseCase {
    authRepository;
    constructor(authRepository) {
        this.authRepository = authRepository;
    }
    async execute(request) {
        const result = await this.authRepository.refreshToken(request.refreshToken);
        if (result.isFailure) {
            return Result.fail(result.error);
        }
        return Result.ok(result.value);
    }
}
//# sourceMappingURL=RefreshTokenUseCase.js.map