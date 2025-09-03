import { Entity } from '../../entities/Entity';
import { Result } from '../../common/Result';
import { Email } from '../value-objects/Email';
import { UniqueEntityID } from '../../common/Identifier';

import type { UserRole } from '../types/UserRole';

interface UserProps {
  email: Email;
  name: string;
  role: UserRole;
  classId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity<UserProps> {
  private constructor(props: UserProps, id?: UniqueEntityID) {
    super(props, id);
  }

  get email(): Email {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get classId(): string | undefined {
    return this.props.classId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static create(props: {
    email: string;
    name: string;
    role: UserRole;
    classId?: string;
    isActive?: boolean;
  }, id?: UniqueEntityID): Result<User> {
    
    const emailResult = Email.create(props.email);
    if (emailResult.isFailure) {
      return Result.fail<User>(emailResult.error);
    }

    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<User>('Name cannot be empty');
    }

    if (props.name.trim().length > 100) {
      return Result.fail<User>('Name is too long');
    }

    const now = new Date();
    
    const user = new User({
      email: emailResult.value,
      name: props.name.trim(),
      role: props.role,
      classId: props.classId,
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now
    }, id);

    return Result.ok<User>(user);
  }

  public updateProfile(name?: string, classId?: string): Result<void> {
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return Result.fail<void>('Name cannot be empty');
      }
      if (name.trim().length > 100) {
        return Result.fail<void>('Name is too long');
      }
      this.props.name = name.trim();
    }

    if (classId !== undefined) {
      this.props.classId = classId;
    }

    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }
}