import { createClient } from '@supabase/supabase-js';
import { User, Result, UniqueEntityID } from '@woodie/domain';
export class SupabaseUserRepository {
    supabase;
    constructor(supabaseUrl, supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    async save(user) {
        try {
            const userData = {
                id: user.id.toString(),
                email: user.email.value,
                name: user.name,
                role: user.role,
                class_id: user.classId,
                is_active: user.isActive,
                created_at: user.createdAt.toISOString(),
                updated_at: user.updatedAt.toISOString()
            };
            const { error } = await this.supabase
                .from('profiles')
                .upsert(userData);
            if (error) {
                console.error('Save user error:', error);
                return Result.fail('Unable to save user profile.');
            }
            return Result.ok(user);
        }
        catch (error) {
            console.error('Save user error:', error);
            return Result.fail('Unable to save user profile.');
        }
    }
    async findById(id) {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', id.toString())
                .single();
            if (error || !data) {
                return null;
            }
            return this.mapRowToUser(data);
        }
        catch (error) {
            console.error('Find user by id error:', error);
            return null;
        }
    }
    async findByEmail(email) {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('email', email.value)
                .single();
            if (error || !data) {
                return null;
            }
            return this.mapRowToUser(data);
        }
        catch (error) {
            console.error('Find user by email error:', error);
            return null;
        }
    }
    async findByInviteToken(token) {
        // TODO: Implement when invite system is ready
        console.warn('findByInviteToken not implemented yet');
        return null;
    }
    async delete(id) {
        try {
            const { error } = await this.supabase
                .from('profiles')
                .delete()
                .eq('id', id.toString());
            if (error) {
                console.error('Delete user error:', error);
                return Result.fail('Unable to delete user.');
            }
            return Result.ok();
        }
        catch (error) {
            console.error('Delete user error:', error);
            return Result.fail('Unable to delete user.');
        }
    }
    mapRowToUser(row) {
        const userResult = User.create({
            email: row.email,
            name: row.name,
            role: row.role,
            classId: row.class_id,
            isActive: row.is_active
        }, new UniqueEntityID(row.id));
        if (userResult.isFailure) {
            console.error('Failed to create user from row:', userResult.error);
            return null;
        }
        return userResult.value;
    }
}
//# sourceMappingURL=SupabaseUserRepository.js.map