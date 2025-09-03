import { Entity } from '../../entities/Entity';
import { Result } from '../../common/Result';
import { Email } from '../value-objects/Email';
import { FullName } from '../value-objects/FullName';
import { UniqueEntityID } from '../../common/Identifier';

// 사용자 역할 타입 (기존 user_role enum과 동일)
import type { UserRole } from '../types/UserRole';

// 프로필 설정 인터페이스 (DB의 settings JSONB 필드)
export interface ProfileSettings {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy?: {
    showEmail: boolean;
    showActivity: boolean;
  };
}

interface ProfileProps {
  fullName: FullName;
  email: Email;
  role: UserRole;
  schoolId?: string; // DB: school_id
  gradeLevel?: number; // DB: grade_level
  avatarUrl?: string; // DB: avatar_url
  settings: ProfileSettings; // DB: settings JSONB
  createdAt: Date; // DB: created_at
  updatedAt: Date; // DB: updated_at
}

export class Profile extends Entity<UniqueEntityID> {
  private constructor(private props: ProfileProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID());
  }

  // Getters
  get fullName(): FullName {
    return this.props.fullName;
  }

  get email(): Email {
    return this.props.email;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get schoolId(): string | undefined {
    return this.props.schoolId;
  }

  get gradeLevel(): number | undefined {
    return this.props.gradeLevel;
  }

  get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  get settings(): ProfileSettings {
    return this.props.settings;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // 비즈니스 로직 메서드
  public isStudent(): boolean {
    return this.props.role === 'student';
  }

  public isTeacher(): boolean {
    return this.props.role === 'teacher';
  }

  public isAdmin(): boolean {
    return this.props.role === 'admin';
  }

  public hasTeacherPrivileges(): boolean {
    return this.props.role === 'teacher' || this.props.role === 'admin';
  }

  // 프로필 정보 업데이트 (기존 User.updateProfile 패턴 따름)
  public updateProfile(fullName?: string, gradeLevel?: number): Result<void> {
    // 이름 업데이트
    if (fullName !== undefined) {
      const nameResult = FullName.create(fullName);
      if (nameResult.isFailure) {
        return Result.fail<void>(nameResult.error);
      }
      this.props.fullName = nameResult.value;
    }

    // 학년 업데이트 (학생만 가능)
    if (gradeLevel !== undefined) {
      if (!this.isStudent()) {
        return Result.fail<void>('Only students can have grade level');
      }
      if (gradeLevel < 1 || gradeLevel > 12) {
        return Result.fail<void>('Grade level must be between 1 and 12');
      }
      this.props.gradeLevel = gradeLevel;
    }

    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  // 아바타 URL 업데이트
  public updateAvatar(avatarUrl?: string): Result<void> {
    if (avatarUrl && avatarUrl.trim()) {
      try {
        new URL(avatarUrl);
      } catch {
        return Result.fail<void>('Invalid avatar URL format');
      }
      this.props.avatarUrl = avatarUrl.trim();
    } else {
      this.props.avatarUrl = undefined;
    }

    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  // 설정 업데이트
  public updateSettings(settings: Partial<ProfileSettings>): Result<void> {
    this.props.settings = {
      ...this.props.settings,
      ...settings
    };
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  // 역할 변경 (관리자만 가능 - 비즈니스 로직은 Application 레이어에서 체크)
  public changeRole(newRole: UserRole): Result<void> {
    // 역할 변경시 학년 정보 정리
    if (newRole !== 'student') {
      this.props.gradeLevel = undefined;
    }

    this.props.role = newRole;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  // 팩토리 메서드 - 새 프로필 생성 (기존 User.create 패턴 따름)
  public static create(props: {
    email: string;
    fullName: string;
    role: UserRole;
    schoolId?: string;
    gradeLevel?: number;
  }, id?: UniqueEntityID): Result<Profile> {

    // Email 값 객체 생성
    const emailResult = Email.create(props.email);
    if (emailResult.isFailure) {
      return Result.fail<Profile>(emailResult.error);
    }

    // FullName 값 객체 생성
    const nameResult = FullName.create(props.fullName);
    if (nameResult.isFailure) {
      return Result.fail<Profile>(nameResult.error);
    }

    // 학년 검증
    if (props.role !== 'student' && props.gradeLevel !== undefined) {
      return Result.fail<Profile>('Only students can have grade level');
    }

    if (props.gradeLevel !== undefined && (props.gradeLevel < 1 || props.gradeLevel > 12)) {
      return Result.fail<Profile>('Grade level must be between 1 and 12');
    }

    const now = new Date();
    
    const profile = new Profile({
      fullName: nameResult.value,
      email: emailResult.value,
      role: props.role,
      schoolId: props.schoolId,
      gradeLevel: props.gradeLevel,
      settings: {
        theme: 'auto',
        language: 'ko',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        privacy: {
          showEmail: false,
          showActivity: true
        }
      },
      createdAt: now,
      updatedAt: now
    }, id);

    return Result.ok<Profile>(profile);
  }

  // 표시용 정보 생성
  public getDisplayInfo() {
    return {
      id: this.id.toString(),
      name: this.fullName.getDisplayName(),
      initials: this.fullName.getInitials(),
      email: this.email.value,
      role: this.role,
      gradeLevel: this.gradeLevel,
      avatarUrl: this.avatarUrl,
      hasAvatar: !!this.avatarUrl
    };
  }
}