export class AuthService {
    signUpUseCase;
    signInUseCase;
    signOutUseCase;
    refreshTokenUseCase;
    resetPasswordUseCase;
    deleteUserUseCase;
    findUserByEmailUseCase;
    findUserByInviteTokenUseCase;
    name = 'AuthService';
    constructor(signUpUseCase, signInUseCase, signOutUseCase, refreshTokenUseCase, resetPasswordUseCase, deleteUserUseCase, findUserByEmailUseCase, findUserByInviteTokenUseCase) {
        this.signUpUseCase = signUpUseCase;
        this.signInUseCase = signInUseCase;
        this.signOutUseCase = signOutUseCase;
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.resetPasswordUseCase = resetPasswordUseCase;
        this.deleteUserUseCase = deleteUserUseCase;
        this.findUserByEmailUseCase = findUserByEmailUseCase;
        this.findUserByInviteTokenUseCase = findUserByInviteTokenUseCase;
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
    async deleteUser(dto) {
        return await this.deleteUserUseCase.execute(dto);
    }
    async findUserByEmail(dto) {
        return await this.findUserByEmailUseCase.execute(dto);
    }
    async findUserByInviteToken(dto) {
        return await this.findUserByInviteTokenUseCase.execute(dto);
    }
}
//# sourceMappingURL=AuthService.js.map