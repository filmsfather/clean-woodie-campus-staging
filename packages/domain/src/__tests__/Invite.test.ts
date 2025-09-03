import { describe, it, expect, beforeEach } from 'vitest';
import { Invite, Email, InviteToken } from '../auth';
import { Identifier } from '../common/Identifier';

describe('Invite Entity', () => {
  let validEmail: Email;
  let validToken: InviteToken;

  beforeEach(() => {
    const emailResult = Email.create('test@example.com');
    const tokenResult = InviteToken.createFromValue('a'.repeat(32)); // 32자 토큰
    
    expect(emailResult.isSuccess).toBe(true);
    expect(tokenResult.isSuccess).toBe(true);
    
    validEmail = emailResult.value;
    validToken = tokenResult.value;
  });

  describe('생성 (Create)', () => {
    it('유효한 학생 초대를 생성할 수 있다', () => {
      const result = Invite.create({
        email: validEmail,
        role: 'student',
        organizationId: 'org-123',
        classId: 'class-456',
        createdBy: 'admin-789'
      });

      expect(result.isSuccess).toBe(true);
      
      const invite = result.value;
      expect(invite.email.value).toBe('test@example.com');
      expect(invite.role).toBe('student');
      expect(invite.organizationId).toBe('org-123');
      expect(invite.classId).toBe('class-456');
      expect(invite.isValid()).toBe(true);
      expect(invite.isExpired()).toBe(false);
      expect(invite.isUsed()).toBe(false);
    });

    it('유효한 교사 초대를 생성할 수 있다 (클래스 ID 없음)', () => {
      const result = Invite.create({
        email: validEmail,
        role: 'teacher',
        organizationId: 'org-123',
        createdBy: 'admin-789'
      });

      expect(result.isSuccess).toBe(true);
      
      const invite = result.value;
      expect(invite.role).toBe('teacher');
      expect(invite.classId).toBeUndefined();
    });

    it('학생 초대시 클래스 ID가 없으면 실패한다', () => {
      const result = Invite.create({
        email: validEmail,
        role: 'student',
        organizationId: 'org-123',
        createdBy: 'admin-789'
        // classId 누락
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue).toContain('Student invites must specify a class');
    });

    it('교사 초대시 클래스 ID가 있으면 실패한다', () => {
      const result = Invite.create({
        email: validEmail,
        role: 'teacher',
        organizationId: 'org-123',
        classId: 'class-456', // 교사는 클래스 지정 불가
        createdBy: 'admin-789'
      });

      expect(result.isFailure).toBe(true);
      expect(result.errorValue).toContain('Teacher and Admin invites cannot specify a class');
    });
  });

  describe('토큰 사용 (markAsUsed)', () => {
    let invite: Invite;

    beforeEach(() => {
      const result = Invite.create({
        email: validEmail,
        role: 'student',
        organizationId: 'org-123',
        classId: 'class-456',
        createdBy: 'admin-789'
      });
      invite = result.value;
    });

    it('유효한 토큰을 사용할 수 있다', () => {
      const userId = 'user-123';
      const result = invite.markAsUsed(userId);

      expect(result.isSuccess).toBe(true);
      expect(invite.isUsed()).toBe(true);
      expect(invite.usedBy).toBe(userId);
      expect(invite.usedAt).toBeInstanceOf(Date);
      expect(invite.isValid()).toBe(false); // 사용된 토큰은 무효
    });

    it('이미 사용된 토큰은 재사용할 수 없다', () => {
      // 먼저 토큰 사용
      invite.markAsUsed('user-123');

      // 다시 사용 시도
      const result = invite.markAsUsed('user-456');

      expect(result.isFailure).toBe(true);
      expect(result.errorValue).toBe('Token has already been used');
    });
  });

  describe('RLS 정책 시나리오 테스트', () => {
    it('관리자는 모든 초대를 생성할 수 있다', () => {
      // Admin 초대
      const adminInvite = Invite.create({
        email: validEmail,
        role: 'admin',
        organizationId: 'org-123',
        createdBy: 'super-admin-789'
      });

      expect(adminInvite.isSuccess).toBe(true);
      expect(adminInvite.value.role).toBe('admin');
    });

    it('초대된 사용자만 해당 토큰을 사용할 수 있다', () => {
      const invite = Invite.create({
        email: validEmail,
        role: 'student',
        organizationId: 'org-123',
        classId: 'class-456',
        createdBy: 'admin-789'
      }).value;

      // 올바른 사용자가 토큰 사용
      const correctResult = invite.markAsUsed('invited-user-123');
      expect(correctResult.isSuccess).toBe(true);
    });

    it('토큰 검증은 만료와 사용 여부를 확인한다', () => {
      // 유효한 토큰
      const validInvite = Invite.create({
        email: validEmail,
        role: 'student',
        organizationId: 'org-123',
        classId: 'class-456',
        createdBy: 'admin-789',
        expiryDays: 7
      }).value;

      expect(validInvite.isValid()).toBe(true);

      // 만료된 토큰
      const expiredInvite = Invite.create({
        email: validEmail,
        role: 'student',
        organizationId: 'org-123',
        classId: 'class-456',
        createdBy: 'admin-789',
        expiryDays: -1 // 어제 만료
      }).value;

      expect(expiredInvite.isValid()).toBe(false);
      expect(expiredInvite.isExpired()).toBe(true);
    });
  });
});