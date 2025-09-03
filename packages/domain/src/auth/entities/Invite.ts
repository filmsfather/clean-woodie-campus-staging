import { Entity } from '../../entities/Entity';
import { Email } from '../value-objects/Email';
import { InviteToken } from '../value-objects/InviteToken';
import { Guard } from '../../common/Guard';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';

// 사용자 역할 타입 (기존 user_role enum과 동일)
import type { UserRole } from '../types/UserRole';

export interface InviteProps {
  email: Email;
  role: UserRole;
  organizationId: string;
  classId?: string; // 학생인 경우만 필수
  token: InviteToken;
  expiresAt: Date;
  usedAt?: Date;
  createdBy: string; // 초대 생성자 ID
  usedBy?: string; // 토큰 사용자 ID
  createdAt: Date;
}

export class Invite extends Entity<UniqueEntityID> {
  private constructor(private props: InviteProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID());
  }

  // Getters
  get email(): Email {
    return this.props.email;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get classId(): string | undefined {
    return this.props.classId;
  }

  get token(): InviteToken {
    return this.props.token;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get usedAt(): Date | undefined {
    return this.props.usedAt;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get usedBy(): string | undefined {
    return this.props.usedBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // 비즈니스 로직
  public isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  public isUsed(): boolean {
    return this.props.usedAt !== undefined;
  }

  public isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  // 토큰 사용 처리
  public markAsUsed(userId: string): Result<void> {
    // 이미 사용된 토큰 검증
    if (this.isUsed()) {
      return Result.fail<void>('Token has already been used');
    }

    // 만료된 토큰 검증
    if (this.isExpired()) {
      return Result.fail<void>('Token has expired');
    }

    // 사용자 ID 검증
    const guardResult = Guard.againstNullOrUndefined(userId, 'userId');
    if (guardResult.isFailure) {
      return Result.fail<void>(guardResult.errorValue);
    }

    // 토큰 사용 처리
    this.props.usedAt = new Date();
    this.props.usedBy = userId;

    return Result.ok<void>();
  }

  // 팩토리 메서드 - 새 초대 생성
  public static create(props: {
    email: Email;
    role: UserRole;
    organizationId: string;
    classId?: string;
    createdBy: string;
    expiryDays?: number; // 기본 7일
  }, id?: UniqueEntityID): Result<Invite> {

    // 입력값 검증
    const guardResults = Guard.combine([
      Guard.againstNullOrUndefined(props.email, 'email'),
      Guard.againstNullOrUndefined(props.role, 'role'),
      Guard.againstNullOrUndefined(props.organizationId, 'organizationId'),
      Guard.againstNullOrUndefined(props.createdBy, 'createdBy'),
    ]);

    if (guardResults.isFailure) {
      return Result.fail<Invite>(guardResults.errorValue);
    }

    // 역할별 클래스 ID 검증
    if (props.role === 'student' && !props.classId) {
      return Result.fail<Invite>('Student invites must specify a class');
    }

    if ((props.role === 'teacher' || props.role === 'admin') && props.classId) {
      return Result.fail<Invite>('Teacher and Admin invites cannot specify a class');
    }

    // 만료일 계산 (기본 7일)
    const expiryDays = props.expiryDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const inviteProps: InviteProps = {
      email: props.email,
      role: props.role,
      organizationId: props.organizationId,
      classId: props.classId,
      token: InviteToken.create(),
      expiresAt,
      createdBy: props.createdBy,
      createdAt: new Date(),
    };

    return Result.ok<Invite>(new Invite(inviteProps, id));
  }

  // 팩토리 메서드 - 기존 초대 재구성 (DB에서 읽어올 때)
  public static reconstitute(props: InviteProps, id: UniqueEntityID): Result<Invite> {
    const guardResults = Guard.combine([
      Guard.againstNullOrUndefined(props.email, 'email'),
      Guard.againstNullOrUndefined(props.role, 'role'),
      Guard.againstNullOrUndefined(props.token, 'token'),
      Guard.againstNullOrUndefined(props.expiresAt, 'expiresAt'),
    ]);

    if (guardResults.isFailure) {
      return Result.fail<Invite>(guardResults.errorValue);
    }

    return Result.ok<Invite>(new Invite(props, id));
  }
}