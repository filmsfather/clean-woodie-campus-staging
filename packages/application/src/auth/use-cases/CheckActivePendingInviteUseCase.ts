import { UseCase } from '../../use-cases/UseCase';
import { IInviteRepository, Email, Result } from '@woodie/domain';

export interface CheckActivePendingInviteDto {
  email: string;
  organizationId: string;
}

export class CheckActivePendingInviteUseCase implements UseCase<CheckActivePendingInviteDto, boolean> {
  constructor(
    private inviteRepository: IInviteRepository
  ) {}

  async execute(dto: CheckActivePendingInviteDto): Promise<Result<boolean>> {
    try {
      const { email, organizationId } = dto;

      if (!organizationId || organizationId.trim().length === 0) {
        return Result.fail<boolean>('Organization ID is required');
      }

      // Email 값 객체 생성
      const emailResult = Email.create(email);
      if (emailResult.isFailure) {
        return Result.fail<boolean>('Invalid email format');
      }

      // 활성 대기중 초대 확인
      const hasActiveInviteResult = await this.inviteRepository.hasActivePendingInvite(
        emailResult.value, 
        organizationId
      );
      
      if (hasActiveInviteResult.isFailure) {
        return Result.fail<boolean>(hasActiveInviteResult.errorValue);
      }

      return Result.ok<boolean>(hasActiveInviteResult.value);

    } catch (error) {
      console.error('Check active pending invite error:', error);
      return Result.fail<boolean>('Failed to check active pending invite');
    }
  }
}