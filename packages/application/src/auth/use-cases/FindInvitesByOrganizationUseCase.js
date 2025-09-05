import { Result } from '@woodie/domain';
export class FindInvitesByOrganizationUseCase {
    inviteRepository;
    constructor(inviteRepository) {
        this.inviteRepository = inviteRepository;
    }
    async execute(dto) {
        try {
            const { organizationId, filters } = dto;
            if (!organizationId || organizationId.trim().length === 0) {
                return Result.fail('Organization ID is required');
            }
            // 조직별 초대 조회
            const invitesResult = await this.inviteRepository.findByOrganization(organizationId, filters);
            if (invitesResult.isFailure) {
                return Result.fail(invitesResult.errorValue);
            }
            return Result.ok(invitesResult.value);
        }
        catch (error) {
            console.error('Find invites by organization error:', error);
            return Result.fail('Failed to find invites by organization');
        }
    }
}
//# sourceMappingURL=FindInvitesByOrganizationUseCase.js.map