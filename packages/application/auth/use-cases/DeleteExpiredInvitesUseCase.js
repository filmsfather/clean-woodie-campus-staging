import { Result } from '@woodie/domain';
export class DeleteExpiredInvitesUseCase {
    inviteRepository;
    constructor(inviteRepository) {
        this.inviteRepository = inviteRepository;
    }
    async execute(dto) {
        try {
            const { olderThanDays = 30 } = dto;
            if (olderThanDays < 1) {
                return Result.fail('olderThanDays must be at least 1');
            }
            // 만료된 토큰 삭제
            const deleteResult = await this.inviteRepository.deleteExpiredTokens(olderThanDays);
            if (deleteResult.isFailure) {
                return Result.fail(deleteResult.errorValue);
            }
            return Result.ok(deleteResult.value);
        }
        catch (error) {
            console.error('Delete expired invites error:', error);
            return Result.fail('Failed to delete expired invites');
        }
    }
}
//# sourceMappingURL=DeleteExpiredInvitesUseCase.js.map