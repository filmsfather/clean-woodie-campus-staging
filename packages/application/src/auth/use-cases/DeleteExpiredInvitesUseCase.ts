import { UseCase } from '../../use-cases/UseCase';
import { IInviteRepository, Result } from '@woodie/domain';

export interface DeleteExpiredInvitesDto {
  olderThanDays?: number; // 기본값: 30일
}

export class DeleteExpiredInvitesUseCase implements UseCase<DeleteExpiredInvitesDto, number> {
  constructor(
    private inviteRepository: IInviteRepository
  ) {}

  async execute(dto: DeleteExpiredInvitesDto): Promise<Result<number>> {
    try {
      const { olderThanDays = 30 } = dto;

      if (olderThanDays < 1) {
        return Result.fail<number>('olderThanDays must be at least 1');
      }

      // 만료된 토큰 삭제
      const deleteResult = await this.inviteRepository.deleteExpiredTokens(olderThanDays);
      
      if (deleteResult.isFailure) {
        return Result.fail<number>(deleteResult.errorValue);
      }

      return Result.ok<number>(deleteResult.value);

    } catch (error) {
      console.error('Delete expired invites error:', error);
      return Result.fail<number>('Failed to delete expired invites');
    }
  }
}