import { UseCase } from '../../use-cases/UseCase';
import { Result } from '@woodie/domain';
import { 
  Email, 
  Password, 
  User, 
  UserRole,
  IUserRepository, 
  IAuthRepository, 
  AuthResult 
} from '@woodie/domain';
import { AuthContext } from '../dto/AuthContext';

interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  classId?: string;
  context?: AuthContext;
}

export class SignUpUseCase implements UseCase<SignUpRequest, AuthResult> {
  constructor(
    private userRepository: IUserRepository,
    private authRepository: IAuthRepository
  ) {}

  async execute(request: SignUpRequest): Promise<Result<AuthResult>> {
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

    // Create user in auth provider (handles uniqueness)
    const authResult = await this.authRepository.signUp(email, password);
    if (authResult.isFailure) {
      return Result.fail<AuthResult>(authResult.error);
    }

    const authData = authResult.value;

    // Create user profile
    const userResult = User.create({
      email: request.email,
      name: request.name,
      role: request.role,
      classId: request.classId
    });

    if (userResult.isFailure) {
      return Result.fail<AuthResult>(userResult.error);
    }

    const user = userResult.value;
    await this.userRepository.save(user);

    return Result.ok<AuthResult>(authData);
  }
}