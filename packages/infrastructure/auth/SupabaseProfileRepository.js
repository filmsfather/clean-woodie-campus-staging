import { createClient } from '@supabase/supabase-js';
import { Profile, Email, FullName } from '@woodie/domain';
import { Result } from '@woodie/domain';
import { UniqueEntityID } from '@woodie/domain';
export class SupabaseProfileRepository {
    supabase;
    constructor(supabaseUrl, supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    async save(profile) {
        try {
            const record = {
                id: profile.id.toString(),
                full_name: profile.fullName.value,
                email: profile.email.value,
                role: profile.role,
                school_id: profile.schoolId,
                grade_level: profile.gradeLevel,
                avatar_url: profile.avatarUrl,
                settings: profile.settings,
                created_at: profile.createdAt.toISOString(),
                updated_at: profile.updatedAt.toISOString()
            };
            // Upsert 방식으로 저장 (ID가 있으면 업데이트, 없으면 생성)
            const { data, error } = await this.supabase
                .from('profiles')
                .upsert(record, { onConflict: 'id' })
                .select()
                .single();
            if (error) {
                return Result.fail(`Failed to save profile: ${error.message}`);
            }
            // 저장된 데이터를 도메인 엔티티로 재구성
            const reconstitutedResult = await this.toDomainEntity(data);
            if (reconstitutedResult.isFailure) {
                return Result.fail(`Failed to reconstitute saved profile: ${reconstitutedResult.errorValue}`);
            }
            return Result.ok(reconstitutedResult.value);
        }
        catch (error) {
            return Result.fail(`Database error saving profile: ${error}`);
        }
    }
    async findById(id) {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', id.toString())
                .single();
            if (error) {
                if (error.code === 'PGRST116') { // No rows returned
                    return Result.ok(null);
                }
                return Result.fail(`Failed to find profile by id: ${error.message}`);
            }
            const profileResult = await this.toDomainEntity(data);
            if (profileResult.isFailure) {
                return Result.fail(`Failed to reconstitute profile: ${profileResult.errorValue}`);
            }
            return Result.ok(profileResult.value);
        }
        catch (error) {
            return Result.fail(`Database error finding profile by id: ${error}`);
        }
    }
    async findByUserId(userId) {
        // findById와 동일 (profiles.id = auth.users.id)
        return this.findById(new UniqueEntityID(userId));
    }
    async delete(id) {
        try {
            const { error } = await this.supabase
                .from('profiles')
                .delete()
                .eq('id', id.toString());
            if (error) {
                return Result.fail(`Failed to delete profile: ${error.message}`);
            }
            return Result.ok();
        }
        catch (error) {
            return Result.fail(`Database error deleting profile: ${error}`);
        }
    }
    async findByEmail(email) {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('email', email.value)
                .single();
            if (error) {
                if (error.code === 'PGRST116') { // No rows returned
                    return Result.ok(null);
                }
                return Result.fail(`Failed to find profile by email: ${error.message}`);
            }
            const profileResult = await this.toDomainEntity(data);
            if (profileResult.isFailure) {
                return Result.fail(`Failed to reconstitute profile: ${profileResult.errorValue}`);
            }
            return Result.ok(profileResult.value);
        }
        catch (error) {
            return Result.fail(`Database error finding profile by email: ${error}`);
        }
    }
    async findBySchool(schoolId, filters) {
        try {
            let query = this.supabase
                .from('profiles')
                .select('*')
                .eq('school_id', schoolId);
            // 필터 적용
            if (filters) {
                if (filters.role) {
                    query = query.eq('role', filters.role);
                }
                if (filters.gradeLevel) {
                    query = query.eq('grade_level', filters.gradeLevel);
                }
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) {
                return Result.fail(`Failed to find profiles by school: ${error.message}`);
            }
            const profiles = await this.toDomainEntities(data);
            return Result.ok(profiles);
        }
        catch (error) {
            return Result.fail(`Database error finding profiles by school: ${error}`);
        }
    }
    async findByRole(role) {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('role', role)
                .order('created_at', { ascending: false });
            if (error) {
                return Result.fail(`Failed to find profiles by role: ${error.message}`);
            }
            const profiles = await this.toDomainEntities(data);
            return Result.ok(profiles);
        }
        catch (error) {
            return Result.fail(`Database error finding profiles by role: ${error}`);
        }
    }
    async findStudentsByGrade(gradeLevel, schoolId) {
        try {
            let query = this.supabase
                .from('profiles')
                .select('*')
                .eq('role', 'student')
                .eq('grade_level', gradeLevel);
            if (schoolId) {
                query = query.eq('school_id', schoolId);
            }
            const { data, error } = await query.order('full_name', { ascending: true });
            if (error) {
                return Result.fail(`Failed to find students by grade: ${error.message}`);
            }
            const profiles = await this.toDomainEntities(data);
            return Result.ok(profiles);
        }
        catch (error) {
            return Result.fail(`Database error finding students by grade: ${error}`);
        }
    }
    async existsByEmail(email) {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('id')
                .eq('email', email.value)
                .limit(1);
            if (error) {
                return Result.fail(`Failed to check email existence: ${error.message}`);
            }
            return Result.ok(data.length > 0);
        }
        catch (error) {
            return Result.fail(`Database error checking email existence: ${error}`);
        }
    }
    async existsByUserId(userId) {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .limit(1);
            if (error) {
                return Result.fail(`Failed to check user existence: ${error.message}`);
            }
            return Result.ok(data.length > 0);
        }
        catch (error) {
            return Result.fail(`Database error checking user existence: ${error}`);
        }
    }
    async countByRole(schoolId) {
        try {
            let baseQuery = this.supabase
                .from('profiles')
                .select('role');
            if (schoolId) {
                baseQuery = baseQuery.eq('school_id', schoolId);
            }
            const { data, error } = await baseQuery;
            if (error) {
                return Result.fail(`Failed to count profiles by role: ${error.message}`);
            }
            const counts = {
                students: data.filter(p => p.role === 'student').length,
                teachers: data.filter(p => p.role === 'teacher').length,
                admins: data.filter(p => p.role === 'admin').length,
            };
            return Result.ok(counts);
        }
        catch (error) {
            return Result.fail(`Database error counting profiles by role: ${error}`);
        }
    }
    // 도메인 엔티티로 변환하는 헬퍼 메서드
    async toDomainEntity(record) {
        try {
            // Email 값 객체 생성
            const emailResult = Email.create(record.email);
            if (emailResult.isFailure) {
                return Result.fail(`Invalid email in record: ${emailResult.errorValue}`);
            }
            // FullName 값 객체 생성
            const nameResult = FullName.create(record.full_name);
            if (nameResult.isFailure) {
                return Result.fail(`Invalid name in record: ${nameResult.errorValue}`);
            }
            // Profile 엔티티 생성 (기존 데이터이므로 create가 아닌 직접 생성)
            const profile = new Profile({
                fullName: nameResult.value,
                email: emailResult.value,
                role: record.role,
                schoolId: record.school_id,
                gradeLevel: record.grade_level,
                avatarUrl: record.avatar_url,
                settings: record.settings || {},
                createdAt: new Date(record.created_at),
                updatedAt: new Date(record.updated_at)
            }, new UniqueEntityID(record.id));
            return Result.ok(profile);
        }
        catch (error) {
            return Result.fail(`Error converting record to domain entity: ${error}`);
        }
    }
    // 여러 레코드를 도메인 엔티티로 변환
    async toDomainEntities(records) {
        const profiles = [];
        for (const record of records) {
            const profileResult = await this.toDomainEntity(record);
            if (profileResult.isSuccess) {
                profiles.push(profileResult.value);
            }
            // 실패한 레코드는 로그만 남기고 건너뜀 (부분 실패 허용)
            else {
                console.warn(`Failed to convert profile record ${record.id}:`, profileResult.errorValue);
            }
        }
        return profiles;
    }
}
//# sourceMappingURL=SupabaseProfileRepository.js.map