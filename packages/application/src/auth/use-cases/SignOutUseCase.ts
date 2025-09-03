import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { IAuthRepository } from '@woodie/domain';
import { AuthContext } from '../dto/AuthContext';

interface SignOutRequest {
  accessToken: string;
  context?: AuthContext;
}

export class SignOutUseCase implements UseCase<SignOutRequest, void> {
  constructor(
    private authRepository: IAuthRepository
  ) {}

  async execute(request: SignOutRequest): Promise<Result<void>> {
    const result = await this.authRepository.signOut(request.accessToken);
    if (result.isFailure) {
      return Result.fail<void>(result.error);
    }

    return Result.ok<void>();
  }
}