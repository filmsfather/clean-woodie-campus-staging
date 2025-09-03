import { Profile } from '../entities/Profile';
import { Email } from '../value-objects/Email';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';

// 프로필 검색 필터 인터페이스
export interface ProfileFilters {
  role?: 'student' | 'teacher' | 'admin';
  schoolId?: string;
  gradeLevel?: number;
  isActive?: boolean;
}

// 프로필 리포지토리 인터페이스
export interface IProfileRepository {
  // 기본 CRUD 작업
  save(profile: Profile): Promise<Result<Profile>>;
  findById(id: UniqueEntityID): Promise<Result<Profile | null>>;
  delete(id: UniqueEntityID): Promise<Result<void>>;
  
  // 프로필 특화 조회 메서드
  findByEmail(email: Email): Promise<Result<Profile | null>>;
  findByUserId(userId: string): Promise<Result<Profile | null>>; // auth.users.id로 조회
  
  // 관리자용 조회 메서드
  findBySchool(schoolId: string, filters?: ProfileFilters): Promise<Result<Profile[]>>;
  findByRole(role: 'student' | 'teacher' | 'admin'): Promise<Result<Profile[]>>;
  findStudentsByGrade(gradeLevel: number, schoolId?: string): Promise<Result<Profile[]>>;
  
  // 프로필 존재 여부 확인
  existsByEmail(email: Email): Promise<Result<boolean>>;
  existsByUserId(userId: string): Promise<Result<boolean>>;
  
  // 통계 조회
  countByRole(schoolId?: string): Promise<Result<{
    students: number;
    teachers: number;
    admins: number;
  }>>;
}