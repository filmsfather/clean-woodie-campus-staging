import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { IAuthRepository, AuthResult } from '@woodie/domain';
import { AuthContext } from '../dto/AuthContext';

interface RefreshTokenRequest {
  refreshToken: string;
  context?: AuthContext;
}

export class RefreshTokenUseCase implements UseCase<RefreshTokenRequest, AuthResult> {
  constructor(
    private authRepository: IAuthRepository
  ) {}

  async execute(request: RefreshTokenRequest): Promise<Result<AuthResult>> {
    const result = await this.authRepository.refreshToken(request.refreshToken);
    if (result.isFailure) {
      return Result.fail<AuthResult>(result.error);
    }

    return Result.ok<AuthResult>(result.value);
  }
}