export class AuthService {
    signUpUseCase;
    signInUseCase;
    signOutUseCase;
    refreshTokenUseCase;
    resetPasswordUseCase;
    name = 'AuthService';
    constructor(signUpUseCase, signInUseCase, signOutUseCase, refreshTokenUseCase, resetPasswordUseCase) {
        this.signUpUseCase = signUpUseCase;
        this.signInUseCase = signInUseCase;
        this.signOutUseCase = signOutUseCase;
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.resetPasswordUseCase = resetPasswordUseCase;
    }
    async signUp(dto) {
        return await this.signUpUseCase.execute(dto);
    }
    async signIn(dto) {
        return await this.signInUseCase.execute(dto);
    }
    async signOut(dto) {
        return await this.signOutUseCase.execute(dto);
    }
    async refreshToken(dto) {
        return await this.refreshTokenUseCase.execute(dto);
    }
    async resetPassword(dto) {
        return await this.resetPasswordUseCase.execute(dto);
    }
}
//# sourceMappingURL=AuthService.js.map