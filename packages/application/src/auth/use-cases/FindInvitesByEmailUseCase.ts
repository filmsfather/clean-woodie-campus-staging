import { UseCase } from '../../use-cases/UseCase';
import { IInviteRepository, Invite, Email, Result } from '@woodie/domain';

export interface FindInvitesByEmailDto {
  email: string;
}

export class FindInvitesByEmailUseCase implements UseCase<FindInvitesByEmailDto, Invite[]> {
  constructor(
    private inviteRepository: IInviteRepository
  ) {}

  async execute(dto: FindInvitesByEmailDto): Promise<Result<Invite[]>> {
    try {
      const { email } = dto;

      // Email 값 객체 생성
      const emailResult = Email.create(email);
      if (emailResult.isFailure) {
        return Result.fail<Invite[]>('Invalid email format');
      }

      // 이메일로 초대 조회
      const invitesResult = await this.inviteRepository.findByEmail(emailResult.value);
      
      if (invitesResult.isFailure) {
        return Result.fail<Invite[]>(invitesResult.errorValue);
      }

      return Result.ok<Invite[]>(invitesResult.value);

    } catch (error) {
      console.error('Find invites by email error:', error);
      return Result.fail<Invite[]>('Failed to find invites by email');
    }
  }
}