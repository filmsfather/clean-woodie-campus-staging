import { Result } from '@woodie/domain';
import { InviteToken } from '@woodie/domain';
export class ValidateInviteTokenUseCase {
    inviteRepository;
    constructor(inviteRepository) {
        this.inviteRepository = inviteRepository;
    }
    async execute(dto) {
        try {
            // 토큰 값 객체 생성 및 검증
            const tokenResult = InviteToken.createFromValue(dto.token);
            if (tokenResult.isFailure) {
                const response = {
                    isValid: false,
                    errorMessage: `Invalid token format: ${tokenResult.errorValue}`
                };
                return Result.ok(response);
            }
            // 리포지토리에서 토큰으로 초대 조회
            const inviteResult = await this.inviteRepository.findByToken(tokenResult.value);
            if (inviteResult.isFailure) {
                return Result.fail(`Failed to find invite: ${inviteResult.errorValue}`);
            }
            const invite = inviteResult.value;
            // 초대가 존재하지 않는 경우
            if (!invite) {
                const response = {
                    isValid: false,
                    errorMessage: 'Invalid token'
                };
                return Result.ok(response);
            }
            // 초대 유효성 검증
            if (!invite.isValid()) {
                let errorMessage = 'Token is not valid';
                if (invite.isExpired()) {
                    errorMessage = 'Token has expired';
                }
                else if (invite.isUsed()) {
                    errorMessage = 'Token has already been used';
                }
                const response = {
                    isValid: false,
                    errorMessage
                };
                return Result.ok(response);
            }
            // 유효한 초대인 경우 초대 정보와 함께 반환
            const inviteDto = {
                id: invite.id.toString(),
                email: invite.email.value,
                role: invite.role,
                organizationId: invite.organizationId,
                classId: invite.classId,
                token: invite.token.value,
                expiresAt: invite.expiresAt.toISOString(),
                usedAt: invite.usedAt?.toISOString(),
                createdBy: invite.createdBy,
                usedBy: invite.usedBy,
                createdAt: invite.createdAt.toISOString(),
                isExpired: invite.isExpired(),
                isUsed: invite.isUsed(),
                isValid: invite.isValid()
            };
            const response = {
                isValid: true,
                invite: inviteDto
            };
            return Result.ok(response);
        }
        catch (error) {
            return Result.fail(`Unexpected error validating token: ${error}`);
        }
    }
}
//# sourceMappingURL=ValidateInviteTokenUseCase.js.map