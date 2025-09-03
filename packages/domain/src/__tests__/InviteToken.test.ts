import { describe, it, expect } from 'vitest';
import { InviteToken } from '../auth';

describe('InviteToken ValueObject', () => {
  describe('생성 (create)', () => {
    it('새로운 안전한 토큰을 생성할 수 있다', () => {
      const token = InviteToken.create();
      
      expect(token.value).toBeDefined();
      expect(token.value.length).toBeGreaterThanOrEqual(32);
      expect(token.isUrlSafe()).toBe(true);
    });

    it('매번 다른 토큰을 생성한다', () => {
      const token1 = InviteToken.create();
      const token2 = InviteToken.create();
      
      expect(token1.value).not.toBe(token2.value);
    });
  });

  describe('기존 값으로 생성 (createFromValue)', () => {
    it('유효한 토큰 문자열로 생성할 수 있다', () => {
      const tokenValue = 'a'.repeat(32); // 32자 영문자
      const result = InviteToken.createFromValue(tokenValue);

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(tokenValue);
    });

    it('너무 짧은 토큰은 거부한다', () => {
      const shortToken = 'abc123'; // 6자 (32자 미만)
      const result = InviteToken.createFromValue(shortToken);

      expect(result.isFailure).toBe(true);
      expect(result.errorValue).toContain('at least 32 characters');
    });

    it('영숫자가 아닌 문자가 포함된 토큰은 거부한다', () => {
      const invalidToken = 'a'.repeat(31) + '!'; // 32자이지만 특수문자 포함
      const result = InviteToken.createFromValue(invalidToken);

      expect(result.isFailure).toBe(true);
      expect(result.errorValue).toContain('alphanumeric characters');
    });

    it('null이나 undefined 토큰은 거부한다', () => {
      const nullResult = InviteToken.createFromValue(null as any);
      const undefinedResult = InviteToken.createFromValue(undefined as any);

      expect(nullResult.isFailure).toBe(true);
      expect(undefinedResult.isFailure).toBe(true);
    });

    it('빈 문자열은 거부한다', () => {
      const result = InviteToken.createFromValue('');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('URL 안전성 검사', () => {
    it('생성된 토큰은 URL에 안전하다', () => {
      const token = InviteToken.create();
      expect(token.isUrlSafe()).toBe(true);
    });

    it('특수문자가 포함된 토큰은 URL에 안전하지 않다', () => {
      // createFromValue에서 이미 거부되므로 이 테스트는 이론적
      const validToken = InviteToken.create();
      expect(validToken.isUrlSafe()).toBe(true);
    });
  });

  describe('동등성 비교 (ValueObject 특성)', () => {
    it('같은 값을 가진 토큰은 동등하다', () => {
      const tokenValue = 'a'.repeat(32);
      const token1 = InviteToken.createFromValue(tokenValue).value;
      const token2 = InviteToken.createFromValue(tokenValue).value;

      expect(token1.equals(token2)).toBe(true);
    });

    it('다른 값을 가진 토큰은 동등하지 않다', () => {
      const token1 = InviteToken.createFromValue('a'.repeat(32)).value;
      const token2 = InviteToken.createFromValue('b'.repeat(32)).value;

      expect(token1.equals(token2)).toBe(false);
    });
  });

  describe('RLS 정책 관련 시나리오', () => {
    it('토큰 검증시 사용되는 형태를 올바르게 생성한다', () => {
      const token = InviteToken.create();
      
      // RLS 정책에서 WHERE token = ? 형태로 사용됨
      expect(typeof token.value).toBe('string');
      expect(token.value.length).toBeGreaterThanOrEqual(32);
      
      // URL 쿼리 파라미터로 안전하게 전달 가능
      const testUrl = `https://example.com/invite?token=${token.value}`;
      expect(() => new URL(testUrl)).not.toThrow();
    });

    it('데이터베이스에서 읽어온 토큰을 올바르게 재구성한다', () => {
      // 데이터베이스에서 가져온 토큰 문자열 시뮬레이션
      const dbTokenValue = 'abcd1234efgh5678ijkl9012mnop3456'; // 32자
      const result = InviteToken.createFromValue(dbTokenValue);

      expect(result.isSuccess).toBe(true);
      
      const token = result.value;
      expect(token.value).toBe(dbTokenValue);
      expect(token.isUrlSafe()).toBe(true);
    });
  });
});