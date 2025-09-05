import { Result } from '@woodie/domain';
import { InviteToken } from '@woodie/domain';
export class UseInviteTokenUseCase {
    inviteRepository;
    constructor(inviteRepository) {
        this.inviteRepository = inviteRepository;
    }
    async execute(dto) {
        try {
            // 토큰 값 객체 생성 및 검증
            const tokenResult = InviteToken.createFromValue(dto.token);
            if (tokenResult.isFailure) {
                return Result.fail(`Invalid token format: ${tokenResult.errorValue}`);
            }
            // 리포지토리에서 토큰으로 초대 조회
            const inviteResult = await this.inviteRepository.findByToken(tokenResult.value);
            if (inviteResult.isFailure) {
                return Result.fail(`Failed to find invite: ${inviteResult.errorValue}`);
            }
            const invite = inviteResult.value;
            // 초대가 존재하지 않는 경우
            if (!invite) {
                return Result.fail('Invalid token');
            }
            // 도메인 로직을 통해 토큰 사용 처리
            const markUsedResult = invite.markAsUsed(dto.userId);
            if (markUsedResult.isFailure) {
                return Result.fail(`Failed to use token: ${markUsedResult.errorValue}`);
            }
            // 변경사항을 리포지토리에 저장
            const savedInviteResult = await this.inviteRepository.save(invite);
            if (savedInviteResult.isFailure) {
                return Result.fail(`Failed to save used invite: ${savedInviteResult.errorValue}`);
            }
            // DTO로 변환 후 반환
            const updatedInvite = savedInviteResult.value;
            const responseDto = {
                id: updatedInvite.id.toString(),
                email: updatedInvite.email.value,
                role: updatedInvite.role,
                organizationId: updatedInvite.organizationId,
                classId: updatedInvite.classId,
                token: updatedInvite.token.value,
                expiresAt: updatedInvite.expiresAt.toISOString(),
                usedAt: updatedInvite.usedAt?.toISOString(),
                createdBy: updatedInvite.createdBy,
                usedBy: updatedInvite.usedBy,
                createdAt: updatedInvite.createdAt.toISOString(),
                isExpired: updatedInvite.isExpired(),
                isUsed: updatedInvite.isUsed(),
                isValid: updatedInvite.isValid()
            };
            return Result.ok(responseDto);
        }
        catch (error) {
            return Result.fail(`Unexpected error using invite token: ${error}`);
        }
    }
}
//# sourceMappingURL=UseInviteTokenUseCase.js.map