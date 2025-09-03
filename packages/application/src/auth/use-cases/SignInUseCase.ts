import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { 
  Email, 
  Password, 
  IAuthRepository, 
  AuthResult 
} from '@woodie/domain';
import { AuthContext } from '../dto/AuthContext';

interface SignInRequest {
  email: string;
  password: string;
  context?: AuthContext;
}

export class SignInUseCase implements UseCase<SignInRequest, AuthResult> {
  constructor(
    private authRepository: IAuthRepository
  ) {}

  async execute(request: SignInRequest): Promise<Result<AuthResult>> {
    const emailResult = Email.create(request.email);
    if (emailResult.isFailure) {
      return Result.fail<AuthResult>(emailResult.error);
    }

    const passwordResult = Password.createPlaintext(request.password);
    if (passwordResult.isFailure) {
      return Result.fail<AuthResult>(passwordResult.error);
    }

    const email = emailResult.value;
    const password = passwordResult.value;

    const authResult = await this.authRepository.signIn(email, password);
    if (authResult.isFailure) {
      return Result.fail<AuthResult>(authResult.error);
    }

    return Result.ok<AuthResult>(authResult.value);
  }
}