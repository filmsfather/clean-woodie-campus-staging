import { Entity } from '../../entities/Entity';
import { Result } from '../../common/Result';
import { Email } from '../value-objects/Email';
import { FullName } from '../value-objects/FullName';
export class Profile extends Entity {
    constructor(props, id) {
        super(props, id);
    }
    // Getters
    get fullName() {
        return this.props.fullName;
    }
    get email() {
        return this.props.email;
    }
    get role() {
        return this.props.role;
    }
    get schoolId() {
        return this.props.schoolId;
    }
    get gradeLevel() {
        return this.props.gradeLevel;
    }
    get avatarUrl() {
        return this.props.avatarUrl;
    }
    get settings() {
        return this.props.settings;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    // 비즈니스 로직 메서드
    isStudent() {
        return this.props.role === 'student';
    }
    isTeacher() {
        return this.props.role === 'teacher';
    }
    isAdmin() {
        return this.props.role === 'admin';
    }
    hasTeacherPrivileges() {
        return this.props.role === 'teacher' || this.props.role === 'admin';
    }
    // 프로필 정보 업데이트 (기존 User.updateProfile 패턴 따름)
    updateProfile(fullName, gradeLevel) {
        // 이름 업데이트
        if (fullName !== undefined) {
            const nameResult = FullName.create(fullName);
            if (nameResult.isFailure) {
                return Result.fail(nameResult.error);
            }
            this.props.fullName = nameResult.value;
        }
        // 학년 업데이트 (학생만 가능)
        if (gradeLevel !== undefined) {
            if (!this.isStudent()) {
                return Result.fail('Only students can have grade level');
            }
            if (gradeLevel < 1 || gradeLevel > 12) {
                return Result.fail('Grade level must be between 1 and 12');
            }
            this.props.gradeLevel = gradeLevel;
        }
        this.props.updatedAt = new Date();
        return Result.ok();
    }
    // 아바타 URL 업데이트
    updateAvatar(avatarUrl) {
        if (avatarUrl && avatarUrl.trim()) {
            try {
                new URL(avatarUrl);
            }
            catch {
                return Result.fail('Invalid avatar URL format');
            }
            this.props.avatarUrl = avatarUrl.trim();
        }
        else {
            this.props.avatarUrl = undefined;
        }
        this.props.updatedAt = new Date();
        return Result.ok();
    }
    // 설정 업데이트
    updateSettings(settings) {
        this.props.settings = {
            ...this.props.settings,
            ...settings
        };
        this.props.updatedAt = new Date();
        return Result.ok();
    }
    // 역할 변경 (관리자만 가능 - 비즈니스 로직은 Application 레이어에서 체크)
    changeRole(newRole) {
        // 역할 변경시 학년 정보 정리
        if (newRole !== 'student') {
            this.props.gradeLevel = undefined;
        }
        this.props.role = newRole;
        this.props.updatedAt = new Date();
        return Result.ok();
    }
    // 팩토리 메서드 - 새 프로필 생성 (기존 User.create 패턴 따름)
    static create(props, id) {
        // Email 값 객체 생성
        const emailResult = Email.create(props.email);
        if (emailResult.isFailure) {
            return Result.fail(emailResult.error);
        }
        // FullName 값 객체 생성
        const nameResult = FullName.create(props.fullName);
        if (nameResult.isFailure) {
            return Result.fail(nameResult.error);
        }
        // 학년 검증
        if (props.role !== 'student' && props.gradeLevel !== undefined) {
            return Result.fail('Only students can have grade level');
        }
        if (props.gradeLevel !== undefined && (props.gradeLevel < 1 || props.gradeLevel > 12)) {
            return Result.fail('Grade level must be between 1 and 12');
        }
        const now = new Date();
        const profile = new Profile({
            fullName: nameResult.value,
            email: emailResult.value,
            role: props.role,
            schoolId: props.schoolId,
            gradeLevel: props.gradeLevel,
            settings: {
                theme: 'auto',
                language: 'ko',
                notifications: {
                    email: true,
                    push: true,
                    sms: false
                },
                privacy: {
                    showEmail: false,
                    showActivity: true
                }
            },
            createdAt: now,
            updatedAt: now
        }, id);
        return Result.ok(profile);
    }
    // 표시용 정보 생성
    getDisplayInfo() {
        return {
            id: this.id.toString(),
            name: this.fullName.getDisplayName(),
            initials: this.fullName.getInitials(),
            email: this.email.value,
            role: this.role,
            gradeLevel: this.gradeLevel,
            avatarUrl: this.avatarUrl,
            hasAvatar: !!this.avatarUrl
        };
    }
}
//# sourceMappingURL=Profile.js.map