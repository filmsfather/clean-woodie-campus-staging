import { Repository } from '../../repositories/Repository';
import { User } from '../entities/User';
import { Email } from '../value-objects/Email';
import { UniqueEntityID } from '../../common/Identifier';
import { Result } from '../../common/Result';

export interface IUserRepository {
  findById(id: UniqueEntityID): Promise<User | null>;
  save(user: User): Promise<Result<User>>;
  delete(id: UniqueEntityID): Promise<Result<void>>;
  findByEmail(email: Email): Promise<User | null>;
  findByInviteToken(token: string): Promise<User | null>;
}