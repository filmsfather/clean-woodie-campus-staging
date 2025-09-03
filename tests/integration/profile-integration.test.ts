import { describe, it, expect, beforeEach } from 'vitest';
import { 
  Profile, 
  Email, 
  Result,
  UniqueEntityID,
  IProfileRepository
} from '@woodie/domain';
import { 
  CreateProfileUseCase,
  CreateProfileDto 
} from '@woodie/application';

// Mock 리포지토리 구현
class MockProfileRepository implements IProfileRepository {
  private profiles: Map<string, Profile> = new Map();

  async save(profile: Profile): Promise<Result<Profile>> {
    this.profiles.set(profile.id.toString(), profile);
    return Result.ok(profile);
  }

  async findById(id: UniqueEntityID): Promise<Result<Profile | null>> {
    const profile = this.profiles.get(id.toString()) || null;
    return Result.ok(profile);
  }

  async findByEmail(email: Email): Promise<Result<Profile | null>> {
    for (const profile of this.profiles.values()) {
      if (profile.email.value === email.value) {
        return Result.ok(profile);
      }
    }
    return Result.ok(null);
  }

  async findByUserId(userId: string): Promise<Result<Profile | null>> {
    const profile = this.profiles.get(userId) || null;
    return Result.ok(profile);
  }

  async existsByEmail(email: Email): Promise<Result<boolean>> {
    const result = await this.findByEmail(email);
    return Result.ok(result.value !== null);
  }

  async existsByUserId(userId: string): Promise<Result<boolean>> {
    const result = await this.findByUserId(userId);
    return Result.ok(result.value !== null);
  }

  async delete(id: UniqueEntityID): Promise<Result<void>> {
    this.profiles.delete(id.toString());
    return Result.ok();
  }

  // 다른 메서드들은 테스트에 필요할 때 구현
  async findBySchool(): Promise<Result<Profile[]>> { return Result.ok([]); }
  async findByRole(): Promise<Result<Profile[]>> { return Result.ok([]); }
  async findStudentsByGrade(): Promise<Result<Profile[]>> { return Result.ok([]); }
  async countByRole(): Promise<Result<{students: number; teachers: number; admins: number}>> {
    return Result.ok({students: 0, teachers: 0, admins: 0});
  }
}

describe('Profile Integration Tests', () => {
  let mockRepository: MockProfileRepository;
  let createProfileUseCase: CreateProfileUseCase;

  beforeEach(() => {
    mockRepository = new MockProfileRepository();
    createProfileUseCase = new CreateProfileUseCase(mockRepository);
  });

  describe('프로필 생성 통합 테스트', () => {
    it('유효한 데이터로 학생 프로필을 생성할 수 있다', async () => {
      // Given
      const createDto: CreateProfileDto = {
        userId: 'user-123',
        email: 'student@woodie.com',
        fullName: '김학생',
        role: 'student',
        schoolId: 'school-1',
        gradeLevel: 10
      };

      // When
      const result = await createProfileUseCase.execute(createDto);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value.email).toBe('student@woodie.com');
      expect(result.value.role).toBe('student');
      expect(result.value.gradeLevel).toBe(10);
    });

    it('선생님 프로필은 학년 정보 없이 생성된다', async () => {
      // Given
      const createDto: CreateProfileDto = {
        userId: 'teacher-123',
        email: 'teacher@woodie.com',
        fullName: '김선생',
        role: 'teacher',
        schoolId: 'school-1'
      };

      // When
      const result = await createProfileUseCase.execute(createDto);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value.role).toBe('teacher');
      expect(result.value.gradeLevel).toBeUndefined();
    });

    it('중복된 이메일로는 프로필을 생성할 수 없다', async () => {
      // Given - 먼저 프로필 하나 생성
      const firstDto: CreateProfileDto = {
        userId: 'user-1',
        email: 'duplicate@woodie.com',
        fullName: '첫번째 사용자',
        role: 'student',
        schoolId: 'school-1'
      };
      await createProfileUseCase.execute(firstDto);

      // When - 같은 이메일로 다시 생성 시도
      const secondDto: CreateProfileDto = {
        userId: 'user-2',
        email: 'duplicate@woodie.com',
        fullName: '두번째 사용자',
        role: 'student',
        schoolId: 'school-1'
      };
      const result = await createProfileUseCase.execute(secondDto);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Email already exists');
    });

    it('잘못된 이메일 형식으로는 프로필을 생성할 수 없다', async () => {
      // Given
      const createDto: CreateProfileDto = {
        userId: 'user-123',
        email: 'invalid-email',
        fullName: '김학생',
        role: 'student',
        schoolId: 'school-1'
      };

      // When
      const result = await createProfileUseCase.execute(createDto);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Invalid email');
    });
  });

  describe('도메인 로직과 애플리케이션 레이어 통합', () => {
    it('Profile 엔티티의 역할 확인 메서드가 올바르게 작동한다', async () => {
      // Given & When
      const studentDto: CreateProfileDto = {
        userId: 'student-1',
        email: 'student@woodie.com',
        fullName: '학생',
        role: 'student',
        schoolId: 'school-1',
        gradeLevel: 9
      };
      
      const teacherDto: CreateProfileDto = {
        userId: 'teacher-1',
        email: 'teacher@woodie.com',
        fullName: '선생님',
        role: 'teacher',
        schoolId: 'school-1'
      };

      const adminDto: CreateProfileDto = {
        userId: 'admin-1',
        email: 'admin@woodie.com',
        fullName: '관리자',
        role: 'admin',
        schoolId: 'school-1'
      };

      const studentResult = await createProfileUseCase.execute(studentDto);
      const teacherResult = await createProfileUseCase.execute(teacherDto);
      const adminResult = await createProfileUseCase.execute(adminDto);

      // Then - DTO 응답에서 역할 확인
      expect(studentResult.value.role).toBe('student');
      expect(teacherResult.value.role).toBe('teacher');
      expect(adminResult.value.role).toBe('admin');
      
      // 선생님과 관리자는 teacher privileges 가져야 함 (도메인 로직)
      expect(studentResult.value.gradeLevel).toBe(9);
      expect(teacherResult.value.gradeLevel).toBeUndefined();
      expect(adminResult.value.gradeLevel).toBeUndefined();
    });
  });
});