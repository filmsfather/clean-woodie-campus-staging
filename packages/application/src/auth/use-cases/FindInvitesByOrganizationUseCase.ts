import { UseCase } from '../../use-cases/UseCase';
import { IInviteRepository, Invite, InviteFilters, Result } from '@woodie/domain';

export interface FindInvitesByOrganizationDto {
  organizationId: string;
  filters?: InviteFilters;
}

export class FindInvitesByOrganizationUseCase implements UseCase<FindInvitesByOrganizationDto, Invite[]> {
  constructor(
    private inviteRepository: IInviteRepository
  ) {}

  async execute(dto: FindInvitesByOrganizationDto): Promise<Result<Invite[]>> {
    try {
      const { organizationId, filters } = dto;

      if (!organizationId || organizationId.trim().length === 0) {
        return Result.fail<Invite[]>('Organization ID is required');
      }

      // 조직별 초대 조회
      const invitesResult = await this.inviteRepository.findByOrganization(organizationId, filters);
      
      if (invitesResult.isFailure) {
        return Result.fail<Invite[]>(invitesResult.errorValue);
      }

      return Result.ok<Invite[]>(invitesResult.value);

    } catch (error) {
      console.error('Find invites by organization error:', error);
      return Result.fail<Invite[]>('Failed to find invites by organization');
    }
  }
}