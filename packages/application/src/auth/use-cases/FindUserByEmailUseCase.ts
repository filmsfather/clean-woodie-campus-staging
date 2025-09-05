import { UseCase } from '../../use-cases/UseCase';
import { IUserRepository, User, Email, Result } from '@woodie/domain';

export interface FindUserByEmailDto {
  email: string;
}

export class FindUserByEmailUseCase implements UseCase<FindUserByEmailDto, User | null> {
  constructor(
    private userRepository: IUserRepository
  ) {}

  async execute(dto: FindUserByEmailDto): Promise<Result<User | null>> {
    try {
      const { email } = dto;

      // Email 값 객체 생성
      const emailResult = Email.create(email);
      if (emailResult.isFailure) {
        return Result.fail<User | null>('Invalid email format');
      }

      // 사용자 조회
      const user = await this.userRepository.findByEmail(emailResult.value);
      
      return Result.ok<User | null>(user);

    } catch (error) {
      console.error('Find user by email error:', error);
      return Result.fail<User | null>('Failed to find user by email');
    }
  }
}