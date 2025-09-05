import { Entity } from '../../entities/Entity';
import { Result } from '../../common/Result';
import { Email } from '../value-objects/Email';
import { FullName } from '../value-objects/FullName';
import { UniqueEntityID } from '../../common/Identifier';
import type { UserRole } from '../types/UserRole';
export interface ProfileSettings {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    notifications?: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
    privacy?: {
        showEmail: boolean;
        showActivity: boolean;
    };
}
interface ProfileProps {
    fullName: FullName;
    email: Email;
    role: UserRole;
    schoolId?: string;
    gradeLevel?: number;
    avatarUrl?: string;
    settings: ProfileSettings;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Profile extends Entity<ProfileProps> {
    private constructor();
    get fullName(): FullName;
    get email(): Email;
    get role(): UserRole;
    get schoolId(): string | undefined;
    get gradeLevel(): number | undefined;
    get avatarUrl(): string | undefined;
    get settings(): ProfileSettings;
    get createdAt(): Date;
    get updatedAt(): Date;
    isStudent(): boolean;
    isTeacher(): boolean;
    isAdmin(): boolean;
    hasTeacherPrivileges(): boolean;
    updateProfile(fullName?: string, gradeLevel?: number): Result<void>;
    updateAvatar(avatarUrl?: string): Result<void>;
    updateSettings(settings: Partial<ProfileSettings>): Result<void>;
    changeRole(newRole: UserRole): Result<void>;
    static create(props: {
        email: string;
        fullName: string;
        role: UserRole;
        schoolId?: string;
        gradeLevel?: number;
    }, id?: UniqueEntityID): Result<Profile>;
    getDisplayInfo(): {
        id: string;
        name: string;
        initials: string;
        email: string;
        role: UserRole;
        gradeLevel: number | undefined;
        avatarUrl: string | undefined;
        hasAvatar: boolean;
    };
}
export {};
//# sourceMappingURL=Profile.d.ts.map