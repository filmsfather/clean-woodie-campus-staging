import { ValueObject } from '../../value-objects/ValueObject';
import { Guard } from '../../common/Guard';
import { Result } from '../../common/Result';

// 초대 토큰 값 객체 - 32자리 안전한 랜덤 문자열
export interface InviteTokenProps {
  value: string;
}

export class InviteToken extends ValueObject<InviteTokenProps> {
  private constructor(props: InviteTokenProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  // 새로운 토큰 생성 (crypto.randomBytes 기반)
  public static create(): InviteToken {
    const token = this.generateSecureToken();
    return new InviteToken({ value: token });
  }

  // 기존 토큰 값으로 생성 (DB에서 읽어올 때)
  public static createFromValue(token: string): Result<InviteToken> {
    // 토큰 형식 검증
    const guardResult = Guard.againstNullOrUndefined(token, 'token');
    if (guardResult.isFailure) {
      return Result.fail<InviteToken>(guardResult.errorValue);
    }

    // 토큰 길이 검증 (보안을 위해 최소 32자)
    if (token.length < 32) {
      return Result.fail<InviteToken>('Token must be at least 32 characters long');
    }

    // 토큰 문자 검증 (영숫자만 허용)
    if (!/^[A-Za-z0-9]+$/.test(token)) {
      return Result.fail<InviteToken>('Token must contain only alphanumeric characters');
    }

    return Result.ok<InviteToken>(new InviteToken({ value: token }));
  }

  // 암호학적으로 안전한 토큰 생성
  private static generateSecureToken(): string {
    // 브라우저 환경과 Node.js 환경 모두 지원
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // 브라우저 환경
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(36)).join('').substring(0, 32);
    } else {
      // Node.js 환경에서는 crypto 모듈 사용 (런타임에서 import)
      const crypto = require('crypto');
      return crypto.randomBytes(24).toString('base64url'); // 32자리 base64url 문자열
    }
  }

  // URL 안전 여부 확인
  public isUrlSafe(): boolean {
    return /^[A-Za-z0-9_-]+$/.test(this.value);
  }
}