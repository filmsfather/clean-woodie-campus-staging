import { UseCase } from '../../use-cases/UseCase';
import { IInviteRepository, UniqueEntityID, Result } from '@woodie/domain';

export interface DeleteInviteDto {
  inviteId: string;
  requesterId?: string; // 삭제를 요청한 사용자 ID (권한 확인용)
}

export class DeleteInviteUseCase implements UseCase<DeleteInviteDto, void> {
  constructor(
    private inviteRepository: IInviteRepository
  ) {}

  async execute(dto: DeleteInviteDto): Promise<Result<void>> {
    try {
      const { inviteId } = dto;

      // 초대 존재 여부 확인
      const inviteResult = await this.inviteRepository.findById(new UniqueEntityID(inviteId));
      if (inviteResult.isFailure) {
        return Result.fail<void>('Failed to check invite existence');
      }

      if (!inviteResult.value) {
        return Result.fail<void>('Invite not found');
      }

      // 초대 삭제
      const deleteResult = await this.inviteRepository.delete(new UniqueEntityID(inviteId));
      
      if (deleteResult.isFailure) {
        return Result.fail<void>(deleteResult.errorValue);
      }

      return Result.ok<void>();

    } catch (error) {
      console.error('Delete invite error:', error);
      return Result.fail<void>('Failed to delete invite');
    }
  }
}