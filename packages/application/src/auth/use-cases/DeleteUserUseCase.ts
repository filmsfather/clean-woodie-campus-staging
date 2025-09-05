import { UseCase } from '../../use-cases/UseCase';
import { IUserRepository, UniqueEntityID, Result } from '@woodie/domain';

export interface DeleteUserDto {
  userId: string;
  requesterId?: string; // 삭제를 요청한 사용자 ID (관리자 권한 확인용)
}

export class DeleteUserUseCase implements UseCase<DeleteUserDto, void> {
  constructor(
    private userRepository: IUserRepository
  ) {}

  async execute(dto: DeleteUserDto): Promise<Result<void>> {
    try {
      const { userId, requesterId } = dto;

      // 사용자 존재 여부 확인
      const user = await this.userRepository.findById(new UniqueEntityID(userId));
      if (!user) {
        return Result.fail<void>('User not found');
      }

      // 관리자 권한 확인 (필요한 경우)
      if (requesterId) {
        const requester = await this.userRepository.findById(new UniqueEntityID(requesterId));
        if (!requester || requester.role !== 'admin') {
          return Result.fail<void>('Only admins can delete users');
        }
      }

      // 사용자 삭제
      const deleteResult = await this.userRepository.delete(new UniqueEntityID(userId));
      
      if (deleteResult.isFailure) {
        return Result.fail<void>(deleteResult.error);
      }

      return Result.ok<void>();

    } catch (error) {
      console.error('Delete user error:', error);
      return Result.fail<void>('Failed to delete user');
    }
  }
}