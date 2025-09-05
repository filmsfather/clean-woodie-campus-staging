import { UseCase } from '../../use-cases/UseCase';
import { IInviteRepository, Invite, Result } from '@woodie/domain';

export interface FindInvitesByCreatorDto {
  creatorId: string;
}

export class FindInvitesByCreatorUseCase implements UseCase<FindInvitesByCreatorDto, Invite[]> {
  constructor(
    private inviteRepository: IInviteRepository
  ) {}

  async execute(dto: FindInvitesByCreatorDto): Promise<Result<Invite[]>> {
    try {
      const { creatorId } = dto;

      if (!creatorId || creatorId.trim().length === 0) {
        return Result.fail<Invite[]>('Creator ID is required');
      }

      // 생성자로 초대 조회
      const invitesResult = await this.inviteRepository.findByCreator(creatorId);
      
      if (invitesResult.isFailure) {
        return Result.fail<Invite[]>(invitesResult.errorValue);
      }

      return Result.ok<Invite[]>(invitesResult.value);

    } catch (error) {
      console.error('Find invites by creator error:', error);
      return Result.fail<Invite[]>('Failed to find invites by creator');
    }
  }
}