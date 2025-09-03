import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IInviteRepository, InviteFilters, Invite, InviteToken, Email, Result, UniqueEntityID } from '@woodie/domain';

// 데이터베이스 레코드 타입
interface InviteRecord {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  organization_id: string;
  class_id?: string;
  token: string;
  expires_at: string;
  used_at?: string;
  created_by: string;
  used_by?: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseInviteRepository implements IInviteRepository {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async save(invite: Invite): Promise<Result<Invite>> {
    try {
      const record: Partial<InviteRecord> = {
        id: invite.id.toString(),
        email: invite.email.value,
        role: invite.role,
        organization_id: invite.organizationId,
        class_id: invite.classId,
        token: invite.token.value,
        expires_at: invite.expiresAt.toISOString(),
        used_at: invite.usedAt?.toISOString(),
        created_by: invite.createdBy,
        used_by: invite.usedBy,
        created_at: invite.createdAt.toISOString()
      };

      // Upsert 방식으로 저장 (ID가 있으면 업데이트, 없으면 생성)
      const { data, error } = await this.supabase
        .from('invite_tokens')
        .upsert(record, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        return Result.fail<Invite>(`Failed to save invite: ${error.message}`);
      }

      // 저장된 데이터를 도메인 엔티티로 재구성
      const reconstitutedResult = await this.toDomainEntity(data as InviteRecord);
      if (reconstitutedResult.isFailure) {
        return Result.fail<Invite>(`Failed to reconstitute saved invite: ${reconstitutedResult.errorValue}`);
      }

      return Result.ok<Invite>(reconstitutedResult.value);

    } catch (error) {
      return Result.fail<Invite>(`Database error saving invite: ${error}`);
    }
  }

  async findById(id: UniqueEntityID): Promise<Result<Invite | null>> {
    try {
      const { data, error } = await this.supabase
        .from('invite_tokens')
        .select('*')
        .eq('id', id.toString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return Result.ok<Invite | null>(null);
        }
        return Result.fail<Invite | null>(`Failed to find invite by id: ${error.message}`);
      }

      const inviteResult = await this.toDomainEntity(data as InviteRecord);
      if (inviteResult.isFailure) {
        return Result.fail<Invite | null>(`Failed to reconstitute invite: ${inviteResult.errorValue}`);
      }

      return Result.ok<Invite | null>(inviteResult.value);

    } catch (error) {
      return Result.fail<Invite | null>(`Database error finding invite by id: ${error}`);
    }
  }

  async delete(id: UniqueEntityID): Promise<Result<void>> {
    try {
      const { error } = await this.supabase
        .from('invite_tokens')
        .delete()
        .eq('id', id.toString());

      if (error) {
        return Result.fail<void>(`Failed to delete invite: ${error.message}`);
      }

      return Result.ok<void>();

    } catch (error) {
      return Result.fail<void>(`Database error deleting invite: ${error}`);
    }
  }

  async findByToken(token: InviteToken): Promise<Result<Invite | null>> {
    try {
      const { data, error } = await this.supabase
        .from('invite_tokens')
        .select('*')
        .eq('token', token.value)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return Result.ok<Invite | null>(null);
        }
        return Result.fail<Invite | null>(`Failed to find invite by token: ${error.message}`);
      }

      const inviteResult = await this.toDomainEntity(data as InviteRecord);
      if (inviteResult.isFailure) {
        return Result.fail<Invite | null>(`Failed to reconstitute invite: ${inviteResult.errorValue}`);
      }

      return Result.ok<Invite | null>(inviteResult.value);

    } catch (error) {
      return Result.fail<Invite | null>(`Database error finding invite by token: ${error}`);
    }
  }

  async findByEmail(email: Email): Promise<Result<Invite[]>> {
    try {
      const { data, error } = await this.supabase
        .from('invite_tokens')
        .select('*')
        .eq('email', email.value)
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail<Invite[]>(`Failed to find invites by email: ${error.message}`);
      }

      const invites = await this.toDomainEntities(data as InviteRecord[]);
      return Result.ok<Invite[]>(invites);

    } catch (error) {
      return Result.fail<Invite[]>(`Database error finding invites by email: ${error}`);
    }
  }

  async findPendingInvitesByEmail(email: Email): Promise<Result<Invite[]>> {
    try {
      const { data, error } = await this.supabase
        .from('invite_tokens')
        .select('*')
        .eq('email', email.value)
        .is('used_at', null) // 사용되지 않은 토큰
        .gt('expires_at', new Date().toISOString()) // 만료되지 않은 토큰
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail<Invite[]>(`Failed to find pending invites: ${error.message}`);
      }

      const invites = await this.toDomainEntities(data as InviteRecord[]);
      return Result.ok<Invite[]>(invites);

    } catch (error) {
      return Result.fail<Invite[]>(`Database error finding pending invites: ${error}`);
    }
  }

  async findByCreator(creatorId: string): Promise<Result<Invite[]>> {
    try {
      const { data, error } = await this.supabase
        .from('invite_tokens')
        .select('*')
        .eq('created_by', creatorId)
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail<Invite[]>(`Failed to find invites by creator: ${error.message}`);
      }

      const invites = await this.toDomainEntities(data as InviteRecord[]);
      return Result.ok<Invite[]>(invites);

    } catch (error) {
      return Result.fail<Invite[]>(`Database error finding invites by creator: ${error}`);
    }
  }

  async findByOrganization(organizationId: string, filters?: InviteFilters): Promise<Result<Invite[]>> {
    try {
      let query = this.supabase
        .from('invite_tokens')
        .select('*')
        .eq('organization_id', organizationId);

      // 필터 적용
      if (filters) {
        if (filters.createdBy) {
          query = query.eq('created_by', filters.createdBy);
        }
        if (filters.role) {
          query = query.eq('role', filters.role);
        }
        if (filters.isUsed !== undefined) {
          if (filters.isUsed) {
            query = query.not('used_at', 'is', null);
          } else {
            query = query.is('used_at', null);
          }
        }
        if (filters.isExpired !== undefined) {
          const now = new Date().toISOString();
          if (filters.isExpired) {
            query = query.lt('expires_at', now);
          } else {
            query = query.gt('expires_at', now);
          }
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return Result.fail<Invite[]>(`Failed to find invites by organization: ${error.message}`);
      }

      const invites = await this.toDomainEntities(data as InviteRecord[]);
      return Result.ok<Invite[]>(invites);

    } catch (error) {
      return Result.fail<Invite[]>(`Database error finding invites by organization: ${error}`);
    }
  }

  async markTokenAsUsed(token: InviteToken, userId: string): Promise<Result<Invite>> {
    try {
      // 먼저 토큰으로 초대를 찾음
      const findResult = await this.findByToken(token);
      if (findResult.isFailure) {
        return Result.fail<Invite>(`Failed to find token: ${findResult.errorValue}`);
      }

      const invite = findResult.value;
      if (!invite) {
        return Result.fail<Invite>('Token not found');
      }

      // 도메인 로직으로 토큰 사용 처리
      const markUsedResult = invite.markAsUsed(userId);
      if (markUsedResult.isFailure) {
        return Result.fail<Invite>(`Failed to mark token as used: ${markUsedResult.errorValue}`);
      }

      // 데이터베이스 업데이트
      return await this.save(invite);

    } catch (error) {
      return Result.fail<Invite>(`Database error marking token as used: ${error}`);
    }
  }

  async deleteExpiredTokens(olderThanDays: number = 30): Promise<Result<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { error, count } = await this.supabase
        .from('invite_tokens')
        .delete({ count: 'exact' })
        .lt('expires_at', cutoffDate.toISOString());

      if (error) {
        return Result.fail<number>(`Failed to delete expired tokens: ${error.message}`);
      }

      return Result.ok<number>(count || 0);

    } catch (error) {
      return Result.fail<number>(`Database error deleting expired tokens: ${error}`);
    }
  }

  async hasActivePendingInvite(email: Email, organizationId: string): Promise<Result<boolean>> {
    try {
      const { data, error } = await this.supabase
        .from('invite_tokens')
        .select('id')
        .eq('email', email.value)
        .eq('organization_id', organizationId)
        .is('used_at', null) // 사용되지 않은 토큰
        .gt('expires_at', new Date().toISOString()) // 만료되지 않은 토큰
        .limit(1);

      if (error) {
        return Result.fail<boolean>(`Failed to check for active invite: ${error.message}`);
      }

      return Result.ok<boolean>(data.length > 0);

    } catch (error) {
      return Result.fail<boolean>(`Database error checking for active invite: ${error}`);
    }
  }

  // 도메인 엔티티로 변환하는 헬퍼 메서드
  private async toDomainEntity(record: InviteRecord): Promise<Result<Invite>> {
    try {
      // Email 값 객체 생성
      const emailResult = Email.create(record.email);
      if (emailResult.isFailure) {
        return Result.fail<Invite>(`Invalid email in record: ${emailResult.errorValue}`);
      }

      // InviteToken 값 객체 생성
      const tokenResult = InviteToken.createFromValue(record.token);
      if (tokenResult.isFailure) {
        return Result.fail<Invite>(`Invalid token in record: ${tokenResult.errorValue}`);
      }

      // Invite 엔티티 재구성
      const inviteResult = Invite.reconstitute(
        {
          email: emailResult.value,
          role: record.role,
          organizationId: record.organization_id,
          classId: record.class_id,
          token: tokenResult.value,
          expiresAt: new Date(record.expires_at),
          usedAt: record.used_at ? new Date(record.used_at) : undefined,
          createdBy: record.created_by,
          usedBy: record.used_by,
          createdAt: new Date(record.created_at)
        },
        new UniqueEntityID(record.id)
      );

      return inviteResult;

    } catch (error) {
      return Result.fail<Invite>(`Error converting record to domain entity: ${error}`);
    }
  }

  // 여러 레코드를 도메인 엔티티로 변환
  private async toDomainEntities(records: InviteRecord[]): Promise<Invite[]> {
    const invites: Invite[] = [];
    
    for (const record of records) {
      const inviteResult = await this.toDomainEntity(record);
      if (inviteResult.isSuccess) {
        invites.push(inviteResult.value);
      }
      // 실패한 레코드는 로그만 남기고 건너뜀 (부분 실패 허용)
      else {
        console.warn(`Failed to convert invite record ${record.id}:`, inviteResult.errorValue);
      }
    }

    return invites;
  }
}