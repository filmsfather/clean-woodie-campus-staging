import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, Email, Result } from '@woodie/domain';

export interface CheckEmailExistsDto {
  email: string;
}

export class CheckEmailExistsUseCase implements UseCase<CheckEmailExistsDto, boolean> {
  constructor(
    private profileRepository: IProfileRepository
  ) {}

  async execute(dto: CheckEmailExistsDto): Promise<Result<boolean>> {
    try {
      const { email } = dto;

      // Email 값 객체 생성
      const emailResult = Email.create(email);
      if (emailResult.isFailure) {
        return Result.fail<boolean>('Invalid email format');
      }

      // 이메일 존재 확인
      const existsResult = await this.profileRepository.existsByEmail(emailResult.value);
      
      if (existsResult.isFailure) {
        return Result.fail<boolean>(existsResult.errorValue);
      }

      return Result.ok<boolean>(existsResult.value);

    } catch (error) {
      console.error('Check email exists error:', error);
      return Result.fail<boolean>('Failed to check email existence');
    }
  }
}