import { UniqueEntityID, Result } from '@woodie/domain';
export class DeleteInviteUseCase {
    inviteRepository;
    constructor(inviteRepository) {
        this.inviteRepository = inviteRepository;
    }
    async execute(dto) {
        try {
            const { inviteId } = dto;
            // 초대 존재 여부 확인
            const inviteResult = await this.inviteRepository.findById(new UniqueEntityID(inviteId));
            if (inviteResult.isFailure) {
                return Result.fail('Failed to check invite existence');
            }
            if (!inviteResult.value) {
                return Result.fail('Invite not found');
            }
            // 초대 삭제
            const deleteResult = await this.inviteRepository.delete(new UniqueEntityID(inviteId));
            if (deleteResult.isFailure) {
                return Result.fail(deleteResult.errorValue);
            }
            return Result.ok();
        }
        catch (error) {
            console.error('Delete invite error:', error);
            return Result.fail('Failed to delete invite');
        }
    }
}
//# sourceMappingURL=DeleteInviteUseCase.js.map