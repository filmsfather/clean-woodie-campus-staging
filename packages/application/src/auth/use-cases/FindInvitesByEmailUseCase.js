import { Email, Result } from '@woodie/domain';
export class FindInvitesByEmailUseCase {
    inviteRepository;
    constructor(inviteRepository) {
        this.inviteRepository = inviteRepository;
    }
    async execute(dto) {
        try {
            const { email } = dto;
            // Email 값 객체 생성
            const emailResult = Email.create(email);
            if (emailResult.isFailure) {
                return Result.fail('Invalid email format');
            }
            // 이메일로 초대 조회
            const invitesResult = await this.inviteRepository.findByEmail(emailResult.value);
            if (invitesResult.isFailure) {
                return Result.fail(invitesResult.errorValue);
            }
            return Result.ok(invitesResult.value);
        }
        catch (error) {
            console.error('Find invites by email error:', error);
            return Result.fail('Failed to find invites by email');
        }
    }
}
//# sourceMappingURL=FindInvitesByEmailUseCase.js.map