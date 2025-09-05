import { Result } from '@woodie/domain';
export class FindInvitesByCreatorUseCase {
    inviteRepository;
    constructor(inviteRepository) {
        this.inviteRepository = inviteRepository;
    }
    async execute(dto) {
        try {
            const { creatorId } = dto;
            if (!creatorId || creatorId.trim().length === 0) {
                return Result.fail('Creator ID is required');
            }
            // 생성자로 초대 조회
            const invitesResult = await this.inviteRepository.findByCreator(creatorId);
            if (invitesResult.isFailure) {
                return Result.fail(invitesResult.errorValue);
            }
            return Result.ok(invitesResult.value);
        }
        catch (error) {
            console.error('Find invites by creator error:', error);
            return Result.fail('Failed to find invites by creator');
        }
    }
}
//# sourceMappingURL=FindInvitesByCreatorUseCase.js.map