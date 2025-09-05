import { UseCase } from '../../use-cases/UseCase';
import { IProfileRepository, Result } from '@woodie/domain';

export interface CheckUserExistsDto {
  userId: string;
}

export class CheckUserExistsUseCase implements UseCase<CheckUserExistsDto, boolean> {
  constructor(
    private profileRepository: IProfileRepository
  ) {}

  async execute(dto: CheckUserExistsDto): Promise<Result<boolean>> {
    try {
      const { userId } = dto;

      if (!userId || userId.trim().length === 0) {
        return Result.fail<boolean>('User ID is required');
      }

      // 사용자 존재 확인
      const existsResult = await this.profileRepository.existsByUserId(userId);
      
      if (existsResult.isFailure) {
        return Result.fail<boolean>(existsResult.errorValue);
      }

      return Result.ok<boolean>(existsResult.value);

    } catch (error) {
      console.error('Check user exists error:', error);
      return Result.fail<boolean>('Failed to check user existence');
    }
  }
}