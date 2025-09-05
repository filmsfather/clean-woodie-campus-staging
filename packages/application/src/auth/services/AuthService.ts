import { ApplicationService } from '../../services/ApplicationService';
import { Result } from '@woodie/domain';
import { SignUpUseCase } from '../use-cases/SignUpUseCase';
import { SignInUseCase } from '../use-cases/SignInUseCase';
import { SignOutUseCase } from '../use-cases/SignOutUseCase';
import { RefreshTokenUseCase } from '../use-cases/RefreshTokenUseCase';
import { ResetPasswordUseCase } from '../use-cases/ResetPasswordUseCase';
import { DeleteUserUseCase } from '../use-cases/DeleteUserUseCase';
import { FindUserByEmailUseCase } from '../use-cases/FindUserByEmailUseCase';
import { FindUserByInviteTokenUseCase } from '../use-cases/FindUserByInviteTokenUseCase';
import { AuthContext } from '../dto/AuthContext';
import { 
  UserRole,
  AuthResult,
  User
} from '@woodie/domain';

interface SignUpDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  classId?: string;
  context?: AuthContext;
}

interface SignInDto {
  email: string;
  password: string;
  context?: AuthContext;
}

interface SignOutDto {
  accessToken: string;
  context?: AuthContext;
}

interface RefreshTokenDto {
  refreshToken: string;
  context?: AuthContext;
}

interface ResetPasswordDto {
  email: string;
  context?: AuthContext;
}

interface DeleteUserDto {
  userId: string;
  requesterId?: string;
}

interface FindUserByEmailDto {
  email: string;
}

interface FindUserByInviteTokenDto {
  token: string;
}

export class AuthService implements ApplicationService {
  readonly name = 'AuthService';
  constructor(
    private signUpUseCase: SignUpUseCase,
    private signInUseCase: SignInUseCase,
    private signOutUseCase: SignOutUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase,
    private deleteUserUseCase: DeleteUserUseCase,
    private findUserByEmailUseCase: FindUserByEmailUseCase,
    private findUserByInviteTokenUseCase: FindUserByInviteTokenUseCase
  ) {}

  async signUp(dto: SignUpDto): Promise<Result<AuthResult>> {
    return await this.signUpUseCase.execute(dto);
  }

  async signIn(dto: SignInDto): Promise<Result<AuthResult>> {
    return await this.signInUseCase.execute(dto);
  }

  async signOut(dto: SignOutDto): Promise<Result<void>> {
    return await this.signOutUseCase.execute(dto);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<Result<AuthResult>> {
    return await this.refreshTokenUseCase.execute(dto);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<Result<void>> {
    return await this.resetPasswordUseCase.execute(dto);
  }

  async deleteUser(dto: DeleteUserDto): Promise<Result<void>> {
    return await this.deleteUserUseCase.execute(dto);
  }

  async findUserByEmail(dto: FindUserByEmailDto): Promise<Result<User | null>> {
    return await this.findUserByEmailUseCase.execute(dto);
  }

  async findUserByInviteToken(dto: FindUserByInviteTokenDto): Promise<Result<User | null>> {
    return await this.findUserByInviteTokenUseCase.execute(dto);
  }
}