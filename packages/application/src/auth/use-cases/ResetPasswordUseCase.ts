import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { 
  Email, 
  IAuthRepository
} from '@woodie/domain';
import { AuthContext } from '../dto/AuthContext';

interface ResetPasswordRequest {
  email: string;
  context?: AuthContext;
}

export class ResetPasswordUseCase implements UseCase<ResetPasswordRequest, void> {
  constructor(
    private authRepository: IAuthRepository
  ) {}

  async execute(request: ResetPasswordRequest): Promise<Result<void>> {
    const emailResult = Email.create(request.email);
    if (emailResult.isFailure) {
      return Result.fail<void>(emailResult.error);
    }

    const email = emailResult.value;
    
    const result = await this.authRepository.resetPassword(email);
    if (result.isFailure) {
      return Result.fail<void>(result.error);
    }

    return Result.ok<void>();
  }
}