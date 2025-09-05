export interface CreateInviteDto {
    email: string;
    role: 'student' | 'teacher' | 'admin';
    organizationId: string;
    classId?: string;
    createdBy: string;
    expiryDays?: number;
}
export interface InviteDto {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    classId?: string;
    token: string;
    expiresAt: string;
    usedAt?: string;
    createdBy: string;
    usedBy?: string;
    createdAt: string;
    isExpired: boolean;
    isUsed: boolean;
    isValid: boolean;
}
export interface ValidateInviteTokenDto {
    token: string;
}
export interface InviteTokenValidationDto {
    isValid: boolean;
    invite?: InviteDto;
    errorMessage?: string;
}
export interface UseInviteTokenDto {
    token: string;
    userId: string;
}
//# sourceMappingURL=InviteDto.d.ts.map