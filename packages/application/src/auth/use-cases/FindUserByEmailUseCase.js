import { Email, Result } from '@woodie/domain';
export class FindUserByEmailUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(dto) {
        try {
            const { email } = dto;
            // Email 값 객체 생성
            const emailResult = Email.create(email);
            if (emailResult.isFailure) {
                return Result.fail('Invalid email format');
            }
            // 사용자 조회
            const user = await this.userRepository.findByEmail(emailResult.value);
            return Result.ok(user);
        }
        catch (error) {
            console.error('Find user by email error:', error);
            return Result.fail('Failed to find user by email');
        }
    }
}
//# sourceMappingURL=FindUserByEmailUseCase.js.map