import { UseCase } from '../../use-cases/UseCase';
import { IInviteRepository, Invite, Email, Result } from '@woodie/domain';

export interface FindPendingInvitesByEmailDto {
  email: string;
}

export class FindPendingInvitesByEmailUseCase implements UseCase<FindPendingInvitesByEmailDto, Invite[]> {
  constructor(
    private inviteRepository: IInviteRepository
  ) {}

  async execute(dto: FindPendingInvitesByEmailDto): Promise<Result<Invite[]>> {
    try {
      const { email } = dto;

      // Email 값 객체 생성
      const emailResult = Email.create(email);
      if (emailResult.isFailure) {
        return Result.fail<Invite[]>('Invalid email format');
      }

      // 대기중인 초대 조회
      const invitesResult = await this.inviteRepository.findPendingInvitesByEmail(emailResult.value);
      
      if (invitesResult.isFailure) {
        return Result.fail<Invite[]>(invitesResult.errorValue);
      }

      return Result.ok<Invite[]>(invitesResult.value);

    } catch (error) {
      console.error('Find pending invites by email error:', error);
      return Result.fail<Invite[]>('Failed to find pending invites by email');
    }
  }
}