import { Entity } from '../../entities/Entity';
import { Email } from '../value-objects/Email';
import { InviteToken } from '../value-objects/InviteToken';
import { Result } from '../../common/Result';
import { UniqueEntityID } from '../../common/Identifier';
import type { UserRole } from '../types/UserRole';
export interface InviteProps {
    email: Email;
    role: UserRole;
    organizationId: string;
    classId?: string;
    token: InviteToken;
    expiresAt: Date;
    usedAt?: Date;
    createdBy: string;
    usedBy?: string;
    createdAt: Date;
}
export declare class Invite extends Entity<InviteProps> {
    private constructor();
    get email(): Email;
    get role(): UserRole;
    get organizationId(): string;
    get classId(): string | undefined;
    get token(): InviteToken;
    get expiresAt(): Date;
    get usedAt(): Date | undefined;
    get createdBy(): string;
    get usedBy(): string | undefined;
    get createdAt(): Date;
    isExpired(): boolean;
    isUsed(): boolean;
    isValid(): boolean;
    markAsUsed(userId: string): Result<void>;
    static create(props: {
        email: Email;
        role: UserRole;
        organizationId: string;
        classId?: string;
        createdBy: string;
        expiryDays?: number;
    }, id?: UniqueEntityID): Result<Invite>;
    static reconstitute(props: InviteProps, id: UniqueEntityID): Result<Invite>;
}
//# sourceMappingURL=Invite.d.ts.map