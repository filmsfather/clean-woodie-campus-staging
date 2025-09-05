import { UniqueEntityID, Result } from '@woodie/domain';
export class DeleteUserUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(dto) {
        try {
            const { userId, requesterId } = dto;
            // 사용자 존재 여부 확인
            const user = await this.userRepository.findById(new UniqueEntityID(userId));
            if (!user) {
                return Result.fail('User not found');
            }
            // 관리자 권한 확인 (필요한 경우)
            if (requesterId) {
                const requester = await this.userRepository.findById(new UniqueEntityID(requesterId));
                if (!requester || requester.role !== 'admin') {
                    return Result.fail('Only admins can delete users');
                }
            }
            // 사용자 삭제
            const deleteResult = await this.userRepository.delete(new UniqueEntityID(userId));
            if (deleteResult.isFailure) {
                return Result.fail(deleteResult.error);
            }
            return Result.ok();
        }
        catch (error) {
            console.error('Delete user error:', error);
            return Result.fail('Failed to delete user');
        }
    }
}
//# sourceMappingURL=DeleteUserUseCase.js.map