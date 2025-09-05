import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, UniqueEntityID, Result } from '@woodie/domain';

export interface DeleteProfileDto {
  userId: string;
  requesterId?: string; // 삭제를 요청한 사용자 ID (권한 확인용)
}

export class DeleteProfileUseCase implements UseCase<DeleteProfileDto, void> {
  constructor(
    private profileRepository: IProfileRepository
  ) {}

  async execute(dto: DeleteProfileDto): Promise<Result<void>> {
    try {
      const { userId, requesterId } = dto;

      // 프로필 존재 여부 확인
      const profileResult = await this.profileRepository.findById(new UniqueEntityID(userId));
      if (profileResult.isFailure) {
        return Result.fail<void>('Failed to check profile existence');
      }

      if (!profileResult.value) {
        return Result.fail<void>('Profile not found');
      }

      // 권한 확인 (본인 또는 관리자만 삭제 가능)
      if (requesterId && requesterId !== userId) {
        const requesterResult = await this.profileRepository.findById(new UniqueEntityID(requesterId));
        if (requesterResult.isFailure || !requesterResult.value) {
          return Result.fail<void>('Requester not found');
        }

        if (requesterResult.value.role !== 'admin') {
          return Result.fail<void>('Only admins can delete other profiles');
        }
      }

      // 프로필 삭제
      const deleteResult = await this.profileRepository.delete(new UniqueEntityID(userId));
      
      if (deleteResult.isFailure) {
        return Result.fail<void>(deleteResult.errorValue);
      }

      return Result.ok<void>();

    } catch (error) {
      console.error('Delete profile error:', error);
      return Result.fail<void>('Failed to delete profile');
    }
  }
}