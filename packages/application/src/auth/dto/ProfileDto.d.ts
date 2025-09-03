export interface CreateProfileDto {
    userId: string;
    email: string;
    fullName: string;
    role: 'student' | 'teacher' | 'admin';
    schoolId?: string;
    gradeLevel?: number;
}
export interface UpdateProfileDto {
    userId: string;
    fullName?: string;
    gradeLevel?: number;
    avatarUrl?: string;
    settings?: {
        theme?: 'light' | 'dark' | 'auto';
        language?: string;
        notifications?: {
            email?: boolean;
            push?: boolean;
            sms?: boolean;
        };
        privacy?: {
            showEmail?: boolean;
            showActivity?: boolean;
        };
    };
}
export interface ProfileDto {
    id: string;
    email: string;
    fullName: string;
    displayName: string;
    initials: string;
    role: string;
    schoolId?: string;
    gradeLevel?: number;
    avatarUrl?: string;
    hasAvatar: boolean;
    settings: {
        theme: string;
        language: string;
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
        };
        privacy: {
            showEmail: boolean;
            showActivity: boolean;
        };
    };
    createdAt: string;
    updatedAt: string;
}
export interface GetProfileDto {
    userId: string;
}
export interface ListProfilesDto {
    schoolId?: string;
    role?: 'student' | 'teacher' | 'admin';
    gradeLevel?: number;
    page?: number;
    limit?: number;
}
export interface ProfileListDto {
    profiles: ProfileDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export interface ChangeRoleDto {
    userId: string;
    targetUserId: string;
    newRole: 'student' | 'teacher' | 'admin';
}
//# sourceMappingURL=ProfileDto.d.ts.map