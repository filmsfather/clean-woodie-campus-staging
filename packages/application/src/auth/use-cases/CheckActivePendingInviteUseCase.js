import { Email, Result } from '@woodie/domain';
export class CheckActivePendingInviteUseCase {
    inviteRepository;
    constructor(inviteRepository) {
        this.inviteRepository = inviteRepository;
    }
    async execute(dto) {
        try {
            const { email, organizationId } = dto;
            if (!organizationId || organizationId.trim().length === 0) {
                return Result.fail('Organization ID is required');
            }
            // Email 값 객체 생성
            const emailResult = Email.create(email);
            if (emailResult.isFailure) {
                return Result.fail('Invalid email format');
            }
            // 활성 대기중 초대 확인
            const hasActiveInviteResult = await this.inviteRepository.hasActivePendingInvite(emailResult.value, organizationId);
            if (hasActiveInviteResult.isFailure) {
                return Result.fail(hasActiveInviteResult.errorValue);
            }
            return Result.ok(hasActiveInviteResult.value);
        }
        catch (error) {
            console.error('Check active pending invite error:', error);
            return Result.fail('Failed to check active pending invite');
        }
    }
}
//# sourceMappingURL=CheckActivePendingInviteUseCase.js.map