import { Entity } from '../../entities/Entity';
import { InviteToken } from '../value-objects/InviteToken';
import { Guard } from '../../common/Guard';
import { Result } from '../../common/Result';
export class Invite extends Entity {
    constructor(props, id) {
        super(props, id);
    }
    // Getters
    get email() {
        return this.props.email;
    }
    get role() {
        return this.props.role;
    }
    get organizationId() {
        return this.props.organizationId;
    }
    get classId() {
        return this.props.classId;
    }
    get token() {
        return this.props.token;
    }
    get expiresAt() {
        return this.props.expiresAt;
    }
    get usedAt() {
        return this.props.usedAt;
    }
    get createdBy() {
        return this.props.createdBy;
    }
    get usedBy() {
        return this.props.usedBy;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    // 비즈니스 로직
    isExpired() {
        return new Date() > this.props.expiresAt;
    }
    isUsed() {
        return this.props.usedAt !== undefined;
    }
    isValid() {
        return !this.isExpired() && !this.isUsed();
    }
    // 토큰 사용 처리
    markAsUsed(userId) {
        // 이미 사용된 토큰 검증
        if (this.isUsed()) {
            return Result.fail('Token has already been used');
        }
        // 만료된 토큰 검증
        if (this.isExpired()) {
            return Result.fail('Token has expired');
        }
        // 사용자 ID 검증
        const guardResult = Guard.againstNullOrUndefined(userId, 'userId');
        if (guardResult.isFailure) {
            return Result.fail(guardResult.errorValue);
        }
        // 토큰 사용 처리
        this.props.usedAt = new Date();
        this.props.usedBy = userId;
        return Result.ok();
    }
    // 팩토리 메서드 - 새 초대 생성
    static create(props, id) {
        // 입력값 검증
        const guardResults = Guard.combine([
            Guard.againstNullOrUndefined(props.email, 'email'),
            Guard.againstNullOrUndefined(props.role, 'role'),
            Guard.againstNullOrUndefined(props.organizationId, 'organizationId'),
            Guard.againstNullOrUndefined(props.createdBy, 'createdBy'),
        ]);
        if (guardResults.isFailure) {
            return Result.fail(guardResults.errorValue);
        }
        // 역할별 클래스 ID 검증
        if (props.role === 'student' && !props.classId) {
            return Result.fail('Student invites must specify a class');
        }
        if ((props.role === 'teacher' || props.role === 'admin') && props.classId) {
            return Result.fail('Teacher and Admin invites cannot specify a class');
        }
        // 만료일 계산 (기본 7일)
        const expiryDays = props.expiryDays || 7;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);
        const inviteProps = {
            email: props.email,
            role: props.role,
            organizationId: props.organizationId,
            classId: props.classId,
            token: InviteToken.create(),
            expiresAt,
            createdBy: props.createdBy,
            createdAt: new Date(),
        };
        return Result.ok(new Invite(inviteProps, id));
    }
    // 팩토리 메서드 - 기존 초대 재구성 (DB에서 읽어올 때)
    static reconstitute(props, id) {
        const guardResults = Guard.combine([
            Guard.againstNullOrUndefined(props.email, 'email'),
            Guard.againstNullOrUndefined(props.role, 'role'),
            Guard.againstNullOrUndefined(props.token, 'token'),
            Guard.againstNullOrUndefined(props.expiresAt, 'expiresAt'),
        ]);
        if (guardResults.isFailure) {
            return Result.fail(guardResults.errorValue);
        }
        return Result.ok(new Invite(props, id));
    }
}
//# sourceMappingURL=Invite.js.map