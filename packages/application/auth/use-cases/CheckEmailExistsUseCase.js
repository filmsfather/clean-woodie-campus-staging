import { Email, Result } from '@woodie/domain';
export class CheckEmailExistsUseCase {
    profileRepository;
    constructor(profileRepository) {
        this.profileRepository = profileRepository;
    }
    async execute(dto) {
        try {
            const { email } = dto;
            // Email 값 객체 생성
            const emailResult = Email.create(email);
            if (emailResult.isFailure) {
                return Result.fail('Invalid email format');
            }
            // 이메일 존재 확인
            const existsResult = await this.profileRepository.existsByEmail(emailResult.value);
            if (existsResult.isFailure) {
                return Result.fail(existsResult.errorValue);
            }
            return Result.ok(existsResult.value);
        }
        catch (error) {
            console.error('Check email exists error:', error);
            return Result.fail('Failed to check email existence');
        }
    }
}
//# sourceMappingURL=CheckEmailExistsUseCase.js.map