import { UseCase } from '../../use-cases/UseCase';
import { IUserRepository, User, Result } from '@woodie/domain';

export interface FindUserByInviteTokenDto {
  token: string;
}

export class FindUserByInviteTokenUseCase implements UseCase<FindUserByInviteTokenDto, User | null> {
  constructor(
    private userRepository: IUserRepository
  ) {}

  async execute(dto: FindUserByInviteTokenDto): Promise<Result<User | null>> {
    try {
      const { token } = dto;

      if (!token || token.trim().length === 0) {
        return Result.fail<User | null>('Token is required');
      }

      // 초대 토큰으로 사용자 조회
      const user = await this.userRepository.findByInviteToken(token);
      
      return Result.ok<User | null>(user);

    } catch (error) {
      console.error('Find user by invite token error:', error);
      return Result.fail<User | null>('Failed to find user by invite token');
    }
  }
}