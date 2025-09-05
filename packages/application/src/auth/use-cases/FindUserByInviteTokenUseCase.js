import { Result } from '@woodie/domain';
export class FindUserByInviteTokenUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(dto) {
        try {
            const { token } = dto;
            if (!token || token.trim().length === 0) {
                return Result.fail('Token is required');
            }
            // 초대 토큰으로 사용자 조회
            const user = await this.userRepository.findByInviteToken(token);
            return Result.ok(user);
        }
        catch (error) {
            console.error('Find user by invite token error:', error);
            return Result.fail('Failed to find user by invite token');
        }
    }
}
//# sourceMappingURL=FindUserByInviteTokenUseCase.js.map