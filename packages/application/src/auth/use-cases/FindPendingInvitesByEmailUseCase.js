import { Email, Result } from '@woodie/domain';
export class FindPendingInvitesByEmailUseCase {
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
            // 대기중인 초대 조회
            const invitesResult = await this.inviteRepository.findPendingInvitesByEmail(emailResult.value);
            if (invitesResult.isFailure) {
                return Result.fail(invitesResult.errorValue);
            }
            return Result.ok(invitesResult.value);
        }
        catch (error) {
            console.error('Find pending invites by email error:', error);
            return Result.fail('Failed to find pending invites by email');
        }
    }
}
//# sourceMappingURL=FindPendingInvitesByEmailUseCase.js.map