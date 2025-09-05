import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  IUserRepository, 
  User, 
  Email,
  UserRole,
  Result,
  UniqueEntityID 
} from '@woodie/domain';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  class_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SupabaseUserRepository implements IUserRepository {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async save(user: User): Promise<Result<User>> {
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
        return Result.fail<User>('Unable to save user profile.');
      }

      return Result.ok<User>(user);
    } catch (error) {
      console.error('Save user error:', error);
      return Result.fail<User>('Unable to save user profile.');
    }
  }

  async findById(id: UniqueEntityID): Promise<User | null> {
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
    } catch (error) {
      console.error('Find user by id error:', error);
      return null;
    }
  }

  async findByEmail(email: Email): Promise<User | null> {
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
    } catch (error) {
      console.error('Find user by email error:', error);
      return null;
    }
  }

  async findByInviteToken(token: string): Promise<User | null> {
    try {
      // 초대 토큰을 통해 해당 이메일을 찾고, 그 이메일로 사용자를 조회
      const { data: inviteData, error: inviteError } = await this.supabase
        .from('invites')
        .select('email')
        .eq('token', token)
        .eq('is_used', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (inviteError || !inviteData) {
        return null;
      }

      // 해당 이메일로 사용자 조회
      const emailResult = Email.create(inviteData.email);
      if (emailResult.isFailure) {
        return null;
      }

      return await this.findByEmail(emailResult.value);
    } catch (error) {
      console.error('Find user by invite token error:', error);
      return null;
    }
  }

  async delete(id: UniqueEntityID): Promise<Result<void>> {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .delete()
        .eq('id', id.toString());

      if (error) {
        console.error('Delete user error:', error);
        return Result.fail<void>('Unable to delete user.');
      }

      return Result.ok<void>();
    } catch (error) {
      console.error('Delete user error:', error);
      return Result.fail<void>('Unable to delete user.');
    }
  }

  private mapRowToUser(row: UserRow): User | null {
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