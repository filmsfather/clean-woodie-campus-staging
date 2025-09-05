import { Entity } from '../../entities/Entity';
import { Result } from '../../common/Result';
import { Email } from '../value-objects/Email';
import { UniqueEntityID } from '../../common/Identifier';
import type { UserRole } from '../types/UserRole';
interface UserProps {
    email: Email;
    name: string;
    role: UserRole;
    classId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class User extends Entity<UserProps> {
    private constructor();
    get email(): Email;
    get name(): string;
    get role(): UserRole;
    get classId(): string | undefined;
    get isActive(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    static create(props: {
        email: string;
        name: string;
        role: UserRole;
        classId?: string;
        isActive?: boolean;
    }, id?: UniqueEntityID): Result<User>;
    updateProfile(name?: string, classId?: string): Result<void>;
    deactivate(): void;
    activate(): void;
}
export {};
//# sourceMappingURL=User.d.ts.map